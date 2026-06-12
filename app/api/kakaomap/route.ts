// app/api/forests/route.ts  —  GET /api/forests
import { NextRequest, NextResponse } from 'next/server';
import { getForests, getForestStats, getNearbyForests } from '@/lib/forests';
import type { ForestFilters, ForestCategory, ForestRegion } from '@/types/forest';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  try {
    // 통계 모드
    if (searchParams.get('stats') === 'true') {
      const stats = await getForestStats();
      return NextResponse.json({ stats });
    }

    // 주변 휴양림 모드: ?near=lat,lng&radius=20
    const near = searchParams.get('near');
    if (near) {
      const [lat, lng] = near.split(',').map(Number);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const radius = Number(searchParams.get('radius') ?? 20);
        const forests = await getNearbyForests(lat, lng, radius);
        return NextResponse.json({ forests, count: forests.length });
      }
      return NextResponse.json({ error: 'near 파라미터 형식 오류 (lat,lng)' }, { status: 400 });
    }

    // 일반 목록 + 필터
    const filters: ForestFilters = {
      search:      searchParams.get('search')   || undefined,
      category:    (searchParams.get('category') || '전체') as ForestCategory | '전체',
      region:      (searchParams.get('region')   || '전체') as ForestRegion | '전체',
      campingOnly: searchParams.get('camping') === 'true',
      roomOnly:    searchParams.get('room')    === 'true',
    };

    const forests = await getForests(filters);
    return NextResponse.json({ forests, count: forests.length });
  } catch (err) {
    console.error('[/api/forests] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
