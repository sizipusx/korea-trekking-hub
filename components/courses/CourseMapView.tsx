'use client';
// components/courses/CourseMapView.tsx — 코스 카카오맵 iframe 래퍼

import { useEffect, useRef, useState } from 'react';
import type { RawCourseRow } from '@/types/rawCourse';

interface Props {
  courses: RawCourseRow[];
  filterCategory: string;
  filterSource: string;
}

export default function CourseMapView({ courses, filterCategory, filterSource }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const coursesRef = useRef(courses);
  coursesRef.current = courses;

  // 지도 준비 완료 수신
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'COURSES_MAP_READY') {
        setReady(true);
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'INIT_COURSES', courses: coursesRef.current }, '*'
        );
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // courses 데이터 변경 → 지도 전체 재초기화
  useEffect(() => {
    if (!ready) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'INIT_COURSES', courses }, '*'
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, ready]);

  // 필터 변경 → 지도에 전달 (클라이언트 사이드 즉시 필터)
  useEffect(() => {
    if (!ready) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'FILTER_COURSES', category: filterCategory, source: filterSource }, '*'
    );
  }, [filterCategory, filterSource, ready]);

  return (
    <div className="relative w-full h-full">
      {!ready && (
        <div className="absolute inset-0 bg-slate-900 rounded-xl flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-emerald-400">코스 지도 로딩 중...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="/api/kakaomap-courses"
        className="w-full h-full rounded-xl border-0"
        title="Course Map"
        onLoad={() => {
          // 로드 후 1초 뒤에도 READY 안 왔으면 강제 초기화
          setTimeout(() => {
            if (!ready) {
              iframeRef.current?.contentWindow?.postMessage(
                { type: 'INIT_COURSES', courses: coursesRef.current }, '*'
              );
            }
          }, 1500);
        }}
      />
    </div>
  );
}
