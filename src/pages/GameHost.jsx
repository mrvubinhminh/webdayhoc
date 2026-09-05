import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Upload, Play, Users, Trophy, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { db } from '../firebase';
import { ref, set, update, onValue, remove } from 'firebase/database';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Component render toán học LaTeX
const MathText = ({ text }) => {
  const renderMath = (str) => {
    if (!str) return null;
    
    // Tách các khối math bằng $$...$$ hoặc $...$
    const parts = str.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
    return parts.map((part, i) => {
      let isDisplayMode = false;
      let math = null;

      if (part.startsWith('$$') && part.endsWith('$$')) {
        isDisplayMode = true;
        math = part.slice(2, -2);
      } else if (part.startsWith('$') && part.endsWith('$')) {
        math = part.slice(1, -1);
      }

      if (math !== null) {
        // Nếu trong công thức có \\ nhưng không có \begin{...} thì bọc bằng aligned để katex không lỗi
        if (math.includes('\\\\') && !math.includes('\\begin{')) {
            math = `\\begin{aligned} ${math} \\end{aligned}`;
        }
        try {
          return <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(math, { throwOnError: false, displayMode: isDisplayMode }) }} />;
        } catch (e) {
          return <span key={i}>{part}</span>;
        }
      }
      
      // Xử lý xuống dòng cho phần text (không phải toán)
      // Chỉ \newline hoặc \\newline mới xuống dòng, \\ không xuống dòng
      const textParts = part.split(/\\\\newline|\\newline/g);
      return (
        <span key={i}>
          {textParts.map((t, idx) => (
             <React.Fragment key={idx}>
               {t}
               {idx !== textParts.length - 1 && <br />}
             </React.Fragment>
          ))}
        </span>
      );
    });
  };
  return <div>{renderMath(text || '')}</div>;
};

