import React from 'react';

// Bảng màu dùng chung cho các nhóm trong Ngân Hàng Tri Thức
export const TEAM_COLORS = [
  '#EF4444', '#3B82F6', '#F59E0B', '#10B981',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#A855F7'
];

export const colorOf = (index) => TEAM_COLORS[((index || 1) - 1) % TEAM_COLORS.length];

/**
 * Biểu đồ đường vốn của từng nhóm qua các câu, vẽ thẳng bằng SVG
 * nên không kéo thêm thư viện biểu đồ nào vào dự án.
 */
const CapitalChart = ({
  players = [],       // [{ id, name, history: {qIdx: capital}, index }]
  startingCapital = 1000,
  totalQuestions = 0,
  currentIndex = 0,
  compact = false
}) => {
  const W = 1000;
  const H = compact ? 260 : 420;
  const padL = compact ? 56 : 70;
  const padR = 16;
  const padT = 16;
  const padB = compact ? 28 : 36;

  // Trục ngang: câu 0 (vốn ban đầu) đến câu đã chơi xong
  const lastPlayed = Math.max(
    0,
    ...players.map(p => {
      const keys = Object.keys(p.history || {}).map(Number);
      return keys.length ? Math.max(...keys) + 1 : 0;
    })
  );
  const steps = Math.max(1, Math.min(totalQuestions, Math.max(lastPlayed, currentIndex)));

  const series = players.map(p => {
    const pts = [startingCapital];
    for (let i = 0; i < steps; i++) {
      const v = p.history?.[i];
      pts.push(v === undefined ? pts[pts.length - 1] : v);
    }
    return { ...p, pts };
  });

  const allValues = series.flatMap(s => s.pts).concat([startingCapital]);
  const rawMax = Math.max(...allValues, startingCapital * 1.2);
  const maxY = Math.ceil(rawMax / 100) * 100;
  const minY = 0;

  const x = (i) => padL + (i / steps) * (W - padL - padR);
  const y = (v) => padT + (1 - (v - minY) / (maxY - minY || 1)) * (H - padT - padB);

  const gridLines = 4;
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) => Math.round(minY + (i / gridLines) * (maxY - minY)));

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Biểu đồ vốn các nhóm">
        {/* Lưới ngang + mốc vốn */}
        {ticks.map(t => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fill="rgba(255,255,255,0.55)" fontSize={compact ? 13 : 15} fontWeight="700">
              {t}
            </text>
          </g>
        ))}

        {/* Vạch vốn khởi điểm để thấy ai đang lãi, ai đang lỗ */}
        <line
          x1={padL} x2={W - padR} y1={y(startingCapital)} y2={y(startingCapital)}
          stroke="rgba(250,204,21,0.65)" strokeWidth="2" strokeDasharray="8 6"
        />
        <text x={W - padR} y={y(startingCapital) - 6} textAnchor="end" fill="rgba(250,204,21,0.9)" fontSize={compact ? 12 : 14} fontWeight="700">
          vốn ban đầu
        </text>

        {/* Mốc số câu */}
        {Array.from({ length: steps + 1 }, (_, i) => i).map(i => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={compact ? 12 : 14} fontWeight="700">
            {i === 0 ? 'BĐ' : i}
          </text>
        ))}

        {/* Đường vốn từng nhóm */}
        {series.map(s => {
          const color = colorOf(s.index);
          const d = s.pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
          const last = s.pts.length - 1;
          return (
            <g key={s.id}>
              <path d={d} fill="none" stroke={color} strokeWidth={compact ? 3 : 4} strokeLinejoin="round" strokeLinecap="round" />
              {s.pts.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={compact ? 3 : 4.5} fill={color} stroke="#0b0b0b" strokeWidth="1.5" />
              ))}
              <circle cx={x(last)} cy={y(s.pts[last])} r={compact ? 5 : 7} fill={color} stroke="#fff" strokeWidth="2" />
            </g>
          );
        })}
      </svg>

      {/* Chú thích nhóm ↔ màu ↔ vốn hiện tại */}
      <div className="flex flex-wrap justify-center gap-2 mt-3">
        {[...series].sort((a, b) => (b.pts[b.pts.length - 1]) - (a.pts[a.pts.length - 1])).map(s => {
          const now = s.pts[s.pts.length - 1];
          const diff = now - startingCapital;
          return (
            <div key={s.id} className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full border border-white/15">
              <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: colorOf(s.index) }} />
              <span className={`font-bold text-white truncate max-w-[9rem] ${compact ? 'text-xs' : 'text-sm'}`}>{s.name}</span>
              <span className={`font-black shrink-0 ${compact ? 'text-xs' : 'text-sm'} ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {now} {diff >= 0 ? `(+${diff})` : `(${diff})`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CapitalChart;
