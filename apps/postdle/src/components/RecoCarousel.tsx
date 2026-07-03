'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

type Item = { text: string; source: string; href: string };

export default function RecoCarousel({ items }: { items: Item[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  // 한 스텝(현재 보이는 폭의 80%)만큼 이동. 끝에 닿으면 처음으로.
  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 200);
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const atStart = el.scrollLeft <= 4;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: 'smooth' });
    else if (dir === -1 && atStart) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    else el.scrollBy({ left: amount * dir, behavior: 'smooth' });
  };

  // 자동 슬라이드 (마우스 올리면 일시정지)
  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) step(1);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="reco-carousel"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <button type="button" className="reco-nav prev" aria-label="이전" onClick={() => step(-1)}>‹</button>
      <div className="reco-track" ref={trackRef}>
        {items.map((q) => (
          <Link key={q.text} href={q.href} className="reco-item">
            <span className="reco-text">{q.text}</span>
            <span className="reco-source">{q.source}</span>
          </Link>
        ))}
      </div>
      <button type="button" className="reco-nav next" aria-label="다음" onClick={() => step(1)}>›</button>
    </div>
  );
}
