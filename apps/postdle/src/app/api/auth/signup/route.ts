import { z } from 'zod';
import { setSessionCookie } from '@/lib/session';
import { ok, handle, HttpError } from '@/lib/http';
import { pdSignup } from '@/lib/pagedle';

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

export const POST = (r: Request) =>
  handle(async () => {
    const p = schema.safeParse(await r.json());
    if (!p.success) throw new HttpError('이메일 형식과 8자 이상 비밀번호를 확인해주세요');
    const { member, token } = await pdSignup(p.data.email, p.data.password);
    await setSessionCookie(token);
    return ok({
      user: { id: member.id, username: member.userId, displayName: member.name || member.userId },
      needsName: !member.name,
    });
  });
