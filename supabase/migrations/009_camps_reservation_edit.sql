-- ================================================================
-- Korea Trekking Hub — 캠핑장 예약 정보 현장 편집 권한
-- 파일: 009_camps_reservation_edit.sql
-- 실행: Supabase Dashboard > SQL Editor 에 붙여넣고 Run
--
-- 로그인한 사용자가 지도에서 캠핑장을 클릭해 예약 정보를 직접 입력할 수 있도록,
-- '예약 관련 컬럼만' UPDATE 를 허용합니다.
-- 컬럼 단위 GRANT + RLS 정책 조합이라 name/lat/lng 등 마스터 데이터는 건드릴 수 없습니다.
-- ================================================================

-- ── 1) 테이블 전체 UPDATE 권한 회수 후, 예약 컬럼만 부여 ──────────
REVOKE UPDATE ON public.camps FROM authenticated;

GRANT UPDATE (
  reservation_org,
  reservation_url,
  reservation_open,
  use_season,
  reservation_note,
  reservation_verified
) ON public.camps TO authenticated;

-- ── 2) RLS 정책: 로그인 사용자는 모든 행을 수정할 수 있음 ─────────
--     (어떤 컬럼을 수정할 수 있는지는 위의 컬럼 GRANT 가 통제)
DROP POLICY IF EXISTS "camps_update_authenticated" ON public.camps;
CREATE POLICY "camps_update_authenticated"
  ON public.camps FOR UPDATE
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- ── 3) 누가 언제 고쳤는지 남기기 ─────────────────────────────────
ALTER TABLE public.camps
  ADD COLUMN IF NOT EXISTS reservation_updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reservation_updated_at TIMESTAMPTZ;

GRANT UPDATE (reservation_updated_by, reservation_updated_at) ON public.camps TO authenticated;

-- 예약 정보가 바뀔 때마다 편집자·시각을 자동 기록
CREATE OR REPLACE FUNCTION public.handle_camp_reservation_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.reservation_open, NEW.use_season, NEW.reservation_note,
      NEW.reservation_org, NEW.reservation_url)
     IS DISTINCT FROM
     (OLD.reservation_open, OLD.use_season, OLD.reservation_note,
      OLD.reservation_org, OLD.reservation_url)
  THEN
    NEW.reservation_updated_by := auth.uid();
    NEW.reservation_updated_at := NOW();
    -- 오픈 규칙이나 이용 기간 중 하나라도 채워지면 '확인됨'
    NEW.reservation_verified :=
      COALESCE(NULLIF(TRIM(NEW.reservation_open), ''), NULLIF(TRIM(NEW.use_season), '')) IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS camps_reservation_edit ON public.camps;
CREATE TRIGGER camps_reservation_edit
  BEFORE UPDATE ON public.camps
  FOR EACH ROW EXECUTE FUNCTION public.handle_camp_reservation_edit();
