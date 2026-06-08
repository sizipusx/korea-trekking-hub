// app/map/page.tsx  — 지도 페이지 (Server Component)
import { getTrails } from '@/lib/trails';
import MapPageClient from '@/components/map/MapPageClient';

export const metadata = {
  title: '전국 트래킹 지도 | Korea Trekking Hub',
  description: '전국 트래킹 코스를 카카오맵에서 한눈에 확인하세요.',
};

export const revalidate = 3600;

export default async function MapPage() {
  // GPX 좌표 포함해서 서버에서 페칭
  const trails = await getTrails();

  return <MapPageClient trails={trails} />;
}
