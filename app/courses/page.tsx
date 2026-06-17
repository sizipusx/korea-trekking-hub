// app/courses/page.tsx — 코스 탐색 서버 컴포넌트
import type { Metadata } from 'next';
import type { RawCourseFilters } from '@/types/rawCourse';
import { getRawCourses } from '@/lib/rawCourses';
import CoursesPageClient from '@/components/courses/CoursesPageClient';

export const metadata: Metadata = {
  title: '코스 탐색 — Korea Trekking Hub',
  description: 'CSV·GPX 원천 데이터 기반 7,000+ 트레킹 코스 검색 및 필터',
};

// 검색 파라미터 타입
interface PageProps {
  searchParams: Promise<{
    category?: string;
    region?: string;
    source?: string;
    minKm?: string;
    maxKm?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(0, parseInt(sp.page ?? '0', 10));

  const filters: RawCourseFilters = {
    category: sp.category as RawCourseFilters['category'],
    region:   sp.region,
    source:   sp.source as RawCourseFilters['source'],
    minKm:    sp.minKm ? parseFloat(sp.minKm) : undefined,
    maxKm:    sp.maxKm ? parseFloat(sp.maxKm) : undefined,
    search:   sp.search,
  };

  const { data, count } = await getRawCourses(filters, page);

  return <CoursesPageClient initialData={data} totalCount={count} initialPage={page} initialFilters={filters} />;
}
