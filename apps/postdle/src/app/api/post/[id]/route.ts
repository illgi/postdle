import { ok, handle, HttpError } from '@/lib/http';
import { getToken } from '@/lib/session';
import { pdGetPage, pdMe } from '@/lib/pagedle';

// GET /api/post/[id] → 글(페이지) 상세 — 임시저장 목록에서 편집기로 불러올 때 사용.
// 본인 소유 글만 반환(미발행 초안 포함). 로그인 + 소유자 확인 필수.
export const GET = (_r: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const { id } = await ctx.params;
    if (!id) throw new HttpError('id 가 필요해요');
    const token = await getToken();
    if (!token) throw new HttpError('로그인이 필요해요', 401);
    const me = await pdMe(token);
    if (!me) throw new HttpError('로그인이 필요해요', 401);
    const page = await pdGetPage(id);
    if (!page) throw new HttpError('글을 찾을 수 없어요', 404);
    // 소유자 확인 — 남의 글(초안 포함) 열람 차단
    if (String(page.memberId) !== String(me.id)) throw new HttpError('권한이 없어요', 404);
    return ok({
      post: {
        id: page.id,
        title: page.pageName || '',
        content: page.content || '',
        type: page.type,
        completeness: page.completeness ?? null,
      },
    });
  });
