'use client';

import { useState } from 'react';
import type { Trail } from '@/types/trail';
import { CATEGORY_META, DIFFICULTY_COLOR, SEASON_META } from '@/types/trail';

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  '운영중':                { bg:'#052e16', text:'#4ade80', border:'#166534' },
  '예약탐방제':            { bg:'#1c1917', text:'#fb923c', border:'#9a3412' },
  '운영중(일부 조성중)':   { bg:'#1e1b4b', text:'#818cf8', border:'#3730a3' },
  '개통완료(2023)':        { bg:'#052e16', text:'#4ade80', border:'#166534' },
  '개통완료(2024)':        { bg:'#052e16', text:'#4ade80', border:'#166534' },
  '개통완료(2025)':        { bg:'#052e16', text:'#4ade80', border:'#166534' },
  '2026 개통예정':         { bg:'#1e3a5f', text:'#60a5fa', border:'#1d4ed8' },
  '2027 전면개통예정':     { bg:'#1e3a5f', text:'#60a5fa', border:'#1d4ed8' },
  '일부 제한운영':         { bg:'#3b1515', text:'#f87171', border:'#991b1b' },
};

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

const scoreDots = (score: number) =>
  '●'.repeat(score) + '○'.repeat(5 - score);

const scoreColor = (v: number) => {
  if (v >= 5) return '#10b981';
  if (v >= 4) return '#84cc16';
  if (v >= 3) return '#f59e0b';
  return '#475569';
};

interface Props {
  trail: Trail;
  isOpen: boolean;
  currentMonth: number;
  onToggle: () => void;
}

type Tab = 'info' | 'season' | 'gpx';

