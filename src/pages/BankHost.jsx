import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Upload, Play, Users, ChevronRight, CheckCircle2, XCircle, Crown, Download, TrendingUp } from 'lucide-react';
import { db } from '../firebase';
import { ref, set, update, onValue, remove, get } from 'firebase/database';
import MathText from '../components/MathText';
import QuestionGuidePanel from '../components/QuestionGuidePanel';
import CapitalChart, { TEAM_COLORS } from '../components/CapitalChart';
import { BET_LEVELS, DEFAULT_BET_TIME, DEFAULT_CAPITAL, BAILOUT, betAmountOf } from '../data/bankRules';

const THEMES = [
  {
    id: 'vault',
    name: '🏦 Kho Bạc',
    bgStyle: { background: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 45%, #422006 100%)', backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(234,179,8,0.12) 0%, transparent 55%)' },
    questionBg: 'bg-stone-900/90 text-white border border-amber-800/60',
    timerColor: 'text-amber-400',
    preview: 'from-amber-900 via-stone-900 to-yellow-900'
  },
  {
    id: 'cosmos',
    name: '🌌 Vũ Trụ',
    bgStyle: { background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e1b4b 100%)', backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(99,102,241,0.15) 0%, transparent 50%)' },
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
    bgStyle: { background: 'linear-gradient(135deg, #1a0a1e 0%, #2d1b69 50%, #1e1b4b 100%)', backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(236,72,153,0.2) 0%, transparent 50%)' },
    questionBg: 'bg-pink-900/70 text-white border border-pink-700',
    timerColor: 'text-fuchsia-400',
    preview: 'from-pink-900 via-fuchsia-900 to-purple-900'
  },
];

const HOST_ROOM_KEY = 'bankHostRoom';

