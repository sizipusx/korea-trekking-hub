'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Trail } from '@/types/trail';
import MapSidebar from './MapSidebar';
import TrailDetailPanel from './TrailDetailPanel';

// 카카오맵은 SSR 완전 비활성화 (window 사용)
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
}

export default function MapPageClient({ trails }: Props) {
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [filterCategory, setFilterCategory] = useState('전체');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentMonth = new Date().getMonth() + 1;

  const handleMarkerClick = (trail: Trail) => {
    setSelectedTrail(trail);
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
          onSelect={(trail) => setSelectedTrail(trail)}
          currentMonth={currentMonth}
        />
      </div>

      {/* ── 사이드바 토글 버튼 ──────────────────────────── */}
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
          <span className="text-xs text-slate-500">{trails.length}개 코스</span>
        </div>

        {/* 지도 + 상세 패널 */}
        <div className="flex-1 flex flex-col min-h-0 p-3 gap-3">

          {/* 지도 영역 */}
          <div className="flex-1 min-h-0 rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <KakaoMapView
              trails={trails}
              selectedId={selectedTrail?.id ?? null}
              filterCategory={filterCategory}
              onMarkerClick={handleMarkerClick}
            />
          </div>

          {/* 하단 상세 패널 (선택 시 표시) */}
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
        </div>
      </div>
    </div>
  );
}
