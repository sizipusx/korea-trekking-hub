'use client';

import { useState, useMemo } from 'react';
import type { Trail, TrailFilters } from '@/types/trail';
import { CATEGORY_META, DIFFICULTY_COLOR } from '@/types/trail';
import TrailCard from './TrailCard';
import StatsBar from './StatsBar';

interface Props {
  initialTrails: Trail[];
  stats: Awaited<ReturnType<typeof import('@/lib/trails').getTrailStats>>;
}

const CATEGORIES = ['전체', '동서트레일', '국가숲길', '코리아둘레길', '국립공원', '제주 올레', '지자체 트레일', '백두대간'] as const;
const DIFFICULTIES = ['전체', '하', '중하', '중', '중상', '상', '최상'] as const;

export default function TrailListClient({ initialTrails, stats }: Props) {
  const [filters, setFilters] = useState<TrailFilters>({
    category: '전체',
    difficulty: '전체',
    campingOnly: false,
    backpackingOnly: false,
    nowRecommended: false,
    search: '',
  });
  const [openId, setOpenId] = useState<string | null>(null);

  const currentMonth = new Date().getMonth() + 1;

  const filtered = useMemo(() => {
    return initialTrails.filter((t) => {
      if (filters.category !== '전체' && t.category !== filters.category) return false;
      if (filters.difficulty !== '전체' && t.difficulty !== filters.difficulty) return false;
      if (filters.campingOnly && !t.camping) return false;
      if (filters.backpackingOnly && !t.backpacking) return false;
      if (filters.nowRecommended && !t.season?.best_months?.includes(currentMonth)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.region.toLowerCase().includes(q) ||
          t.province.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [initialTrails, filters, currentMonth]);

  const totalKm = Math.round(filtered.reduce((s, t) => s + t.distance_km, 0));

  const set = <K extends keyof TrailFilters>(k: K, v: TrailFilters[K]) =>
    setFilters((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#0a0f1e 0%,#0d1f12 50%,#0f1a2e 100%)' }}>

      {/* ── HEADER ─────────────────────────────────── */}
      <header style={{ background: 'linear-gradient(90deg,#052e16,#064e3b,#0c4a6e)', borderBottom: '2px solid #10b981' }}
        className="px-5 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🥾</span>
            <div>
              <h1 className="text-2xl font-black text-emerald-50 tracking-tight">Korea Trekking Hub</h1>
              <p className="text-xs text-emerald-400 tracking-widest mt-0.5">
                전국 트래킹·백패킹 마스터 데이터베이스 — Powered by Next.js + Supabase
              </p>
            </div>
          </div>
          {/* 통계 바 */}
          <StatsBar
            total={filtered.length}
            totalKm={totalKm}
            backpacking={filtered.filter((t) => t.backpacking).length}
            nowGood={filtered.filter((t) => t.season?.best_months?.includes(currentMonth)).length}
            currentMonth={currentMonth}
          />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4">

        {/* ── FILTER PANEL ──────────────────────────── */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 mb-4 space-y-3">
          {/* 검색 */}
          <input
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="🔍  코스명 · 지역 · 도 검색..."
            className="w-full bg-black/35 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-400 transition"
          />

          {/* 카테고리 */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">카테고리</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const col = CATEGORY_META[c as keyof typeof CATEGORY_META]?.color ?? '#10b981';
                const active = filters.category === c;
                return (
                  <button
                    key={c}
                    onClick={() => set('category', c as TrailFilters['category'])}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition"
                    style={{
                      borderColor: active ? col : 'rgba(255,255,255,0.12)',
                      background: active ? `${col}22` : 'transparent',
                      color: active ? col : '#94a3b8',
                    }}
                  >
                    {CATEGORY_META[c as keyof typeof CATEGORY_META]?.emoji ?? '🗺'} {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 난이도 */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">난이도</p>
            <div className="flex flex-wrap gap-1.5">
              {DIFFICULTIES.map((d) => {
                const col = DIFFICULTY_COLOR[d as keyof typeof DIFFICULTY_COLOR] ?? '#10b981';
                const active = filters.difficulty === d;
                return (
                  <button
                    key={d}
                    onClick={() => set('difficulty', d as TrailFilters['difficulty'])}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition"
                    style={{
                      borderColor: active ? col : 'rgba(255,255,255,0.12)',
                      background: active ? `${col}22` : 'transparent',
                      color: active ? col : '#94a3b8',
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 토글 버튼 */}
          <div className="flex flex-wrap gap-2">
            {([
              ['⛺ 캠핑 가능', 'campingOnly'],
              ['🎒 백패킹 가능', 'backpackingOnly'],
              [`🌟 ${currentMonth}월 추천만`, 'nowRecommended'],
            ] as [string, keyof TrailFilters][]).map(([label, key]) => (
              <button
                key={key}
                onClick={() => set(key, !filters[key])}
                className="px-3 py-1 rounded-lg text-[11px] font-bold border transition"
                style={{
                  borderColor: filters[key] ? '#10b981' : 'rgba(255,255,255,0.12)',
                  background: filters[key] ? 'rgba(16,185,129,0.15)' : 'transparent',
                  color: filters[key] ? '#10b981' : '#94a3b8',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TRAIL LIST ────────────────────────────── */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm">검색 결과가 없습니다. 필터를 조정해 보세요.</p>
            </div>
          ) : (
            filtered.map((trail) => (
              <TrailCard
                key={trail.id}
                trail={trail}
                isOpen={openId === trail.id}
                currentMonth={currentMonth}
                onToggle={() => setOpenId(openId === trail.id ? null : trail.id)}
              />
            ))
          )}
        </div>

        {/* ── FOOTER ────────────────────────────────── */}
        <footer className="mt-6 py-4 text-center border-t border-emerald-900/40">
          <p className="text-[11px] text-emerald-700">
            🥾 Korea Trekking Hub — Phase 2-B  |  Next.js 15 + Supabase  |  전국 {initialTrails.length}개 코스
          </p>
          <p className="text-[10px] text-slate-700 mt-1">
            Phase 3 예정: 카카오맵 API 연동 · GPX 루트 시각화 · 개인 탐방 기록
          </p>
        </footer>
      </div>
    </div>
  );
}
