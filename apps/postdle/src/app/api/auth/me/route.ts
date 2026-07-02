import { getToken } from '@/lib/session';
import { ok, handle } from '@/lib/http';
import { pdMe } from '@/lib/pagedle';

export const GET = () =>
  handle(async () => {
    const token = await getToken();
    if (!token) return ok({ user: null });
    const m = await pdMe(token);
    if (!m) return ok({ user: null });
    return ok({
      user: { id: m.id, username: m.userId, displayName: m.name || m.userId, name: m.name },
      needsName: !m.name,
    });
  });
