'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    const supabase = createClient();

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
      else { router.push('/log'); router.refresh(); }
    } else {
      const { error: err } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${location.origin}/log` }
      });
      if (err) setError(err.message);
      else setMessage('가입 확인 이메일을 보냈습니다. 이메일을 확인해 주세요!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(160deg,#0a0f1e 0%,#0d1f12 50%,#0f1a2e 100%)' }}>
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="text-center mb-8">
          <span className="text-5xl">🥾</span>
          <h1 className="text-xl font-black text-emerald-100 mt-3">Korea Trekking Hub</h1>
          <p className="text-sm text-slate-500 mt-1">나만의 트래킹 기록을 시작하세요</p>
        </div>

        {/* 폼 카드 */}
        <div className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.2)' }}>

          {/* 탭 */}
          <div className="flex mb-5 rounded-xl overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setMessage(''); }}
                className="flex-1 py-2 text-sm font-bold transition"
                style={{
                  background: mode === m ? 'rgba(16,185,129,0.2)' : 'transparent',
                  color: mode === m ? '#10b981' : '#64748b',
                }}>
                {m === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-1.5">이메일</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-500"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1.5">비밀번호</p>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="6자리 이상"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-500"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
          </div>

          {error && (
            <div className="mt-3 px-3 py-2 rounded-lg text-xs text-red-400"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              ⚠️ {error}
            </div>
          )}
          {message && (
            <div className="mt-3 px-3 py-2 rounded-lg text-xs text-emerald-400"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
              ✅ {message}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || !email || !password}
            className="w-full mt-4 py-3 rounded-xl text-sm font-bold transition disabled:opacity-50"
            style={{ background: 'linear-gradient(90deg,#065f46,#0c4a6e)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)' }}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </div>

        <p className="text-center mt-4 text-xs text-slate-600">
          <a href="/" className="text-emerald-700 hover:text-emerald-500">← 코스 목록으로 돌아가기</a>
        </p>
      </div>
    </div>
  );
}
