// ─────────────────────────────────────────────
// Korea Trekking Hub — Raw Course Types
// CSV / GPX / GeoJSON 분석 데이터 타입 정의
// ─────────────────────────────────────────────

export type RawCourseSource = 'GPX' | 'CSV';

export type RawCourseCategory =
  | '등산로'
  | '둘레길'
  | '숲길'
  | '트레킹길'
  | '테마길'
  | '오름'
  | '섬트레킹'
  | '문화길'
  | '국가숲길'
  | '정맥종주'
  | '종주'
  | '기타';

// ── Supabase DB Row ────────────────────────────
export interface RawCourseRow {
  id: number;
  course_name: string;
  category: RawCourseCategory;
  dataset_name: string;         // 예: '100대명산', '백두대간'
  subcategory: string;          // GPX 서브폴더명 or CSV 지역
  region: string;               // 광역 시도
  distance_km: number | null;
  elev_gain_m: number | null;   // 누적 상승고도 (GPX만)
  elev_loss_m: number | null;   // 누적 하강고도 (GPX만)
  est_time: string | null;      // Naismith 예상 소요시간
  difficulty: string | null;    // CSV 원천 데이터의 난이도
  start_lat: number | null;
  start_lng: number | null;
  address: string | null;
  gpx_path: string | null;      // GPX 파일 상대 경로
  source: RawCourseSource;
  created_at: string;
}

// ── Filter / Query Types ───────────────────────
export interface RawCourseFilters {
  search?: string;
  category?: RawCourseCategory | '전체';
  dataset?: string;
  region?: string;
  minKm?: number;
  maxKm?: number;
  hasElevation?: boolean;
  hasCoords?: boolean;
  source?: RawCourseSource | '전체';
}

// ── Stats Type ─────────────────────────────────
export interface RawCourseStats {
  total: number;
  gpxCount: number;
  csvCount: number;
  withElevation: number;
  withCoords: number;
  totalKm: number;
  byCategory: Record<string, number>;
  byDataset: Record<string, number>;
  distanceDistribution: { label: string; count: number }[];
}

// ── Category 메타 ──────────────────────────────
export const RAW_CATEGORY_META: Record<RawCourseCategory, { emoji: string; color: string }> = {
  '등산로':   { emoji: '🏔️', color: '#ef4444' },
  '둘레길':   { emoji: '🔄', color: '#22c55e' },
  '숲길':     { emoji: '🌲', color: '#16a34a' },
  '트레킹길': { emoji: '🥾', color: '#3b82f6' },
  '테마길':   { emoji: '🎭', color: '#a855f7' },
  '오름':     { emoji: '🌋', color: '#f97316' },
  '섬트레킹': { emoji: '🏝️', color: '#06b6d4' },
  '문화길':   { emoji: '🏛️', color: '#f59e0b' },
  '국가숲길': { emoji: '🌿', color: '#10b981' },
  '정맥종주': { emoji: '⛰️', color: '#dc2626' },
  '종주':     { emoji: '🗻', color: '#7c3aed' },
  '기타':     { emoji: '📍', color: '#64748b' },
};
