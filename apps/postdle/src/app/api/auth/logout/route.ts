import { clearSessionCookie } from '@/lib/session';
import { ok, handle } from '@/lib/http';

export const POST = () =>
  handle(async () => {
    await clearSessionCookie();
    return ok();
  });
