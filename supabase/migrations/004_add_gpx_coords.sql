-- ================================================================
-- Migration 004: raw_courses 테이블에 gpx_coords 컬럼 추가
-- 실행: Supabase Dashboard > SQL Editor 에 붙여넣기
-- 목적: GPX 좌표를 파일시스템 대신 DB에 저장 (Vercel 서버리스 대응)
-- ================================================================

ALTER TABLE public.raw_courses
  ADD COLUMN IF NOT EXISTS gpx_coords jsonb DEFAULT NULL;

-- 인덱스: gpx_coords가 있는 행만 빠르게 조회
CREATE INDEX IF NOT EXISTS idx_raw_courses_gpx_coords_notnull
  ON public.raw_courses ((gpx_coords IS NOT NULL));

COMMENT ON COLUMN public.raw_courses.gpx_coords IS
  'GPX 경로 좌표 배열 [[lat, lng], ...] — 최대 400 포인트 다운샘플링';
