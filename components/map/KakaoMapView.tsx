'use client';

import { useEffect, useRef, useState } from 'react';
import type { Trail } from '@/types/trail';

interface Props {
  trails: Trail[];
  selectedId: string | null;
  filterCategory: string;
  onMarkerClick: (trail: Trail) => void;
}

export default function KakaoMapView({ trails, selectedId, filterCategory, onMarkerClick }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(true);
  const trailsRef = useRef(trails);
  trailsRef.current = trails;

  // MAP_READY 수신 핸들러
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'MAP_READY') {
        setReady(true);
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'INIT_TRAILS', trails: trailsRef.current },
          '*'
        );
      }
      if (e.data?.type === 'MARKER_CLICK') {
        const trail = trailsRef.current.find(t => t.id === e.data.id);
        if (trail) onMarkerClick(trail);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMarkerClick]);

  // iframe 로드 완료 시 재시도 (MAP_READY를 못 받은 경우 대비)
  const handleIframeLoad = () => {
    // 1초 후에도 ready가 안 됐으면 직접 데이터 전송
    setTimeout(() => {
      if (!ready) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'INIT_TRAILS', trails: trailsRef.current },
          '*'
        );
      }
    }, 1000);
  };

  // 필터 변경
  useEffect(() => {
    if (!ready) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'FILTER', category: filterCategory },
      '*'
    );
  }, [filterCategory, ready]);

  // 선택 트레일 이동
  useEffect(() => {
    if (!ready || !selectedId) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'SELECT', id: selectedId },
      '*'
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