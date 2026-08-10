'use client';

import { useEffect, useRef, useState } from 'react';
import type { Trail } from '@/types/trail';
import type { ForestRow } from '@/types/forest';
import type { CampRow } from '@/types/camp';

interface Props {
  trails: Trail[];
  forests: ForestRow[];
  camps: CampRow[];
  updatedCamp: CampRow | null;   // 예약 정보 저장 직후, 지도 팝업에도 반영하기 위한 값
  selectedId: string | null;
  filterCategory: string;
  forestFilterCategory: string;
  campFilterCategory: string;
  showForests: boolean;
  showCamps: boolean;
  onMarkerClick: (trail: Trail) => void;
  onForestClick: (forest: ForestRow) => void;
  onCampClick: (camp: CampRow) => void;
}

export default function KakaoMapView({
  trails, forests, camps, updatedCamp, selectedId, filterCategory,
  forestFilterCategory, campFilterCategory, showForests, showCamps,
  onMarkerClick, onForestClick, onCampClick,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(true);
  const trailsRef = useRef(trails);
  const forestsRef = useRef(forests);
  const campsRef = useRef(camps);
  trailsRef.current = trails;
  forestsRef.current = forests;
  campsRef.current = camps;

  // MAP_READY 수신 핸들러
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'MAP_READY') {
        setReady(true);
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'INIT_TRAILS', trails: trailsRef.current }, '*'
        );
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'INIT_FORESTS', forests: forestsRef.current }, '*'
        );
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'INIT_CAMPS', camps: campsRef.current }, '*'
        );
      }
      if (e.data?.type === 'MARKER_CLICK') {
        const trail = trailsRef.current.find(t => t.id === e.data.id);
        if (trail) onMarkerClick(trail);
      }
      if (e.data?.type === 'FOREST_CLICK') {
        const forest = forestsRef.current.find(f => f.id === e.data.id);
        if (forest) onForestClick(forest);
      }
      if (e.data?.type === 'CAMP_CLICK') {
        const camp = campsRef.current.find(c => c.id === e.data.id);
        if (camp) onCampClick(camp);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMarkerClick, onForestClick, onCampClick]);

  const handleIframeLoad = () => {
    setTimeout(() => {
      if (!ready) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'INIT_TRAILS', trails: trailsRef.current }, '*'
        );
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'INIT_FORESTS', forests: forestsRef.current }, '*'
        );
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'INIT_CAMPS', camps: campsRef.current }, '*'
        );
      }
    }, 1000);
  };

  // 트레일 필터 변경
  useEffect(() => {
    if (!ready) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'FILTER', category: filterCategory }, '*'
    );
  }, [filterCategory, ready]);

  // 휴양림 필터 변경
  useEffect(() => {
    if (!ready) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'FILTER_FORESTS', category: forestFilterCategory }, '*'
    );
  }, [forestFilterCategory, ready]);

  // 휴양림 표시/숨김
  useEffect(() => {
    if (!ready) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'TOGGLE_FORESTS', visible: showForests }, '*'
    );
  }, [showForests, ready]);

  // 캠핑장 필터 변경
  useEffect(() => {
    if (!ready) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'FILTER_CAMPS', category: campFilterCategory }, '*'
    );
  }, [campFilterCategory, ready]);

  // 캠핑장 표시/숨김
  useEffect(() => {
    if (!ready) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'TOGGLE_CAMPS', visible: showCamps }, '*'
    );
  }, [showCamps, ready]);

  // 예약 정보 저장 후 지도 안 데이터도 갱신
  useEffect(() => {
    if (!ready || !updatedCamp) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'UPDATE_CAMP', camp: updatedCamp }, '*'
    );
  }, [updatedCamp, ready]);

  // 선택 트레일 이동
  useEffect(() => {
    if (!ready || !selectedId) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'SELECT', id: selectedId }, '*'
    );
  }, [selectedId, ready]);

  return (
    <div className="relative w-full h-full">
      {!ready && (
        <div className="absolute inset-0 bg-slate-900 rounded-xl flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-emerald-400">카카오맵 로딩 중...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="/api/kakaomap"
        className="w-full h-full rounded-xl border-0"
        title="Korea Trekking Map"
        onLoad={handleIframeLoad}
      />
    </div>
  );
}
