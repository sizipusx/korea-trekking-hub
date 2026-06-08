// lib/trails.ts  — 트레일 데이터 접근 레이어
import { createClient } from '@/lib/supabase/server';
import type { Trail, TrailFilters } from '@/types/trail';

// ── 전체 조회 (필터 지원) ─────────────────────
export async function getTrails(filters: TrailFilters = {}): Promise<Trail[]> {
  const supabase = await createClient();

  let query = supabase
    .from('trails')
    .select(`
      *,
      gpx:trail_gpx(*),
      season:trail_seasons(*)
    `)
    .order('name');

  if (filters.category && filters.category !== '전체') {
    query = query.eq('category', filters.category);
  }
  if (filters.difficulty && filters.difficulty !== '전체') {
    query = query.eq('difficulty', filters.difficulty);
  }
  if (filters.campingOnly) {
    query = query.eq('camping', true);
  }
  if (filters.backpackingOnly) {
    query = query.eq('backpacking', true);
  }
  if (filters.province) {
    query = query.ilike('province', `%${filters.province}%`);
  }
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,region.ilike.%${filters.search}%,province.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getTrails] Supabase error:', error.message);
    return [];
  }

  // nowRecommended 는 JS 레벨 필터 (배열 컬럼 GIN 인덱스가 없는 경우 대비)
  const currentMonth = new Date().getMonth() + 1;
  if (filters.nowRecommended) {
    return (data as Trail[]).filter(
      (t) => t.season?.best_months?.includes(currentMonth)
    );
  }

  return data as Trail[];
}

// ── 단일 조회 ─────────────────────────────────
export async function getTrailById(id: string): Promise<Trail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('trails')
    .select(`
      *,
      gpx:trail_gpx(*),
      season:trail_seasons(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('[getTrailById] Supabase error:', error.message);
    return null;
  }

  return data as Trail;
}

// ── 카테고리 목록 ─────────────────────────────
export async function getCategories(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('trails')
    .select('category')
    .order('category');

  if (error || !data) return [];
  return [...new Set(data.map((r) => r.category))];
}

// ── 통계 ──────────────────────────────────────
export async function getTrailStats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('trails')
    .select('category, distance_km, camping, backpacking');

  if (error || !data) return null;

  const total = data.length;
  const totalKm = data.reduce((sum, t) => sum + (t.distance_km ?? 0), 0);
  const campingCount = data.filter((t) => t.camping).length;
  const backpackingCount = data.filter((t) => t.backpacking).length;

  const byCat = data.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1;
    return acc;
  }, {});

  return { total, totalKm: Math.round(totalKm), campingCount, backpackingCount, byCat };
}
