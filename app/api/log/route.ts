// app/api/log/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { upsertLog, deleteLog } from '@/lib/logs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trailId, ...payload } = body;
    if (!trailId) return NextResponse.json({ error: 'trailId 필요' }, { status: 400 });
    const result = await upsertLog(trailId, payload);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { trailId } = await req.json();
    if (!trailId) return NextResponse.json({ error: 'trailId 필요' }, { status: 400 });
    const ok = await deleteLog(trailId);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
