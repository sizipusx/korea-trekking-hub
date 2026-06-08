-- ================================================================
-- Korea Trekking Hub — Supabase Migration
-- 파일: 001_create_trails_schema.sql
-- 실행: Supabase Dashboard > SQL Editor 에 붙여넣기
-- ================================================================

-- ── 1. trails (메인 테이블) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trails (
  id              TEXT        PRIMARY KEY,          -- 'et-55', 'jiri-dl' 등
  name            TEXT        NOT NULL,
  region          TEXT        NOT NULL,
  province        TEXT        NOT NULL,
  distance_km     NUMERIC     NOT NULL,
  days_required   TEXT        NOT NULL,             -- '1일', '2~3일' 등
  difficulty      TEXT        NOT NULL,             -- CHECK 아래
  camping         BOOLEAN     NOT NULL DEFAULT FALSE,
  backpacking     BOOLEAN     NOT NULL DEFAULT FALSE,
  category        TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT '운영중',
  open_year       SMALLINT,
  segments        SMALLINT,
  highlights      TEXT        NOT NULL DEFAULT '',
  source          TEXT        NOT NULL DEFAULT '',
  official_url    TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT trails_difficulty_check CHECK (
    difficulty IN ('하','중하','중','중상','상','최상')
  ),
  CONSTRAINT trails_category_check CHECK (
    category IN (
      '동서트레일','국가숲길','코리아둘레길',
      '국립공원','제주 올레','지자체 트레일','백두대간'
    )
  )
);

-- ── 2. trail_gpx (시작점 GPX 좌표) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.trail_gpx (
  id              SERIAL      PRIMARY KEY,
  trail_id        TEXT        NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
  lat             NUMERIC(10,6) NOT NULL,
  lng             NUMERIC(10,6) NOT NULL,
  elevation_m     SMALLINT    NOT NULL DEFAULT 0,
  start_point     TEXT        NOT NULL DEFAULT '',
  UNIQUE(trail_id)
);

-- ── 3. trail_seasons (시즌 정보) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trail_seasons (
  id              SERIAL      PRIMARY KEY,
  trail_id        TEXT        NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
  spring          SMALLINT    NOT NULL DEFAULT 3 CHECK (spring BETWEEN 1 AND 5),
  summer          SMALLINT    NOT NULL DEFAULT 3 CHECK (summer BETWEEN 1 AND 5),
  fall            SMALLINT    NOT NULL DEFAULT 3 CHECK (fall   BETWEEN 1 AND 5),
  winter          SMALLINT    NOT NULL DEFAULT 3 CHECK (winter BETWEEN 1 AND 5),
  note_spring     TEXT        NOT NULL DEFAULT '',
  note_summer     TEXT        NOT NULL DEFAULT '',
  note_fall       TEXT        NOT NULL DEFAULT '',
  note_winter     TEXT        NOT NULL DEFAULT '',
  best_months     SMALLINT[]  NOT NULL DEFAULT '{}',   -- [4,5,9,10]
  terrain_tags    TEXT[]      NOT NULL DEFAULT '{}',   -- ['숲길','계곡']
  UNIQUE(trail_id)
);

-- ── 4. user_logs (개인 탐방 기록) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_logs (
  id              SERIAL       PRIMARY KEY,
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trail_id        TEXT         NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
  visited_date    DATE,
  status          TEXT         NOT NULL DEFAULT 'planned'
                               CHECK (status IN ('planned','in_progress','completed')),
  rating          SMALLINT     CHECK (rating BETWEEN 1 AND 5),
  notes           TEXT         NOT NULL DEFAULT '',
  photos          TEXT[]       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, trail_id)
);

-- ── 인덱스 ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trails_category   ON public.trails(category);
CREATE INDEX IF NOT EXISTS idx_trails_difficulty ON public.trails(difficulty);
CREATE INDEX IF NOT EXISTS idx_trails_province   ON public.trails(province);
CREATE INDEX IF NOT EXISTS idx_trail_gpx_trail   ON public.trail_gpx(trail_id);
CREATE INDEX IF NOT EXISTS idx_trail_seasons_trail ON public.trail_seasons(trail_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_user    ON public.user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_trail   ON public.user_logs(trail_id);

-- GIN 인덱스 (배열 컬럼 검색용)
CREATE INDEX IF NOT EXISTS idx_seasons_best_months ON public.trail_seasons USING GIN(best_months);
CREATE INDEX IF NOT EXISTS idx_seasons_terrain_tags ON public.trail_seasons USING GIN(terrain_tags);

-- Full-text 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_trails_fts ON public.trails
  USING GIN(to_tsvector('simple', name || ' ' || region || ' ' || province));

-- ── updated_at 자동 갱신 트리거 ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trails_updated_at ON public.trails;
CREATE TRIGGER trails_updated_at
  BEFORE UPDATE ON public.trails
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Row Level Security (RLS) ─────────────────────────────────────
ALTER TABLE public.trails       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_gpx    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_logs    ENABLE ROW LEVEL SECURITY;

-- 트레일 데이터: 누구나 읽기 가능 (공개 정보)
CREATE POLICY "trails_select_public"
  ON public.trails FOR SELECT USING (TRUE);

CREATE POLICY "trail_gpx_select_public"
  ON public.trail_gpx FOR SELECT USING (TRUE);

CREATE POLICY "trail_seasons_select_public"
  ON public.trail_seasons FOR SELECT USING (TRUE);

-- 관리자 쓰기 정책 (service_role key 사용 시 RLS bypass)
CREATE POLICY "trails_insert_admin"
  ON public.trails FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "trails_update_admin"
  ON public.trails FOR UPDATE
  USING (auth.role() = 'service_role');

-- 개인 탐방 기록: 본인만 접근
CREATE POLICY "logs_select_own"
  ON public.user_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "logs_insert_own"
  ON public.user_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "logs_update_own"
  ON public.user_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "logs_delete_own"
  ON public.user_logs FOR DELETE
  USING (auth.uid() = user_id);
