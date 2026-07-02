import { z } from 'zod';
import { getToken } from '@/lib/session';
import { ok, handle, HttpError } from '@/lib/http';
import { pdWritePost, pdMyPosts } from '@/lib/pagedle';

// GET /api/posts?memberName=유저명 → 해당 유저의 postdle 글 목록
export const GET = (r: Request) =>
  handle(async () => {
    const memberName = new URL(r.url).searchParams.get('memberName') || '';
    if (!memberName) throw new HttpError('memberName 이 필요해요');
    const posts = await pdMyPosts(memberName);
    return ok({ posts });
  });

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['MARKDOWN', 'HTML']).optional(),
  visibility: z.enum(['public', 'private']).optional(),
});

// POST /api/posts → 하위 페이지 생성 (+ 공개 선택 시 발행/피드 노출)
export const POST = (r: Request) =>
  handle(async () => {
    const token = await getToken();
    if (!token) throw new HttpError('로그인이 필요해요', 401);
    const p = createSchema.safeParse(await r.json());
    if (!p.success) throw new HttpError('제목과 내용을 입력해주세요');
    const { visibility, ...input } = p.data;
    const page = await pdWritePost(token, input, visibility !== 'private');
    return ok({ post: page, visibility: visibility ?? 'public' });
  });
