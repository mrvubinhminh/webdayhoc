import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Upload, Play, Users, Trophy, ChevronRight, CheckCircle2, XCircle, Crown, Download } from 'lucide-react';
import { db } from '../firebase';
import { ref, set, update, onValue, remove } from 'firebase/database';
import MathText from '../components/MathText';
import QuestionGuidePanel from '../components/QuestionGuidePanel';

// Định nghĩa 5 theme giao diện
const THEMES = [
  {
    id: 'cosmos',
    name: '🌌 Vũ Trụ',
    bgStyle: { background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e1b4b 100%)', backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(6,182,212,0.1) 0%, transparent 50%)' },
    questionBg: 'bg-slate-800/90 text-white',
    timerColor: 'text-cyan-400',
    preview: 'from-indigo-900 via-slate-900 to-violet-900'
  },
  {
    id: 'forest',
    name: '🌿 Rừng Xanh',
    bgStyle: { background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)', backgroundImage: 'radial-gradient(circle at 50% 100%, rgba(16,185,129,0.2) 0%, transparent 60%)' },
    questionBg: 'bg-emerald-900/80 text-white border border-emerald-700',
    timerColor: 'text-lime-400',
    preview: 'from-emerald-900 via-teal-900 to-green-900'
  },
  {
    id: 'fire',
    name: '🔥 Lửa Thiêng',
    bgStyle: { background: 'linear-gradient(135deg, #1c0a00 0%, #431407 50%, #7c2d12 100%)', backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(251,146,60,0.3) 0%, transparent 60%)' },
    questionBg: 'bg-orange-900/70 text-white border border-orange-700',
    timerColor: 'text-orange-400',
    preview: 'from-red-900 via-orange-900 to-yellow-900'
  },
  {
    id: 'ocean',
    name: '🌊 Đại Dương',
    bgStyle: { background: 'linear-gradient(180deg, #0c1445 0%, #0a2463 50%, #023e8a 100%)', backgroundImage: 'radial-gradient(ellipse at 50% 150%, rgba(56,189,248,0.2) 0%, transparent 60%)' },
    questionBg: 'bg-blue-900/80 text-white border border-blue-700',
    timerColor: 'text-sky-400',
    preview: 'from-blue-900 via-sky-900 to-cyan-900'
  },
  {
    id: 'candy',
    name: '🍭 Kẹo Ngọt',
    bgStyle: { background: 'linear-gradient(135deg, #1a0a1e 0%, #2d1b69 50%, #1e1b4b 100%)', backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(236,72,153,0.2) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(167,139,250,0.2) 0%, transparent 50%)' },
    questionBg: 'bg-pink-900/70 text-white border border-pink-700',
    timerColor: 'text-fuchsia-400',
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
  const [revealTimeLimit, setRevealTimeLimit] = useState(30);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [gameTitle, setGameTitle] = useState('ĐƯỜNG LÊN ĐỈNH OLYMPIA');
  const [roomData, setRoomData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [playMode, setPlayMode] = useState('INDIVIDUAL');
  const [teamCount, setTeamCount] = useState(4);
  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem('gameBgUrl') || '');
  const [bgPresets, setBgPresets] = useState(() => JSON.parse(localStorage.getItem('gameBgPresets') || '[]'));
  const [presetName, setPresetName] = useState('');
  const [showQuestionOnDevice, setShowQuestionOnDevice] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedStatQ, setSelectedStatQ] = useState(null);
  const [enableHighStakes, setEnableHighStakes] = useState(false);

  const currentAudio = useRef(null);

  const playAudio = (url) => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.currentTime = 0;
    }
    if (url) {
      const audio = new Audio(url);
      currentAudio.current = audio;
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  useEffect(() => {
    if (roomCode) {
      const roomRef = ref(db, `rooms/${roomCode}`);
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          if (roomData && roomData.status !== data.status) {
             if (data.status === 'QUESTION') {
               setTimeLeft(data.settings.timeLimit || 60);
             } else if (data.status === 'REVEAL') {
               setTimeLeft(data.settings.revealTimeLimit || 60);
             }
          }
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

  useEffect(() => {
    let timer;
    if ((roomData?.status === 'QUESTION' || roomData?.status === 'REVEAL') && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
             clearInterval(timer);
             if (roomData.status === 'QUESTION') {
                revealAnswer();
             } else if (roomData.status === 'REVEAL') {
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
        
        const typeIndicator = row[1]?.toString().trim().toUpperCase();
        if (typeIndicator === 'TLN') {
          return {
            type: 'TLN',
            question: row[0] || '',
            correctOption: row[2]?.toString().trim() || '',
            explanation: row[3]?.toString() || '',
            image: row[7] || null,
          };
        } else {
          return {
            type: 'TRAC_NGHIEM',
            question: row[0] || '',
            optionA: row[1] || '',
            optionB: row[2] || '',
            optionC: row[3] || '',
            optionD: row[4] || '',
            correctOption: parseInt(row[5]) || 1,
            explanation: row[6] || '',
            image: row[7] || null,
          };
        }
      }).filter(Boolean);

      setQuestions(parsedQuestions);
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws_data = [
      ['Nội dung câu hỏi', 'Đ/A A hoặc TLN', 'Đ/A B hoặc Đáp số', 'Đ/A C hoặc Lời giải', 'Đ/A D', 'Đáp án đúng (1/2/3/4)', 'Lời giải', 'Link ảnh (tùy chọn)'],
      ['Thủ đô của Việt Nam là gì?', 'Hồ Chí Minh', 'Đà Nẵng', 'Hà Nội', 'Huế', 3, 'Hà Nội là thủ đô của Việt Nam', 'https://example.com/hanoi.jpg'],
      ['$2x + 3 = 7$ thì x bằng mấy?', 'TLN', '2', 'Chuyển vế $2x = 4 \\Rightarrow x = 2$', '', '', '', '']
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CauHoi");
    XLSX.writeFile(wb, "Mau_Cau_Hoi.xlsx");
  };

  const createRoom = async () => {
    if (questions.length === 0) {
      alert("Vui lòng tải lên file câu hỏi trước!");
      return;
    }
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.log('Fullscreen error:', err);
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setLocalGameState('LOBBY');
    
    playAudio('https://files.catbox.moe/eopz4f.mp3');
    
    const TEAM_NAMES = [
      "Chiến Binh Toán Học", "Biệt Đội Điểm 10", "Kẻ Huỷ Diệt Bài Tập", "Chuyên Gia Vượt Khó",
      "Học Bá", "Siêu Nhân Tri Thức", "Đội Quân Tinh Nhuệ", "Thợ Săn Điểm A",
      "Mọt Sách Năng Động", "Trí Tuệ Vượt Trội", "Những Ngôi Sao Sáng", "Giáo Sư Tương Lai",
      "IQ Vô Cực", "Chúa Tể Toán Học", "Bậc Thầy Logic", "Kẻ Thách Thức",
      "Anh Hùng Bàn Phím", "Thần Đồng Chăm Chỉ", "Kẻ Gác Đền", "Kỳ Lân Học Tập",
      "Cú Đêm Miệt Mài", "Bộ Não Vĩ Đại", "Chiến Thần Tốc Độ", "Thủ Khoa Tương Lai",
      "Cỗ Máy Chém Đề", "Biệt Đội Khá Bảnh", "Sát Thủ Phòng Thi", "Vua Giải Đố",
      "Học Cụ Mật Mã", "Đỉnh Cao Trí Tuệ"
    ];

    let teams = {};
    if (playMode === 'TEAM') {
      const shuffledNames = TEAM_NAMES.sort(() => 0.5 - Math.random()).slice(0, teamCount);
      for (let i = 1; i <= teamCount; i++) {
        teams[`team_${i}`] = {
          id: `team_${i}`,
          index: i,
          name: shuffledNames[i - 1]
        };
      }
    }

    await set(ref(db, `rooms/${code}`), {
      status: 'LOBBY', 
      currentQuestionIndex: 0,
      questions: questions,
      players: {},
      teams: teams,
      settings: {
        timeLimit: timeLimit,
        revealTimeLimit: revealTimeLimit,
        gameTitle: gameTitle,
        playMode: playMode,
        teamCount: teamCount,
        bgUrl: bgUrl,
        showQuestionOnDevice: showQuestionOnDevice,
        enableHighStakes: enableHighStakes
      }
    });
  };

  const startGame = async () => {
    playAudio('https://files.catbox.moe/amew8w.mp3');

    await update(ref(db, `rooms/${roomCode}`), { status: 'QUESTION' });
    setLocalGameState('PLAYING');
  };

  const revealAnswer = async () => {
    playAudio('https://files.catbox.moe/r1fiz6.mp3');
    const currentQ = roomData.questions[roomData.currentQuestionIndex];
    const players = roomData.players || {};
    const enableHS = roomData.settings?.enableHighStakes;
    const totalQ = roomData.questions?.length || 0;
    const isLastThree = totalQ > 0 && roomData.currentQuestionIndex >= totalQ - 3;

    let wrongCount = 0;
    const updates = {};
    updates['status'] = 'REVEAL';

    Object.keys(players).forEach(playerId => {
      const p = players[playerId];
      if (p.currentAnswer) {
         let isCorrect = false;
         if (currentQ.type === 'TLN') {
            const normalizedPlayerAns = p.currentAnswer.toString().trim().toLowerCase().replace(/,/g, '.');
            const normalizedCorrect = currentQ.correctOption.toString().trim().toLowerCase().replace(/,/g, '.');
            isCorrect = normalizedPlayerAns === normalizedCorrect;
         } else {
            isCorrect = p.currentAnswer === currentQ.correctOption;
         }

         let points = 100;
         if (enableHS && isLastThree && p.usedHighStakes) {
            points = isCorrect ? 300 : -300;
         } else if (isCorrect) {
            points = 100;
         } else {
            points = 0;
            wrongCount++;
         }

         updates[`players/${playerId}/score`] = (p.score || 0) + points;
         updates[`players/${playerId}/usedHighStakes`] = false;
      } else {
         wrongCount++;
      }
    });

    updates[`questions/${roomData.currentQuestionIndex}/wrongCount`] = wrongCount;

    await update(ref(db, `rooms/${roomCode}`), updates);
  };

  const nextQuestion = async () => {
    const nextIdx = roomData.currentQuestionIndex + 1;
    if (nextIdx >= roomData.questions.length) {
      endGame();
      return;
    }
    
    playAudio('https://files.catbox.moe/amew8w.mp3');

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
    if (window.confirm("Bạn có chắc muốn kết thúc và xem tổng kết xếp hạng?")) {
      playAudio('https://files.catbox.moe/12vlpb.mp3');
      await update(ref(db, `rooms/${roomCode}`), { status: 'END' });
    }
  };

  const closeRoom = async () => {
    if (window.confirm("Kết thúc hoàn toàn và xoá phòng chơi này?")) {
      await remove(ref(db, `rooms/${roomCode}`));
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setLocalGameState('SETUP');
      setRoomCode('');
      setRoomData(null);
    }
  };

  const playersList = roomData?.players ? Object.values(roomData.players) : [];
  const answerCount = playersList.filter(p => p.currentAnswer).length;
  const sortedTop10 = [...playersList].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);

  const theme = roomData?.settings?.theme || selectedTheme;
  const currentBgUrl = roomData?.settings?.bgUrl || bgUrl;

  return (
    <div className={`min-h-screen text-white relative ${roomData?.status !== 'END' ? 'p-4 md:p-8' : ''}`} style={localGameState !== 'SETUP' ? theme.bgStyle : { background: '#0f172a' }}>
      {localGameState !== 'SETUP' && currentBgUrl && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${currentBgUrl})`, opacity: 0.6 }}
        />
      )}

      {/* Cần set các div con có z-10 để đè lên background */}
      <div className={`relative z-10 w-full flex flex-col ${roomData?.status !== 'END' ? 'min-h-screen' : 'h-screen'}`}>
      {localGameState === 'SETUP' && (
        <div className="relative w-full min-h-screen">
          <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate('/games')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
              <ArrowLeft className="w-5 h-5" /> Quay lại kho game
            </button>

            <h1 className="text-4xl font-black mb-2 text-emerald-400 text-center">🎮 Tạo Phòng Trò Chơi</h1>
            <p className="text-gray-400 text-center mb-10">Tải file, chọn giao diện và bắt đầu!</p>

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
            <div className="flex flex-col gap-6">
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <label className="block text-gray-400 mb-2 font-bold text-sm">📝 Tên bài trình chiếu</label>
                <input 
                  type="text" 
                  value={gameTitle} 
                  onChange={(e) => setGameTitle(e.target.value)} 
                  className="w-full bg-slate-900 text-white text-xl font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-emerald-500" 
                  placeholder="Nhập tên bài..."
                />
              </div>

              <div className="flex-1 border-2 border-dashed border-emerald-500/30 p-8 rounded-xl hover:bg-emerald-500/10 transition-colors text-center flex flex-col justify-center">
                <Upload className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-lg mb-4 text-gray-300">Tải lên file Excel chứa câu hỏi</p>
                <div className="flex flex-col md:flex-row justify-center gap-4">
                  <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer transition-colors inline-flex items-center justify-center gap-2">
                    <Upload className="w-5 h-5" /> Chọn File Excel
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button onClick={downloadTemplate} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold transition-colors inline-flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" /> Tải File Mẫu
                  </button>
                </div>
                {fileName && (
                  <div className="mt-4 text-emerald-300 bg-emerald-900/30 p-3 rounded-lg border border-emerald-500/30">
                    ✅ <strong>{fileName}</strong> — {questions.length} câu hỏi
                  </div>
                )}
              </div>

              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <label className="block text-gray-400 mb-2 font-bold text-sm">🖼️ Link ảnh nền (tuỳ chọn)</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    value={bgUrl} 
                    onChange={(e) => {
                      setBgUrl(e.target.value);
                      localStorage.setItem('gameBgUrl', e.target.value);
                    }}
                    className="flex-1 w-full bg-slate-900 text-white text-lg font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-emerald-500" 
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-2 mb-3 border-t border-slate-700 pt-4 mt-2">
                   <input
                     type="text"
                     value={presetName}
                     onChange={e => setPresetName(e.target.value)}
                     placeholder="Đặt tên mẫu..."
                     className="flex-1 bg-slate-900 text-white px-3 py-2 rounded-lg outline-none border border-transparent focus:border-emerald-500"
                   />
                   <button 
                     onClick={() => {
                        if (!bgUrl || !presetName) return;
                        const newPresets = [...bgPresets, { name: presetName, url: bgUrl }];
                        setBgPresets(newPresets);
                        localStorage.setItem('gameBgPresets', JSON.stringify(newPresets));
                        setPresetName('');
                     }}
                     className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap"
                   >
                     Lưu Mẫu
                   </button>
                </div>
                {bgPresets.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {bgPresets.map((p, i) => (
                      <div key={i} className="flex items-center bg-slate-700 rounded-lg overflow-hidden border border-slate-600">
                        <button 
                          onClick={() => {
                             setBgUrl(p.url);
                             localStorage.setItem('gameBgUrl', p.url);
                          }}
                          className="px-3 py-1.5 text-sm font-semibold hover:bg-slate-600 transition-colors"
                        >
                          {p.name}
                        </button>
                        <button
                          onClick={() => {
                             const newPresets = bgPresets.filter((_, idx) => idx !== i);
                             setBgPresets(newPresets);
                             localStorage.setItem('gameBgPresets', JSON.stringify(newPresets));
                          }}
                          className="px-2 py-1.5 text-red-400 hover:bg-red-500/20 transition-colors border-l border-slate-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 h-full flex flex-col justify-center">
                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">⏱ Thời gian mỗi câu (giây)</label>
                <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 text-white text-3xl font-black text-center py-3 rounded-lg outline-none border border-transparent focus:border-emerald-500 mb-6" />
                
                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">👀 Thời gian xem đáp án (giây)</label>
                <input type="number" value={revealTimeLimit} onChange={(e) => setRevealTimeLimit(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 text-white text-3xl font-black text-center py-3 rounded-lg outline-none border border-transparent focus:border-emerald-500 mb-6" />

                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-gray-400 mb-2 font-bold text-sm text-center">Chế độ chơi</label>
                    <select value={playMode} onChange={e => setPlayMode(e.target.value)} className="w-full bg-slate-900 text-white text-lg font-bold text-center py-3 rounded-lg outline-none border border-transparent focus:border-emerald-500">
                      <option value="INDIVIDUAL">Cá nhân</option>
                      <option value="TEAM">Theo nhóm</option>
                    </select>
                  </div>
                  {playMode === 'TEAM' && (
                    <div className="flex-1">
                      <label className="block text-gray-400 mb-2 font-bold text-sm text-center">Số nhóm (1-12)</label>
                      <input type="number" min="1" max="12" value={teamCount} onChange={(e) => setTeamCount(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))} className="w-full bg-slate-900 text-white text-lg font-bold text-center py-3 rounded-lg outline-none border border-transparent focus:border-emerald-500" />
                    </div>
                  )}
                </div>

                {playMode === 'INDIVIDUAL' && (
                  <label className="flex items-center gap-3 cursor-pointer mt-4 bg-slate-900 p-4 rounded-lg border border-transparent hover:border-emerald-500/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={showQuestionOnDevice}
                      onChange={(e) => setShowQuestionOnDevice(e.target.checked)}
                      className="w-5 h-5 accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-gray-300 font-bold select-none text-sm">
                      Hiển thị nội dung câu hỏi trên thiết bị học sinh
                    </span>
                  </label>
                )}

                <label className="flex items-center gap-3 cursor-pointer mt-4 bg-slate-900 p-4 rounded-lg border border-transparent hover:border-yellow-500/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={enableHighStakes}
                    onChange={(e) => setEnableHighStakes(e.target.checked)}
                    className="w-5 h-5 accent-yellow-500 cursor-pointer"
                  />
                  <span className="text-gray-300 font-bold select-none text-sm">
                    ⭐ Chế độ ngôi sao hy vọng (3 câu cuối: nhân 3x nếu đúng, trừ 3x nếu sai)
                  </span>
                </label>

                {playMode === 'TEAM' && (
                  <button onClick={() => window.open('/print-qr', '_blank')} className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg w-full flex items-center justify-center gap-2 transition-colors">
                    🖨️ In thẻ QR Đáp Án
                  </button>
                )}

                <button onClick={() => window.open('https://chuyendoijson.vercel.app/', '_blank')} className="mt-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg w-full flex items-center justify-center gap-2 transition-colors">
                  🔄 JSON → Excel
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 mb-8 space-y-4">
            <QuestionGuidePanel />

            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-4">🔧 Công Cụ Hỗ Trợ</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button onClick={() => navigate('/question-tester')} className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  🧪 Test Câu Hỏi
                </button>
                <button onClick={() => window.open('https://chuyendoijson.vercel.app/', '_blank')} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  🔄 JSON ↔ Excel
                </button>
                <button onClick={() => window.open('/scanner', '_blank')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  📱 QR Scanner
                </button>
              </div>
            </div>
          </div>

          </div>

          <button
            onClick={createRoom} disabled={questions.length === 0 || !gameTitle.trim()}
            className={`absolute top-6 right-6 px-8 py-4 rounded-2xl font-black text-xl transition-all flex items-center gap-2 ${questions.length > 0 && gameTitle.trim() ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
          >
            🚀 TẠO PHÒNG
          </button>
        </div>
      )}

      {localGameState === 'LOBBY' && roomData && (() => {
        const playUrl = `https://webdayhoc.vercel.app/play?pin=${roomCode}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(playUrl)}&bgcolor=ffffff&color=000000&margin=10`;
        return (
          <div className="w-full min-h-screen relative flex flex-col z-10">
            {/* Tiêu đề */}
            <div className="text-center pt-16 pb-4 animate-fade-in shrink-0">
              <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-wide uppercase" style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.3)' }}>
                {roomData.settings.gameTitle || 'TRÒ CHƠI DẠY HỌC'}
              </h1>
              <h2 className="text-lg text-yellow-100/80 mt-2 font-semibold tracking-widest uppercase">
                Quét mã QR hoặc nhập PIN để tham gia
              </h2>
            </div>

            {/* Bố cục chính: QR bên trái, danh sách bên phải */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 px-6 pb-6 overflow-hidden">
              {/* BÊN TRÁI - QR Code lớn + PIN */}
              <div className="md:w-[45%] shrink-0 flex flex-col items-center justify-center gap-6">
                <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center gap-4">
                  <p className="text-yellow-400 text-xl font-black uppercase tracking-widest text-center w-full border-b border-white/10 pb-3">Quét Mã QR</p>
                  <div className="bg-white p-4 rounded-3xl shadow-2xl">
                    <img src={qrUrl} alt="QR Code" className="w-[280px] h-[280px] md:w-[360px] md:h-[360px] rounded-2xl" />
                  </div>
                  <p className="text-xs text-gray-400 font-mono bg-black/50 px-4 py-2 rounded-full">{playUrl}</p>
                </div>

                <div className="bg-black/40 backdrop-blur-xl rounded-3xl px-10 py-6 border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] text-center">
                  <p className="text-yellow-400 text-lg font-black uppercase tracking-widest mb-2">Mã Phòng (PIN)</p>
                  <div className="text-7xl md:text-8xl font-black tracking-[0.15em] text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.8)] select-all">
                    {roomCode}
                  </div>
                </div>
              </div>

              {/* BÊN PHẢI - Danh sách học sinh + Nút bắt đầu */}
              <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-3 text-2xl font-black text-white">
                    <div className="bg-blue-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.6)]"><Users className="w-7 h-7 text-white" /></div>
                    <span>{playersList.length} Học sinh</span>
                  </div>
                  <button
                    onClick={startGame}
                    disabled={playersList.length === 0}
                    className={`px-8 py-4 rounded-2xl font-black text-xl flex items-center gap-3 transition-all ${
                      playersList.length > 0
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)] text-white hover:scale-105'
                        : 'bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Play className="w-7 h-7" /> BẮT ĐẦU
                  </button>
                </div>

                {/* Danh sách học sinh */}
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="flex flex-wrap gap-3 content-start">
                    {playersList.length === 0 && (
                      <p className="text-gray-400 text-xl italic w-full text-center py-12 animate-pulse">Đang chờ học sinh tham gia...</p>
                    )}
                    {playersList.map((p, i) => (
                      <div key={i} className="bg-white/10 pr-5 pl-2 py-2 rounded-full text-base font-bold shadow-lg flex items-center gap-2.5 border border-white/20 backdrop-blur-sm animate-bounce-in hover:bg-white/20 transition-colors cursor-default">
                        <div className="w-9 h-9 bg-black/30 rounded-full overflow-hidden p-0.5 shadow-inner">
                          <img src={p.avatar} alt="avt" className="w-full h-full object-contain" />
                        </div>
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {localGameState === 'PLAYING' && roomData && (
        <div className="w-full px-4 mt-4">
          <div className="flex justify-end items-center mb-6">
            {(roomData.status === 'QUESTION' || roomData.status === 'REVEAL') && (
               <div className="text-3xl font-black bg-black/30 px-6 py-2 rounded-xl border border-white/10 flex items-center gap-3 backdrop-blur-md mr-auto">
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

          {roomData.status === 'QUESTION' && (() => {
            const q = roomData.questions[roomData.currentQuestionIndex];
            const hasImage = q.image && q.image.trim();
            return (
              <div className="animate-fade-in">
                <div className={`${theme.questionBg} rounded-3xl mb-6 shadow-xl border-b-8 border-black/20 backdrop-blur-md overflow-hidden ${
                  hasImage ? 'flex flex-row min-h-[260px]' : 'p-8 md:p-10 text-2xl md:text-4xl font-bold text-center flex items-center justify-center min-h-[200px]'
                }`}>
                  {hasImage ? (
                    <>
                      <div className="flex-1 flex items-center justify-center p-8 text-2xl md:text-3xl font-bold text-left border-r border-white/10">
                        <MathText text={q.question} />
                      </div>
                      <div className="flex-1 flex items-center justify-center p-4 bg-black/20">
                        <img src={q.image.trim()} alt="Hình minh họa" className="max-h-64 object-contain rounded-2xl shadow-lg" onError={(e) => e.target.style.display='none'} />
                      </div>
                    </>
                  ) : (
                    <MathText text={q.question} />
                  )}
                </div>

                {q.type !== 'TLN' && (
                  <div className="grid grid-cols-2 gap-4 md:gap-5">
                    {[
                      { text: q.optionA, style: 'bg-red-500 border-red-700' },
                      { text: q.optionB, style: 'bg-blue-500 border-blue-700' },
                      { text: q.optionC, style: 'bg-yellow-500 border-yellow-700' },
                      { text: q.optionD, style: 'bg-emerald-500 border-emerald-700' }
                    ].map((opt, i) => (
                      <div key={i} className={`${opt.style.split(' ')[0]} text-white p-5 md:p-7 rounded-2xl text-xl md:text-3xl font-bold shadow-lg border-b-8 ${opt.style.split(' ')[1]} flex items-center justify-center text-center gap-3`}>
                        <span className="text-white/60 font-black shrink-0">{['A','B','C','D'][i]}.</span>
                        <MathText text={opt.text} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button onClick={revealAnswer} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-2xl shadow-lg flex items-center gap-2">
                    Hiển Thị Đáp Án <ChevronRight />
                  </button>
                </div>
              </div>
            );
          })()}

          {roomData.status === 'REVEAL' && (
            <div className="animate-fade-in flex flex-col md:flex-row gap-6 min-h-[70vh]">
               <div className="flex-1 bg-slate-800 p-8 rounded-3xl border-4 border-slate-700 flex flex-col gap-6">
                  <div className="flex flex-col items-center justify-center text-center bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                    <h2 className="text-2xl text-gray-400 mb-2">Đáp án đúng là:</h2>
                    <div className="text-5xl md:text-7xl font-black text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]">
                      {roomData.questions[roomData.currentQuestionIndex].type === 'TLN' 
                        ? <MathText text={roomData.questions[roomData.currentQuestionIndex].correctOption} />
                        : ['A', 'B', 'C', 'D'][roomData.questions[roomData.currentQuestionIndex].correctOption - 1]
                      }
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
                         <div className="flex items-center gap-3 w-full">
                           <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black ${i < 3 ? 'bg-black/20' : 'bg-slate-800'}`}>
                             #{i+1}
                           </div>
                           <div className={`w-10 h-10 rounded-full overflow-hidden p-0.5 shrink-0 ${i < 3 ? 'bg-white/30' : 'bg-white/10'}`}>
                             <img src={p.avatar} alt="avt" className="w-full h-full object-contain" />
                           </div>
                           <span className="truncate flex-1 min-w-0 pr-2">{p.name}</span>
                           <div className="text-lg font-black shrink-0">{p.score || 0}</div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
            </div>
          )}

          {roomData.status === 'END' && (() => {
             const top3 = sortedTop10.slice(0, 3);
             return (
                <div className="w-full max-w-5xl mx-auto px-4 animate-fade-in relative z-20 h-screen flex flex-col pt-12">
                  {/* Tiêu đề trên cao */}
                  <div className="shrink-0">
                    <h1 className="text-4xl md:text-6xl font-black text-center text-yellow-400 drop-shadow-[0_0_40px_rgba(250,204,21,1)] uppercase animate-pulse">
                       🏆 TỔNG KẾT BẢNG XẾP HẠNG 🏆
                    </h1>
                  </div>

                  {/* Bục xếp hạng trung tâm */}
                  <div className="flex-1 flex justify-center items-center gap-4 md:gap-8 mt-12 mb-8">
                     {top3[1] && (
                        <div className="flex flex-col items-center animate-bounce-in" style={{ animationDelay: '0.2s' }}>
                           <div className="text-2xl font-bold text-gray-300 mb-2 w-[100px] md:w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-center">{top3[1].name}</div>
                           <div className="w-20 h-20 bg-gray-300 rounded-full p-1 mb-2 shadow-[0_0_15px_rgba(209,213,219,0.5)] relative">
                              <img src={top3[1].avatar} className="w-full h-full object-contain rounded-full bg-slate-800" alt="avt" />
                           </div>
                           <div className="w-24 h-40 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-xl flex items-center justify-center text-5xl font-black text-white shadow-2xl">2</div>
                           <div className="text-xl font-bold mt-3 text-gray-300">{top3[1].score || 0} đ</div>
                        </div>
                     )}
                     
                     {top3[0] && (
                        <div className="flex flex-col items-center animate-bounce-in z-10 mx-2">
                           <Crown className="w-20 h-20 text-yellow-400 mb-[-10px] drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-pulse" />
                           <div className="text-3xl font-black text-yellow-400 mb-2 w-[120px] md:w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-center">{top3[0].name}</div>
                           <div className="w-28 h-28 bg-yellow-400 rounded-full p-1.5 mb-2 shadow-[0_0_30px_rgba(250,204,21,0.8)] relative">
                              <img src={top3[0].avatar} className="w-full h-full object-contain rounded-full bg-slate-800" alt="avt" />
                           </div>
                           <div className="w-32 h-56 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-xl flex items-center justify-center text-7xl font-black text-white shadow-2xl">1</div>
                           <div className="text-2xl font-black mt-3 text-yellow-400">{top3[0].score || 0} đ</div>
                        </div>
                     )}

                     {top3[2] && (
                        <div className="flex flex-col items-center animate-bounce-in" style={{ animationDelay: '0.4s' }}>
                           <div className="text-2xl font-bold text-amber-600 mb-2 w-[100px] md:w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-center">{top3[2].name}</div>
                           <div className="w-20 h-20 bg-amber-600 rounded-full p-1 mb-2 shadow-[0_0_15px_rgba(217,119,6,0.5)] relative">
                              <img src={top3[2].avatar} className="w-full h-full object-contain rounded-full bg-slate-800" alt="avt" />
                           </div>
                           <div className="w-24 h-32 bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-xl flex items-center justify-center text-5xl font-black text-white shadow-2xl">3</div>
                           <div className="text-xl font-bold mt-3 text-amber-600">{top3[2].score || 0} đ</div>
                        </div>
                     )}
                  </div>

                  {/* Các nút bấm sát mép dưới */}
                  <div className="shrink-0 flex flex-col items-center gap-4 pb-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
                     <button onClick={() => setShowStatsModal(true)} className="bg-slate-800/80 hover:bg-slate-700 px-8 py-4 rounded-3xl border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)] flex items-center justify-center gap-3 transition-colors">
                        <XCircle className="w-8 h-8 text-red-400" />
                        <span className="text-2xl font-bold text-red-400">Xem Thống Kê Câu Sai</span>
                     </button>

                     <button onClick={closeRoom} className="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-3">
                        Thoát & Xoá Phòng
                     </button>
                  </div>

                  {/* Modal Thống kê */}
                  {showStatsModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative animate-bounce-in">
                        <button onClick={() => setShowStatsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-slate-800 rounded-full p-2 z-10 transition-colors">
                           ✕
                        </button>
                        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                           <h2 className="text-3xl font-black text-white flex items-center gap-3">
                              <XCircle className="text-red-500" /> Thống Kê Các Câu Sai
                           </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                           {(() => {
                             const wrongQs = [...roomData.questions]
                               .map((q, idx) => ({ ...q, index: idx }))
                               .filter(q => q.wrongCount > 0)
                               .sort((a, b) => b.wrongCount - a.wrongCount);
                             
                             if (wrongQs.length === 0) return <div className="text-center text-emerald-400 text-2xl py-10 font-bold">Tuyệt vời! Không có câu nào sai! 🎉</div>;
                             
                             return wrongQs.map((q, i) => (
                               <div key={i} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                                 <div 
                                   className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-700/50 transition-colors"
                                   onClick={() => setSelectedStatQ(selectedStatQ === q.index ? null : q.index)}
                                 >
                                    <div className="font-bold text-xl text-gray-300">Câu hỏi số {q.index + 1}</div>
                                    <div className="flex items-center gap-4">
                                       <div className="text-red-400 font-bold bg-red-900/30 px-3 py-1 rounded-lg">{q.wrongCount} học sinh sai</div>
                                       <ChevronRight className={`w-6 h-6 transition-transform ${selectedStatQ === q.index ? 'rotate-90 text-emerald-400' : 'text-gray-500'}`} />
                                    </div>
                                 </div>
                                 {selectedStatQ === q.index && (
                                   <div className="p-6 bg-slate-900/80 border-t border-slate-700">
                                      <div className="text-xl mb-4 text-white"><MathText text={q.question} /></div>
                                      {q.image && <img src={q.image} className="max-h-40 rounded-lg mb-4" alt="minh hoạ" />}
                                      <div className="text-emerald-400 font-bold mt-4">
                                        Đáp án đúng: {q.type === 'TLN' ? <MathText text={q.correctOption} /> : ['A', 'B', 'C', 'D'][q.correctOption - 1]}
                                      </div>
                                   </div>
                                 )}
                               </div>
                             ));
                           })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
             );
          })()}

        </div>
      )}
      </div>
    </div>
  );
};

export default GameHost;
