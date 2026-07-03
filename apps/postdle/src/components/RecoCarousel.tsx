'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

type Item = { text: string; source: string; href: string };

// 등속(일정한 속도) 연속 롤링. 목록을 두 번 렌더해 경계에서 매끄럽게 되감아 끊김·간격 불일치 없음.
const SPEED = 0.4; // px per frame (~24px/s @60fps)

export default function RecoCarousel({ items }: { items: Item[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const manualUntilRef = useRef(0);
  const loop = items.length > 0 ? [...items, ...items] : [];

  // 경계 되감기 (첫 세트를 지나면 정확히 한 세트 폭만큼 되돌림 → 무한 등속)
  const wrap = (el: HTMLDivElement) => {
    const half = el.scrollWidth / 2;
    if (half <= 0) return;
    if (el.scrollLeft >= half) el.scrollLeft -= half;
    else if (el.scrollLeft < 0) el.scrollLeft += half;
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      if (!pausedRef.current && now >= manualUntilRef.current) {
        el.scrollLeft += SPEED; // 매 프레임 동일 간격 → 일정한 속도
        wrap(el);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [items.length]);

  // 화살표: 부드럽게 한 칸 이동, 잠깐 자동 롤링을 멈춰 애니메이션과 충돌 방지
  const nudge = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    manualUntilRef.current = performance.now() + 700;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.6, 240), behavior: 'smooth' });
    setTimeout(() => wrap(el), 750);
  };

  return (
    <div
      className="reco-carousel"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <button type="button" className="reco-nav prev" aria-label="이전" onClick={() => nudge(-1)}>‹</button>
      <div className="reco-track" ref={trackRef} onScroll={() => trackRef.current && wrap(trackRef.current)}>
        {loop.map((q, i) => (
          <Link key={`${i}-${q.text}`} href={q.href} className="reco-item">
            <span className="reco-text">{q.text}</span>
            <span className="reco-source">{q.source}</span>
          </Link>
        ))}
      </div>
      <button type="button" className="reco-nav next" aria-label="다음" onClick={() => nudge(1)}>›</button>
    </div>
  );
}
