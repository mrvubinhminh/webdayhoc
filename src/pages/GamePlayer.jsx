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

          {roomData.status === 'REVEAL' && (
            <div className="text-center animate-fade-in">
               {me?.currentAnswer === roomData.questions[roomData.currentQuestionIndex].correctOption ? (
                  <div className="bg-emerald-600 p-12 rounded-3xl shadow-2xl border-4 border-emerald-400">
                     <CheckCircle className="w-32 h-32 text-white mx-auto mb-6" />
                     <h2 className="text-4xl font-black text-white mb-2">CHÍNH XÁC!</h2>
                     <p className="text-2xl text-emerald-200">+100 điểm</p>
                  </div>
               ) : (
                  <div className="bg-red-600 p-12 rounded-3xl shadow-2xl border-4 border-red-400">
                     <XCircle className="w-32 h-32 text-white mx-auto mb-6" />
                     <h2 className="text-4xl font-black text-white mb-2">SAI RỒI!</h2>
                     <p className="text-2xl text-red-200">Không sao, phục thù câu sau nhé!</p>
                  </div>
               )}
            </div>
          )}

          {roomData.status === 'LEADERBOARD' && (
             <div className="w-full max-w-xl mx-auto animate-fade-in">
               <div className="flex items-center justify-center gap-4 mb-8">
                 <div className="w-20 h-20 bg-white/10 rounded-full border-4 border-yellow-400 p-1">
                   <img src={me?.avatar} alt="avatar" className="w-full h-full object-contain" />
                 </div>
                 <div>
                   <h2 className="text-2xl font-bold text-white">Điểm của bạn:</h2>
                   <div className="text-4xl font-black text-yellow-400">{me?.score || 0}</div>
                 </div>
               </div>
               
               <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl">
                 <h3 className="text-xl font-bold text-gray-400 mb-6 text-center">🏆 BẢNG XẾP HẠNG TOP 5</h3>
                 <div className="space-y-3">
                   {sortedPlayers.map((p, i) => (
                     <div key={i} className={`flex justify-between items-center p-4 rounded-xl font-bold ${p.name === name ? 'bg-yellow-500/20 border border-yellow-500/50 text-white' : 'bg-slate-900/50 text-gray-300'}`}>
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full text-sm">#{i+1}</div>
                         <div className="w-10 h-10 bg-white/10 rounded-full overflow-hidden p-1">
                           <img src={p.avatar} alt="avt" className="w-full h-full object-contain" />
                         </div>
                         <span>{p.name}</span>
                       </div>
                       <div className="text-xl">{p.score || 0}</div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
          )}

        </div>
      )}
    </div>
  );
};

export default GamePlayer;
