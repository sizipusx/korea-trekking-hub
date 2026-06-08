// app/page.tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getTrails, getTrailStats } from '@/lib/trails';
import TrailListClient from '@/components/trail/TrailListClient';

export const revalidate = 3600;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [trails, stats] = await Promise.all([
    getTrails(),
    getTrailStats(),
  ]);

  return (
    <main>
      {/* 우측 하단 플로팅 버튼들 */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {user ? (
          <Link href="/log"
            className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold shadow-xl transition hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#052e16,#064e3b)', border: '1.5px solid rgba(16,185,129,0.6)', color: '#6ee7b7' }}>
            <span>📋</span> 나의 기록
          </Link>
        ) : (
          <Link href="/auth"
            className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold shadow-xl transition hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#052e16,#064e3b)', border: '1.5px solid rgba(16,185,129,0.6)', color: '#6ee7b7' }}>
            <span>🔑</span> 로그인
          </Link>
        )}
        <Link href="/map"
          className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold shadow-xl transition hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#0c4a6e,#064e3b)', border: '1.5px solid rgba(14,165,233,0.6)', color: '#7dd3fc' }}>
          <span>🗺</span> 지도로 보기
        </Link>
      </div>
      <TrailListClient initialTrails={trails} stats={stats} />
    </main>
  );
}
