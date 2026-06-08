-- ================================================================
-- Korea Trekking Hub — Phase 4 Migration
-- 파일: 002_phase4_auth_logs.sql
-- Supabase SQL Editor에 붙여넣고 Run
-- ================================================================

-- ── user_logs 테이블 (Phase 2-B에서 이미 생성됨, 컬럼 추가) ─────
ALTER TABLE public.user_logs
  ADD COLUMN IF NOT EXISTS duration_days  SMALLINT,
  ADD COLUMN IF NOT EXISTS weather        TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS companions     TEXT    DEFAULT 'solo',
  ADD COLUMN IF NOT EXISTS difficulty_felt TEXT   DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ── user_profiles (닉네임, 아바타 등 추가 정보) ─────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname      TEXT        NOT NULL DEFAULT '',
  avatar_url    TEXT        NOT NULL DEFAULT '',
  total_km      NUMERIC     NOT NULL DEFAULT 0,
  trail_count   SMALLINT    NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"
  ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"
  ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- ── updated_at 트리거 (user_logs) ────────────────────────────────
DROP TRIGGER IF EXISTS user_logs_updated_at ON public.user_logs;
CREATE TRIGGER user_logs_updated_at
  BEFORE UPDATE ON public.user_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Storage 버킷 생성 (Supabase Storage API로도 가능) ────────────
-- Supabase Dashboard > Storage > New bucket 에서 수동으로 만드세요:
-- 버킷 이름: trail-photos
-- Public: false (비공개)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- ── Storage RLS ──────────────────────────────────────────────────
-- Storage 정책은 Dashboard > Storage > Policies 에서 설정합니다.
-- "trail-photos" 버킷에 아래 정책 추가:
-- SELECT: auth.uid()::text = (storage.foldername(name))[1]
-- INSERT: auth.uid()::text = (storage.foldername(name))[1]
-- DELETE: auth.uid()::text = (storage.foldername(name))[1]
