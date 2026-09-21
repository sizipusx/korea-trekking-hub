'use client';
// components/map/KakaoMapView.tsx — 카카오맵 iframe 래퍼
//
// 레이어별 분기를 두지 않는다. 부모가 넘긴 layers 배열을 순회하며
// 초기화 / 데이터교체 / 필터 / 표시토글 / 선택이동 메시지를 보낼 뿐이다.
// 새 레이어가 늘어도 이 파일은 그대로다.

import { useCallback, useEffect, useRef } from 'react';
import type { MapLayerState, MapPoint } from '@/types/mapLayer';

interface Props {
  layers: MapLayerState[];
  /** 부모에서 값을 고친 항목 하나만 지도 쪽 배열에 반영 (캠핑장 예약 정보 입력 등) */
  updatedItem: { layer: string; item: MapPoint } | null;
  onSelect: (layerId: string, id: string) => void;
  /** 지도 안 레이어 버튼이 누른 표시/숨김 요청 — 상태는 부모가 쥔다 */
  onToggleRequest: (layerId: string, visible: boolean) => void;
}

export default function KakaoMapView({ layers, updatedItem, onSelect, onToggleRequest }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  // 메시지를 보낼 때 최신 레이어 상태를 읽어야 해서 ref로도 들고 있는다
  const layersRef = useRef(layers);
  useEffect(() => { layersRef.current = layers; });

  const post = useCallback((msg: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(msg, '*');
  }, []);

  // 지도가 뜬 직후엔 현재 상태 전체를 한 번에 밀어 넣는다.
  // (필터나 표시토글을 만져둔 뒤 지도가 늦게 뜨는 경우에도 어긋나지 않도록)
  const pushAll = useCallback(() => {
    layersRef.current.forEach((l) => {
      post({ type: 'INIT_LAYER', layer: l.def.id, def: l.def, items: l.items });
      post({ type: 'FILTER', layer: l.def.id, category: l.filterCategory });
      post({ type: 'TOGGLE', layer: l.def.id, visible: l.visible });
    });
  }, [post]);

  // 지도 → 부모 메시지 수신
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === 'MAP_READY') {
        readyRef.current = true;
        pushAll();
      }
      if (e.data.type === 'LAYER_CLICK') {
        onSelect(e.data.layer, e.data.id);
      }
      if (e.data.type === 'TOGGLE_REQUEST') {
        onToggleRequest(e.data.layer, e.data.visible);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSelect, onToggleRequest, pushAll]);

  // MAP_READY를 놓쳤을 때를 위한 안전장치
  const handleIframeLoad = () => {
    setTimeout(() => {
      if (!readyRef.current) pushAll();
    }, 1200);
  };

  // ── 변경 감지 ────────────────────────────────────
  // 레이어 배열은 매 렌더마다 새로 만들어지므로 값으로 서명을 떠서 비교한다.
  const itemsSig = layers.map((l) => `${l.def.id}:${l.items.length}`).join('|');
  const filterSig = layers.map((l) => `${l.def.id}:${l.filterCategory}`).join('|');
  const visibleSig = layers.map((l) => `${l.def.id}:${l.visible}`).join('|');
  const selectedSig = layers.map((l) => `${l.def.id}:${l.selectedId ?? ''}`).join('|');

  useEffect(() => {
    if (!readyRef.current) return;
    layersRef.current.forEach((l) => post({ type: 'SET_ITEMS', layer: l.def.id, items: l.items }));
  }, [itemsSig, post]);

  useEffect(() => {
    if (!readyRef.current) return;
    layersRef.current.forEach((l) =>
      post({ type: 'FILTER', layer: l.def.id, category: l.filterCategory }));
  }, [filterSig, post]);

  useEffect(() => {
    if (!readyRef.current) return;
    layersRef.current.forEach((l) =>
      post({ type: 'TOGGLE', layer: l.def.id, visible: l.visible }));
  }, [visibleSig, post]);

  useEffect(() => {
    if (!readyRef.current) return;
    layersRef.current.forEach((l) => {
      if (l.selectedId) post({ type: 'SELECT', layer: l.def.id, id: l.selectedId });
    });
  }, [selectedSig, post]);

  useEffect(() => {
    if (!readyRef.current || !updatedItem) return;
    post({ type: 'UPDATE_ITEM', layer: updatedItem.layer, item: updatedItem.item });
  }, [updatedItem, post]);

  return (
    <div className="relative w-full h-full">
      <iframe
        ref={iframeRef}
        src="/api/kakaomap"
        className="w-full h-full rounded-xl border-0"
        title="Korea Outdoor Map"
        onLoad={handleIframeLoad}
      />
    </div>
  );
}
