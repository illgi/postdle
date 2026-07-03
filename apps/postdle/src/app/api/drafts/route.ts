import { getToken } from '@/lib/session';
import { ok, handle, HttpError } from '@/lib/http';
import { pdDrafts } from '@/lib/pagedle';

// GET /api/drafts → 로그인한 사용자의 미발행(임시저장) 글 목록
export const GET = () =>
  handle(async () => {
    const token = await getToken();
    if (!token) throw new HttpError('로그인이 필요해요', 401);
    const drafts = await pdDrafts(token);
    return ok({ drafts });
  });
