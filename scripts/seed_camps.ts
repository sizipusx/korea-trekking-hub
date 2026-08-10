// scripts/seed_camps.ts
// ─────────────────────────────────────────────────────────────────
// Korea Trekking Hub — 지자체 운영 공공 캠핑장 시드 + 카카오 지오코딩
// 실행: npx tsx scripts/seed_camps.ts
//
// 필요 환경변수 (.env.local):
//   NEXT_PUBLIC_SUPABASE_URL          Supabase 프로젝트 URL
//   SUPABASE_SERVICE_ROLE_KEY         서비스 롤 키 (RLS bypass)
//   KAKAO_REST_API_KEY                카카오 REST API 키 (지오코딩용)
//
// 입력 파일:
//   csv_data/공공캠핑장/camps_master.csv        마스터 (329건)
//   csv_data/공공캠핑장/camps_reservation.csv   예약 정보 — 수기 입력분이 마스터를 덮어씀
//
// 동작:
//   1) 마스터 CSV 로드 (공유누리 294건은 좌표 보유, 고캠핑 보강 35건은 좌표 없음)
//   2) 좌표 없는 건만 카카오 로컬 API로 지오코딩 (결과는 캐시에 저장)
//   3) camps_reservation.csv 의 예약 정보를 id 기준으로 병합
//      → reservation_open 또는 use_season 이 채워져 있으면 reservation_verified = true
//   4) Supabase camps 테이블에 upsert
//
// 예약 정보를 수기로 채운 뒤 이 스크립트를 다시 돌리면 그대로 반영됩니다.
// ─────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const KAKAO_KEY    = process.env.KAKAO_REST_API_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.');
  process.exit(1);
}
if (!KAKAO_KEY) {
  console.warn('⚠️  KAKAO_REST_API_KEY 가 없습니다. 좌표 없는 건은 지도에서 제외됩니다.');
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const DATA_DIR   = path.join(process.cwd(), 'csv_data', '공공캠핑장');
const MASTER     = path.join(DATA_DIR, 'camps_master.csv');
const RESERVATION= path.join(DATA_DIR, 'camps_reservation.csv');
const CACHE_PATH = path.join(process.cwd(), 'scripts', 'camps_geocoded.json');

interface CampSeed {
  id: string; name: string; category: string; type_detail: string;
  region: string; sido: string; sigungu: string; address: string;
  lat: number | null; lng: number | null; geocoded: boolean;
  operator: string; operator_level: string; operator_verified: boolean;
  tel: string; facilities: string;
  reservation_org: string; reservation_url: string;
  reservation_open: string; use_season: string; reservation_note: string;
  reservation_verified: boolean;
  source: string;
}

// ── CSV 읽기 (엑셀이 CP949로 저장해도 깨지지 않게) ──────────────────
// 엑셀에서 CSV를 편집·저장하면 UTF-8 BOM 이 사라지고 ANSI(CP949)로 바뀝니다.
// UTF-8 로 먼저 시도하고 실패하면 EUC-KR 로 다시 읽습니다.
function readCsvFile(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    console.warn(`⚠️  ${path.basename(filePath)} 가 CP949 로 저장돼 있어 EUC-KR 로 읽습니다.`);
    console.warn('   (엑셀에서 편집했다면 "CSV UTF-8" 형식으로 저장해 주세요)');
    return new TextDecoder('euc-kr').decode(buf);
  }
}

// ── 최소 CSV 파서 (따옴표·개행 포함 필드 지원) ─────────────────────
function parseCsv(text: string): Record<string, string>[] {
  const src = text.replace(/^﻿/, ''); // UTF-8 BOM 제거 (엑셀 저장분 대응)
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }

  const [header, ...body] = rows.filter((r) => r.some((c) => c !== ''));
  return body.map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => { obj[h.trim()] = (r[i] ?? '').trim(); });
    return obj;
  });
}

// ── 카카오 지오코딩 ────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function kakaoKeyword(query: string) {
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=1`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
  if (!res.ok) return null;
  const json = await res.json();
  const doc = json.documents?.[0];
  if (!doc) return null;
  return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) }; // x=경도, y=위도
}

async function kakaoAddress(query: string) {
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}&size=1`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
  if (!res.ok) return null;
  const json = await res.json();
  const doc = json.documents?.[0];
  if (!doc) return null;
  return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
}

async function geocode(c: CampSeed) {
  // 1순위는 도로명 주소. 캠핑장명 키워드를 먼저 쓰면 같은 시군의 비슷한 이름을 잡는다.
  // (실제로 '고창군 국민여가캠핑장'이 '동호 국민여가캠핑장' 좌표로 14.8km 어긋난 적 있음)
  if (c.address) {
    const hit = await kakaoAddress(c.address);
    if (hit) return hit;
    await sleep(120);
  }
  for (const q of [`${c.sigungu} ${c.name}`, c.name]) {
    if (!q.trim()) continue;
    const hit = await kakaoKeyword(q);
    if (hit) return hit;
    await sleep(120);
  }
  return null;
}

