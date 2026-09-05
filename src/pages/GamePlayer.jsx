import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { ref, set, onValue, get } from 'firebase/database';

const GamePlayer = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [localGameState, setLocalGameState] = useState('JOIN'); // JOIN, PLAYING
  const [playerId, setPlayerId] = useState('');
  
  // Realtime Data from Firebase
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    if (localGameState === 'PLAYING' && pin) {
      const roomRef = ref(db, `rooms/${pin}`);
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRoomData(data);
        } else {
          // Room deleted / ended
          alert("Phòng chơi đã kết thúc!");
          navigate('/');
        }
      });
      return () => unsubscribe();
    }
  }, [localGameState, pin, navigate]);

  const joinRoom = async (e) => {
    e.preventDefault();
    if (!pin || !name) return;

    // Kiểm tra phòng có tồn tại không
    const snapshot = await get(ref(db, `rooms/${pin}`));
    if (!snapshot.exists()) {
      alert("Mã phòng không hợp lệ!");
      return;
    }

    const newPlayerId = Date.now().toString();
    setPlayerId(newPlayerId);
    const avatarUrl = `https://robohash.org/${newPlayerId}?set=set2&size=150x150`;

    // Thêm người chơi vào phòng
    await set(ref(db, `rooms/${pin}/players/${newPlayerId}`), {
      name: name,
      score: 0,
      currentAnswer: null,
      avatar: avatarUrl
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
      {localGameState === 'JOIN' && (
        <form onSubmit={joinRoom} className="w-full max-w-sm glass-card p-8 rounded-3xl text-center">
          <h1 className="text-4xl font-black text-white mb-8">Tham Gia Trò Chơi</h1>
          
          <input
            type="text"
            placeholder="Mã phòng (PIN)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-2xl font-bold bg-white text-black rounded-xl p-4 mb-4 outline-none border-4 border-transparent focus:border-emerald-500"
          />
          
          <input
            type="text"
            placeholder="Tên của bạn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-center text-2xl font-bold bg-white text-black rounded-xl p-4 mb-8 outline-none border-4 border-transparent focus:border-emerald-500"
          />
          
          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-2xl py-4 rounded-xl shadow-[0_10px_0_#047857] active:shadow-[0_0px_0_#047857] active:translate-y-[10px] transition-all"
          >
            VÀO PHÒNG
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

          {roomData.status === 'QUESTION' && (
            <div className="w-full max-w-2xl text-center">
              {me?.currentAnswer ? (
                 <div className="bg-slate-800 p-8 rounded-3xl animate-fade-in border border-slate-700">
                    <CheckCircle className="w-24 h-24 text-emerald-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-2">Đã ghi nhận đáp án!</h2>
                    <p className="text-gray-400 text-xl">Chờ các bạn khác nhé...</p>
                 </div>
              ) : (
                <>
                  <div className="bg-slate-800 px-6 py-3 rounded-full text-xl font-bold text-emerald-400 mb-8 inline-block shadow-lg">
                    Câu hỏi {roomData.currentQuestionIndex + 1}
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full h-[60vh]">
                    {[
                      { num: 1, color: 'bg-red-500', shape: 'border-red-700' },
                      { num: 2, color: 'bg-blue-500', shape: 'border-blue-700' },
                      { num: 3, color: 'bg-yellow-500', shape: 'border-yellow-700' },
                      { num: 4, color: 'bg-emerald-500', shape: 'border-emerald-700' }
                    ].map((opt) => (
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
                </>
              )}
            </div>
          )}

          {roomData.status === 'REVEAL' && (() => {
             const isCorrect = me?.currentAnswer === roomData.questions[roomData.currentQuestionIndex].correctOption;
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
        </div>
      )}
    </div>
  );
};

export default GamePlayer;
