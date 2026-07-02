'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/lib/config';

type Check = 'idle' | 'checking' | 'ok' | 'taken' | 'invalid';

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [check, setCheck] = useState<Check>('idle');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 디바운스 유저명 검증 (pagedle 공유)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const v = name.trim();
    if (!v) {
      setCheck('idle');
      return;
    }
    if (v.length < 2 || v.length > 20) {
      setCheck('invalid');
      return;
    }
    setCheck('checking');
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username?name=${encodeURIComponent(v)}`);
        const j = await res.json();
        setCheck(j.ok && j.available ? 'ok' : 'taken');
      } catch {
        setCheck('idle');
      }
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [name]);

  async function save() {
    setError('');
    if (check !== 'ok') return;
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userName: name.trim() }),
      });
      const j = await res.json();
      if (!j.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        setError(j.message || '설정에 실패했어요');
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('네트워크 오류가 발생했어요');
    } finally {
      setSaving(false);
    }
  }

  const hint: Record<Check, { text: string; cls: string }> = {
    idle: { text: '2~20자, 다른 사람과 겹치지 않는 이름', cls: 'muted' },
    checking: { text: '확인 중…', cls: 'muted' },
    ok: { text: '사용할 수 있는 유저명이에요', cls: 'msg ok' },
    taken: { text: '이미 사용 중인 유저명이에요', cls: 'msg error' },
    invalid: { text: '2~20자로 입력해주세요', cls: 'msg error' },
  };

  return (
    <div className="container" style={{ paddingTop: 48, maxWidth: 420 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>유저명 설정</h2>
        <p className="muted" style={{ fontSize: '0.85rem', marginTop: -4 }}>
          {BRAND.name}과 pagedle에서 함께 쓰는 이름이에요. 내 주소가 됩니다.
        </p>
        <div className="field">
          <label htmlFor="uname">유저명</label>
          <input
            id="uname"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: noweul"
            autoFocus
          />
          <div className={hint[check].cls} style={{ fontSize: '0.82rem' }}>{hint[check].text}</div>
        </div>
        {error && <div className="msg error">{error}</div>}
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={save} disabled={check !== 'ok' || saving}>
          {saving ? '설정 중…' : '이 이름으로 시작'}
        </button>
      </div>
    </div>
  );
}
