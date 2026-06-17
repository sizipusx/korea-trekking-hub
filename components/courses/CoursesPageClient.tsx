'use client';
// components/courses/CoursesPageClient.tsx — 코스 탐색 클라이언트 UI

import { useState, useTransition, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import type { RawCourseRow, RawCourseFilters } from '@/types/rawCourse';
import { RAW_CATEGORY_META } from '@/types/rawCourse';

// 지도 뷰 — SSR 비활성화 (카카오맵은 브라우저 전용)
const CourseMapView = dynamic(() => import('./CourseMapView'), { ssr: false });

const PAGE_SIZE = 50;

const CATEGORIES = [
  '전체', '등산로', '둘레길', '숲길', '트레킹길',
  '테마길', '오름', '섬트레킹', '문화길', '국가숲길', '정맥종주', '종주', '기타',
] as const;

const REGIONS = [
  '전체', '서울', '부산', '대구', '인천', '광주', '대전', '울산',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

type SortKey = 'course_name' | 'distance_km' | 'elev_gain_m' | 'dataset_name';

// ── 카드 컴포넌트 ─────────────────────────────────────────────────
function CourseCard({ course }: { course: RawCourseRow }) {
  const meta = RAW_CATEGORY_META[course.category] ?? { emoji: '📍', color: '#64748b' };
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 hover:border-emerald-700/60 hover:bg-white/[0.04] transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl shrink-0">{meta.emoji}</span>
          <span className="text-sm font-semibold text-slate-200 truncate group-hover:text-emerald-200 transition-colors">
            {course.course_name}
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}44` }}>
          {course.category}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
        {course.dataset_name && (
          <span className="text-slate-400">📁 {course.dataset_name}</span>
        )}
        {course.region && (
          <span>📍 {course.region}</span>
        )}
        {course.distance_km != null && (
          <span className="text-blue-400">↔️ {course.distance_km.toFixed(1)} km</span>
        )}
        {course.elev_gain_m != null && (
          <span className="text-orange-400">↑ {Math.round(course.elev_gain_m)} m</span>
        )}
        {course.est_time && (
          <span>⏱ {course.est_time}</span>
        )}
        {course.difficulty && (
          <span>💪 {course.difficulty}</span>
        )}
        <span className={course.source === 'GPX' ? 'text-purple-400' : 'text-cyan-400'}>
          {course.source === 'GPX' ? '🛰 GPX' : '📄 CSV'}
        </span>
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
interface Props {
  initialData: RawCourseRow[];
  totalCount: number;
  initialPage: number;
  initialFilters: RawCourseFilters;
}

export default function CoursesPageClient({ initialData, totalCount, initialPage, initialFilters }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [search,   setSearch]   = useState(initialFilters.search   ?? '');
  const [category, setCategory] = useState<string>(initialFilters.category ?? '전체');
  const [region,   setRegion]   = useState(initialFilters.region   ?? '전체');
  const [source,   setSource]   = useState<string>(initialFilters.source   ?? '전체');
  const [sortBy,   setSortBy]   = useState<SortKey>('course_name');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // 지도 전용 상태 — 전체 좌표 데이터
  const [mapCourses,  setMapCourses]  = useState<RawCourseRow[] | null>(null);
  const [mapLoading,  setMapLoading]  = useState(false);
  const [mapError,    setMapError]    = useState<string | null>(null);
  // 마지막으로 fetch한 필터를 저장해 중복 요청 방지
  const lastMapKey = useRef<string>('');

  const fetchMapCourses = useCallback(async (cat: string, src: string, reg: string, srch: string) => {
    const key = `${cat}|${src}|${reg}|${srch}`;
    if (key === lastMapKey.current) return;
    lastMapKey.current = key;

    setMapLoading(true);
    setMapError(null);
    try {
      const params = new URLSearchParams();
      if (cat  && cat  !== '전체') params.set('category', cat);
      if (src  && src  !== '전체') params.set('source',   src);
      if (reg  && reg  !== '전체') params.set('region',   reg);
      if (srch)                    params.set('search',   srch);
      const res = await fetch(`/api/courses-map?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RawCourseRow[] = await res.json();
      setMapCourses(data);
    } catch (err) {
      setMapError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setMapLoading(false);
    }
  }, []);

  // 지도 모드 + 필터(카테고리·원천·지역) 변경 시 즉시 재조회
  // search 는 타이핑마다 fetch가 일어나므로 제외 → "필터 적용" 클릭 시만 반영
  useEffect(() => {
    if (viewMode !== 'map') return;
    fetchMapCourses(category, source, region, search);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, category, source, region]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function buildUrl(overrides: Record<string, string | number | undefined>) {
    const p = new URLSearchParams();
    const merged: Record<string, string | number | undefined> = {
      category: category !== '전체' ? category : undefined,
      region:   region   !== '전체' ? region   : undefined,
      source:   source   !== '전체' ? source   : undefined,
      search:   search   || undefined,
      page:     initialPage,
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v != null && v !== '') p.set(k, String(v));
    });
    return `${pathname}?${p.toString()}`;
  }

  function applyFilters() {
    startTransition(() => router.push(buildUrl({ page: 0 })));
    // search 키워드가 바뀐 경우 강제 재fetch (lastMapKey 우회)
    if (viewMode === 'map') {
      lastMapKey.current = '';
      fetchMapCourses(category, source, region, search);
    }
  }

  function goPage(p: number) {
    startTransition(() => router.push(buildUrl({ page: p })));
  }

  // 클라이언트 사이드 정렬
  const sorted = useMemo(() => [...initialData].sort((a, b) => {
    if (sortBy === 'distance_km') return (b.distance_km ?? -1) - (a.distance_km ?? -1);
    if (sortBy === 'elev_gain_m') return (b.elev_gain_m ?? -1) - (a.elev_gain_m ?? -1);
    if (sortBy === 'dataset_name') return a.dataset_name.localeCompare(b.dataset_name);
    return a.course_name.localeCompare(b.course_name);
  }), [initialData, sortBy]);

  // 지도에 넘길 코스 (전체 조회된 데이터 우선, 없으면 현재 페이지 데이터)
  const coursesForMap = useMemo(() => mapCourses ?? sorted, [mapCourses, sorted]);

  const gradBg = 'linear-gradient(160deg,#0a0f1e 0%,#0d1f12 50%,#0f1a2e 100%)';

  return (
    <div className="min-h-screen" style={{ background: gradBg }}>

      {/* HEADER */}
      <header style={{ background: 'linear-gradient(90deg,#052e16,#064e3b,#0c4a6e)', borderBottom: '2px solid #10b981' }}
        className="px-5 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔍</span>
            <div>
              <h1 className="text-xl font-black text-emerald-50">코스 탐색</h1>
              <p className="text-xs text-emerald-400 tracking-widest mt-0.5">
                {totalCount.toLocaleString()}개 코스 · CSV + GPX 통합 데이터
              </p>
            </div>
          </div>
          <nav className="flex gap-2">
            {[['🥾', '홈', '/'], ['📐', '스키마', '/schema'], ['📊', '대시보드', '/dashboard']].map(([e, l, h]) => (
              <Link key={h} href={h}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-emerald-300 hover:bg-emerald-900/30 transition border border-transparent hover:border-emerald-800">
                {e} {l}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">

        {/* ── SIDEBAR ─────────────── */}
        <aside className="w-56 shrink-0 space-y-4">

          {/* 검색 */}
          <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 space-y-3">
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">검색</p>
            <input
              type="text"
              placeholder="코스명, 데이터셋, 지역..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-600 transition"
            />
          </div>

          {/* 카테고리 */}
          <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-2">카테고리</p>
            <div className="space-y-0.5">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`w-full text-left px-2 py-1 rounded-lg text-xs transition ${
                    category === c ? 'bg-emerald-700/40 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}>
                  {c !== '전체' ? `${RAW_CATEGORY_META[c as keyof typeof RAW_CATEGORY_META]?.emoji ?? '📍'} ${c}` : '📋 전체'}
                </button>
              ))}
            </div>
          </div>

          {/* 지역 */}
          <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-2">지역</p>
            <select value={region} onChange={(e) => setRegion(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 outline-none focus:border-emerald-600">
              {REGIONS.map((r) => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
            </select>
          </div>

          {/* 원천 */}
          <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-2">원천 형식</p>
            {['전체', 'GPX', 'CSV'].map((s) => (
              <button key={s} onClick={() => setSource(s)}
                className={`mr-1 mb-1 px-3 py-1 rounded-full text-[11px] font-semibold border transition ${
                  source === s
                    ? 'bg-emerald-700/40 border-emerald-600 text-emerald-300'
                    : 'border-white/10 text-slate-500 hover:border-slate-600'
                }`}>
                {s}
              </button>
            ))}
          </div>

          {/* 정렬 */}
          <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-2">정렬</p>
            {[
              ['course_name', '이름순'],
              ['dataset_name', '데이터셋순'],
              ['distance_km', '거리 긴 순'],
              ['elev_gain_m', '고도 높은 순'],
            ].map(([k, l]) => (
              <button key={k} onClick={() => setSortBy(k as SortKey)}
                className={`w-full text-left px-2 py-1 rounded-lg text-xs transition ${
                  sortBy === k ? 'bg-emerald-700/40 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}>
                {l}
              </button>
            ))}
          </div>

          <button onClick={applyFilters} disabled={isPending}
            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-sm font-bold text-white transition">
            {isPending ? '검색 중…' : '🔍 필터 적용'}
          </button>
        </aside>

        {/* ── CONTENT ─────────────── */}
        <div className="flex-1 min-w-0">

          {/* 결과 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-400">
              <span className="text-emerald-400 font-bold">{totalCount.toLocaleString()}</span>개 코스 ·
              <span className="text-slate-500"> 페이지 {initialPage + 1} / {Math.max(1, totalPages)}</span>
            </p>
            <div className="flex items-center gap-2">
              {isPending && <span className="text-xs text-emerald-400 animate-pulse">로딩 중…</span>}
              {/* 지도/목록 토글 */}
              <div className="flex rounded-lg border border-white/10 overflow-hidden">
                <button onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === 'list' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}>
                  ☰ 목록
                </button>
                <button onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === 'map' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}>
                  🗺 지도
                </button>
              </div>
            </div>
          </div>

          {/* 지도 뷰 */}
          {viewMode === 'map' && (
            <div className="rounded-xl overflow-hidden relative" style={{ height: 'calc(100vh - 200px)' }}>
              {mapLoading && (
                <div className="absolute inset-0 z-20 bg-slate-900/80 flex flex-col items-center justify-center rounded-xl">
                  <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-emerald-400">전체 코스 로딩 중…</p>
                </div>
              )}
              {mapError && (
                <div className="absolute inset-0 z-20 bg-slate-900/90 flex flex-col items-center justify-center rounded-xl">
                  <p className="text-red-400 text-sm">⚠️ {mapError}</p>
                  <button onClick={() => { lastMapKey.current = ''; fetchMapCourses(category, source, region, search); }}
                    className="mt-3 px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold">
                    다시 시도
                  </button>
                </div>
              )}
              <CourseMapView
                courses={coursesForMap}
                filterCategory={category}
                filterSource={source}
              />
            </div>
          )}

          {/* 코스 그리드 (목록 모드) */}
          {viewMode === 'list' && (
            sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-600">
                <span className="text-5xl mb-4">🔍</span>
                <p className="text-lg font-semibold">검색 결과가 없습니다</p>
                <p className="text-sm mt-1">필터를 조정해 보세요</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sorted.map((course) => <CourseCard key={course.id} course={course} />)}
              </div>
            )
          )}

          {/* 페이지네이션 (목록 모드에서만) */}
          {viewMode === 'list' && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => goPage(0)} disabled={initialPage === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/8 hover:border-emerald-700 transition">
                ««
              </button>
              <button onClick={() => goPage(initialPage - 1)} disabled={initialPage === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/8 hover:border-emerald-700 transition">
                ‹ 이전
              </button>

              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const offset = Math.max(0, Math.min(initialPage - 3, totalPages - 7));
                const p = offset + i;
                return (
                  <button key={p} onClick={() => goPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      p === initialPage
                        ? 'bg-emerald-700 border-emerald-600 text-white'
                        : 'border-white/8 text-slate-400 hover:border-emerald-700 hover:text-emerald-300'
                    }`}>
                    {p + 1}
                  </button>
                );
              })}

              <button onClick={() => goPage(initialPage + 1)} disabled={initialPage >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/8 hover:border-emerald-700 transition">
                다음 ›
              </button>
              <button onClick={() => goPage(totalPages - 1)} disabled={initialPage >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/8 hover:border-emerald-700 transition">
                »»
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
