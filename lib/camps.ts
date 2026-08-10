// lib/camps.ts — 지자체 운영 공공 캠핑장 데이터 접근 레이어
import { createClient } from '@/lib/supabase/server';
import { distanceKm } from '@/lib/forests';
import type { CampRow, CampFilters } from '@/types/camp';

// ── 전체 조회 (필터 지원) ─────────────────────
export async function getCamps(filters: CampFilters = {}): Promise<CampRow[]> {
  const supabase = await createClient();

  let query = supabase.from('camps').select('*').order('name');

  if (filters.category && filters.category !== '전체') {
    query = query.eq('category', filters.category);
  }
  if (filters.region && filters.region !== '전체') {
    query = query.eq('region', filters.region);
  }
  if (filters.reservedOnly) {
    query = query.eq('reservation_verified', true);
  }
  if (filters.verifiedOnly) {
    query = query.eq('operator_verified', true);
  }
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,sigungu.ilike.%${filters.search}%,operator.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error('[getCamps] Supabase error:', error.message);
    return [];
  }
  return data as CampRow[];
}

// ── 지도용: 좌표 보유 캠핑장만 ─────────────────
export async function getMappableCamps(): Promise<CampRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('camps')
    .select('*')
    .eq('geocoded', true)
    .order('name');

  if (error) {
    console.error('[getMappableCamps] Supabase error:', error.message);
    return [];
  }
  return data as CampRow[];
}

// ── 단일 조회 ─────────────────────────────────
export async function getCampById(id: string): Promise<CampRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('camps').select('*').eq('id', id).single();
  if (error) {
    console.error('[getCampById] Supabase error:', error.message);
    return null;
  }
  return data as CampRow;
}

// ── 통계 ──────────────────────────────────────
export async function getCampStats() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('camps')
    .select('category, region, geocoded, operator_verified, reservation_verified');

  if (error || !data) return null;

  type StatRow = Pick<
    CampRow,
    'category' | 'region' | 'geocoded' | 'operator_verified' | 'reservation_verified'
  >;
  const rows = data as StatRow[];

  const total = rows.length;
  const geocodedCount = rows.filter((c) => c.geocoded).length;
  const verifiedCount = rows.filter((c) => c.operator_verified).length;
  // 예약 오픈 규칙까지 채워진 건수 — 수기 입력 진척도 추적용
  const reservationKnown = rows.filter((c) => c.reservation_verified).length;

  const byCat = rows.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1;
    return acc;
  }, {});
  const byRegion = rows.reduce<Record<string, number>>((acc, c) => {
    acc[c.region] = (acc[c.region] ?? 0) + 1;
    return acc;
  }, {});

  return { total, geocodedCount, verifiedCount, reservationKnown, byCat, byRegion };
}

// ── 예약 정보 수정 (지도에서 직접 입력) ─────────
// 로그인 사용자만 가능하며, RLS + 컬럼 GRANT 로 예약 관련 컬럼만 수정됩니다.
export interface CampReservationPatch {
  reservation_org?: string;
  reservation_url?: string;
  reservation_open?: string;
  use_season?: string;
  reservation_note?: string;
}

const EDITABLE: (keyof CampReservationPatch)[] = [
  'reservation_org', 'reservation_url', 'reservation_open', 'use_season', 'reservation_note',
];

export async function updateCampReservation(
  id: string,
  patch: CampReservationPatch
): Promise<{ ok: boolean; camp?: CampRow; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: '로그인이 필요합니다.' };

  // 허용된 컬럼만 추려서 전달 (클라이언트가 보낸 나머지 필드는 무시)
  const payload: Record<string, string> = {};
  for (const key of EDITABLE) {
    if (typeof patch[key] === 'string') payload[key] = patch[key]!.trim();
  }
  if (Object.keys(payload).length === 0) {
    return { ok: false, error: '수정할 내용이 없습니다.' };
  }

  const { data, error } = await supabase
    .from('camps')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[updateCampReservation] Supabase error:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true, camp: data as CampRow };
}

// ── 트레일 주변 캠핑장 (반경 내) ───────────────
export async function getNearbyCamps(
  lat: number,
  lng: number,
  radiusKm = 20,
  limit = 5
): Promise<(CampRow & { distance_km: number })[]> {
  const camps = await getMappableCamps();
  return camps
    .map((c) => ({ ...c, distance_km: distanceKm(lat, lng, c.lat!, c.lng!) }))
    .filter((c) => c.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit);
}
