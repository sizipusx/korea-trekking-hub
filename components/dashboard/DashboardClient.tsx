'use client';
// components/dashboard/DashboardClient.tsx — 통합 대시보드 UI

import Link from 'next/link';
import type { RawCourseStats } from '@/types/rawCourse';
import { RAW_CATEGORY_META } from '@/types/rawCourse';
import { CATEGORY_META } from '@/types/trail';

interface TrailStats {
  total: number;
  totalKm: number;
  campingCount: number;
  backpackingCount: number;
  byCat: Record<string, number>;
}

interface Props {
  rawStats: RawCourseStats;
  trailStats: TrailStats | null;
}

// ── 공통 카드 ───────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, accent = false,
}: {
  icon: string; label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${accent
      ? 'border-emerald-700/60 bg-emerald-950/30'
      : 'border-white/8 bg-white/[0.025]'
    }`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-black ${accent ? 'text-emerald-300' : 'text-slate-200'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs font-bold text-slate-400 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-1">{sub}</div>}
    </div>
  );
}

// ── 가로 바 차트 ────────────────────────────────────────────────
function BarChart({
  data, title, colorFn,
}: {
  data: [string, number][];
  title: string;
  colorFn?: (key: string) => string;
}) {
  const max = Math.max(...data.map(([, v]) => v), 1);
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
      <h3 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map(([label, count]) => {
          const pct = (count / max) * 100;
          const color = colorFn?.(label) ?? '#10b981';
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="w-24 text-[11px] text-slate-400 truncate shrink-0 text-right">{label}</div>
              <div className="flex-1 h-4 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }} />
              </div>
              <div className="w-10 text-[11px] text-slate-500 shrink-0">{count.toLocaleString()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 거리 분포 ────────────────────────────────────────────────────
function DistributionBars({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
      <h3 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-4">거리 구간별 분포</h3>
      <div className="flex items-end gap-2 h-36">
        {data.map(({ label, count }) => {
          const pct = (count / max) * 100;
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500">{count.toLocaleString()}</span>
              <div className="w-full rounded-t-sm transition-all duration-700"
                style={{ height: `${pct}%`, backgroundColor: '#10b981', opacity: 0.7, minHeight: '4px' }} />
              <span className="text-[9px] text-slate-600 text-center leading-tight">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardClient({ rawStats, trailStats }: Props) {
  // 카테고리별 탑 10
  const topCategories = Object.entries(rawStats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // 데이터셋 탑 15
  const topDatasets = Object.entries(rawStats.byDataset)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  // 마스터 트레일 카테고리
  const masterCategories = trailStats
    ? Object.entries(trailStats.byCat).sort((a, b) => b[1] - a[1])
    : [];

  const gradBg = 'linear-gradient(160deg,#0a0f1e 0%,#0d1f12 50%,#0f1a2e 100%)';

  return (
    <div className="min-h-screen" style={{ background: gradBg }}>

      {/* HEADER */}
      <header style={{ background: 'linear-gradient(90deg,#052e16,#064e3b,#0c4a6e)', borderBottom: '2px solid #10b981' }}
        className="px-5 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div>
              <h1 className="text-xl font-black text-emerald-50">통합 대시보드</h1>
              <p className="text-xs text-emerald-400 tracking-widest mt-0.5">
                Raw Courses + 마스터 트레일 현황
              </p>
            </div>
          </div>
          <nav className="flex gap-2">
            {[['🥾', '홈', '/'], ['📐', '스키마', '/schema'], ['🔍', '코스 탐색', '/courses']].map(([e, l, h]) => (
              <Link key={h} href={h}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-emerald-300 hover:bg-emerald-900/30 transition border border-transparent hover:border-emerald-800">
                {e} {l}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── 원천 데이터 요약 ─────────────────── */}
        <section>
          <h2 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-4">
            📄 원천 데이터 (raw_courses) 요약
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon="🗂️" label="총 코스 수"      value={rawStats.total}         accent />
            <StatCard icon="🛰️" label="GPX 원천"        value={rawStats.gpxCount}      sub="위성 측위 경로" />
            <StatCard icon="📄" label="CSV 원천"         value={rawStats.csvCount}      sub="속성 데이터" />
            <StatCard icon="↔️" label="총 거리 합계"     value={`${rawStats.totalKm.toLocaleString()} km`} />
            <StatCard icon="📐" label="고도 데이터 보유" value={rawStats.withElevation} sub="누적 고도 산출됨" />
            <StatCard icon="📍" label="좌표 데이터 보유" value={rawStats.withCoords}    sub="지도 표시 가능" />
          </div>
        </section>

        {/* ── 비율 링 ─────────────────────────── */}
        <section className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
            <h3 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-4">원천 비율</h3>
            <div className="flex items-center gap-6">
              {/* 원형 SVG */}
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e3a2f" strokeWidth="3" />
                {rawStats.total > 0 && (() => {
                  const gpxPct = (rawStats.gpxCount / rawStats.total) * 100;
                  const circ = 2 * Math.PI * 15.9;
                  return (
                    <>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#a855f7"
                        strokeWidth="3" strokeDasharray={`${(100 - gpxPct) / 100 * circ} ${circ}`}
                        strokeDashoffset={`-${gpxPct / 100 * circ}`} />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981"
                        strokeWidth="3" strokeDasharray={`${gpxPct / 100 * circ} ${circ}`} />
                    </>
                  );
                })()}
              </svg>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs text-slate-300">GPX <span className="text-emerald-400 font-bold">
                    {rawStats.total > 0 ? Math.round(rawStats.gpxCount / rawStats.total * 100) : 0}%
                  </span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                  <span className="text-xs text-slate-300">CSV <span className="text-purple-400 font-bold">
                    {rawStats.total > 0 ? Math.round(rawStats.csvCount / rawStats.total * 100) : 0}%
                  </span></span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
            <h3 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-4">데이터 품질</h3>
            <div className="space-y-3">
              {[
                { label: '고도 데이터', count: rawStats.withElevation, color: '#f97316' },
                { label: '좌표 데이터', count: rawStats.withCoords,    color: '#3b82f6' },
              ].map(({ label, count, color }) => {
                const pct = rawStats.total > 0 ? Math.round(count / rawStats.total * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{label}</span>
                      <span style={{ color }} className="font-bold">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 차트 행 ────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChart
            title="카테고리별 코스 수"
            data={topCategories}
            colorFn={(k) => RAW_CATEGORY_META[k as keyof typeof RAW_CATEGORY_META]?.color ?? '#10b981'}
          />
          <BarChart
            title="상위 데이터셋별 코스 수"
            data={topDatasets}
          />
        </section>

        {/* ── 거리 분포 ──────────────────────── */}
        <DistributionBars data={rawStats.distanceDistribution} />

        {/* ── 마스터 트레일 ─────────────────── */}
        {trailStats && (
          <section>
            <h2 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-4">
              🥾 마스터 트레일 (trails) 현황
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatCard icon="🥾" label="총 마스터 트레일" value={trailStats.total}   accent />
              <StatCard icon="↔️" label="총 거리 합계"     value={`${trailStats.totalKm.toLocaleString()} km`} />
              <StatCard icon="⛺" label="캠핑 가능"         value={trailStats.campingCount} />
              <StatCard icon="🎒" label="배낭여행 가능"     value={trailStats.backpackingCount} />
            </div>
            <BarChart
              title="카테고리별 마스터 트레일"
              data={masterCategories}
              colorFn={(k) => CATEGORY_META[k as keyof typeof CATEGORY_META]?.color ?? '#10b981'}
            />
          </section>
        )}

        {/* ── 빠른 이동 ──────────────────────── */}
        <section className="grid grid-cols-3 gap-4">
          {[
            { href: '/courses', icon: '🔍', title: '코스 탐색', desc: `${rawStats.total.toLocaleString()}개 코스 검색` },
            { href: '/schema',  icon: '📐', title: '스키마 설계', desc: 'DB 구조 및 API 문서' },
            { href: '/',        icon: '🥾', title: '마스터 트레일', desc: '45개 엄선 코스 지도' },
          ].map(({ href, icon, title, desc }) => (
            <Link key={href} href={href}
              className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 hover:border-emerald-700/60 hover:bg-white/[0.04] transition-all group text-center">
              <div className="text-3xl mb-2">{icon}</div>
              <div className="text-sm font-bold text-emerald-300 group-hover:text-emerald-200">{title}</div>
              <div className="text-[11px] text-slate-500 mt-1">{desc}</div>
            </Link>
          ))}
        </section>

        <footer className="py-4 border-t border-emerald-900/40 text-center">
          <p className="text-[11px] text-emerald-700">Korea Trekking Hub — 대시보드 · Next.js 16 + Supabase</p>
        </footer>
      </main>
    </div>
  );
}