const GameHost = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [fileName, setFileName] = useState('');
  const [localGameState, setLocalGameState] = useState('SETUP');
  const [roomCode, setRoomCode] = useState('');
  const [timeLimit, setTimeLimit] = useState(60); // Thời gian làm bài (giây)
  const [revealTimeLimit, setRevealTimeLimit] = useState(60); // Thời gian xem đáp án (giây)
  
  // Realtime Data from Firebase
  const [roomData, setRoomData] = useState(null);

  // Timer cho màn hình Host
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (roomCode) {
      const roomRef = ref(db, `rooms/${roomCode}`);
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Xử lý chuyển trạng thái để reset timer
          if (roomData && roomData.status !== data.status) {
             if (data.status === 'QUESTION') {
               setTimeLeft(data.settings.timeLimit || 60);
             } else if (data.status === 'REVEAL') {
               setTimeLeft(data.settings.revealTimeLimit || 60);
             }
          }
          // Lần đầu nhận dữ liệu (khôi phục timer nếu đang ở QUESTION/REVEAL)
          if (!roomData && data) {
             if (data.status === 'QUESTION') setTimeLeft(data.settings.timeLimit || 60);
             else if (data.status === 'REVEAL') setTimeLeft(data.settings.revealTimeLimit || 60);
          }
          setRoomData(data);
        }
      });
      return () => unsubscribe();
    }
  }, [roomCode, roomData]);

  // Bộ đếm thời gian
  useEffect(() => {
    let timer;
    if ((roomData?.status === 'QUESTION' || roomData?.status === 'REVEAL') && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
             clearInterval(timer);
             // Tự động chuyển trạng thái khi hết giờ
             if (roomData.status === 'QUESTION') {
                revealAnswer();
             } else if (roomData.status === 'REVEAL') {
                // Hết giờ xem đáp án -> Tự sang câu tiếp theo
                nextQuestion(); 
             }
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [roomData?.status, timeLeft]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      const parsedQuestions = data.slice(1).map(row => {
        if (!row[0]) return null;
        return {
          question: row[0] || '',
          optionA: row[1] || '',
          optionB: row[2] || '',
          optionC: row[3] || '',
          optionD: row[4] || '',
          correctOption: parseInt(row[5]) || 1,
          explanation: row[6] || '',
          image: row[7] || null,
        };
      }).filter(Boolean);

      setQuestions(parsedQuestions);
    };
    reader.readAsBinaryString(file);
  };

  const createRoom = async () => {
    if (questions.length === 0) {
      alert("Vui lòng tải lên file câu hỏi trước!");
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setLocalGameState('LOBBY');
    
    await set(ref(db, `rooms/${code}`), {
      status: 'LOBBY', 
      currentQuestionIndex: 0,
      questions: questions,
      players: {},
      settings: {
        timeLimit: timeLimit,
        revealTimeLimit: revealTimeLimit
      }
    });
  };

  const startGame = async () => {
    await update(ref(db, `rooms/${roomCode}`), { status: 'QUESTION' });
    setLocalGameState('PLAYING');
  };

  const revealAnswer = async () => {
    // Tự động cộng điểm cho những người trả lời đúng
    const currentQ = roomData.questions[roomData.currentQuestionIndex];
    const players = roomData.players || {};
    
    const updates = {};
    updates['status'] = 'REVEAL';
    
    Object.keys(players).forEach(playerId => {
      const p = players[playerId];
      if (p.currentAnswer === currentQ.correctOption) {
        // Cộng điểm
        updates[`players/${playerId}/score`] = (p.score || 0) + 100; // Mỗi câu 100 điểm
      }
    });

    await update(ref(db, `rooms/${roomCode}`), updates);
  };

  const showLeaderboard = async () => {
    await update(ref(db, `rooms/${roomCode}`), { status: 'LEADERBOARD' });
  };

  const nextQuestion = async () => {
    const nextIdx = roomData.currentQuestionIndex + 1;
    if (nextIdx >= roomData.questions.length) {
      alert("Đã hết câu hỏi!");
      return;
    }
    
    // Reset câu trả lời của tất cả người chơi
    const players = roomData.players || {};
    const updates = {};
    updates['status'] = 'QUESTION';
    updates['currentQuestionIndex'] = nextIdx;
    
    Object.keys(players).forEach(playerId => {
      updates[`players/${playerId}/currentAnswer`] = null;
    });

    await update(ref(db, `rooms/${roomCode}`), updates);
  };

  const endGame = async () => {
    if (window.confirm("Kết thúc trò chơi và xoá phòng?")) {
      await remove(ref(db, `rooms/${roomCode}`));
      setLocalGameState('SETUP');
      setRoomCode('');
      setRoomData(null);
    }
  };

  // Các hàm phụ trợ tính toán
  const playersList = roomData?.players ? Object.values(roomData.players) : [];
  const answerCount = playersList.filter(p => p.currentAnswer).length;
  // Sắp xếp người chơi để hiển thị Bảng xếp hạng Top 10
  const sortedTop10 = [...playersList].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      {localGameState === 'SETUP' && (
        <div className="max-w-2xl mx-auto glass-card p-8 rounded-2xl text-center mt-12">
          <button onClick={() => navigate('/games')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
            <ArrowLeft className="w-5 h-5" /> Quay lại kho game
          </button>
          
          <h1 className="text-3xl font-bold mb-6 text-emerald-400">Máy Chủ Trò Chơi</h1>
          
          <div className="border-2 border-dashed border-emerald-500/30 p-12 rounded-xl mb-6 hover:bg-emerald-500/10 transition-colors">
            <Upload className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-lg mb-4">Tải lên file Excel chứa câu hỏi</p>
            <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer transition-colors">
              Chọn File Excel
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex gap-6 mb-8 justify-center">
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 w-1/2">
                <label className="block text-gray-400 mb-2 font-bold text-sm">Thời gian mỗi câu (giây)</label>
                <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 text-white text-2xl font-bold text-center py-2 rounded-lg outline-none focus:border-emerald-500 border border-transparent" />
             </div>
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 w-1/2">
                <label className="block text-gray-400 mb-2 font-bold text-sm">Thời gian xem đáp án (giây)</label>
                <input type="number" value={revealTimeLimit} onChange={(e) => setRevealTimeLimit(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 text-white text-2xl font-bold text-center py-2 rounded-lg outline-none focus:border-emerald-500 border border-transparent" />
             </div>
          </div>

          {fileName && (
            <div className="text-emerald-300 bg-emerald-900/30 p-4 rounded-lg mb-6">
              Đã tải: <strong>{fileName}</strong> ({questions.length} câu hỏi)
            </div>
          )}

          <button 
            onClick={createRoom} disabled={questions.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-xl transition-all ${questions.length > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
          >
            TẠO PHÒNG CHƠI
          </button>
        </div>
      )}

      {localGameState === 'LOBBY' && roomData && (
        <div className="max-w-4xl mx-auto text-center mt-12">
          <h2 className="text-2xl text-gray-300 mb-2">Học sinh truy cập vào:</h2>
          <h1 className="text-4xl md:text-6xl font-bold text-emerald-400 mb-8">{window.location.origin}/play</h1>
          
          <div className="bg-slate-800/80 p-8 rounded-3xl mb-8 border border-slate-700 shadow-2xl backdrop-blur-md">
            <p className="text-xl text-gray-400 mb-4">Mã phòng (PIN):</p>
            <p className="text-7xl md:text-9xl font-black tracking-[0.2em] text-white drop-shadow-lg">{roomCode}</p>
          </div>

          <div className="flex justify-between items-center bg-slate-800/50 p-6 rounded-2xl mb-8">
            <div className="flex items-center gap-3 text-2xl font-bold">
              <Users className="w-8 h-8 text-blue-400" />
              <span>{playersList.length} Học sinh</span>
            </div>
            <button onClick={startGame} disabled={playersList.length === 0} className={`px-8 py-4 rounded-xl font-bold text-xl flex items-center gap-2 ${playersList.length > 0 ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30 shadow-lg text-white' : 'bg-slate-700 text-gray-400'}`}>
              <Play className="w-6 h-6" /> Bắt Đầu Trò Chơi
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
            {playersList.map((p, i) => (
              <div key={i} className="bg-slate-700 pr-6 pl-2 py-2 rounded-full text-lg font-bold shadow-md animate-bounce-in flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full overflow-hidden">
                  <img src={p.avatar} alt="avt" className="w-full h-full object-contain" />
                </div>
                {p.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {localGameState === 'PLAYING' && roomData && (
        <div className="max-w-6xl mx-auto mt-4">
          <div className="flex justify-between items-center mb-6">
            <div className="text-2xl font-bold text-gray-400">Câu hỏi {roomData.currentQuestionIndex + 1}/{roomData.questions.length}</div>
            
            {(roomData.status === 'QUESTION' || roomData.status === 'REVEAL') && (
               <div className="text-3xl font-black bg-slate-800 px-6 py-2 rounded-xl border border-slate-700 flex items-center gap-3">
                 ⏳ <span className={timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}>{timeLeft}s</span>
               </div>
            )}

            <div className="flex gap-4">
              <div className="bg-slate-800 px-6 py-2 rounded-lg text-xl font-bold text-emerald-400">
                Đã trả lời: {answerCount}/{playersList.length}
              </div>
              <button onClick={endGame} className="bg-red-900/50 hover:bg-red-600 text-red-200 px-4 py-2 rounded-lg font-bold">Kết thúc</button>
            </div>
          </div>

          {roomData.status === 'QUESTION' && (
            <div className="animate-fade-in">
              <div className="bg-white text-black p-8 md:p-12 rounded-3xl mb-8 text-2xl md:text-4xl font-bold shadow-xl border-b-8 border-gray-300 text-center min-h-[200px] flex items-center justify-center">
                <MathText text={roomData.questions[roomData.currentQuestionIndex].question} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {[
                  { text: roomData.questions[roomData.currentQuestionIndex].optionA, color: 'bg-red-500', shape: 'border-red-700' },
                  { text: roomData.questions[roomData.currentQuestionIndex].optionB, color: 'bg-blue-500', shape: 'border-blue-700' },
                  { text: roomData.questions[roomData.currentQuestionIndex].optionC, color: 'bg-yellow-500', shape: 'border-yellow-700' },
                  { text: roomData.questions[roomData.currentQuestionIndex].optionD, color: 'bg-emerald-500', shape: 'border-emerald-700' }
                ].map((opt, i) => (
                  <div key={i} className={`${opt.color} text-white p-6 md:p-8 rounded-2xl text-xl md:text-3xl font-bold shadow-lg border-b-8 ${opt.shape} flex items-center justify-center text-center`}>
                    <MathText text={opt.text} />
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={revealAnswer} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-2xl shadow-lg flex items-center gap-2">
                  Hiển Thị Đáp Án <ChevronRight />
                </button>
              </div>
            </div>
          )}

          {roomData.status === 'REVEAL' && (
            <div className="animate-fade-in flex flex-col md:flex-row gap-6 min-h-[70vh]">
               {/* Phần hiển thị đáp án và lời giải (Bên trái) */}
               <div className="flex-1 bg-slate-800 p-8 rounded-3xl border-4 border-slate-700 flex flex-col gap-6">
                  <div className="flex flex-col items-center justify-center text-center bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                    <h2 className="text-2xl text-gray-400 mb-2">Đáp án đúng là:</h2>
                    <div className="text-7xl font-black text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]">
                      {['A', 'B', 'C', 'D'][roomData.questions[roomData.currentQuestionIndex].correctOption - 1]}
                    </div>
                  </div>
                  
                  {roomData.questions[roomData.currentQuestionIndex].explanation && (
                    <div className="flex-1 bg-slate-900 p-6 rounded-2xl text-left border border-slate-700 overflow-y-auto max-h-[50vh] shadow-inner">
                      <h3 className="text-2xl font-bold text-emerald-400 mb-4 border-b-2 border-slate-700/50 pb-2 flex items-center gap-3">
                        Lời giải chi tiết
                      </h3>
                      <div className="text-xl leading-[1.8] text-gray-200">
                        <MathText text={roomData.questions[roomData.currentQuestionIndex].explanation} />
                      </div>
                    </div>
                  )}

                  <div className="mt-auto flex justify-end">
                    <button onClick={nextQuestion} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg flex items-center gap-2">
                      Câu Tiếp Theo <ChevronRight />
                    </button>
                  </div>
               </div>

               {/* Bảng xếp hạng Top 10 (Bên phải) */}
               <div className="md:w-1/3 bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl overflow-y-auto max-h-[70vh]">
                 <h3 className="text-2xl font-black text-yellow-400 mb-6 text-center flex items-center justify-center gap-2">
                   <Trophy className="w-8 h-8" /> BẢNG XẾP HẠNG TOP 10
                 </h3>
                 <div className="space-y-3">
                   {sortedTop10.map((p, i) => {
                     let bgClass = 'bg-slate-900/50 text-gray-300';
                     if (i === 0) bgClass = 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black scale-[1.02] shadow-[0_0_15px_rgba(250,204,21,0.5)]';
                     else if (i === 1) bgClass = 'bg-gradient-to-r from-gray-400 to-gray-300 text-black shadow-lg';
                     else if (i === 2) bgClass = 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-lg';

                     return (
                       <div key={i} className={`flex justify-between items-center p-3 rounded-xl font-bold transition-all ${bgClass}`}>
                         <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black ${i < 3 ? 'bg-black/20' : 'bg-slate-800'}`}>
                             #{i+1}
                           </div>
                           <div className={`w-10 h-10 rounded-full overflow-hidden p-0.5 ${i < 3 ? 'bg-white/30' : 'bg-white/10'}`}>
                             <img src={p.avatar} alt="avt" className="w-full h-full object-contain" />
                           </div>
                           <span className="truncate max-w-[120px]">{p.name}</span>
                         </div>
                         <div className="text-lg font-black">{p.score || 0}</div>
                       </div>
                     );
                   })}
                 </div>
               </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default GameHost;
