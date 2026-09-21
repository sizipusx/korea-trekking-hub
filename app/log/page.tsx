// app/log/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyLogs, getMyProfile } from '@/lib/logs';
import { getTrails } from '@/lib/trails';
import { getForests } from '@/lib/forests';
import { getCamps } from '@/lib/camps';
import LogPageClient from '@/components/log/LogPageClient';

export const metadata = { title: '나의 활동 기록 | Korea Outdoor Hub' };

export default async function LogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 미로그인 시 auth 페이지로 이동
  if (!user) redirect('/auth');

  // 기록할 장소를 트레일뿐 아니라 휴양림·캠핑장에서도 고를 수 있어야 한다
  const [logs, trails, forests, camps, profile] = await Promise.all([
    getMyLogs(),
    getTrails(),
    getForests(),
    getCamps(),
    getMyProfile(),
  ]);

  return (
    <LogPageClient
      logs={logs}
      trails={trails}
      forests={forests}
      camps={camps}
      profile={profile}
      userId={user.id}
    />
  );
}
