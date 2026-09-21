'use client';

import type { ActivityLogRow } from '@/types/activity';
import { ACTIVITY_META, LOG_STATUS_META, PLACE_TYPE_META } from '@/types/activity';

interface Props {
  log: ActivityLogRow;
  onEdit: () => void;
}

export default function LogCard({ log, onEdit }: Props) {
  const statusMeta = LOG_STATUS_META[log.status];
  const activityMeta = ACTIVITY_META[log.activity];
  const placeMeta = PLACE_TYPE_META[log.place_type];

  return (
    <div className="rounded-xl border p-4 transition hover:border-emerald-900/50 cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.07)' }}
      onClick={onEdit}>

      {/* 상단 */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ background: `${activityMeta.color}15`, color: activityMeta.color, border: `1px solid ${activityMeta.color}30` }}>
              {activityMeta.emoji} {activityMeta.label}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ background: `${statusMeta.color}15`, color: statusMeta.color, border: `1px solid ${statusMeta.color}30` }}>
              {statusMeta.emoji} {statusMeta.label}
            </span>
            {log.rating && (
              <span className="text-xs text-amber-400">{'★'.repeat(log.rating)}{'☆'.repeat(5 - log.rating)}</span>
            )}
          </div>
          <p className="text-sm font-bold text-slate-100 truncate">
            {placeMeta.emoji} {log.place_name || '이름 없는 장소'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {log.visited_date && `📅 ${log.visited_date}`}
            {log.duration_days && ` · ${log.duration_days}일`}
            {log.distance_km ? ` · ${log.distance_km}km` : ''}
          </p>
        </div>
        <button className="text-slate-500 hover:text-emerald-400 text-xs px-2 py-1 rounded border border-white/8 flex-shrink-0"
          onClick={e => { e.stopPropagation(); onEdit(); }}>
          수정
        </button>
      </div>

      {/* 태그 */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {log.weather && <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/8">{log.weather}</span>}
        {log.companions && <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/8">👥 {log.companions}</span>}
        {log.difficulty_felt && <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/8">⛰ {log.difficulty_felt}</span>}
      </div>

      {/* 메모 */}
      {log.notes && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">{log.notes}</p>
      )}

      {/* 사진 썸네일 */}
      {log.photos?.length > 0 && (
        <div className="flex gap-1.5">
          {log.photos.slice(0, 4).map((url, i) => (
            <div key={i} className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {log.photos.length > 4 && (
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xs text-slate-400"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              +{log.photos.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
