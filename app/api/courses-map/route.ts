// app/api/courses-map/route.ts
// 지도에 필요한 전체 코스 좌표 데이터 반환 (좌표 있는 것만, Supabase 1000행 한계 우회)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BATCH = 1000; // Supabase 최대 한 번에 가져올 수 있는 행 수

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const source   = searchParams.get('source');
  const region   = searchParams.get('region');
  const search   = searchParams.get('search');

  const supabase = await createClient();

  // 필터가 적용된 쿼리를 구간(range)만 바꿔가며 반복 실행
  async function fetchBatch(from: number, to: number) {
    let q = supabase
      .from('raw_courses')
      .select(
        'id,course_name,category,source,start_lat,start_lng,' +
        'distance_km,elev_gain_m,est_time,difficulty,dataset_name,region'
      )
      .not('start_lat', 'is', null)
      .not('start_lng', 'is', null)
      .range(from, to);

    if (category && category !== '전체') q = q.eq('category', category);
    if (source   && source   !== '전체') q = q.eq('source', source);
    if (region   && region   !== '전체') q = q.ilike('region', `%${region}%`);
    if (search) {
      q = q.or(
        `course_name.ilike.%${search}%,dataset_name.ilike.%${search}%,region.ilike.%${search}%`
      );
    }

    return q;
  }

  // 전체 데이터 페이지네이션
  const allData: Record<string, unknown>[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await fetchBatch(offset, offset + BATCH - 1);

    if (error) {
      console.error('[courses-map] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) break;
    allData.push(...data);
    if (data.length < BATCH) break; // 마지막 페이지
    offset += BATCH;
  }

  return NextResponse.json(allData, {
    headers: { 'Cache-Control': 'no-store' }, // 항상 최신 데이터 (캐시 방지)
  });
}
