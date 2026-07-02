'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PostEditor } from '@repo/post-editor';

type Visibility = 'public' | 'private';

const isEmptyHtml = (h: string) => !h || h.replace(/<[^>]*>/g, '').trim() === '';

export default function ComposePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // HTML (pagedle과 동일하게 HTML 저장)
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // 랜딩의 문장/예시에서 넘어온 프리필 (?title=&content=, content 는 HTML)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get('title');
    const c = p.get('content');
    if (t) setTitle(t);
    if (c) setContent(c);
  }, []);

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
        body: JSON.stringify({ title: title.trim(), content, type: 'HTML', visibility }),
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
      setMsg({ kind: 'ok', text: visibility === 'public' ? '발행되었어요!' : '비공개로 저장되었어요.' });
      setTitle('');
      setContent('');
    } catch {
      setMsg({ kind: 'error', text: '네트워크 오류가 발생했어요' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <h2>글쓰기</h2>
      <div className="field">
        <label htmlFor="title">제목</label>
        <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요" />
      </div>
      <div className="field">
        <label>내용</label>
        <PostEditor value={content} onChange={setContent} onImageUpload={onImageUpload} placeholder="내용을 입력하세요…" />
      </div>

      <div className="field">
        <label>공개 범위</label>
        <div className="visibility">
          <button type="button" className={`vis-opt${visibility === 'public' ? ' is-on' : ''}`} onClick={() => setVisibility('public')}>
            <span className="vis-title">공개</span>
            <span className="vis-desc">누구나 볼 수 있고 피드·프로필에 표시</span>
          </button>
          <button type="button" className={`vis-opt${visibility === 'private' ? ' is-on' : ''}`} onClick={() => setVisibility('private')}>
            <span className="vis-title">비공개</span>
            <span className="vis-desc">나만 볼 수 있는 초안으로 저장</span>
          </button>
        </div>
      </div>

      {msg && <div className={`msg ${msg.kind}`}>{msg.text}</div>}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? '저장 중…' : visibility === 'public' ? '발행' : '비공개 저장'}
        </button>
      </div>
    </div>
  );
}
