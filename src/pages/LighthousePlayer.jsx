import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { ref, set, onValue, get } from 'firebase/database';
import MathText from '../components/MathText';
import Lighthouse from '../components/Lighthouse';
import { MAX_FUEL, isStormQuestion, DIFFICULTIES } from '../data/lighthouseRules';

const SESSION_KEY = 'lighthousePlayerSession';
const saveSession = (pin, playerId) => { try { localStorage.setItem(SESSION_KEY, JSON.stringify({ pin, playerId })); } catch { /* bị chặn */ } };
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch { /* không sao */ } };

const LighthousePlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pin, setPin] = useState(() => searchParams.get('pin') || '');
  const [name, setName] = useState('');
  const [localGameState, setLocalGameState] = useState('JOIN');
  const [playerId, setPlayerId] = useState('');
  const [tlnAnswer, setTlnAnswer] = useState('');
  const [step, setStep] = useState(() => searchParams.get('pin') ? 2 : 1);
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    if ((localGameState === 'PLAYING' || step === 2) && pin) {
      const roomRef = ref(db, `lighthouseRooms/${pin}`);
      const unsub = onValue(roomRef, (snap) => {
        const data = snap.val();
        if (data) setRoomData(data);
        else {
          clearSession();
          alert("Phòng chơi đã kết thúc!");
          navigate('/');
        }
      });
      return () => unsub();
    }
  }, [localGameState, step, pin, navigate]);

  // Rớt mạng hay lỡ tắt trình duyệt: vào lại đúng chỗ cũ
  useEffect(() => {
    const saved = readSession();
    if (!saved?.pin || !saved?.playerId) return;
    const urlPin = searchParams.get('pin');
    if (urlPin && urlPin !== saved.pin) { clearSession(); return; }

    get(ref(db, `lighthouseRooms/${saved.pin}/players/${saved.playerId}`)).then(snap => {
      if (!snap.exists()) { clearSession(); return; }
      setPin(saved.pin);
      setPlayerId(saved.playerId);
      setName(snap.val().name || '');
      setLocalGameState('PLAYING');
    }).catch(() => {});
  }, []);

  const checkPin = async (e) => {
    e.preventDefault();
    if (!pin) return;
    const snap = await get(ref(db, `lighthouseRooms/${pin}`));
    if (!snap.exists()) { alert("Mã phòng không hợp lệ!"); return; }
    setStep(2);
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    if (!name.trim()) { alert("Vui lòng nhập tên!"); return; }
    const id = Date.now().toString();
    setPlayerId(id);
    await set(ref(db, `lighthouseRooms/${pin}/players/${id}`), {
      id, name: name.trim(), currentAnswer: null, correctCount: 0
    });
    saveSession(pin, id);
    setLocalGameState('PLAYING');
  };

  const submitAnswer = async (option) => {
    if (me?.currentAnswer) return;
    await set(ref(db, `lighthouseRooms/${pin}/players/${playerId}/currentAnswer`), option);
  };

  const me = roomData?.players?.[playerId];
  const playersList = roomData?.players ? Object.values(roomData.players) : [];
  const fuel = roomData?.fuel ?? MAX_FUEL;
  const totalQ = roomData?.questions?.length || 0;
  const nextIsStorm = isStormQuestion(roomData?.currentQuestionIndex ?? -1, totalQ);
  const diff = DIFFICULTIES.find(d => d.id === roomData?.settings?.difficulty) || DIFFICULTIES[1];

  const FuelBar = () => (
    <div className="w-full">
      <div className="flex justify-between text-xs font-bold mb-1">
        <span className="text-gray-300">🏮 Dầu của cả lớp</span>
        <span className={fuel > 50 ? 'text-emerald-400' : fuel > 20 ? 'text-amber-400' : 'text-red-400'}>{fuel}%</span>
      </div>
      <div className="h-3.5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
        <div
          className={`h-full transition-all duration-700 ${fuel > 50 ? 'bg-gradient-to-r from-emerald-500 to-lime-400' : fuel > 20 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-red-600 to-orange-500'}`}
          style={{ width: `${fuel}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-sky-950 flex flex-col items-center justify-center p-4">

      {localGameState === 'JOIN' && step === 1 && (
        <form onSubmit={checkPin} className="w-full max-w-sm bg-slate-900/90 p-8 rounded-3xl text-center border border-sky-700/50">
          <div className="max-w-[130px] mx-auto mb-2"><Lighthouse fuel={100} compact /></div>
          <h1 className="text-3xl font-black text-sky-300 mb-1">Ngọn Hải Đăng</h1>
          <p className="text-gray-400 text-sm mb-6">Cả lớp là một đội</p>
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
          <p className="text-sky-300 font-bold mb-6">Lên tàu làm thuỷ thủ giữ lửa nào!</p>
          <input type="text" placeholder="Tên của bạn" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full text-center text-xl font-bold bg-white text-black rounded-xl p-4 mb-6 outline-none border-4 border-transparent focus:border-sky-500" />
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl py-4 rounded-xl shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none transition-all">
            ⚓ LÊN TÀU
          </button>
        </form>
      )}

      {localGameState === 'PLAYING' && roomData && (
        <div className="w-full max-w-md flex flex-col items-center">

          {roomData.status === 'LOBBY' && (
            <div className="text-center w-full">
              <div className="max-w-[200px] mx-auto"><Lighthouse fuel={MAX_FUEL} compact /></div>
              <h2 className="text-2xl font-bold text-white mt-3">Chào thuỷ thủ {me?.name || name}!</h2>
              <p className="text-sky-300 mt-2">Cả lớp đang có <b>{playersList.length}</b> người cùng giữ lửa</p>
              <p className="text-gray-400 mt-4 text-sm">Đợi thầy cô cho tàu ra khơi…</p>
              <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mt-5" />
            </div>
          )}

          {/* --- Trả lời --- */}
          {roomData.status === 'QUESTION' && (() => {
            const q = roomData.questions?.[roomData.currentQuestionIndex];
            if (!q) return null;
            const showQuestion = roomData.settings?.showQuestionOnDevice;

            const OPTS = [
              { num: 1, color: 'bg-red-500', shape: 'border-red-700' },
              { num: 2, color: 'bg-blue-500', shape: 'border-blue-700' },
              { num: 3, color: 'bg-yellow-500', shape: 'border-yellow-700' },
              { num: 4, color: 'bg-emerald-500', shape: 'border-emerald-700' }
            ];

            if (me?.currentAnswer) {
              return (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="bg-slate-800/90 p-7 rounded-3xl border border-slate-700 text-center w-full">
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-white">Đã gửi đáp án!</h2>
                    <p className="text-sky-300 text-sm mt-1">Mỗi câu đúng là một giọt dầu cho cả lớp 🕯️</p>
                  </div>
                  <div className="w-full bg-black/40 rounded-2xl p-4 border border-sky-800/50"><FuelBar /></div>
                </div>
              );
            }

            return (
              <div className="w-full flex flex-col h-[92vh] py-2">
                <div className="shrink-0 mb-2 flex items-center justify-center gap-2 flex-wrap">
                  <div className="bg-slate-800 px-4 py-1.5 rounded-full text-base font-bold text-sky-300 border border-slate-700">
                    Câu {roomData.currentQuestionIndex + 1}
                  </div>
                  {nextIsStorm && (
                    <div className="bg-indigo-500/30 border border-indigo-400 rounded-full px-4 py-1.5 text-indigo-200 font-black text-sm animate-pulse">
                      🌪️ BÃO LỚN — cần {Math.round(diff.storm * 100)}% lớp đúng
                    </div>
                  )}
                  {roomData.paused && (
                    <div className="bg-amber-500/25 border border-amber-500 rounded-full px-3 py-1.5 text-amber-300 font-bold text-sm animate-pulse">⏸ Tạm dừng</div>
                  )}
                </div>

                <div className="shrink-0 mb-2 bg-black/40 rounded-xl p-2.5 border border-sky-800/50"><FuelBar /></div>

                {showQuestion ? (
                  <div className="flex-1 min-h-0 flex flex-col gap-2">
                    <div className="shrink-0 max-h-[36%] overflow-y-auto bg-slate-800 p-3 rounded-2xl border border-slate-700 text-left">
                      <div className="text-white text-base md:text-lg font-medium whitespace-pre-wrap"><MathText text={q.question} /></div>
                      {q.image && <div className="mt-2 flex justify-center"><img src={q.image} alt="minh hoạ" className="max-h-28 rounded-lg object-contain" /></div>}
                    </div>

                    {q.type === 'TLN' ? (
                      <div className="flex-1 min-h-0 flex flex-col gap-3 justify-center">
                        <input type="text" value={tlnAnswer} onChange={(e) => setTlnAnswer(e.target.value)} placeholder="Nhập câu trả lời..."
                          className="w-full text-center bg-slate-900 border-4 border-slate-700 text-white text-3xl font-black py-6 rounded-3xl outline-none focus:border-sky-500" />
                        <button onClick={() => { if (tlnAnswer.trim()) { submitAnswer(tlnAnswer.trim()); setTlnAnswer(''); } }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white w-full py-5 rounded-2xl text-xl font-black shadow-[0_8px_0_rgba(4,120,87,1)] active:translate-y-2 active:shadow-none uppercase">
                          Gửi Đáp Án
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 grid grid-rows-4 gap-2">
                        {OPTS.map(o => (
                          <button key={o.num} onClick={() => submitAnswer(o.num)}
                            className={`w-full min-h-0 rounded-2xl ${o.color} border-b-[6px] ${o.shape} active:translate-y-1 active:border-b-0 transition-transform flex items-center gap-3 px-3 py-2 text-left overflow-hidden`}>
                            <span className="text-3xl font-black text-white/80 shrink-0 w-9 text-center">{['A', 'B', 'C', 'D'][o.num - 1]}</span>
                            <span className="flex-1 text-white font-bold text-base overflow-y-auto max-h-full">
                              <MathText text={[q.optionA, q.optionB, q.optionC, q.optionD][o.num - 1] || ''} />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 flex flex-col justify-center">
                    {q.type === 'TLN' ? (
                      <div className="w-full flex flex-col gap-6">
                        <input type="text" value={tlnAnswer} onChange={(e) => setTlnAnswer(e.target.value)} placeholder="Nhập câu trả lời..."
                          className="w-full text-center bg-slate-900 border-4 border-slate-700 text-white text-3xl md:text-5xl font-black py-8 rounded-3xl outline-none focus:border-sky-500" />
                        <button onClick={() => { if (tlnAnswer.trim()) { submitAnswer(tlnAnswer.trim()); setTlnAnswer(''); } }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white w-full py-6 rounded-2xl text-2xl font-black shadow-[0_8px_0_rgba(4,120,87,1)] active:translate-y-2 active:shadow-none uppercase">
                          Gửi Đáp Án
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 w-full h-[58vh]">
                        {OPTS.map(o => (
                          <button key={o.num} onClick={() => submitAnswer(o.num)}
                            className={`w-full h-full rounded-2xl ${o.color} border-b-8 ${o.shape} active:translate-y-2 active:border-b-0 transition-transform flex items-center justify-center group`}>
                            <span className="text-6xl font-black text-white/50 group-hover:text-white">{['A', 'B', 'C', 'D'][o.num - 1]}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* --- Kết quả: nhấn mạnh cả lớp, cá nhân chỉ nhắc nhẹ --- */}
          {roomData.status === 'REVEAL' && (() => {
            const pct = Math.round((roomData.lastRatio || 0) * 100);
            const delta = roomData.lastDelta || 0;
            return (
              <div className="w-full flex flex-col items-center gap-3 text-center">
                <div className="max-w-[190px]"><Lighthouse fuel={fuel} stormMode={fuel < 30} compact /></div>

                <div className={`w-full rounded-3xl p-5 border-4 ${delta >= 0 ? 'bg-emerald-900/60 border-emerald-400' : 'bg-orange-900/50 border-orange-400'}`}>
                  <p className="uppercase tracking-widest font-bold text-xs text-white/80">Cả lớp trả lời đúng</p>
                  <div className="text-5xl font-black text-white mt-1">{pct}%</div>
                  <div className={`text-2xl font-black mt-2 ${delta >= 0 ? 'text-lime-300' : 'text-orange-300'}`}>
                    {delta >= 0 ? `🔥 Tiếp dầu +${delta}%` : `💨 Gió thổi ${delta}%`}
                  </div>
                  {roomData.lastStorm && (
                    <div className={`mt-2 inline-block px-4 py-1.5 rounded-full font-black text-sm ${roomData.lastStormPassed ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'}`}>
                      {roomData.lastStormPassed ? '🌟 VƯỢT BÃO!' : '🌪️ Bão quật ngã — gượng dậy nào!'}
                    </div>
                  )}
                </div>

                <div className="w-full bg-black/40 rounded-2xl p-4 border border-sky-800/50"><FuelBar /></div>

                {/* Lời nhắn cá nhân — không đổ lỗi khi sai */}
                <div className={`w-full rounded-2xl px-5 py-3 border ${me?.lastCorrect ? 'bg-emerald-500/15 border-emerald-500' : 'bg-slate-800/80 border-slate-600'}`}>
                  {me?.lastCorrect
                    ? <p className="text-emerald-300 font-bold">✅ Bạn đã góp một giọt dầu cho ngọn hải đăng!</p>
                    : <p className="text-gray-300 font-bold">🕯️ Câu này chưa đúng — nhưng cả lớp vẫn đang cùng nhau giữ lửa. Câu sau ta gỡ nhé!</p>}
                </div>
              </div>
            );
          })()}

          {/* --- Kết thúc --- */}
          {roomData.status === 'END' && (
            <div className="w-full flex flex-col items-center gap-4 text-center">
              <div className="max-w-[220px]"><Lighthouse fuel={fuel} /></div>
              <h1 className="text-3xl font-black text-sky-300">
                {fuel > 0 ? '⚓ Đoàn tàu đã về bến!' : '🌅 Bình minh vẫn tới'}
              </h1>
              <p className="text-white/80">Cả lớp cùng nhau đi hết đêm bão này</p>

              <div className="w-full grid grid-cols-2 gap-3">
                <div className="bg-black/45 rounded-2xl p-4 border border-white/15">
                  <div className="text-3xl font-black text-amber-300">{fuel}%</div>
                  <div className="text-xs text-gray-400 font-bold mt-1">dầu còn lại</div>
                </div>
                <div className="bg-black/45 rounded-2xl p-4 border border-white/15">
                  <div className="text-3xl font-black text-emerald-300">{me?.correctCount || 0}</div>
                  <div className="text-xs text-gray-400 font-bold mt-1">câu bạn góp</div>
                </div>
              </div>

              <p className="text-sky-200/80 text-sm">Cảm ơn bạn đã cùng {playersList.length - 1} người bạn giữ cho ngọn lửa không tắt 🕯️</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LighthousePlayer;
