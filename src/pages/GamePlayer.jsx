import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { ref, set, onValue, get, update } from 'firebase/database';
import MathText from '../components/MathText';

const AVATAR_STYLES = [
  { name: '🔴 Đỏ', bg: '#FF6B6B', emoji: '😊' },
  { name: '🟠 Cam', bg: '#FFA500', emoji: '😄' },
  { name: '🟡 Vàng', bg: '#FFD93D', emoji: '😆' },
  { name: '🟢 Xanh Lá', bg: '#6BCB77', emoji: '🤗' },
  { name: '🔵 Xanh Dương', bg: '#4D96FF', emoji: '😎' },
  { name: '🟣 Tím', bg: '#9B59B6', emoji: '😋' },
  { name: '🌸 Hồng', bg: '#FF69B4', emoji: '😍' },
  { name: '⚫ Đen', bg: '#2C3E50', emoji: '🤐' },
  { name: '⚪ Trắng', bg: '#ECF0F1', emoji: '😲' },
  { name: '🟦 Lam', bg: '#3498DB', emoji: '😜' },
];

const getRandomAvatar = () => {
  const style = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
  const colors = [style.bg];
  return {
    url: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${Date.now()}_${Math.random()}&backgroundColor=${style.bg.replace('#', '')}`,
    color: style.bg,
    emoji: style.emoji,
    name: style.name
  };
};

const GamePlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pin, setPin] = useState(() => searchParams.get('pin') || '');
  const [name, setName] = useState('');
  const [localGameState, setLocalGameState] = useState('JOIN'); // JOIN, PLAYING
  const [playerId, setPlayerId] = useState('');
  const [tlnAnswer, setTlnAnswer] = useState('');
  const [step, setStep] = useState(() => searchParams.get('pin') ? 2 : 1);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [roomSettings, setRoomSettings] = useState(null);

  // Realtime Data from Firebase
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    if ((localGameState === 'PLAYING' || step === 2) && pin) {
      const roomRef = ref(db, `rooms/${pin}`);
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRoomData(data);
          setRoomSettings(data.settings);
        } else {
          // Room deleted / ended
          alert("Phòng chơi đã kết thúc!");
          navigate('/');
        }
      });
      return () => unsubscribe();
    }
  }, [localGameState, step, pin, navigate]);

  const checkPin = async (e) => {
    e.preventDefault();
    if (!pin) return;
    const snapshot = await get(ref(db, `rooms/${pin}`));
    if (!snapshot.exists()) {
      alert("Mã phòng không hợp lệ!");
      return;
    }
    setStep(2);
  };

  const joinRoom = async (e) => {
    if (e) e.preventDefault();
    
    let finalName = name;
    let finalPlayerId = Date.now().toString();

    if (roomSettings?.playMode === 'TEAM') {
      if (!selectedTeamId) {
        alert("Vui lòng chọn một nhóm!");
        return;
      }
      finalName = roomData.teams[selectedTeamId].name;
      finalPlayerId = selectedTeamId;
      
      if (roomData.players && roomData.players[finalPlayerId]) {
        alert("Nhóm này đã có người chọn!");
        return;
      }
    } else {
      if (!name) {
        alert("Vui lòng nhập tên!");
        return;
      }
    }

    setPlayerId(finalPlayerId);
    const avatar = getRandomAvatar();

    // Thêm người chơi vào phòng
    await set(ref(db, `rooms/${pin}/players/${finalPlayerId}`), {
      id: finalPlayerId,
      name: finalName,
      score: 0,
      currentAnswer: null,
      avatar: avatar.url,
      avatarColor: avatar.color,
      avatarEmoji: avatar.emoji,
      avatarName: avatar.name
    });

    setLocalGameState('PLAYING');
  };

  const submitAnswer = async (option) => {
    // Không cho chọn lại nếu đã chọn
    const me = roomData?.players?.[playerId];
    if (me?.currentAnswer) return;

    await set(ref(db, `rooms/${pin}/players/${playerId}/currentAnswer`), option);
  };

  const getMyData = () => roomData?.players?.[playerId];
  const me = getMyData();
  const playersList = roomData?.players ? Object.values(roomData.players) : [];
  const sortedPlayers = playersList.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      {localGameState === 'JOIN' && step === 1 && (
        <form onSubmit={checkPin} className="w-full max-w-sm glass-card p-8 rounded-3xl text-center">
          <h1 className="text-4xl font-black text-white mb-8">Tham Gia Trò Chơi</h1>
          
          <input
            type="text"
            placeholder="Mã phòng (PIN)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-2xl font-bold bg-white text-black rounded-xl p-4 mb-4 outline-none border-4 border-transparent focus:border-emerald-500"
          />
          
          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-2xl py-4 rounded-xl shadow-[0_10px_0_#047857] active:shadow-[0_0px_0_#047857] active:translate-y-[10px] transition-all"
          >
            KẾT NỐI
          </button>

          <button 
            type="button"
            onClick={() => navigate('/')}
            className="mt-8 text-gray-400 hover:text-white flex items-center justify-center gap-2 w-full"
          >
            <ArrowLeft className="w-4 h-4" /> Về trang chủ
          </button>
        </form>
      )}

      {localGameState === 'JOIN' && step === 2 && roomData && (
        <form onSubmit={joinRoom} className="w-full max-w-2xl glass-card p-8 rounded-3xl text-center">
          <h1 className="text-3xl font-black text-white mb-6">Mã phòng: {pin}</h1>
          
          {roomSettings?.playMode === 'TEAM' ? (
            <div className="mb-8">
              <h2 className="text-xl text-emerald-400 font-bold mb-4">Chọn Nhóm Của Bạn</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.values(roomData.teams || {}).map((team) => {
                  const isTaken = roomData.players && roomData.players[team.id];
                  return (
                    <div 
                      key={team.id}
                      onClick={() => !isTaken && setSelectedTeamId(team.id)}
                      className={`p-4 rounded-xl border-4 text-center cursor-pointer transition-all ${
                        isTaken 
                          ? 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed'
                          : selectedTeamId === team.id 
                            ? 'bg-emerald-600 border-white scale-105 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
                            : 'bg-slate-700 border-slate-600 hover:border-emerald-500'
                      }`}
                    >
                      <div className={`font-black text-2xl ${isTaken ? 'text-gray-500' : 'text-white'}`}>Nhóm {team.index}</div>
                      <div className={`text-sm mt-1 ${isTaken ? 'text-gray-600' : 'text-emerald-200'}`}>{team.name}</div>
                      {isTaken && <div className="text-xs text-red-400 mt-2">Đã chọn</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <input
              type="text"
              placeholder="Tên của bạn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-center text-2xl font-bold bg-white text-black rounded-xl p-4 mb-8 outline-none border-4 border-transparent focus:border-emerald-500"
            />
          )}
          
          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-2xl py-4 rounded-xl shadow-[0_10px_0_#047857] active:shadow-[0_0px_0_#047857] active:translate-y-[10px] transition-all"
          >
            VÀO PHÒNG
          </button>

          <button 
            type="button"
            onClick={() => setStep(1)}
            className="mt-8 text-gray-400 hover:text-white flex items-center justify-center gap-2 w-full"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        </form>
      )}

      {localGameState === 'PLAYING' && roomData && (
        <div className="w-full max-w-4xl h-full flex flex-col items-center justify-center">
          
          {roomData.status === 'LOBBY' && (
            <div className="text-center">
              <div className="w-32 h-32 bg-white/10 rounded-full mx-auto mb-6 border-4 border-emerald-500 p-2 overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                 <img src={me?.avatar} alt="avatar" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Xin chào, {name}!</h2>
              <p className="text-xl text-emerald-400 font-medium">Bạn đã vào phòng. Đợi thầy giáo bắt đầu nhé...</p>
              <div className="mt-8">
                 <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            </div>
          )}

          {roomData.status === 'QUESTION' && (() => {
            const currentQ = roomData.questions?.[roomData.currentQuestionIndex];
            if (!currentQ) return null;
            const showQuestion = roomData.settings?.showQuestionOnDevice;
            
            const OPTION_STYLES = [
              { num: 1, color: 'bg-red-500', shape: 'border-red-700' },
              { num: 2, color: 'bg-blue-500', shape: 'border-blue-700' },
              { num: 3, color: 'bg-yellow-500', shape: 'border-yellow-700' },
              { num: 4, color: 'bg-emerald-500', shape: 'border-emerald-700' }
            ];
            const canUseStar = roomData.settings?.enableHighStakes && roomData.currentQuestionIndex >= (roomData.questions?.length || 0) - 3 && !me?.usedHighStakes;

            return (
            <div className="w-full max-w-2xl text-center flex flex-col h-[92vh] py-2">
              {me?.currentAnswer ? (
                 <div className="bg-slate-800 p-8 rounded-3xl animate-fade-in border border-slate-700 my-auto">
                    <CheckCircle className="w-24 h-24 text-emerald-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-2">Đã ghi nhận đáp án!</h2>
                    <p className="text-gray-400 text-xl">Chờ các bạn khác nhé...</p>
                 </div>
              ) : (
                <div className="flex flex-col h-full min-h-0">
                  {/* Thanh trạng thái gọn: số câu + ngôi sao */}
                  <div className="shrink-0 mb-2 flex items-center justify-center gap-2 flex-wrap">
                    <div className="bg-slate-800 px-4 py-1.5 rounded-full text-base font-bold text-emerald-400 shadow-lg border border-slate-700">
                      Câu {roomData.currentQuestionIndex + 1}
                    </div>

                    {canUseStar && (
                      <button
                        onClick={async () => {
                          await update(ref(db, `rooms/${pin}/players/${playerId}`), { usedHighStakes: true });
                        }}
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 text-slate-900 px-4 py-1.5 rounded-full font-black text-sm flex items-center gap-1.5 shadow-[0_4px_0_rgba(161,98,7,1)] active:translate-y-1 active:shadow-none transition-all animate-pulse"
                      >
                        <span className="text-xl">⭐</span>
                        Ngôi Sao Hy Vọng
                      </button>
                    )}

                    {me?.usedHighStakes && (
                      <div className="bg-yellow-900/50 border border-yellow-500 rounded-full px-4 py-1.5 text-yellow-300 font-bold text-sm flex items-center gap-1.5">
                        <span className="text-xl">⭐</span> ×3 điểm
                      </div>
                    )}
                  </div>

                  {showQuestion ? (
                    <div className="flex-1 min-h-0 flex flex-col gap-2">
                      {/* Nội dung câu hỏi */}
                      <div className="shrink-0 max-h-[38%] overflow-y-auto custom-scrollbar bg-slate-800 p-3 rounded-2xl border border-slate-700 shadow-xl text-left">
                        <div className="text-white text-base md:text-lg font-medium whitespace-pre-wrap">
                          <MathText text={currentQ.question} />
                        </div>
                        {currentQ.image && (
                          <div className="mt-2 flex justify-center">
                            <img src={currentQ.image} alt="minh họa" className="max-h-32 rounded-lg object-contain bg-white/5 p-1" />
                          </div>
                        )}
                      </div>

                      {/* Phương án = nút trả lời luôn */}
                      {currentQ.type === 'TLN' ? (
                        <div className="flex-1 min-h-0 flex flex-col gap-3 justify-center">
                          <input
                            type="text"
                            value={tlnAnswer}
                            onChange={(e) => setTlnAnswer(e.target.value)}
                            placeholder="Nhập câu trả lời..."
                            className="w-full text-center bg-slate-900 border-4 border-slate-700 text-white text-3xl md:text-4xl font-black py-6 rounded-3xl outline-none focus:border-emerald-500 shadow-xl"
                          />
                          <button
                            onClick={() => {
                              if (tlnAnswer.trim()) {
                                submitAnswer(tlnAnswer.trim());
                                setTlnAnswer('');
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white w-full py-5 rounded-2xl text-xl font-black shadow-[0_8px_0_rgba(4,120,87,1)] active:translate-y-2 active:shadow-none transition-all uppercase tracking-widest"
                          >
                            Gửi Đáp Án
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 min-h-0 grid grid-rows-4 gap-2">
                          {OPTION_STYLES.map((opt) => (
                            <button
                              key={opt.num}
                              onClick={() => submitAnswer(opt.num)}
                              className={`w-full min-h-0 rounded-2xl ${opt.color} border-b-[6px] ${opt.shape} shadow-xl active:translate-y-1 active:border-b-0 transition-transform flex items-center gap-3 px-3 py-2 text-left overflow-hidden`}
                            >
                              <span className="text-3xl font-black text-white/80 shrink-0 w-9 text-center">
                                {['A', 'B', 'C', 'D'][opt.num - 1]}
                              </span>
                              <span className="flex-1 text-white font-bold text-base md:text-lg overflow-y-auto max-h-full custom-scrollbar">
                                <MathText text={currentQ.options?.[opt.num - 1] || ''} />
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 flex flex-col justify-center">
                      {currentQ.type === 'TLN' ? (
                        <div className="w-full flex flex-col gap-6 items-center">
                           <input
                             type="text"
                             value={tlnAnswer}
                             onChange={(e) => setTlnAnswer(e.target.value)}
                             placeholder="Nhập câu trả lời..."
                             className="w-full text-center bg-slate-900 border-4 border-slate-700 text-white text-3xl md:text-5xl font-black py-8 rounded-3xl outline-none focus:border-emerald-500 shadow-xl"
                           />
                           <button
                             onClick={() => {
                               if (tlnAnswer.trim()) {
                                 submitAnswer(tlnAnswer.trim());
                                 setTlnAnswer('');
                               }
                             }}
                             className="bg-emerald-600 hover:bg-emerald-500 text-white w-full py-6 rounded-2xl text-2xl font-black shadow-[0_8px_0_rgba(4,120,87,1)] active:translate-y-2 active:shadow-none transition-all uppercase tracking-widest"
                           >
                             Gửi Đáp Án
                           </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 w-full h-[60vh]">
                          {OPTION_STYLES.map((opt) => (
                            <button
                              key={opt.num}
                              onClick={() => submitAnswer(opt.num)}
                              className={`w-full h-full rounded-2xl ${opt.color} border-b-8 ${opt.shape} shadow-xl active:translate-y-2 active:border-b-0 transition-transform flex items-center justify-center group`}
                            >
                               <span className="text-6xl font-black text-white/50 group-hover:text-white transition-colors">
                                 {['A', 'B', 'C', 'D'][opt.num - 1]}
                               </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })()}

          {roomData.status === 'REVEAL' && (() => {
             const currentQ = roomData.questions?.[roomData.currentQuestionIndex];
             if (!currentQ) return null;
             const isCorrect = currentQ.type === 'TLN'
                ? me?.currentAnswer?.toString().trim().toLowerCase().replace(/,/g, '.') === currentQ.correctOption?.toString().trim().toLowerCase().replace(/,/g, '.')
                : me?.currentAnswer === currentQ.correctOption;
             const playersList = roomData?.players ? Object.values(roomData.players) : [];
             const sortedTop5 = [...playersList].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
             const myRankIndex = playersList.sort((a, b) => (b.score || 0) - (a.score || 0)).findIndex(p => p.id === playerId);

             return (
                <div className="flex flex-col w-full h-full animate-fade-in bg-slate-900 absolute top-0 left-0 pt-4">
                  {/* Banner đúng/sai */}
                  <div className={`mx-4 p-6 text-center rounded-3xl shadow-xl flex flex-col items-center justify-center border-4 ${isCorrect ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'}`}>
                    <div className="flex items-center gap-6">
                       <div className="w-24 h-24 bg-white/20 rounded-full overflow-hidden p-1 border-4 border-white shadow-xl">
                          <img src={me?.avatar} alt="avt" className="w-full h-full object-contain" />
                       </div>
                       <div className="text-left">
                          <h2 className="text-3xl font-black text-white drop-shadow-md mb-1">{isCorrect ? 'CHÍNH XÁC!' : 'SAI RỒI!'}</h2>
                          <div className="text-xl text-white/90">Điểm của bạn: <span className="font-black text-3xl text-yellow-300 ml-2">{me?.score || 0}</span></div>
                       </div>
                    </div>
                  </div>

                  {/* Bảng xếp hạng */}
                  <div className="flex-1 overflow-y-auto px-4 mt-6 pb-6">
                    <h3 className="text-xl font-bold text-gray-400 mb-4 text-center">🏆 TOP 5 HIỆN TẠI</h3>
                    <div className="space-y-3 max-w-xl mx-auto">
                       {sortedTop5.map((p, i) => {
                         const isMe = p.id === playerId;
                         let bgClass = 'bg-slate-800 text-gray-300';
                         if (i === 0) bgClass = 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black shadow-lg font-black';
                         if (isMe) bgClass = 'bg-emerald-500 text-white shadow-lg border-2 border-emerald-300 font-black scale-[1.02]';

                         return (
                           <div key={i} className={`flex justify-between items-center p-4 rounded-2xl text-lg font-bold transition-all ${bgClass}`}>
                             <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${i === 0 && !isMe ? 'bg-black/20' : 'bg-black/30'}`}>
                                 #{i+1}
                               </div>
                               <div className="w-10 h-10 bg-white/20 rounded-full overflow-hidden p-0.5">
                                 <img src={p.avatar} alt="avt" className="w-full h-full object-contain" />
                               </div>
                               <span className="truncate max-w-[150px]">{p.name} {isMe && '(Bạn)'}</span>
                             </div>
                             <div className="text-xl">{p.score || 0}</div>
                           </div>
                         );
                       })}

                       {/* Nếu bản thân không ở trong Top 5, hiển thị thêm ở dưới cùng */}
                       {myRankIndex >= 5 && (
                         <div className="mt-6 pt-6 border-t-2 border-slate-700 border-dashed">
                           <div className="flex justify-between items-center p-4 rounded-2xl text-lg font-black bg-emerald-500 text-white shadow-lg border-2 border-emerald-300">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 flex items-center justify-center rounded-full text-sm bg-black/30">
                                 #{myRankIndex + 1}
                               </div>
                               <div className="w-10 h-10 bg-white/20 rounded-full overflow-hidden p-0.5">
                                 <img src={me?.avatar} alt="avt" className="w-full h-full object-contain" />
                               </div>
                               <span className="truncate max-w-[150px]">{me?.name} (Bạn)</span>
                             </div>
                             <div className="text-xl">{me?.score || 0}</div>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
             );
          })()}

          {roomData.status === 'END' && (() => {
             const playersList = roomData?.players ? Object.values(roomData.players) : [];
             const myRankIndex = playersList.sort((a, b) => (b.score || 0) - (a.score || 0)).findIndex(p => p.id === playerId);
             const myRank = myRankIndex + 1;

             return (
                <div className="flex flex-col items-center justify-center w-full h-full animate-fade-in bg-slate-900 absolute top-0 left-0 p-6 text-center">
                   <div className="text-6xl mb-6 animate-bounce">🏆</div>
                   <h1 className="text-4xl font-black text-yellow-400 mb-2 drop-shadow-md">TRÒ CHƠI KẾT THÚC</h1>
                   <p className="text-xl text-gray-300 mb-12">Cảm ơn bạn đã tham gia!</p>

                   <div className="bg-slate-800 p-8 rounded-3xl border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] w-full max-w-sm">
                      <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-4 p-2 shadow-xl">
                         <img src={me?.avatar} alt="avatar" className="w-full h-full object-contain" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">{me?.name}</h2>
                      
                      <div className="flex justify-between items-center bg-slate-900 rounded-2xl p-4 mt-6">
                         <div className="text-left">
                            <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Xếp hạng</div>
                            <div className="text-4xl font-black text-emerald-400">#{myRank}</div>
                         </div>
                         <div className="text-right">
                            <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Tổng điểm</div>
                            <div className="text-3xl font-black text-yellow-400">{me?.score || 0}</div>
                         </div>
                      </div>
                   </div>

                   <button 
                     onClick={() => navigate('/')}
                     className="mt-12 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold transition-all"
                   >
                     Về trang chủ
                   </button>
                </div>
             );
          })()}
        </div>
      )}
    </div>
  );
};

export default GamePlayer;
