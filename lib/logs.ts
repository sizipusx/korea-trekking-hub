// lib/logs.ts — 탐방 기록 CRUD
import { createClient } from '@/lib/supabase/server';
import type { UserLogRow, UserProfile } from '@/types/trail';

// ── 내 탐방 기록 전체 조회 ────────────────────────────────────────
export async function getMyLogs(): Promise<(UserLogRow & { trail_name: string; trail_distance: number })[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_logs')
    .select(`*, trails(name, distance_km)`)
    .eq('user_id', user.id)
    .order('visited_date', { ascending: false, nullsFirst: false });

  if (error || !data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    ...row,
    trail_name: row.trails?.name ?? '',
    trail_distance: row.trails?.distance_km ?? 0,
  }));
}

// ── 특정 코스의 내 기록 조회 ──────────────────────────────────────
export async function getMyLogByTrail(trailId: string): Promise<UserLogRow | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('trail_id', trailId)
    .single();

  if (error || !data) return null;
  return data as UserLogRow;
}

// ── 기록 저장 (upsert) ────────────────────────────────────────────
export async function upsertLog(
  trailId: string,
  payload: Partial<Omit<UserLogRow, 'id' | 'user_id' | 'trail_id' | 'created_at' | 'updated_at'>>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: '로그인이 필요합니다.' };

  const { error } = await supabase
    .from('user_logs')
    .upsert({ user_id: user.id, trail_id: trailId, ...payload }, { onConflict: 'user_id,trail_id' });

  return error ? { ok: false, error: error.message } : { ok: true };
}

// ── 기록 삭제 ────────────────────────────────────────────────────
export async function deleteLog(trailId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('user_logs')
    .delete()
    .eq('user_id', user.id)
    .eq('trail_id', trailId);

  return !error;
}

// ── 프로필 조회 ───────────────────────────────────────────────────
export async function getMyProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data as UserProfile | null;
}

// ── 프로필 통계 갱신 ──────────────────────────────────────────────
export async function refreshProfileStats(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: logs } = await supabase
    .from('user_logs')
    .select('trail_id, status, trails(distance_km)')
    .eq('user_id', user.id)
    .eq('status', 'completed');

  if (!logs) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalKm = logs.reduce((sum: number, l: any) => sum + (l.trails?.distance_km ?? 0), 0);

  await supabase.from('user_profiles').upsert({
    id: user.id,
    total_km: Math.round(totalKm),
    trail_count: logs.length,
  }, { onConflict: 'id' });
}