export default function TrailCard({ trail, isOpen, currentMonth, onToggle }: Props) {
  const [tab, setTab] = useState<Tab>('info');

  const catMeta = CATEGORY_META[trail.category];
  const catColor = catMeta?.color ?? '#10b981';
  const diffColor = DIFFICULTY_COLOR[trail.difficulty] ?? '#f59e0b';
  const sb = STATUS_STYLE[trail.status] ?? STATUS_STYLE['운영중'];
  const isNowGood = trail.season?.best_months?.includes(currentMonth);

  return (
    <div
      className="rounded-xl border transition-all cursor-pointer"
      style={{
        background: isOpen ? `${catColor}0a` : 'rgba(255,255,255,0.025)',
        borderColor: isOpen ? `${catColor}55` : 'rgba(255,255,255,0.07)',
      }}
      onClick={onToggle}
    >
      {/* ── SUMMARY ROW ─────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3">
        {/* Left */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded"
            style={{ background:`${catColor}18`, color:catColor, border:`1px solid ${catColor}30` }}>
            {catMeta?.emoji} {trail.category}
          </span>
          <span className="text-sm font-bold text-slate-100">{trail.name}</span>
          <span className="text-[10px] text-slate-500">📍 {trail.province}</span>
          {isNowGood && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background:'rgba(16,185,129,0.15)', color:'#10b981', border:'1px solid rgba(16,185,129,0.3)' }}>
              🌟 {currentMonth}월 추천
            </span>
          )}
        </div>
        {/* Right */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {trail.camping && <span title="캠핑 가능">⛺</span>}
          {trail.backpacking && <span title="백패킹 가능">🎒</span>}
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background:sb.bg, color:sb.text, border:`1px solid ${sb.border}` }}>
            {trail.status}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background:`${diffColor}18`, color:diffColor, border:`1px solid ${diffColor}30` }}>
            난이도 {trail.difficulty}
          </span>
          <span className="text-sm font-black text-emerald-400 min-w-[54px] text-right">
            {trail.distance_km}km
          </span>
        </div>
      </div>

      {/* ── DETAIL PANEL ────────────────────────── */}
      {isOpen && (
        <div
          className="px-4 pb-4 border-t"
          style={{ borderColor: `${catColor}25` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* TABS */}
          <div className="flex gap-2 mt-3 mb-4">
            {(['info','season','gpx'] as Tab[]).map((k) => {
              const labels: Record<Tab, string> = { info:'📋 기본정보', season:'🌸 시즌 가이드', gpx:'📍 GPX 정보' };
              return (
                <button key={k} onClick={() => setTab(k)}
                  className="px-3 py-1 rounded-lg text-[11px] font-bold border transition"
                  style={{
                    borderColor: tab===k ? catColor : 'rgba(255,255,255,0.12)',
                    background:  tab===k ? `${catColor}22` : 'transparent',
                    color:       tab===k ? catColor : '#64748b',
                  }}>
                  {labels[k]}
                </button>
              );
            })}
          </div>

          {/* TAB: 기본정보 */}
          {tab === 'info' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {([
                  ['🕐 소요 기간', trail.days_required],
                  ['📍 주요 지역', trail.region],
                  ['⛺ 캠핑', trail.camping ? '✅ 가능' : '❌ 불가'],
                  ['🎒 백패킹', trail.backpacking ? '✅ 적합' : '❌ 미적합'],
                  ...(trail.segments ? [['🗂️ 구간 수', `${trail.segments}개 구간`]] : []),
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="bg-black/25 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
                    <p className="text-xs font-semibold text-slate-300">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg px-3 py-2.5 text-xs text-emerald-200 leading-relaxed"
                style={{ background:`${catColor}0e`, border:`1px solid ${catColor}25` }}>
                <p className="text-[10px] text-emerald-400 mb-1">⭐ 주요 특징</p>
                {trail.highlights}
              </div>
              {trail.source && (
                <p className="text-[10px] text-slate-600">📌 출처: {trail.source}</p>
              )}
            </div>
          )}

          {/* TAB: 시즌 가이드 */}
          {tab === 'season' && trail.season && (
            <div className="space-y-3">
              {/* 월별 히트맵 */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">📅 월별 추천 캘린더</p>
                <div className="flex flex-wrap gap-1.5">
                  {MONTHS.map((m, i) => {
                    const mn = i + 1;
                    const isGood = trail.season!.best_months?.includes(mn);
                    const isCurrent = mn === currentMonth;
                    return (
                      <div key={m} className="w-11 text-center rounded-lg py-1.5"
                        style={{
                          background: isGood ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                          border: isCurrent ? '2px solid #10b981' : `1px solid ${isGood ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        }}>
                        <p className="text-[9px]" style={{ color: isCurrent ? '#10b981' : '#64748b', fontWeight: isCurrent ? 800 : 400 }}>{m}</p>
                        <p className="text-sm mt-0.5">{isGood ? '✅' : '⬜'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 시즌 카드 */}
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(SEASON_META) as [keyof typeof SEASON_META, typeof SEASON_META[keyof typeof SEASON_META]][]).map(([key, meta]) => {
                  const score = trail.season![key] ?? 0;
                  const note = trail.season![`note_${key}` as keyof typeof trail.season] as string;
                  return (
                    <div key={key} className="rounded-xl p-3"
                      style={{ background:`${scoreColor(score)}0f`, border:`1px solid ${scoreColor(score)}30` }}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-slate-300">{meta.emoji} {meta.label}</span>
                        <span className="text-sm" style={{ color: scoreColor(score) }}>{scoreDots(score)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{note || '정보 없음'}</p>
                    </div>
                  );
                })}
              </div>

              {/* 지형 태그 */}
              {trail.season.terrain_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {trail.season.terrain_tags.map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-white/7 border border-white/10 text-slate-400">
                      🏷 {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: GPX 정보 */}
          {tab === 'gpx' && trail.gpx && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  ['📍 시작점', trail.gpx.start_point],
                  ['🌐 위도', `${trail.gpx.lat}°N`],
                  ['🌐 경도', `${trail.gpx.lng}°E`],
                  ['⛰️ 시작 고도', `${trail.gpx.elevation_m}m`],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="bg-black/25 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
                    <p className="text-xs font-semibold text-blue-300">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-3 bg-sky-900/20 border border-sky-700/30">
                <p className="text-[10px] text-sky-400 font-bold mb-2">🗺️ 지도에서 보기</p>
                <div className="flex gap-2">
                  <a
                    href={`https://map.kakao.com/link/map/${encodeURIComponent(trail.gpx.start_point)},${trail.gpx.lat},${trail.gpx.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-black/30 text-blue-300 border border-blue-800/50 hover:bg-blue-900/30 transition"
                    onClick={(e) => e.stopPropagation()}>
                    🗺 카카오맵 →
                  </a>
                  <a
                    href={`https://www.google.com/maps/@${trail.gpx.lat},${trail.gpx.lng},13z`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-black/30 text-blue-300 border border-blue-800/50 hover:bg-blue-900/30 transition"
                    onClick={(e) => e.stopPropagation()}>
                    🌍 구글맵 →
                  </a>
                </div>
              </div>

              <div className="bg-black/20 rounded-lg px-3 py-2 border border-white/7">
                <p className="text-[10px] text-slate-500 mb-1">📌 GPX 파일 안내</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  전체 루트 GPX 파일은 각 공식 사이트 또는 두루누비·숲나들이 앱에서 다운로드 가능합니다.
                  Phase 3에서 카카오맵 API 연동 시 전체 루트 시각화 예정.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
