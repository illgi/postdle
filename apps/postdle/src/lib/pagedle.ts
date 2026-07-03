// api.pagedle.com 연동 — 회원(가입/로그인/me)과 콘텐츠(페이지, category=postdle)를 공유 백엔드로 처리.
// pagedle 프론트의 request/apiList.ts · apiType.ts 를 참조해 엔드포인트/타입을 맞춤.
import { HttpError } from './http';
import { POSTDLE_CATEGORY } from './config';

const BASE = process.env.PAGEDLE_API || 'https://api.pagedle.com/api/v1';

export type Member = { id: number | string; name: string | null; userId: string };

export type Page = {
  id: string;
  content: string;
  type: 'MARKDOWN' | 'HTML';
  pageName?: string;
  upperPageId?: string;
  category?: string;
  memberId: string;
  createTime: string;
  updateTime: string;
  published?: boolean;
  completeness?: number | string;
};

export type SubPage = {
  id: string;
  pageName: string;
  category?: string;
  createTime: string;
  totalViewCount: number;
  bookmarkCount: number;
  published?: boolean;
  completeness?: number;
};

function unwrap<T = any>(j: any): T | null {
  const r = j && j.result;
  return (Array.isArray(r) ? r[0] : r) ?? null;
}
function unwrapList<T = any>(j: any): T[] {
  const r = j && j.result;
  if (Array.isArray(r)) return r as T[];
  return r ? [r as T] : [];
}

async function req(path: string, init: RequestInit & { token?: string } = {}) {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      'content-type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    cache: 'no-store',
  });
  const j = await res.json().catch(() => ({}));
  return { res, j };
}

