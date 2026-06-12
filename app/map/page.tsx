// app/map/page.tsx  — 지도 페이지 (Server Component)
import { getTrails } from '@/lib/trails';
import { getMappableForests } from '@/lib/forests';
import MapPageClient from '@/components/map/MapPageClient';

export const metadata = {
  title: '전국 트래킹·휴양림 지도 | Korea Trekking Hub',
  description: '전국 트래킹 코스와 자연휴양림을 카카오맵에서 한눈에 확인하세요.',
};

export const revalidate = 3600;

export default async function MapPage() {
  // 트레일 + 좌표 보유 휴양림을 서버에서 함께 페칭
  const [trails, forests] = await Promise.all([
    getTrails(),
    getMappableForests(),
  ]);

  return <MapPageClient trails={trails} forests={forests} />;
}
