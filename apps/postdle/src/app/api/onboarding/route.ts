import { z } from 'zod';
import { getToken } from '@/lib/session';
import { ok, handle, HttpError } from '@/lib/http';
import { pdUpdateName, pdValidateName } from '@/lib/pagedle';

const schema = z.object({ userName: z.string().min(2).max(20) });

// POST /api/onboarding { userName } → 공유 member.name 설정 (pagedle 과 동기화)
export const POST = (r: Request) =>
  handle(async () => {
    const token = await getToken();
    if (!token) throw new HttpError('로그인이 필요해요', 401);
    const p = schema.safeParse(await r.json());
    if (!p.success) throw new HttpError('유저명은 2~20자로 입력해주세요');
    const available = await pdValidateName(p.data.userName);
    if (!available) throw new HttpError('이미 사용 중인 유저명이에요');
    await pdUpdateName(token, p.data.userName);
    return ok({ userName: p.data.userName });
  });
