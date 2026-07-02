'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Post = { page: { id: string; pageName?: string }; memberName: string };
type Result = { users: string[]; posts: Post[] };

export default function SearchBox() {
  const [q, setQ] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const v = q.trim();
    if (v.length < 1) {
      setResult(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(v)}`);
        const j = await res.json();
        setResult(j.ok ? { users: j.users || [], posts: j.posts || [] } : { users: [], posts: [] });
      } catch {
        setResult({ users: [], posts: [] });
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  const empty = result && result.users.length === 0 && result.posts.length === 0;

  return (
    <div className="search-wrap">
      <div className="search-field">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          className="search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="postdle 유저·글 검색"
          aria-label="postdle 유저와 글 검색"
        />
      </div>

      {q.trim() && (
        <div className="search-results">
          {loading && <div className="search-empty">검색 중…</div>}
          {!loading && empty && <div className="search-empty">일치하는 postdle 유저·글이 없어요.</div>}
          {!loading && result && result.users.length > 0 && (
            <div className="search-group">
              <div className="search-label">유저</div>
              <div className="search-users">
                {result.users.map((u) => (
                  <Link key={u} href={`/u/${encodeURIComponent(u)}`} className="user-chip">@{u}</Link>
                ))}
              </div>
            </div>
          )}
          {!loading && result && result.posts.length > 0 && (
            <div className="search-group">
              <div className="search-label">글</div>
              {result.posts.map((p) => (
                <Link key={p.page.id} href={`/p/${p.page.id}`} className="search-post">
                  <span className="sp-title">{p.page.pageName || '(제목 없음)'}</span>
                  <span className="sp-author">@{p.memberName}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
