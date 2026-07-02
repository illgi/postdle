// 유저 서브도메인 라우팅: 유저명.postdle.com → /u/유저명 (pagedle/geuldle 원리 차용)
import { NextRequest, NextResponse } from 'next/server';

const RESERVED = new Set(['www', 'app', 'api', 'mail', 'cdn', 'static', 'assets', 'admin', 'test']);
// 서브도메인에서도 전역 앱 화면으로 통과시킬 첫 경로 세그먼트
const GLOBAL_SEGMENTS = new Set(['compose', 'login', 'onboarding', 'p', 'u', 'api']);

function rootDomain(): string {
  return (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'postdle.com').split(':')[0];
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/u/') ||
    path === '/favicon.ico' ||
    path.startsWith('/assets') ||
    /\.[a-z0-9]+$/i.test(path)
  ) {
    return NextResponse.next();
  }

  const host = (req.headers.get('host') || '').split(':')[0];
  const root = rootDomain();

  let label = '';
  if (host.endsWith('.' + root)) label = host.slice(0, host.length - root.length - 1);
  if (!label || label.includes('.') || RESERVED.has(label)) return NextResponse.next();

  const seg = path.split('/').filter(Boolean);
  if (seg[0] && GLOBAL_SEGMENTS.has(seg[0])) return NextResponse.next();

  // '/' → 프로필, '/슬러그' → 하위 경로
  const rewrite = url.clone();
  rewrite.pathname = '/u/' + encodeURIComponent(label) + (seg.length ? '/' + seg.map(encodeURIComponent).join('/') : '');
  return NextResponse.rewrite(rewrite);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
