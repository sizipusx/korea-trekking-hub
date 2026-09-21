// ─────────────────────────────────────────────
// Korea Outdoor Hub — Camp(지자체 운영 공공 캠핑장) Type Definitions
// 위치 + 예약정책 데이터 (자연휴양림 forests 와 동일한 구조)
// ─────────────────────────────────────────────

// 야영장 유형
export type CampCategory = '일반야영장' | '자동차야영장' | '카라반' | '글램핑';

// 운영 주체 층위
export type CampOperatorLevel =
  | '기초자치단체'          // 시청 · 군청 · 구청
  | '광역자치단체'          // 시도청 · 도 산하 기관
  | '지방공기업·출자출연기관'; // 시설관리공단 · 도시공사 · 관광공사

// 9개 권역 (forests 와 동일)
export type CampRegion =
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
export interface CampRow {
  id: string;                 // 'camp-31594' (공유누리 eve_no) / 'camp-gc-001' (고캠핑 보강분)
  name: string;               // '자라섬캠핑장'
  category: CampCategory;     // 대표 유형
  type_detail: string;        // 원본 유형 문자열 ('일반야영장/자동차야영장' 등)
  region: CampRegion;         // 권역
  sido: string;               // '경기도'
  sigungu: string;            // '가평군'
  address: string;

  lat: number | null;
  lng: number | null;
  geocoded: boolean;          // 좌표 확보 여부 (지도 표시 조건)

  // ── 운영 주체 ──
  operator: string;           // '가평군청', '충주시설관리공단'
  operator_level: CampOperatorLevel | '';
  operator_verified: boolean; // 공유누리 원천 = true, 고캠핑 명칭 추정 = false

  tel: string;
  facilities: string;         // '일반캠핑존(83면), 전기시설, 샤워시설...'

  // ── 예약 정보 (가장 중요) ──
  reservation_org: string;    // 예약 운영기관
  reservation_url: string;    // 예약/안내 페이지
  reservation_open: string;   // 예약 오픈 규칙 — '이용월 1개월 전 1일 09시' 등. 빈 값 = 미확인
  use_season: string;         // 운영(이용) 기간 — '연중', '3~11월' 등. 빈 값 = 미확인
  reservation_note: string;
  reservation_verified: boolean;   // 예약 오픈 규칙을 확인해 채웠는지 여부
  reservation_updated_by?: string | null; // 지도에서 직접 입력한 사용자
  reservation_updated_at?: string | null;

  source: string;             // 데이터 출처
  created_at?: string;
  updated_at?: string;
}

// 연계용: 트레일과 거리 계산이 붙은 형태
export interface CampWithDistance extends CampRow {
  distance_to_trail_km?: number;
}

// ── Filter / Query Types ───────────────────────
export interface CampFilters {
  search?: string;
  category?: CampCategory | '전체';
  region?: CampRegion | '전체';
  reservedOnly?: boolean;   // 예약 정보(오픈 규칙) 확인된 곳만
  verifiedOnly?: boolean;   // 운영주체 검증된 곳만
}

// ── UI Helper ──────────────────────────────────
export const CAMP_CATEGORY_META: Record<
  CampCategory,
  { color: string; emoji: string; label: string }
> = {
  '일반야영장':   { color: '#db2777', emoji: '⛺', label: '일반야영장' },
  '자동차야영장': { color: '#ec4899', emoji: '🚐', label: '자동차야영장' },
  '카라반':       { color: '#fb7185', emoji: '🚚', label: '카라반' },
  '글램핑':       { color: '#f472b6', emoji: '✨', label: '글램핑' },
};

export const CAMP_CATEGORIES: (CampCategory | '전체')[] = [
  '전체', '일반야영장', '자동차야영장', '카라반', '글램핑',
];

export const CAMP_REGIONS: (CampRegion | '전체')[] = [
  '전체', '서울인천경기', '강원', '충북', '대전충남',
  '전북', '광주전남', '대구경북', '부산경남', '제주',
];

// 예약 정보 표시용 — 빈 값일 때 UI에 쓸 안내 문구
export const RESERVATION_UNKNOWN = '예약 오픈 규칙 미확인 (예약처 직접 확인 필요)';
