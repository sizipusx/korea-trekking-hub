-- ================================================================
-- Korea Trekking Hub — 지자체 운영 공공 캠핑장
-- 파일: 008_create_camps_schema.sql
-- 실행: Supabase Dashboard > SQL Editor 에 붙여넣고 Run
--
-- 출처: 공유누리(행정안전부) 국공립 야영장 + 고캠핑(한국관광공사) 등록현황 보강
-- ================================================================

-- ── camps (공공 캠핑장 마스터) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.camps (
  id                   TEXT        PRIMARY KEY,        -- 'camp-31594' / 'camp-gc-001'
  name                 TEXT        NOT NULL,
  category             TEXT        NOT NULL,           -- 일반야영장 / 자동차야영장 / 카라반 / 글램핑
  type_detail          TEXT        NOT NULL DEFAULT '',
  region               TEXT        NOT NULL,           -- 9개 권역
  sido                 TEXT        NOT NULL DEFAULT '',
  sigungu              TEXT        NOT NULL DEFAULT '',
  address              TEXT        NOT NULL DEFAULT '',

  lat                  NUMERIC(10,6),                  -- 좌표 없으면 NULL
  lng                  NUMERIC(10,6),
  geocoded             BOOLEAN     NOT NULL DEFAULT FALSE,

  -- 운영 주체
  operator             TEXT        NOT NULL DEFAULT '',
  operator_level       TEXT        NOT NULL DEFAULT '',
  operator_verified    BOOLEAN     NOT NULL DEFAULT FALSE,

  tel                  TEXT        NOT NULL DEFAULT '',
  facilities           TEXT        NOT NULL DEFAULT '',

  -- 예약 정보 (핵심)
  reservation_org      TEXT        NOT NULL DEFAULT '',
  reservation_url      TEXT        NOT NULL DEFAULT '',
  reservation_open     TEXT        NOT NULL DEFAULT '',  -- '이용월 1개월 전 1일 09시' 등. '' = 미확인
  use_season           TEXT        NOT NULL DEFAULT '',  -- '연중', '3~11월' 등. '' = 미확인
  reservation_note     TEXT        NOT NULL DEFAULT '',
  reservation_verified BOOLEAN     NOT NULL DEFAULT FALSE,

  source               TEXT        NOT NULL DEFAULT '',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT camps_category_check CHECK (
    category IN ('일반야영장','자동차야영장','카라반','글램핑')
  ),
  CONSTRAINT camps_region_check CHECK (
    region IN (
      '서울인천경기','강원','충북','대전충남','전북',
      '광주전남','대구경북','부산경남','제주'
    )
  ),
  CONSTRAINT camps_operator_level_check CHECK (
    operator_level IN ('', '기초자치단체','광역자치단체','지방공기업·출자출연기관')
  )
);

-- ── 인덱스 ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_camps_category ON public.camps(category);
CREATE INDEX IF NOT EXISTS idx_camps_region   ON public.camps(region);
CREATE INDEX IF NOT EXISTS idx_camps_geocoded ON public.camps(geocoded);
-- 예약 오픈 규칙이 채워진 곳만 빠르게 뽑기 위한 부분 인덱스
CREATE INDEX IF NOT EXISTS idx_camps_reservation_verified
  ON public.camps(reservation_verified) WHERE reservation_verified = TRUE;

-- Full-text 검색 인덱스 (이름·시군·권역)
CREATE INDEX IF NOT EXISTS idx_camps_fts ON public.camps
  USING GIN(to_tsvector('simple', name || ' ' || sigungu || ' ' || region));

-- ── updated_at 자동 갱신 트리거 (001에서 만든 함수 재사용) ───────
DROP TRIGGER IF EXISTS camps_updated_at ON public.camps;
CREATE TRIGGER camps_updated_at
  BEFORE UPDATE ON public.camps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Row Level Security ───────────────────────────────────────────
ALTER TABLE public.camps ENABLE ROW LEVEL SECURITY;

-- 공개 정보 → 누구나 읽기 가능
DROP POLICY IF EXISTS "camps_select_public" ON public.camps;
CREATE POLICY "camps_select_public"
  ON public.camps FOR SELECT USING (TRUE);

-- 관리자 쓰기 (service_role key 사용 시 RLS bypass)
DROP POLICY IF EXISTS "camps_insert_admin" ON public.camps;
CREATE POLICY "camps_insert_admin"
  ON public.camps FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "camps_update_admin" ON public.camps;
CREATE POLICY "camps_update_admin"
  ON public.camps FOR UPDATE
  USING (auth.role() = 'service_role');
