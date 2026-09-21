// ─────────────────────────────────────────────
// Korea Outdoor Hub — 활동 기록 타입
//
// 기록이 트레일에 묶여 있던 것을 (활동, 장소) 조합으로 넓힌 형태.
// 장소는 지도 레이어와 같은 축을 쓴다 — trail / forest / camp,
// 그리고 아직 데이터로 없는 곳을 적을 때를 위한 none.
// ─────────────────────────────────────────────

export type ActivityKind = 'riding' | 'backpacking' | 'camping' | 'trekking';
export type PlaceType = 'trail' | 'forest' | 'camp' | 'none';
export type LogStatus = 'planned' | 'in_progress' | 'completed';

export interface ActivityLogRow {
  id: number;
  user_id: string;

  activity: ActivityKind;
  place_type: PlaceType;
  place_id: string | null;    // none 이면 null
  place_name: string;         // 원본이 사라져도 읽히도록 복사해 둔 이름

  visited_date: string | null;
  status: LogStatus;
  rating: number | null;      // 1~5
  distance_km: number | null; // 실제 이동 거리
  duration_days: number | null;
  weather: string;
  companions: string;
  difficulty_felt: string;
  notes: string;
  photos: string[];

  created_at: string;
  updated_at: string;
}

// 기록을 가리키는 키 — upsert 대상이 이 조합이다
export interface ActivityLogKey {
  activity: ActivityKind;
  placeType: PlaceType;
  placeId: string | null;
}

export const ACTIVITY_META: Record<
  ActivityKind,
  { label: string; emoji: string; color: string }
> = {
  riding:      { label: '라이딩',  emoji: '🚲', color: '#60a5fa' },
  backpacking: { label: '백패킹',  emoji: '🎒', color: '#a78bfa' },
  camping:     { label: '캠핑',    emoji: '⛺', color: '#f472b6' },
  trekking:    { label: '트레킹',  emoji: '🥾', color: '#10b981' },
};

// 관심 순서대로 — 폼의 기본 선택은 맨 앞
export const ACTIVITIES: ActivityKind[] = ['riding', 'backpacking', 'camping', 'trekking'];

export const PLACE_TYPE_META: Record<
  PlaceType,
  { label: string; emoji: string; layerId: string | null }
> = {
  trail:  { label: '트레일',     emoji: '🥾', layerId: 'trails' },
  forest: { label: '휴양림',     emoji: '🏕', layerId: 'forests' },
  camp:   { label: '캠핑장',     emoji: '⛺', layerId: 'camps' },
  none:   { label: '직접 입력',  emoji: '📍', layerId: null },
};

// 상태 문구는 활동에 상관없이 쓰이도록 '탐방'을 뺀다
export const LOG_STATUS_META: Record<
  LogStatus,
  { label: string; emoji: string; color: string }
> = {
  planned:     { label: '예정',   emoji: '📌', color: '#60a5fa' },
  in_progress: { label: '진행 중', emoji: '🚶', color: '#f59e0b' },
  completed:   { label: '완료',   emoji: '✅', color: '#22c55e' },
};
