'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

type Me = { username: string; displayName: string } | null;

export default function AuthNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me>(null);
  const [ready, setReady] = useState(false);

  // 경로가 바뀔 때마다(로그인/로그아웃 후 이동 포함) 세션을 다시 확인 → 헤더 즉시 갱신
  useEffect(() => {
    let alive = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (alive) setMe(j.ok ? j.user : null);
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setMe(null);
    // 로그아웃 시 로컬 임시저장/버전 정리 (다음 사용자에게 남지 않도록)
    try {
      window.localStorage.removeItem('post_draft_new');
      window.localStorage.removeItem('post_versions_new');
    } catch {
      /* ignore */
    }
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="nav-links">
      <Link href="/compose">글쓰기</Link>
      {!ready ? null : me ? (
        <>
          <Link href={`/u/${encodeURIComponent(me.displayName)}`} className="nav-user">{me.displayName}</Link>
          <button type="button" className="nav-logout" onClick={logout}>로그아웃</button>
        </>
      ) : (
        <Link href="/login">로그인</Link>
      )}
    </nav>
  );
}
