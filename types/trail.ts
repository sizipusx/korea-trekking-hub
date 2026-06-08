// ─────────────────────────────────────────────
// Korea Trekking Hub — Type Definitions
// ─────────────────────────────────────────────

export type Difficulty = '하' | '중하' | '중' | '중상' | '상' | '최상';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type TrailStatus =
  | '운영중'
  | '예약탐방제'
  | '운영중(일부 조성중)'
  | '개통완료(2023)'
  | '개통완료(2024)'
  | '개통완료(2025)'
  | '2026 개통예정'
  | '2027 전면개통예정'
  | '일부 제한운영';

export type TrailCategory =
  | '동서트레일'
  | '국가숲길'
  | '코리아둘레길'
  | '국립공원'
  | '제주 올레'
  | '지자체 트레일'
  | '백두대간';

// ── Supabase DB Row Types ──────────────────────

export interface TrailRow {
  id: string;
  name: string;
  region: string;
  province: string;
  distance_km: number;
  days_required: string;
  difficulty: Difficulty;
  camping: boolean;
  backpacking: boolean;
  category: TrailCategory;
  status: TrailStatus;
  open_year: number | null;
  segments: number | null;
  highlights: string;
  source: string;
  official_url: string;
  created_at: string;
  updated_at: string;
}

export interface TrailGpxRow {
  id: number;
  trail_id: string;
  lat: number;
  lng: number;
  elevation_m: number;
  start_point: string;
}

export interface TrailSeasonRow {
  id: number;
  trail_id: string;
  spring: number;   // 1~5
  summer: number;
  fall: number;
  winter: number;
  note_spring: string;
  note_summer: string;
  note_fall: string;
  note_winter: string;
  best_months: number[];  // [4,5,9,10]
  terrain_tags: string[]; // ['숲길','계곡']
}

export interface UserLogRowBase {
  id: number;
  user_id: string;
  trail_id: string;
  visited_date: string | null;
  status: 'completed' | 'planned' | 'in_progress';
  rating: number | null;   // 1~5
  notes: string;
  photos: string[];        // storage URLs
  created_at: string;
}

// ── Joined / View Types ────────────────────────

export interface Trail extends TrailRow {
  gpx?: TrailGpxRow;
  season?: TrailSeasonRow;
  user_log?: UserLogRowBase;
}

// ── Filter / Query Types ───────────────────────

export interface TrailFilters {
  search?: string;
  category?: TrailCategory | '전체';
  difficulty?: Difficulty | '전체';
  campingOnly?: boolean;
  backpackingOnly?: boolean;
  nowRecommended?: boolean;   // bestMonths includes current month
  province?: string;
}

// ── UI Helper Types ────────────────────────────

export interface SeasonMeta {
  label: string;
  emoji: string;
  months: number[];
}

export const SEASON_META: Record<Season, SeasonMeta> = {
  spring: { label: '봄', emoji: '🌸', months: [3, 4, 5] },
  summer: { label: '여름', emoji: '☀️', months: [6, 7, 8] },
  fall:   { label: '가을', emoji: '🍂', months: [9, 10, 11] },
  winter: { label: '겨울', emoji: '❄️', months: [12, 1, 2] },
};

export const CATEGORY_META: Record<TrailCategory, { color: string; emoji: string }> = {
  '동서트레일':    { color: '#f97316', emoji: '🟠' },
  '국가숲길':      { color: '#22c55e', emoji: '🟢' },
  '코리아둘레길':  { color: '#0ea5e9', emoji: '🔵' },
  '국립공원':      { color: '#a78bfa', emoji: '🟣' },
  '제주 올레':     { color: '#f59e0b', emoji: '🌊' },
  '지자체 트레일': { color: '#ef4444', emoji: '🔴' },
  '백두대간':      { color: '#94a3b8', emoji: '⚫' },
};

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  '하':   '#22c55e',
  '중하': '#84cc16',
  '중':   '#f59e0b',
  '중상': '#f97316',
  '상':   '#ef4444',
  '최상': '#7c3aed',
};

// ── Phase 4 추가 타입 ─────────────────────────────────────────────

export interface UserLogRow {
  id: number;
  user_id: string;
  trail_id: string;
  visited_date: string | null;
  status: 'planned' | 'in_progress' | 'completed';
  rating: number | null;
  notes: string;
  photos: string[];
  duration_days: number | null;
  weather: string;
  companions: string;
  difficulty_felt: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatar_url: string;
  total_km: number;
  trail_count: number;
  created_at: string;
}

export const LOG_STATUS_META = {
  planned:     { label: '탐방 예정', emoji: '📌', color: '#60a5fa' },
  in_progress: { label: '탐방 중',   emoji: '🥾', color: '#f59e0b' },
  completed:   { label: '탐방 완료', emoji: '✅', color: '#22c55e' },
} as const;

export const WEATHER_OPTIONS = ['맑음 ☀️', '흐림 ☁️', '비 🌧️', '눈 ❄️', '안개 🌫️'];
export const COMPANION_OPTIONS = ['혼자', '둘이서', '3~5명', '6명 이상', '단체'];
export const DIFFICULTY_FELT_OPTIONS = ['매우 쉬움', '쉬움', '보통', '힘듦', '매우 힘듦'];
