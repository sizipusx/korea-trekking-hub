// app/api/log/list/route.ts
import { NextResponse } from 'next/server';
import { getMyLogs } from '@/lib/logs';

export async function GET() {
  const logs = await getMyLogs();
  return NextResponse.json({ logs });
}
