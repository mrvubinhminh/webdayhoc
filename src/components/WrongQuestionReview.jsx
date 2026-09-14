import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, XCircle, CheckCircle2 } from 'lucide-react';
import MathText from './MathText';

/**
 * Màn chiếu chữa bài cuối giờ: đưa từng câu lớp làm sai nhiều nhất lên
 * TOÀN MÀN HÌNH, to đúng như lúc đang chơi, kèm đáp án đúng và lời giải.
 *
 * items: mảng câu hỏi đã xếp theo số người sai (xem constants/wrongStats.js)
 * unit : gọi người chơi là gì — "học sinh", "nhóm", "bạn"…
 */
const OPTION_STYLES = [
  { bg: 'bg-red-500', edge: 'border-red-700' },
  { bg: 'bg-blue-500', edge: 'border-blue-700' },
  { bg: 'bg-yellow-500', edge: 'border-yellow-700' },
  { bg: 'bg-emerald-500', edge: 'border-emerald-700' }
];

const WrongQuestionReview = ({ open, onClose, items = [], unit = 'học sinh' }) => {
  const [pos, setPos] = useState(0);

  // Mở lại thì luôn bắt đầu từ câu sai nhiều nhất
  useEffect(() => { if (open) setPos(0); }, [open]);

  const total = items.length;
  const go = (delta) => setPos(p => Math.min(total - 1, Math.max(0, p + delta)));

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, total, onClose]);

  if (!open) return null;

  const q = items[pos];
  if (!q) {
    return createPortal(
      <div className="fixed inset-0 z-[70] bg-slate-950 flex flex-col items-center justify-center gap-6 p-8">
        <div className="text-8xl">🎉</div>
        <h2 className="text-4xl font-black text-emerald-400 text-center">Cả lớp không sai câu nào!</h2>
        <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-bold text-xl">
          Đóng
        </button>
      </div>,
      document.body
    );
  }

  const options = [q.optionA, q.optionB, q.optionC, q.optionD];
  const correctIdx = (parseInt(q.correctOption, 10) || 0) - 1;

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-slate-950 flex flex-col animate-fade-in">
      {/* Thanh trên: câu thứ mấy trong danh sách sai + số người sai */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-5 md:px-8 py-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <XCircle className="w-7 h-7 md:w-9 md:h-9 text-red-500 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xl md:text-3xl font-black text-white truncate">Chữa câu sai nhiều</h2>
            <p className="text-gray-400 text-xs md:text-sm font-bold">
              Câu {pos + 1}/{total} trong danh sách · Câu số {q.index + 1} của đề
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-red-900/40 border border-red-600 text-red-300 font-black px-4 py-2 rounded-xl text-base md:text-2xl whitespace-nowrap">
            {q.wrongCount} {unit} sai
          </div>
          <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center" title="Đóng (Esc)">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Nội dung câu hỏi — to như lúc đang chơi */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 md:px-10 py-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="bg-slate-900 border-4 border-slate-800 rounded-3xl p-6 md:p-10">
            <div className="text-white text-2xl md:text-4xl font-bold leading-relaxed whitespace-pre-wrap">
              <MathText text={q.question} />
            </div>
            {q.image && (
              <div className="mt-6 flex justify-center">
                <img src={q.image} alt="minh hoạ" className="max-h-[38vh] object-contain rounded-2xl shadow-lg"
                  onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}
          </div>

          {q.type === 'TLN' ? (
            <div className="bg-emerald-900/30 border-4 border-emerald-500 rounded-3xl p-6 md:p-8 text-center">
              <p className="text-emerald-300 font-bold uppercase tracking-widest text-sm md:text-base">Đáp án đúng</p>
              <div className="text-white text-3xl md:text-6xl font-black mt-3">
                <MathText text={q.correctOption} />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              {options.map((text, i) => {
                const isCorrect = i === correctIdx;
                const s = OPTION_STYLES[i];
                return (
                  <div key={i}
                    className={`rounded-2xl p-5 md:p-7 border-b-8 flex items-start gap-4 text-left transition-all ${
                      isCorrect
                        ? `${s.bg} ${s.edge} ring-4 ring-emerald-300 shadow-[0_0_40px_rgba(52,211,153,0.45)]`
                        : `${s.bg} ${s.edge} opacity-40`
                    }`}
                  >
                    <span className="text-white/70 font-black text-2xl md:text-4xl shrink-0 leading-tight w-10 md:w-12 text-center">
                      {['A', 'B', 'C', 'D'][i]}
                    </span>
                    <span className="flex-1 text-white font-bold text-xl md:text-3xl leading-relaxed break-words">
                      <MathText text={text} />
                    </span>
                    {isCorrect && <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-white shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}

          {q.explanation && (
            <div className="bg-slate-900 border-2 border-amber-600/50 rounded-3xl p-6 md:p-8">
              <p className="text-amber-400 font-black uppercase tracking-widest text-sm mb-3">💡 Lời giải</p>
              <div className="text-gray-100 text-lg md:text-2xl leading-relaxed whitespace-pre-wrap">
                <MathText text={q.explanation} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chuyển câu */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-5 md:px-8 py-4 border-t border-slate-800 bg-slate-900">
        <button onClick={() => go(-1)} disabled={pos === 0}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white px-5 md:px-8 py-3 md:py-4 rounded-2xl font-bold text-base md:text-xl">
          <ChevronLeft className="w-6 h-6" /> Câu trước
        </button>

        <div className="flex gap-1.5 md:gap-2 overflow-x-auto max-w-[45%] px-1">
          {items.map((it, i) => (
            <button key={it.index} onClick={() => setPos(i)} title={`Câu ${it.index + 1} — ${it.wrongCount} ${unit} sai`}
              className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full shrink-0 transition-colors ${i === pos ? 'bg-red-500' : 'bg-slate-700 hover:bg-slate-600'}`} />
          ))}
        </div>

        <button onClick={() => go(1)} disabled={pos >= total - 1}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white px-5 md:px-8 py-3 md:py-4 rounded-2xl font-bold text-base md:text-xl">
          Câu sau <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>,
    document.body
  );
};

export default WrongQuestionReview;
