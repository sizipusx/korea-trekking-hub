'use client';

import { useEffect, useRef, useState } from 'react';
import type { Trail } from '@/types/trail';
import type { ForestRow } from '@/types/forest';

interface Props {
  trails: Trail[];
  forests: ForestRow[];
  selectedId: string | null;
  filterCategory: string;
  forestFilterCategory: string;
  showForests: boolean;
  onMarkerClick: (trail: Trail) => void;
  onForestClick: (forest: ForestRow) => void;
}

export default function KakaoMapView({
  trails, forests, selectedId, filterCategory,
  forestFilterCategory, showForests, onMarkerClick, onForestClick,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(true);
  const trailsRef = useRef(trails);
  const forestsRef = useRef(forests);
  trailsRef.current = trails;
  forestsRef.current = forests;

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
      }
      if (e.data?.type === 'MARKER_CLICK') {
        const trail = trailsRef.current.find(t => t.id === e.data.id);
        if (trail) onMarkerClick(trail);
      }
      if (e.data?.type === 'FOREST_CLICK') {
        const forest = forestsRef.current.find(f => f.id === e.data.id);
        if (forest) onForestClick(forest);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMarkerClick, onForestClick]);

  const handleIframeLoad = () => {
    setTimeout(() => {
      if (!ready) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'INIT_TRAILS', trails: trailsRef.current }, '*'
        );
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'INIT_FORESTS', forests: forestsRef.current }, '*'
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
