'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { CampRow } from '@/types/camp';
import { CAMP_CATEGORY_META, RESERVATION_UNKNOWN } from '@/types/camp';

interface Props {
  camp: CampRow;
  onClose: () => void;
  onSaved?: (camp: CampRow) => void;
}

// 자주 쓰는 값 — 클릭 한 번으로 채워 넣어 입력 시간을 줄입니다.
const OPEN_PRESETS = [
  '이용월 1개월 전 1일 09시',
  '이용일 30일 전 09시',
  '매주 수요일 09시 (6주 전)',
  '상시 접수',
];
const SEASON_PRESETS = ['연중', '3월~11월', '4월~10월', '주말·공휴일만'];

const INPUT_STYLE: CSSProperties = {
  width: '100%',
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 6,
  padding: '6px 8px',
  fontSize: 12,
  color: '#e2e8f0',
  outline: 'none',
};

function Presets({ values, onPick }: { values: string[]; onPick: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {values.map((v) => (
        <button key={v} type="button" onClick={() => onPick(v)}
          className="text-[10px] px-1.5 py-0.5 rounded transition"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
          {v}
        </button>
      ))}
    </div>
  );
}

export default function CampDetailPanel({ camp, onClose, onSaved }: Props) {
  const meta = CAMP_CATEGORY_META[camp.category];
  const color = meta?.color ?? '#db2777';

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    reservation_open: camp.reservation_open ?? '',
    use_season: camp.use_season ?? '',
    reservation_note: camp.reservation_note ?? '',
    reservation_org: camp.reservation_org ?? '',
    reservation_url: camp.reservation_url ?? '',
  });

  // 다른 캠핑장을 클릭하면 부모가 key={camp.id} 로 이 컴포넌트를 새로 마운트해
  // 폼이 자동으로 초기화됩니다 (effect 로 setState 하지 않음).

  // 기간을 아직 못 찾았어도 메모만 적어둔 경우가 있어, 메모도 '입력됨'으로 봅니다.
  const hasPeriod = Boolean(camp.reservation_open || camp.use_season);
  const hasReservationInfo = hasPeriod || Boolean(camp.reservation_note);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/camps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: camp.id, ...form }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(res.status === 401 ? '로그인이 필요합니다.' : (json.error ?? '저장에 실패했습니다.'));
        return;
      }
      onSaved?.(json.camp as CampRow);
      setEditing(false);
    } catch {
      setError('네트워크 오류로 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="h-full flex flex-col overflow-hidden"
      style={{ background: 'rgba(10,15,30,0.97)', borderTop: `2px solid ${color}` }}>

      {/* 헤더 */}
      <div className="flex items-start justify-between px-4 py-3 flex-shrink-0 border-b border-white/8">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded"
              style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
              {meta?.emoji} {camp.category}
            </span>
            <span className="text-[10px] text-slate-500">📍 {camp.region} · {camp.sigungu}</span>
            {!camp.operator_verified && (
              <span className="text-[10px] px-1.5 py-0.5 rounded text-amber-400"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
                운영주체 추정
              </span>
            )}
          </div>
          <h2 className="text-base font-black text-slate-100 leading-tight">{camp.name}</h2>
        </div>
        <button onClick={onClose}
          className="text-slate-500 hover:text-slate-200 transition text-xl leading-none flex-shrink-0 mt-1">
          ✕
        </button>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* 예약 정보 — 보기 / 입력 */}
        <div className="rounded-lg px-3 py-2.5"
          style={{
            background: hasReservationInfo || editing ? `${color}0d` : 'rgba(255,255,255,0.03)',
            border: hasReservationInfo || editing
              ? `1px solid ${color}25`
              : '1px dashed rgba(255,255,255,0.12)',
          }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold" style={{ color: hasReservationInfo || editing ? '#f472b6' : '#64748b' }}>
              📅 예약 정보
            </p>
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="text-[10px] px-2 py-0.5 rounded font-bold transition"
                style={{ background: `${color}1a`, color, border: `1px solid ${color}40` }}>
                ✏️ {hasReservationInfo ? '수정' : '직접 입력'}
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2 mt-2">
              <div>
                <label className="text-[10px] text-slate-400">🔔 예약 오픈 규칙</label>
                <input style={INPUT_STYLE} value={form.reservation_open}
                  placeholder="예: 이용월 1개월 전 1일 09시"
                  onChange={(e) => setForm({ ...form, reservation_open: e.target.value })} />
                <Presets values={OPEN_PRESETS} onPick={(v) => setForm({ ...form, reservation_open: v })} />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">🗓 이용(운영) 기간</label>
                <input style={INPUT_STYLE} value={form.use_season}
                  placeholder="예: 3월~11월"
                  onChange={(e) => setForm({ ...form, use_season: e.target.value })} />
                <Presets values={SEASON_PRESETS} onPick={(v) => setForm({ ...form, use_season: v })} />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">📝 메모</label>
                <input style={INPUT_STYLE} value={form.reservation_note}
                  placeholder="예: 성수기 추첨제, 군민 우선예약"
                  onChange={(e) => setForm({ ...form, reservation_note: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">🏛 예약처</label>
                  <input style={INPUT_STYLE} value={form.reservation_org}
                    onChange={(e) => setForm({ ...form, reservation_org: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">🔗 예약 URL</label>
                  <input style={INPUT_STYLE} value={form.reservation_url}
                    onChange={(e) => setForm({ ...form, reservation_url: e.target.value })} />
                </div>
              </div>

              {error && (
                <p className="text-[11px] text-rose-400">
                  ⚠️ {error}
                  {error === '로그인이 필요합니다.' && (
                    <a href="/auth" className="underline ml-1">로그인하러 가기 →</a>
                  )}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={save} disabled={saving}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition disabled:opacity-50"
                  style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>
                  {saving ? '저장 중...' : '💾 저장'}
                </button>
                <button onClick={() => { setEditing(false); setError(null); }} disabled={saving}
                  className="px-4 py-1.5 rounded-lg text-[11px] font-bold text-slate-400 transition disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  취소
                </button>
              </div>
            </div>
          ) : hasReservationInfo ? (
            <>
              {camp.reservation_open && (
                <p className="text-[12px] font-bold text-amber-400 leading-relaxed">
                  🔔 예약 오픈: {camp.reservation_open}
                </p>
              )}
              {camp.use_season && (
                <p className="text-[12px] text-slate-200 mt-1">🗓 이용 기간: {camp.use_season}</p>
              )}
              {!hasPeriod && (
                <p className="text-[12px] text-slate-500">🔔 예약 오픈·이용 기간 미확인</p>
              )}
              {camp.reservation_note && (
                <p className="text-[11px] text-slate-400 mt-1">📝 {camp.reservation_note}</p>
              )}
            </>
          ) : (
            <p className="text-[12px] text-slate-500 leading-relaxed">{RESERVATION_UNKNOWN}</p>
          )}
        </div>

        {/* 운영 주체 / 연락처 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/25 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-500 mb-1">🏛 운영</p>
            <p className="text-[11px] text-slate-300 leading-snug">
              {camp.operator || '미상'}
              {camp.operator_level && (
                <span className="block text-[10px] text-slate-500 mt-0.5">{camp.operator_level}</span>
              )}
            </p>
          </div>
          <div className="bg-black/25 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-500 mb-1">☎ 연락처</p>
            <p className="text-[11px] text-slate-300 leading-snug">{camp.tel || '미상'}</p>
          </div>
        </div>

        {/* 시설 */}
        {camp.facilities && (
          <div className="bg-black/25 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-500 mb-1">🛠 시설</p>
            <p className="text-[11px] text-slate-300 leading-snug">{camp.facilities}</p>
          </div>
        )}

        {/* 주소 */}
        {camp.address && (
          <p className="text-[11px] text-slate-400">📍 {camp.address}</p>
        )}

        {/* 예약 링크 */}
        <a
          href={camp.reservation_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[11px] font-bold transition w-full"
          style={{
            background: camp.reservation_url ? `${color}10` : 'rgba(255,255,255,0.03)',
            borderColor: `${color}30`,
            color: camp.reservation_url ? color : '#64748b',
            pointerEvents: camp.reservation_url ? 'auto' : 'none',
          }}>
          🔗 {camp.reservation_org || '개별 문의'}{camp.reservation_url ? ' 바로가기 →' : ''}
        </a>

        <p className="text-[10px] text-slate-600">📌 출처: {camp.source}</p>
      </div>
    </div>
  );
}
