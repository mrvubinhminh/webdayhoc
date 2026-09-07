import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { ref, set, onValue, get, update } from 'firebase/database';
import { STAGES, COMBOS, hintFor, stageDone, progressOf, ratingOf } from '../data/careerPathData';

const SESSION_KEY = 'pathPlayerSession';
const saveSession = (pin, playerId) => { try { localStorage.setItem(SESSION_KEY, JSON.stringify({ pin, playerId })); } catch { /* bị chặn */ } };
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch { /* không sao */ } };

const PathPlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pin, setPin] = useState(() => searchParams.get('pin') || '');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [localState, setLocalState] = useState('JOIN');
  const [playerId, setPlayerId] = useState('');
  const [step, setStep] = useState(() => searchParams.get('pin') ? 2 : 1);
  const [roomData, setRoomData] = useState(null);
  const [stageIdx, setStageIdx] = useState(0);
  const [draft, setDraft] = useState({});
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState('edit');   // 'edit' | 'map'
  const saveTimer = useRef(null);

  useEffect(() => {
    if ((localState === 'PLAYING' || step === 2) && pin) {
      const unsub = onValue(ref(db, `pathRooms/${pin}`), (snap) => {
        const data = snap.val();
        if (data) setRoomData(data);
        else { clearSession(); alert("Phòng đã đóng!"); navigate('/'); }
      });
      return () => unsub();
    }
  }, [localState, step, pin, navigate]);

  // Vào lại đúng chỗ cũ, bản nháp giữ nguyên
  useEffect(() => {
    const s = readSession();
    if (!s?.pin || !s?.playerId) return;
    const urlPin = searchParams.get('pin');
    if (urlPin && urlPin !== s.pin) { clearSession(); return; }
    get(ref(db, `pathRooms/${s.pin}/players/${s.playerId}`)).then(snap => {
      if (!snap.exists()) { clearSession(); return; }
      const p = snap.val();
      setPin(s.pin); setPlayerId(s.playerId);
      setName(p.name || ''); setClassName(p.className || '');
      setDraft(p.data || {});
      setLocalState('PLAYING');
    }).catch(() => {});
  }, []);

  const me = roomData?.players?.[playerId];
  const stage = STAGES[stageIdx];
  const prog = progressOf(draft);
  const rating = ratingOf(prog.percent);

  const checkPin = async (e) => {
    e.preventDefault();
    if (!pin) return;
    const snap = await get(ref(db, `pathRooms/${pin}`));
    if (!snap.exists()) { alert("Mã phòng không hợp lệ!"); return; }
    const data = snap.val();
    setRoomData(data);
    if (data.settings?.defaultClass && !className) setClassName(data.settings.defaultClass);
    setStep(2);
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    if (!name.trim()) { alert("Vui lòng nhập họ tên!"); return; }
    if (!className.trim()) { alert("Vui lòng nhập lớp!"); return; }
    const id = Date.now().toString();
    setPlayerId(id);
    await set(ref(db, `pathRooms/${pin}/players/${id}`), {
      id, name: name.trim(), className: className.trim().toUpperCase(),
      data: {}, percent: 0, updatedAt: Date.now()
    });
    saveSession(pin, id);
    setLocalState('PLAYING');
  };

  // Gõ tới đâu lưu tới đó, chờ 800ms cho đỡ ghi liên tục
  const setField = (key, value) => {
    const next = { ...draft, [stage.id]: { ...(draft[stage.id] || {}), [key]: value } };
    setDraft(next);
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!playerId || !pin) return;
      await update(ref(db, `pathRooms/${pin}/players/${playerId}`), {
        data: next, percent: progressOf(next).percent, updatedAt: Date.now()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  const val = (key) => (draft[stage.id] || {})[key] || '';
  const hollandHint = hintFor((draft.goal || {}).hollandCode);

  const Field = ({ f }) => {
    if (f.type === 'combo') {
      return (
        <div>
          <label className="block text-sky-200 font-bold text-sm mb-1.5">{f.label} {f.required && <span className="text-red-400">*</span>}</label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {COMBOS.map(c => (
              <button key={c.code} type="button" onClick={() => setField(f.key, c.code)}
                className={`py-2.5 px-2 rounded-xl border-2 transition-all text-left ${val(f.key) === c.code ? 'bg-sky-500/25 border-sky-400' : 'bg-slate-900 border-slate-700 hover:border-sky-500/50'}`}>
                <div className="font-black text-white text-sm">{c.code}</div>
                <div className="text-[10px] text-gray-400 leading-tight">{c.subjects}</div>
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (f.type === 'score') {
      const [subj, now, goal] = (val(f.key) || '||').split('|');
      const put = (i, v) => {
        const parts = (val(f.key) || '||').split('|');
        parts[i] = v;
        setField(f.key, parts.join('|'));
      };
      return (
        <div>
          <label className="block text-sky-200 font-bold text-sm mb-1.5">{f.label}</label>
          <div className="flex gap-2">
            <input value={subj} onChange={e => put(0, e.target.value)} placeholder="Tên môn"
              className="flex-1 bg-slate-900 border-2 border-slate-700 text-white px-3 py-2.5 rounded-xl outline-none focus:border-sky-500" />
            <input value={now} onChange={e => put(1, e.target.value)} placeholder="Hiện tại" inputMode="decimal"
              className="w-24 bg-slate-900 border-2 border-slate-700 text-amber-300 text-center font-bold px-2 py-2.5 rounded-xl outline-none focus:border-sky-500" />
            <span className="self-center text-gray-500 font-black">→</span>
            <input value={goal} onChange={e => put(2, e.target.value)} placeholder="Mục tiêu" inputMode="decimal"
              className="w-24 bg-slate-900 border-2 border-slate-700 text-emerald-300 text-center font-bold px-2 py-2.5 rounded-xl outline-none focus:border-sky-500" />
          </div>
        </div>
      );
    }
    return (
      <div>
        <label className="block text-sky-200 font-bold text-sm mb-1.5">{f.label} {f.required && <span className="text-red-400">*</span>}</label>
        {f.type === 'long' ? (
          <textarea value={val(f.key)} onChange={e => setField(f.key, e.target.value)} placeholder={f.placeholder} rows={3}
            className="w-full bg-slate-900 border-2 border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-sky-500 leading-relaxed" />
        ) : (
          <input value={val(f.key)} onChange={e => setField(f.key, e.target.value)} placeholder={f.placeholder}
            className="w-full bg-slate-900 border-2 border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-sky-500" />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950 flex flex-col items-center p-4">

      {localState === 'JOIN' && step === 1 && (
        <form onSubmit={checkPin} className="w-full max-w-sm bg-slate-900/90 p-8 rounded-3xl text-center border border-sky-700/50 my-auto">
          <div className="text-6xl mb-3">🗺️</div>
          <h1 className="text-3xl font-black text-sky-300 mb-1">Lộ Trình Nghề Nghiệp</h1>
          <p className="text-gray-400 text-sm mb-6">Vẽ con đường từ hôm nay tới nghề em mơ ước</p>
          <input type="text" placeholder="Mã phòng (PIN)" value={pin} onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-2xl font-bold bg-white text-black rounded-xl p-4 mb-4 outline-none border-4 border-transparent focus:border-sky-500" />
          <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black text-2xl py-4 rounded-xl shadow-[0_10px_0_#075985] active:translate-y-[10px] active:shadow-none transition-all">
            KẾT NỐI
          </button>
        </form>
      )}

      {localState === 'JOIN' && step === 2 && (
        <form onSubmit={joinRoom} className="w-full max-w-sm bg-slate-900/90 p-8 rounded-3xl text-center border border-sky-700/50 my-auto">
          <h1 className="text-2xl font-black text-white mb-1">Phòng {pin}</h1>
          <p className="text-sky-300 font-bold mb-6">Bản lộ trình này là của riêng em</p>
          <label className="block text-left text-gray-400 font-bold text-sm mb-1">Họ và tên</label>
          <input type="text" placeholder="Nguyễn Văn An" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full text-center text-xl font-bold bg-white text-black rounded-xl p-4 mb-4 outline-none border-4 border-transparent focus:border-sky-500" />
          <label className="block text-left text-gray-400 font-bold text-sm mb-1">Lớp</label>
          <input type="text" placeholder="10A1" value={className} onChange={(e) => setClassName(e.target.value)}
            className="w-full text-center text-xl font-bold bg-white text-black rounded-xl p-4 mb-6 outline-none border-4 border-transparent focus:border-sky-500" />
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl py-4 rounded-xl shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none transition-all">
            🗺️ BẮT ĐẦU VẼ
          </button>
        </form>
      )}

      {localState === 'PLAYING' && roomData && (
        <div className="w-full max-w-lg flex flex-col">
          {/* Thanh trên: tiến độ + trạng thái lưu */}
          <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-slate-950/95 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-white truncate">{me?.name || name}</span>
              <span className="text-xs text-sky-300 font-bold">{me?.className || className}</span>
              <span className="ml-auto text-xs font-bold" style={{ color: rating.color }}>
                {rating.emoji} {prog.done}/{prog.total} chặng
              </span>
              {saved && <span className="text-xs text-emerald-400 font-bold">✓ đã lưu</span>}
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500" style={{ width: `${prog.percent}%` }} />
            </div>

            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
              {STAGES.map((s, i) => {
                const ok = stageDone(s, draft);
                return (
                  <button key={s.id} onClick={() => { setStageIdx(i); setView('edit'); }}
                    className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      i === stageIdx && view === 'edit' ? 'bg-sky-500 text-slate-900 border-sky-400'
                      : ok ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700'
                      : 'bg-slate-800 text-gray-400 border-slate-700'}`}>
                    {s.emoji} {ok ? '✓' : i + 1}
                  </button>
                );
              })}
              <button onClick={() => setView('map')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-black border ${view === 'map' ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-slate-800 text-amber-300 border-amber-700'}`}>
                🗺️ Xem lộ trình
              </button>
            </div>
          </div>

          {/* Màn nhập từng chặng */}
          {view === 'edit' && (
            <div className="flex flex-col gap-4 py-3">
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-sky-800/50">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{stage.emoji}</span>
                  <div>
                    <h2 className="text-xl font-black text-white leading-tight">Chặng {stage.order}: {stage.name}</h2>
                    <p className="text-[11px] text-sky-400/80 font-bold">{stage.lesson}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mt-2 leading-relaxed">{stage.hint}</p>
              </div>

              {/* Nối tiếp kết quả La Bàn nếu em đã điền mã Holland */}
              {stage.id === 'goal' && hollandHint && (
                <div className="bg-emerald-900/40 border border-emerald-600 rounded-2xl p-3.5">
                  <p className="text-emerald-300 text-xs font-black uppercase tracking-widest">🧭 Từ mã Holland của em</p>
                  <p className="text-white text-sm mt-1 leading-relaxed">Nhóm ngành thường hợp: <b>{hollandHint}</b></p>
                  <p className="text-emerald-200/70 text-xs mt-1">Chỉ là gợi ý — em vẫn tự quyết định nhé</p>
                </div>
              )}

              {stage.fields.map(f => <Field key={f.key} f={f} />)}

              <div className="flex gap-2 pt-1 pb-4">
                <button onClick={() => setStageIdx(i => Math.max(0, i - 1))} disabled={stageIdx === 0}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white py-3.5 rounded-2xl font-bold">
                  ← Chặng trước
                </button>
                {stageIdx < STAGES.length - 1 ? (
                  <button onClick={() => setStageIdx(i => i + 1)}
                    className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-3.5 rounded-2xl font-black shadow-[0_6px_0_#075985] active:translate-y-1.5 active:shadow-none">
                    Chặng sau →
                  </button>
                ) : (
                  <button onClick={() => setView('map')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-2xl font-black shadow-[0_6px_0_#047857] active:translate-y-1.5 active:shadow-none">
                    🗺️ Xem lộ trình
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bản lộ trình hoàn chỉnh */}
          {view === 'map' && (
            <div className="py-3 flex flex-col gap-3 pb-8">
              <div className="text-center">
                <div className="text-5xl">🗺️</div>
                <h2 className="text-2xl font-black text-sky-200 mt-1">Lộ trình của {me?.name || name}</h2>
                <p className="font-bold mt-1" style={{ color: rating.color }}>{rating.emoji} {rating.label} · {prog.percent}%</p>
              </div>

              {(draft.goal || {}).career && (
                <div className="bg-gradient-to-r from-sky-900/60 to-emerald-900/50 border-2 border-sky-500 rounded-2xl px-5 py-4 text-center">
                  <p className="text-sky-300 text-xs uppercase tracking-widest font-bold">Đích đến</p>
                  <p className="text-2xl font-black text-white mt-1">{draft.goal.career}</p>
                  {(draft.school || {}).major && <p className="text-sky-100 font-bold text-sm mt-1">{draft.school.major}{draft.school.school1 ? ` · ${draft.school.school1}` : ''}</p>}
                </div>
              )}

              {STAGES.map((s, i) => {
                const d = draft[s.id] || {};
                const ok = stageDone(s, draft);
                const filled = s.fields.filter(f => (d[f.key] || '').toString().trim());
                return (
                  <div key={s.id} className="relative pl-7">
                    {i < STAGES.length - 1 && <div className="absolute left-[11px] top-7 bottom-0 w-0.5 bg-slate-700" />}
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 ${ok ? 'bg-emerald-500 border-emerald-300 text-slate-900' : 'bg-slate-800 border-slate-600 text-gray-400'}`}>
                      {ok ? '✓' : s.order}
                    </div>
                    <div className={`rounded-2xl p-3.5 border ${ok ? 'bg-slate-800/70 border-emerald-800/60' : 'bg-slate-900/60 border-slate-700'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{s.emoji}</span>
                        <span className="font-black text-white text-sm">{s.name}</span>
                        <button onClick={() => { setStageIdx(i); setView('edit'); }} className="ml-auto text-xs text-sky-400 font-bold hover:text-sky-300">
                          sửa
                        </button>
                      </div>
                      {filled.length === 0 ? (
                        <p className="text-gray-500 text-xs italic mt-1.5">Chưa điền gì</p>
                      ) : (
                        <div className="mt-2 flex flex-col gap-1.5">
                          {filled.map(f => (
                            <div key={f.key} className="text-sm">
                              <span className="text-sky-400/80 text-xs font-bold">{f.label}: </span>
                              <span className="text-white/90 whitespace-pre-wrap">
                                {f.type === 'score'
                                  ? (() => { const [a, b, c] = (d[f.key] || '||').split('|'); return `${a || '?'} — ${b || '?'} → ${c || '?'}`; })()
                                  : d[f.key]}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <p className="text-center text-gray-400 text-sm mt-2 px-3 leading-relaxed">
                Bản lộ trình này lưu tự động. Em quay lại sửa bất cứ lúc nào,
                kể cả ở tiết sau hay khi đổi ý 🌱
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PathPlayer;
