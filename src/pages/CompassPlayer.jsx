import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { ref, set, onValue, get, update } from 'firebase/database';
import RadarChart from '../components/RadarChart';
import { GROUPS, groupOf, LIKERT, itemsFor, scoreGroups, hollandCode, careersFor } from '../data/hollandData';

const SESSION_KEY = 'compassPlayerSession';
const saveSession = (pin, playerId) => { try { localStorage.setItem(SESSION_KEY, JSON.stringify({ pin, playerId })); } catch { /* bị chặn */ } };
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch { /* không sao */ } };

const CompassPlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pin, setPin] = useState(() => searchParams.get('pin') || '');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [localGameState, setLocalGameState] = useState('JOIN');
  const [playerId, setPlayerId] = useState('');
  const [step, setStep] = useState(() => searchParams.get('pin') ? 2 : 1);
  const [roomData, setRoomData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [cursor, setCursor] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    if ((localGameState === 'PLAYING' || step === 2) && pin) {
      const unsub = onValue(ref(db, `compassRooms/${pin}`), (snap) => {
        const data = snap.val();
        if (data) setRoomData(data);
        else { clearSession(); alert("Phòng đã đóng!"); navigate('/'); }
      });
      return () => unsub();
    }
  }, [localGameState, step, pin, navigate]);

  useEffect(() => {
    const saved = readSession();
    if (!saved?.pin || !saved?.playerId) return;
    const urlPin = searchParams.get('pin');
    if (urlPin && urlPin !== saved.pin) { clearSession(); return; }
    get(ref(db, `compassRooms/${saved.pin}/players/${saved.playerId}`)).then(snap => {
      if (!snap.exists()) { clearSession(); return; }
      const p = snap.val();
      setPin(saved.pin); setPlayerId(saved.playerId);
      setName(p.name || ''); setClassName(p.className || '');
      setAnswers(p.answers || {});
      setCursor(Object.keys(p.answers || {}).length);
      setLocalGameState('PLAYING');
    }).catch(() => {});
  }, []);

  const me = roomData?.players?.[playerId];
  const settings = roomData?.settings || {};
  const items = itemsFor(settings.mode || 'full');
  const total = items.length;
  const finished = !!me?.finishedAt;
  const current = items[cursor];

  useEffect(() => {
    if (roomData?.status !== 'DOING' || !roomData?.startedAt) return;
    const totalSec = (settings.totalMinutes || 15) * 60;
    const tick = () => setTimeLeft(Math.max(0, totalSec - Math.floor((Date.now() - roomData.startedAt) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [roomData?.status, roomData?.startedAt, settings.totalMinutes]);

  const checkPin = async (e) => {
    e.preventDefault();
    if (!pin) return;
    const snap = await get(ref(db, `compassRooms/${pin}`));
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
    await set(ref(db, `compassRooms/${pin}/players/${id}`), {
      id, name: name.trim(), className: className.trim().toUpperCase(),
      answers: {}, answered: 0, finishedAt: null
    });
    saveSession(pin, id);
    setLocalGameState('PLAYING');
  };

  // Chọn mức độ rồi tự chuyển sang phát biểu kế tiếp
  const choose = async (value) => {
    if (busy.current || finished || !current) return;
    busy.current = true;

    const next = { ...answers, [cursor]: value };
    setAnswers(next);
    const answered = Object.keys(next).length;
    const isLast = cursor + 1 >= total;

    const payload = { [`answers/${cursor}`]: value, answered };
    if (isLast) {
      const scores = scoreGroups(next, items);
      payload.scores = scores;
      payload.code = hollandCode(scores);
      payload.finishedAt = Date.now();
    }
    await update(ref(db, `compassRooms/${pin}/players/${playerId}`), payload);

    if (!isLast) setCursor(c => c + 1);
    busy.current = false;
  };

  const back = () => { if (cursor > 0) setCursor(c => c - 1); };
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950 flex flex-col items-center justify-center p-4">

      {localGameState === 'JOIN' && step === 1 && (
        <form onSubmit={checkPin} className="w-full max-w-sm bg-slate-900/90 p-8 rounded-3xl text-center border border-sky-700/50">
          <div className="text-6xl mb-3">🧭</div>
          <h1 className="text-3xl font-black text-sky-300 mb-1">La Bàn Nghề Nghiệp</h1>
          <p className="text-gray-400 text-sm mb-6">Khám phá em hợp với nhóm nghề nào</p>
          <input type="text" placeholder="Mã phòng (PIN)" value={pin} onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-2xl font-bold bg-white text-black rounded-xl p-4 mb-4 outline-none border-4 border-transparent focus:border-sky-500" />
          <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black text-2xl py-4 rounded-xl shadow-[0_10px_0_#075985] active:translate-y-[10px] active:shadow-none transition-all">
            KẾT NỐI
          </button>
        </form>
      )}

      {localGameState === 'JOIN' && step === 2 && (
        <form onSubmit={joinRoom} className="w-full max-w-sm bg-slate-900/90 p-8 rounded-3xl text-center border border-sky-700/50">
          <h1 className="text-2xl font-black text-white mb-1">Phòng {pin}</h1>
          <p className="text-sky-300 font-bold mb-6">Ghi đúng tên để nhận hồ sơ của mình</p>
          <label className="block text-left text-gray-400 font-bold text-sm mb-1">Họ và tên</label>
          <input type="text" placeholder="Nguyễn Văn An" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full text-center text-xl font-bold bg-white text-black rounded-xl p-4 mb-4 outline-none border-4 border-transparent focus:border-sky-500" />
          <label className="block text-left text-gray-400 font-bold text-sm mb-1">Lớp</label>
          <input type="text" placeholder="11A3" value={className} onChange={(e) => setClassName(e.target.value)}
            className="w-full text-center text-xl font-bold bg-white text-black rounded-xl p-4 mb-6 outline-none border-4 border-transparent focus:border-sky-500" />
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl py-4 rounded-xl shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none transition-all">
            🧭 SẴN SÀNG
          </button>
        </form>
      )}

      {localGameState === 'PLAYING' && roomData && (
        <div className="w-full max-w-md flex flex-col items-center">

          {roomData.status === 'LOBBY' && (
            <div className="text-center">
              <div className="text-7xl mb-3">🧭</div>
              <h2 className="text-2xl font-bold text-white">Chào {me?.name || name}!</h2>
              <p className="text-sky-300 font-bold mt-1">{me?.className || className}</p>
              <div className="bg-sky-500/15 border-2 border-sky-500 rounded-2xl px-8 py-4 my-5">
                <p className="text-sky-200 text-xs uppercase tracking-widest font-bold">Bài khám phá</p>
                <p className="text-2xl font-black text-white mt-1">{total} phát biểu</p>
                <p className="text-white/70 text-sm mt-1">Không chấm điểm — cứ trả lời thật lòng nhé</p>
              </div>
              <p className="text-gray-400">Chờ thầy cô bắt đầu…</p>
              <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mt-5" />
            </div>
          )}

          {/* --- Đang trả lời --- */}
          {roomData.status === 'DOING' && !finished && current && (
            <div className="w-full flex flex-col min-h-[92vh] py-1">
              <div className="sticky top-0 z-20 -mx-1 px-1 py-1.5 bg-slate-900/95 backdrop-blur-sm flex items-center gap-2 flex-wrap rounded-b-xl">
                <div className={`px-3 py-1.5 rounded-full font-black text-sm border flex items-center gap-1.5 ${timeLeft <= 60 ? 'bg-red-500/25 border-red-500 text-red-300 animate-pulse' : 'bg-slate-800 border-slate-700 text-white'}`}>
                  <Clock className="w-4 h-4" /> {mmss(timeLeft)}
                </div>
                <div className="px-3 py-1.5 rounded-full bg-sky-500/20 border border-sky-600 text-sky-200 font-black text-sm">
                  {cursor + 1}/{total}
                </div>
                {cursor > 0 && (
                  <button onClick={back} className="ml-auto px-3 py-1.5 rounded-full bg-slate-800 border border-slate-600 text-gray-300 font-bold text-sm hover:bg-slate-700">
                    ← Câu trước
                  </button>
                )}
              </div>

              <div className="shrink-0 my-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500" style={{ width: `${(cursor / total) * 100}%` }} />
              </div>

              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 mb-4">
                <p className="text-sky-400/80 text-xs uppercase tracking-widest font-bold mb-2">Phát biểu {cursor + 1}</p>
                <p className="text-white text-lg md:text-xl font-bold leading-relaxed">{current.t}</p>
              </div>

              <p className="text-center text-gray-400 text-sm mb-2">Mức độ đúng với em:</p>

              <div className="flex flex-col gap-2.5 pb-3">
                {LIKERT.map(l => {
                  const chosen = answers[cursor] === l.v;
                  return (
                    <button key={l.v} onClick={() => choose(l.v)}
                      className={`w-full min-h-[58px] rounded-2xl border-b-[6px] active:translate-y-1 active:border-b-0 transition-all flex items-center gap-3 px-4 py-3 text-left ${chosen ? 'ring-4 ring-white/40' : ''}`}
                      style={{ backgroundColor: l.color, borderBottomColor: 'rgba(0,0,0,0.35)' }}>
                      <span className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center font-black text-white text-lg shrink-0">{l.v}</span>
                      <span className="flex-1 text-white font-black text-base">{l.label}</span>
                      {chosen && <span className="text-white text-xl">✓</span>}
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-gray-500 text-xs pb-3">Không có câu trả lời đúng hay sai — cứ chọn theo cảm nhận thật của em</p>
            </div>
          )}

          {/* --- Đã xong: xem kết quả riêng --- */}
          {(finished || roomData.status === 'END') && me?.scores && (() => {
            const top = [...GROUPS].sort((a, b) => (me.scores[b.code] || 0) - (me.scores[a.code] || 0));
            return (
              <div className="w-full flex flex-col items-center gap-4 text-center py-3">
                <div className="text-6xl">🧭</div>
                <h1 className="text-2xl font-black text-sky-200">La bàn của {me.name}</h1>

                <div className="w-full bg-sky-500/15 border-2 border-sky-500 rounded-3xl px-6 py-5">
                  <p className="text-sky-200 text-xs uppercase tracking-widest font-bold">Mã Holland của em</p>
                  <p className="text-5xl font-black text-white font-mono tracking-[0.2em] mt-1">{me.code}</p>
                  <p className="text-sky-100/90 font-bold mt-2">
                    {me.code.split('').map(c => groupOf(c).name).join(' · ')}
                  </p>
                </div>

                <div className="w-full bg-black/40 rounded-3xl border border-sky-800/50 p-3">
                  <RadarChart scores={me.scores} size={300} />
                </div>

                {/* Ba nhóm nổi trội */}
                <div className="w-full flex flex-col gap-2">
                  {top.slice(0, 3).map((g, i) => (
                    <div key={g.code} className="rounded-2xl p-3.5 text-left" style={{ backgroundColor: g.color + '20', border: `1px solid ${g.color}77` }}>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{g.emoji}</span>
                        <span className="font-black text-white">{i + 1}. {g.name}</span>
                        <span className="ml-auto font-black text-lg" style={{ color: g.color }}>{me.scores[g.code]}</span>
                      </div>
                      <p className="text-gray-300 text-sm mt-1.5 leading-snug">{g.short}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {g.strengths.map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: g.color + '30', color: g.color }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="w-full bg-emerald-500/15 border-2 border-emerald-500 rounded-2xl px-5 py-4 text-left">
                  <p className="text-emerald-300 text-xs uppercase tracking-widest font-bold mb-1">Nhóm ngành có thể hợp với em</p>
                  <p className="text-white font-bold leading-relaxed">{careersFor(me.code)}</p>
                </div>

                <p className="text-gray-400 text-sm px-2 leading-relaxed">
                  Đây là <b className="text-white">gợi ý tham khảo</b>, không phải lời phán chắc chắn.
                  Em cứ tìm hiểu thêm và trao đổi với thầy cô, bố mẹ nhé 🌱
                </p>
              </div>
            );
          })()}

          {/* Hết giờ mà chưa làm xong */}
          {roomData.status === 'END' && !me?.scores && (
            <div className="text-center">
              <div className="text-6xl mb-3">⏰</div>
              <h2 className="text-xl font-black text-white">Hết giờ rồi!</h2>
              <p className="text-gray-400 mt-2">Em mới trả lời {me?.answered || 0}/{total} phát biểu nên chưa đủ để vẽ la bàn.</p>
              <p className="text-sky-300 text-sm mt-3">Buổi sau em làm lại nhé!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompassPlayer;
