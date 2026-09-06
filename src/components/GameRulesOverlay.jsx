import React from 'react';

/**
 * Bảng luật chơi chiếu toàn màn hình cho cả lớp đọc trước khi vào phòng.
 * Chữ cỡ lớn, mỗi bước một dòng, đọc được từ cuối lớp.
 */
const GameRulesOverlay = ({
  open,
  onClose,
  emoji = '🎮',
  title = 'LUẬT CHƠI',
  subtitle = '',
  steps = [],        // [{ icon, text, note }]
  highlights = [],   // [{ emoji, title, text, tone }]
  footer = '',
  bgStyle,
  accent = 'sky',
  closeLabel = 'ĐÃ HIỂU — VÀO PHÒNG CHỜ'
}) => {
  if (!open) return null;

  const accents = {
    sky:    { text: 'text-sky-300',    border: 'border-sky-500/50',    btn: 'bg-sky-600 hover:bg-sky-500',       shadow: 'shadow-[0_8px_0_#075985]' },
    amber:  { text: 'text-amber-300',  border: 'border-amber-500/50',  btn: 'bg-amber-600 hover:bg-amber-500',   shadow: 'shadow-[0_8px_0_#92400e]' },
    emerald:{ text: 'text-emerald-300',border: 'border-emerald-500/50',btn: 'bg-emerald-600 hover:bg-emerald-500',shadow: 'shadow-[0_8px_0_#047857]' },
  };
  const a = accents[accent] || accents.sky;

  const toneClass = {
    good: 'bg-emerald-900/45 border-emerald-500',
    warn: 'bg-orange-900/45 border-orange-500',
    info: 'bg-sky-900/45 border-sky-500',
    star: 'bg-amber-900/45 border-amber-500',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={bgStyle || { background: 'linear-gradient(160deg,#020617 0%,#0f172a 60%,#082f49 100%)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 w-full">
        <div className="w-full max-w-5xl">

          <div className="text-center mb-7">
            <div className="text-7xl md:text-8xl mb-2">{emoji}</div>
            <h1 className={`text-4xl md:text-6xl font-black uppercase ${a.text} drop-shadow-[0_0_35px_rgba(56,189,248,0.45)]`}>{title}</h1>
            {subtitle && <p className="text-lg md:text-2xl text-white/85 font-semibold mt-3">{subtitle}</p>}
          </div>

          {/* Các bước chơi */}
          <div className="grid md:grid-cols-2 gap-3 mb-5">
            {steps.map((s, i) => (
              <div key={i} className={`bg-black/45 backdrop-blur-md rounded-2xl border ${a.border} p-4 flex items-start gap-4`}>
                <div className={`shrink-0 w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-2xl font-black ${a.text}`}>
                  {s.icon || i + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-lg md:text-xl leading-snug">{s.text}</p>
                  {s.note && <p className="text-white/60 text-sm md:text-base mt-1">{s.note}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Điểm nhấn cần nhớ */}
          {highlights.length > 0 && (
            <div className={`grid gap-3 mb-6 ${highlights.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {highlights.map((h, i) => (
                <div key={i} className={`rounded-2xl border-2 p-4 text-center ${toneClass[h.tone] || toneClass.info}`}>
                  <div className="text-4xl mb-1">{h.emoji}</div>
                  <p className="text-white font-black text-lg">{h.title}</p>
                  {h.text && <p className="text-white/80 text-sm mt-1 leading-snug">{h.text}</p>}
                </div>
              ))}
            </div>
          )}

          {footer && (
            <p className="text-center text-white/80 text-base md:text-xl font-semibold mb-6 px-4">{footer}</p>
          )}

          <div className="flex justify-center">
            <button
              onClick={onClose}
              className={`${a.btn} ${a.shadow} text-white px-10 py-5 rounded-2xl font-black text-xl md:text-2xl active:translate-y-2 active:shadow-none transition-all`}
            >
              {closeLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRulesOverlay;
