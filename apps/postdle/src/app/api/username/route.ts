import { ok, handle, HttpError } from '@/lib/http';
import { pdValidateName } from '@/lib/pagedle';

// GET /api/username?name=유저명 → { available } (pagedle 공유 검증)
export const GET = (r: Request) =>
  handle(async () => {
    const name = (new URL(r.url).searchParams.get('name') || '').trim();
    if (!name) throw new HttpError('유저명을 입력해주세요');
    const available = await pdValidateName(name);
    return ok({ available });
  });
