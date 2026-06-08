// lib/storage.ts — Supabase Storage 사진 업로드
import { createClient } from '@/lib/supabase/client';

const BUCKET = 'trail-photos';

export async function uploadPhoto(
  userId: string,
  trailId: string,
  file: File
): Promise<{ url: string | null; error?: string }> {
  const supabase = createClient();

  // 파일명: userId/trailId/timestamp.ext
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${trailId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function deletePhoto(url: string): Promise<boolean> {
  const supabase = createClient();
  // URL에서 경로 추출
  const path = url.split(`${BUCKET}/`)[1];
  if (!path) return false;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return !error;
}
