'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

type Item = { text: string; source: string; href: string };

export default function RecoCarousel({ items }: { items: Item[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  // 끊김 없는 무한 루프를 위해 목록을 두 번 렌더 → 첫 세트 끝을 지나면 스크롤을 첫 세트 폭만큼 되감음(애니메이션 없이).
  const loop = items.length > 0 ? [...items, ...items] : [];

  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 220);
    el.scrollBy({ left: amount * dir, behavior: 'smooth' });
  };

  // 경계에서 매끄럽게 되감기 (점프 없이 연속 루프)
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft >= half) el.scrollLeft -= half;
    else if (el.scrollLeft <= 0) el.scrollLeft += half;
  };

  // 자동 슬라이드 (한 방향, 마우스 올리면 정지)
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
      <div className="reco-track" ref={trackRef} onScroll={onScroll}>
        {loop.map((q, i) => (
          <Link key={`${i}-${q.text}`} href={q.href} className="reco-item">
            <span className="reco-text">{q.text}</span>
            <span className="reco-source">{q.source}</span>
          </Link>
        ))}
      </div>
      <button type="button" className="reco-nav next" aria-label="다음" onClick={() => step(1)}>›</button>
    </div>
  );
}