/** 이미지 업로드 — pagedle /file/uploads (멀티파트). 반환: 접근 가능한 이미지 URL. */
export async function pdUploadImage(token: string, file: File): Promise<string> {
  const origin = BASE.replace(/\/api\/v1\/?$/, '');
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${origin}/file/uploads?type=IMAGE`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    cache: 'no-store',
  });
  if (!res.ok) throw new HttpError('이미지 업로드에 실패했어요', res.status);
  const text = await res.text();
  try {
    const jj = JSON.parse(text);
    if (typeof jj === 'string') return jj;
    if (Array.isArray(jj)) return String(jj[0] ?? '');
    if (jj && jj.result) return Array.isArray(jj.result) ? String(jj.result[0]) : String(jj.result);
    if (jj && jj.url) return String(jj.url);
  } catch {
    /* 평문 URL */
  }
  return text.replace(/^"|"$/g, '');
}

// ===== 회원 (pagedle 계정 공유) =====

export async function pdSignup(userId: string, userPw: string) {
  const { res, j } = await req('/members', { method: 'POST', body: JSON.stringify({ userId, userPw }) });
  const row = unwrap(j);
  if (!res.ok || !row || !row.jwtAuthToken) {
    throw new HttpError((j && j.message) || '가입에 실패했어요 (이미 가입된 이메일일 수 있어요)');
  }
  return { member: (row.member || row) as Member, token: row.jwtAuthToken as string };
}

export async function pdLogin(userId: string, userPw: string) {
  const { res, j } = await req('/members/authorize', { method: 'POST', body: JSON.stringify({ userId, userPw }) });
  const row = unwrap(j);
  if (!res.ok || !row || !row.jwtAuthToken) {
    throw new HttpError((j && j.message) || '이메일 또는 비밀번호가 올바르지 않아요', 401);
  }
  return { member: (row.member || row) as Member, token: row.jwtAuthToken as string };
}

export async function pdMe(token: string): Promise<Member | null> {
  try {
    const { res, j } = await req('/members/me', { token });
    if (!res.ok) return null;
    const row = unwrap(j);
    if (!row) return null;
    return (row.member || row) as Member;
  } catch {
    return null;
  }
}

/** 유저명 사용 가능 여부 검증 (pagedle 공유). true=사용 가능. */
export async function pdValidateName(userName: string): Promise<boolean> {
  const { res, j } = await req('/members/user-name-validation', {
    method: 'POST',
    body: JSON.stringify({ userName }),
  });
  if (!res.ok) return false;
  return unwrap<boolean>(j) === true;
}

/**
 * 온보딩: 유저명(공유 member.name) 설정. memberId 는 토큰에서 읽으므로 body 는 {userName} 만.
 * pagedle 과 동일한 계정이라 여기서 정하면 pagedle 에도 그대로 반영된다.
 */
export async function pdUpdateName(token: string, userName: string) {
  const { res, j } = await req('/members/update-user-name', {
    method: 'PUT',
    token,
    body: JSON.stringify({ userName }),
  });
  if (!res.ok) throw new HttpError((j && j.message) || '이름 설정에 실패했어요');
  return true;
}

// ===== 콘텐츠 (페이지, category=postdle 전용) =====

/** 내 페이지 전체 (로그인 필요) */
export async function pdMyList(token: string): Promise<Page[]> {
  const { res, j } = await req('/pages/my-list', { token });
  if (!res.ok) return [];
  return unwrapList<Page>(j);
}

/**
 * 사용자의 메인(최상위) 페이지 id 확보. 없으면 하나 생성.
 * postdle 글은 이 메인 페이지 아래 "하위 페이지"로 달려야 프로필/목록에 노출된다.
 */
export async function pdEnsureMainPage(token: string): Promise<string> {
  const list = await pdMyList(token);
  const main = list.find((p) => !p.upperPageId);
  if (main) return main.id;
  const { res, j } = await req('/pages', {
    method: 'POST',
    token,
    body: JSON.stringify({ content: '', type: 'MARKDOWN', pageName: 'home', category: POSTDLE_CATEGORY }),
  });
  const row = unwrap<Page>(j);
  if (!res.ok || !row) throw new HttpError((j && j.message) || '메인 페이지 생성에 실패했어요');
  return row.id;
}

/** 페이지 발행 (공개) */
export async function pdPublish(token: string, pageId: string): Promise<void> {
  await req(`/pages/${encodeURIComponent(pageId)}/publish`, { method: 'POST', token });
}

/** postdle 글 작성. 메인 페이지 아래 하위 페이지로 생성한다. */
export async function pdCreatePost(
  token: string,
  input: { title: string; content: string; upperPageId?: string; type?: 'MARKDOWN' | 'HTML'; completeness?: number | string },
) {
  // pagedle 백엔드는 completeness 를 문자열('10'~'100')로 받는다. number 로 와도 문자열로 정규화.
  const completeness = input.completeness != null ? String(input.completeness) : undefined;
  const body = {
    content: input.content,
    type: input.type || 'MARKDOWN',
    pageName: input.title,
    ...(input.upperPageId ? { upperPageId: input.upperPageId } : {}),
    category: POSTDLE_CATEGORY,
    ...(completeness != null ? { completeness } : {}),
  };
  const { res, j } = await req('/pages', { method: 'POST', token, body: JSON.stringify(body) });
  const row = unwrap<Page>(j);
  if (!res.ok || !row) throw new HttpError((j && j.message) || '글 저장에 실패했어요');
  return row;
}

/**
 * 기존 글 수정 (pagedle useUpdatePageMutation 과 동일한 PUT /pages/{id}).
 * upperPageId/folderId 는 보내지 않아 서버가 기존 부모를 유지한다.
 */
export async function pdUpdatePost(
  token: string,
  input: { id: string; title: string; content: string; type?: 'MARKDOWN' | 'HTML'; completeness?: number | string },
) {
  const completeness = input.completeness != null ? String(input.completeness) : undefined;
  const body = {
    content: input.content,
    type: input.type || 'MARKDOWN',
    pageName: input.title,
    category: POSTDLE_CATEGORY,
    ...(completeness != null ? { completeness } : {}),
  };
  const { res, j } = await req(`/pages/${encodeURIComponent(input.id)}`, { method: 'PUT', token, body: JSON.stringify(body) });
  const row = unwrap<Page>(j);
  if (!res.ok) throw new HttpError((j && j.message) || '글 수정에 실패했어요');
  return row ?? { id: input.id };
}

/** 회원의 전체 피드 노출 설정 켜기 (공개 글이 랜딩 피드에 뜨도록). null-guard 라 계정정보 안전. */
export async function pdEnableFeedDisplay(token: string): Promise<void> {
  const me = await pdMe(token);
  if (!me) return;
  await req(`/members/${encodeURIComponent(String(me.id))}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ uploadListDisplayYn: true }),
  });
}

/**
 * 글 작성: 메인 페이지 확보 → 하위 페이지 생성 → (공개면) 발행 + 피드 노출.
 * isPublic=false 면 발행하지 않음(비공개 초안, 본인만).
 */
export async function pdWritePost(
  token: string,
  input: { title: string; content: string; type?: 'MARKDOWN' | 'HTML'; completeness?: number | string },
  isPublic: boolean,
): Promise<Page> {
  const upperPageId = await pdEnsureMainPage(token);
  const page = await pdCreatePost(token, { ...input, upperPageId });
  if (isPublic) {
    await pdPublish(token, page.id);
    await pdEnableFeedDisplay(token);
  }
  return page;
}

/**
 * 내 임시저장(미발행) 글 목록.
 * pdMyList(token) 에서 category='postdle' && published !== true 이며,
 * 실제 제목이 있는 하위 페이지만(최상위 'home' 메인 페이지 제외).
 */
