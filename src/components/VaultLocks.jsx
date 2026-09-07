import React from 'react';

/**
 * Dãy ổ khoá: mỗi ải một ổ. Ải nào cả lớp phải làm lại nhiều thì
 * ổ khoá đó nóng lên, nhìn là biết chỗ cần dạy lại.
 */
const VaultLocks = ({ gates = [], players = [], secretParts = [], compact = false, revealAll = false }) => {
  const total = players.length || 1;

  return (
    <div className="w-full">
      <div className={`grid gap-2.5 ${compact ? 'grid-cols-4 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-4'}`}>
        {gates.map(g => {
          const passed = players.filter(p => p.gates?.[g.index]?.passed).length;
          const working = players.filter(p => (p.currentGate ?? -1) === g.index && !p.gates?.[g.index]?.passed).length;
          const attempts = players.map(p => p.gates?.[g.index]?.attempts || 0).filter(n => n > 0);
          const avgTries = attempts.length ? (attempts.reduce((s, n) => s + n, 0) / attempts.length) : 0;
          const pct = Math.round((passed / total) * 100);

          // Càng phải làm lại nhiều thì ổ khoá càng ngả sang đỏ
          const heat = avgTries >= 2.5 ? 'border-red-500 bg-red-950/50'
            : avgTries >= 1.6 ? 'border-amber-500 bg-amber-950/40'
            : passed > 0 ? 'border-emerald-500 bg-emerald-950/40'
            : 'border-slate-600 bg-slate-900/60';

          const open = revealAll || passed > 0;

          return (
            <div key={g.index} className={`rounded-2xl border-2 ${heat} p-3 flex flex-col`}>
              <div className="flex items-start justify-between gap-2">
                <span className={compact ? 'text-2xl' : 'text-4xl'}>{open ? '🔓' : '🔒'}</span>
                <span className={`font-black text-white/80 ${compact ? 'text-xs' : 'text-sm'}`}>#{g.index + 1}</span>
              </div>

              <p className={`font-bold text-white mt-1 leading-tight ${compact ? 'text-[11px]' : 'text-sm'} line-clamp-2`}>
                {g.name}
              </p>

              {/* Mảnh mật mã mở ra khi có người vượt ải */}
              <div className={`mt-2 rounded-lg px-2 py-1.5 text-center font-black tracking-widest ${
                open ? 'bg-yellow-400/20 text-yellow-200 border border-yellow-500/60' : 'bg-black/40 text-white/25 border border-white/10'
              } ${compact ? 'text-xs' : 'text-base'}`}>
                {open ? (secretParts[g.index] || '???') : '• • •'}
              </div>

              <div className="mt-2 h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>

              <div className={`flex justify-between mt-1.5 font-bold ${compact ? 'text-[10px]' : 'text-xs'}`}>
                <span className="text-emerald-400">{passed}/{total} qua</span>
                {working > 0 && <span className="text-amber-300">{working} đang làm</span>}
              </div>

              {avgTries > 0 && (
                <div className={`text-white/45 font-bold mt-0.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                  TB {avgTries.toFixed(1)} lượt
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VaultLocks;
