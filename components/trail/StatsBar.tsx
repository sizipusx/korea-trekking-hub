interface Props {
  total: number;
  totalKm: number;
  backpacking: number;
  nowGood: number;
  currentMonth: number;
}

export default function StatsBar({ total, totalKm, backpacking, nowGood, currentMonth }: Props) {
  const items = [
    { icon: '🗺️', value: `${total}개`, label: '필터된 코스' },
    { icon: '📏', value: `${totalKm.toLocaleString()}km`, label: '총 거리' },
    { icon: '🎒', value: `${backpacking}코스`, label: '백패킹 가능' },
    { icon: '🌟', value: `${nowGood}코스`, label: `${currentMonth}월 추천` },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => (
        <div key={s.label}
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <span className="text-lg">{s.icon}</span>
          <div>
            <p className="text-base font-black text-emerald-400 leading-none">{s.value}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
