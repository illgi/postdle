// 세션: pagedle jwtAuthToken 을 httpOnly 쿠키에 그대로 보관.
// (자체 JWT 서명/검증 없음 — 검증은 pagedle /members/me 로 위임)
import { cookies } from 'next/headers';
import { cookieDomain } from './config';

const COOKIE = 'postdle_token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7일

export async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: cookieDomain(),
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

/** 쿠키의 pagedle 토큰 (없으면 null) */
export async function getToken(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}
