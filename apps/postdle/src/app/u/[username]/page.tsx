import Link from 'next/link';
import { pdMyPosts } from '@/lib/pagedle';

export const dynamic = 'force-dynamic';

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
        <p className="muted" style={{ marginTop: 24 }}>아직 발행한 글이 없어요.</p>
      ) : (
        <div style={{ marginTop: 20 }}>
          {posts.map((p) => (
            <article key={p.id} className="post-item">
              <h3 style={{ margin: 0 }}>
                <Link href={`/p/${p.id}`}>{p.pageName || '(제목 없음)'}</Link>
              </h3>
              <div className="meta">{formatDate(p.createTime)} · 조회 {p.totalViewCount ?? 0}</div>
            </article>
          ))}
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
