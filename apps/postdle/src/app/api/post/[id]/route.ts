import { ok, handle, HttpError } from '@/lib/http';
import { pdGetPage } from '@/lib/pagedle';

// GET /api/post/[id] → 글(페이지) 상세 — 임시저장 목록에서 편집기로 불러올 때 사용.
export const GET = (_r: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const { id } = await ctx.params;
    if (!id) throw new HttpError('id 가 필요해요');
    const page = await pdGetPage(id);
    if (!page) throw new HttpError('글을 찾을 수 없어요', 404);
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
