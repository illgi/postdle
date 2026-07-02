'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ReactionType = 'HEART' | 'THUMBS_UP' | 'SOSO';
type Counts = { heartCount: number; thumbsUpCount: number; sosoCount: number };

const ITEMS: { key: ReactionType; glyph: string; label: string; field: keyof Counts }[] = [
  { key: 'HEART', glyph: '♥', label: '공감', field: 'heartCount' },
  { key: 'THUMBS_UP', glyph: '👍', label: '좋아요', field: 'thumbsUpCount' },
  { key: 'SOSO', glyph: '🙂', label: '그냥저냥', field: 'sosoCount' },
];

export default function ReactionBar({
  postId,
  initial,
  demo = false,
}: {
  postId: string;
  initial?: Partial<Counts>;
  demo?: boolean;
}) {
  const router = useRouter();
  const [counts, setCounts] = useState<Counts>({
    heartCount: initial?.heartCount ?? 0,
    thumbsUpCount: initial?.thumbsUpCount ?? 0,
    sosoCount: initial?.sosoCount ?? 0,
  });
  const [active, setActive] = useState<ReactionType | null>(null);
  const [busy, setBusy] = useState(false);

  function applyLocal(next: ReactionType) {
    setCounts((c) => {
      const nc = { ...c };
      if (active) nc[fieldOf(active)] = Math.max(0, nc[fieldOf(active)] - 1);
      if (active !== next) nc[fieldOf(next)] = nc[fieldOf(next)] + 1;
      return nc;
    });
    setActive((a) => (a === next ? null : next));
  }

  async function onClick(type: ReactionType) {
    if (busy) return;
    if (demo) {
      applyLocal(type);
      return;
    }
    setBusy(true);
    applyLocal(type);
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postId, reactionType: type }),
      });
      const j = await res.json();
      if (!j.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        return;
      }
      if (j.counts) setCounts(j.counts);
    } catch {
      /* 낙관적 업데이트 유지 */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reactions" role="group" aria-label="이 글에 반응 남기기">
      {ITEMS.map((it) => (
        <button
          key={it.key}
          type="button"
          className={`reaction-btn${active === it.key ? ' is-active' : ''}`}
          onClick={() => onClick(it.key)}
          aria-pressed={active === it.key}
          aria-label={it.label}
        >
          <span className="glyph" aria-hidden="true">{it.glyph}</span>
          <span className="rlabel">{it.label}</span>
          <span className="rcount">{counts[it.field]}</span>
        </button>
      ))}
    </div>
  );
}

function fieldOf(t: ReactionType): keyof Counts {
  return t === 'HEART' ? 'heartCount' : t === 'THUMBS_UP' ? 'thumbsUpCount' : 'sosoCount';
}
