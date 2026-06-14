'use client';

import type { ForestRow } from '@/types/forest';
import { FOREST_CATEGORY_META } from '@/types/forest';

interface Props {
  forest: ForestRow;
  onClose: () => void;
}

export default function ForestDetailPanel({ forest, onClose }: Props) {
  const meta = FOREST_CATEGORY_META[forest.category];
  const color = meta?.color ?? '#0891b2';

  return (
    <div className="h-full flex flex-col overflow-hidden"
      style={{ background: 'rgba(10,15,30,0.97)', borderTop: `2px solid ${color}` }}>

      {/* 헤더 */}
      <div className="flex items-start justify-between px-4 py-3 flex-shrink-0 border-b border-white/8">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded"
              style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
              {meta?.emoji} {forest.category}
            </span>
            <span className="text-[10px] text-slate-500">📍 {forest.region} · {forest.sigungu}</span>
          </div>
          <h2 className="text-base font-black text-slate-100 leading-tight">{forest.name}</h2>
        </div>
        <button onClick={onClose}
          className="text-slate-500 hover:text-slate-200 transition text-xl leading-none flex-shrink-0 mt-1">
          ✕
        </button>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* 시설 뱃지 */}
        <div className="flex gap-2 flex-wrap">
          {forest.has_room && (
            <span className="text-[11px] px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
              🛏 객실
            </span>
          )}
          {forest.has_camp && (
            <span className="text-[11px] px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(8,145,178,0.18)', color: '#22d3ee', border: '1px solid rgba(8,145,178,0.35)' }}>
              ⛺ 야영장
            </span>
          )}
          {forest.has_waitlist && (
            <span className="text-[11px] px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)' }}>
              ⏳ 대기예약
            </span>
          )}
        </div>

        {/* 예약 방식 */}
        <div className="rounded-lg px-3 py-2.5"
          style={{ background: `${color}0d`, border: `1px solid ${color}25` }}>
          <p className="text-[10px] text-cyan-400 mb-1 font-bold">📅 예약 방식</p>
          <p className="text-[12px] text-slate-200 leading-relaxed">
            {forest.fcfs_type
              ? `선착순 · ${forest.fcfs_type}${forest.fcfs_type === '익월말' ? ' 예약' : ''}`
              : '예약처 문의'}
          </p>
          {forest.open_time && (
            <p className="text-[12px] font-bold text-amber-400 mt-1">
              🔔 {forest.fcfs_type === '익월말' ? '다음 달 신청' : '신청'}: {forest.open_time}
            </p>
          )}
        </div>

        {/* 추첨제 / 우선예약 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/25 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-500 mb-1">🎟 추첨제 대상</p>
            <p className="text-[11px] text-slate-300 leading-snug">
              {forest.lottery_targets.length ? forest.lottery_targets.join(', ') : '없음'}
            </p>
          </div>
          <div className="bg-black/25 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-500 mb-1">⭐ 우선예약</p>
            <p className="text-[11px] text-slate-300 leading-snug">
              {forest.priority_targets.length ? forest.priority_targets.join(', ') : '없음'}
            </p>
          </div>
        </div>

        {/* 예약 링크 */}
        <a
          href={forest.reservation_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[11px] font-bold transition w-full"
          style={{
            background: forest.reservation_url ? `${color}10` : 'rgba(255,255,255,0.03)',
            borderColor: `${color}30`,
            color: forest.reservation_url ? color : '#64748b',
            pointerEvents: forest.reservation_url ? 'auto' : 'none',
          }}>
          🔗 {forest.reservation_org || '개별 문의'}{forest.reservation_url ? ' 바로가기 →' : ''}
        </a>

        {forest.note && (
          <p className="text-[10px] text-slate-600">📌 {forest.note}</p>
        )}
      </div>
    </div>
  );
}
