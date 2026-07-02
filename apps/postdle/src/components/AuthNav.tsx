'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Me = { username: string; displayName: string } | null;

export default function AuthNav() {
  const router = useRouter();
  const [me, setMe] = useState<Me>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((j) => {
        if (alive) setMe(j.ok ? j.user : null);
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setMe(null);
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
