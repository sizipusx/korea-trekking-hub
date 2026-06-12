'use client';

import { useEffect, useState } from 'react';
import type { Trail } from '@/types/trail';
import { CATEGORY_META, DIFFICULTY_COLOR, SEASON_META } from '@/types/trail';
import type { ForestRow } from '@/types/forest';
import { FOREST_CATEGORY_META } from '@/types/forest';

const CAT_COLORS: Record<string, string> = {
  '동서트레일': '#f97316', '국가숲길': '#22c55e', '코리아둘레길': '#0ea5e9',
  '국립공원': '#a78bfa', '제주 올레': '#f59e0b', '지자체 트레일': '#ef4444', '백두대간': '#94a3b8',
};
const scoreColor = (v: number) => v >= 5 ? '#10b981' : v >= 4 ? '#84cc16' : v >= 3 ? '#f59e0b' : '#475569';

interface Props {
  trail: Trail;
  currentMonth: number;
  onClose: () => void;
  onForestSelect?: (forest: ForestRow) => void;   // 주변 휴양림 클릭 시
}

type NearbyForest = ForestRow & { distance_km: number };

export default function TrailDetailPanel({ trail, currentMonth, onClose, onForestSelect }: Props) {
  const catColor = CAT_COLORS[trail.category] ?? '#10b981';
  const catEmoji = CATEGORY_META[trail.category as keyof typeof CATEGORY_META]?.emoji ?? '🗺';

  // ── 주변 휴양림 페칭 ────────────────────────────
  const [nearby, setNearby] = useState<NearbyForest[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  useEffect(() => {
    if (!trail.gpx) { setNearby([]); return; }
    let cancelled = false;
    setLoadingNearby(true);
    fetch(`/api/forests?near=${trail.gpx.lat},${trail.gpx.lng}&radius=25`)
      .then((res) => res.ok ? res.json() : { forests: [] })
      .then((data) => { if (!cancelled) setNearby(data.forests ?? []); })
      .catch(() => { if (!cancelled) setNearby([]); })
      .finally(() => { if (!cancelled) setLoadingNearby(false); });
    return () => { cancelled = true; };
  }, [trail.id, trail.gpx]);

  const currentSeason =
    currentMonth >= 3 && currentMonth <= 5 ? 'spring'
    : currentMonth >= 6 && currentMonth <= 8 ? 'summer'
    : currentMonth >= 9 && currentMonth <= 11 ? 'fall' : 'winter';
  const currentSeasonNote = trail.season?.[`note_${currentSeason}` as keyof typeof trail.season] as string | undefined;
  const currentSeasonScore = trail.season?.[currentSeason as keyof typeof trail.season] as number | undefined;

  return (
    <div className="h-full flex flex-col overflow-hidden"
      style={{ background: 'rgba(10,15,30,0.97)', borderTop: `2px solid ${catColor}` }}>

      {/* 헤더 */}
      <div className="flex items-start justify-between px-4 py-3 flex-shrink-0 border-b border-white/8">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded"
              style={{ background:`${catColor}18`, color:catColor, border:`1px solid ${catColor}30` }}>
              {catEmoji} {trail.category}
            </span>
            {trail.season?.best_months?.includes(currentMonth) && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background:'rgba(16,185,129,0.15)', color:'#10b981', border:'1px solid rgba(16,185,129,0.3)' }}>
                🌟 {currentMonth}월 추천
              </span>
            )}
          </div>
          <h2 className="text-base font-black text-slate-100 leading-tight">{trail.name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">📍 {trail.region} · {trail.province}</p>
        </div>
        <button onClick={onClose}
          className="text-slate-500 hover:text-slate-200 transition text-xl leading-none flex-shrink-0 mt-1">
          ✕
        </button>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* 핵심 수치 */}
        <div className="grid grid-cols-4 gap-2">
          {[
            ['📏 거리', `${trail.distance_km}km`, '#10b981'],
            ['🕐 기간', trail.days_required, '#60a5fa'],
            ['⛰ 난이도', trail.difficulty, DIFFICULTY_COLOR[trail.difficulty] ?? '#f59e0b'],
            ['🎒 백패킹', trail.backpacking ? '가능' : '불가', trail.backpacking ? '#4ade80' : '#64748b'],
          ].map(([label, value, color]) => (
            <div key={label as string} className="bg-white/5 rounded-lg px-2 py-2 text-center border border-white/7">
              <p className="text-[9px] text-slate-500 mb-1">{label}</p>
              <p className="text-xs font-bold" style={{ color: color as string }}>{value}</p>
            </div>
          ))}
        </div>

        {/* 현재 시즌 추천 */}
        {currentSeasonNote && (
          <div className="rounded-lg px-3 py-2.5 border"
            style={{ background:`${scoreColor(currentSeasonScore ?? 3)}0a`, borderColor:`${scoreColor(currentSeasonScore ?? 3)}30` }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold" style={{ color: scoreColor(currentSeasonScore ?? 3) }}>
                {SEASON_META[currentSeason].emoji} 현재 시즌 ({SEASON_META[currentSeason].label}) 가이드
              </span>
              <span className="text-xs" style={{ color: scoreColor(currentSeasonScore ?? 3) }}>
                {'●'.repeat(currentSeasonScore ?? 3)}{'○'.repeat(5 - (currentSeasonScore ?? 3))}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{currentSeasonNote}</p>
          </div>
        )}

        {/* 주요 특징 */}
        <div className="rounded-lg px-3 py-2.5"
          style={{ background:`${catColor}0d`, border:`1px solid ${catColor}25` }}>
          <p className="text-[10px] text-emerald-400 mb-1 font-bold">⭐ 주요 특징</p>
          <p className="text-[11px] text-emerald-200 leading-relaxed">{trail.highlights}</p>
        </div>

        {/* ── 주변 자연휴양림 (반경 25km) ───────────── */}
        <div className="rounded-lg px-3 py-2.5 bg-cyan-950/20 border border-cyan-800/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-cyan-400 font-bold">🏕 주변 자연휴양림 (25km 이내)</p>
            {!loadingNearby && nearby.length > 0 && (
              <span className="text-[10px] text-cyan-600">{nearby.length}곳</span>
            )}
          </div>

          {loadingNearby ? (
            <p className="text-[11px] text-slate-500">불러오는 중...</p>
          ) : nearby.length === 0 ? (
            <p className="text-[11px] text-slate-500">반경 25km 내 등록된 휴양림이 없습니다.</p>
          ) : (
            <div className="space-y-1.5">
              {nearby.map((f) => {
                const fMeta = FOREST_CATEGORY_META[f.category];
                const fColor = fMeta?.color ?? '#0891b2';
                return (
                  <button
                    key={f.id}
                    onClick={() => onForestSelect?.(f)}
                    className="w-full text-left rounded-lg px-2.5 py-2 transition border flex items-center justify-between gap-2"
                    style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px]">{fMeta?.emoji}</span>
                        <span className="text-[12px] font-bold text-slate-100 truncate">{f.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                          style={{ background: `${fColor}18`, color: fColor }}>{f.category}</span>
                        {f.has_room && <span className="text-[9px] text-slate-400">🛏</span>}
                        {f.has_camp && <span className="text-[9px] text-slate-400">⛺</span>}
                        <span className="text-[9px] text-slate-500">{f.sigungu}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold flex-shrink-0" style={{ color: fColor }}>
                      {f.distance_km.toFixed(1)}km
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* GPX 좌표 */}
        {trail.gpx && (
          <div className="rounded-lg px-3 py-2.5 bg-white/[0.03] border border-white/7">
            <p className="text-[10px] text-slate-500 mb-2 font-bold">📍 시작점 정보</p>
            <p className="text-[11px] text-blue-300 mb-2">{trail.gpx.start_point}</p>
            <div className="flex gap-2">
              <a href={`https://map.kakao.com/link/map/${encodeURIComponent(trail.gpx.start_point)},${trail.gpx.lat},${trail.gpx.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="text-[10px] px-2.5 py-1.5 rounded-lg border transition"
                style={{ background:'rgba(0,0,0,0.3)', color:'#60a5fa', borderColor:'rgba(96,165,250,0.3)' }}>
                🗺 카카오맵
              </a>
              <a href={`https://www.google.com/maps/@${trail.gpx.lat},${trail.gpx.lng},13z`}
                target="_blank" rel="noopener noreferrer"
                className="text-[10px] px-2.5 py-1.5 rounded-lg border transition"
                style={{ background:'rgba(0,0,0,0.3)', color:'#60a5fa', borderColor:'rgba(96,165,250,0.3)' }}>
                🌍 구글맵
              </a>
            </div>
          </div>
        )}

        {/* 공식 링크 */}
        {trail.official_url && (
          <a href={trail.official_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[11px] font-bold transition w-full"
            style={{ background:`${catColor}10`, borderColor:`${catColor}30`, color:catColor }}>
            🔗 공식 사이트 바로가기 →
          </a>
        )}
      </div>
    </div>
  );
}
