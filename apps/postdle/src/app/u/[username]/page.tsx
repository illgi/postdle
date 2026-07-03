import Link from 'next/link';
import type { Metadata } from 'next';
import { pdMyPosts } from '@/lib/pagedle';
import { postHref } from '@/lib/links';
import { getCompletenessColor } from '@/lib/completeness';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> },
): Promise<Metadata> {
  const { username } = await params;
  const name = decodeURIComponent(username);
  const desc = `${name}님이 Postdle에 발행한 글 모음.`;
  return {
    title: `${name} · Postdle`,
    description: desc,
    openGraph: { title: `${name} · Postdle`, description: desc, type: 'profile' },
  };
}

export default async function Profile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const name = decodeURIComponent(username);
  const posts = await pdMyPosts(name);

  return (
    <div className="container" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <div className="profile-head">
        <div className="profile-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</div>
        <div>
          <h1 className="profile-name">@{name}</h1>
          <div className="muted" style={{ fontSize: '0.85rem' }}>{posts.length}개의 글</div>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="profile-empty">
          <div className="profile-empty-emoji" aria-hidden="true">✍️</div>
          <div className="profile-empty-title">아직 발행한 글이 없어요</div>
          <p className="profile-empty-sub">첫 글을 발행하면 여기에 모여요.</p>
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          {posts.map((p) => {
            const cmp = typeof p.completeness === 'number' ? p.completeness : null;
            return (
              <article key={p.id} className="post-item">
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Link href={postHref(name, p.pageName)}>{p.pageName || '(제목 없음)'}</Link>
                  {cmp != null && (
                    <span
                      className="cmp-pill"
                      style={{ color: getCompletenessColor(cmp), borderColor: getCompletenessColor(cmp) }}
                    >
                      완성도 {cmp}%
                    </span>
                  )}
                </h3>
                <div className="meta">{formatDate(p.createTime)} · 조회 {p.totalViewCount ?? 0}</div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(s?: string): string {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
