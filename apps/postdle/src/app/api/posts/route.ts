import { z } from 'zod';
import { getToken } from '@/lib/session';
import { ok, handle, HttpError } from '@/lib/http';
import { pdWritePost, pdMyPosts, pdUpdatePost, pdPublish, pdEnableFeedDisplay } from '@/lib/pagedle';

// GET /api/posts?memberName=유저명 → 해당 유저의 postdle 글 목록
export const GET = (r: Request) =>
  handle(async () => {
    const memberName = new URL(r.url).searchParams.get('memberName') || '';
    if (!memberName) throw new HttpError('memberName 이 필요해요');
    const posts = await pdMyPosts(memberName);
    return ok({ posts });
  });

const createSchema = z.object({
  // id 가 있으면 기존 글 수정, 없으면 새 글 생성.
  id: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['MARKDOWN', 'HTML']).optional(),
  visibility: z.enum(['public', 'private']).optional(),
  // 완성도('10'~'100'). 백엔드로 그대로 전달.
  completeness: z.union([z.string(), z.number()]).optional(),
});

// POST /api/posts → 하위 페이지 생성/수정 (+ 공개 선택 시 발행/피드 노출)
export const POST = (r: Request) =>
  handle(async () => {
    const token = await getToken();
    if (!token) throw new HttpError('로그인이 필요해요', 401);
    const p = createSchema.safeParse(await r.json());
    if (!p.success) throw new HttpError('제목과 내용을 입력해주세요');
    const { visibility, id, ...input } = p.data;
    const isPublic = visibility !== 'private';

    // 수정 모드: 기존 글 갱신(중복 생성 방지). 공개면 발행/피드 노출까지.
    if (id) {
      const page = await pdUpdatePost(token, { id, ...input });
      if (isPublic) {
        await pdPublish(token, id);
        await pdEnableFeedDisplay(token);
      }
      return ok({ post: page, visibility: visibility ?? 'public' });
    }

    const page = await pdWritePost(token, input, isPublic);
    return ok({ post: page, visibility: visibility ?? 'public' });
  });
