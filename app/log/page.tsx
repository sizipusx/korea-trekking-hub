// app/log/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyLogs, getMyProfile } from '@/lib/logs';
import { getTrails } from '@/lib/trails';
import LogPageClient from '@/components/log/LogPageClient';

export const metadata = { title: '나의 탐방 기록 | Korea Trekking Hub' };

export default async function LogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 미로그인 시 auth 페이지로 이동
  if (!user) redirect('/auth');

  const [logs, trails, profile] = await Promise.all([
    getMyLogs(),
    getTrails(),
    getMyProfile(),
  ]);

  return (
    <LogPageClient
      logs={logs}
      trails={trails}
      profile={profile}
      userId={user.id}
    />
  );
}
