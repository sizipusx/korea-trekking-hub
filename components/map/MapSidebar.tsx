'use client';

import type { Trail } from '@/types/trail';
import { CATEGORY_META, DIFFICULTY_COLOR } from '@/types/trail';

const CAT_COLORS: Record<string, string> = {
  '동서트레일':    '#f97316',
  '국가숲길':      '#22c55e',
  '코리아둘레길':  '#0ea5e9',
  '국립공원':      '#a78bfa',
  '제주 올레':     '#f59e0b',
  '지자체 트레일': '#ef4444',
  '백두대간':      '#94a3b8',
};

interface Props {
  trails: Trail[];
  selectedId: string | null;
  filterCategory: string;
  onCategoryChange: (cat: string) => void;
  onSelect: (trail: Trail) => void;
  currentMonth: number;
  forestCount?: number;
}

const CATEGORIES = ['전체', '동서트레일', '국가숲길', '코리아둘레길', '국립공원', '제주 올레', '지자체 트레일', '백두대간'];

export default function MapSidebar({
  trails, selectedId, filterCategory,
  onCategoryChange, onSelect, currentMonth, forestCount = 0,
}: Props) {
  const filtered = filterCategory === '전체'
    ? trails
    : trails.filter((t) => t.category === filterCategory);

  return (
    <aside className="flex flex-col h-full overflow-hidden"
      style={{ background: 'rgba(10,15,30,0.97)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>

      <div className="px-4 py-4 border-b border-white/8 flex-shrink-0"
        style={{ background: 'linear-gradient(180deg,#052e16,#0a1628)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🥾</span>
          <h1 className="text-sm font-black text-emerald-100 tracking-tight">Korea Trekking Hub</h1>
        </div>
        <p className="text-[10px] text-emerald-600">전국 {trails.length}개 코스 · 🏕 휴양림 {forestCount}개</p>
      </div>

      <div className="px-3 py-3 border-b border-white/6 flex-shrink-0">
        <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">카테고리 필터</p>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => {
            const col = CAT_COLORS[c] ?? '#10b981';
            const active = filterCategory === c;
            return (
              <button key={c} onClick={() => onCategoryChange(c)}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold border transition"
                style={{
                  borderColor: active ? col : 'rgba(255,255,255,0.1)',
                  background: active ? `${col}20` : 'transparent',
                  color: active ? col : '#64748b',
                }}>
                {CATEGORY_META[c as keyof typeof CATEGORY_META]?.emoji ?? '🗺'} {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        <p className="text-[9px] text-slate-600 uppercase tracking-widest px-1 mb-2">
          {filtered.length}개 코스
        </p>
        {filtered.map((trail) => {
          const catColor = CAT_COLORS[trail.category] ?? '#10b981';
          const diffColor = DIFFICULTY_COLOR[trail.difficulty] ?? '#f59e0b';
          const isSelected = selectedId === trail.id;
          const isNow = trail.season?.best_months?.includes(currentMonth);

          return (
            <button key={trail.id}
              onClick={() => onSelect(trail)}
              className="w-full text-left rounded-lg px-3 py-2.5 transition border"
              style={{
                background: isSelected ? `${catColor}15` : 'rgba(255,255,255,0.025)',
                borderColor: isSelected ? `${catColor}55` : 'rgba(255,255,255,0.06)',
              }}>
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="text-[12px] font-bold text-slate-100 leading-snug flex-1">
                  {trail.name}
                </span>
                {isNow && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                    🌟 추천
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold" style={{ color: catColor }}>
                  {CATEGORY_META[trail.category as keyof typeof CATEGORY_META]?.emoji} {trail.category}
                </span>
                <span className="text-[10px]" style={{ color: diffColor }}>
                  난이도 {trail.difficulty}
                </span>
                <span className="text-[10px] text-emerald-500 font-bold">
                  {trail.distance_km}km
                </span>
                {trail.backpacking && <span className="text-[10px]">🎒</span>}
                {trail.camping && <span className="text-[10px]">⛺</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-white/6 flex-shrink-0 text-center">
        <p className="text-[9px] text-slate-700">Phase 5 · 자연휴양림 {forestCount}개 연동</p>
        <p className="text-[9px] text-slate-700">국립·공립·사립 예약정보 제공</p>
      </div>
    </aside>
  );
}
