// app/schema/page.tsx — 통합 데이터 스키마 설계 페이지
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '통합 스키마 설계 — Korea Trekking Hub',
  description: 'CSV·GPX·Shapefile 원천 데이터를 Portal DB로 통합하는 스키마 설계 문서',
};

// ── 공통 스타일 헬퍼 ─────────────────────────────────────────────
const card = 'rounded-2xl border border-white/8 bg-white/[0.03] p-6';
const th   = 'px-4 py-2.5 text-left text-[11px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/50';
const td   = 'px-4 py-2.5 text-sm text-slate-300 border-t border-white/5';

function Badge({ children, color = 'emerald' }: { children: React.ReactNode; color?: string }) {
  const cls: Record<string, string> = {
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    blue:    'bg-blue-500/20   text-blue-300   border-blue-500/30',
    amber:   'bg-amber-500/20  text-amber-300  border-amber-500/30',
    slate:   'bg-slate-500/20  text-slate-400  border-slate-500/30',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls[color]}`}>
      {children}
    </span>
  );
}

export default function SchemaPage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#0a0f1e 0%,#0d1f12 50%,#0f1a2e 100%)' }}>

      {/* ── HEADER ─────────────────────────────────── */}
      <header style={{ background: 'linear-gradient(90deg,#052e16,#064e3b,#0c4a6e)', borderBottom: '2px solid #10b981' }}
        className="px-5 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📐</span>
            <div>
              <h1 className="text-xl font-black text-emerald-50">통합 데이터 스키마</h1>
              <p className="text-xs text-emerald-400 tracking-widest mt-0.5">CSV · GPX · Shapefile → Supabase 통합 설계</p>
            </div>
          </div>
          <nav className="flex gap-2">
            {[['🥾', '홈', '/'], ['🗺', '지도', '/map'], ['📊', '대시보드', '/dashboard'], ['🔍', '코스 탐색', '/courses']].map(([e, l, h]) => (
              <Link key={h} href={h}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-emerald-300 hover:bg-emerald-900/30 transition border border-transparent hover:border-emerald-800">
                {e} {l}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* 1. 데이터 흐름 */}
        <section>
          <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">데이터 수집 → 변환 → Portal 흐름</h2>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {[
              ['📄', '원천 데이터', 'CSV · GPX · SHP'],
              ['🔧', '파싱 & 변환', 'Python 스크립트'],
              ['📐', '정규화', '통합 스키마'],
              ['🗄️', 'Supabase DB', 'raw_courses 테이블'],
              ['🌐', 'Next.js API', 'REST 라우트'],
              ['🗺️', '사용자 화면', '지도 · 카드 · 필터'],
            ].map(([icon, title, sub], i, arr) => (
              <div key={i} className="flex items-center shrink-0">
                <div className={`${card} text-center min-w-[120px] py-4`}>
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xs font-bold text-slate-200">{title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
                </div>
                {i < arr.length - 1 && <span className="text-emerald-500 text-lg px-1">→</span>}
              </div>
            ))}
          </div>
        </section>

        {/* 2. ERD */}
        <section>
          <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">엔티티 관계도</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                title: '📋 raw_courses', sub: '코스 통합 테이블',
                fields: [
                  ['id', 'BIGSERIAL', 'PK'],
                  ['course_name', 'VARCHAR(200)', 'NOT NULL'],
                  ['category', 'ENUM', 'NOT NULL'],
                  ['dataset_name', 'VARCHAR(100)', ''],
                  ['region', 'VARCHAR(50)', ''],
                  ['distance_km', 'DECIMAL(8,2)', 'NULL OK'],
                  ['elev_gain_m', 'DECIMAL(8,1)', 'NULL OK'],
                  ['elev_loss_m', 'DECIMAL(8,1)', 'NULL OK'],
                  ['difficulty', 'VARCHAR(20)', 'NULL OK'],
                  ['est_time', 'VARCHAR(20)', ''],
                  ['start_lat', 'DECIMAL(10,6)', 'NULL OK'],
                  ['start_lng', 'DECIMAL(10,6)', 'NULL OK'],
                  ['gpx_path', 'TEXT', 'NULL OK'],
                  ['source', "ENUM('GPX','CSV')", ''],
                ],
              },
              {
                title: '📍 geo_layers', sub: 'GeoJSON 레이어',
                fields: [
                  ['id', 'BIGSERIAL', 'PK'],
                  ['name', 'VARCHAR(100)', 'NOT NULL'],
                  ['geojson_path', 'TEXT', 'NOT NULL'],
                  ['geometry_type', 'VARCHAR(30)', ''],
                  ['feature_count', 'INT', ''],
                  ['original_crs', 'VARCHAR(20)', ''],
                  ['bbox_minx', 'FLOAT', ''],
                  ['bbox_miny', 'FLOAT', ''],
                  ['bbox_maxx', 'FLOAT', ''],
                  ['bbox_maxy', 'FLOAT', ''],
                  ['source_region', 'VARCHAR(50)', ''],
                  ['data_date', 'DATE', ''],
                ],
              },
              {
                title: '🏔️ trails', sub: '기존 마스터 (변경 없음)',
                fields: [
                  ['id', 'VARCHAR(36)', 'PK'],
                  ['name', 'VARCHAR(200)', 'NOT NULL'],
                  ['category', 'ENUM', 'NOT NULL'],
                  ['distance_km', 'DECIMAL', ''],
                  ['difficulty', 'ENUM', ''],
                  ['camping', 'BOOLEAN', ''],
                  ['backpacking', 'BOOLEAN', ''],
                  ['gpx → trail_gpx', '(FK)', ''],
                  ['season → trail_seasons', '(FK)', ''],
                ],
              },
            ].map(({ title, sub, fields }) => (
              <div key={title} className={`${card} p-0 overflow-hidden`}>
                <div className="bg-emerald-950/60 px-4 py-3 border-b border-white/8">
                  <div className="font-bold text-emerald-300 text-sm">{title}</div>
                  <div className="text-[10px] text-slate-500">{sub}</div>
                </div>
                {fields.map(([f, t, c]) => (
                  <div key={f} className="px-4 py-1.5 border-b border-white/5 flex justify-between items-center text-[11px]">
                    <span className="text-slate-300 font-mono">{f}</span>
                    <div className="flex gap-1 items-center">
                      <span className="text-slate-600">{t}</span>
                      {c && <Badge color={c === 'PK' ? 'emerald' : c === 'NOT NULL' ? 'amber' : c === 'NULL OK' ? 'slate' : 'blue'}>{c}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* 3. category ENUM */}
        <section>
          <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">category ENUM 정의</h2>
          <div className={card}>
            <div className="flex flex-wrap gap-2">
              {[
                ['🏔️', '등산로'], ['🔄', '둘레길'], ['🌲', '숲길'], ['🥾', '트레킹길'],
                ['🎭', '테마길'], ['🌋', '오름'], ['🏝️', '섬트레킹'], ['🏛️', '문화길'],
                ['🌿', '국가숲길'], ['⛰️', '정맥종주'], ['🗻', '종주'],
              ].map(([e, l]) => (
                <span key={l} className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-800/50 text-emerald-300 text-xs font-semibold">
                  {e} {l}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 4. 컬럼 상세표 */}
        <section>
          <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">raw_courses 컬럼 상세</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full">
              <thead>
                <tr>
                  {['컬럼명', '타입', '제약', '설명', '원천'].map((h) => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['id', 'BIGSERIAL', 'PK', 'Auto-increment PK', '—'],
                  ['course_name', 'VARCHAR(200)', 'NOT NULL', '코스/경로명', 'CSV 코스명 / GPX 파일명'],
                  ['category', 'ENUM', 'NOT NULL', '등산로·둘레길·숲길 등 11종', 'CSV 카테고리 / 폴더 매핑'],
                  ['dataset_name', 'VARCHAR(100)', '', '원천 데이터셋 (100대명산, 백두대간 등)', '폴더명 파싱'],
                  ['subcategory', 'VARCHAR(100)', '', 'GPX 서브폴더명 or CSV 세부 분류', '경로 파싱'],
                  ['region', 'VARCHAR(50)', '', '광역 시도명', 'CSV 지역 컬럼'],
                  ['distance_km', 'DECIMAL(8,2)', 'NULL OK', '총 거리(km)', 'GPX Haversine / CSV'],
                  ['elev_gain_m', 'DECIMAL(8,1)', 'NULL OK', '누적 상승고도(m)', 'GPX 고도 계산'],
                  ['elev_loss_m', 'DECIMAL(8,1)', 'NULL OK', '누적 하강고도(m)', 'GPX 고도 계산'],
                  ['est_time', 'VARCHAR(20)', 'NULL OK', 'Naismith 예상 소요시간', 'GPX 계산 (4km/h + 100m/30분)'],
                  ['difficulty', 'VARCHAR(20)', 'NULL OK', '난이도', 'CSV 난이도 컬럼'],
                  ['start_lat', 'DECIMAL(10,6)', 'NULL OK', '시작점 위도', 'GPX 첫 포인트 / CSV'],
                  ['start_lng', 'DECIMAL(10,6)', 'NULL OK', '시작점 경도', 'GPX 첫 포인트 / CSV'],
                  ['address', 'TEXT', 'NULL OK', '주소 / 소재지', 'CSV 주소 컬럼'],
                  ['gpx_path', 'TEXT', 'NULL OK', 'GPX 파일 상대 경로', '파일 경로'],
                  ['source', "ENUM('GPX','CSV')", 'NOT NULL', '원천 포맷 구분', '처리 파이프라인'],
                  ['created_at', 'TIMESTAMPTZ', 'DEFAULT NOW()', '적재 시각', 'DB 자동'],
                ].map(([col, type, c, desc, src]) => (
                  <tr key={col} className="hover:bg-white/[0.02]">
                    <td className={`${td} font-mono text-emerald-400`}>{col}</td>
                    <td className={`${td} text-slate-500`}>{type}</td>
                    <td className={td}>
                      {c && <Badge color={c === 'PK' ? 'emerald' : c.includes('NOT') ? 'amber' : c.includes('NULL') ? 'slate' : 'blue'}>{c}</Badge>}
                    </td>
                    <td className={td}>{desc}</td>
                    <td className={`${td} text-slate-500`}>{src}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. API 엔드포인트 */}
        <section>
          <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">API 엔드포인트</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full">
              <thead>
                <tr>
                  {['메서드', '엔드포인트', '설명', '주요 파라미터'].map((h) => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['GET', '/api/raw-courses', 'raw_courses 목록 (페이징·필터)', 'category, region, minKm, maxKm, search, page'],
                  ['GET', '/api/raw-courses/stats', '카테고리·거리 통계', '—'],
                  ['GET', '/api/trails', '기존 마스터 트레일 목록', 'category, difficulty, camping'],
                  ['GET', '/api/forests', '숲길 정보', '—'],
                  ['GET', '/api/kakaomap', '카카오맵 토큰', '—'],
                ].map(([m, ep, desc, params]) => (
                  <tr key={ep} className="hover:bg-white/[0.02]">
                    <td className={td}><Badge color="emerald">{m}</Badge></td>
                    <td className={`${td} font-mono text-blue-400`}>{ep}</td>
                    <td className={td}>{desc}</td>
                    <td className={`${td} text-slate-500 text-[11px]`}>{params}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* footer */}
        <footer className="py-4 border-t border-emerald-900/40 text-center">
          <p className="text-[11px] text-emerald-700">Korea Trekking Hub — 스키마 v1.0 · Next.js 16 + Supabase</p>
        </footer>
      </main>
    </div>
  );
}
