// lib/rawCourses.ts — Raw Course 데이터 접근 레이어
import { createClient } from '@/lib/supabase/server';
import type { RawCourseRow, RawCourseFilters, RawCourseStats } from '@/types/rawCourse';

const PAGE_SIZE = 50;

// ── 목록 조회 (필터 + 페이징) ──────────────────
export async function getRawCourses(
  filters: RawCourseFilters = {},
  page = 0,
): Promise<{ data: RawCourseRow[]; count: number }> {
  const supabase = await createClient();

  // gpx_coords 는 경로 팝업에서 /api/gpx-route 로 별도 조회 → 목록에서 제외 (전송 데이터 절감)
  let query = supabase
    .from('raw_courses')
    .select(
      'id, course_name, category, dataset_name, subcategory, region,' +
      'distance_km, elev_gain_m, elev_loss_m, est_time, difficulty,' +
      'start_lat, start_lng, address, gpx_path, source, created_at',
      { count: 'exact' }
    )
    .order('dataset_name')
    .order('course_name')
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (filters.category && filters.category !== '전체') {
    query = query.eq('category', filters.category);
  }
  if (filters.source && filters.source !== '전체') {
    query = query.eq('source', filters.source);
  }
  if (filters.dataset) {
    query = query.ilike('dataset_name', `%${filters.dataset}%`);
  }
  if (filters.region) {
    query = query.ilike('region', `%${filters.region}%`);
  }
  if (filters.minKm != null) {
    query = query.gte('distance_km', filters.minKm);
  }
  if (filters.maxKm != null) {
    query = query.lte('distance_km', filters.maxKm);
  }
  if (filters.hasElevation) {
    query = query.not('elev_gain_m', 'is', null);
  }
  if (filters.hasCoords) {
    query = query.not('start_lat', 'is', null);
  }
  if (filters.search) {
    query = query.or(
      `course_name.ilike.%${filters.search}%,dataset_name.ilike.%${filters.search}%,region.ilike.%${filters.search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[getRawCourses] Supabase error:', error.message);
    return { data: [], count: 0 };
  }

  return { data: (data ?? []) as unknown as RawCourseRow[], count: count ?? 0 };
}

// ── 단일 조회 ──────────────────────────────────
export async function getRawCourseById(id: number): Promise<RawCourseRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('raw_courses')
    .select(
      'id, course_name, category, dataset_name, subcategory, region,' +
      'distance_km, elev_gain_m, elev_loss_m, est_time, difficulty,' +
      'start_lat, start_lng, address, gpx_path, source, created_at'
    )
    .eq('id', id)
    .single();

  if (error) return null;
  return data as unknown as RawCourseRow;
}

// ── 통계 ───────────────────────────────────────
export async function getRawCourseStats(): Promise<RawCourseStats> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('raw_courses')
    .select('category, dataset_name, distance_km, elev_gain_m, start_lat, source');

  if (error || !data) {
    return {
      total: 0, gpxCount: 0, csvCount: 0,
      withElevation: 0, withCoords: 0, totalKm: 0,
      byCategory: {}, byDataset: {}, distanceDistribution: [],
    };
  }

  const total        = data.length;
  const gpxCount     = data.filter((r) => r.source === 'GPX').length;
  const csvCount     = data.filter((r) => r.source === 'CSV').length;
  const withElevation= data.filter((r) => r.elev_gain_m != null).length;
  const withCoords   = data.filter((r) => r.start_lat  != null).length;
  const totalKm      = Math.round(data.reduce((s, r) => s + (r.distance_km ?? 0), 0));

  const byCategory: Record<string, number> = {};
  const byDataset:  Record<string, number> = {};
  for (const r of data) {
    byCategory[r.category]    = (byCategory[r.category]    ?? 0) + 1;
    byDataset[r.dataset_name] = (byDataset[r.dataset_name] ?? 0) + 1;
  }

  const distBins = [
    { label: '~5km',      min: 0,   max: 5   },
    { label: '5~10km',    min: 5,   max: 10  },
    { label: '10~20km',   min: 10,  max: 20  },
    { label: '20~50km',   min: 20,  max: 50  },
    { label: '50~100km',  min: 50,  max: 100 },
    { label: '100km+',    min: 100, max: Infinity },
  ];
  const distanceDistribution = distBins.map(({ label, min, max }) => ({
    label,
    count: data.filter((r) => {
      const d = r.distance_km ?? 0;
      return d >= min && d < max;
    }).length,
  }));

  return { total, gpxCount, csvCount, withElevation, withCoords, totalKm, byCategory, byDataset, distanceDistribution };
}