export async function pdDrafts(token: string): Promise<{ id: string; title: string; updateTime: string }[]> {
  const list = await pdMyList(token);
  return list
    .filter((p) => p.category === POSTDLE_CATEGORY)
    .filter((p) => p.published !== true)
    // 최상위 메인 페이지('home', upperPageId 없음)는 제외 — 실제 글만.
    .filter((p) => !!p.upperPageId && p.pageName !== 'home')
    .map((p) => ({ id: p.id, title: p.pageName || '(제목 없음)', updateTime: p.updateTime }));
}

/** 특정 유저의 postdle 글 목록 (category=postdle 필터) */
export async function pdMyPosts(memberName: string): Promise<SubPage[]> {
  const { res, j } = await req(`/pages/sub-pages?memberName=${encodeURIComponent(memberName)}`);
  if (!res.ok) return [];
  return unwrapList<SubPage>(j).filter((p) => p.category === POSTDLE_CATEGORY);
}

/** 글(페이지) 상세 */
export async function pdGetPage(id: string): Promise<Page | null> {
  try {
    const { res, j } = await req(`/pages/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    return unwrap<Page>(j);
  } catch {
    return null;
  }
}

export type FeedItem = { page: Page; memberName: string };
export type SearchResult = { users: string[]; posts: FeedItem[] };

/**
 * postdle 한정 검색 — pagedle main-search 결과에서 category='postdle' 페이지만 필터.
 * 반환: postdle 유저(memberName 유니크) + postdle 글.
 */
export async function pdSearchPostdle(keyword: string): Promise<SearchResult> {
  try {
    const { res, j } = await req(`/members/main-search?keyword=${encodeURIComponent(keyword)}`);
    if (!res.ok) return { users: [], posts: [] };
    const raw = j && j.result;
    const obj = Array.isArray(raw) ? raw[0] : raw;
    const pages: unknown[] = Array.isArray(obj?.pages) ? obj.pages : [];
    const postdle = pages.filter((p): p is FeedItem => {
      const pg = (p as FeedItem | undefined)?.page;
      return !!pg && pg.category === POSTDLE_CATEGORY && typeof pg.id === 'string';
    });
    const users = Array.from(new Set(postdle.map((p) => p.memberName).filter(Boolean)));
    return { users, posts: postdle };
  } catch {
    return { users: [], posts: [] };
  }
}

/**
 * 공개 피드 — postdle 카테고리 글 목록.
 * pagedle 백엔드 /pages/upload-user-list?category=postdle 로 요청하되,
 * 프로덕션 백엔드가 아직 category 파라미터를 무시할 수 있으므로(공유 DB에 여러 category 혼재)
 * 받은 결과를 postdle 카테고리로 한 번 더 필터한다. → 백엔드 배포와 무관하게 postdle 글만 노출.
 */
export async function pdFeed(page = 0, size = 20): Promise<FeedItem[]> {
  try {
    // 백엔드 필터가 무시될 수 있어, 넉넉히 받아 클라이언트에서 category 필터 후 size 만큼 사용.
    const fetchSize = Math.max(size * 4, 40);
    const { res, j } = await req(`/pages/upload-user-list?category=${POSTDLE_CATEGORY}&page=${page}&size=${fetchSize}`);
    if (!res.ok) return [];
    // PageImpl 응답: result.content = [{ page, memberName }]
    const row = (j && j.result) || {};
    const content = Array.isArray(row) ? row : row.content;
    const list = Array.isArray(content) ? content : [];
    return list
      // 형태가 어긋난 항목 제거(렌더 오류 방지) + postdle 카테고리만
      .filter((it: unknown): it is FeedItem => {
        const p = (it as FeedItem | undefined)?.page;
        return !!p && typeof p.id === 'string' && p.category === POSTDLE_CATEGORY;
      })
      .slice(0, size);
  } catch {
    return [];
  }
}

// ===== 반응 (공감/좋아요) — pagedle /reactions 공유 =====

export type ReactionType = 'HEART' | 'THUMBS_UP' | 'SOSO';
export type ReactionCounts = { heartCount: number; thumbsUpCount: number; sosoCount: number };

const EMPTY_COUNTS: ReactionCounts = { heartCount: 0, thumbsUpCount: 0, sosoCount: 0 };

export async function pdReactionCounts(postId: string): Promise<ReactionCounts> {
  const { res, j } = await req(`/reactions/count/${encodeURIComponent(postId)}`);
  if (!res.ok) return EMPTY_COUNTS;
  const row = unwrap<ReactionCounts>(j);
  return row ?? EMPTY_COUNTS;
}

/** 반응 토글. 로그인 토큰 필요. 반환: 토글 후 활성 여부(true=반응함). */
export async function pdReactionToggle(token: string, postId: string, reactionType: ReactionType): Promise<boolean> {
  const { res, j } = await req('/reactions/toggle', {
    method: 'POST',
    token,
    body: JSON.stringify({ postId, reactionType }),
  });
  if (!res.ok) throw new HttpError((j && j.message) || '반응에 실패했어요', res.status);
  const row = unwrap<boolean>(j);
  return row === true;
}
