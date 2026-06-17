// app/api/gpx-route/route.ts
// course ID → gpx_path 조회 → GPX 파싱 → 좌표 반환 (다운샘플링 적용)
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { createClient } from '@/lib/supabase/server';

const MAX_POINTS = 400; // 지도 렌더링 성능을 위한 최대 좌표 수

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id 파라미터가 필요합니다' }, { status: 400 });
  }

  // 1. DB에서 gpx_path 조회
  const supabase = await createClient();
  const { data: course, error } = await supabase
    .from('raw_courses')
    .select('id, course_name, category, gpx_path, distance_km, elev_gain_m, source')
    .eq('id', Number(id))
    .single();

  if (error || !course) {
    return NextResponse.json({ error: '코스를 찾을 수 없습니다' }, { status: 404 });
  }
  if (!course.gpx_path) {
    return NextResponse.json({ error: 'GPX 경로 정보가 없습니다' }, { status: 404 });
  }

  // 2. GPX 파일 읽기 (프로젝트 루트 기준 상대 경로)
  const gpxAbsPath = path.join(process.cwd(), course.gpx_path);
  let gpxContent: string;
  try {
    gpxContent = await readFile(gpxAbsPath, 'utf-8');
  } catch {
    return NextResponse.json(
      { error: `GPX 파일을 읽을 수 없습니다: ${course.gpx_path}` },
      { status: 404 }
    );
  }

  // 3. trkpt 파싱 (정규식 — XML 파서 없이 빠르게)
  const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g;
  const allCoords: [number, number][] = [];
  let m: RegExpExecArray | null;
  while ((m = trkptRegex.exec(gpxContent)) !== null) {
    allCoords.push([parseFloat(m[1]), parseFloat(m[2])]);
  }

  if (allCoords.length === 0) {
    return NextResponse.json({ error: 'GPX에 트랙 포인트가 없습니다' }, { status: 404 });
  }

  // 4. 다운샘플링 (Nth 포인트 선택, 첫/마지막 포인트는 항상 포함)
  const step = Math.max(1, Math.floor(allCoords.length / MAX_POINTS));
  const coords = allCoords.filter((_, i) => i % step === 0);
  // 마지막 포인트 보장
  const last = allCoords[allCoords.length - 1];
  if (coords[coords.length - 1] !== last) coords.push(last);

  return NextResponse.json({
    course_name:  course.course_name,
    category:     course.category,
    distance_km:  course.distance_km,
    elev_gain_m:  course.elev_gain_m,
    total_points: allCoords.length,
    coords,       // [[lat, lng], ...]
  }, {
    headers: { 'Cache-Control': 'public, max-age=3600' }, // GPX는 변경되지 않으므로 캐시
  });
}
