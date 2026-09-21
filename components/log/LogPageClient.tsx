'use client';

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Trail, UserProfile } from '@/types/trail';
import type { ForestRow } from '@/types/forest';
import type { CampRow } from '@/types/camp';
import type { ActivityKind, ActivityLogKey, ActivityLogRow, PlaceType } from '@/types/activity';
import { ACTIVITIES, ACTIVITY_META, LOG_STATUS_META, PLACE_TYPE_META } from '@/types/activity';
import LogCard from '@/components/log/LogCard';
import LogForm from '@/components/log/LogForm';
import { createClient } from '@/lib/supabase/client';

interface Props {
  logs: ActivityLogRow[];
  trails: Trail[];
  forests: ForestRow[];
  camps: CampRow[];
  profile: UserProfile | null;
  userId: string;
}

type FilterStatus = 'all' | 'planned' | 'in_progress' | 'completed';

// 장소 목록을 한 모양으로 맞춰 고르게 한다
interface PlaceOption { id: string; name: string; sub: string; km?: number | null; }

const PLACE_TYPES: PlaceType[] = ['trail', 'forest', 'camp', 'none'];

export default function LogPageClient({ logs: initialLogs, trails, forests, camps, profile, userId }: Props) {
  const router = useRouter();
  const [logs, setLogs] = useState(initialLogs);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterActivity, setFilterActivity] = useState<ActivityKind | 'all'>('all');

  // 새 기록: 활동 → 장소 종류 → 장소 순으로 고른다
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickActivity, setPickActivity] = useState<ActivityKind>('riding');
  const [pickPlaceType, setPickPlaceType] = useState<PlaceType>('trail');
  const [search, setSearch] = useState('');
  const [freeName, setFreeName] = useState('');

  // 열려 있는 입력 폼
  const [form, setForm] = useState<
    { key: ActivityLogKey; placeName: string; suggestedKm?: number | null } | null
  >(null);

  const refreshLogs = useCallback(async () => {
    router.refresh();
    const res = await fetch('/api/log/list');
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs ?? []);
    }
  }, [router]);

  const filteredLogs = logs.filter((l) =>
    (filterStatus === 'all' || l.status === filterStatus) &&
    (filterActivity === 'all' || l.activity === filterActivity),
  );

  const stats = {
    total: logs.length,
    completed: logs.filter((l) => l.status === 'completed').length,
    planned: logs.filter((l) => l.status === 'planned').length,
    totalKm: Math.round(
      logs.filter((l) => l.status === 'completed')
        .reduce((s, l) => s + (Number(l.distance_km) || 0), 0),
    ),
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // 고른 장소 종류에 맞는 후보 목록
  const placeOptions = useMemo<PlaceOption[]>(() => {
    if (pickPlaceType === 'trail') {
      return trails.map((t) => ({ id: t.id, name: t.name, sub: t.region, km: t.distance_km }));
    }
    if (pickPlaceType === 'forest') {
      return forests.map((f) => ({ id: f.id, name: f.name, sub: `${f.category} · ${f.sigungu}` }));
    }
    if (pickPlaceType === 'camp') {
      return camps.map((c) => ({ id: c.id, name: c.name, sub: `${c.category} · ${c.sigungu}` }));
    }
    return [];
  }, [pickPlaceType, trails, forests, camps]);

  const filteredPlaces = placeOptions
    .filter((p) => p.name.includes(search) || p.sub.includes(search))
    .slice(0, 200);   // 캠핑장·코스가 많아 화면에 다 그리지 않는다

  const openForm = (key: ActivityLogKey, placeName: string, suggestedKm?: number | null) => {
    setForm({ key, placeName, suggestedKm });
    setPickerOpen(false);
    setSearch('');
    setFreeName('');
  };

  // 이미 남긴 기록이면 그 내용을 폼에 채워 넣는다
  const existingFor = (key: ActivityLogKey) =>
    logs.find((l) =>
      l.activity === key.activity &&
      l.place_type === key.placeType &&
      l.place_id === key.placeId) ?? null;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#0a0f1e 0%,#0d1f12 50%,#0f1a2e 100%)' }}>

      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(90deg,#052e16,#064e3b,#0c4a6e)', borderBottom: '2px solid #10b981' }}
        className="px-5 py-5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-emerald-400 hover:text-emerald-300 text-sm">← 홈</Link>
              <span className="text-slate-600">|</span>
              <span className="text-sm font-black text-emerald-100">🗒 나의 활동 기록</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{profile?.nickname || '기록자'}</span>
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
              { label: '완료', value: stats.completed, icon: '✅', color: '#22c55e' },
              { label: '예정', value: stats.planned, icon: '📌', color: '#60a5fa' },
              { label: '누적 거리', value: `${stats.totalKm}km`, icon: '📏', color: '#f59e0b' },
            ].map((s) => (
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

        {/* 활동 필터 */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <button onClick={() => setFilterActivity('all')}
            className="px-3 py-1.5 rounded-full text-xs font-bold border transition"
            style={{
              borderColor: filterActivity === 'all' ? '#10b981' : 'rgba(255,255,255,0.1)',
              background: filterActivity === 'all' ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: filterActivity === 'all' ? '#10b981' : '#64748b',
            }}>전체 활동</button>
          {ACTIVITIES.map((a) => {
            const meta = ACTIVITY_META[a];
            const on = filterActivity === a;
            const count = logs.filter((l) => l.activity === a).length;
            return (
              <button key={a} onClick={() => setFilterActivity(a)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border transition"
                style={{
                  borderColor: on ? meta.color : 'rgba(255,255,255,0.1)',
                  background: on ? `${meta.color}15` : 'transparent',
                  color: on ? meta.color : '#64748b',
                }}>{meta.emoji} {meta.label} {count}</button>
            );
          })}
        </div>

        {/* 상태 필터 + 기록 추가 */}
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
          <button onClick={() => setPickerOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition"
            style={{ background: 'linear-gradient(90deg,#065f46,#0c4a6e)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)' }}>
            + 새 기록 추가
          </button>
        </div>

        {/* 기록 목록 */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🚲</p>
            <p className="text-sm text-slate-400 mb-2">아직 기록이 없습니다</p>
            <p className="text-xs text-slate-600">라이딩·백패킹·캠핑·트레킹 기록을 남겨보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <LogCard
                key={log.id}
                log={log}
                onEdit={() => setForm({
                  key: { activity: log.activity, placeType: log.place_type, placeId: log.place_id },
                  placeName: log.place_name,
                  suggestedKm: log.distance_km,
                })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 새 기록: 활동 + 장소 선택 ───────────────────── */}
      {pickerOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
            style={{ background: '#0f172a', border: '1px solid rgba(16,185,129,0.3)', maxHeight: '80vh' }}>
            <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between flex-shrink-0">
              <p className="text-sm font-bold text-slate-100">새 기록</p>
              <button onClick={() => { setPickerOpen(false); setSearch(''); setFreeName(''); }}
                className="text-slate-400">✕</button>
            </div>

            <div className="px-4 py-3 space-y-3 overflow-y-auto">
              {/* 1. 활동 */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">1. 활동</p>
                <div className="flex gap-1.5 flex-wrap">
                  {ACTIVITIES.map((a) => {
                    const meta = ACTIVITY_META[a];
                    const on = pickActivity === a;
                    return (
                      <button key={a} onClick={() => setPickActivity(a)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border transition"
                        style={{
                          borderColor: on ? meta.color : 'rgba(255,255,255,0.1)',
                          background: on ? `${meta.color}20` : 'transparent',
                          color: on ? meta.color : '#64748b',
                        }}>{meta.emoji} {meta.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 장소 종류 */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">2. 장소</p>
                <div className="flex gap-1.5 flex-wrap">
                  {PLACE_TYPES.map((pt) => {
                    const meta = PLACE_TYPE_META[pt];
                    const on = pickPlaceType === pt;
                    return (
                      <button key={pt} onClick={() => { setPickPlaceType(pt); setSearch(''); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border transition"
                        style={{
                          borderColor: on ? '#10b981' : 'rgba(255,255,255,0.1)',
                          background: on ? 'rgba(16,185,129,0.15)' : 'transparent',
                          color: on ? '#10b981' : '#64748b',
                        }}>{meta.emoji} {meta.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* 3. 장소 고르기 (또는 직접 입력) */}
              {pickPlaceType === 'none' ? (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">3. 장소 이름</p>
                  <input value={freeName} onChange={(e) => setFreeName(e.target.value)}
                    placeholder="예: 남한강 자전거길 여주 구간"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-500" />
                  <button
                    disabled={!freeName.trim()}
                    onClick={() => openForm(
                      { activity: pickActivity, placeType: 'none', placeId: null },
                      freeName.trim(),
                    )}
                    className="w-full mt-2 py-2 rounded-lg text-xs font-bold transition disabled:opacity-40"
                    style={{ background: 'linear-gradient(90deg,#065f46,#0c4a6e)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)' }}>
                    이 이름으로 기록하기
                  </button>
                  <p className="text-[10px] text-slate-600 mt-2">
                    아직 데이터에 없는 곳을 적을 때 씁니다. 같은 이름으로 여러 번 기록할 수 있습니다.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">
                    3. {PLACE_TYPE_META[pickPlaceType].label} 선택
                  </p>
                  <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="이름 또는 지역 검색..."
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-500 mb-2" />
                  <div className="overflow-y-auto" style={{ maxHeight: '32vh' }}>
                    {filteredPlaces.map((p) => (
                      <button key={p.id}
                        onClick={() => openForm(
                          { activity: pickActivity, placeType: pickPlaceType, placeId: p.id },
                          p.name, p.km,
                        )}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition mb-1">
                        <p className="text-sm font-semibold text-slate-200">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {p.sub}{p.km ? ` · ${p.km}km` : ''}
                        </p>
                      </button>
                    ))}
                    {filteredPlaces.length === 0 && (
                      <p className="text-xs text-slate-600 py-4 text-center">검색 결과가 없습니다</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 기록 입력 폼 */}
      {form && (
        <LogForm
          logKey={form.key}
          placeName={form.placeName}
          suggestedKm={form.suggestedKm}
          userId={userId}
          existing={existingFor(form.key)}
          onSave={refreshLogs}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}
