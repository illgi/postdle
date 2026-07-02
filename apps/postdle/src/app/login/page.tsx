'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json();
      if (!j.ok) {
        setError(j.message || '실패했어요');
        return;
      }
      // 유저명(공유 member.name)이 아직 없으면 온보딩으로
      router.push(j.needsName ? '/onboarding' : '/');
      router.refresh();
    } catch {
      setError('네트워크 오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 48, maxWidth: 420 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{mode === 'login' ? '로그인' : '가입'}</h2>
        <p className="muted" style={{ fontSize: '0.85rem', marginTop: -4 }}>
          pagedle 계정과 동일합니다.
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input id="email" className="input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="pw">비밀번호</label>
            <input id="pw" className="input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
          </div>
          {error && <div className="msg error">{error}</div>}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? '처리 중…' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: '0.85rem' }}>
          {mode === 'login' ? (
            <button className="linklike" onClick={() => setMode('signup')}
              style={{ background: 'none', border: 'none', color: 'var(--primary-2)', cursor: 'pointer' }}>
              계정이 없으신가요? 가입
            </button>
          ) : (
            <button className="linklike" onClick={() => setMode('login')}
              style={{ background: 'none', border: 'none', color: 'var(--primary-2)', cursor: 'pointer' }}>
              이미 계정이 있으신가요? 로그인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
