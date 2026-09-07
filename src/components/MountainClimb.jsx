import React from 'react';
import { LEVELS } from '../data/climbLevels';

/**
 * Ngọn núi bốn tầng. Mỗi học sinh đứng ở tầng cao nhất mình đã đạt chuẩn,
 * nên nhìn một cái là thấy phổ năng lực của cả lớp.
 */
const MountainClimb = ({ players = [], compact = false, showNames = true }) => {
  // Gom học sinh theo tầng đang đứng
  const byLevel = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  players.forEach(p => {
    const lv = Math.max(0, Math.min(4, p.reachedLevel || 0));
    byLevel[lv].push(p);
  });

  const rows = [...LEVELS].reverse(); // vẽ từ đỉnh xuống chân núi
  const rowH = compact ? 54 : 92;

  return (
    <div className="w-full">
      <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-gradient-to-b from-indigo-950 via-slate-900 to-stone-900">
        {/* Bóng núi phía sau */}
        <svg viewBox="0 0 400 300" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-30">
          <polygon points="200,10 380,290 20,290" fill="url(#mtn)" />
          <defs>
            <linearGradient id="mtn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="18%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#292524" />
            </linearGradient>
          </defs>
        </svg>

        <div className="relative z-10">
          {rows.map(lv => {
            const here = byLevel[lv.id] || [];
            return (
              <div
                key={lv.id}
                className="flex items-center gap-3 px-3 border-b border-white/10 last:border-0"
                style={{ minHeight: rowH }}
              >
                {/* Nhãn tầng */}
                <div className="shrink-0 w-24 md:w-36 text-right">
                  <div className={`font-black ${compact ? 'text-sm' : 'text-lg'}`} style={{ color: lv.color }}>
                    {lv.emoji} {compact ? lv.short : lv.name}
                  </div>
                  <div className={`text-white/45 font-bold ${compact ? 'text-[10px]' : 'text-xs'}`}>×{lv.weight} điểm</div>
                </div>

                {/* Vạch sườn núi */}
                <div className="shrink-0 w-1 self-stretch my-2 rounded-full opacity-60" style={{ backgroundColor: lv.color }} />

                {/* Học sinh đang đứng ở tầng này */}
                <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5 py-2">
                  {here.map(p => (
                    <div
                      key={p.id}
                      title={`${p.name}${p.className ? ' · ' + p.className : ''}`}
                      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 ${compact ? 'text-[10px]' : 'text-xs'}`}
                      style={{ backgroundColor: lv.color + '25', borderColor: lv.color + '99' }}
                    >
                      <span className={compact ? 'text-xs' : 'text-sm'}>🧗</span>
                      {showNames && <span className="font-bold text-white truncate max-w-[110px]">{p.name}</span>}
                    </div>
                  ))}
                  {here.length === 0 && <span className="text-white/25 text-xs italic">chưa ai lên tới đây</span>}
                </div>

                {/* Đếm số học sinh */}
                <div className="shrink-0 text-right">
                  <div className={`font-black ${compact ? 'text-lg' : 'text-2xl'}`} style={{ color: lv.color }}>{here.length}</div>
                  {players.length > 0 && (
                    <div className="text-white/45 text-[10px] font-bold">
                      {Math.round((here.length / players.length) * 100)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Chân núi: chưa qua nổi tầng đầu */}
          <div className="flex items-center gap-3 px-3 py-2 bg-black/40 border-t border-white/10" style={{ minHeight: compact ? 40 : 56 }}>
            <div className="shrink-0 w-24 md:w-36 text-right">
              <div className={`font-black text-white/55 ${compact ? 'text-sm' : 'text-base'}`}>⛺ Chân núi</div>
              <div className="text-white/35 text-[10px] font-bold">chưa đạt chuẩn tầng 1</div>
            </div>
            <div className="shrink-0 w-1 self-stretch my-1 rounded-full bg-white/25" />
            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
              {byLevel[0].map(p => (
                <div key={p.id} title={p.name} className={`flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2 py-0.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                  <span>🧗</span>
                  {showNames && <span className="font-bold text-white/85 truncate max-w-[110px]">{p.name}</span>}
                </div>
              ))}
              {byLevel[0].length === 0 && <span className="text-white/25 text-xs italic">cả lớp đã rời chân núi 🎉</span>}
            </div>
            <div className="shrink-0 text-right">
              <div className={`font-black text-white/60 ${compact ? 'text-lg' : 'text-2xl'}`}>{byLevel[0].length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MountainClimb;
