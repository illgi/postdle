import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pdGetPage } from '@/lib/pagedle';
import { renderMarkdown } from '@/lib/markdown';
import { getExampleById, isExampleId } from '@/lib/examples';
import ReactionBar from '@/components/ReactionBar';
import SafeHtml from '@/components/SafeHtml';

export const dynamic = 'force-dynamic';

export default async function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // 실데이터 우선, 없으면 예시 글 폴백 (콜드 스타트 방지)
  const example = getExampleById(id);
  const page = (await pdGetPage(id)) ?? example?.page ?? null;
  if (!page) notFound();

  const author = example?.memberName;

  return (
    <article className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <Link href="/" className="muted" style={{ fontSize: '0.85rem' }}>← 목록</Link>
      <h1 style={{ fontSize: '2rem', margin: '12px 0 6px', letterSpacing: '-0.5px' }}>
        {page.pageName || '(제목 없음)'}
      </h1>
      <div className="meta" style={{ marginBottom: 24 }}>
        {author ? `${author} · ` : ''}{formatDate(page.updateTime || page.createTime)}
      </div>
      {page.type === 'HTML' ? (
        <SafeHtml className="md" html={page.content} />
      ) : (
        <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }} />
      )}
      <div style={{ marginTop: 32 }}>
        <div className="muted" style={{ fontSize: '0.85rem', marginBottom: 10 }}>이 글에 반응 남기기</div>
        <ReactionBar
          postId={page.id}
          demo={isExampleId(id)}
          initial={isExampleId(id) ? { heartCount: 12, thumbsUpCount: 5, sosoCount: 1 } : undefined}
        />
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
