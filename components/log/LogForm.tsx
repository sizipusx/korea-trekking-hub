'use client';

import { useState, useRef } from 'react';
import type { UserLogRow } from '@/types/trail';
import { LOG_STATUS_META, WEATHER_OPTIONS, COMPANION_OPTIONS, DIFFICULTY_FELT_OPTIONS } from '@/types/trail';
import { uploadPhoto, deletePhoto } from '@/lib/storage';

interface Props {
  trailId: string;
  trailName: string;
  userId: string;
  existing?: UserLogRow | null;
  onSave: () => void;
  onClose: () => void;
}

const STARS = [1, 2, 3, 4, 5];

export default function LogForm({ trailId, trailName, userId, existing, onSave, onClose }: Props) {
  const [status, setStatus]   = useState(existing?.status ?? 'planned');
  const [date, setDate]       = useState(existing?.visited_date?.slice(0, 10) ?? '');
  const [rating, setRating]   = useState(existing?.rating ?? 0);
  const [notes, setNotes]     = useState(existing?.notes ?? '');
  const [weather, setWeather] = useState(existing?.weather ?? '');
  const [companions, setCompanions] = useState(existing?.companions ?? '혼자');
  const [diffFelt, setDiffFelt]   = useState(existing?.difficulty_felt ?? '');
  const [days, setDays]       = useState(existing?.duration_days ?? 1);
  const [photos, setPhotos]   = useState<string[]>(existing?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (photos.length + files.length > 5) {
      setError('사진은 최대 5장까지 등록 가능합니다.');
      return;
    }
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { setError('파일 크기는 5MB 이하만 가능합니다.'); continue; }
      const { url, error: upErr } = await uploadPhoto(userId, trailId, file);
      if (url) newUrls.push(url);
      else if (upErr) setError(upErr);
    }
    setPhotos(prev => [...prev, ...newUrls]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handlePhotoDelete = async (url: string) => {
    await deletePhoto(url);
    setPhotos(prev => prev.filter(p => p !== url));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trailId,
          status,
          visited_date: date || null,
          rating: rating || null,
          notes,
          weather,
          companions,
          difficulty_felt: diffFelt,
          duration_days: days || null,
          photos,
        }),
      });
      const data = await res.json();
      if (data.ok) { onSave(); onClose(); }
      else setError(data.error ?? '저장 실패');
    } catch {
      setError('네트워크 오류');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('기록을 삭제하시겠습니까?')) return;
    await fetch('/api/log', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trailId }),
    });
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#0f172a', border: '1px solid rgba(16,185,129,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8"
          style={{ background: 'linear-gradient(90deg,#052e16,#0c4a6e)' }}>
          <div>
            <p className="text-xs text-emerald-400 mb-0.5">탐방 기록</p>
            <h2 className="text-sm font-black text-slate-100">{trailName}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* 탐방 상태 */}
          <div>
            <p className="text-xs text-slate-400 mb-2 uppercase tracking-widest">탐방 상태</p>
            <div className="flex gap-2">
              {(Object.entries(LOG_STATUS_META) as [keyof typeof LOG_STATUS_META, typeof LOG_STATUS_META[keyof typeof LOG_STATUS_META]][]).map(([key, meta]) => (
                <button key={key} onClick={() => setStatus(key)}
                  className="flex-1 py-2 rounded-lg text-xs font-bold border transition"
                  style={{
                    background: status === key ? `${meta.color}20` : 'transparent',
                    borderColor: status === key ? meta.color : 'rgba(255,255,255,0.12)',
                    color: status === key ? meta.color : '#64748b',
                  }}>
                  {meta.emoji} {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* 방문일 + 소요일수 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-1.5">📅 방문일</p>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1.5">🕐 소요 일수</p>
              <input type="number" min={1} max={365} value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500" />
            </div>
          </div>

          {/* 별점 */}
          <div>
            <p className="text-xs text-slate-400 mb-2">⭐ 만족도</p>
            <div className="flex gap-2">
              {STARS.map(s => (
                <button key={s} onClick={() => setRating(s === rating ? 0 : s)}
                  className="text-2xl transition-transform hover:scale-110"
                  style={{ color: s <= rating ? '#f59e0b' : '#334155' }}>
                  ★
                </button>
              ))}
              {rating > 0 && <span className="text-sm text-slate-400 self-center ml-1">{rating}점</span>}
            </div>
          </div>

          {/* 날씨 + 동행 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-1.5">날씨</p>
              <div className="flex flex-wrap gap-1">
                {WEATHER_OPTIONS.map(w => (
                  <button key={w} onClick={() => setWeather(weather === w ? '' : w)}
                    className="px-2 py-1 rounded-lg text-xs border transition"
                    style={{
                      background: weather === w ? 'rgba(16,185,129,0.15)' : 'transparent',
                      borderColor: weather === w ? '#10b981' : 'rgba(255,255,255,0.1)',
                      color: weather === w ? '#10b981' : '#64748b',
                    }}>{w}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1.5">동행</p>
              <div className="flex flex-wrap gap-1">
                {COMPANION_OPTIONS.map(c => (
                  <button key={c} onClick={() => setCompanions(c)}
                    className="px-2 py-1 rounded-lg text-xs border transition"
                    style={{
                      background: companions === c ? 'rgba(96,165,250,0.15)' : 'transparent',
                      borderColor: companions === c ? '#60a5fa' : 'rgba(255,255,255,0.1)',
                      color: companions === c ? '#60a5fa' : '#64748b',
                    }}>{c}</button>
                ))}
              </div>
            </div>
          </div>

          {/* 체감 난이도 */}
          <div>
            <p className="text-xs text-slate-400 mb-1.5">체감 난이도</p>
            <div className="flex gap-1.5 flex-wrap">
              {DIFFICULTY_FELT_OPTIONS.map(d => (
                <button key={d} onClick={() => setDiffFelt(diffFelt === d ? '' : d)}
                  className="px-3 py-1 rounded-lg text-xs border transition"
                  style={{
                    background: diffFelt === d ? 'rgba(249,115,22,0.15)' : 'transparent',
                    borderColor: diffFelt === d ? '#f97316' : 'rgba(255,255,255,0.1)',
                    color: diffFelt === d ? '#f97316' : '#64748b',
                  }}>{d}</button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <p className="text-xs text-slate-400 mb-1.5">📝 탐방 메모</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={3} placeholder="코스 후기, 주의사항, 추천 포인트 등을 자유롭게 기록하세요..."
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-500 resize-none" />
          </div>

          {/* 사진 업로드 */}
          <div>
            <p className="text-xs text-slate-400 mb-2">📷 사진 ({photos.length}/5)</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {photos.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => handlePhotoDelete(url)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.7)', color: '#f87171' }}>✕</button>
                </div>
              ))}
              {photos.length < 5 && (
                <button onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-16 h-16 rounded-lg flex flex-col items-center justify-center text-xs transition"
                  style={{ border: '1px dashed rgba(16,185,129,0.4)', color: '#10b981' }}>
                  {uploading ? '⏳' : '+'}<span className="text-[9px]">{uploading ? '업로드중' : '사진추가'}</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={handlePhotoUpload} />
            <p className="text-[10px] text-slate-600">JPG, PNG, WebP · 최대 5MB · 최대 5장</p>
          </div>

          {/* 에러 */}
          {error && (
            <div className="px-3 py-2 rounded-lg text-xs text-red-400"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              ⚠️ {error}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            {existing && (
              <button onClick={handleDelete}
                className="px-4 py-2.5 rounded-lg text-xs font-bold border border-red-900/50 text-red-400 hover:bg-red-900/20 transition">
                🗑 삭제
              </button>
            )}
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-xs font-bold border border-white/10 text-slate-400 hover:bg-white/5 transition">
              취소
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-xs font-bold transition"
              style={{ background: 'linear-gradient(90deg,#065f46,#0c4a6e)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)' }}>
              {saving ? '저장 중...' : '✅ 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
