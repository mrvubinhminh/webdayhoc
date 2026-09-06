import React from 'react';

/**
 * Bản đồ kho báu: lưới vuông n×n, đánh số 1 → n² theo kiểu "rắn bò"
 * (ô 1 ở góc dưới trái, bò ngang rồi lên hàng trên, đảo chiều mỗi hàng).
 * Ô cuối cùng là đích, gắn cờ 🏁.
 */

// Chuyển số ô (1..n²) sang toạ độ lưới CSS (row/col tính từ 1)
export const cellToGrid = (cell, size) => {
  const idx = cell - 1;
  const rowFromBottom = Math.floor(idx / size);
  const posInRow = idx % size;
  const col = rowFromBottom % 2 === 0 ? posInRow : size - 1 - posInRow;
  return { row: size - rowFromBottom, col: col + 1 };
};

// Áp dụng ô đặc biệt: trả về vị trí cuối cùng sau khi bị đẩy/kéo
export const applySpecialCell = (position, specialCells, totalCells) => {
  const step = specialCells?.[position];
  if (!step) return { finalPosition: position, jumped: 0 };
  const moved = Math.min(Math.max(position + step, 1), totalCells);
  return { finalPosition: moved, jumped: step };
};

const TEAM_COLORS = [
  '#EF4444', '#3B82F6', '#F59E0B', '#10B981',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#A855F7'
];

export const getTeamColor = (index) => TEAM_COLORS[(index - 1) % TEAM_COLORS.length];

const TreasureBoard = ({
  size = 6,
  bgUrl = '',
  specialCells = {},
  teams = [],          // [{ id, name, position, index }]
  highlightCell = null, // ô đang có hiệu ứng
  compact = false
}) => {
  const totalCells = size * size;
  const cells = Array.from({ length: totalCells }, (_, i) => i + 1);

  // Gom quân theo ô để xếp chồng khi trùng
  const teamsByCell = {};
  teams.forEach(t => {
    const pos = t.position || 0;
    if (pos < 1) return;
    if (!teamsByCell[pos]) teamsByCell[pos] = [];
    teamsByCell[pos].push(t);
  });

  return (
    <div
      className="relative w-full aspect-square rounded-2xl overflow-hidden border-4 border-amber-600/60 shadow-[0_0_40px_rgba(217,119,6,0.35)]"
      style={
        bgUrl
          ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: 'linear-gradient(135deg, #78350f 0%, #451a03 50%, #1c1917 100%)' }
      }
    >
      <div
        className="absolute inset-0 grid gap-[2px] p-[2px]"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`
        }}
      >
        {cells.map(cell => {
          const { row, col } = cellToGrid(cell, size);
          const special = specialCells?.[cell];
          const isGoal = cell === totalCells;
          const isStart = cell === 1;
          const occupants = teamsByCell[cell] || [];
          const isHighlight = highlightCell === cell;

          let ring = 'border-white/25';
          if (isGoal) ring = 'border-yellow-400 border-2';
          else if (special > 0) ring = 'border-emerald-400/80';
          else if (special < 0) ring = 'border-red-400/80';

          return (
            <div
              key={cell}
              style={{ gridRow: row, gridColumn: col }}
              className={`relative border ${ring} rounded-md flex items-center justify-center transition-all duration-300 ${
                isHighlight ? 'bg-yellow-300/40 scale-105 z-20 shadow-[0_0_20px_rgba(250,204,21,0.9)]' : 'bg-black/15'
              } ${special > 0 ? 'bg-emerald-500/15' : ''} ${special < 0 ? 'bg-red-500/15' : ''}`}
            >
              {/* Số ô */}
              <span className={`absolute top-0.5 left-1 font-bold text-white/50 ${compact ? 'text-[8px]' : 'text-[10px] md:text-xs'}`}>
                {cell}
              </span>

              {/* Ký hiệu ô */}
              {isGoal && <span className={compact ? 'text-lg' : 'text-2xl md:text-4xl'}>🏁</span>}
              {isStart && occupants.length === 0 && <span className={compact ? 'text-xs' : 'text-lg'}>⚓</span>}
              {!isGoal && special > 0 && (
                <span className={`font-black text-emerald-300 ${compact ? 'text-[9px]' : 'text-xs md:text-base'}`}>
                  ▲{special}
                </span>
              )}
              {!isGoal && special < 0 && (
                <span className={`font-black text-red-300 ${compact ? 'text-[9px]' : 'text-xs md:text-base'}`}>
                  ▼{Math.abs(special)}
                </span>
              )}

              {/* Quân của các nhóm */}
              {occupants.length > 0 && (
                <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 p-0.5">
                  {occupants.map(t => (
                    <div
                      key={t.id}
                      title={t.name}
                      className={`rounded-full border-2 border-white shadow-lg flex items-center justify-center font-black text-white ${
                        compact ? 'w-3 h-3 text-[7px]' : 'w-5 h-5 md:w-7 md:h-7 text-[9px] md:text-xs'
                      }`}
                      style={{ backgroundColor: getTeamColor(t.index || 1) }}
                    >
                      {t.index}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TreasureBoard;
