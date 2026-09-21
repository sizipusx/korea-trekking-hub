'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Trail } from '@/types/trail';
import type { ForestRow } from '@/types/forest';
import { FOREST_CATEGORY_META } from '@/types/forest';
import type { CampRow } from '@/types/camp';
import { CAMP_CATEGORY_META, CAMP_CATEGORIES } from '@/types/camp';
import MapSidebar from './MapSidebar';
import TrailDetailPanel from './TrailDetailPanel';
import ForestDetailPanel from './ForestDetailPanel';
import CampDetailPanel from './CampDetailPanel';

const KakaoMapView = dynamic(() => import('./KakaoMapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-xl">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-emerald-400">지도 초기화 중...</p>
      </div>
    </div>
  ),
});

interface Props {
  trails: Trail[];
  forests: ForestRow[];
  camps: CampRow[];
}

const FOREST_CATS = ['전체', '국립', '공립', '사립'] as const;

export default function MapPageClient({ trails, forests, camps }: Props) {
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [selectedForest, setSelectedForest] = useState<ForestRow | null>(null);
  const [selectedCamp, setSelectedCamp] = useState<CampRow | null>(null);
  // 예약 정보를 지도에서 직접 고칠 수 있으므로 캠핑장은 로컬 상태로 들고 있습니다.
  const [campList, setCampList] = useState<CampRow[]>(camps);
  const [savedCamp, setSavedCamp] = useState<CampRow | null>(null);
  const [filterCategory, setFilterCategory] = useState('전체');
  const [forestFilterCategory, setForestFilterCategory] = useState('전체');
  const [campFilterCategory, setCampFilterCategory] = useState('전체');
  const [showForests, setShowForests] = useState(true);
  const [showCamps, setShowCamps] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const mappableForests = forests.filter((f) => f.geocoded);
  const mappableCamps = campList.filter((c) => c.geocoded);
  // 예약 정보 입력 진척도 — 조금씩 채워가는 작업이라 눈에 보이게 둡니다.
  const filledCount = campList.filter((c) => c.reservation_open || c.use_season).length;

  const handleMarkerClick = (trail: Trail) => {
    setSelectedTrail(trail);
    setSelectedForest(null);
    setSelectedCamp(null);
  };
  const handleForestClick = (forest: ForestRow) => {
    setSelectedForest(forest);
    setSelectedTrail(null);
    setSelectedCamp(null);
  };
  const handleCampClick = (camp: CampRow) => {
    setSelectedCamp(camp);
    setSelectedTrail(null);
    setSelectedForest(null);
  };
  // 예약 정보 저장 후: 목록·선택 항목·지도 팝업을 모두 최신값으로 교체
  const handleCampSaved = (updated: CampRow) => {
    setCampList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCamp(updated);
    setSavedCamp(updated);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">

      {/* ── 사이드바 (데스크탑) ──────────────────────────── */}
      <div
        className="hidden md:flex flex-col flex-shrink-0 transition-all duration-300"
        style={{ width: sidebarOpen ? '280px' : '0px', overflow: 'hidden' }}>
        <MapSidebar
          trails={trails}
          selectedId={selectedTrail?.id ?? null}
          filterCategory={filterCategory}
          onCategoryChange={(cat) => { setFilterCategory(cat); setSelectedTrail(null); }}
          onSelect={(trail) => { setSelectedTrail(trail); setSelectedForest(null); setSelectedCamp(null); }}
          currentMonth={currentMonth}
          forestCount={mappableForests.length}
        />
      </div>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 items-center justify-center w-5 h-12 rounded-r-lg text-xs transition"
        style={{
          left: sidebarOpen ? '280px' : '0px',
          background: 'rgba(16,185,129,0.2)',
          border: '1px solid rgba(16,185,129,0.4)',
          color: '#10b981',
        }}>
        {sidebarOpen ? '◀' : '▶'}
      </button>

      {/* ── 메인 영역 ─────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* 모바일 상단 바 */}
        <div className="flex md:hidden items-center justify-between px-3 py-2 border-b border-white/8 flex-shrink-0"
          style={{ background: 'rgba(5,46,22,0.95)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🥾</span>
            <span className="text-sm font-black text-emerald-100">Korea Outdoor Hub</span>
          </div>
          <span className="text-xs text-slate-500">
            {trails.length}코스 · 🏕{mappableForests.length} · ⛺{mappableCamps.length}
          </span>
        </div>

        {/* 휴양림 필터 바 */}
        <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0 flex-wrap border-b border-white/8"
          style={{ background: 'rgba(8,47,73,0.4)' }}>
          <span className="text-[10px] text-cyan-500 uppercase tracking-widest mr-1">🏕 휴양림</span>
          {FOREST_CATS.map((c) => {
            const active = forestFilterCategory === c;
            const col = c === '전체' ? '#22d3ee' : FOREST_CATEGORY_META[c]?.color ?? '#0891b2';
            return (
              <button key={c} onClick={() => { setForestFilterCategory(c); setSelectedForest(null); }}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition"
                style={{
                  borderColor: active ? col : 'rgba(255,255,255,0.12)',
                  background: active ? `${col}22` : 'transparent',
                  color: active ? col : '#64748b',
                }}>
                {c === '전체' ? '전체' : `${FOREST_CATEGORY_META[c].emoji} ${c}`}
              </button>
            );
          })}
          <button onClick={() => setShowForests(!showForests)}
            className="ml-auto px-3 py-0.5 rounded-full text-[11px] font-bold border transition"
            style={{
              borderColor: showForests ? '#22d3ee' : 'rgba(255,255,255,0.12)',
              background: showForests ? 'rgba(34,211,238,0.15)' : 'transparent',
              color: showForests ? '#22d3ee' : '#64748b',
            }}>
            {showForests ? '👁 표시 중' : '🚫 숨김'}
          </button>
        </div>

        {/* 지자체 캠핑장 필터 바 */}
        <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0 flex-wrap border-b border-white/8"
          style={{ background: 'rgba(80,7,36,0.35)' }}>
          <span className="text-[10px] text-pink-400 uppercase tracking-widest mr-1">⛺ 지자체 캠핑장</span>
          {CAMP_CATEGORIES.map((c) => {
            const active = campFilterCategory === c;
            const meta = c === '전체' ? null : CAMP_CATEGORY_META[c];
            const col = meta?.color ?? '#f472b6';
            return (
              <button key={c} onClick={() => { setCampFilterCategory(c); setSelectedCamp(null); }}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition"
                style={{
                  borderColor: active ? col : 'rgba(255,255,255,0.12)',
                  background: active ? `${col}22` : 'transparent',
                  color: active ? col : '#64748b',
                }}>
                {meta ? `${meta.emoji} ${c}` : '전체'}
              </button>
            );
          })}
          {/* 예약 정보 입력 진척도 + 현재 내용 CSV로 내려받기 */}
          <span className="ml-auto text-[10px] text-slate-500">
            📅 예약 정보 {filledCount}/{campList.length}
          </span>
          <a href="/api/camps?export=reservation" download
            className="text-[10px] px-2 py-0.5 rounded-full border transition text-slate-400"
            style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
            ⬇ CSV
          </a>
          <button onClick={() => setShowCamps(!showCamps)}
            className="px-3 py-0.5 rounded-full text-[11px] font-bold border transition"
            style={{
              borderColor: showCamps ? '#f472b6' : 'rgba(255,255,255,0.12)',
              background: showCamps ? 'rgba(244,114,182,0.15)' : 'transparent',
              color: showCamps ? '#f472b6' : '#64748b',
            }}>
            {showCamps ? '👁 표시 중' : '🚫 숨김'}
          </button>
        </div>

        {/* 지도 + 상세 패널 */}
        <div className="flex-1 flex flex-col min-h-0 p-3 gap-3">
          <div className="flex-1 min-h-0 rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <KakaoMapView
              trails={trails}
              forests={mappableForests}
              camps={mappableCamps}
              updatedCamp={savedCamp}
              selectedId={selectedTrail?.id ?? null}
              selectedForestId={selectedForest?.id ?? null}
              selectedCampId={selectedCamp?.id ?? null}
              filterCategory={filterCategory}
              forestFilterCategory={forestFilterCategory}
              campFilterCategory={campFilterCategory}
              showForests={showForests}
              showCamps={showCamps}
              onMarkerClick={handleMarkerClick}
              onForestClick={handleForestClick}
              onCampClick={handleCampClick}
            />
          </div>

          {selectedTrail && (
            <div className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{ height: '220px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <TrailDetailPanel
                trail={selectedTrail}
                currentMonth={currentMonth}
                onClose={() => setSelectedTrail(null)}
                onForestSelect={handleForestClick}
                onCampSelect={handleCampClick}
              />
            </div>
          )}

          {selectedForest && (
            <div className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{ height: '220px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <ForestDetailPanel
                forest={selectedForest}
                onClose={() => setSelectedForest(null)}
              />
            </div>
          )}

          {selectedCamp && (
            <div className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{ height: '300px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <CampDetailPanel
                key={selectedCamp.id}
                camp={selectedCamp}
                onClose={() => setSelectedCamp(null)}
                onSaved={handleCampSaved}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
