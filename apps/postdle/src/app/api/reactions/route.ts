import { z } from 'zod';
import { getToken } from '@/lib/session';
import { ok, handle, HttpError } from '@/lib/http';
import { pdReactionCounts, pdReactionToggle } from '@/lib/pagedle';

// GET /api/reactions?postId=... → { counts }
export const GET = (r: Request) =>
  handle(async () => {
    const postId = new URL(r.url).searchParams.get('postId') || '';
    if (!postId) throw new HttpError('postId 가 필요해요');
    const counts = await pdReactionCounts(postId);
    return ok({ counts });
  });

const toggleSchema = z.object({
  postId: z.string().min(1),
  reactionType: z.enum(['HEART', 'THUMBS_UP', 'SOSO']),
});

// POST /api/reactions → 반응 토글 (로그인 필요)
export const POST = (r: Request) =>
  handle(async () => {
    const token = await getToken();
    if (!token) throw new HttpError('로그인이 필요해요', 401);
    const p = toggleSchema.safeParse(await r.json());
    if (!p.success) throw new HttpError('요청이 올바르지 않아요');
    const active = await pdReactionToggle(token, p.data.postId, p.data.reactionType);
    const counts = await pdReactionCounts(p.data.postId);
    return ok({ active, counts });
  });
