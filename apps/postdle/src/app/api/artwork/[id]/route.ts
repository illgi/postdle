import { ok, handle, HttpError } from '@/lib/http';
import { getArtworkById, buildInfoHtml } from '@/lib/images';

// GET /api/artwork/[id] → 오늘의 이미지 상세 + 정보 자동생성 HTML (compose 프리필용)
export const GET = (_r: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const { id } = await ctx.params;
    if (!id) throw new HttpError('id 가 필요해요');
    const artwork = await getArtworkById(id);
    if (!artwork) throw new HttpError('작품을 찾을 수 없어요', 404);
    return ok({ artwork, infoHtml: buildInfoHtml(artwork) });
  });
