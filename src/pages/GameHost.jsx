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

// Định nghĩa 5 theme giao diện
const THEMES = [
  {
    id: 'cosmos',
    name: '🌌 Vũ Trụ',
    bg: 'bg-[#020617]',
    bgStyle: { background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e1b4b 100%)', backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(6,182,212,0.1) 0%, transparent 50%)' },
    questionBg: 'bg-slate-800/90 text-white',
    optionColors: ['bg-indigo-600 border-indigo-800', 'bg-violet-600 border-violet-800', 'bg-cyan-600 border-cyan-800', 'bg-purple-600 border-purple-800'],
    timerColor: 'text-cyan-400',
    headerBg: 'bg-slate-900/80 backdrop-blur-md border-b border-slate-700',
    accent: 'text-cyan-400',
    preview: 'from-indigo-900 via-slate-900 to-violet-900'
  },
  {
    id: 'forest',
    name: '🌿 Rừng Xanh',
    bg: 'bg-emerald-950',
    bgStyle: { background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)', backgroundImage: 'radial-gradient(circle at 50% 100%, rgba(16,185,129,0.2) 0%, transparent 60%)' },
    questionBg: 'bg-emerald-900/80 text-white border border-emerald-700',
    optionColors: ['bg-emerald-600 border-emerald-800', 'bg-teal-600 border-teal-800', 'bg-lime-600 border-lime-800', 'bg-green-600 border-green-800'],
    timerColor: 'text-lime-400',
    headerBg: 'bg-emerald-950/80 backdrop-blur-md border-b border-emerald-800',
    accent: 'text-emerald-400',
    preview: 'from-emerald-900 via-teal-900 to-green-900'
  },
  {
    id: 'fire',
    name: '🔥 Lửa Thiêng',
    bg: 'bg-orange-950',
    bgStyle: { background: 'linear-gradient(135deg, #1c0a00 0%, #431407 50%, #7c2d12 100%)', backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(251,146,60,0.3) 0%, transparent 60%)' },
    questionBg: 'bg-orange-900/70 text-white border border-orange-700',
    optionColors: ['bg-red-600 border-red-800', 'bg-orange-600 border-orange-800', 'bg-yellow-600 border-yellow-800', 'bg-rose-600 border-rose-800'],
    timerColor: 'text-orange-400',
    headerBg: 'bg-orange-950/80 backdrop-blur-md border-b border-orange-800',
    accent: 'text-orange-400',
    preview: 'from-red-900 via-orange-900 to-yellow-900'
  },
  {
    id: 'ocean',
    name: '🌊 Đại Dương',
    bg: 'bg-blue-950',
    bgStyle: { background: 'linear-gradient(180deg, #0c1445 0%, #0a2463 50%, #023e8a 100%)', backgroundImage: 'radial-gradient(ellipse at 50% 150%, rgba(56,189,248,0.2) 0%, transparent 60%)' },
    questionBg: 'bg-blue-900/80 text-white border border-blue-700',
    optionColors: ['bg-blue-600 border-blue-800', 'bg-sky-600 border-sky-800', 'bg-cyan-600 border-cyan-800', 'bg-indigo-600 border-indigo-800'],
    timerColor: 'text-sky-400',
    headerBg: 'bg-blue-950/80 backdrop-blur-md border-b border-blue-800',
    accent: 'text-sky-400',
    preview: 'from-blue-900 via-sky-900 to-cyan-900'
  },
  {
    id: 'candy',
    name: '🍭 Kẹo Ngọt',
    bg: 'bg-pink-950',
    bgStyle: { background: 'linear-gradient(135deg, #1a0a1e 0%, #2d1b69 50%, #1e1b4b 100%)', backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(236,72,153,0.2) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(167,139,250,0.2) 0%, transparent 50%)' },
    questionBg: 'bg-pink-900/70 text-white border border-pink-700',
    optionColors: ['bg-pink-600 border-pink-800', 'bg-fuchsia-600 border-fuchsia-800', 'bg-purple-600 border-purple-800', 'bg-rose-600 border-rose-800'],
    timerColor: 'text-fuchsia-400',
    headerBg: 'bg-pink-950/80 backdrop-blur-md border-b border-pink-800',
    accent: 'text-pink-400',
    preview: 'from-pink-900 via-fuchsia-900 to-purple-900'
  },
];