const BankHost = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [fileName, setFileName] = useState('');
  const [localGameState, setLocalGameState] = useState('SETUP');
  const [roomCode, setRoomCode] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);
  const [revealTimeLimit, setRevealTimeLimit] = useState(25);
  const [betTime, setBetTime] = useState(DEFAULT_BET_TIME);
  const [startingCapital, setStartingCapital] = useState(DEFAULT_CAPITAL);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [gameTitle, setGameTitle] = useState('NGÂN HÀNG TRI THỨC');
  const [roomData, setRoomData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [playMode, setPlayMode] = useState('TEAM');
  const [teamCount, setTeamCount] = useState(4);
  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem('bankBgUrl') || '');
  const [showQuestionOnDevice, setShowQuestionOnDevice] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedStatQ, setSelectedStatQ] = useState(null);

  const currentAudio = useRef(null);

  const playAudio = (url) => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.currentTime = 0;
    }
    if (url) {
      const audio = new Audio(url);
      currentAudio.current = audio;
      audio.play().catch(() => {});
    }
  };

  // Câu nào có thời gian riêng ở cột 9 của Excel thì ưu tiên dùng
  const secondsFor = (status, settings, data) => {
    if (status === 'QUESTION') {
      const q = data?.questions?.[data.currentQuestionIndex];
      return q?.timeLimit || settings?.timeLimit || 60;
    }
    if (status === 'REVEAL') return settings?.revealTimeLimit || 25;
    if (status === 'BET') return settings?.betTime || DEFAULT_BET_TIME;
    return 0;
  };

  useEffect(() => {
    if (!roomCode) return;
    const roomRef = ref(db, `bankRooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const changed = !roomData || roomData.status !== data.status;
      if (changed) setTimeLeft(secondsFor(data.status, data.settings, data));
      setRoomData(data);
    });
    return () => unsubscribe();
  }, [roomCode, roomData]);

  useEffect(() => {
    let timer;
    const running = ['BET', 'QUESTION', 'REVEAL'].includes(roomData?.status);
    if (!roomData?.paused && running && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (roomData.status === 'BET') openQuestion();
            else if (roomData.status === 'QUESTION') revealAnswer();
            else if (roomData.status === 'REVEAL') nextQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [roomData?.status, roomData?.paused, timeLeft]);

  const togglePause = async () => {
    if (!roomCode) return;
    await update(ref(db, `bankRooms/${roomCode}`), { paused: !roomData?.paused });
  };

  // Mở / đóng biểu đồ tài sản toàn màn hình, đồng hồ dừng theo
  const toggleChart = async (open) => {
    if (!roomCode) return;
    const next = open ?? !roomData?.chartOpen;
    await update(ref(db, `bankRooms/${roomCode}`), { chartOpen: next, paused: next });
  };

  useEffect(() => {
    if (!roomCode || !roomData?.scanRequestReveal) return;
    if (roomData.status !== 'QUESTION') return;
    update(ref(db, `bankRooms/${roomCode}`), { scanRequestReveal: false });
    revealAnswer();
  }, [roomData?.scanRequestReveal, roomData?.status, roomCode]);

  // Phòng cũ còn sống thì mời giáo viên nối lại
  const [resumeRoom, setResumeRoom] = useState(null);
  useEffect(() => {
    let code = null;
    try { code = localStorage.getItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (!code) return;
    get(ref(db, `bankRooms/${code}`)).then(snap => {
      if (snap.exists()) setResumeRoom(code);
      else { try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ } }
    }).catch(() => {});
  }, []);

  const resumeHosting = () => {
    if (!resumeRoom) return;
    setRoomCode(resumeRoom);
    setLocalGameState('PLAYING');
    setResumeRoom(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const parsed = data.slice(1).map(row => {
        if (!row[0]) return null;
        const typeIndicator = row[1]?.toString().trim().toUpperCase();
        if (typeIndicator === 'TLN') {
          return {
            type: 'TLN',
            question: row[0] || '',
            correctOption: row[2]?.toString().trim() || '',
            explanation: row[3]?.toString() || '',
            image: row[7] || null,
          timeLimit: parseInt(row[8]) > 0 ? parseInt(row[8]) : null,
          };
        }
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
          timeLimit: parseInt(row[8]) > 0 ? parseInt(row[8]) : null,
        };
      }).filter(Boolean);

      setQuestions(parsed);
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws_data = [
      ['Nội dung câu hỏi', 'Đ/A A hoặc TLN', 'Đ/A B hoặc Đáp số', 'Đ/A C hoặc Lời giải', 'Đ/A D', 'Đáp án đúng (1/2/3/4)', 'Lời giải', 'Link ảnh (tùy chọn)', 'Thời gian riêng (giây, tùy chọn)'],
      ['Thủ đô của Việt Nam là gì?', 'Hồ Chí Minh', 'Đà Nẵng', 'Hà Nội', 'Huế', 3, 'Hà Nội là thủ đô của Việt Nam', '', 30],
      ['$2x + 3 = 7$ thì x bằng mấy?', 'TLN', '2', 'Chuyển vế $2x = 4 \\Rightarrow x = 2$', '', '', '', '', 90]
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
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    } catch { /* trình duyệt chặn thì thôi */ }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    try { localStorage.setItem(HOST_ROOM_KEY, code); } catch { /* không sao */ }
    setLocalGameState('LOBBY');
    playAudio('https://files.catbox.moe/eopz4f.mp3');

    const TEAM_NAMES = [
      "Quỹ Đầu Tư Sao Kim", "Tập Đoàn Trí Tuệ", "Cổ Đông Vàng", "Sàn Giao Dịch Alpha",
      "Nhà Đầu Tư Thông Thái", "Quỹ Mạo Hiểm", "Ngân Hàng Trung Ương", "Kho Bạc Bạch Kim",
      "Tổ Hợp Kim Cương", "Liên Minh Tài Chính", "Đế Chế Cổ Phiếu", "Quỹ Hưu Trí Vui Vẻ",
      "Tay To Phố Wall", "Cá Mập Chứng Khoán", "Đội Săn Cổ Tức", "Câu Lạc Bộ Triệu Phú",
      "Hội Đồng Quản Trị", "Quỹ Tăng Trưởng Xanh", "Ngân Khố Hoàng Gia", "Nhóm Bảo Chứng"
    ];

    let teams = {};
    if (playMode === 'TEAM') {
      const shuffled = [...TEAM_NAMES].sort(() => 0.5 - Math.random()).slice(0, teamCount);
      for (let i = 1; i <= teamCount; i++) {
        teams[`team_${i}`] = { id: `team_${i}`, index: i, name: shuffled[i - 1] };
      }
    }

    await set(ref(db, `bankRooms/${code}`), {
      status: 'LOBBY',
      currentQuestionIndex: 0,
      questions,
      players: {},
      teams,
      settings: {
        timeLimit,
        revealTimeLimit,
        betTime,
        startingCapital,
        gameTitle,
        playMode,
        teamCount,
        bgUrl,
        showQuestionOnDevice
      }
    });
  };

  const startGame = async () => {
    playAudio('https://files.catbox.moe/amew8w.mp3');
    await update(ref(db, `bankRooms/${roomCode}`), { status: 'BET' });
    setLocalGameState('PLAYING');
  };

  // Hết giờ đặt cược → chốt mức cho ai chưa chọn rồi mở câu hỏi
  const openQuestion = async () => {
    playAudio('https://files.catbox.moe/amew8w.mp3');
    const players = roomData?.players || {};
    const updates = { status: 'QUESTION' };
    Object.values(players).forEach(p => {
      if (!p.betPercent) updates[`players/${p.id}/betPercent`] = 10; // không chọn = mức an toàn
    });
    await update(ref(db, `bankRooms/${roomCode}`), updates);
  };

  const revealAnswer = async () => {
    playAudio('https://files.catbox.moe/r1fiz6.mp3');
    const currentQ = roomData.questions[roomData.currentQuestionIndex];
    const players = roomData.players || {};
    const qIdx = roomData.currentQuestionIndex;

    let wrongCount = 0;
    const updates = { status: 'REVEAL' };

    Object.values(players).forEach(p => {
      const percent = p.betPercent || 10;
      const stake = betAmountOf(p.capital, percent);

      let isCorrect = false;
      if (p.currentAnswer) {
        if (currentQ.type === 'TLN') {
          const a = p.currentAnswer.toString().trim().toLowerCase().replace(/,/g, '.');
          const b = currentQ.correctOption.toString().trim().toLowerCase().replace(/,/g, '.');
          isCorrect = a === b;
        } else {
          isCorrect = p.currentAnswer === currentQ.correctOption;
        }
      }
      if (!isCorrect) wrongCount++;

      let capital = (p.capital || 0) + (isCorrect ? stake : -stake);
      let bailedOut = false;
      if (capital < BAILOUT) { capital = BAILOUT; bailedOut = true; } // không ai bị loại

      updates[`players/${p.id}/capital`] = capital;
      updates[`players/${p.id}/lastStake`] = stake;
      updates[`players/${p.id}/lastDelta`] = isCorrect ? stake : -stake;
      updates[`players/${p.id}/lastCorrect`] = isCorrect;
      updates[`players/${p.id}/bailedOut`] = bailedOut;
      updates[`players/${p.id}/history/${qIdx}`] = capital;
      updates[`players/${p.id}/bets/${qIdx}`] = percent;
    });

    updates[`questions/${qIdx}/wrongCount`] = wrongCount;
    await update(ref(db, `bankRooms/${roomCode}`), updates);
  };

  const nextQuestion = async () => {
    const nextIdx = roomData.currentQuestionIndex + 1;
    if (nextIdx >= roomData.questions.length) { endGame(); return; }

    playAudio('https://files.catbox.moe/amew8w.mp3');
    const players = roomData.players || {};
    const updates = {
      status: 'BET',
      currentQuestionIndex: nextIdx,
      chartOpen: false,
      paused: false
    };
    Object.values(players).forEach(p => {
      updates[`players/${p.id}/currentAnswer`] = null;
      updates[`players/${p.id}/betPercent`] = null;
    });
    await update(ref(db, `bankRooms/${roomCode}`), updates);
  };

  const endGame = async () => {
    playAudio('https://files.catbox.moe/12vlpb.mp3');
    await update(ref(db, `bankRooms/${roomCode}`), { status: 'END', chartOpen: false, paused: false });
  };

  const closeRoom = async () => {
    if (!window.confirm("Kết thúc hoàn toàn và xoá phòng chơi này?")) return;
    await remove(ref(db, `bankRooms/${roomCode}`));
    try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setLocalGameState('SETUP');
    setRoomCode('');
    setRoomData(null);
  };

  const playersList = roomData?.players ? Object.values(roomData.players) : [];
  const answerCount = playersList.filter(p => p.currentAnswer).length;
  const betCount = playersList.filter(p => p.betPercent).length;
  const ranked = [...playersList].sort((a, b) => (b.capital || 0) - (a.capital || 0));
  const theme = roomData?.settings?.theme || selectedTheme;
  const currentBgUrl = roomData?.settings?.bgUrl || bgUrl;
  const teamIndexOf = (id) => roomData?.teams?.[id]?.index || (playersList.findIndex(p => p.id === id) + 1);
  const startCap = roomData?.settings?.startingCapital || startingCapital;

  // Câu nào lớp cược mạnh nhất / dè dặt nhất — dữ liệu chẩn đoán cho giáo viên
  const betAnalysis = (roomData?.questions || []).map((q, idx) => {
    const bets = playersList.map(p => p.bets?.[idx]).filter(Boolean);
    const avg = bets.length ? bets.reduce((s, v) => s + v, 0) / bets.length : null;
    return { idx, avg, wrongCount: q.wrongCount || 0, answered: bets.length };
  }).filter(r => r.avg !== null);

  return (
    <div className={`min-h-screen text-white relative ${roomData?.status !== 'END' ? 'p-4 md:p-8' : ''}`} style={localGameState !== 'SETUP' ? theme.bgStyle : { background: '#0f172a' }}>
      {localGameState !== 'SETUP' && currentBgUrl && (
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${currentBgUrl})`, opacity: 0.5 }} />
      )}

      <div className={`relative z-10 w-full flex flex-col ${roomData?.status !== 'END' ? 'min-h-screen' : 'h-screen'}`}>

      {/* ================= MÀN TẠO PHÒNG ================= */}
      {localGameState === 'SETUP' && (
        <div className="relative w-full min-h-screen">
          <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate('/games')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
              <ArrowLeft className="w-5 h-5" /> Quay lại kho game
            </button>

            <h1 className="text-4xl font-black mb-2 text-amber-400 text-center">🏦 Ngân Hàng Tri Thức</h1>
            <p className="text-gray-400 text-center mb-2">Cược điểm trước khi thấy câu hỏi — đúng ăn đậm, sai mất đau</p>
            <p className="text-amber-300/80 text-center text-sm mb-10">Học sinh phải tự trả lời: “Chủ đề này mình chắc tới đâu?”</p>

            {resumeRoom && (
              <div className="mb-8 bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-300">🔌 Phòng {resumeRoom} vẫn đang chạy</h3>
                  <p className="text-gray-300 text-sm mt-1">Vốn và tiến trình còn nguyên trên máy chủ. Nối lại để tiếp tục đúng chỗ đang dở.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={resumeHosting} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black">Nối lại phòng</button>
                  <button
                    onClick={() => { try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ } setResumeRoom(null); }}
                    className="bg-slate-800 hover:bg-slate-700 text-gray-300 px-4 py-3 rounded-xl font-bold"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 text-center">Chọn Giao Diện Trình Chiếu</h2>
              <div className="grid grid-cols-5 gap-3">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTheme(t)}
                    className={`relative rounded-2xl overflow-hidden h-28 transition-all duration-300 border-4 ${
                      selectedTheme.id === t.id ? 'border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'border-transparent hover:border-white/40'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${t.preview}`} />
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
                      <span className="text-2xl mb-1">{t.name.split(' ')[0]}</span>
                      <span className="text-white text-xs font-bold drop-shadow-lg">{t.name.split(' ').slice(1).join(' ')}</span>
                    </div>
                    {selectedTheme.id === t.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-6">
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                  <label className="block text-gray-400 mb-2 font-bold text-sm">📝 Tên bài trình chiếu</label>
                  <input
                    type="text" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)}
                    className="w-full bg-slate-900 text-white text-xl font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-amber-500"
                  />
                </div>

                <div className="flex-1 border-2 border-dashed border-amber-500/30 p-8 rounded-xl hover:bg-amber-500/10 transition-colors text-center flex flex-col justify-center">
                  <Upload className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <p className="text-lg mb-4 text-gray-300">Tải lên file Excel chứa câu hỏi</p>
                  <div className="flex flex-col md:flex-row justify-center gap-4">
                    <label className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer inline-flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5" /> Chọn File Excel
                      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button onClick={downloadTemplate} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center justify-center gap-2">
                      <Download className="w-5 h-5" /> Tải File Mẫu
                    </button>
                  </div>
                  {fileName && (
                    <div className="mt-4 text-amber-300 bg-amber-900/30 p-3 rounded-lg border border-amber-500/30">
                      ✅ <strong>{fileName}</strong> — {questions.length} câu hỏi
                      {questions.filter(q => q.timeLimit).length > 0 && (
                        <div className="text-xs opacity-80 mt-1">
                          ⏱ {questions.filter(q => q.timeLimit).length} câu có thời gian riêng
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                  <label className="block text-gray-400 mb-2 font-bold text-sm">🖼️ Link ảnh nền (tuỳ chọn)</label>
                  <input
                    type="text" value={bgUrl}
                    onChange={(e) => { setBgUrl(e.target.value); localStorage.setItem('bankBgUrl', e.target.value); }}
                    className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg outline-none border border-transparent focus:border-amber-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 h-full flex flex-col justify-center">
                  <label className="block text-gray-400 mb-2 font-bold text-sm text-center">💰 Vốn khởi điểm mỗi nhóm</label>
                  <input
                    type="number" min="100" step="100" value={startingCapital}
                    onChange={(e) => setStartingCapital(Math.max(100, parseInt(e.target.value) || 100))}
                    className="w-full bg-slate-900 text-amber-400 text-3xl font-black text-center py-3 rounded-lg outline-none border border-transparent focus:border-amber-500 mb-6"
                  />

                  <label className="block text-gray-400 mb-2 font-bold text-sm text-center">🎯 Thời gian đặt cược (giây)</label>
                  <input
                    type="number" min="5" value={betTime}
                    onChange={(e) => setBetTime(Math.max(5, parseInt(e.target.value) || 5))}
                    className="w-full bg-slate-900 text-white text-3xl font-black text-center py-3 rounded-lg outline-none border border-transparent focus:border-amber-500 mb-6"
                  />

                  <label className="block text-gray-400 mb-2 font-bold text-sm text-center">⏱ Thời gian mỗi câu (giây)</label>
                  <input
                    type="number" value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 text-white text-3xl font-black text-center py-3 rounded-lg outline-none border border-transparent focus:border-amber-500 mb-6"
                  />

                  <label className="block text-gray-400 mb-2 font-bold text-sm text-center">👀 Thời gian xem đáp án (giây)</label>
                  <input
                    type="number" value={revealTimeLimit} onChange={(e) => setRevealTimeLimit(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 text-white text-3xl font-black text-center py-3 rounded-lg outline-none border border-transparent focus:border-amber-500 mb-6"
                  />

                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <label className="block text-gray-400 mb-2 font-bold text-sm text-center">Chế độ chơi</label>
                      <select value={playMode} onChange={e => setPlayMode(e.target.value)} className="w-full bg-slate-900 text-white text-lg font-bold text-center py-3 rounded-lg outline-none">
                        <option value="TEAM">Theo nhóm</option>
                        <option value="INDIVIDUAL">Cá nhân</option>
                      </select>
                    </div>
                    {playMode === 'TEAM' && (
                      <div className="flex-1">
                        <label className="block text-gray-400 mb-2 font-bold text-sm text-center">Số nhóm (1-12)</label>
                        <input
                          type="number" min="1" max="12" value={teamCount}
                          onChange={(e) => setTeamCount(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-full bg-slate-900 text-white text-lg font-bold text-center py-3 rounded-lg outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer bg-slate-900 p-4 rounded-lg border border-transparent hover:border-amber-500/50">
                    <input type="checkbox" checked={showQuestionOnDevice} onChange={(e) => setShowQuestionOnDevice(e.target.checked)} className="w-5 h-5 accent-amber-500 cursor-pointer" />
                    <span className="text-gray-300 font-bold select-none text-sm">Hiển thị nội dung câu hỏi trên thiết bị học sinh</span>
                  </label>

                  <button onClick={() => window.open('/print-qr', '_blank')} className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg w-full">
                    🖨️ In thẻ QR Đáp Án
                  </button>
                </div>
              </div>
            </div>

            {/* Luật chơi cho giáo viên nắm nhanh */}
            <div className="mt-8 bg-gradient-to-br from-amber-950/60 to-slate-900 p-6 rounded-2xl border-2 border-amber-600/40">
              <h2 className="text-2xl font-black text-amber-400 mb-3">📋 Luật chơi</h2>
              <div className="grid md:grid-cols-4 gap-3">
                {BET_LEVELS.map(b => (
                  <div key={b.percent} className={`bg-gradient-to-br ${b.color} rounded-xl p-4 text-center`}>
                    <div className="text-3xl font-black text-white">{b.percent}%</div>
                    <div className="text-white font-bold">{b.label}</div>
                    <div className="text-white/80 text-xs">{b.sub}</div>
                  </div>
                ))}
              </div>
              <ul className="text-gray-300 text-sm mt-4 space-y-1.5">
                <li>• Mỗi nhóm cược <b>trước khi nhìn thấy câu hỏi</b> — buộc phải tự lượng sức theo chủ đề.</li>
                <li>• Trả lời đúng: <b className="text-emerald-400">được cộng đúng số đã cược</b>. Sai: <b className="text-red-400">mất đúng số đó</b>.</li>
                <li>• Không kịp chọn thì hệ thống tự đặt mức an toàn 10%.</li>
                <li>• Vốn tụt dưới {BAILOUT} sẽ được cấp lại {BAILOUT} — <b>không nhóm nào bị loại</b>, ai cũng còn cửa lật kèo.</li>
                <li>• Cuối buổi có biểu đồ vốn và bảng phân tích <b>chương nào lớp tự tin, chương nào lớp mơ hồ</b>.</li>
              </ul>
            </div>

            <div className="mt-10 mb-8">
              <QuestionGuidePanel />
            </div>
          </div>

          <button
            onClick={createRoom} disabled={questions.length === 0 || !gameTitle.trim()}
            className={`absolute top-6 right-6 px-8 py-4 rounded-2xl font-black text-xl transition-all ${
              questions.length > 0 && gameTitle.trim() ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            🚀 TẠO PHÒNG
          </button>
        </div>
      )}

      {/* ================= PHÒNG CHỜ ================= */}
      {localGameState === 'LOBBY' && roomData && (() => {
        const playUrl = `https://webdayhoc.vercel.app/bank/play?pin=${roomCode}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(playUrl)}&bgcolor=ffffff&color=000000&margin=10`;
        return (
          <div className="w-full min-h-screen flex flex-col">
            <div className="text-center pt-12 pb-4 shrink-0">
              <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] uppercase">
                {roomData.settings.gameTitle || 'NGÂN HÀNG TRI THỨC'}
              </h1>
              <h2 className="text-lg text-yellow-100/80 mt-2 font-semibold tracking-widest uppercase">
                Mỗi nhóm khởi nghiệp với {startCap} điểm vốn
              </h2>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 px-6 pb-6 overflow-hidden">
              <div className="md:w-[45%] shrink-0 flex flex-col items-center justify-center gap-6">
                <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 border border-white/20 flex flex-col items-center gap-4">
                  <p className="text-amber-400 text-xl font-black uppercase tracking-widest border-b border-white/10 pb-3 w-full text-center">Quét Mã QR</p>
                  <div className="bg-white p-4 rounded-3xl">
                    <img src={qrUrl} alt="QR Code" className="w-[260px] h-[260px] md:w-[340px] md:h-[340px] rounded-2xl" />
                  </div>
                  <p className="text-xs text-gray-400 font-mono bg-black/50 px-4 py-2 rounded-full">{playUrl}</p>
                </div>

                <div className="bg-black/40 backdrop-blur-xl rounded-3xl px-10 py-5 border border-white/20 text-center">
                  <p className="text-amber-400 text-lg font-black uppercase tracking-widest mb-2">Mã Phòng (PIN)</p>
                  <div className="text-7xl md:text-8xl font-black tracking-[0.15em] text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.8)] select-all">{roomCode}</div>
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-3 text-2xl font-black text-white">
                    <div className="bg-amber-600 p-2.5 rounded-xl"><Users className="w-7 h-7 text-white" /></div>
                    <span>{playersList.length} {roomData.settings.playMode === 'TEAM' ? 'nhóm' : 'học sinh'}</span>
                  </div>
                  <button
                    onClick={startGame} disabled={playersList.length === 0}
                    className={`px-8 py-4 rounded-2xl font-black text-xl flex items-center gap-3 transition-all ${
                      playersList.length > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-105 text-white' : 'bg-slate-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-7 h-7" /> BẮT ĐẦU
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  <div className="flex flex-wrap gap-3 content-start">
                    {playersList.map(p => (
                      <div key={p.id} className="bg-white/10 border border-white/20 px-4 py-3 rounded-2xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-black text-white text-xs" style={{ backgroundColor: TEAM_COLORS[(teamIndexOf(p.id) - 1) % TEAM_COLORS.length] }}>
                          {teamIndexOf(p.id)}
                        </div>
                        <span className="font-bold text-white">{p.name}</span>
                        <span className="text-amber-300 font-black">{p.capital || startCap}</span>
                      </div>
                    ))}
                    {playersList.length === 0 && <p className="text-gray-400 text-lg">Đang chờ học sinh quét mã tham gia…</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= ĐANG CHƠI ================= */}
      {localGameState === 'PLAYING' && roomData && (
        <div className="w-full px-2 mt-2">
          {/* Thanh điều khiển */}
          <div className="flex flex-wrap justify-end items-center gap-3 mb-5">
            {['BET', 'QUESTION', 'REVEAL'].includes(roomData.status) && (
              <div className="flex items-center gap-3 mr-auto">
                <div className={`text-3xl font-black px-6 py-2 rounded-xl border flex items-center gap-3 backdrop-blur-md ${roomData.paused ? 'bg-amber-500/30 border-amber-400' : 'bg-black/30 border-white/10'}`}>
                  {roomData.paused ? '⏸' : '⏳'} <span className={roomData.paused ? 'text-amber-300' : (timeLeft <= 5 ? 'text-red-400 animate-pulse' : theme.timerColor)}>{timeLeft}s</span>
                </div>
                <button
                  onClick={togglePause}
                  className={`px-5 py-3 rounded-xl font-black transition-colors ${roomData.paused ? 'bg-amber-500 hover:bg-amber-400 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'}`}
                >
                  {roomData.paused ? '▶ Tiếp tục' : '⏸ Tạm dừng'}
                </button>
              </div>
            )}

            <div className="bg-slate-800 px-5 py-2 rounded-lg text-lg font-bold text-amber-400">
              Câu {roomData.currentQuestionIndex + 1}/{roomData.questions?.length || 0}
            </div>
            <div className="bg-slate-800 px-5 py-2 rounded-lg text-lg font-bold text-emerald-400">
              {roomData.status === 'BET' ? `Đã cược: ${betCount}/${playersList.length}` : `Đã trả lời: ${answerCount}/${playersList.length}`}
            </div>
            <button onClick={() => toggleChart(true)} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-black flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Biểu đồ
            </button>
            <button onClick={() => window.open('/scanner', '_blank')} className="bg-indigo-900/60 hover:bg-indigo-600 text-indigo-100 px-4 py-2 rounded-lg font-bold">📷 Quét QR</button>
            <button onClick={endGame} className="bg-red-900/50 hover:bg-red-600 text-red-200 px-4 py-2 rounded-lg font-bold">Kết thúc</button>
          </div>

          {/* --- Biểu đồ tài sản toàn màn hình --- */}
          {roomData.chartOpen && (
            <div className="fixed inset-0 z-50 flex flex-col p-4 md:p-6" style={theme.bgStyle}>
              <div className="shrink-0 flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl md:text-4xl font-black text-amber-400">📈 SÀN GIAO DỊCH</h2>
                  <span className="bg-amber-500/25 border border-amber-400 text-amber-200 px-3 py-1.5 rounded-full font-bold text-sm">⏸ Đồng hồ đang dừng</span>
                </div>
                <button onClick={() => toggleChart(false)} className="bg-slate-800/90 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-bold border border-white/20">
                  ✕ Đóng, về câu hỏi
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto bg-black/45 backdrop-blur-xl rounded-3xl border border-amber-500/40 p-5">
                <CapitalChart
                  players={playersList.map(p => ({ ...p, index: teamIndexOf(p.id) }))}
                  startingCapital={startCap}
                  totalQuestions={roomData.questions?.length || 0}
                  currentIndex={roomData.currentQuestionIndex}
                />
              </div>
            </div>
          )}

          {/* --- Pha đặt cược --- */}
          {!roomData.chartOpen && roomData.status === 'BET' && (
            <div className="flex flex-col items-center text-center py-6">
              <div className="text-7xl animate-pulse">🏦</div>
              <h2 className="text-4xl md:text-6xl font-black text-amber-400 uppercase mt-3 drop-shadow-[0_0_30px_rgba(245,158,11,0.6)]">Đặt cược</h2>
              <p className="text-xl text-amber-100/90 mt-3 font-semibold">Chốt mức cược <b>trước khi thấy câu hỏi</b> — bạn tự tin tới đâu?</p>
              <p className="text-gray-400 mt-1">Không kịp chọn sẽ tự đặt mức an toàn 10%</p>

              <div className={`text-8xl font-black mt-5 ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{timeLeft}</div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 w-full max-w-3xl">
                {BET_LEVELS.map(b => (
                  <div key={b.percent} className={`bg-gradient-to-br ${b.color} rounded-2xl p-4 text-center opacity-90`}>
                    <div className="text-4xl font-black text-white">{b.percent}%</div>
                    <div className="text-white font-bold text-sm">{b.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-black/45 backdrop-blur-xl px-6 py-4 rounded-2xl border border-amber-500/40 w-full max-w-3xl">
                <p className="text-amber-400 font-black text-xl mb-3">{betCount}/{playersList.length} đã chốt cược</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {playersList.map(p => (
                    <span
                      key={p.id}
                      className={`px-3 py-1.5 rounded-full font-bold text-sm border ${p.betPercent ? 'bg-emerald-500/25 border-emerald-500 text-emerald-200' : 'bg-slate-800 border-slate-600 text-gray-400'}`}
                    >
                      {p.betPercent ? '✅' : '⏳'} {p.name}
                    </span>
                  ))}
                </div>
                <p className="text-gray-500 text-xs mt-3">Mức cược được giữ kín tới khi công bố đáp án</p>
              </div>
            </div>
          )}

          {/* --- Câu hỏi --- */}
          {!roomData.chartOpen && roomData.status === 'QUESTION' && (() => {
            const q = roomData.questions[roomData.currentQuestionIndex];
            const hasImage = q.image && q.image.toString().trim();
            return (
              <div>
                <div className={`${theme.questionBg} rounded-3xl mb-5 shadow-xl border-b-8 border-black/20 backdrop-blur-md overflow-hidden ${
                  hasImage ? 'flex flex-col md:flex-row min-h-[240px]' : 'p-8 text-2xl md:text-4xl font-bold text-center flex items-center justify-center min-h-[180px]'
                }`}>
                  {hasImage ? (
                    <>
                      <div className="flex-1 flex items-center justify-center p-6 text-2xl md:text-3xl font-bold text-left md:border-r border-white/10">
                        <MathText text={q.question} />
                      </div>
                      <div className="md:w-[38%] flex items-center justify-center p-4 bg-black/20">
                        <img src={q.image} alt="minh hoạ" className="max-h-56 rounded-xl object-contain" />
                      </div>
                    </>
                  ) : (
                    <MathText text={q.question} />
                  )}
                </div>

                {q.type === 'TLN' ? (
                  <div className="text-center text-2xl font-bold text-amber-300 bg-black/40 rounded-2xl py-8">
                    ✍️ Học sinh nhập đáp án trên thiết bị
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { n: 1, txt: q.optionA, c: 'bg-red-600' },
                      { n: 2, txt: q.optionB, c: 'bg-blue-600' },
                      { n: 3, txt: q.optionC, c: 'bg-yellow-600' },
                      { n: 4, txt: q.optionD, c: 'bg-emerald-600' }
                    ].map(o => (
                      <div key={o.n} className={`${o.c} rounded-2xl p-5 flex items-start gap-4 border-b-8 border-black/25 shadow-lg`}>
                        <span className="text-3xl font-black text-white/70 shrink-0 w-10">{['A', 'B', 'C', 'D'][o.n - 1]}</span>
                        <span className="text-xl md:text-2xl font-bold text-white pt-1"><MathText text={o.txt} /></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* --- Công bố đáp án + lãi lỗ --- */}
          {!roomData.chartOpen && roomData.status === 'REVEAL' && (() => {
            const q = roomData.questions[roomData.currentQuestionIndex];
            const correctLabel = q.type === 'TLN' ? q.correctOption : ['A', 'B', 'C', 'D'][q.correctOption - 1];
            return (
              <div className="grid lg:grid-cols-[1.1fr_1fr] gap-5">
                <div>
                  <div className="bg-emerald-900/70 border-2 border-emerald-500 rounded-3xl p-6 mb-4 text-center">
                    <p className="text-emerald-300 uppercase tracking-widest font-bold text-sm">Đáp án đúng</p>
                    <div className="text-4xl md:text-5xl font-black text-white mt-2"><MathText text={String(correctLabel)} /></div>
                    {q.type !== 'TLN' && (
                      <div className="text-xl text-emerald-100 mt-2"><MathText text={[q.optionA, q.optionB, q.optionC, q.optionD][q.correctOption - 1]} /></div>
                    )}
                  </div>
                  {q.explanation && (
                    <div className="bg-black/45 backdrop-blur-md rounded-2xl p-5 border border-white/15">
                      <p className="text-amber-400 font-black mb-2">💡 Lời giải</p>
                      <div className="text-white text-lg"><MathText text={q.explanation} /></div>
                    </div>
                  )}
                </div>

                <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-amber-500/40 p-4">
                  <h3 className="text-xl font-black text-white mb-3 uppercase">💹 Lãi / lỗ câu này</h3>
                  <div className="flex flex-col gap-2 max-h-[52vh] overflow-y-auto">
                    {ranked.map((p, i) => (
                      <div key={p.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${p.lastCorrect ? 'bg-emerald-900/40 border-emerald-600' : 'bg-red-900/30 border-red-700'}`}>
                        <span className="font-black text-gray-400 w-6 shrink-0">#{i + 1}</span>
                        <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-black text-white text-xs shrink-0" style={{ backgroundColor: TEAM_COLORS[(teamIndexOf(p.id) - 1) % TEAM_COLORS.length] }}>
                          {teamIndexOf(p.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white truncate">{p.name}</div>
                          <div className="text-xs text-gray-400">
                            cược {p.bets?.[roomData.currentQuestionIndex] || 10}% = {p.lastStake || 0}đ
                            {p.bailedOut && <span className="text-amber-300 font-bold"> • được cấp vốn mồi</span>}
                          </div>
                        </div>
                        <div className={`font-black text-lg shrink-0 ${p.lastCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                          {p.lastDelta > 0 ? `+${p.lastDelta}` : p.lastDelta}
                        </div>
                        <div className="font-black text-xl text-amber-300 shrink-0 w-16 text-right">{p.capital}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ================= TỔNG KẾT ================= */}
      {roomData?.status === 'END' && (() => {
        const top3 = ranked.slice(0, 3);
        const boldest = [...betAnalysis].sort((a, b) => b.avg - a.avg)[0];
        const shyest = [...betAnalysis].sort((a, b) => a.avg - b.avg)[0];
        return (
          <div className="w-full h-screen overflow-y-auto px-4 py-6">
            <h1 className="text-4xl md:text-6xl font-black text-center text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.9)] uppercase">
              🏦 TỔNG KẾT SÀN GIAO DỊCH
            </h1>

            {/* Bục ba nhóm dẫn đầu */}
            <div className="flex justify-center items-end gap-4 md:gap-8 mt-8 mb-8">
              {top3[1] && (
                <div className="flex flex-col items-center">
                  <div className="text-xl font-bold text-gray-300 mb-2 max-w-[130px] truncate text-center">{top3[1].name}</div>
                  <div className="w-24 h-32 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-xl flex items-center justify-center text-5xl font-black text-white">2</div>
                  <div className="text-xl font-black mt-2 text-gray-300">{top3[1].capital}đ</div>
                </div>
              )}
              {top3[0] && (
                <div className="flex flex-col items-center">
                  <Crown className="w-16 h-16 text-yellow-400 mb-1 animate-pulse" />
                  <div className="text-2xl font-black text-yellow-400 mb-2 max-w-[170px] truncate text-center">{top3[0].name}</div>
                  <div className="w-32 h-48 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-xl flex items-center justify-center text-7xl font-black text-white">1</div>
                  <div className="text-2xl font-black mt-2 text-yellow-400">{top3[0].capital}đ</div>
                </div>
              )}
              {top3[2] && (
                <div className="flex flex-col items-center">
                  <div className="text-xl font-bold text-amber-600 mb-2 max-w-[130px] truncate text-center">{top3[2].name}</div>
                  <div className="w-24 h-24 bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-xl flex items-center justify-center text-5xl font-black text-white">3</div>
                  <div className="text-xl font-black mt-2 text-amber-600">{top3[2].capital}đ</div>
                </div>
              )}
            </div>

            {/* Biểu đồ hành trình vốn */}
            <div className="max-w-5xl mx-auto bg-black/45 backdrop-blur-xl rounded-3xl border border-amber-500/40 p-5 mb-6">
              <h3 className="text-xl font-black text-white mb-3 uppercase text-center">📈 Hành trình vốn cả buổi</h3>
              <CapitalChart
                players={playersList.map(p => ({ ...p, index: teamIndexOf(p.id) }))}
                startingCapital={startCap}
                totalQuestions={roomData.questions?.length || 0}
                currentIndex={roomData.questions?.length || 0}
              />
            </div>

            {/* Chẩn đoán cho giáo viên */}
            <div className="max-w-5xl mx-auto bg-black/45 backdrop-blur-xl rounded-3xl border border-sky-500/40 p-5 mb-6">
              <h3 className="text-xl font-black text-sky-300 mb-1 uppercase">🔍 Lớp tự tin tới đâu?</h3>
              <p className="text-gray-400 text-sm mb-4">Mức cược trung bình cho biết lớp tự đánh giá mình nắm chủ đề đó thế nào — đối chiếu với số câu sai để tìm lỗ hổng.</p>

              {boldest && shyest && (
                <div className="grid md:grid-cols-2 gap-3 mb-4">
                  <div className="bg-emerald-900/40 border border-emerald-600 rounded-xl p-4">
                    <p className="text-emerald-300 font-bold text-sm">💪 Tự tin nhất</p>
                    <p className="text-white font-black text-lg mt-1">Câu {boldest.idx + 1} — cược TB {Math.round(boldest.avg)}%</p>
                    <p className="text-gray-400 text-sm">{boldest.wrongCount} nhóm trả lời sai</p>
                  </div>
                  <div className="bg-orange-900/40 border border-orange-600 rounded-xl p-4">
                    <p className="text-orange-300 font-bold text-sm">😰 Dè dặt nhất</p>
                    <p className="text-white font-black text-lg mt-1">Câu {shyest.idx + 1} — cược TB {Math.round(shyest.avg)}%</p>
                    <p className="text-gray-400 text-sm">{shyest.wrongCount} nhóm trả lời sai</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                {betAnalysis.map(r => {
                  // Cược cao mà sai nhiều là dấu hiệu lớp tự tin sai chỗ — cần dạy lại kỹ
                  const overconfident = r.avg >= 40 && r.wrongCount >= Math.ceil(playersList.length / 2);
                  return (
                    <div key={r.idx} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${overconfident ? 'bg-red-900/40 border border-red-600' : 'bg-slate-800/70'}`}>
                      <span className="font-bold text-gray-300 w-16 shrink-0">Câu {r.idx + 1}</span>
                      <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-sky-500 to-amber-500" style={{ width: `${r.avg}%` }} />
                      </div>
                      <span className="text-amber-300 font-black w-14 text-right shrink-0">{Math.round(r.avg)}%</span>
                      <span className="text-red-400 font-bold w-20 text-right shrink-0 text-sm">{r.wrongCount} sai</span>
                      {overconfident && <span className="text-red-300 text-xs font-bold shrink-0">⚠️ tự tin sai</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bảng xếp hạng đầy đủ */}
            <div className="max-w-3xl mx-auto bg-black/45 backdrop-blur-xl rounded-3xl border border-white/20 p-4 mb-6">
              <h3 className="text-xl font-black text-white mb-3 uppercase text-center">Bảng xếp hạng</h3>
              <div className="flex flex-col gap-2">
                {ranked.map((p, i) => {
                  const diff = (p.capital || 0) - startCap;
                  return (
                    <div key={p.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${i === 0 ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-slate-800/70'}`}>
                      <span className="font-black text-lg w-8 shrink-0 text-gray-300">#{i + 1}</span>
                      <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-black text-white text-xs shrink-0" style={{ backgroundColor: TEAM_COLORS[(teamIndexOf(p.id) - 1) % TEAM_COLORS.length] }}>
                        {teamIndexOf(p.id)}
                      </div>
                      <span className="flex-1 min-w-0 truncate font-bold text-white">{p.name}</span>
                      <span className={`font-bold shrink-0 ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{diff >= 0 ? `+${diff}` : diff}</span>
                      <span className="font-black text-xl text-amber-300 shrink-0 w-20 text-right">{p.capital}đ</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center gap-3 pb-8">
              <button onClick={() => setShowStatsModal(true)} className="bg-slate-800/80 hover:bg-slate-700 px-6 py-3 rounded-2xl border border-red-500/50 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-400" />
                <span className="text-lg font-bold text-red-400">Thống Kê Câu Sai</span>
              </button>
              <button onClick={closeRoom} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-2xl font-black text-lg">Thoát &amp; Xoá Phòng</button>
            </div>

            {showStatsModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden relative">
                  <button onClick={() => setShowStatsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-slate-800 rounded-full p-2 z-10">✕</button>
                  <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                    <h2 className="text-3xl font-black text-white flex items-center gap-3"><XCircle className="text-red-500" /> Thống Kê Các Câu Sai</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                    {(() => {
                      const wrongQs = [...(roomData.questions || [])]
                        .map((q, idx) => ({ ...q, index: idx }))
                        .filter(q => q.wrongCount > 0)
                        .sort((a, b) => b.wrongCount - a.wrongCount);
                      if (wrongQs.length === 0) return <div className="text-center text-emerald-400 text-2xl py-10 font-bold">Tuyệt vời! Không có câu nào sai! 🎉</div>;
                      return wrongQs.map((q, i) => (
                        <div key={i} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                          <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-700/50" onClick={() => setSelectedStatQ(selectedStatQ === q.index ? null : q.index)}>
                            <div className="font-bold text-xl text-gray-300">Câu hỏi số {q.index + 1}</div>
                            <div className="flex items-center gap-4">
                              <div className="text-red-400 font-bold bg-red-900/30 px-3 py-1 rounded-lg">{q.wrongCount} sai</div>
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
    </div>
  );
};

export default BankHost;
