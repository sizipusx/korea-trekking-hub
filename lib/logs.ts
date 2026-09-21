// lib/logs.ts — 활동 기록 CRUD
//
// 기록이 트레일에 묶여 있던 시절에는 trail_id 하나가 키였지만, 이제는
// (활동, 장소종류, 장소id) 조합이 키다. 장소 이름은 activity_logs 안에
// 복사돼 있어서 조회할 때 trails 를 조인하지 않는다.

import { createClient } from '@/lib/supabase/server';
import type { ActivityLogKey, ActivityLogRow } from '@/types/activity';
import type { UserProfile } from '@/types/trail';

// ── 내 기록 전체 조회 ────────────────────────────────────────────
export async function getMyLogs(): Promise<ActivityLogRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('visited_date', { ascending: false, nullsFirst: false });

  if (error || !data) return [];
  return data as ActivityLogRow[];
}

// ── 특정 장소의 내 기록 조회 ─────────────────────────────────────
export async function getMyLog(key: ActivityLogKey): Promise<ActivityLogRow | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !key.placeId) return null;

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('activity', key.activity)
    .eq('place_type', key.placeType)
    .eq('place_id', key.placeId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ActivityLogRow;
}

type LogPayload = Partial<Omit<
  ActivityLogRow,
  'id' | 'user_id' | 'activity' | 'place_type' | 'place_id' | 'created_at' | 'updated_at'
>>;

// ── 기록 저장 ────────────────────────────────────────────────────
// 장소를 가리키는 기록은 (활동, 장소) 조합으로 덮어쓰고,
// 장소 없는 자유 기록은 매번 새 행으로 쌓는다.
export async function saveLog(
  key: ActivityLogKey,
  payload: LogPayload,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: '로그인이 필요합니다.' };

  const row = {
    user_id: user.id,
    activity: key.activity,
    place_type: key.placeType,
    place_id: key.placeType === 'none' ? null : key.placeId,
    ...payload,
  };

  const { error } = row.place_id
    ? await supabase.from('activity_logs')
        .upsert(row, { onConflict: 'user_id,activity,place_type,place_id' })
    : await supabase.from('activity_logs').insert(row);

  return error ? { ok: false, error: error.message } : { ok: true };
}

// ── 기록 삭제 ────────────────────────────────────────────────────
export async function deleteLog(id: number): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('activity_logs')
    .delete()
    .eq('user_id', user.id)
    .eq('id', id);

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
// trail_count 컬럼은 이제 '완료한 활동 기록 수'를 센다 (010 마이그레이션 주석 참고).
export async function refreshProfileStats(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('distance_km')
    .eq('user_id', user.id)
    .eq('status', 'completed');

  if (!logs) return;

  const totalKm = logs.reduce((sum, l) => sum + (Number(l.distance_km) || 0), 0);

  await supabase.from('user_profiles').upsert({
    id: user.id,
    total_km: Math.round(totalKm),
    trail_count: logs.length,
  }, { onConflict: 'id' });
}
