/**
 * scripts/migrate_gpx_to_db.ts
 *
 * 로컬 GPX 파일을 파싱해 raw_courses.gpx_coords 컬럼에 저장합니다.
 *
 * 실행 방법:
 *   npx tsx scripts/migrate_gpx_to_db.ts
 *
 * 사전 조건:
 *   - supabase/migrations/004_add_gpx_coords.sql 을 Supabase 대시보드에서 먼저 실행
 *   - .env.local 에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수 필요
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MAX_POINTS = 400;
const BATCH_SIZE = 50; // 한 번에 업데이트할 행 수

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

function parseGpxCoords(gpxContent: string): [number, number][] {
  const regex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g;
  const all: [number, number][] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(gpxContent)) !== null) {
    all.push([parseFloat(m[1]), parseFloat(m[2])]);
  }
  if (all.length === 0) return [];

  // 다운샘플링
  const step = Math.max(1, Math.floor(all.length / MAX_POINTS));
  const sampled = all.filter((_, i) => i % step === 0);
  const last = all[all.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);
  return sampled;
}

async function main() {
  console.log('🗂  GPX → DB 마이그레이션 시작\n');

  // 1. gpx_coords 가 null 인 GPX 코스만 조회
  const { data: courses, error } = await supabase
    .from('raw_courses')
    .select('id, course_name, gpx_path')
    .eq('source', 'GPX')
    .not('gpx_path', 'is', null)
    .is('gpx_coords', null)
    .order('id');

  if (error) {
    console.error('❌ DB 조회 오류:', error.message);
    process.exit(1);
  }

  const total = courses?.length ?? 0;
  console.log(`📋 처리할 코스: ${total}개\n`);
  if (total === 0) {
    console.log('✅ 모든 코스가 이미 마이그레이션 완료되었습니다.');
    return;
  }

  let done = 0;
  let skipped = 0;
  let failed = 0;

  // 2. BATCH_SIZE 단위로 처리
  for (let i = 0; i < (courses ?? []).length; i += BATCH_SIZE) {
    const batch = (courses ?? []).slice(i, i + BATCH_SIZE);
    const updates: { id: number; gpx_coords: [number, number][] }[] = [];

    for (const course of batch) {
      if (!course.gpx_path) { skipped++; continue; }

      const absPath = path.join(process.cwd(), course.gpx_path);
      if (!existsSync(absPath)) {
        console.warn(`  ⚠️  파일 없음 (id=${course.id}): ${course.gpx_path}`);
        failed++;
        continue;
      }

      try {
        const content = await readFile(absPath, 'utf-8');
        const coords = parseGpxCoords(content);
        if (coords.length === 0) {
          console.warn(`  ⚠️  좌표 없음 (id=${course.id}): ${course.course_name}`);
          failed++;
          continue;
        }
        updates.push({ id: course.id, gpx_coords: coords });
        done++;
      } catch (e) {
        console.warn(`  ❌ 읽기 오류 (id=${course.id}): ${e}`);
        failed++;
      }
    }

    // 3. Supabase 업데이트 (개별 upsert)
    for (const u of updates) {
      const { error: upErr } = await supabase
        .from('raw_courses')
        .update({ gpx_coords: u.gpx_coords })
        .eq('id', u.id);
      if (upErr) {
        console.error(`  ❌ 업데이트 실패 (id=${u.id}):`, upErr.message);
        failed++;
        done--;
      }
    }

    const pct = Math.round(((i + batch.length) / total) * 100);
    process.stdout.write(`\r  진행: ${i + batch.length}/${total} (${pct}%) — 성공 ${done}, 실패 ${failed}`);
  }

  console.log('\n\n=================================');
  console.log(`✅ 완료: ${done}개 저장`);
  console.log(`⚠️  건너뜀: ${skipped}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log('=================================');
}

main().catch(console.error);
