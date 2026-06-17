// app/api/courses-map/route.ts
// 지도에 필요한 전체 코스 좌표 데이터 반환 (좌표 있는 것만)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const source   = searchParams.get('source');
  const region   = searchParams.get('region');
  const search   = searchParams.get('search');

  const supabase = await createClient();

  let query = supabase
    .from('raw_courses')
    .select('id,course_name,category,source,start_lat,start_lng,distance_km,elev_gain_m,est_time,difficulty,dataset_name,region')
    .not('start_lat', 'is', null)
    .not('start_lng', 'is', null);

  if (category && category !== '전체') {
    query = query.eq('category', category);
  }
  if (source && source !== '전체') {
    query = query.eq('source', source);
  }
  if (region && region !== '전체') {
    query = query.ilike('region', `%${region}%`);
  }
  if (search) {
    query = query.or(
      `course_name.ilike.%${search}%,dataset_name.ilike.%${search}%,region.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('[courses-map] Supabase error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
