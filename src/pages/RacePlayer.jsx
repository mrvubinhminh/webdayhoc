import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { ref, set, onValue, get, update } from 'firebase/database';
import MathText from '../components/MathText';
import { useFocusGuard } from '../hooks/useFocusGuard';
import { carOf, CAR_FLIP } from '../components/RaceTrack';

const SESSION_KEY = 'racePlayerSession';
const saveSession = (pin, playerId) => { try { localStorage.setItem(SESSION_KEY, JSON.stringify({ pin, playerId })); } catch { /* bị chặn */ } };
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch { /* không sao */ } };

const shuffled = (n) => {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const RacePlayer = () => {
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
  const [feedback, setFeedback] = useState(null); // { correct } sau mỗi câu
  const [timeLeft, setTimeLeft] = useState(0);
  const [qTimeLeft, setQTimeLeft] = useState(null);
  const busy = useRef(false);

  useEffect(() => {
    if ((localGameState === 'PLAYING' || step === 2) && pin) {
      const unsub = onValue(ref(db, `raceRooms/${pin}`), (snap) => {
        const data = snap.val();
        if (data) setRoomData(data);
        else { clearSession(); alert("Phòng chơi đã kết thúc!"); navigate('/'); }
      });
      return () => unsub();
    }
  }, [localGameState, step, pin, navigate]);

  // Vào lại đúng chỗ cũ khi rớt mạng, bài làm giữ nguyên
  useEffect(() => {
    const saved = readSession();
    if (!saved?.pin || !saved?.playerId) return;
    const urlPin = searchParams.get('pin');
    if (urlPin && urlPin !== saved.pin) { clearSession(); return; }
    get(ref(db, `raceRooms/${saved.pin}/players/${saved.playerId}`)).then(snap => {
      if (!snap.exists()) { clearSession(); return; }
      const p = snap.val();
      setPin(saved.pin);
      setPlayerId(saved.playerId);
      setName(p.name || '');
      setClassName(p.className || '');
      setLocalGameState('PLAYING');
    }).catch(() => {});
  }, []);

  const me = roomData?.players?.[playerId];
  const settings = roomData?.settings || {};
  const questions = roomData?.questions || [];
  const totalQ = questions.length;

  // Thứ tự câu của riêng em này
  const order = me?.order || Array.from({ length: totalQ }, (_, i) => i);
  const cursor = me?.cursor || 0;
  const currentQ = cursor < totalQ ? questions[order[cursor]] : null;
  const submitted = !!me?.finishedAt || roomData?.status === 'END';

  // Đồng hồ chung của cả bài
  useEffect(() => {
    if (roomData?.status !== 'RACING' || !roomData?.startedAt) return;
    const totalSec = (settings.totalMinutes || 15) * 60;
    const tick = () => setTimeLeft(Math.max(0, totalSec - Math.floor((Date.now() - roomData.startedAt) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [roomData?.status, roomData?.startedAt, settings.totalMinutes]);

  // Đồng hồ riêng của câu, chỉ chạy khi câu đó có cột 9
  useEffect(() => {
    if (submitted || !currentQ?.timeLimit || roomData?.status !== 'RACING' || feedback) { setQTimeLeft(null); return; }
    setQTimeLeft(currentQ.timeLimit);
    const t = setInterval(() => {
      setQTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); answer(null); return null; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [cursor, currentQ?.timeLimit, roomData?.status, submitted, feedback]);

  const checkPin = async (e) => {
    e.preventDefault();
    if (!pin) return;
    const snap = await get(ref(db, `raceRooms/${pin}`));
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
    const n = roomData?.questions?.length || 0;
    const playerOrder = roomData?.settings?.shuffle ? shuffled(n) : Array.from({ length: n }, (_, i) => i);
    const carIndex = Object.keys(roomData?.players || {}).length;

    setPlayerId(id);
    await set(ref(db, `raceRooms/${pin}/players/${id}`), {
      id,
      name: name.trim(),
      className: className.trim().toUpperCase(),
      order: playerOrder,
      carIndex,
      cursor: 0,
      correctCount: 0,
      answeredCount: 0,
      finishedAt: null
    });
    saveSession(pin, id);
    setLocalGameState('PLAYING');
  };

  // Ghi nhận một câu rồi tự chuyển sang câu kế
  const answer = async (choice) => {
    if (busy.current || submitted || !currentQ) return;
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

    const nextCursor = cursor + 1;
    const done = nextCursor >= totalQ;
    const updates = {
      cursor: nextCursor,
      correctCount: (me?.correctCount || 0) + (isCorrect ? 1 : 0),
      answeredCount: (me?.answeredCount || 0) + 1,
      [`answers/${order[cursor]}`]: choice === null ? '' : choice
    };
    if (done) updates.finishedAt = Date.now();

    await update(ref(db, `raceRooms/${pin}/players/${playerId}`), updates);
    setTlnAnswer('');

    if (settings.instantFeedback) {
      setFeedback({ correct: isCorrect, skipped: choice === null });
      setTimeout(() => { setFeedback(null); busy.current = false; }, 900);
    } else {
      busy.current = false;
    }
  };

  const submitEarly = async () => {
    if (!window.confirm(`Nộp bài luôn? Em còn ${totalQ - cursor} câu chưa làm.`)) return;
    await update(ref(db, `raceRooms/${pin}/players/${playerId}`), { finishedAt: Date.now() });
  };

  // Ghi nhận việc rời khỏi màn hình làm bài để thầy cô nắm được
  const guardOn = roomData?.status === 'RACING' && !stopped && !!playerId;
  const focusGuard = useFocusGuard({
    enabled: guardOn,
    onEvent: (ev) => {
      if (!playerId || !pin) return;
      if (ev.type === 'return') {
        update(ref(db, `raceRooms/${pin}/players/${playerId}`), {
          awayCount: (me?.awayCount || 0) + 1,
          awayMs: (me?.awayMs || 0) + ev.ms,
          lastAwayAt: ev.at
        });
      } else if (ev.type === 'screenshot') {
        update(ref(db, `raceRooms/${pin}/players/${playerId}`), {
          shotCount: (me?.shotCount || 0) + 1
        });
      } else if (ev.type === 'blur') {
        update(ref(db, `raceRooms/${pin}/players/${playerId}`), {
          blurCount: (me?.blurCount || 0) + 1
        });
      }
    }
  });

  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const playersList = roomData?.players ? Object.values(roomData.players) : [];
  const ranked = [...playersList].sort((a, b) => {
    const d = (b.correctCount || 0) - (a.correctCount || 0);
    if (d !== 0) return d;
    return (a.finishedAt || Infinity) - (b.finishedAt || Infinity);
  });
  const myRank = ranked.findIndex(p => p.id === playerId) + 1;
  const score = totalQ > 0 ? Math.round(((me?.correctCount || 0) / totalQ) * 100) / 10 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-slate-900 to-red-950 flex flex-col items-center justify-center p-4">

      {localGameState === 'JOIN' && step === 1 && (
        <form onSubmit={checkPin} className="w-full max-w-sm bg-slate-900/90 p-8 rounded-3xl text-center border border-red-700/50">
          <div className="text-6xl mb-3">🏁</div>
          <h1 className="text-3xl font-black text-red-400 mb-6">Đường Đua Tri Thức</h1>
          <input type="text" placeholder="Mã phòng (PIN)" value={pin} onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-2xl font-bold bg-white text-black rounded-xl p-4 mb-4 outline-none border-4 border-transparent focus:border-red-500" />
          <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-2xl py-4 rounded-xl shadow-[0_10px_0_#7f1d1d] active:translate-y-[10px] active:shadow-none transition-all">
            KẾT NỐI
          </button>
        </form>
      )}

      {localGameState === 'JOIN' && step === 2 && (
        <form onSubmit={joinRoom} className="w-full max-w-sm bg-slate-900/90 p-8 rounded-3xl text-center border border-red-700/50">
          <h1 className="text-2xl font-black text-white mb-1">Phòng {pin}</h1>
          <p className="text-red-300 font-bold mb-6">Điền đúng họ tên để thầy cô vào điểm</p>

          <label className="block text-left text-gray-400 font-bold text-sm mb-1">Họ và tên</label>
          <input type="text" placeholder="Nguyễn Văn An" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full text-center text-xl font-bold bg-white text-black rounded-xl p-4 mb-4 outline-none border-4 border-transparent focus:border-red-500" />

          <label className="block text-left text-gray-400 font-bold text-sm mb-1">Lớp</label>
          <input type="text" placeholder="10A1" value={className} onChange={(e) => setClassName(e.target.value)}
            className="w-full text-center text-xl font-bold bg-white text-black rounded-xl p-4 mb-6 outline-none border-4 border-transparent focus:border-red-500" />

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl py-4 rounded-xl shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none transition-all">
            🏎️ VÀO VẠCH XUẤT PHÁT
          </button>
        </form>
      )}

      {localGameState === 'PLAYING' && roomData && (
        <div className="w-full max-w-md flex flex-col items-center">

          {roomData.status === 'LOBBY' && (
            <div className="text-center">
              <div className="text-7xl mb-3" style={CAR_FLIP}>{carOf(me?.carIndex)}</div>
              <h2 className="text-2xl font-bold text-white">Chào {me?.name || name}!</h2>
              <p className="text-red-300 font-bold mt-1">{me?.className || className}</p>
              <div className="bg-red-500/15 border-2 border-red-500 rounded-2xl px-8 py-4 my-5">
                <p className="text-red-200 text-xs uppercase tracking-widest font-bold">Đề bài</p>
                <p className="text-2xl font-black text-white mt-1">{totalQ} câu · {settings.totalMinutes || 15} phút</p>
              </div>
              <p className="text-gray-400">Chờ thầy cô cho xuất phát…</p>
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mt-5" />
            </div>
          )}

          {/* --- Đã nộp bài --- */}
          {roomData.status === 'RACING' && submitted && (
            <div className="text-center w-full">
              <div className="text-7xl mb-2">🏁</div>
              <h2 className="text-2xl font-black text-emerald-400">Em đã nộp bài!</h2>
              <div className="bg-emerald-500/15 border-2 border-emerald-500 rounded-2xl px-8 py-5 my-5">
                <p className="text-emerald-200 text-xs uppercase tracking-widest font-bold">Kết quả tạm tính</p>
                <p className="text-5xl font-black text-white mt-1">{score}</p>
                <p className="text-white/80 font-bold mt-1">{me?.correctCount || 0}/{totalQ} câu đúng</p>
                <p className="text-emerald-300 font-bold mt-2">Đang xếp hạng {myRank}/{playersList.length}</p>
              </div>
              <p className="text-gray-400 text-sm">Chờ các bạn khác về đích nhé…</p>
            </div>
          )}

          {/* --- Đang làm bài --- */}
          {roomData.status === 'RACING' && !submitted && currentQ && (
            <div className="w-full flex flex-col min-h-[92vh] py-1">
              {/* Thanh trạng thái dính trên đầu để luôn thấy đồng hồ */}
              <div className="sticky top-0 z-20 -mx-1 px-1 py-1.5 bg-slate-900/95 backdrop-blur-sm flex items-center gap-2 flex-wrap rounded-b-xl">
                <div className={`px-3 py-1.5 rounded-full font-black text-sm border flex items-center gap-1.5 ${timeLeft <= 60 ? 'bg-red-500/25 border-red-500 text-red-300 animate-pulse' : 'bg-slate-800 border-slate-700 text-white'}`}>
                  <Clock className="w-4 h-4" /> {mmss(timeLeft)}
                </div>
                <div className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-red-300 font-bold text-sm">
                  Câu {cursor + 1}/{totalQ}
                </div>
                <div className="px-3 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-700 text-emerald-300 font-bold text-sm">
                  ✅ {me?.correctCount || 0}
                </div>
                  {(me?.awayCount || 0) > 0 && (
                    <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-600 text-amber-300 font-bold text-sm" title="Số lần em rời khỏi màn hình làm bài">
                      👁 {me.awayCount}
                    </div>
                  )}
                {qTimeLeft !== null && (
                  <div className={`ml-auto px-3 py-1.5 rounded-full font-black text-sm border ${qTimeLeft <= 5 ? 'bg-red-500/25 border-red-500 text-red-300 animate-pulse' : 'bg-amber-500/20 border-amber-600 text-amber-300'}`}>
                    ⏱ {qTimeLeft}s
                  </div>
                )}
              </div>

              {/* Thanh tiến độ */}
              <div className="shrink-0 h-2 bg-slate-800 rounded-full overflow-hidden my-2">
                <div className="h-full bg-gradient-to-r from-red-500 to-amber-400 transition-all duration-500" style={{ width: `${(cursor / totalQ) * 100}%` }} />
              </div>

              {/* Câu hỏi hiện trọn vẹn, dài bao nhiêu cũng không bị cắt */}
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-left mb-3">
                <div className="text-white text-base md:text-lg font-medium whitespace-pre-wrap leading-relaxed"><MathText text={currentQ.question} /></div>
                {currentQ.image && <div className="mt-3 flex justify-center"><img src={currentQ.image} alt="minh hoạ" className="max-h-48 rounded-lg object-contain" /></div>}
              </div>

              {/* Trả lời */}
              {currentQ.type === 'TLN' ? (
                <div className="flex flex-col gap-3 pb-2">
                  <input type="text" value={tlnAnswer} onChange={(e) => setTlnAnswer(e.target.value)} placeholder="Nhập câu trả lời..."
                    className="w-full text-center bg-slate-900 border-4 border-slate-700 text-white text-3xl font-black py-6 rounded-3xl outline-none focus:border-red-500" />
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

              <button onClick={submitEarly} className="shrink-0 mt-2 text-gray-500 hover:text-red-400 text-sm font-bold py-1.5">
                Nộp bài sớm
              </button>

              {/* Báo đúng sai chớp nhoáng */}
              {feedback && (
                <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                  <div className={`px-10 py-8 rounded-3xl border-4 text-center backdrop-blur-sm ${feedback.correct ? 'bg-emerald-600/90 border-emerald-300' : 'bg-red-600/90 border-red-300'}`}>
                    <div className="text-6xl">{feedback.correct ? '✅' : feedback.skipped ? '⏱️' : '❌'}</div>
                    <p className="text-2xl font-black text-white mt-2">
                      {feedback.correct ? 'Chính xác!' : feedback.skipped ? 'Hết giờ câu này' : 'Chưa đúng'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hết câu nhưng chưa bấm nộp */}
          {roomData.status === 'RACING' && !submitted && !currentQ && (
            <div className="text-center">
              <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-2xl font-black text-white">Em đã làm hết bài!</h2>
              <p className="text-gray-400 mt-2">Đang ghi nhận kết quả…</p>
            </div>
          )}

          {/* --- Kết thúc --- */}
          {roomData.status === 'END' && (
            <div className="w-full flex flex-col items-center gap-4 text-center">
              <div className="text-7xl">{myRank === 1 ? '👑' : myRank <= 3 ? '🏆' : '🏁'}</div>
              <h1 className="text-3xl font-black text-red-300">
                {myRank === 1 ? 'VÔ ĐỊCH ĐƯỜNG ĐUA!' : `Hạng ${myRank}/${playersList.length}`}
              </h1>

              <div className="w-full bg-red-500/15 border-2 border-red-500 rounded-3xl px-8 py-5">
                <p className="text-red-200 text-xs uppercase tracking-widest font-bold">Điểm của em</p>
                <p className="text-6xl font-black text-white mt-1">{score}</p>
                <p className="text-white/80 font-bold mt-1">{me?.correctCount || 0}/{totalQ} câu đúng</p>
              </div>

              <div className="w-full flex flex-col gap-1.5 max-h-[38vh] overflow-y-auto">
                {ranked.slice(0, 10).map((p, i) => (
                  <div key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${p.id === playerId ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-slate-800/70'}`}>
                    <span className="font-black text-sm w-6 shrink-0 text-gray-400">{['🥇','🥈','🥉'][i] || i + 1}</span>
                    <span className="flex-1 min-w-0 truncate font-bold text-white text-sm">{p.name}</span>
                    <span className="text-amber-300 font-black text-sm shrink-0">
                      {totalQ > 0 ? Math.round(((p.correctCount || 0) / totalQ) * 100) / 10 : 0}đ
                    </span>
                  </div>
                ))}
              </div>
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
                <button
                  onClick={focusGuard.dismissWarning}
                  className="mt-5 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 py-4 rounded-2xl font-black text-lg"
                >
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

export default RacePlayer;
