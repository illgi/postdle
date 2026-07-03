import Link from 'next/link';
import { pdFeed } from '@/lib/pagedle';
import { plainPreview } from '@/lib/markdown';
import { EXAMPLE_POSTS, QUOTES, pickTodayQuote } from '@/lib/examples';
import ReactionBar from '@/components/ReactionBar';
import RecoCarousel from '@/components/RecoCarousel';
import { postHref } from '@/lib/links';

export const dynamic = 'force-dynamic';

// 예시 글용 시드 반응 수 (콜드스타트 방지)
const SEED = [
  { heartCount: 12, thumbsUpCount: 5, sosoCount: 1 },
  { heartCount: 8, thumbsUpCount: 9, sosoCount: 0 },
  { heartCount: 15, thumbsUpCount: 3, sosoCount: 2 },
  { heartCount: 6, thumbsUpCount: 4, sosoCount: 1 },
];

export default async function Home() {
  const feed = await pdFeed(0, 20);
  const usingExamples = feed.length === 0;
  const posts = usingExamples ? EXAMPLE_POSTS : feed;

  // 한국 시간(KST) 기준 오늘 날짜/요일
  const kst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const dateLabel = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());

  const today = pickTodayQuote(kst);
  // 추천 문장: 오늘의 문장을 제외하고 매 요청마다 랜덤 6개
  const recommended = [...QUOTES]
    .filter((q) => q.text !== today.text)
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);
  // 에디터가 HTML 저장이라 인용문을 blockquote HTML 로 프리필
  const composeHref = (text: string) => `/compose?content=${encodeURIComponent(`<blockquote><p>${text}</p></blockquote><p></p>`)}`;

  return (
    <div className="container">
      <section className="today-quote">
        <div className="tq-date">{dateLabel}</div>
        <div className="tq-label">오늘의 문장</div>
        <blockquote className="tq-text">{today.text}</blockquote>
        <div className="tq-source">— {today.source}</div>
        <Link href={composeHref(today.text)} className="tq-write">이 문장으로 쓰기 →</Link>
      </section>

      <section className="reco">
        <div className="reco-label">추천 문장</div>
        <RecoCarousel
          items={recommended.map((q) => ({ text: q.text, source: q.source, href: composeHref(q.text) }))}
        />
      </section>

      <section className="feed-grid">
        {posts.map((item, i) => (
          <article key={item.page.id} className="post-card">
            {usingExamples && <span className="tag-example">예시</span>}
            <Link
              href={usingExamples ? `/p/${item.page.id}` : postHref(item.memberName, item.page.pageName)}
              className="post-card-title"
            >
              {item.page.pageName || '(제목 없음)'}
            </Link>
            <div className="meta">
              {usingExamples ? (
                item.memberName
              ) : (
                <Link href={`/u/${encodeURIComponent(item.memberName)}`} className="author-link">{item.memberName}</Link>
              )}
              {' · '}{formatDate(item.page.createTime)}
            </div>
            <p className="post-card-preview">{plainPreview(item.page.content, 100)}</p>
            <ReactionBar
              postId={item.page.id}
              demo={usingExamples}
              initial={usingExamples ? SEED[i % SEED.length] : undefined}
            />
          </article>
        ))}
      </section>
    </div>
  );
}

function formatDate(s?: string): string {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
