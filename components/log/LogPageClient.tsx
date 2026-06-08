'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UserLogRow, Trail, UserProfile } from '@/types/trail';
import { LOG_STATUS_META } from '@/types/trail';
import LogCard from '@/components/log/LogCard';
import LogForm from '@/components/log/LogForm';
import { createClient } from '@/lib/supabase/client';

interface Props {
  logs: (UserLogRow & { trail_name: string; trail_distance: number })[];
  trails: Trail[];
  profile: UserProfile | null;
  userId: string;
}

type FilterStatus = 'all' | 'planned' | 'in_progress' | 'completed';

export default function LogPageClient({ logs: initialLogs, trails, profile, userId }: Props) {
  const router = useRouter();
  const [logs, setLogs] = useState(initialLogs);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTrailId, setEditingTrailId] = useState<string | null>(null);
  const [searchTrail, setSearchTrail] = useState('');
  const [showTrailPicker, setShowTrailPicker] = useState(false);

  const refreshLogs = useCallback(async () => {
    router.refresh();
    const res = await fetch('/api/log/list');
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs ?? []);
    }
  }, [router]);

  const filteredLogs = logs.filter(l =>
    filterStatus === 'all' || l.status === filterStatus
  );

  const getExisting = (trailId: string) => logs.find(l => l.trail_id === trailId) ?? null;

  const stats = {
    total: logs.length,
    completed: logs.filter(l => l.status === 'completed').length,
    planned: logs.filter(l => l.status === 'planned').length,
    totalKm: Math.round(logs.filter(l => l.status === 'completed').reduce((s, l) => s + (l.trail_distance ?? 0), 0)),
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const filteredTrails = trails.filter(t =>
    t.name.includes(searchTrail) || t.region.includes(searchTrail)
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#0a0f1e 0%,#0d1f12 50%,#0f1a2e 100%)' }}>

      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(90deg,#052e16,#064e3b,#0c4a6e)', borderBottom: '2px solid #10b981' }}
        className="px-5 py-5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <a href="/" className="text-emerald-400 hover:text-emerald-300 text-sm">← 홈</a>
              <span className="text-slate-600">|</span>
              <span className="text-sm font-black text-emerald-100">🥾 나의 탐방 기록</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{profile?.nickname || '탐방자'}</span>
              <button onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 transition">
                로그아웃
              </button>
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: '전체 기록', value: stats.total, icon: '🗺️', color: '#10b981' },
              { label: '탐방 완료', value: stats.completed, icon: '✅', color: '#22c55e' },
              { label: '탐방 예정', value: stats.planned, icon: '📌', color: '#60a5fa' },
              { label: '완주 거리', value: `${stats.totalKm}km`, icon: '📏', color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.icon} {s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">

        {/* 기록 추가 버튼 + 필터 */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-2">
            <button onClick={() => setFilterStatus('all')}
              className="px-3 py-1.5 rounded-full text-xs font-bold border transition"
              style={{
                borderColor: filterStatus === 'all' ? '#10b981' : 'rgba(255,255,255,0.1)',
                background: filterStatus === 'all' ? 'rgba(16,185,129,0.15)' : 'transparent',
                color: filterStatus === 'all' ? '#10b981' : '#64748b',
              }}>전체 {logs.length}</button>
            {(Object.entries(LOG_STATUS_META) as [FilterStatus, typeof LOG_STATUS_META[keyof typeof LOG_STATUS_META]][]).map(([key, meta]) => (
              <button key={key} onClick={() => setFilterStatus(key)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border transition"
                style={{
                  borderColor: filterStatus === key ? meta.color : 'rgba(255,255,255,0.1)',
                  background: filterStatus === key ? `${meta.color}15` : 'transparent',
                  color: filterStatus === key ? meta.color : '#64748b',
                }}>{meta.emoji} {meta.label}</button>
            ))}
          </div>
          <button onClick={() => setShowTrailPicker(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition"
            style={{ background: 'linear-gradient(90deg,#065f46,#0c4a6e)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)' }}>
            + 새 기록 추가
          </button>
        </div>

        {/* 기록 목록 */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🥾</p>
            <p className="text-sm text-slate-400 mb-2">아직 기록이 없습니다</p>
            <p className="text-xs text-slate-600">코스를 탐방하고 기록을 남겨보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => (
              <LogCard
                key={log.id}
                log={log}
                onEdit={() => { setEditingTrailId(log.trail_id); setShowForm(true); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 코스 선택 모달 */}
      {showTrailPicker && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#0f172a', border: '1px solid rgba(16,185,129,0.3)', maxHeight: '70vh' }}>
            <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-100">기록할 코스 선택</p>
              <button onClick={() => { setShowTrailPicker(false); setSearchTrail(''); }} className="text-slate-400">✕</button>
            </div>
            <div className="px-4 py-3">
              <input value={searchTrail} onChange={e => setSearchTrail(e.target.value)}
                placeholder="코스명 또는 지역 검색..."
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 mb-3" />
              <div className="overflow-y-auto" style={{ maxHeight: '50vh' }}>
                {filteredTrails.map(trail => (
                  <button key={trail.id}
                    onClick={() => { setEditingTrailId(trail.id); setShowTrailPicker(false); setSearchTrail(''); setShowForm(true); }}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition mb-1">
                    <p className="text-sm font-semibold text-slate-200">{trail.name}</p>
                    <p className="text-xs text-slate-500">{trail.region} · {trail.distance_km}km</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 기록 입력 폼 */}
      {showForm && editingTrailId && (
        <LogForm
          trailId={editingTrailId}
          trailName={trails.find(t => t.id === editingTrailId)?.name ?? ''}
          userId={userId}
          existing={getExisting(editingTrailId)}
          onSave={refreshLogs}
          onClose={() => { setShowForm(false); setEditingTrailId(null); }}
        />
      )}
    </div>
  );
}
