import React from 'react';

const CARS = ['🏎️', '🚗', '🚙', '🛻', '🚕', '🏍️', '🚓', '🚌', '🚐', '🛺', '🚚', '🦽'];
export const carOf = (i) => CARS[(i || 0) % CARS.length];

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Đường đua theo dõi trực tiếp. Mỗi học sinh một làn, xe chạy theo
 * số câu trả lời đúng nên bấm bừa cho nhanh cũng không tiến được.
 */
const RaceTrack = ({ players = [], totalQuestions = 1, maxLanes = 12, compact = false }) => {
  const ranked = [...players].sort((a, b) => {
    const d = (b.correctCount || 0) - (a.correctCount || 0);
    if (d !== 0) return d;
    // Cùng số câu đúng thì ai xong sớm hơn xếp trên
    const fa = a.finishedAt || Infinity;
    const fb = b.finishedAt || Infinity;
    if (fa !== fb) return fa - fb;
    return (b.answeredCount || 0) - (a.answeredCount || 0);
  });

  const shown = ranked.slice(0, maxLanes);
  const hidden = ranked.length - shown.length;
  const laneH = compact ? 26 : 40;

  return (
    <div className="w-full">
      <div className="relative bg-slate-900/70 rounded-2xl border border-white/15 overflow-hidden">
        {/* Vạch đích */}
        <div className="absolute top-0 bottom-0 right-0 w-9 z-0 opacity-90"
          style={{ backgroundImage: 'repeating-conic-gradient(#fff 0% 25%, #111 0% 50%)', backgroundSize: '14px 14px' }} />
        <div className="absolute top-1 right-11 text-lg z-10">🏁</div>

        <div className="relative z-10 py-1.5">
          {shown.map((p, i) => {
            const pct = Math.min(100, ((p.correctCount || 0) / Math.max(1, totalQuestions)) * 100);
            const done = !!p.finishedAt;
            return (
              <div key={p.id} className="relative flex items-center border-b border-white/5 last:border-0" style={{ height: laneH }}>
                {/* Vạch kẻ làn */}
                <div className="absolute left-0 right-9 top-1/2 border-t-2 border-dashed border-white/10" />

                {/* Thứ hạng */}
                <span className={`relative z-10 shrink-0 w-9 text-center font-black ${compact ? 'text-xs' : 'text-base'} ${i < 3 ? 'text-yellow-300' : 'text-gray-500'}`}>
                  {MEDALS[i] || i + 1}
                </span>

                {/* Xe chạy theo tiến độ */}
                <div className="relative flex-1 h-full mr-9">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-all duration-700 ease-out whitespace-nowrap"
                    style={{ left: `calc(${pct}% - ${pct > 88 ? 60 : 0}px)` }}
                  >
                    <span className={compact ? 'text-lg' : 'text-2xl'}>{carOf(p.carIndex)}</span>
                    <span className={`font-bold text-white/90 ${compact ? 'text-[11px]' : 'text-sm'} max-w-[130px] truncate`}>
                      {p.name}
                    </span>
                    <span className={`font-black ${done ? 'text-emerald-400' : 'text-amber-300'} ${compact ? 'text-[11px]' : 'text-sm'}`}>
                      {p.correctCount || 0}
                    </span>
                    {done && <span className={compact ? 'text-xs' : 'text-base'}>✅</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {shown.length === 0 && (
            <div className="py-10 text-center text-gray-500">Chưa có tay đua nào xuất phát</div>
          )}
        </div>
      </div>

      {hidden > 0 && (
        <p className="text-center text-gray-400 text-sm mt-2">…và {hidden} tay đua khác đang trên đường</p>
      )}
    </div>
  );
};

export default RaceTrack;
