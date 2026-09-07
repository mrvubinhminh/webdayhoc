import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { ref, set, onValue, get, update } from 'firebase/database';
import MathText from '../components/MathText';
import { useFocusGuard } from '../hooks/useFocusGuard';
import { buildGates, passCountFor, drawAttempt, splitSecret, scoreOf, DEFAULT_SECRET } from '../data/vaultRules';

const SESSION_KEY = 'vaultPlayerSession';
const saveSession = (pin, playerId) => { try { localStorage.setItem(SESSION_KEY, JSON.stringify({ pin, playerId })); } catch { /* bị chặn */ } };
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch { /* không sao */ } };

const VaultPlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pin, setPin] = useState(() => searchParams.get('pin') || '');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [localGameState, setLocalGameState] = useState('JOIN');
  const [playerId, setPlayerId] = useState('');
  const [step, setStep] = useState(() => searchParams.get('pin') ? 2 : 1);
  const [roomData, setRoomData] = useState(null);
  const [tlnAnswer, setTlnAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [qTimeLeft, setQTimeLeft] = useState(null);
  const [gateResult, setGateResult] = useState(null);
  const busy = useRef(false);

  useEffect(() => {
    if ((localGameState === 'PLAYING' || step === 2) && pin) {
      const unsub = onValue(ref(db, `vaultRooms/${pin}`), (snap) => {
        const data = snap.val();
        if (data) setRoomData(data);
        else { clearSession(); alert("Phòng chơi đã kết thúc!"); navigate('/'); }
      });
      return () => unsub();
    }
  }, [localGameState, step, pin, navigate]);

  useEffect(() => {
    const saved = readSession();
    if (!saved?.pin || !saved?.playerId) return;
    const urlPin = searchParams.get('pin');
    if (urlPin && urlPin !== saved.pin) { clearSession(); return; }
    get(ref(db, `vaultRooms/${saved.pin}/players/${saved.playerId}`)).then(snap => {
      if (!snap.exists()) { clearSession(); return; }
      const p = snap.val();
      setPin(saved.pin); setPlayerId(saved.playerId);
      setName(p.name || ''); setClassName(p.className || '');
      setLocalGameState('PLAYING');
    }).catch(() => {});
  }, []);

  const me = roomData?.players?.[playerId];
  const settings = roomData?.settings || {};
  const questions = roomData?.questions || [];
  const gates = buildGates(questions);
  const perAttempt = settings.perAttempt || 4;
  const need = passCountFor(perAttempt, settings.passRatio ?? 0.75);
  const secretParts = splitSecret(settings.secret || DEFAULT_SECRET, gates.length);

  const gateIdx = me?.currentGate ?? 0;
  const gate = gates[gateIdx];
  const queue = me?.queue || [];
  const qId = queue.length ? queue[0] : null;
  const currentQ = qId !== null ? questions[qId] : null;
  const clearedCount = Object.values(me?.gates || {}).filter(g => g.passed).length;
  const allDone = clearedCount >= gates.length && gates.length > 0;
  const stopped = allDone || roomData?.status === 'END';

  useEffect(() => {
    if (roomData?.status !== 'PLAYING' || !roomData?.startedAt) return;
    const totalSec = (settings.totalMinutes || 25) * 60;
    const tick = () => setTimeLeft(Math.max(0, totalSec - Math.floor((Date.now() - roomData.startedAt) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [roomData?.status, roomData?.startedAt, settings.totalMinutes]);

  useEffect(() => {
    if (stopped || gateResult || !currentQ?.timeLimit || roomData?.status !== 'PLAYING') { setQTimeLeft(null); return; }
    setQTimeLeft(currentQ.timeLimit);
    const t = setInterval(() => {
      setQTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); answer(null); return null; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [qId, currentQ?.timeLimit, roomData?.status, stopped, gateResult]);

  // Ghi nhận việc rời khỏi màn hình làm bài
  const focusGuard = useFocusGuard({
    enabled: roomData?.status === 'PLAYING' && !stopped && !!playerId,
    onEvent: (ev) => {
      if (!playerId || !pin) return;
      const base = `vaultRooms/${pin}/players/${playerId}`;
      if (ev.type === 'return') {
        update(ref(db, base), {
          awayCount: (me?.awayCount || 0) + 1,
          awayMs: (me?.awayMs || 0) + ev.ms,
          lastAwayAt: ev.at
        });
      } else if (ev.type === 'screenshot') {
        update(ref(db, base), { shotCount: (me?.shotCount || 0) + 1 });
      } else if (ev.type === 'blur') {
        update(ref(db, base), { blurCount: (me?.blurCount || 0) + 1 });
      }
    }
  });

  const checkPin = async (e) => {
    e.preventDefault();
    if (!pin) return;
    const snap = await get(ref(db, `vaultRooms/${pin}`));
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

    const gs = buildGates(roomData?.questions || []);
    const first = gs[0];
    const per = roomData?.settings?.perAttempt || 4;
    const id = Date.now().toString();

    setPlayerId(id);
    await set(ref(db, `vaultRooms/${pin}/players/${id}`), {
      id,
      name: name.trim(),
      className: className.trim().toUpperCase(),
      currentGate: 0,
      queue: first ? drawAttempt(first.questionIds, [], per) : [],
      seen: {},
      attemptCorrect: 0,
      gates: {},
      finishedAt: null
    });
    saveSession(pin, id);
    setLocalGameState('PLAYING');
  };

  // Trả lời một câu; hết lượt thì xét mở khoá hay phải làm lại
  const answer = async (choice) => {
    if (busy.current || stopped || !currentQ || !gate) return;
    busy.current = true;

    let isCorrect = false;
    if (choice !== null) {
      if (currentQ.type === 'TLN') {
        const a = choice.toString().trim().toLowerCase().replace(/,/g, '.');
        const b = currentQ.correctOption.toString().trim().toLowerCase().replace(/,/g, '.');
        isCorrect = a === b;
      } else {
        isCorrect = choice === currentQ.correctOption;
      }
    }

    const rest = queue.slice(1);
    const correctSoFar = (me?.attemptCorrect || 0) + (isCorrect ? 1 : 0);
    const base = `vaultRooms/${pin}/players/${playerId}`;
    const seenList = Object.values(me?.seen?.[gateIdx] || {});

    // Còn câu trong lượt thì đi tiếp
    if (rest.length > 0) {
      await update(ref(db, base), {
        queue: rest,
        attemptCorrect: correctSoFar,
        [`seen/${gateIdx}/${qId}`]: qId
      });
      setTlnAnswer('');
      busy.current = false;
      return;
    }

    // Hết lượt: xét mở khoá
    const attempts = (me?.gates?.[gateIdx]?.attempts || 0) + 1;
    const passed = correctSoFar >= need;
    const nextGate = gates[gateIdx + 1];

    const updates = {
      [`seen/${gateIdx}/${qId}`]: qId,
      [`gates/${gateIdx}`]: { passed, attempts, correct: correctSoFar, of: queue.length + 0 || perAttempt },
      attemptCorrect: 0
    };

    if (passed && nextGate) {
      updates.currentGate = gateIdx + 1;
      updates.queue = drawAttempt(nextGate.questionIds, [], perAttempt);
    } else if (passed) {
      updates.queue = [];
      updates.finishedAt = Date.now();     // đã mở hết ải
    } else {
      // Làm lại chính ải này bằng đề khác
      updates.queue = drawAttempt(gate.questionIds, [...seenList, qId], perAttempt);
    }

    await update(ref(db, base), updates);
    setTlnAnswer('');
    setGateResult({
      gateName: gate.name, correct: correctSoFar, of: perAttempt, need, passed, attempts,
      nextName: nextGate?.name || null,
      secretPart: passed ? (secretParts[gateIdx] || '') : null,
      allDone: passed && !nextGate
    });
    busy.current = false;
  };

  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const score = scoreOf(me?.gates || {}, gates.length || 1);
  const myParts = gates.map((g, i) => (me?.gates?.[i]?.passed ? secretParts[i] : null));

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-slate-900 to-amber-950 flex flex-col items-center justify-center p-4">

      {localGameState === 'JOIN' && step === 1 && (
        <form onSubmit={checkPin} className="w-full max-w-sm bg-slate-900/90 p-8 rounded-3xl text-center border border-amber-700/50">
          <div className="text-6xl mb-3">🗝️</div>
          <h1 className="text-3xl font-black text-amber-300 mb-6">Vượt Ải Mật Mã</h1>
          <input type="text" placeholder="Mã phòng (PIN)" value={pin} onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-2xl font-bold bg-white text-black rounded-xl p-4 mb-4 outline-none border-4 border-transparent focus:border-amber-500" />
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-2xl py-4 rounded-xl shadow-[0_10px_0_#92400e] active:translate-y-[10px] active:shadow-none transition-all">
            KẾT NỐI
          </button>
        </form>
      )}

      {localGameState === 'JOIN' && step === 2 && (
        <form onSubmit={joinRoom} className="w-full max-w-sm bg-slate-900/90 p-8 rounded-3xl text-center border border-amber-700/50">
          <h1 className="text-2xl font-black text-white mb-1">Phòng {pin}</h1>
          <p className="text-amber-300 font-bold mb-6">Điền đúng họ tên để thầy cô vào điểm</p>
          <label className="block text-left text-gray-400 font-bold text-sm mb-1">Họ và tên</label>
          <input type="text" placeholder="Nguyễn Văn An" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full text-center text-xl font-bold bg-white text-black rounded-xl p-4 mb-4 outline-none border-4 border-transparent focus:border-amber-500" />
          <label className="block text-left text-gray-400 font-bold text-sm mb-1">Lớp</label>
          <input type="text" placeholder="10A1" value={className} onChange={(e) => setClassName(e.target.value)}
            className="w-full text-center text-xl font-bold bg-white text-black rounded-xl p-4 mb-6 outline-none border-4 border-transparent focus:border-amber-500" />
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl py-4 rounded-xl shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none transition-all">
            🗝️ TỚI CỔNG ẢI
          </button>
        </form>
      )}

      {localGameState === 'PLAYING' && roomData && (
        <div className="w-full max-w-md flex flex-col items-center">

          {roomData.status === 'LOBBY' && (
            <div className="text-center">
              <div className="text-7xl mb-3">🗝️</div>
              <h2 className="text-2xl font-bold text-white">Chào {me?.name || name}!</h2>
              <p className="text-amber-300 font-bold mt-1">{me?.className || className}</p>
              <div className="bg-amber-500/15 border-2 border-amber-500 rounded-2xl px-8 py-4 my-5">
                <p className="text-amber-200 text-xs uppercase tracking-widest font-bold">Trước mặt em</p>
                <p className="text-2xl font-black text-white mt-1">{gates.length} ải khoá</p>
                <p className="text-white/70 text-sm mt-1">Mỗi lượt {perAttempt} câu · cần đúng {need}</p>
              </div>
              <p className="text-gray-400">Chờ thầy cô mở cổng ải đầu tiên…</p>
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mt-5" />
            </div>
          )}

          {/* --- Vừa xong một lượt --- */}
          {roomData.status === 'PLAYING' && gateResult && (() => {
            const r = gateResult;
            return (
              <div className="w-full text-center flex flex-col gap-4">
                <div className={`rounded-3xl p-7 border-4 ${r.passed ? 'bg-emerald-900/60 border-emerald-400' : 'bg-amber-900/50 border-amber-400'}`}>
                  <div className="text-6xl">{r.passed ? '🔓' : '🔁'}</div>
                  <h2 className="text-2xl font-black text-white mt-2">
                    {r.passed ? `Mở được ${r.gateName}!` : 'Chưa đủ — luyện lại nào!'}
                  </h2>
                  <p className="text-white/85 font-bold mt-2">Đúng {r.correct}/{r.of} câu · cần {r.need}</p>

                  {r.passed && r.secretPart && (
                    <div className="mt-4 bg-yellow-400/20 border-2 border-yellow-500 rounded-2xl px-5 py-3">
                      <p className="text-yellow-300 text-xs uppercase tracking-widest font-bold">Mảnh mật mã nhận được</p>
                      <p className="text-2xl font-black text-yellow-100 mt-1 tracking-wider">{r.secretPart}</p>
                    </div>
                  )}

                  {r.passed && r.nextName && <p className="text-emerald-300 font-black mt-3">➡️ Ải tiếp theo: {r.nextName}</p>}
                  {r.allDone && <p className="text-yellow-300 font-black mt-3 text-lg">🎉 Em đã mở hết tất cả ải!</p>}
                  {!r.passed && (
                    <p className="text-amber-200 font-bold mt-3">
                      Lượt {r.attempts} xong. Lượt sau sẽ là <b className="text-white">đề khác cùng dạng</b> — cứ bình tĩnh nhé!
                    </p>
                  )}
                </div>

                {/* Mật mã đã ghép được tới đâu */}
                <div className="bg-black/40 border border-yellow-700/50 rounded-2xl px-4 py-3">
                  <p className="text-yellow-400/80 text-xs uppercase tracking-widest font-bold mb-1.5">Mật mã của em</p>
                  <p className="text-lg font-black tracking-wider">
                    {myParts.map((part, i) => (
                      <span key={i} className={part ? 'text-yellow-200' : 'text-white/25'}>{part || '•••'} </span>
                    ))}
                  </p>
                </div>

                <button onClick={() => setGateResult(null)}
                  className="bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-2xl font-black text-lg shadow-[0_8px_0_#92400e] active:translate-y-2 active:shadow-none">
                  {r.allDone ? 'XEM KẾT QUẢ' : r.passed ? 'VÀO ẢI TIẾP →' : 'THỬ LẠI →'}
                </button>
              </div>
            );
          })()}

          {/* --- Đã mở hết ải --- */}
          {roomData.status === 'PLAYING' && !gateResult && allDone && (
            <div className="text-center w-full">
              <div className="text-7xl mb-2">🎉</div>
              <h2 className="text-2xl font-black text-yellow-300">Em đã mở hết {gates.length} ải!</h2>
              <div className="bg-yellow-400/15 border-2 border-yellow-500 rounded-2xl px-6 py-5 my-5">
                <p className="text-yellow-300 text-xs uppercase tracking-widest font-bold">Thông điệp bí mật</p>
                <p className="text-2xl font-black text-white mt-2 tracking-wider">{settings.secret || DEFAULT_SECRET}</p>
              </div>
              <div className="bg-emerald-500/15 border-2 border-emerald-500 rounded-2xl px-8 py-4">
                <p className="text-emerald-200 text-xs uppercase tracking-widest font-bold">Điểm tạm tính</p>
                <p className="text-5xl font-black text-white mt-1">{score}</p>
              </div>
              <p className="text-gray-400 text-sm mt-4">Chờ các bạn khác mở khoá nhé…</p>
            </div>
          )}

          {/* --- Đang làm bài --- */}
          {roomData.status === 'PLAYING' && !gateResult && !allDone && currentQ && gate && (() => {
            const attempts = (me?.gates?.[gateIdx]?.attempts || 0) + 1;
            const doneInAttempt = perAttempt - queue.length;
            return (
              <div className="w-full flex flex-col min-h-[92vh] py-1">
                <div className="sticky top-0 z-20 -mx-1 px-1 py-1.5 bg-slate-900/95 backdrop-blur-sm flex items-center gap-2 flex-wrap rounded-b-xl">
                  <div className={`px-3 py-1.5 rounded-full font-black text-sm border flex items-center gap-1.5 ${timeLeft <= 60 ? 'bg-red-500/25 border-red-500 text-red-300 animate-pulse' : 'bg-slate-800 border-slate-700 text-white'}`}>
                    <Clock className="w-4 h-4" /> {mmss(timeLeft)}
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-600 text-amber-200 font-black text-sm">
                    🔒 {gate.name}
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-gray-300 font-bold text-sm">
                    {doneInAttempt + 1}/{perAttempt}
                  </div>
                  {attempts > 1 && (
                    <div className="px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-600 text-orange-300 font-bold text-sm">
                      lượt {attempts}
                    </div>
                  )}
                  {(me?.awayCount || 0) > 0 && (
                    <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-600 text-amber-300 font-bold text-sm" title="Số lần em rời khỏi màn hình">
                      👁 {me.awayCount}
                    </div>
                  )}
                  {qTimeLeft !== null && (
                    <div className={`ml-auto px-3 py-1.5 rounded-full font-black text-sm border ${qTimeLeft <= 5 ? 'bg-red-500/25 border-red-500 text-red-300 animate-pulse' : 'bg-amber-500/20 border-amber-600 text-amber-300'}`}>
                      ⏱ {qTimeLeft}s
                    </div>
                  )}
                </div>

                <div className="shrink-0 my-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500" style={{ width: `${(doneInAttempt / perAttempt) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-400 shrink-0">đúng {me?.attemptCorrect || 0}/{need} để mở khoá</span>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-left mb-3">
                  <div className="text-white text-base md:text-lg font-medium whitespace-pre-wrap leading-relaxed"><MathText text={currentQ.question} /></div>
                  {currentQ.image && <div className="mt-3 flex justify-center"><img src={currentQ.image} alt="minh hoạ" className="max-h-48 rounded-lg object-contain" /></div>}
                </div>

                {currentQ.type === 'TLN' ? (
                  <div className="flex flex-col gap-3 pb-2">
                    <input type="text" value={tlnAnswer} onChange={(e) => setTlnAnswer(e.target.value)} placeholder="Nhập câu trả lời..."
                      className="w-full text-center bg-slate-900 border-4 border-slate-700 text-white text-3xl font-black py-6 rounded-3xl outline-none focus:border-amber-500" />
                    <button onClick={() => { if (tlnAnswer.trim()) answer(tlnAnswer.trim()); }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white w-full py-5 rounded-2xl text-xl font-black shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none uppercase">
                      Câu tiếp theo →
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 pb-2">
                    {[
                      { num: 1, color: 'bg-red-500', shape: 'border-red-700' },
                      { num: 2, color: 'bg-blue-500', shape: 'border-blue-700' },
                      { num: 3, color: 'bg-yellow-500', shape: 'border-yellow-700' },
                      { num: 4, color: 'bg-emerald-500', shape: 'border-emerald-700' }
                    ].map(o => (
                      <button key={o.num} onClick={() => answer(o.num)}
                        className={`w-full min-h-[68px] rounded-2xl ${o.color} border-b-[6px] ${o.shape} active:translate-y-1 active:border-b-0 transition-transform flex items-start gap-3 px-3 py-3 text-left`}>
                        <span className="text-3xl font-black text-white/80 shrink-0 w-9 text-center leading-tight">{['A', 'B', 'C', 'D'][o.num - 1]}</span>
                        <span className="flex-1 text-white font-bold text-base leading-relaxed pt-1 break-words">
                          <MathText text={[currentQ.optionA, currentQ.optionB, currentQ.optionC, currentQ.optionD][o.num - 1] || ''} />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* --- Kết thúc --- */}
          {roomData.status === 'END' && (
            <div className="w-full flex flex-col items-center gap-4 text-center">
              <div className="text-7xl">{allDone ? '🎉' : clearedCount > 0 ? '🗝️' : '🔒'}</div>
              <h1 className="text-2xl font-black text-amber-300">
                {allDone ? 'Mở hết tất cả ải!' : `Em mở được ${clearedCount}/${gates.length} ải`}
              </h1>

              <div className="w-full bg-amber-500/15 border-2 border-amber-500 rounded-3xl px-8 py-5">
                <p className="text-amber-200 text-xs uppercase tracking-widest font-bold">Điểm của em</p>
                <p className="text-6xl font-black text-white mt-1">{score}</p>
              </div>

              <div className="w-full bg-black/40 border border-yellow-700/50 rounded-2xl px-4 py-3">
                <p className="text-yellow-400/80 text-xs uppercase tracking-widest font-bold mb-1.5">Mật mã em ghép được</p>
                <p className="text-lg font-black tracking-wider">
                  {myParts.map((part, i) => (
                    <span key={i} className={part ? 'text-yellow-200' : 'text-white/25'}>{part || '•••'} </span>
                  ))}
                </p>
              </div>

              <div className="w-full flex flex-col gap-1.5 max-h-[32vh] overflow-y-auto">
                {gates.map((g, i) => {
                  const r = me?.gates?.[i];
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${r?.passed ? 'bg-emerald-900/40 border-emerald-600' : 'bg-slate-800/70 border-slate-600'}`}>
                      <span className="text-lg shrink-0">{r?.passed ? '🔓' : '🔒'}</span>
                      <span className="flex-1 text-left font-bold text-white text-sm truncate">{g.name}</span>
                      <span className={`font-black text-sm shrink-0 ${r?.passed ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {!r ? 'chưa tới' : r.passed ? `${r.attempts} lượt` : `${r.attempts} lượt · chưa qua`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-gray-400 text-sm">
                {allDone ? 'Giỏi lắm! Em đã thật sự vững tất cả các dạng 🎉' : 'Những dạng chưa qua chính là chỗ em nên luyện thêm 💪'}
              </p>
            </div>
          )}

          {/* Nhắc nhở khi học sinh vừa quay lại sau khi rời màn hình */}
          {focusGuard.justReturned && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
              <div className="w-full max-w-sm bg-slate-900 border-4 border-amber-500 rounded-3xl p-7 text-center">
                <div className="text-6xl mb-2">⚠️</div>
                <h2 className="text-2xl font-black text-amber-300">Em vừa rời màn hình</h2>
                <p className="text-white/85 mt-2 font-bold">
                  Rời {focusGuard.justReturned.seconds} giây · lần thứ {me?.awayCount || focusGuard.awayCount}
                </p>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  Thầy cô nhìn thấy được số lần rời màn hình trong bài làm của em.
                  Hãy ở lại trang này cho tới khi làm xong nhé!
                </p>
                <button onClick={focusGuard.dismissWarning}
                  className="mt-5 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 py-4 rounded-2xl font-black text-lg">
                  ĐÃ HIỂU, LÀM TIẾP
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VaultPlayer;
