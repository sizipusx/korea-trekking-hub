'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Trail } from '@/types/trail';
import type { ForestRow } from '@/types/forest';
import type { CampRow } from '@/types/camp';
import type { MapLayerState, MapPoint } from '@/types/mapLayer';
import {
  ALL_LAYERS, OVERLAY_LAYERS,
  toTrailPoints, toForestPoints, toCampPoints,
} from './layers';
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

// 어느 레이어의 어떤 항목이 선택됐는지 — 레이어마다 상태를 따로 두지 않는다
interface Selection { layer: string; id: string; }

export default function MapPageClient({ trails, forests, camps }: Props) {
  // 예약 정보를 지도에서 직접 고칠 수 있으므로 캠핑장은 로컬 상태로 들고 있습니다.
  const [campList, setCampList] = useState<CampRow[]>(camps);
  const [savedCamp, setSavedCamp] = useState<CampRow | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [filters, setFilters] = useState<Record<string, string>>(
    () => Object.fromEntries(ALL_LAYERS.map((l) => [l.id, '전체'])),
  );
  const [visible, setVisible] = useState<Record<string, boolean>>(
    () => Object.fromEntries(ALL_LAYERS.map((l) => [l.id, l.defaultVisible])),
  );

  const currentMonth = new Date().getMonth() + 1;
  const mappableForests = useMemo(() => forests.filter((f) => f.geocoded), [forests]);
  const mappableCamps = useMemo(() => campList.filter((c) => c.geocoded), [campList]);
  // 예약 정보 입력 진척도 — 조금씩 채워가는 작업이라 눈에 보이게 둡니다.
  const filledCount = campList.filter((c) => c.reservation_open || c.use_season).length;

  // 레이어 id → 지도에 넘길 점 목록
  const itemsByLayer = useMemo<Record<string, MapPoint[]>>(() => ({
    trails: toTrailPoints(trails),
    forests: toForestPoints(mappableForests),
    camps: toCampPoints(mappableCamps),
  }), [trails, mappableForests, mappableCamps]);

  const layerStates: MapLayerState[] = ALL_LAYERS.map((def) => ({
    def,
    items: itemsByLayer[def.id] ?? [],
    filterCategory: filters[def.id] ?? '전체',
    visible: visible[def.id] ?? true,
    selectedId: selection?.layer === def.id ? selection.id : null,
  }));

  const select = useCallback((layer: string, id: string) => setSelection({ layer, id }), []);
  const toggleLayer = useCallback((layer: string, v: boolean) => {
    setVisible((prev) => ({ ...prev, [layer]: v }));
  }, []);
  const changeFilter = (layer: string, category: string) => {
    setFilters((prev) => ({ ...prev, [layer]: category }));
    setSelection((prev) => (prev?.layer === layer ? null : prev));
  };

  // 예약 정보 저장 후: 목록·선택 항목·지도 팝업을 모두 최신값으로 교체
  const handleCampSaved = (updated: CampRow) => {
    setCampList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelection({ layer: 'camps', id: updated.id });
    setSavedCamp(updated);
  };

  // 선택된 항목을 레이어별 원본에서 되찾는다
  const selectedTrail = selection?.layer === 'trails'
    ? trails.find((t) => t.id === selection.id) ?? null : null;
  const selectedForest = selection?.layer === 'forests'
    ? forests.find((f) => f.id === selection.id) ?? null : null;
  const selectedCamp = selection?.layer === 'camps'
    ? campList.find((c) => c.id === selection.id) ?? null : null;

  const updatedItem = savedCamp
    ? { layer: 'camps', item: savedCamp as unknown as MapPoint }
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">

      {/* ── 사이드바 (데스크탑) ──────────────────────────── */}
      <div
        className="hidden md:flex flex-col flex-shrink-0 transition-all duration-300"
        style={{ width: sidebarOpen ? '280px' : '0px', overflow: 'hidden' }}>
        <MapSidebar
          trails={trails}
          selectedId={selectedTrail?.id ?? null}
          filterCategory={filters.trails}
          onCategoryChange={(cat) => changeFilter('trails', cat)}
          onSelect={(trail) => select('trails', trail.id)}
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

        {/* ── 레이어별 필터 바 (레지스트리 순회) ────────── */}
        {OVERLAY_LAYERS.map((layer) => {
          const active = filters[layer.id];
          const shown = visible[layer.id];
          return (
            <div key={layer.id}
              className="flex items-center gap-2 px-3 py-2 flex-shrink-0 flex-wrap border-b border-white/8"
              style={{ background: layer.barBackground }}>
              <span className="text-[10px] uppercase tracking-widest mr-1"
                style={{ color: layer.accent }}>
                {layer.emoji} {layer.label}
              </span>

              {layer.categories.map((c) => {
                const on = active === c;
                const col = c === '전체' ? layer.accent : (layer.style.colors[c] ?? layer.style.defaultColor);
                const emoji = layer.style.emojis[c];
                return (
                  <button key={c} onClick={() => changeFilter(layer.id, c)}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition"
                    style={{
                      borderColor: on ? col : 'rgba(255,255,255,0.12)',
                      background: on ? `${col}22` : 'transparent',
                      color: on ? col : '#64748b',
                    }}>
                    {emoji ? `${emoji} ${c}` : c}
                  </button>
                );
              })}

              {/* 캠핑장만 예약 정보 진척도와 내려받기를 함께 보여준다 */}
              {layer.id === 'camps' && (
                <>
                  <span className="ml-auto text-[10px] text-slate-500">
                    📅 예약 정보 {filledCount}/{campList.length}
                  </span>
                  <a href="/api/camps?export=reservation" download
                    className="text-[10px] px-2 py-0.5 rounded-full border transition text-slate-400"
                    style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                    ⬇ CSV
                  </a>
                </>
              )}

              <button onClick={() => toggleLayer(layer.id, !shown)}
                className={`${layer.id === 'camps' ? '' : 'ml-auto'} px-3 py-0.5 rounded-full text-[11px] font-bold border transition`}
                style={{
                  borderColor: shown ? layer.accent : 'rgba(255,255,255,0.12)',
                  background: shown ? `${layer.accent}26` : 'transparent',
                  color: shown ? layer.accent : '#64748b',
                }}>
                {shown ? '👁 표시 중' : '🚫 숨김'}
              </button>
            </div>
          );
        })}

        {/* 지도 + 상세 패널 */}
        <div className="flex-1 flex flex-col min-h-0 p-3 gap-3">
          <div className="flex-1 min-h-0 rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <KakaoMapView
              layers={layerStates}
              updatedItem={updatedItem}
              onSelect={select}
              onToggleRequest={toggleLayer}
            />
          </div>

          {/* 상세 패널은 레이어마다 보여줄 내용이 달라 그대로 둔다 */}
          {selectedTrail && (
            <div className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{ height: '220px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <TrailDetailPanel
                trail={selectedTrail}
                currentMonth={currentMonth}
                onClose={() => setSelection(null)}
                onForestSelect={(f) => select('forests', f.id)}
                onCampSelect={(c) => select('camps', c.id)}
              />
            </div>
          )}

          {selectedForest && (
            <div className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{ height: '220px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <ForestDetailPanel
                forest={selectedForest}
                onClose={() => setSelection(null)}
              />
            </div>
          )}

          {selectedCamp && (
            <div className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{ height: '300px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <CampDetailPanel
                key={selectedCamp.id}
                camp={selectedCamp}
                onClose={() => setSelection(null)}
                onSaved={handleCampSaved}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
