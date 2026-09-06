import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { ref, set, onValue, get, update } from 'firebase/database';
import MathText from '../components/MathText';
import CapitalChart, { colorOf } from '../components/CapitalChart';
import { BET_LEVELS, betAmountOf } from '../data/bankRules';

const SESSION_KEY = 'bankPlayerSession';
const saveSession = (pin, playerId) => { try { localStorage.setItem(SESSION_KEY, JSON.stringify({ pin, playerId })); } catch { /* bị chặn */ } };
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch { /* không sao */ } };

const BankPlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pin, setPin] = useState(() => searchParams.get('pin') || '');
  const [name, setName] = useState('');
  const [localGameState, setLocalGameState] = useState('JOIN');
  const [playerId, setPlayerId] = useState('');
  const [tlnAnswer, setTlnAnswer] = useState('');
  const [step, setStep] = useState(() => searchParams.get('pin') ? 2 : 1);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [roomSettings, setRoomSettings] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [betCountdown, setBetCountdown] = useState(0);

  useEffect(() => {
    if ((localGameState === 'PLAYING' || step === 2) && pin) {
      const roomRef = ref(db, `bankRooms/${pin}`);
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRoomData(data);
          setRoomSettings(data.settings);
        } else {
          clearSession();
          alert("Phòng chơi đã kết thúc!");
          navigate('/');
        }
      });
      return () => unsubscribe();
    }
  }, [localGameState, step, pin, navigate]);

  // Rớt mạng hay lỡ tắt trình duyệt: vào lại đúng chỗ cũ, vốn giữ nguyên
  useEffect(() => {
    const saved = readSession();
    if (!saved?.pin || !saved?.playerId) return;
    const urlPin = searchParams.get('pin');
    if (urlPin && urlPin !== saved.pin) { clearSession(); return; }

    get(ref(db, `bankRooms/${saved.pin}/players/${saved.playerId}`)).then(snap => {
      if (!snap.exists()) { clearSession(); return; }
      setPin(saved.pin);
      setPlayerId(saved.playerId);
      setName(snap.val().name || '');
      setLocalGameState('PLAYING');
    }).catch(() => {});
  }, []);

  // Đếm ngược pha đặt cược
  useEffect(() => {
    if (roomData?.status !== 'BET') return;
    setBetCountdown(roomData.settings?.betTime || 12);
    const timer = setInterval(() => setBetCountdown(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [roomData?.status, roomData?.currentQuestionIndex]);

  const checkPin = async (e) => {
    e.preventDefault();
    if (!pin) return;
    const snapshot = await get(ref(db, `bankRooms/${pin}`));
    if (!snapshot.exists()) { alert("Mã phòng không hợp lệ!"); return; }
    setStep(2);
  };

  const joinRoom = async (e) => {
    if (e) e.preventDefault();
    let finalName = name;
    let finalPlayerId = Date.now().toString();

    if (roomSettings?.playMode === 'TEAM') {
      if (!selectedTeamId) { alert("Vui lòng chọn một nhóm!"); return; }
      finalName = roomData.teams[selectedTeamId].name;
      finalPlayerId = selectedTeamId;

      if (roomData.players && roomData.players[finalPlayerId]) {
        const saved = readSession();
        const isMine = saved?.pin === pin && saved?.playerId === finalPlayerId;
        if (!isMine) {
          const ok = window.confirm("Nhóm này đã có người chọn.\n\nNếu nhóm bạn vừa bị mất kết nối, bấm OK để vào lại — vốn giữ nguyên.");
          if (!ok) return;
        }
        setPlayerId(finalPlayerId);
        saveSession(pin, finalPlayerId);
        setLocalGameState('PLAYING');
        return;
      }
    } else if (!name) {
      alert("Vui lòng nhập tên!");
      return;
    }

    setPlayerId(finalPlayerId);
    await set(ref(db, `bankRooms/${pin}/players/${finalPlayerId}`), {
      id: finalPlayerId,
      name: finalName,
      capital: roomSettings?.startingCapital || 1000,
      currentAnswer: null,
      betPercent: null
    });
    saveSession(pin, finalPlayerId);
    setLocalGameState('PLAYING');
  };

  const placeBet = async (percent) => {
    if (me?.betPercent) return;
    await update(ref(db, `bankRooms/${pin}/players/${playerId}`), { betPercent: percent });
  };

  const submitAnswer = async (option) => {
    if (me?.currentAnswer) return;
    await set(ref(db, `bankRooms/${pin}/players/${playerId}/currentAnswer`), option);
  };

  const me = roomData?.players?.[playerId];
  const playersList = roomData?.players ? Object.values(roomData.players) : [];
  const ranked = [...playersList].sort((a, b) => (b.capital || 0) - (a.capital || 0));
  const myRank = ranked.findIndex(p => p.id === playerId) + 1;
  const startCap = roomData?.settings?.startingCapital || 1000;
  const teamIndexOf = (id) => roomData?.teams?.[id]?.index || (playersList.findIndex(p => p.id === id) + 1);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">

      {/* --- Nhập mã phòng --- */}
      {localGameState === 'JOIN' && step === 1 && (
        <form onSubmit={checkPin} className="w-full max-w-sm bg-slate-800 p-8 rounded-3xl text-center border border-amber-700/40">
          <div className="text-6xl mb-3">🏦</div>
          <h1 className="text-3xl font-black text-amber-400 mb-8">Ngân Hàng Tri Thức</h1>
          <input
            type="text" placeholder="Mã phòng (PIN)" value={pin} onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-2xl font-bold bg-white text-black rounded-xl p-4 mb-4 outline-none border-4 border-transparent focus:border-amber-500"
          />
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-2xl py-4 rounded-xl shadow-[0_10px_0_#92400e] active:translate-y-[10px] active:shadow-none transition-all">
            KẾT NỐI
          </button>
        </form>
      )}

      {/* --- Chọn nhóm / nhập tên --- */}
      {localGameState === 'JOIN' && step === 2 && (
        <form onSubmit={joinRoom} className="w-full max-w-sm bg-slate-800 p-8 rounded-3xl text-center border border-amber-700/40">
          <h1 className="text-2xl font-black text-white mb-2">Phòng {pin}</h1>
          <p className="text-amber-400 font-bold mb-6">Vốn khởi điểm: {roomSettings?.startingCapital || 1000} điểm</p>

          {roomSettings?.playMode === 'TEAM' ? (
            <div className="flex flex-col gap-2 mb-6 max-h-72 overflow-y-auto">
              {Object.values(roomData?.teams || {}).map(t => {
                const taken = !!roomData?.players?.[t.id];
                return (
                  <button
                    type="button" key={t.id} onClick={() => setSelectedTeamId(t.id)}
                    className={`px-4 py-3 rounded-xl font-bold text-left flex items-center gap-3 border-2 transition-all ${
                      selectedTeamId === t.id ? 'bg-amber-500/25 border-amber-400 text-white' : taken ? 'bg-slate-900 border-slate-700 text-gray-500' : 'bg-slate-900 border-slate-700 text-gray-200 hover:border-amber-500/60'
                    }`}
                  >
                    <span className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-black text-white shrink-0" style={{ backgroundColor: colorOf(t.index) }}>
                      {t.index}
                    </span>
                    <span className="flex-1 min-w-0 truncate">{t.name}</span>
                    {taken && <span className="text-xs shrink-0">đã có</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              type="text" placeholder="Tên của bạn" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full text-center text-xl font-bold bg-white text-black rounded-xl p-4 mb-6 outline-none border-4 border-transparent focus:border-amber-500"
            />
          )}

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl py-4 rounded-xl shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none transition-all">
            VÀO PHÒNG
          </button>
        </form>
      )}

      {/* ================= ĐANG CHƠI ================= */}
      {localGameState === 'PLAYING' && roomData && (
        <div className="w-full max-w-md flex flex-col items-center">

          {roomData.status === 'LOBBY' && (
            <div className="text-center">
              <div className="text-7xl mb-4">🏦</div>
              <h2 className="text-2xl font-bold text-white mb-2">Xin chào, {me?.name || name}!</h2>
              <div className="bg-amber-500/20 border-2 border-amber-500 rounded-2xl px-8 py-4 my-4">
                <p className="text-amber-200 text-xs uppercase tracking-widest font-bold">Vốn của bạn</p>
                <p className="text-4xl font-black text-white">{me?.capital || startCap}</p>
              </div>
              <p className="text-amber-400 font-medium">Đợi thầy cô mở phiên giao dịch…</p>
              <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mt-6" />
            </div>
          )}

          {/* --- Biểu đồ khi giáo viên mở --- */}
          {roomData.chartOpen && roomData.status !== 'END' && (
            <div className="w-full flex flex-col items-center gap-3">
              <h2 className="text-2xl font-black text-amber-400">📈 Sàn Giao Dịch</h2>
              <div className="w-full bg-black/40 rounded-2xl p-3 border border-amber-500/40">
                <CapitalChart
                  players={playersList.map(p => ({ ...p, index: teamIndexOf(p.id) }))}
                  startingCapital={startCap}
                  totalQuestions={roomData.questions?.length || 0}
                  currentIndex={roomData.currentQuestionIndex}
                  compact
                />
              </div>
              <div className="w-full bg-amber-500/15 border-2 border-amber-500 rounded-2xl px-5 py-3 text-center">
                <p className="text-amber-200 text-xs uppercase tracking-widest font-bold">Nhóm bạn</p>
                <p className="text-white font-black text-lg">Hạng {myRank} • {me?.capital || 0} điểm</p>
              </div>
              <p className="text-gray-400 text-sm animate-pulse">Chờ thầy cô tiếp tục…</p>
            </div>
          )}

          {/* --- Đặt cược --- */}
          {!roomData.chartOpen && roomData.status === 'BET' && (
            <div className="w-full flex flex-col items-center gap-4 text-center">
              <div className="bg-amber-500/20 border-2 border-amber-500 rounded-2xl px-6 py-3 w-full">
                <p className="text-amber-200 text-xs uppercase tracking-widest font-bold">Vốn hiện có</p>
                <p className="text-4xl font-black text-white">{me?.capital || 0}</p>
              </div>

              <div>
                <h2 className="text-2xl font-black text-amber-400 uppercase">Cược bao nhiêu?</h2>
                <p className="text-gray-400 text-sm mt-1">Bạn <b className="text-white">chưa thấy câu hỏi</b> — hãy tự lượng sức mình</p>
              </div>

              <div className={`text-5xl font-black ${betCountdown <= 3 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{betCountdown}s</div>

              {me?.betPercent ? (
                <div className="w-full bg-emerald-500/20 border-2 border-emerald-500 rounded-3xl px-6 py-8">
                  <p className="text-emerald-300 font-bold uppercase text-sm tracking-widest">Đã chốt cược</p>
                  <p className="text-5xl font-black text-white mt-2">{me.betPercent}%</p>
                  <p className="text-emerald-200 font-bold text-xl mt-1">= {betAmountOf(me.capital, me.betPercent)} điểm</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 w-full">
                  {BET_LEVELS.map(b => (
                    <button
                      key={b.percent}
                      onClick={() => placeBet(b.percent)}
                      className={`bg-gradient-to-br ${b.color} rounded-2xl py-5 px-3 shadow-[0_8px_0_rgba(0,0,0,0.35)] active:translate-y-2 active:shadow-none transition-all`}
                    >
                      <div className="text-3xl font-black text-white">{b.percent}%</div>
                      <div className="text-white font-bold text-sm">{b.label}</div>
                      <div className="text-white/85 text-xs font-bold mt-1">{betAmountOf(me?.capital, b.percent)} điểm</div>
                    </button>
                  ))}
                </div>
              )}

              {!me?.betPercent && <p className="text-gray-500 text-xs">Không chọn kịp sẽ tự đặt mức an toàn 10%</p>}
            </div>
          )}

          {/* --- Trả lời câu hỏi --- */}
          {!roomData.chartOpen && roomData.status === 'QUESTION' && (() => {
            const q = roomData.questions?.[roomData.currentQuestionIndex];
            if (!q) return null;
            const showQuestion = roomData.settings?.showQuestionOnDevice;
            const stake = betAmountOf(me?.capital, me?.betPercent);

            const OPTS = [
              { num: 1, color: 'bg-red-500', shape: 'border-red-700' },
              { num: 2, color: 'bg-blue-500', shape: 'border-blue-700' },
              { num: 3, color: 'bg-yellow-500', shape: 'border-yellow-700' },
              { num: 4, color: 'bg-emerald-500', shape: 'border-emerald-700' }
            ];

            if (me?.currentAnswer) {
              return (
                <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center">
                  <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Đã ghi nhận đáp án!</h2>
                  <p className="text-amber-300 font-bold">Đang cược {stake} điểm ({me.betPercent}%)</p>
                </div>
              );
            }

            return (
              <div className="w-full flex flex-col h-[92vh] py-2">
                <div className="shrink-0 mb-2 flex items-center justify-center gap-2 flex-wrap">
                  <div className="bg-slate-800 px-4 py-1.5 rounded-full text-base font-bold text-amber-400 border border-slate-700">
                    Câu {roomData.currentQuestionIndex + 1}
                  </div>
                  <div className="bg-amber-500/25 border border-amber-500 rounded-full px-4 py-1.5 text-amber-200 font-bold text-sm">
                    🎯 Cược {stake}đ ({me?.betPercent || 10}%)
                  </div>
                  {roomData.paused && (
                    <div className="bg-amber-500/25 border border-amber-500 rounded-full px-3 py-1.5 text-amber-300 font-bold text-sm animate-pulse">⏸ Tạm dừng</div>
                  )}
                </div>

                {showQuestion ? (
                  <div className="flex-1 min-h-0 flex flex-col gap-2">
                    <div className="shrink-0 max-h-[38%] overflow-y-auto bg-slate-800 p-3 rounded-2xl border border-slate-700 text-left">
                      <div className="text-white text-base md:text-lg font-medium whitespace-pre-wrap"><MathText text={q.question} /></div>
                      {q.image && <div className="mt-2 flex justify-center"><img src={q.image} alt="minh hoạ" className="max-h-32 rounded-lg object-contain" /></div>}
                    </div>

                    {q.type === 'TLN' ? (
                      <div className="flex-1 min-h-0 flex flex-col gap-3 justify-center">
                        <input
                          type="text" value={tlnAnswer} onChange={(e) => setTlnAnswer(e.target.value)} placeholder="Nhập câu trả lời..."
                          className="w-full text-center bg-slate-900 border-4 border-slate-700 text-white text-3xl font-black py-6 rounded-3xl outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={() => { if (tlnAnswer.trim()) { submitAnswer(tlnAnswer.trim()); setTlnAnswer(''); } }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white w-full py-5 rounded-2xl text-xl font-black shadow-[0_8px_0_rgba(4,120,87,1)] active:translate-y-2 active:shadow-none uppercase"
                        >
                          Gửi Đáp Án
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 grid grid-rows-4 gap-2">
                        {OPTS.map(opt => (
                          <button
                            key={opt.num} onClick={() => submitAnswer(opt.num)}
                            className={`w-full min-h-0 rounded-2xl ${opt.color} border-b-[6px] ${opt.shape} active:translate-y-1 active:border-b-0 transition-transform flex items-center gap-3 px-3 py-2 text-left overflow-hidden`}
                          >
                            <span className="text-3xl font-black text-white/80 shrink-0 w-9 text-center">{['A', 'B', 'C', 'D'][opt.num - 1]}</span>
                            <span className="flex-1 text-white font-bold text-base overflow-y-auto max-h-full">
                              <MathText text={[q.optionA, q.optionB, q.optionC, q.optionD][opt.num - 1] || ''} />
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
                        <input
                          type="text" value={tlnAnswer} onChange={(e) => setTlnAnswer(e.target.value)} placeholder="Nhập câu trả lời..."
                          className="w-full text-center bg-slate-900 border-4 border-slate-700 text-white text-3xl md:text-5xl font-black py-8 rounded-3xl outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={() => { if (tlnAnswer.trim()) { submitAnswer(tlnAnswer.trim()); setTlnAnswer(''); } }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white w-full py-6 rounded-2xl text-2xl font-black shadow-[0_8px_0_rgba(4,120,87,1)] active:translate-y-2 active:shadow-none uppercase"
                        >
                          Gửi Đáp Án
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 w-full h-[60vh]">
                        {OPTS.map(opt => (
                          <button
                            key={opt.num} onClick={() => submitAnswer(opt.num)}
                            className={`w-full h-full rounded-2xl ${opt.color} border-b-8 ${opt.shape} active:translate-y-2 active:border-b-0 transition-transform flex items-center justify-center group`}
                          >
                            <span className="text-6xl font-black text-white/50 group-hover:text-white">{['A', 'B', 'C', 'D'][opt.num - 1]}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* --- Kết quả lãi lỗ --- */}
          {!roomData.chartOpen && roomData.status === 'REVEAL' && (
            <div className="w-full flex flex-col items-center gap-4 text-center">
              <div className={`w-full rounded-3xl p-8 border-4 ${me?.lastCorrect ? 'bg-emerald-600 border-emerald-300' : 'bg-red-600 border-red-300'}`}>
                <div className="text-7xl">{me?.lastCorrect ? '🎉' : '😢'}</div>
                <h2 className="text-3xl font-black text-white mt-2">{me?.lastCorrect ? 'CHÍNH XÁC!' : 'SAI RỒI!'}</h2>
                <p className="text-white/90 font-bold mt-1">Cược {me?.lastStake || 0} điểm ({me?.bets?.[roomData.currentQuestionIndex] || 10}%)</p>
                <p className="text-5xl font-black text-white mt-3">
                  {me?.lastDelta > 0 ? `+${me.lastDelta}` : me?.lastDelta}
                </p>
              </div>

              <div className="w-full bg-amber-500/20 border-2 border-amber-500 rounded-2xl px-6 py-4">
                <p className="text-amber-200 text-xs uppercase tracking-widest font-bold">Vốn hiện tại</p>
                <p className="text-4xl font-black text-white">{me?.capital || 0}</p>
                <p className="text-white/70 font-bold text-sm mt-1">Hạng {myRank}/{playersList.length}</p>
                {me?.bailedOut && <p className="text-amber-300 font-bold text-sm mt-2">🆘 Được cấp vốn mồi để chơi tiếp — cố lên!</p>}
              </div>
            </div>
          )}

          {/* --- Kết thúc --- */}
          {roomData.status === 'END' && (
            <div className="w-full flex flex-col items-center gap-4 text-center">
              <div className="text-7xl">{myRank === 1 ? '👑' : '🏦'}</div>
              <h1 className="text-3xl font-black text-amber-400">{myRank === 1 ? 'NHÀ ĐẦU TƯ SỐ 1!' : 'KẾT THÚC PHIÊN'}</h1>

              <div className="w-full bg-amber-500/20 border-2 border-amber-500 rounded-3xl px-8 py-5">
                <p className="text-amber-200 text-xs uppercase tracking-widest font-bold">Vốn cuối phiên</p>
                <p className="text-5xl font-black text-white mt-1">{me?.capital || 0}</p>
                <p className={`font-black text-lg mt-1 ${(me?.capital || 0) >= startCap ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(me?.capital || 0) - startCap >= 0 ? `+${(me?.capital || 0) - startCap}` : `${(me?.capital || 0) - startCap}`} so với vốn ban đầu
                </p>
                <p className="text-white font-bold mt-2">Hạng {myRank}/{playersList.length}</p>
              </div>

              <div className="w-full flex flex-col gap-1.5 max-h-[35vh] overflow-y-auto">
                {ranked.map((p, i) => (
                  <div key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${p.id === playerId ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-slate-800/70'}`}>
                    <span className="font-black text-sm w-6 shrink-0 text-gray-400">#{i + 1}</span>
                    <span className="flex-1 min-w-0 truncate font-bold text-white text-sm">{p.name}</span>
                    <span className="text-amber-300 font-black text-sm shrink-0">{p.capital}đ</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BankPlayer;
