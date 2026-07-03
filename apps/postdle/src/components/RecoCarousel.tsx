import Link from 'next/link';

type Item = { text: string; source: string; href: string };

// 진짜 무한 롤링 — CSS 트랜스폼 마퀴. 목록을 두 번 이어붙이고 -50% 로 이동해
// 되감기(점프) 없이 끊김 없이 순환한다. 카드 폭은 CSS 에서 고정(모두 동일 길이).
export default function RecoCarousel({ items }: { items: Item[] }) {
  if (items.length === 0) return null;
  const loop = [...items, ...items];
  // 카드 수와 무관하게 일정한 속도(약 70px/s): 한 세트를 지나는 시간 = 카드수 * 4.8s
  const duration = Math.max(items.length * 4.8, 16);

  return (
    <div className="reco-marquee">
      <div className="reco-marquee-track" style={{ animationDuration: `${duration}s` }}>
        {loop.map((q, i) => (
          <Link key={`${i}-${q.text}`} href={q.href} className="reco-item" aria-hidden={i >= items.length}>
            <span className="reco-text">{q.text}</span>
            <span className="reco-source">{q.source}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
