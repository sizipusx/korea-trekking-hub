// ─────────────────────────────────────────────
// Korea Trekking Hub — Forest(휴양림) Type Definitions
// 자연휴양림 위치 + 예약정책 데이터
// ─────────────────────────────────────────────

// 운영 주체
export type ForestCategory = '국립' | '공립' | '사립';

// 9개 권역 (엑셀 '지역' 컬럼 기준)
export type ForestRegion =
  | '서울인천경기'
  | '강원'
  | '충북'
  | '대전충남'
  | '전북'
  | '광주전남'
  | '대구경북'
  | '부산경남'
  | '제주';

// ── Supabase DB Row Type ───────────────────────
export interface ForestRow {
  id: string;                 // 'nf-yumyeongsan' 등 slug
  name: string;               // '유명산 자연휴양림'
  category: ForestCategory;   // 국립 / 공립 / 사립
  region: ForestRegion;       // 권역
  sigungu: string;            // '가평군'
  address: string;            // 지오코딩에 사용한 전체 주소 (있으면)

  lat: number | null;         // 위도  (지오코딩 결과)
  lng: number | null;         // 경도
  geocoded: boolean;          // 좌표 확보 여부

  // ── 시설 ──
  has_room: boolean;          // 객실
  has_camp: boolean;          // 야영장
  has_waitlist: boolean;      // 대기예약

  // ── 예약 방식 ──
  fcfs_type: string;          // 선착순 유형: '6주', '4주', '익월말' 등
  open_time: string;          // 예약 오픈 시각 안내: '매주 수요일 09시' 등
  lottery_targets: string[];  // 추첨제 대상: ['주말','성수기','장애인',...]
  priority_targets: string[]; // 우선예약: ['바우처','아세안',...]

  reservation_url: string;    // 예약 사이트
  reservation_org: string;    // 예약 운영기관
  note: string;

  created_at?: string;
  updated_at?: string;
}

// 연계용: 트레일과 거리 계산이 붙은 형태
export interface ForestWithDistance extends ForestRow {
  distance_to_trail_km?: number;
}

// ── Filter / Query Types ───────────────────────
export interface ForestFilters {
  search?: string;
  category?: ForestCategory | '전체';
  region?: ForestRegion | '전체';
  campingOnly?: boolean;      // 야영장 보유만
  roomOnly?: boolean;         // 객실 보유만
}

// ── UI Helper ──────────────────────────────────
export const FOREST_CATEGORY_META: Record<
  ForestCategory,
  { color: string; emoji: string; label: string }
> = {
  '국립': { color: '#16a34a', emoji: '🌲', label: '국립' },
  '공립': { color: '#0891b2', emoji: '🏕', label: '공립' },
  '사립': { color: '#d97706', emoji: '🏡', label: '사립' },
};

// 예약 운영기관 (구분별 기본 예약처)
export const RESERVATION_ORG: Record<ForestCategory, { org: string; url: string }> = {
  // 국립자연휴양림 통합 예약
  '국립': { org: '숲나들e (국립자연휴양림관리소)', url: 'https://www.huyang.go.kr' },
  // 공립은 지자체별 상이 → 숲나들e 또는 각 시군 예약시스템
  '공립': { org: '숲나들e / 지자체 예약시스템', url: 'https://www.foresttrip.go.kr' },
  // 사립은 개별 홈페이지
  '사립': { org: '개별 휴양림 홈페이지', url: '' },
};

export const FOREST_REGIONS: (ForestRegion | '전체')[] = [
  '전체', '서울인천경기', '강원', '충북', '대전충남',
  '전북', '광주전남', '대구경북', '부산경남', '제주',
];
