'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { postHref } from '@/lib/links';

type Post = { page: { id: string; pageName?: string }; memberName: string };
type Result = { users: string[]; posts: Post[] };

function SearchResults() {
  const params = useSearchParams();
  const q = (params.get('q') || '').trim();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!q) {
      setResult({ users: [], posts: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        setResult(j.ok ? { users: j.users || [], posts: j.posts || [] } : { users: [], posts: [] });
      })
      .catch(() => alive && setResult({ users: [], posts: [] }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q]);

  const empty = result && result.users.length === 0 && result.posts.length === 0;

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1 className="search-page-title">
        검색{q && <span className="search-page-q"> ‘{q}’</span>}
      </h1>

      {!q && <p className="muted" style={{ marginTop: 12 }}>검색어를 입력해주세요.</p>}

      {q && loading && <p className="muted" style={{ marginTop: 16 }}>검색 중…</p>}

      {q && !loading && empty && (
        <div className="profile-empty">
          <div className="profile-empty-emoji" aria-hidden="true">🔍</div>
          <div className="profile-empty-title">‘{q}’에 대한 결과가 없어요</div>
          <p className="profile-empty-sub">다른 키워드로 다시 검색해보세요.</p>
        </div>
      )}

      {q && !loading && result && result.users.length > 0 && (
        <section className="search-page-group">
          <div className="search-label">유저</div>
          <div className="search-users">
            {result.users.map((u) => (
              <Link key={u} href={`/u/${encodeURIComponent(u)}`} className="user-chip">@{u}</Link>
            ))}
          </div>
        </section>
      )}

      {q && !loading && result && result.posts.length > 0 && (
        <section className="search-page-group">
          <div className="search-label">글</div>
          <div>
            {result.posts.map((p) => (
              <Link
                key={p.page.id}
                href={postHref(p.memberName, p.page.pageName)}
                className="search-post search-page-post"
              >
                <span className="sp-title">{p.page.pageName || '(제목 없음)'}</span>
                <span className="sp-author">@{p.memberName}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container" style={{ paddingTop: 32 }}><p className="muted">검색 중…</p></div>}>
      <SearchResults />
    </Suspense>
  );
}
