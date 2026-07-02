import { ok, handle } from '@/lib/http';
import { pdSearchPostdle } from '@/lib/pagedle';

// GET /api/search?q=키워드 → postdle 유저/글만 필터한 결과
export const GET = (r: Request) =>
  handle(async () => {
    const q = (new URL(r.url).searchParams.get('q') || '').trim();
    if (!q) return ok({ users: [], posts: [] });
    const { users, posts } = await pdSearchPostdle(q);
    return ok({ users, posts });
  });
