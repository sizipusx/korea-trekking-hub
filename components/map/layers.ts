// ─────────────────────────────────────────────
// Korea Outdoor Hub — 지도 레이어 정의
//
// 레이어를 하나 더 붙이려면: 정의를 여기에 추가하고, 원본 행을 MapPoint로 바꾸는
// to*Points 함수를 하나 쓰고, 지도 iframe에 팝업 그리는 함수를 하나 추가하면 끝이다.
// 필터바·표시토글·선택이동은 손댈 필요가 없다.
// ─────────────────────────────────────────────

import type { MapLayerDef, MapPoint } from '@/types/mapLayer';
import type { Trail } from '@/types/trail';
import type { ForestRow } from '@/types/forest';
import { FOREST_CATEGORY_META } from '@/types/forest';
import type { CampRow } from '@/types/camp';
import { CAMP_CATEGORY_META, CAMP_CATEGORIES } from '@/types/camp';

// 트레일은 사이드바가 목록을 쥐고 있어 필터바에 올리지 않지만,
// 지도에 찍히는 규칙은 다른 레이어와 똑같이 기술한다.
const TRAIL_COLORS: Record<string, string> = {
  '동서트레일': '#f97316', '국가숲길': '#22c55e', '코리아둘레길': '#0ea5e9',
  '국립공원': '#a78bfa', '제주 올레': '#f59e0b', '지자체 트레일': '#ef4444',
  '백두대간': '#94a3b8',
};
const TRAIL_EMOJIS: Record<string, string> = {
  '동서트레일': '🟠', '국가숲길': '🟢', '코리아둘레길': '🔵',
  '국립공원': '🟣', '제주 올레': '🌊', '지자체 트레일': '🔴',
  '백두대간': '⚫',
};

export const TRAIL_LAYER: MapLayerDef = {
  id: 'trails',
  label: '트레일',
  emoji: '🥾',
  accent: '#10b981',
  barBackground: 'rgba(6,78,59,0.35)',
  categories: ['전체', ...Object.keys(TRAIL_COLORS)],
  defaultVisible: true,
  style: {
    colors: TRAIL_COLORS,
    emojis: TRAIL_EMOJIS,
    defaultColor: '#10b981',
    defaultEmoji: '🗺',
    shape: 'pin',
    zoomLevel: 7,
  },
};

export const FOREST_LAYER: MapLayerDef = {
  id: 'forests',
  label: '휴양림',
  emoji: '🏕',
  accent: '#22d3ee',
  barBackground: 'rgba(8,47,73,0.4)',
  categories: ['전체', '국립', '공립', '사립'],
  defaultVisible: true,
  style: {
    colors: mapMeta(FOREST_CATEGORY_META, 'color'),
    emojis: mapMeta(FOREST_CATEGORY_META, 'emoji'),
    defaultColor: '#0891b2',
    defaultEmoji: '🏕',
    shape: 'house',
    zoomLevel: 6,
  },
};

export const CAMP_LAYER: MapLayerDef = {
  id: 'camps',
  label: '지자체 캠핑장',
  emoji: '⛺',
  accent: '#f472b6',
  barBackground: 'rgba(80,7,36,0.35)',
  categories: [...CAMP_CATEGORIES],
  defaultVisible: true,
  style: {
    colors: mapMeta(CAMP_CATEGORY_META, 'color'),
    emojis: mapMeta(CAMP_CATEGORY_META, 'emoji'),
    defaultColor: '#db2777',
    defaultEmoji: '⛺',
    shape: 'circle',
    zoomLevel: 6,
  },
};

// 필터바에 줄로 나열되는 레이어 (트레일은 사이드바가 담당하므로 빠진다)
export const OVERLAY_LAYERS: MapLayerDef[] = [FOREST_LAYER, CAMP_LAYER];

// 지도에 올라가는 전체 레이어
export const ALL_LAYERS: MapLayerDef[] = [TRAIL_LAYER, ...OVERLAY_LAYERS];

// ── 원본 행 → MapPoint ────────────────────────────
// 좌표가 어디 있든 지도는 lat/lng만 본다.

export function toTrailPoints(trails: Trail[]): MapPoint[] {
  return trails
    .filter((t) => t.gpx)
    .map((t) => ({
      ...t,
      lat: t.gpx!.lat,
      lng: t.gpx!.lng,
    })) as unknown as MapPoint[];
}

export function toForestPoints(forests: ForestRow[]): MapPoint[] {
  return forests as unknown as MapPoint[];
}

export function toCampPoints(camps: CampRow[]): MapPoint[] {
  return camps as unknown as MapPoint[];
}

// META 객체에서 색/이모지만 뽑아 평평한 맵으로
function mapMeta(
  meta: Record<string, { color: string; emoji: string; label: string }>,
  key: 'color' | 'emoji',
): Record<string, string> {
  return Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, v[key]]));
}
