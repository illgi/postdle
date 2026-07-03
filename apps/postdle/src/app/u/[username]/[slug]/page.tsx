import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pdMyPosts, pdGetPage } from '@/lib/pagedle';
import { renderMarkdown } from '@/lib/markdown';
import ReactionBar from '@/components/ReactionBar';
import SafeHtml from '@/components/SafeHtml';

export const dynamic = 'force-dynamic';

async function resolvePage(username: string, slug: string) {
  const name = decodeURIComponent(username);
  const title = decodeURIComponent(slug);
  const posts = await pdMyPosts(name);
  const matches = posts.filter((p) => p.pageName === title);
  // 제목 중복 시 발행된 글 우선, 없으면 첫 매치
  const sub = matches.find((p) => p.published) ?? matches[0];
  if (!sub) return null;
  const page = await pdGetPage(sub.id);
  return page ? { page, author: name } : null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ username: string; slug: string }> },
) {
  const { username, slug } = await params;
  const resolved = await resolvePage(username, slug);
  return { title: resolved?.page.pageName || decodeURIComponent(slug) };
}

export default async function PostByTitle(
  { params }: { params: Promise<{ username: string; slug: string }> },
) {
  const { username, slug } = await params;
  const resolved = await resolvePage(username, slug);
  if (!resolved) notFound();
  const { page, author } = resolved;

  return (
    <article className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <Link href="/" className="muted" style={{ fontSize: '0.85rem' }}>← 목록</Link>
      <h1 style={{ fontSize: '2rem', margin: '12px 0 6px', letterSpacing: '-0.5px' }}>
        {page.pageName || '(제목 없음)'}
      </h1>
      <div className="meta" style={{ marginBottom: 24 }}>
        <Link href={`/u/${encodeURIComponent(author)}`} className="author-link">{author}</Link>
        {' · '}{formatDate(page.updateTime || page.createTime)}
      </div>
      {page.type === 'HTML' ? (
        <SafeHtml className="md" html={page.content} />
      ) : (
        <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }} />
      )}
      <div style={{ marginTop: 32 }}>
        <div className="muted" style={{ fontSize: '0.85rem', marginBottom: 10 }}>이 글에 반응 남기기</div>
        <ReactionBar postId={page.id} />
      </div>
    </article>
  );
}

function formatDate(s?: string): string {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
