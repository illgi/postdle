'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PostEditor } from '@repo/post-editor';

type Visibility = 'public' | 'private';

const isEmptyHtml = (h: string) => !h || h.replace(/<[^>]*>/g, '').trim() === '';
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'postdle.com';

// ===== 완성도 (pagedle getCompletenessColor 와 동일) =====
const toLevel = (n: number) => String(Math.max(10, Math.min(100, Math.round(n / 10) * 10)));
const getCompletenessColor = (pct: number) => {
  if (pct < 40) return 'var(--gray-4, #9aa1aa)';
  if (pct < 80) return '#e8a33d';
  return '#0f9d6b';
};

// ===== 로컬 저장 키 (pagedle mirror) =====
const DRAFT_KEY = 'post_draft_new';
const VERSIONS_KEY = 'post_versions_new';
const MAX_VERSIONS = 20;
const VERSION_INTERVAL = 30000;

interface VersionEntry {
  id: string;
  time: string; // ISO
  completeness: string;
  content: string;
  title: string;
}

interface ServerDraft {
  id: string;
  title: string;
  updateTime: string;
}

const hasWindow = () => typeof window !== 'undefined';

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ComposePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // HTML (pagedle과 동일하게 HTML 저장)
  const [completeness, setCompleteness] = useState('10'); // '10'~'100'
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState<string | null>(null); // 서브도메인/주소 미리보기용

  // 수정 중인 서버 글 id (없으면 새 글 생성)
  const [editingId, setEditingId] = useState<string | null>(null);

  // 임시저장/버전
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [restorable, setRestorable] = useState<VersionEntry | null>(null); // 이어쓰기 칩
  const lastSnapshotRef = useRef<string>('');

  // 서버 임시저장 목록
  const [drafts, setDrafts] = useState<ServerDraft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // 랜딩의 문장/예시에서 넘어온 프리필 (?title=&content=)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get('title');
    const c = p.get('content');
    if (t) setTitle(t);
    if (c) setContent(c);
  }, []);

  // 로그인 유저명 조회 (주소 미리보기용)
  useEffect(() => {
    let alive = true;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((j) => {
        if (alive && j.ok && j.user) setUsername(j.user.displayName || j.user.username || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const persistVersions = useCallback((next: VersionEntry[]) => {
    const trimmed = next.slice(0, MAX_VERSIONS);
    setVersions(trimmed);
    if (hasWindow()) {
      try {
        window.localStorage.setItem(VERSIONS_KEY, JSON.stringify(trimmed));
      } catch {
        /* ignore */
      }
    }
  }, []);

  // 서버 임시저장 목록
  const loadDrafts = useCallback(async () => {
    setDraftsLoading(true);
    try {
      const r = await fetch('/api/drafts');
      const j = await r.json();
      if (j.ok && Array.isArray(j.drafts)) setDrafts(j.drafts);
      else setDrafts([]);
    } catch {
      setDrafts([]);
    } finally {
      setDraftsLoading(false);
    }
  }, []);

  // 마운트: localStorage 초안/버전 복구 + 서버 목록 로드
  useEffect(() => {
    if (!hasWindow()) return;
    try {
      const rawV = window.localStorage.getItem(VERSIONS_KEY);
      if (rawV) setVersions(JSON.parse(rawV));
    } catch {
      /* ignore */
    }
    try {
      const rawD = window.localStorage.getItem(DRAFT_KEY);
      if (rawD) {
        const d = JSON.parse(rawD) as { title?: string; content?: string; completeness?: string };
        const hasDraft = !!(d.title || d.content);
        // 현재 비어있으면 이어쓰기 칩 노출 (URL 프리필과 충돌 방지 위해 자동 덮어쓰지 않음)
        if (hasDraft) {
          setRestorable({
            id: 'draft',
            time: new Date().toISOString(),
            completeness: d.completeness || '10',
            content: d.content || '',
            title: d.title || '',
          });
        }
      }
    } catch {
      /* ignore */
    }
    loadDrafts();
  }, [loadDrafts]);

  // 자동 저장 (debounce ~1s) — {title, content, completeness}
  useEffect(() => {
    if (!hasWindow()) return;
    if (!title && !content) return;
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, completeness }));
        const now = new Date();
        setLastSavedTime(
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
        );
      } catch {
        /* ignore */
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, content, completeness]);

  // 30초마다 내용이 바뀌었으면 버전 스냅샷
  useEffect(() => {
    const interval = setInterval(() => {
      if (content && content !== lastSnapshotRef.current) {
        const entry: VersionEntry = {
          id: `v_${Date.now()}`,
          time: new Date().toISOString(),
          completeness,
          content,
          title,
        };
        setVersions((prev) => {
          const trimmed = [entry, ...prev].slice(0, MAX_VERSIONS);
          if (hasWindow()) {
            try {
              window.localStorage.setItem(VERSIONS_KEY, JSON.stringify(trimmed));
            } catch {
              /* ignore */
            }
          }
          return trimmed;
        });
        lastSnapshotRef.current = content;
      }
    }, VERSION_INTERVAL);
    return () => clearInterval(interval);
  }, [content, completeness, title]);

  // ===== 슬라이더 =====
  const pctFromPointer = useCallback((clientX: number) => {
    if (!sliderRef.current) return 10;
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.max(10, Math.round(ratio * 10) * 10);
  }, []);

  const onSliderDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      setDragging(true);
      setCompleteness(toLevel(pctFromPointer(e.clientX)));
    },
    [pctFromPointer],
  );
  const onSliderMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      setCompleteness(toLevel(pctFromPointer(e.clientX)));
    },
    [dragging, pctFromPointer],
  );
  const onSliderUp = useCallback(() => setDragging(false), []);
  const onSliderKey = useCallback(
    (e: React.KeyboardEvent) => {
      const cur = Number(completeness);
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCompleteness(toLevel(Math.min(100, cur + 10)));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCompleteness(toLevel(Math.max(10, cur - 10)));
      }
    },
    [completeness],
  );

  const pctNum = Number(completeness);
  const color = getCompletenessColor(pctNum);

  // ===== 임시저장 버튼 (localStorage 즉시 저장) =====
  function saveDraftNow() {
    if (!hasWindow()) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, completeness }));
      // 명시적 저장 시 버전도 하나 남긴다
      if (content) {
        const entry: VersionEntry = { id: `v_${Date.now()}`, time: new Date().toISOString(), completeness, content, title };
        persistVersions([entry, ...versions]);
        lastSnapshotRef.current = content;
      }
    } catch {
      /* ignore */
    }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }

  // ===== 버전 복원 =====
  function restoreVersion(v: VersionEntry) {
    if (!window.confirm('이 버전으로 되돌릴까요? 현재 작성 중인 내용은 대체됩니다.')) return;
    setTitle(v.title);
    setContent(v.content);
    setCompleteness(v.completeness || '10');
  }

  // 이어쓰기 칩 클릭 → 초안 복구
  function applyRestorable() {
    if (!restorable) return;
    setTitle(restorable.title);
    setContent(restorable.content);
    setCompleteness(restorable.completeness || '10');
    setRestorable(null);
  }

  // 서버 글을 편집기로 불러오기
  async function loadPostIntoEditor(id: string) {
    setMsg(null);
    try {
      const r = await fetch(`/api/post/${encodeURIComponent(id)}`);
      const j = await r.json();
      if (!j.ok || !j.post) {
        setMsg({ kind: 'error', text: '글을 불러오지 못했어요' });
        return;
      }
      setEditingId(j.post.id);
      setTitle(j.post.title || '');
      setContent(j.post.content || '');
      if (j.post.completeness != null) setCompleteness(toLevel(Number(j.post.completeness)));
      setRestorable(null);
      if (hasWindow()) window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setMsg({ kind: 'error', text: '글을 불러오지 못했어요' });
    }
  }

  function newPost() {
    setEditingId(null);
    setTitle('');
    setContent('');
    setCompleteness('10');
    setMsg(null);
  }

  const onImageUpload = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const j = await res.json();
    if (!j.ok) throw new Error(j.message || '업로드 실패');
    return j.url as string;
  };

  async function submit() {
    setMsg(null);
    if (!title.trim() || isEmptyHtml(content)) {
      setMsg({ kind: 'error', text: '제목과 내용을 입력해주세요' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          title: title.trim(),
          content,
          type: 'HTML',
          visibility,
          completeness, // '10'~'100'
        }),
      });
      const j = await res.json();
      if (!j.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        setMsg({ kind: 'error', text: j.message || '저장에 실패했어요' });
        return;
      }
      setMsg({
        kind: 'ok',
        text: visibility === 'public' ? '발행되었어요!' : '비공개로 저장되었어요.',
      });
      // 성공 시 로컬 초안/버전 정리 + 새 글 상태로
      if (hasWindow()) {
        try {
          window.localStorage.removeItem(DRAFT_KEY);
          window.localStorage.removeItem(VERSIONS_KEY);
        } catch {
          /* ignore */
        }
      }
      setEditingId(null);
      setTitle('');
      setContent('');
      setCompleteness('10');
      setVersions([]);
      setRestorable(null);
      loadDrafts();
    } catch {
      setMsg({ kind: 'error', text: '네트워크 오류가 발생했어요' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0 }}>{editingId ? '글 수정' : '글쓰기'}</h2>
        {editingId && (
          <button type="button" className="btn btn-ghost" onClick={newPost} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
            + 새 글
          </button>
        )}
      </div>

      {/* 이어쓰기 칩 (localStorage 초안 복구) */}
      {restorable && !editingId && (
        <div className="restore-chip">
          <span>작성 중이던 임시저장 글이 있어요.</span>
          <button type="button" onClick={applyRestorable}>이어쓰기</button>
          <button type="button" className="restore-dismiss" onClick={() => setRestorable(null)} aria-label="닫기">
            ✕
          </button>
        </div>
      )}

      <div className="field">
        <label htmlFor="title">제목</label>
        <input
          id="title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
        />
        <div className="muted" style={{ fontSize: '0.8rem', marginTop: 6 }}>
          {title.trim() ? (
            username ? (
              <>주소: {username}.{ROOT_DOMAIN}/{title.trim()}</>
            ) : (
              <>주소: {ROOT_DOMAIN}/&lt;유저명&gt;/{title.trim()}</>
            )
          ) : (
            <>제목을 입력하면 주소가 만들어져요.</>
          )}
        </div>
      </div>

      {/* 완성도 슬라이더 */}
      <div className="field">
        <label>완성도</label>
        <div className="completeness-row">
          <div
            className="cmp-track"
            ref={sliderRef}
            role="slider"
            tabIndex={0}
            aria-label="완성도"
            aria-valuemin={10}
            aria-valuemax={100}
            aria-valuenow={pctNum}
            aria-valuetext={`${completeness}%`}
            onPointerDown={onSliderDown}
            onPointerMove={onSliderMove}
            onPointerUp={onSliderUp}
            onPointerCancel={onSliderUp}
            onKeyDown={onSliderKey}
          >
            <div className="cmp-bg" />
            <div className="cmp-fill" style={{ width: `${pctNum}%`, background: color }} />
            <div className="cmp-ticks">
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((tick) => (
                <div key={tick} className="cmp-tick" style={{ left: `${tick}%` }} />
              ))}
            </div>
            <div className={`cmp-thumb${dragging ? ' active' : ''}`} style={{ left: `${pctNum}%`, borderColor: color }} />
          </div>
          <span className="cmp-pct" style={{ color }}>
            {completeness}%
          </span>
        </div>
      </div>

      <div className="field">
        <label>내용</label>
        <PostEditor value={content} onChange={setContent} onImageUpload={onImageUpload} placeholder="내용을 입력하세요…" />
        <div className="editor-meta">
          <button type="button" className="draft-save-btn" onClick={saveDraftNow}>
            임시저장
          </button>
          {savedFlash && <span className="draft-flash">임시저장됨</span>}
          {lastSavedTime && <span className="auto-saved">자동저장 {lastSavedTime}</span>}
          <button
            type="button"
            className="version-toggle"
            onClick={() => setShowVersions((v) => !v)}
            aria-expanded={showVersions}
          >
            버전 기록{versions.length > 0 ? ` ${versions.length}` : ''}
          </button>
        </div>
        {showVersions && (
          <div className="version-panel">
            {versions.length === 0 ? (
              <div className="version-empty">저장된 버전이 없어요.</div>
            ) : (
              versions.map((v) => (
                <button key={v.id} type="button" className="version-item" onClick={() => restoreVersion(v)}>
                  <span className="version-time">{relativeTime(v.time)}</span>
                  {v.title && <span className="version-vtitle">{v.title}</span>}
                  <span className="version-cmp" style={{ color: getCompletenessColor(Number(v.completeness)) }}>
                    {v.completeness}%
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="field">
        <label>공개 범위</label>
        <div className="visibility">
          <button
            type="button"
            className={`vis-opt${visibility === 'public' ? ' is-on' : ''}`}
            onClick={() => setVisibility('public')}
          >
            <span className="vis-title">공개</span>
            <span className="vis-desc">누구나 볼 수 있고 피드·프로필에 표시</span>
          </button>
          <button
            type="button"
            className={`vis-opt${visibility === 'private' ? ' is-on' : ''}`}
            onClick={() => setVisibility('private')}
          >
            <span className="vis-title">비공개</span>
            <span className="vis-desc">나만 볼 수 있는 초안으로 저장</span>
          </button>
        </div>
      </div>

      {msg && <div className={`msg ${msg.kind}`}>{msg.text}</div>}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? '저장 중…' : editingId ? '수정 저장' : visibility === 'public' ? '발행' : '비공개 저장'}
        </button>
      </div>

      {/* 내 임시저장 (서버측 미발행 글) */}
      <div className="drafts-section">
        <div className="drafts-head">
          <h3>내 임시저장</h3>
          <button type="button" className="drafts-refresh" onClick={loadDrafts} disabled={draftsLoading}>
            {draftsLoading ? '불러오는 중…' : '새로고침'}
          </button>
        </div>
        {drafts.length === 0 ? (
          <div className="muted" style={{ fontSize: '0.85rem' }}>
            {draftsLoading ? '' : '임시저장된 글이 없어요.'}
          </div>
        ) : (
          <ul className="drafts-list">
            {drafts.map((d) => (
              <li key={d.id}>
                <button type="button" className="draft-row" onClick={() => loadPostIntoEditor(d.id)}>
                  <span className="draft-title">{d.title}</span>
                  <span className="draft-date">{relativeTime(d.updateTime)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
