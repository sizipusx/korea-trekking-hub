// app/api/gpx-route/route.ts
// course ID → gpx_coords(DB) 조회 → 좌표 반환
// ※ 파일시스템 의존 제거 → Vercel 서버리스 대응
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id 파라미터가 필요합니다' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: course, error } = await supabase
    .from('raw_courses')
    .select('id, course_name, category, gpx_coords, distance_km, elev_gain_m, source')
    .eq('id', Number(id))
    .single();

  if (error || !course) {
    return NextResponse.json({ error: '코스를 찾을 수 없습니다' }, { status: 404 });
  }
  if (!course.gpx_coords) {
    return NextResponse.json({ error: 'GPX 경로 정보가 없습니다' }, { status: 404 });
  }

  const coords = course.gpx_coords as [number, number][];

  return NextResponse.json({
    course_name:  course.course_name,
    category:     course.category,
    distance_km:  course.distance_km,
    elev_gain_m:  course.elev_gain_m,
    total_points: coords.length,
    coords,
  }, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
