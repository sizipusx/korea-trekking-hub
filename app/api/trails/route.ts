// app/api/trails/route.ts  —  GET /api/trails
import { NextRequest, NextResponse } from 'next/server';
import { getTrails, getTrailStats } from '@/lib/trails';
import type { TrailFilters, TrailCategory, Difficulty } from '@/types/trail';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const filters: TrailFilters = {
    search:           searchParams.get('search')           || undefined,
    category:         (searchParams.get('category')        || '전체') as TrailCategory | '전체',
    difficulty:       (searchParams.get('difficulty')      || '전체') as Difficulty | '전체',
    campingOnly:      searchParams.get('camping')    === 'true',
    backpackingOnly:  searchParams.get('backpacking') === 'true',
    nowRecommended:   searchParams.get('now')        === 'true',
    province:         searchParams.get('province')          || undefined,
  };

  try {
    if (searchParams.get('stats') === 'true') {
      const stats = await getTrailStats();
      return NextResponse.json({ stats });
    }

    const trails = await getTrails(filters);
    return NextResponse.json({ trails, count: trails.length });
  } catch (err) {
    console.error('[/api/trails] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