// ── 로드 ───────────────────────────────────────────────────────────
function loadCamps(): CampSeed[] {
  const master = parseCsv(readCsvFile(MASTER));
  const resv = new Map<string, Record<string, string>>();
  if (fs.existsSync(RESERVATION)) {
    for (const r of parseCsv(readCsvFile(RESERVATION))) resv.set(r.id, r);
  }

  return master.map((m) => {
    const r = resv.get(m.id) ?? {};
    const lat = m.lat ? Number(m.lat) : null;
    const lng = m.lng ? Number(m.lng) : null;
    const open = (r.reservation_open ?? '').trim();
    const season = (r.use_season ?? '').trim();

    return {
      id: m.id,
      name: m.name,
      category: m.category,
      type_detail: m.type_detail ?? '',
      region: m.region,
      sido: m.sido ?? '',
      sigungu: m.sigungu ?? '',
      address: m.address ?? '',
      lat, lng,
      geocoded: lat !== null && lng !== null,
      operator: m.operator ?? '',
      operator_level: m.operator_level ?? '',
      operator_verified: m.operator_verified === 'Y',
      tel: m.tel ?? '',
      facilities: m.facilities ?? '',
      reservation_org: (r.reservation_org ?? m.operator ?? '').trim(),
      reservation_url: (r.reservation_url ?? m.homepage ?? '').trim(),
      reservation_open: open,
      use_season: season,
      reservation_note: (r.reservation_note ?? '').trim(),
      // 오픈 규칙이나 이용 기간 중 하나라도 채워졌으면 '확인됨'으로 표시
      reservation_verified: Boolean(open || season),
      source: m.source ?? '',
    };
  });
}

// 지도에서 직접 입력한 예약 정보를 CSV의 빈 칸이 덮어쓰지 않도록 보호합니다.
// (CSV에 값이 있으면 CSV가 이깁니다 — 수정은 CSV로 하세요.)
async function protectManualEdits(camps: CampSeed[]) {
  const { data, error } = await supabase
    .from('camps')
    .select('id, reservation_org, reservation_url, reservation_open, use_season, reservation_note');
  if (error || !data) return 0;

  const existing = new Map<string, Record<string, string | null>>();
  for (const r of data as Record<string, string | null>[]) {
    if (r.id) existing.set(r.id, r);
  }
  let kept = 0;
  for (const c of camps) {
    const prev = existing.get(c.id);
    if (!prev) continue;
    let touched = false;
    for (const key of ['reservation_org', 'reservation_url', 'reservation_open',
                       'use_season', 'reservation_note'] as const) {
      const dbVal = (prev[key] ?? '') as string;
      if (!c[key] && dbVal) { c[key] = dbVal; touched = true; }
    }
    if (touched) kept++;
    c.reservation_verified = Boolean(c.reservation_open || c.use_season);
  }
  return kept;
}

async function run() {
  const camps = loadCamps();
  console.log(`📄 마스터 로드: ${camps.length}건`);

  const kept = await protectManualEdits(camps);
  if (kept) console.log(`🛡  지도에서 입력한 예약 정보 ${kept}건 보존 (CSV 빈 칸은 덮어쓰지 않음)`);

  let cache: Record<string, { lat: number; lng: number }> = {};
  if (fs.existsSync(CACHE_PATH)) {
    try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch {}
  }

  let ok = 0, fail = 0, cached = 0, already = 0;
  for (const c of camps) {
    if (c.geocoded) { already++; continue; }
    if (cache[c.id]) {
      c.lat = cache[c.id].lat; c.lng = cache[c.id].lng; c.geocoded = true; cached++;
      continue;
    }
    if (!KAKAO_KEY) { fail++; continue; }
    const hit = await geocode(c);
    if (hit) {
      c.lat = hit.lat; c.lng = hit.lng; c.geocoded = true;
      cache[c.id] = hit; ok++;
      process.stdout.write(`✅ ${c.name} (${hit.lat.toFixed(4)}, ${hit.lng.toFixed(4)})\n`);
    } else {
      c.geocoded = false; fail++;
      process.stdout.write(`⚠️  좌표 실패: ${c.name} [${c.sigungu}]\n`);
    }
    await sleep(120);
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 1), 'utf8');
  console.log(`\n📍 지오코딩 — 원본보유 ${already} / 신규 ${ok} / 캐시 ${cached} / 실패 ${fail}`);

  console.log('🌱 camps 테이블 적재 중...');
  const chunkSize = 100;
  for (let i = 0; i < camps.length; i += chunkSize) {
    const chunk = camps.slice(i, i + chunkSize);
    const { error } = await supabase.from('camps').upsert(chunk, { onConflict: 'id' });
    if (error) { console.error('❌ upsert 실패:', error.message); process.exit(1); }
  }

  const withResv = camps.filter((c) => c.reservation_verified).length;
  console.log(`✅ ${camps.length}개 캠핑장 적재 완료`);
  console.log(`   지도 표시 가능(좌표 보유): ${camps.filter((c) => c.geocoded).length}개`);
  console.log(`   예약 정보 확인됨: ${withResv}개 / 미확인 ${camps.length - withResv}개`);
  console.log('   → 예약 정보는 csv_data/공공캠핑장/camps_reservation.csv 에 채운 뒤 재실행하세요.');
  console.log('🎉 시드 완료!');
}

run();
