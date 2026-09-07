import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { ref, set, onValue, get, update } from 'firebase/database';
import MathText from '../components/MathText';
import { LEVELS, levelOf, groupByLevel, passCountFor, maxScoreOf, toTen } from '../data/climbLevels';

const SESSION_KEY = 'climbPlayerSession';
const saveSession = (pin, playerId) => { try { localStorage.setItem(SESSION_KEY, JSON.stringify({ pin, playerId })); } catch { /* bị chặn */ } };
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch { /* không sao */ } };

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const ClimbPlayer = () => {
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
  const [levelResult, setLevelResult] = useState(null); // kết quả vừa xong một tầng
  const busy = useRef(false);

  useEffect(() => {
    if ((localGameState === 'PLAYING' || step === 2) && pin) {
      const unsub = onValue(ref(db, `climbRooms/${pin}`), (snap) => {
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
    get(ref(db, `climbRooms/${saved.pin}/players/${saved.playerId}`)).then(snap => {
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
  const groups = groupByLevel(questions);
  const maxScore = maxScoreOf(questions);
  const passRatio = settings.passRatio ?? 0.5;

  const curLevel = me?.currentLevel || 1;
  const queue = me?.queue || [];          // các câu còn phải làm ở tầng này
  const qIndex = queue.length ? queue[0] : null;
  const currentQ = qIndex !== null ? questions[qIndex] : null;
  const stopped = !!me?.finishedAt || roomData?.status === 'END';

  useEffect(() => {
    if (roomData?.status !== 'CLIMBING' || !roomData?.startedAt) return;
    const totalSec = (settings.totalMinutes || 20) * 60;
    const tick = () => setTimeLeft(Math.max(0, totalSec - Math.floor((Date.now() - roomData.startedAt) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [roomData?.status, roomData?.startedAt, settings.totalMinutes]);

  useEffect(() => {
    if (stopped || levelResult || !currentQ?.timeLimit || roomData?.status !== 'CLIMBING') { setQTimeLeft(null); return; }
    setQTimeLeft(currentQ.timeLimit);
    const t = setInterval(() => {
      setQTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); answer(null); return null; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [qIndex, currentQ?.timeLimit, roomData?.status, stopped, levelResult]);

  const checkPin = async (e) => {
    e.preventDefault();
    if (!pin) return;
    const snap = await get(ref(db, `climbRooms/${pin}`));
    if (!snap.exists()) { alert("Mã phòng không hợp lệ!"); return; }
    const data = snap.val();
    setRoomData(data);
    if (data.settings?.defaultClass && !className) setClassName(data.settings.defaultClass);
    setStep(2);
  };

  // Tầng thấp nhất thực sự có câu hỏi
  const firstLevelWithQuestions = (gs) => {
    for (const lv of LEVELS) if (gs[lv.id].length > 0) return lv.id;
    return 1;
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    if (!name.trim()) { alert("Vui lòng nhập họ tên!"); return; }
    if (!className.trim()) { alert("Vui lòng nhập lớp!"); return; }

    const gs = groupByLevel(roomData?.questions || []);
    const startLevel = firstLevelWithQuestions(gs);
    const id = Date.now().toString();

    setPlayerId(id);
    await set(ref(db, `climbRooms/${pin}/players/${id}`), {
      id,
      name: name.trim(),
      className: className.trim().toUpperCase(),
      currentLevel: startLevel,
      queue: shuffle(gs[startLevel]),
      reachedLevel: 0,        // tầng cao nhất đã đạt chuẩn
      earned: 0,
      correctCount: 0,
      retriesLeft: roomData?.settings?.retries ?? 1,
      perLevel: {},
      finishedAt: null
    });
    saveSession(pin, id);
    setLocalGameState('PLAYING');
  };

  // Ghi nhận một câu; hết câu của tầng thì tổng kết tầng đó
  const answer = async (choice) => {
    if (busy.current || stopped || !currentQ) return;
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

    const lv = levelOf(curLevel);
    const prevPer = me?.perLevel?.[curLevel] || { correct: 0, done: 0 };
    const per = { correct: prevPer.correct + (isCorrect ? 1 : 0), done: prevPer.done + 1 };
    const rest = queue.slice(1);

    const updates = {
      queue: rest,
      earned: (me?.earned || 0) + (isCorrect ? lv.weight : 0),
      correctCount: (me?.correctCount || 0) + (isCorrect ? 1 : 0),
      [`perLevel/${curLevel}`]: per
    };

    // Còn câu trong tầng thì đi tiếp
    if (rest.length > 0) {
      await update(ref(db, `climbRooms/${pin}/players/${playerId}`), updates);
      setTlnAnswer('');
      busy.current = false;
      return;
    }

    // Hết câu của tầng: xét có qua được không
    const need = passCountFor(groups[curLevel].length, passRatio);
    const passed = per.correct >= need;
    const nextLevelId = LEVELS.find(l => l.id > curLevel && groups[l.id].length > 0)?.id || null;

    if (passed) {
      updates.reachedLevel = Math.max(me?.reachedLevel || 0, curLevel);
      if (nextLevelId) {
        updates.currentLevel = nextLevelId;
        updates.queue = shuffle(groups[nextLevelId]);
      } else {
        updates.finishedAt = Date.now();   // đã lên tới đỉnh
      }
    } else if ((me?.retriesLeft || 0) > 0) {
      // Cho leo lại chính tầng này, làm lại từ đầu tầng
      updates.retriesLeft = (me?.retriesLeft || 0) - 1;
      updates.queue = shuffle(groups[curLevel]);
      updates[`perLevel/${curLevel}`] = { correct: 0, done: 0 };
    } else {
      updates.finishedAt = Date.now();     // dừng chân tại tầng này
    }

    await update(ref(db, `climbRooms/${pin}/players/${playerId}`), updates);
    setTlnAnswer('');
    setLevelResult({
      levelId: curLevel, correct: per.correct, total: groups[curLevel].length, need, passed,
      nextLevelId, retried: !passed && (me?.retriesLeft || 0) > 0
    });
    busy.current = false;
  };

  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const score = toTen(me?.earned || 0, maxScore);
  const reached = me?.reachedLevel || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-stone-900 flex flex-col items-center justify-center p-4">

      {localGameState === 'JOIN' && step === 1 && (
        <form onSubmit={checkPin} className="w-full max-w-sm bg-slate-900/90 p-8 rounded-3xl text-center border border-sky-700/50">
          <div className="text-6xl mb-3">⛰️</div>
          <h1 className="text-3xl font-black text-sky-200 mb-6">Leo Núi Tri Thức</h1>
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
          <p className="text-sky-300 font-bold mb-6">Điền đúng họ tên để thầy cô vào điểm</p>
          <label className="block text-left text-gray-400 font-bold text-sm mb-1">Họ và tên</label>
          <input type="text" placeholder="Nguyễn Văn An" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full text-center text-xl font-bold bg-white text-black rounded-xl p-4 mb-4 outline-none border-4 border-transparent focus:border-sky-500" />
          <label className="block text-left text-gray-400 font-bold text-sm mb-1">Lớp</label>
          <input type="text" placeholder="10A1" value={className} onChange={(e) => setClassName(e.target.value)}
            className="w-full text-center text-xl font-bold bg-white text-black rounded-xl p-4 mb-6 outline-none border-4 border-transparent focus:border-sky-500" />
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl py-4 rounded-xl shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none transition-all">
            🧗 SẴN SÀNG LEO
          </button>
        </form>
      )}

      {localGameState === 'PLAYING' && roomData && (
        <div className="w-full max-w-md flex flex-col items-center">

          {roomData.status === 'LOBBY' && (
            <div className="text-center">
              <div className="text-7xl mb-3">🧗</div>
              <h2 className="text-2xl font-bold text-white">Chào {me?.name || name}!</h2>
              <p className="text-sky-300 font-bold mt-1">{me?.className || className}</p>
              <div className="grid grid-cols-4 gap-2 my-5">
                {LEVELS.map(lv => (
                  <div key={lv.id} className="rounded-xl py-2.5" style={{ backgroundColor: lv.color + '22', border: `1px solid ${lv.color}66` }}>
                    <div className="text-xl">{lv.emoji}</div>
                    <div className="font-black text-white text-sm">{groups[lv.id].length}</div>
                    <div className="text-[10px] font-bold" style={{ color: lv.color }}>{lv.short}</div>
                  </div>
                ))}
              </div>
              <p className="text-gray-400">Chờ thầy cô cho xuất phát…</p>
              <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mt-5" />
            </div>
          )}

          {/* --- Vừa xong một tầng --- */}
          {roomData.status === 'CLIMBING' && levelResult && (() => {
            const r = levelResult;
            const lv = levelOf(r.levelId);
            return (
              <div className="w-full text-center flex flex-col gap-4">
                <div className={`rounded-3xl p-7 border-4 ${r.passed ? 'bg-emerald-900/60 border-emerald-400' : r.retried ? 'bg-amber-900/50 border-amber-400' : 'bg-slate-800/80 border-slate-500'}`}>
                  <div className="text-6xl">{r.passed ? '🎉' : r.retried ? '🔁' : '⛺'}</div>
                  <h2 className="text-2xl font-black text-white mt-2">
                    {r.passed ? `Vượt tầng ${lv.name}!` : r.retried ? 'Chưa đạt — thử lại nhé!' : `Dừng chân ở tầng ${lv.name}`}
                  </h2>
                  <p className="text-white/85 font-bold mt-2">
                    Đúng {r.correct}/{r.total} câu · cần {r.need} câu
                  </p>
                  {r.passed && r.nextLevelId && (
                    <p className="text-emerald-300 font-black mt-3 text-lg">
                      ⬆️ Lên tầng {levelOf(r.nextLevelId).name} · mỗi câu ×{levelOf(r.nextLevelId).weight} điểm
                    </p>
                  )}
                  {r.passed && !r.nextLevelId && <p className="text-yellow-300 font-black mt-3 text-lg">🏔️ Em đã chinh phục đỉnh núi!</p>}
                  {r.retried && <p className="text-amber-200 font-bold mt-3">Còn {me?.retriesLeft || 0} lần leo lại · đề sẽ đảo thứ tự</p>}
                  {!r.passed && !r.retried && <p className="text-gray-300 mt-3">Không sao cả — điểm các câu em làm đúng vẫn được tính đủ 💪</p>}
                </div>

                <button onClick={() => setLevelResult(null)}
                  className="bg-sky-600 hover:bg-sky-500 text-white py-4 rounded-2xl font-black text-lg shadow-[0_8px_0_#075985] active:translate-y-2 active:shadow-none">
                  {r.passed && r.nextLevelId ? 'LEO TIẾP →' : r.retried ? 'THỬ LẠI →' : 'XEM KẾT QUẢ'}
                </button>
              </div>
            );
          })()}

          {/* --- Đã dừng --- */}
          {roomData.status === 'CLIMBING' && !levelResult && stopped && (
            <div className="text-center w-full">
              <div className="text-7xl mb-2">{reached === 4 ? '🏔️' : reached > 0 ? '🧗' : '⛺'}</div>
              <h2 className="text-2xl font-black text-sky-200">
                {reached === 0 ? 'Em dừng ở chân núi' : `Em đạt tầng ${levelOf(reached).name}`}
              </h2>
              <div className="bg-sky-500/15 border-2 border-sky-500 rounded-2xl px-8 py-5 my-5">
                <p className="text-sky-200 text-xs uppercase tracking-widest font-bold">Điểm tạm tính</p>
                <p className="text-5xl font-black text-white mt-1">{score}</p>
                <p className="text-white/80 font-bold mt-1">{me?.correctCount || 0} câu đúng</p>
              </div>
              <p className="text-gray-400 text-sm">Chờ các bạn khác leo xong nhé…</p>
            </div>
          )}

          {/* --- Đang làm câu hỏi --- */}
          {roomData.status === 'CLIMBING' && !levelResult && !stopped && currentQ && (() => {
            const lv = levelOf(curLevel);
            const per = me?.perLevel?.[curLevel] || { correct: 0, done: 0 };
            const need = passCountFor(groups[curLevel].length, passRatio);
            return (
              <div className="w-full flex flex-col h-[94vh] py-1">
                <div className="shrink-0 flex items-center gap-2 mb-2 flex-wrap">
                  <div className={`px-3 py-1.5 rounded-full font-black text-sm border flex items-center gap-1.5 ${timeLeft <= 60 ? 'bg-red-500/25 border-red-500 text-red-300 animate-pulse' : 'bg-slate-800 border-slate-700 text-white'}`}>
                    <Clock className="w-4 h-4" /> {mmss(timeLeft)}
                  </div>
                  <div className="px-3 py-1.5 rounded-full font-black text-sm border" style={{ backgroundColor: lv.color + '25', borderColor: lv.color + '99', color: lv.color }}>
                    {lv.emoji} {lv.name} ×{lv.weight}
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-gray-300 font-bold text-sm">
                    {per.done + 1}/{groups[curLevel].length}
                  </div>
                  {qTimeLeft !== null && (
                    <div className={`ml-auto px-3 py-1.5 rounded-full font-black text-sm border ${qTimeLeft <= 5 ? 'bg-red-500/25 border-red-500 text-red-300 animate-pulse' : 'bg-amber-500/20 border-amber-600 text-amber-300'}`}>
                      ⏱ {qTimeLeft}s
                    </div>
                  )}
                </div>

                <div className="shrink-0 mb-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-500" style={{ width: `${(per.done / Math.max(1, groups[curLevel].length)) * 100}%`, backgroundColor: lv.color }} />
                  </div>
                  <span className="text-xs font-bold text-gray-400 shrink-0">đúng {per.correct}/{need} để qua tầng</span>
                </div>

                <div className="shrink-0 max-h-[34%] overflow-y-auto bg-slate-800 p-3 rounded-2xl border border-slate-700 text-left mb-2">
                  <div className="text-white text-base md:text-lg font-medium whitespace-pre-wrap"><MathText text={currentQ.question} /></div>
                  {currentQ.image && <div className="mt-2 flex justify-center"><img src={currentQ.image} alt="minh hoạ" className="max-h-28 rounded-lg object-contain" /></div>}
                </div>

                {currentQ.type === 'TLN' ? (
                  <div className="flex-1 min-h-0 flex flex-col gap-3 justify-center">
                    <input type="text" value={tlnAnswer} onChange={(e) => setTlnAnswer(e.target.value)} placeholder="Nhập câu trả lời..."
                      className="w-full text-center bg-slate-900 border-4 border-slate-700 text-white text-3xl font-black py-6 rounded-3xl outline-none focus:border-sky-500" />
                    <button onClick={() => { if (tlnAnswer.trim()) answer(tlnAnswer.trim()); }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white w-full py-5 rounded-2xl text-xl font-black shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none uppercase">
                      Câu tiếp theo →
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 grid grid-rows-4 gap-2">
                    {[
                      { num: 1, color: 'bg-red-500', shape: 'border-red-700' },
                      { num: 2, color: 'bg-blue-500', shape: 'border-blue-700' },
                      { num: 3, color: 'bg-yellow-500', shape: 'border-yellow-700' },
                      { num: 4, color: 'bg-emerald-500', shape: 'border-emerald-700' }
                    ].map(o => (
                      <button key={o.num} onClick={() => answer(o.num)}
                        className={`w-full min-h-0 rounded-2xl ${o.color} border-b-[6px] ${o.shape} active:translate-y-1 active:border-b-0 transition-transform flex items-center gap-3 px-3 py-2 text-left overflow-hidden`}>
                        <span className="text-3xl font-black text-white/80 shrink-0 w-9 text-center">{['A', 'B', 'C', 'D'][o.num - 1]}</span>
                        <span className="flex-1 text-white font-bold text-base overflow-y-auto max-h-full">
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
              <div className="text-7xl">{reached === 4 ? '🏔️' : reached >= 2 ? '🧗' : reached === 1 ? '🌱' : '⛺'}</div>
              <h1 className="text-2xl font-black text-sky-200">
                {reached === 0 ? 'Em dừng ở chân núi' : `Em đạt tầng ${levelOf(reached).name}`}
              </h1>

              <div className="w-full bg-sky-500/15 border-2 border-sky-500 rounded-3xl px-8 py-5">
                <p className="text-sky-200 text-xs uppercase tracking-widest font-bold">Điểm của em</p>
                <p className="text-6xl font-black text-white mt-1">{score}</p>
                <p className="text-white/80 font-bold mt-1">{me?.correctCount || 0} câu đúng</p>
              </div>

              {/* Chi tiết từng tầng để em tự biết mình vững tới đâu */}
              <div className="w-full flex flex-col gap-2">
                {LEVELS.filter(lv => groups[lv.id].length > 0).map(lv => {
                  const per = me?.perLevel?.[lv.id] || { correct: 0, done: 0 };
                  const need = passCountFor(groups[lv.id].length, passRatio);
                  const ok = per.correct >= need;
                  return (
                    <div key={lv.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border"
                      style={{ backgroundColor: lv.color + (ok ? '25' : '10'), borderColor: lv.color + (ok ? '99' : '44') }}>
                      <span className="text-xl shrink-0">{lv.emoji}</span>
                      <span className="flex-1 text-left font-bold text-white text-sm">{lv.name}</span>
                      <span className="font-black text-sm" style={{ color: lv.color }}>{per.correct}/{groups[lv.id].length}</span>
                      <span className="text-sm shrink-0">{ok ? '✅' : '—'}</span>
                    </div>
                  );
                })}
              </div>

              <p className="text-gray-400 text-sm mt-1">
                {reached === 4 ? 'Tuyệt vời! Em đã chinh phục cả bốn tầng 🎉'
                  : reached === 0 ? 'Đừng nản nhé, ôn lại phần cơ bản rồi buổi sau leo tiếp!'
                  : 'Buổi sau cố leo cao hơn một tầng nữa nhé! 💪'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClimbPlayer;
