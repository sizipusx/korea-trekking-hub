// app/api/log/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { saveLog, deleteLog } from '@/lib/logs';
import { ACTIVITY_META, PLACE_TYPE_META } from '@/types/activity';
import type { ActivityKind, PlaceType } from '@/types/activity';

export async function POST(req: NextRequest) {
  try {
    const { activity, placeType, placeId, ...payload } = await req.json();

    if (!activity || !(activity in ACTIVITY_META)) {
      return NextResponse.json({ error: '활동 종류가 올바르지 않습니다' }, { status: 400 });
    }
    if (!placeType || !(placeType in PLACE_TYPE_META)) {
      return NextResponse.json({ error: '장소 종류가 올바르지 않습니다' }, { status: 400 });
    }
    if (placeType !== 'none' && !placeId) {
      return NextResponse.json({ error: '장소를 선택해 주세요' }, { status: 400 });
    }

    const result = await saveLog(
      { activity: activity as ActivityKind, placeType: placeType as PlaceType, placeId: placeId ?? null },
      payload,
    );
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (typeof id !== 'number') return NextResponse.json({ error: 'id 필요' }, { status: 400 });
    const ok = await deleteLog(id);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
