// app/dashboard/page.tsx — 통합 대시보드 서버 컴포넌트
import type { Metadata } from 'next';
import { getRawCourseStats } from '@/lib/rawCourses';
import { getTrailStats } from '@/lib/trails';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const metadata: Metadata = {
  title: '대시보드 — Korea Trekking Hub',
  description: '원천 데이터 통계 및 마스터 트레일 현황 종합 대시보드',
};

export default async function DashboardPage() {
  // 두 스탯을 병렬 페치
  const [rawStats, trailStats] = await Promise.all([
    getRawCourseStats(),
    getTrailStats(),
  ]);

  return <DashboardClient rawStats={rawStats} trailStats={trailStats} />;
}