const GameHost = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [fileName, setFileName] = useState('');
  const [localGameState, setLocalGameState] = useState('SETUP');
  const [roomCode, setRoomCode] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);
  const [revealTimeLimit, setRevealTimeLimit] = useState(60);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  
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

  const theme = selectedTheme;

  return (
    <div className="min-h-screen text-white p-4 md:p-8" style={localGameState !== 'SETUP' ? theme.bgStyle : { background: '#0f172a' }}>
      {localGameState === 'SETUP' && (
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate('/games')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
            <ArrowLeft className="w-5 h-5" /> Quay lại kho game
          </button>
          
          <h1 className="text-4xl font-black mb-2 text-emerald-400 text-center">🎮 Tạo Phòng Trò Chơi</h1>
          <p className="text-gray-400 text-center mb-10">Tải file, chọn giao diện và bắt đầu!</p>

          {/* Chọn giao diện */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Chọn Giao Diện Trình Chiếu</h2>
            <div className="grid grid-cols-5 gap-3">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t)}
                  className={`relative rounded-2xl overflow-hidden h-28 transition-all duration-300 border-4 ${
                    selectedTheme.id === t.id
                      ? 'border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                      : 'border-transparent hover:border-white/40 hover:scale-102'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${t.preview}`}></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
                    <span className="text-2xl mb-1">{t.name.split(' ')[0]}</span>
                    <span className="text-white text-xs font-bold drop-shadow-lg">{t.name.split(' ').slice(1).join(' ')}</span>
                  </div>
                  {selectedTheme.id === t.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Upload file */}
            <div className="col-span-2 border-2 border-dashed border-emerald-500/30 p-8 rounded-xl hover:bg-emerald-500/10 transition-colors text-center">
              <Upload className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-lg mb-4 text-gray-300">Tải lên file Excel chứa câu hỏi</p>
              <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer transition-colors inline-block">
                Chọn File Excel
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
              </label>
              {fileName && (
                <div className="mt-4 text-emerald-300 bg-emerald-900/30 p-3 rounded-lg">
                  ✅ <strong>{fileName}</strong> — {questions.length} câu hỏi
                </div>
              )}
            </div>

            {/* Thời gian */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
              <label className="block text-gray-400 mb-2 font-bold text-sm">⏱ Thời gian mỗi câu (giây)</label>
              <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 text-white text-3xl font-bold text-center py-2 rounded-lg outline-none border border-transparent focus:border-emerald-500" />
            </div>
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
              <label className="block text-gray-400 mb-2 font-bold text-sm">👀 Thời gian xem đáp án (giây)</label>
              <input type="number" value={revealTimeLimit} onChange={(e) => setRevealTimeLimit(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 text-white text-3xl font-bold text-center py-2 rounded-lg outline-none border border-transparent focus:border-emerald-500" />
            </div>
          </div>

          <button 
            onClick={createRoom} disabled={questions.length === 0}
            className={`w-full mt-8 py-5 rounded-2xl font-black text-2xl transition-all ${questions.length > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:scale-[1.02]' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
          >
            🚀 TẠO PHÒNG CHƠI
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
               <div className="text-3xl font-black bg-black/30 px-6 py-2 rounded-xl border border-white/10 flex items-center gap-3 backdrop-blur-md">
                 ⏳ <span className={timeLeft <= 10 ? 'text-red-400 animate-pulse' : theme.timerColor}>{timeLeft}s</span>
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
              <div className={`${theme.questionBg} p-8 md:p-12 rounded-3xl mb-8 text-2xl md:text-4xl font-bold shadow-xl border-b-8 border-black/20 text-center min-h-[200px] flex items-center justify-center backdrop-blur-md`}>
                <MathText text={roomData.questions[roomData.currentQuestionIndex].question} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {[
                  { text: roomData.questions[roomData.currentQuestionIndex].optionA, style: theme.optionColors[0] },
                  { text: roomData.questions[roomData.currentQuestionIndex].optionB, style: theme.optionColors[1] },
                  { text: roomData.questions[roomData.currentQuestionIndex].optionC, style: theme.optionColors[2] },
                  { text: roomData.questions[roomData.currentQuestionIndex].optionD, style: theme.optionColors[3] }
                ].map((opt, i) => (
                  <div key={i} className={`${opt.style.split(' ')[0]} text-white p-6 md:p-8 rounded-2xl text-xl md:text-3xl font-bold shadow-lg border-b-8 ${opt.style.split(' ')[1]} flex items-center justify-center text-center`}>
                    <span className="text-white/60 font-black mr-3">{['A','B','C','D'][i]}.</span>
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
