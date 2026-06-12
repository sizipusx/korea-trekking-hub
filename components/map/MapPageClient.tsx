'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Trail } from '@/types/trail';
import type { ForestRow } from '@/types/forest';
import { FOREST_CATEGORY_META } from '@/types/forest';
import MapSidebar from './MapSidebar';
import TrailDetailPanel from './TrailDetailPanel';
import ForestDetailPanel from './ForestDetailPanel';

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
}

const FOREST_CATS = ['전체', '국립', '공립', '사립'] as const;

export default function MapPageClient({ trails, forests }: Props) {
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [selectedForest, setSelectedForest] = useState<ForestRow | null>(null);
  const [filterCategory, setFilterCategory] = useState('전체');
  const [forestFilterCategory, setForestFilterCategory] = useState('전체');
  const [showForests, setShowForests] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const mappableForests = forests.filter((f) => f.geocoded);

  const handleMarkerClick = (trail: Trail) => {
    setSelectedTrail(trail);
    setSelectedForest(null);
  };
  const handleForestClick = (forest: ForestRow) => {
    setSelectedForest(forest);
    setSelectedTrail(null);
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
          onSelect={(trail) => { setSelectedTrail(trail); setSelectedForest(null); }}
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
            <span className="text-sm font-black text-emerald-100">Korea Trekking Hub</span>
          </div>
          <span className="text-xs text-slate-500">{trails.length}코스 · 🏕{mappableForests.length}</span>
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

        {/* 지도 + 상세 패널 */}
        <div className="flex-1 flex flex-col min-h-0 p-3 gap-3">
          <div className="flex-1 min-h-0 rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <KakaoMapView
              trails={trails}
              forests={mappableForests}
              selectedId={selectedTrail?.id ?? null}
              filterCategory={filterCategory}
              forestFilterCategory={forestFilterCategory}
              showForests={showForests}
              onMarkerClick={handleMarkerClick}
              onForestClick={handleForestClick}
            />
          </div>

          {selectedTrail && (
            <div className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{ height: '220px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <TrailDetailPanel
                trail={selectedTrail}
                currentMonth={currentMonth}
                onClose={() => setSelectedTrail(null)}
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
        </div>
      </div>
    </div>
  );
}
