import Link from 'next/link';
import { pdFeed } from '@/lib/pagedle';
import { plainPreview } from '@/lib/markdown';
import { QUOTES, pickTodayQuote } from '@/lib/examples';
import { EVERGREEN_TOPICS, pickDailyTopic } from '@/lib/topics';
import { getTrendingTopics } from '@/lib/trends';
import ReactionBar from '@/components/ReactionBar';
import RecoCarousel from '@/components/RecoCarousel';
import { postHref } from '@/lib/links';

export const dynamic = 'force-dynamic';

const topicHref = (topic: string) => `/compose?topic=${encodeURIComponent(topic)}`;

export default async function Home() {
  const posts = await pdFeed(0, 20);
  const trends = await getTrendingTopics();

  // 한국 시간(KST) 기준 오늘 날짜/요일
  const kst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const dateLabel = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());

  // ===== 화두: 오늘의 대표 주제(에버그린) + 트렌드/에버그린 칩 믹스 =====
  const featuredTopic = pickDailyTopic(kst);
  // 🔥 지금 뜨는(Google Trends) — 최대 6개
  const trendChips = trends.slice(0, 6);
  // 💡 생각해볼 주제(에버그린) — 대표 주제를 제외하고 6개
  const evergreenChips = EVERGREEN_TOPICS.filter((t) => t !== featuredTopic).slice(0, 6);

  const today = pickTodayQuote(kst);
  // 추천 문장: 오늘의 문장을 제외하고 매 요청마다 랜덤 12개
  const recommended = [...QUOTES]
    .filter((q) => q.text !== today.text)
    .sort(() => Math.random() - 0.5)
    .slice(0, 12);
  // 에디터가 HTML 저장이라 인용문을 blockquote HTML 로 프리필
  const composeHref = (text: string) => `/compose?content=${encodeURIComponent(`<blockquote><p>${text}</p></blockquote><p></p>`)}`;

  return (
    <div className="container">
      {/* ===== 화두(오늘의 대표 주제 + 트렌드/에버그린 칩) — 최상단 ===== */}
      <section className="hwadu">
        <div className="hwadu-label">오늘의 화두</div>
        <h2 className="hwadu-topic">{featuredTopic}</h2>
        <Link href={topicHref(featuredTopic)} className="hwadu-cta">
          이 주제로 내 생각 쓰기 →
        </Link>

        <div className="hwadu-chips">
          {trendChips.length > 0 && (
            <div className="hwadu-group">
              <span className="hwadu-group-label">🔥 지금 뜨는</span>
              <div className="hwadu-chip-row">
                {trendChips.map((t) => (
                  <Link key={`trend-${t}`} href={topicHref(t)} className="hwadu-chip is-trend">
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="hwadu-group">
            <span className="hwadu-group-label">💡 생각해볼 주제</span>
            <div className="hwadu-chip-row">
              {evergreenChips.map((t) => (
                <Link key={`ever-${t}`} href={topicHref(t)} className="hwadu-chip">
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 피드 ===== */}
      {posts.length > 0 && (
        <section className="feed-grid">
          {posts.map((item) => (
            <article key={item.page.id} className="post-card">
              <Link href={postHref(item.memberName, item.page.pageName)} className="post-card-title">
                {item.page.pageName || '(제목 없음)'}
              </Link>
              <div className="meta">
                <Link href={`/u/${encodeURIComponent(item.memberName)}`} className="author-link">{item.memberName}</Link>
                {' · '}{formatDate(item.page.createTime)}
              </div>
              <p className="post-card-preview">{plainPreview(item.page.content, 100)}</p>
              <ReactionBar postId={item.page.id} />
            </article>
          ))}
        </section>
      )}

      {/* ===== 오늘의 문장 + 추천 문장(마퀴) — 최하단(변경 없음) ===== */}
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
    </div>
  );
}

function formatDate(s?: string): string {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
