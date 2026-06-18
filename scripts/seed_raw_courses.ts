/**
 * scripts/seed_raw_courses.ts
 *
 * GPX 분석 결과(GPX_코스_분석결과.xlsx) 및 CSV 통합 데이터(트레킹_코스_통합데이터.xlsx)를
 * Supabase raw_courses 테이블에 적재하는 시드 스크립트.
 *
 * 실행 방법:
 *   npx tsx scripts/seed_raw_courses.ts
 *
 * 사전 조건:
 *   1. Supabase에 raw_courses 테이블이 생성되어 있어야 합니다 (하단 CREATE TABLE SQL 참고).
 *   2. .env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 가 설정되어 있어야 합니다.
 *   3. npm install xlsx dotenv 되어 있어야 합니다.
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// ── 환경 변수 로드 ──────────────────────────────────────────────
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── 파일 경로 ────────────────────────────────────────────────────
const DATA_DIR    = path.resolve(process.cwd(), 'csv_data');
const GPX_XLSX    = path.join(DATA_DIR, 'GPX_코스_분석결과.xlsx');
const CSV_XLSX    = path.join(DATA_DIR, '트레킹_코스_통합데이터.xlsx');
const BATCH_SIZE  = 500;

// ── 카테고리 추론 헬퍼 ──────────────────────────────────────────
// ※ 주의: 긴 키워드(국가숲길)가 짧은 키워드(숲길)보다 반드시 앞에 위치해야 함
const CATEGORY_MAP: Record<string, string> = {
  '국가숲길': '국가숲길',   // '숲길' 보다 먼저 체크
  '등산':     '등산로',
  '산':       '등산로',
  '둘레':     '둘레길',
  '숲길':     '숲길',
  '트레킹':   '트레킹길',
  '테마':     '테마길',
  '오름':     '오름',
  '섬':       '섬트레킹',
  '문화':     '문화길',
  '정맥':     '정맥종주',
  '대간':     '정맥종주',
  '종주':     '종주',
};

function inferCategory(datasetName: string, categoryHint?: string): string {
  const text = `${datasetName} ${categoryHint ?? ''}`.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(key)) return val;
  }
  return '기타';
}

// ── Naismith 예상 소요시간 계산 ─────────────────────────────────
function calcEstTime(distanceKm: number, elevGainM: number): string {
  const totalHours = distanceKm / 4 + elevGainM / 100 * 0.5;
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60);
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

// ── GPX 분석 데이터 로드 ─────────────────────────────────────────
interface GpxRow {
  course_name: string;
  dataset_name: string;
  category: string;
  region: string;
  distance_km: number | null;
  elev_gain_m: number | null;
  elev_loss_m: number | null;
  est_time: string | null;
  start_lat: number | null;
  start_lng: number | null;
  gpx_path: string | null;
  source: 'GPX';
  difficulty: null;
  subcategory: string;
  address: null;
}

function loadGpxData(): GpxRow[] {
  if (!fs.existsSync(GPX_XLSX)) {
    console.warn(`⚠️  GPX Excel 파일을 찾을 수 없습니다: ${GPX_XLSX}`);
    return [];
  }

  const wb = XLSX.readFile(GPX_XLSX);
  const ws = wb.Sheets['GPX_전체분석'];
  if (!ws) {
    console.warn('⚠️  GPX_전체분석 시트가 없습니다.');
    return [];
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
  console.log(`📂  GPX 원천 데이터: ${rows.length}행`);

  return rows.map((r) => {
    const datasetName = String(r['데이터셋'] ?? r['dataset'] ?? '');
    const distKm      = typeof r['총거리(km)'] === 'number' ? r['총거리(km)']
                      : typeof r['거리(km)']  === 'number' ? r['거리(km)']  : null;
    const elevGain    = typeof r['누적상승(m)'] === 'number' ? r['누적상승(m)'] : null;
    const elevLoss    = typeof r['누적하강(m)'] === 'number' ? r['누적하강(m)'] : null;
    const startLat    = typeof r['시작위도'] === 'number' ? r['시작위도'] : null;
    const startLng    = typeof r['시작경도'] === 'number' ? r['시작경도'] : null;
    const gpxPath     = r['파일경로'] ? String(r['파일경로']) : null;

    return {
      course_name:  String(r['코스명'] ?? r['파일명'] ?? '알 수 없음'),
      dataset_name: datasetName,
      category:     inferCategory(datasetName),
      region:       String(r['지역'] ?? ''),
      subcategory:  String(r['서브폴더'] ?? ''),
      distance_km:  distKm,
      elev_gain_m:  elevGain,
      elev_loss_m:  elevLoss,
      est_time:     (distKm != null && elevGain != null) ? calcEstTime(distKm, elevGain) : null,
      difficulty:   null,
      start_lat:    startLat,
      start_lng:    startLng,
      address:      null,
      gpx_path:     gpxPath,
      source:       'GPX' as const,
    };
  });
}

// ── CSV 통합 데이터 로드 ─────────────────────────────────────────
interface CsvRow {
  course_name: string;
  dataset_name: string;
  category: string;
  region: string;
  distance_km: number | null;
  elev_gain_m: null;
  elev_loss_m: null;
  est_time: null;
  start_lat: number | null;
  start_lng: number | null;
  gpx_path: null;
  source: 'CSV';
  difficulty: string | null;
  subcategory: string;
  address: string | null;
}

function loadCsvData(): CsvRow[] {
  if (!fs.existsSync(CSV_XLSX)) {
    console.warn(`⚠️  CSV Excel 파일을 찾을 수 없습니다: ${CSV_XLSX}`);
    return [];
  }

  const wb = XLSX.readFile(CSV_XLSX);
  // 통합요약 시트 사용 — 실제 시트명은 '【통합요약】' (괄호 포함)
  const SUMMARY_SHEET = '【통합요약】';
  const sheetName = wb.SheetNames.includes(SUMMARY_SHEET) ? SUMMARY_SHEET : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
  console.log(`📂  CSV 원천 데이터: ${rows.length}행 (시트: ${sheetName})`);

  return rows.map((r) => {
    // 통합요약 시트의 데이터셋 컬럼명은 '파일출처'
    const datasetName = String(r['파일출처'] ?? r['데이터셋'] ?? r['출처'] ?? '');
    const distRaw     = r['거리(km)'] ?? r['거리_km'] ?? r['총 거리(km)'];
    const distKm      = typeof distRaw === 'number' ? distRaw :
                        (distRaw ? parseFloat(String(distRaw)) : null);
    const latRaw      = r['위도'] ?? r['시작위도'] ?? r['Y'];
    const lngRaw      = r['경도'] ?? r['시작경도'] ?? r['X'];

    return {
      course_name:  String(r['코스명'] ?? r['경로명'] ?? r['구간명'] ?? '알 수 없음'),
      dataset_name: datasetName,
      category:     inferCategory(datasetName, String(r['카테고리'] ?? '')),
      region:       String(r['지역'] ?? r['지역명'] ?? ''),
      subcategory:  String(r['서브카테고리'] ?? ''),
      distance_km:  Number.isFinite(distKm) ? distKm : null,
      elev_gain_m:  null,
      elev_loss_m:  null,
      est_time:     null,
      difficulty:   r['난이도'] ? String(r['난이도']) : null,
      start_lat:    latRaw ? parseFloat(String(latRaw)) : null,
      start_lng:    lngRaw ? parseFloat(String(lngRaw)) : null,
      address:      r['주소'] ? String(r['주소']) : null,
      gpx_path:     null,
      source:       'CSV' as const,
    };
  }).filter((r) => r.course_name !== '알 수 없음' || r.dataset_name);
}

// ── 배치 업서트 ──────────────────────────────────────────────────
async function upsertBatch(rows: (GpxRow | CsvRow)[], batchNum: number) {
  const { error } = await supabase.from('raw_courses').insert(rows);
  if (error) {
    console.error(`❌  배치 ${batchNum} 오류:`, error.message);
    return false;
  }
  return true;
}

// ── 메인 ────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀  Korea Trekking Hub — raw_courses 시드 스크립트 시작\n');

  // 기존 데이터 초기화 여부 확인
  const { count: existing } = await supabase
    .from('raw_courses')
    .select('*', { count: 'exact', head: true });

  if (existing && existing > 0) {
    console.log(`⚠️  raw_courses 테이블에 이미 ${existing.toLocaleString()}건의 데이터가 있습니다.`);
    console.log('    덮어쓰려면 먼저 테이블을 TRUNCATE 해주세요.\n');
    console.log('    SQL: TRUNCATE TABLE raw_courses RESTART IDENTITY;\n');
  }

  const gpxRows = loadGpxData();
  const csvRows = loadCsvData();
  const allRows = [...gpxRows, ...csvRows];

  console.log(`\n📊  총 ${allRows.length.toLocaleString()}건 적재 시작 (배치 크기: ${BATCH_SIZE})\n`);

  let success = 0;
  let failed  = 0;

  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    const batch = allRows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const ok = await upsertBatch(batch, batchNum);
    if (ok) {
      success += batch.length;
      const pct = Math.round((i + batch.length) / allRows.length * 100);
      process.stdout.write(`\r✅  배치 ${batchNum} 완료 — ${(i + batch.length).toLocaleString()} / ${allRows.length.toLocaleString()} (${pct}%)`);
    } else {
      failed += batch.length;
    }
  }

  console.log(`\n\n🎉  완료! 성공: ${success.toLocaleString()}건, 실패: ${failed.toLocaleString()}건\n`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});


// ══════════════════════════════════════════════════════════════════
// Supabase 테이블 생성 SQL (실행 전 Supabase SQL Editor에서 먼저 실행)
// ══════════════════════════════════════════════════════════════════
/*
-- raw_courses 테이블 생성
CREATE TABLE IF NOT EXISTS public.raw_courses (
  id            BIGSERIAL PRIMARY KEY,
  course_name   VARCHAR(200)  NOT NULL,
  category      VARCHAR(30)   NOT NULL DEFAULT '기타',
  dataset_name  VARCHAR(100)  NOT NULL DEFAULT '',
  subcategory   VARCHAR(100)  NOT NULL DEFAULT '',
  region        VARCHAR(50)   NOT NULL DEFAULT '',
  distance_km   DECIMAL(8,2),
  elev_gain_m   DECIMAL(8,1),
  elev_loss_m   DECIMAL(8,1),
  est_time      VARCHAR(20),
  difficulty    VARCHAR(20),
  start_lat     DECIMAL(10,6),
  start_lng     DECIMAL(10,6),
  address       TEXT,
  gpx_path      TEXT,
  source        VARCHAR(3)    NOT NULL CHECK (source IN ('GPX','CSV')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_raw_courses_category    ON public.raw_courses(category);
CREATE INDEX IF NOT EXISTS idx_raw_courses_source      ON public.raw_courses(source);
CREATE INDEX IF NOT EXISTS idx_raw_courses_dataset     ON public.raw_courses(dataset_name);
CREATE INDEX IF NOT EXISTS idx_raw_courses_region      ON public.raw_courses(region);
CREATE INDEX IF NOT EXISTS idx_raw_courses_distance    ON public.raw_courses(distance_km);
CREATE INDEX IF NOT EXISTS idx_raw_courses_elev        ON public.raw_courses(elev_gain_m);
CREATE INDEX IF NOT EXISTS idx_raw_courses_coords      ON public.raw_courses(start_lat, start_lng)
  WHERE start_lat IS NOT NULL;

-- 전문 검색 인덱스 (선택)
CREATE INDEX IF NOT EXISTS idx_raw_courses_name_gin
  ON public.raw_courses
  USING gin(to_tsvector('simple', course_name || ' ' || dataset_name || ' ' || region));

-- RLS 비활성화 (서비스 키 사용 시)
ALTER TABLE public.raw_courses DISABLE ROW LEVEL SECURITY;
*/
