// ─────────────────────────────────────────────
// Korea Outdoor Hub — 지도 레이어 레지스트리 타입
//
// 트레일·휴양림·캠핑장처럼 "점으로 찍히는 데이터"는 마커 모양과 팝업 내용만 다를 뿐
// 초기화·필터·표시토글·선택이동이 전부 같다. 레이어를 값으로 기술해 두고
// 지도·필터바·iframe 메시지가 그 값을 순회하도록 하기 위한 타입들이다.
// 새 레이어(백패킹 장소, 지자체 자전거도로 등)는 정의 한 덩어리만 추가하면 된다.
// ─────────────────────────────────────────────

// 지도에 찍히려면 최소한 이만큼은 있어야 한다.
// 좌표가 원본에서 다른 자리에 있는 레이어(트레일의 gpx.lat 등)는
// 지도로 넘기기 전에 이 모양으로 맞춰서 보낸다.
export interface MapPoint {
  id: string;
  name: string;
  category: string;
  lat: number | null;
  lng: number | null;
  [key: string]: unknown;   // 팝업이 읽는 레이어별 필드
}

// 마커 SVG 종류 — 레이어끼리 한눈에 구분되도록
export type MarkerShape =
  | 'pin'      // 물방울 핀 (트레일)
  | 'house'    // 오각형 집 (휴양림)
  | 'circle';  // 원형 + 꼬리 (캠핑장)

// iframe으로 넘기는 표시 규칙. 색·이모지를 TS 쪽 한 군데서만 정의하고
// 지도는 받은 값으로 그리기만 한다.
export interface MapLayerStyle {
  colors: Record<string, string>;
  emojis: Record<string, string>;
  defaultColor: string;
  defaultEmoji: string;
  shape: MarkerShape;
  zoomLevel: number;          // 항목 선택으로 이동할 때 확대 레벨
}

// 레이어 한 개의 전체 기술
export interface MapLayerDef {
  id: string;                 // 'trails' | 'forests' | 'camps' — iframe 메시지 키이자 상태 키
  label: string;              // '휴양림'
  emoji: string;              // 필터바 머리글 이모지
  accent: string;             // 필터바 강조색
  barBackground: string;      // 필터바 배경
  categories: string[];       // ['전체', '국립', ...] — 필터 칩 순서
  defaultVisible: boolean;
  style: MapLayerStyle;
}

// 부모 → 지도로 넘기는 레이어별 현재 상태
export interface MapLayerState {
  def: MapLayerDef;
  items: MapPoint[];
  filterCategory: string;
  visible: boolean;
  selectedId: string | null;
}
