-- ================================================================
-- Korea Outdoor Hub — 활동 기록 스키마 전환
-- 파일: 010_create_activity_logs.sql
-- 실행: Supabase Dashboard > SQL Editor 에 붙여넣고 Run
--
-- user_logs.trail_id 가 trails(id)에 FK로 묶여 있어 라이딩·백패킹·캠핑 기록을
-- 남길 수 없었다. 장소를 (종류, id) 쌍으로 가리키는 activity_logs 로 옮긴다.
--
-- 기존 user_logs 는 지우지 않고 그대로 둔다. 아래 백필로 내용을 복사해 가므로
-- 문제가 생기면 코드만 되돌리면 된다. 안정화된 뒤에 별도로 정리할 것.
-- ================================================================

-- ── activity_logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id              SERIAL       PRIMARY KEY,
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  activity        TEXT         NOT NULL DEFAULT 'trekking',  -- riding / backpacking / camping / trekking

  -- 장소는 레이어가 계속 늘어나므로 FK를 걸지 않고 (종류, id) 쌍으로 가리킨다.
  -- place_name 을 함께 복사해 두어, 원본 행이 사라져도 기록 자체는 읽을 수 있게 한다.
  place_type      TEXT         NOT NULL DEFAULT 'none',      -- trail / forest / camp / none
  place_id        TEXT,                                      -- none 이면 NULL (자유 기록)
  place_name      TEXT         NOT NULL DEFAULT '',

  visited_date    DATE,
  status          TEXT         NOT NULL DEFAULT 'planned',
  rating          SMALLINT,
  distance_km     NUMERIC(7,2),   -- 라이딩·백패킹은 실제 이동 거리가 기록의 핵심
  duration_days   SMALLINT,
  weather         TEXT         NOT NULL DEFAULT '',
  companions      TEXT         NOT NULL DEFAULT '혼자',
  difficulty_felt TEXT         NOT NULL DEFAULT '',
  notes           TEXT         NOT NULL DEFAULT '',
  photos          TEXT[]       NOT NULL DEFAULT '{}',

  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT activity_logs_activity_check CHECK (
    activity IN ('riding','backpacking','camping','trekking')
  ),
  CONSTRAINT activity_logs_place_type_check CHECK (
    place_type IN ('trail','forest','camp','none')
  ),
  CONSTRAINT activity_logs_status_check CHECK (
    status IN ('planned','in_progress','completed')
  ),
  CONSTRAINT activity_logs_rating_check CHECK (
    rating IS NULL OR rating BETWEEN 1 AND 5
  ),
  -- 장소를 가리키면 id가 있어야 하고, 자유 기록이면 없어야 한다
  CONSTRAINT activity_logs_place_pair_check CHECK (
    (place_type = 'none' AND place_id IS NULL)
    OR (place_type <> 'none' AND place_id IS NOT NULL)
  ),

  -- 같은 활동으로 같은 장소를 두 번 기록하지 않도록.
  -- 자유 기록은 place_id가 NULL이고 NULL끼리는 서로 다른 값으로 취급되므로
  -- 이 제약에 걸리지 않고 여러 건 쌓인다.
  -- (부분 유니크 인덱스로 만들면 ON CONFLICT 추론이 안 돼 upsert가 실패한다)
  CONSTRAINT activity_logs_place_key UNIQUE (user_id, activity, place_type, place_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user     ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity ON public.activity_logs(activity);
CREATE INDEX IF NOT EXISTS idx_activity_logs_place    ON public.activity_logs(place_type, place_id);

-- ── updated_at 트리거 (001에서 만든 함수 재사용) ────────────────
DROP TRIGGER IF EXISTS activity_logs_updated_at ON public.activity_logs;
CREATE TRIGGER activity_logs_updated_at
  BEFORE UPDATE ON public.activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── RLS — 내 기록만 ──────────────────────────────────────────────
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_logs_select_own" ON public.activity_logs;
CREATE POLICY "activity_logs_select_own"
  ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "activity_logs_insert_own" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_own"
  ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "activity_logs_update_own" ON public.activity_logs;
CREATE POLICY "activity_logs_update_own"
  ON public.activity_logs FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "activity_logs_delete_own" ON public.activity_logs;
CREATE POLICY "activity_logs_delete_own"
  ON public.activity_logs FOR DELETE USING (auth.uid() = user_id);

-- ── 기존 user_logs 백필 ─────────────────────────────────────────
-- 전부 트레킹 · 트레일 기록으로 옮긴다. 거리는 코스 거리를 그대로 복사한다.
-- 여러 번 실행해도 유니크 제약 덕분에 중복이 생기지 않는다.
INSERT INTO public.activity_logs (
  user_id, activity, place_type, place_id, place_name,
  visited_date, status, rating, distance_km, duration_days,
  weather, companions, difficulty_felt, notes, photos, created_at
)
SELECT
  ul.user_id,
  'trekking',
  'trail',
  ul.trail_id,
  COALESCE(t.name, ''),
  ul.visited_date,
  ul.status,
  ul.rating,
  t.distance_km,
  ul.duration_days,
  COALESCE(ul.weather, ''),
  COALESCE(NULLIF(ul.companions, ''), '혼자'),
  COALESCE(ul.difficulty_felt, ''),
  COALESCE(ul.notes, ''),
  COALESCE(ul.photos, '{}'),
  ul.created_at
FROM public.user_logs ul
LEFT JOIN public.trails t ON t.id = ul.trail_id
ON CONFLICT DO NOTHING;

-- ── user_profiles 통계 컬럼 일반화 ──────────────────────────────
-- trail_count 는 이제 '트레일 개수'가 아니라 '완료한 활동 기록 수'를 센다.
-- 이름만 바꾸면 기존 코드가 깨지므로 컬럼은 두고 의미만 넓힌다.
COMMENT ON COLUMN public.user_profiles.trail_count IS '완료한 활동 기록 수 (트레일 전용 아님)';
COMMENT ON COLUMN public.user_profiles.total_km    IS '완료한 활동 기록의 거리 합계';

-- ── 확인용 ──────────────────────────────────────────────────────
-- SELECT activity, place_type, COUNT(*) FROM public.activity_logs GROUP BY 1,2;
