// app/api/camps/route.ts  —  GET /api/camps
import { NextRequest, NextResponse } from 'next/server';
import { getCamps, getCampStats, getNearbyCamps, updateCampReservation } from '@/lib/camps';
import type { CampFilters, CampCategory, CampRegion } from '@/types/camp';

// camps_reservation.csv 와 동일한 컬럼 순서 (내려받아 그대로 덮어쓰면 시드와 동기화)
const CSV_FIELDS = [
  'id', 'name', 'sigungu', 'reservation_org', 'reservation_url',
  'reservation_open', 'use_season', 'reservation_note',
] as const;

function toCsv(rows: Record<string, unknown>[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [CSV_FIELDS.join(',')];
  for (const r of rows) lines.push(CSV_FIELDS.map((f) => escape(r[f])).join(','));
  return '﻿' + lines.join('\r\n'); // BOM — 엑셀에서 한글 깨짐 방지
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  try {
    // 예약 정보 CSV 내려받기 → csv_data/공공캠핑장/camps_reservation.csv 에 덮어쓰기용
    if (searchParams.get('export') === 'reservation') {
      const camps = await getCamps();
      const csv = toCsv(camps as unknown as Record<string, unknown>[]);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="camps_reservation.csv"',
        },
      });
    }

    // 통계 모드
    if (searchParams.get('stats') === 'true') {
      const stats = await getCampStats();
      return NextResponse.json({ stats });
    }

    // 주변 캠핑장 모드: ?near=lat,lng&radius=20
    const near = searchParams.get('near');
    if (near) {
      const [lat, lng] = near.split(',').map(Number);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const radius = Number(searchParams.get('radius') ?? 20);
        const camps = await getNearbyCamps(lat, lng, radius);
        return NextResponse.json({ camps, count: camps.length });
      }
      return NextResponse.json({ error: 'near 파라미터 형식 오류 (lat,lng)' }, { status: 400 });
    }

    // 일반 목록 + 필터
    const filters: CampFilters = {
      search:       searchParams.get('search')   || undefined,
      category:     (searchParams.get('category') || '전체') as CampCategory | '전체',
      region:       (searchParams.get('region')   || '전체') as CampRegion | '전체',
      reservedOnly: searchParams.get('reserved') === 'true',
      verifiedOnly: searchParams.get('verified') === 'true',
    };

    const camps = await getCamps(filters);
    return NextResponse.json({ camps, count: camps.length });
  } catch (err) {
    console.error('[/api/camps] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── 예약 정보 저장 (지도에서 직접 입력) ───────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const { id, ...patch } = await req.json();
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });

    const result = await updateCampReservation(id, patch);
    if (!result.ok) {
      const status = result.error === '로그인이 필요합니다.' ? 401 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, camp: result.camp });
  } catch (err) {
    console.error('[/api/camps PATCH] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
