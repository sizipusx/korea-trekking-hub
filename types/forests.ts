// lib/forests.ts — 자연휴양림 데이터 접근 레이어
import { createClient } from '@/lib/supabase/server';
import type { ForestRow, ForestFilters } from '@/types/forest';

// ── 전체 조회 (필터 지원) ─────────────────────
export async function getForests(filters: ForestFilters = {}): Promise<ForestRow[]> {
  const supabase = await createClient();

  let query = supabase.from('forests').select('*').order('name');

  if (filters.category && filters.category !== '전체') {
    query = query.eq('category', filters.category);
  }
  if (filters.region && filters.region !== '전체') {
    query = query.eq('region', filters.region);
  }
  if (filters.campingOnly) {
    query = query.eq('has_camp', true);
  }
  if (filters.roomOnly) {
    query = query.eq('has_room', true);
  }
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,sigungu.ilike.%${filters.search}%,region.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error('[getForests] Supabase error:', error.message);
    return [];
  }
  return data as ForestRow[];
}

// ── 지도용: 좌표 보유 휴양림만 ─────────────────
export async function getMappableForests(): Promise<ForestRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('forests')
    .select('*')
    .eq('geocoded', true)
    .order('name');

  if (error) {
    console.error('[getMappableForests] Supabase error:', error.message);
    return [];
  }
  return data as ForestRow[];
}

// ── 단일 조회 ─────────────────────────────────
export async function getForestById(id: string): Promise<ForestRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('forests').select('*').eq('id', id).single();
  if (error) {
    console.error('[getForestById] Supabase error:', error.message);
    return null;
  }
  return data as ForestRow;
}

// ── 통계 ──────────────────────────────────────
export async function getForestStats() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('forests')
    .select('category, region, has_camp, has_room, geocoded');

  if (error || !data) return null;

  type StatRow = Pick<ForestRow, 'category' | 'region' | 'has_camp' | 'has_room' | 'geocoded'>;
  const rows = data as StatRow[];

  const total = rows.length;
  const campCount = rows.filter((f) => f.has_camp).length;
  const roomCount = rows.filter((f) => f.has_room).length;
  const geocodedCount = rows.filter((f) => f.geocoded).length;

  const byCat = rows.reduce<Record<string, number>>((acc, f) => {
    acc[f.category] = (acc[f.category] ?? 0) + 1;
    return acc;
  }, {});
  const byRegion = rows.reduce<Record<string, number>>((acc, f) => {
    acc[f.region] = (acc[f.region] ?? 0) + 1;
    return acc;
  }, {});

  return { total, campCount, roomCount, geocodedCount, byCat, byRegion };
}

// ── 트레일 주변 휴양림 (Haversine 거리, 클라/서버 공용 유틸) ─────
export function distanceKm(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 특정 좌표 기준 반경 내 휴양림 (트레일 상세 패널 "주변 휴양림"용)
export async function getNearbyForests(
  lat: number,
  lng: number,
  radiusKm = 20,
  limit = 5
): Promise<(ForestRow & { distance_km: number })[]> {
  const forests = await getMappableForests();
  return forests
    .map((f) => ({ ...f, distance_km: distanceKm(lat, lng, f.lat!, f.lng!) }))
    .filter((f) => f.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit);
}
