-- ================================================================
-- Korea Trekking Hub — Phase 5 Migration
-- 파일: 003_create_forests_schema.sql
-- 자연휴양림(국립/공립/사립) 위치 + 예약정책
-- 실행: Supabase Dashboard > SQL Editor 에 붙여넣고 Run
-- ================================================================

-- ── forests (휴양림 마스터) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.forests (
  id                TEXT          PRIMARY KEY,        -- 'nf-yumyeongsan' 등 slug
  name              TEXT          NOT NULL,
  category          TEXT          NOT NULL,           -- 국립 / 공립 / 사립
  region            TEXT          NOT NULL,           -- 권역
  sigungu           TEXT          NOT NULL DEFAULT '',
  address           TEXT          NOT NULL DEFAULT '',

  lat               NUMERIC(10,6),                    -- 지오코딩 결과 (NULL 허용)
  lng               NUMERIC(10,6),
  geocoded          BOOLEAN       NOT NULL DEFAULT FALSE,

  -- 시설
  has_room          BOOLEAN       NOT NULL DEFAULT FALSE,
  has_camp          BOOLEAN       NOT NULL DEFAULT FALSE,
  has_waitlist      BOOLEAN       NOT NULL DEFAULT FALSE,

  -- 예약 방식
  fcfs_type         TEXT          NOT NULL DEFAULT '',   -- '6주','4주','익월말' 등
  open_time         TEXT          NOT NULL DEFAULT '',   -- 예약 오픈 시각 안내
  lottery_targets   TEXT[]        NOT NULL DEFAULT '{}', -- 추첨제 대상
  priority_targets  TEXT[]        NOT NULL DEFAULT '{}', -- 우선예약 대상

  reservation_url   TEXT          NOT NULL DEFAULT '',
  reservation_org   TEXT          NOT NULL DEFAULT '',
  note              TEXT          NOT NULL DEFAULT '',

  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT forests_category_check CHECK (
    category IN ('국립','공립','사립')
  ),
  CONSTRAINT forests_region_check CHECK (
    region IN (
      '서울인천경기','강원','충북','대전충남','전북',
      '광주전남','대구경북','부산경남','제주'
    )
  )
);

-- ── 인덱스 ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_forests_category ON public.forests(category);
CREATE INDEX IF NOT EXISTS idx_forests_region   ON public.forests(region);
CREATE INDEX IF NOT EXISTS idx_forests_geocoded ON public.forests(geocoded);

-- Full-text 검색 인덱스 (이름·시군·권역)
CREATE INDEX IF NOT EXISTS idx_forests_fts ON public.forests
  USING GIN(to_tsvector('simple', name || ' ' || sigungu || ' ' || region));

-- ── updated_at 자동 갱신 트리거 (001에서 만든 함수 재사용) ───────
DROP TRIGGER IF EXISTS forests_updated_at ON public.forests;
CREATE TRIGGER forests_updated_at
  BEFORE UPDATE ON public.forests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Row Level Security ───────────────────────────────────────────
ALTER TABLE public.forests ENABLE ROW LEVEL SECURITY;

-- 공개 정보 → 누구나 읽기 가능
CREATE POLICY "forests_select_public"
  ON public.forests FOR SELECT USING (TRUE);

-- 관리자 쓰기 (service_role key 사용 시 RLS bypass)
CREATE POLICY "forests_insert_admin"
  ON public.forests FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "forests_update_admin"
  ON public.forests FOR UPDATE
  USING (auth.role() = 'service_role');
