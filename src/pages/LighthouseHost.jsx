import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Upload, Play, Users, ChevronRight, CheckCircle2, XCircle, Download } from 'lucide-react';
import { db } from '../firebase';
import { ref, set, update, onValue, remove, get } from 'firebase/database';
import MathText from '../components/MathText';
import QuestionGuidePanel from '../components/QuestionGuidePanel';
import Lighthouse from '../components/Lighthouse';
import { DIFFICULTIES, MAX_FUEL, isStormQuestion, fuelDelta, clampFuel, classRating } from '../data/lighthouseRules';

const THEMES = [
  {
    id: 'night',
    name: '🌙 Đêm Biển',
    bgStyle: { background: 'linear-gradient(180deg, #020617 0%, #0c1445 55%, #082f49 100%)' },
    questionBg: 'bg-slate-900/85 text-white border border-sky-800/60',
    timerColor: 'text-sky-300',
    preview: 'from-slate-900 via-blue-950 to-sky-900'
  },
  {
    id: 'storm',
    name: '🌪️ Bão Tố',
    bgStyle: { background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)' },
    questionBg: 'bg-indigo-950/85 text-white border border-indigo-700',
    timerColor: 'text-indigo-300',
    preview: 'from-indigo-950 via-slate-900 to-black'
  },
  {
    id: 'dawn',
    name: '🌅 Bình Minh',
    bgStyle: { background: 'linear-gradient(180deg, #431407 0%, #7c2d12 45%, #0c4a6e 100%)' },
    questionBg: 'bg-orange-950/80 text-white border border-orange-700',
    timerColor: 'text-orange-300',
    preview: 'from-orange-900 via-amber-800 to-sky-900'
  },
  {
    id: 'aurora',
    name: '💚 Cực Quang',
    bgStyle: { background: 'linear-gradient(180deg, #020617 0%, #064e3b 55%, #0c4a6e 100%)' },
    questionBg: 'bg-emerald-950/85 text-white border border-emerald-700',
    timerColor: 'text-emerald-300',
    preview: 'from-emerald-900 via-teal-900 to-slate-900'
  },
];

const HOST_ROOM_KEY = 'lighthouseHostRoom';

const LighthouseHost = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [fileName, setFileName] = useState('');
  const [localGameState, setLocalGameState] = useState('SETUP');
  const [roomCode, setRoomCode] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);
  const [revealTimeLimit, setRevealTimeLimit] = useState(25);
  const [difficulty, setDifficulty] = useState('windy');
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [gameTitle, setGameTitle] = useState('NGỌN HẢI ĐĂNG');
  const [roomData, setRoomData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem('lighthouseBgUrl') || '');
  const [showQuestionOnDevice, setShowQuestionOnDevice] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedStatQ, setSelectedStatQ] = useState(null);
  const [resumeRoom, setResumeRoom] = useState(null);

  const currentAudio = useRef(null);
  const playAudio = (url) => {
    if (currentAudio.current) { currentAudio.current.pause(); currentAudio.current.currentTime = 0; }
    if (url) {
      const a = new Audio(url);
      currentAudio.current = a;
      a.play().catch(() => {});
    }
  };

  // Câu nào có thời gian riêng ở cột 9 của Excel thì ưu tiên dùng
  const secondsFor = (status, settings, data) =>
    status === 'QUESTION'
      ? (data?.questions?.[data.currentQuestionIndex]?.timeLimit || settings?.timeLimit || 60)
      : status === 'REVEAL' ? (settings?.revealTimeLimit || 25) : 0;

  useEffect(() => {
    if (!roomCode) return;
    const r = ref(db, `lighthouseRooms/${roomCode}`);
    const unsub = onValue(r, (snap) => {
      const data = snap.val();
      if (!data) return;
      if (!roomData || roomData.status !== data.status) setTimeLeft(secondsFor(data.status, data.settings, data));
      setRoomData(data);
    });
    return () => unsub();
  }, [roomCode, roomData]);

  useEffect(() => {
    let timer;
    const running = ['QUESTION', 'REVEAL'].includes(roomData?.status);
    if (!roomData?.paused && running && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (roomData.status === 'QUESTION') revealAnswer();
            else nextQuestion();
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
    await update(ref(db, `lighthouseRooms/${roomCode}`), { paused: !roomData?.paused });
  };

  useEffect(() => {
    if (!roomCode || !roomData?.scanRequestReveal || roomData.status !== 'QUESTION') return;
    update(ref(db, `lighthouseRooms/${roomCode}`), { scanRequestReveal: false });
    revealAnswer();
  }, [roomData?.scanRequestReveal, roomData?.status, roomCode]);

  useEffect(() => {
    let code = null;
    try { code = localStorage.getItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (!code) return;
    get(ref(db, `lighthouseRooms/${code}`)).then(snap => {
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
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const parsed = rows.slice(1).map(row => {
        if (!row[0]) return null;
        if (row[1]?.toString().trim().toUpperCase() === 'TLN') {
          return { type: 'TLN', question: row[0] || '', correctOption: row[2]?.toString().trim() || '', explanation: row[3]?.toString() || '', image: row[7] || null, timeLimit: parseInt(row[8]) > 0 ? parseInt(row[8]) : null };
        }
        return {
          type: 'TRAC_NGHIEM', question: row[0] || '',
          optionA: row[1] || '', optionB: row[2] || '', optionC: row[3] || '', optionD: row[4] || '',
          correctOption: parseInt(row[5]) || 1, explanation: row[6] || '', image: row[7] || null,
          timeLimit: parseInt(row[8]) > 0 ? parseInt(row[8]) : null
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
    if (questions.length === 0) { alert("Vui lòng tải lên file câu hỏi trước!"); return; }
    try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch { /* bị chặn */ }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    try { localStorage.setItem(HOST_ROOM_KEY, code); } catch { /* không sao */ }
    setLocalGameState('LOBBY');
    playAudio('https://files.catbox.moe/eopz4f.mp3');

    await set(ref(db, `lighthouseRooms/${code}`), {
      status: 'LOBBY',
      currentQuestionIndex: 0,
      questions,
      players: {},
      fuel: MAX_FUEL,
      blackouts: 0,
      stormsPassed: 0,
      history: {},
      settings: { timeLimit, revealTimeLimit, difficulty, gameTitle, bgUrl, showQuestionOnDevice }
    });
  };

  const startGame = async () => {
    playAudio('https://files.catbox.moe/amew8w.mp3');
    await update(ref(db, `lighthouseRooms/${roomCode}`), { status: 'QUESTION' });
    setLocalGameState('PLAYING');
  };

  const revealAnswer = async () => {
    playAudio('https://files.catbox.moe/r1fiz6.mp3');
    const qIdx = roomData.currentQuestionIndex;
    const currentQ = roomData.questions[qIdx];
    const players = Object.values(roomData.players || {});
    const total = players.length || 1;

    let correct = 0;
    const updates = { status: 'REVEAL' };

    players.forEach(p => {
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
      if (isCorrect) correct++;
      updates[`players/${p.id}/lastCorrect`] = isCorrect;
      // Đếm số câu đúng để cuối buổi vinh danh, không dùng để xếp hạng
      updates[`players/${p.id}/correctCount`] = (p.correctCount || 0) + (isCorrect ? 1 : 0);
    });

    const ratio = correct / total;
    const storm = isStormQuestion(qIdx, roomData.questions.length);
    const { delta, stormPassed } = fuelDelta({ correctRatio: ratio, difficulty: roomData.settings?.difficulty, isStorm: storm });

    const before = roomData.fuel ?? MAX_FUEL;
    const after = clampFuel(before + delta);

    updates['fuel'] = after;
    updates['lastDelta'] = delta;
    updates['lastRatio'] = ratio;
    updates['lastCorrectCount'] = correct;
    updates['lastStorm'] = storm;
    updates['lastStormPassed'] = stormPassed;
    updates[`history/${qIdx}`] = { fuel: after, ratio: Math.round(ratio * 100), storm, delta };
    updates[`questions/${qIdx}/wrongCount`] = total - correct;
    if (storm && stormPassed) updates['stormsPassed'] = (roomData.stormsPassed || 0) + 1;
    if (before > 0 && after === 0) updates['blackouts'] = (roomData.blackouts || 0) + 1;

    await update(ref(db, `lighthouseRooms/${roomCode}`), updates);
  };

  const nextQuestion = async () => {
    const nextIdx = roomData.currentQuestionIndex + 1;
    if (nextIdx >= roomData.questions.length) { endGame(); return; }
    playAudio('https://files.catbox.moe/amew8w.mp3');
    const updates = { status: 'QUESTION', currentQuestionIndex: nextIdx, paused: false };
    Object.values(roomData.players || {}).forEach(p => { updates[`players/${p.id}/currentAnswer`] = null; });
    await update(ref(db, `lighthouseRooms/${roomCode}`), updates);
  };

  const endGame = async () => {
    playAudio('https://files.catbox.moe/12vlpb.mp3');
    await update(ref(db, `lighthouseRooms/${roomCode}`), { status: 'END', paused: false });
  };

  const closeRoom = async () => {
    if (!window.confirm("Kết thúc hoàn toàn và xoá phòng chơi này?")) return;
    await remove(ref(db, `lighthouseRooms/${roomCode}`));
    try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setLocalGameState('SETUP');
    setRoomCode('');
    setRoomData(null);
  };

  const playersList = roomData?.players ? Object.values(roomData.players) : [];
  const answerCount = playersList.filter(p => p.currentAnswer).length;
  const theme = selectedTheme;
  const currentBgUrl = roomData?.settings?.bgUrl || bgUrl;
  const fuel = roomData?.fuel ?? MAX_FUEL;
  const diff = DIFFICULTIES.find(d => d.id === (roomData?.settings?.difficulty || difficulty)) || DIFFICULTIES[1];
  const totalQ = roomData?.questions?.length || 0;
  const stormsTotal = Array.from({ length: totalQ }, (_, i) => i).filter(i => isStormQuestion(i, totalQ)).length;
  const nextIsStorm = isStormQuestion(roomData?.currentQuestionIndex ?? -1, totalQ);

  return (
    <div className={`min-h-screen text-white relative ${roomData?.status !== 'END' ? 'p-4 md:p-8' : ''}`} style={localGameState !== 'SETUP' ? theme.bgStyle : { background: '#0f172a' }}>
      {localGameState !== 'SETUP' && currentBgUrl && (
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${currentBgUrl})`, opacity: 0.4 }} />
      )}

      <div className={`relative z-10 w-full flex flex-col ${roomData?.status !== 'END' ? 'min-h-screen' : 'h-screen'}`}>

      {/* ============ TẠO PHÒNG ============ */}
      {localGameState === 'SETUP' && (
        <div className="relative w-full min-h-screen">
          <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate('/games')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
              <ArrowLeft className="w-5 h-5" /> Quay lại kho game
            </button>

            <h1 className="text-4xl font-black mb-2 text-sky-300 text-center">🏮 Ngọn Hải Đăng</h1>
            <p className="text-gray-300 text-center">Cả lớp là <b className="text-sky-300">MỘT đội</b> — không ai thắng ai, chỉ có cùng giữ lửa hoặc cùng chìm trong đêm</p>
            <p className="text-sky-200/70 text-center text-sm mt-1 mb-10">Không có bảng xếp hạng cá nhân, không ai bị nêu tên khi trả lời sai</p>

            {resumeRoom && (
              <div className="mb-8 bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-300">🔌 Phòng {resumeRoom} vẫn đang chạy</h3>
                  <p className="text-gray-300 text-sm mt-1">Lượng dầu và tiến trình còn nguyên. Nối lại để tiếp tục đúng chỗ đang dở.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={resumeHosting} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black">Nối lại phòng</button>
                  <button onClick={() => { try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ } setResumeRoom(null); }} className="bg-slate-800 hover:bg-slate-700 text-gray-300 px-4 py-3 rounded-xl font-bold">Bỏ qua</button>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 text-center">Chọn Giao Diện</h2>
              <div className="grid grid-cols-4 gap-3">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => setSelectedTheme(t)}
                    className={`relative rounded-2xl overflow-hidden h-28 transition-all border-4 ${selectedTheme.id === t.id ? 'border-white scale-105' : 'border-transparent hover:border-white/40'}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${t.preview}`} />
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
                      <span className="text-2xl mb-1">{t.name.split(' ')[0]}</span>
                      <span className="text-white text-xs font-bold">{t.name.split(' ').slice(1).join(' ')}</span>
                    </div>
                    {selectedTheme.id === t.id && <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-sky-600" /></div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-6">
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                  <label className="block text-gray-400 mb-2 font-bold text-sm">📝 Tên bài trình chiếu</label>
                  <input type="text" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)}
                    className="w-full bg-slate-900 text-white text-xl font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-sky-500" />
                </div>

                <div className="flex-1 border-2 border-dashed border-sky-500/30 p-8 rounded-xl hover:bg-sky-500/10 text-center flex flex-col justify-center">
                  <Upload className="w-10 h-10 text-sky-400 mx-auto mb-3" />
                  <p className="text-lg mb-4 text-gray-300">Tải lên file Excel chứa câu hỏi</p>
                  <div className="flex flex-col md:flex-row justify-center gap-4">
                    <label className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer inline-flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5" /> Chọn File Excel
                      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button onClick={downloadTemplate} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center justify-center gap-2">
                      <Download className="w-5 h-5" /> Tải File Mẫu
                    </button>
                  </div>
                  {fileName && (
                    <div className="mt-4 text-sky-300 bg-sky-900/30 p-3 rounded-lg border border-sky-500/30">
                      ✅ <strong>{fileName}</strong> — {questions.length} câu hỏi
                      {questions.filter(q => q.timeLimit).length > 0 && (
                        <div className="text-xs opacity-80 mt-1">
                          ⏱ {questions.filter(q => q.timeLimit).length} câu có thời gian riêng
                        </div>
                      )}
                      <div className="text-xs text-sky-200/80 mt-1">
                        Sẽ có {Array.from({ length: questions.length }, (_, i) => i).filter(i => isStormQuestion(i, questions.length)).length} cơn bão lớn
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                  <label className="block text-gray-400 mb-2 font-bold text-sm">🖼️ Link ảnh nền (tuỳ chọn)</label>
                  <input type="text" value={bgUrl}
                    onChange={(e) => { setBgUrl(e.target.value); localStorage.setItem('lighthouseBgUrl', e.target.value); }}
                    className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg outline-none border border-transparent focus:border-sky-500" placeholder="https://..." />
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                  <label className="block text-gray-400 mb-3 font-bold text-sm text-center">🌊 Mức sóng gió</label>
                  <div className="flex flex-col gap-2 mb-6">
                    {DIFFICULTIES.map(d => (
                      <button key={d.id} onClick={() => setDifficulty(d.id)}
                        className={`p-3 rounded-xl text-left border-2 transition-all ${difficulty === d.id ? 'bg-sky-500/25 border-sky-400' : 'bg-slate-900 border-slate-700 hover:border-sky-500/50'}`}>
                        <div className="font-black text-white">{d.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{d.desc}</div>
                      </button>
                    ))}
                  </div>

                  <label className="block text-gray-400 mb-2 font-bold text-sm text-center">⏱ Thời gian mỗi câu (giây)</label>
                  <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 text-white text-3xl font-black text-center py-3 rounded-lg outline-none mb-5" />

                  <label className="block text-gray-400 mb-2 font-bold text-sm text-center">👀 Thời gian xem đáp án (giây)</label>
                  <input type="number" value={revealTimeLimit} onChange={(e) => setRevealTimeLimit(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 text-white text-3xl font-black text-center py-3 rounded-lg outline-none mb-5" />

                  <label className="flex items-center gap-3 cursor-pointer bg-slate-900 p-4 rounded-lg border border-transparent hover:border-sky-500/50">
                    <input type="checkbox" checked={showQuestionOnDevice} onChange={(e) => setShowQuestionOnDevice(e.target.checked)} className="w-5 h-5 accent-sky-500 cursor-pointer" />
                    <span className="text-gray-300 font-bold select-none text-sm">Hiển thị nội dung câu hỏi trên thiết bị học sinh</span>
                  </label>

                  <button onClick={() => window.open('/print-qr', '_blank')} className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg w-full">
                    🖨️ In thẻ QR Đáp Án
                  </button>
                </div>

                <div className="bg-slate-900 rounded-xl p-4 border border-sky-800/50">
                  <p className="text-gray-400 text-xs font-bold mb-2 text-center">XEM TRƯỚC</p>
                  <div className="max-w-[190px] mx-auto"><Lighthouse fuel={78} compact /></div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-br from-sky-950/70 to-slate-900 p-6 rounded-2xl border-2 border-sky-700/50">
              <h2 className="text-2xl font-black text-sky-300 mb-3">📋 Luật chơi</h2>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Ngọn hải đăng bắt đầu với <b className="text-white">100% dầu</b>. Mỗi câu, gió biển thổi hao <b className="text-red-300">{diff.wind}%</b>.</li>
                <li>• <b className="text-emerald-300">Tỉ lệ cả lớp trả lời đúng</b> sẽ tiếp dầu — đúng càng nhiều, lửa càng sáng. Hoà vốn khi <b>{Math.round(diff.wind / diff.gain * 100)}%</b> lớp đúng.</li>
                <li>• Cứ 5 câu có một <b className="text-indigo-300">cơn bão lớn</b>: cần <b>{Math.round(diff.storm * 100)}%</b> lớp đúng, vượt được thưởng dầu, không thì mất thêm.</li>
                <li>• Hết dầu thì đèn tắt, nhưng <b className="text-white">lớp vẫn thắp lại được</b> ở câu sau — không ai bị loại.</li>
                <li>• <b className="text-amber-300">Không có bảng xếp hạng cá nhân.</b> Máy chiếu chỉ hiện tỉ lệ chung, học sinh sai không bị nêu tên.</li>
              </ul>
            </div>

            <div className="mt-10 mb-8"><QuestionGuidePanel /></div>
          </div>

          <button onClick={createRoom} disabled={questions.length === 0 || !gameTitle.trim()}
            className={`absolute top-6 right-6 px-8 py-4 rounded-2xl font-black text-xl transition-all ${questions.length > 0 && gameTitle.trim() ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-500/30 hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
            🚀 TẠO PHÒNG
          </button>
        </div>
      )}

      {/* ============ PHÒNG CHỜ ============ */}
      {localGameState === 'LOBBY' && roomData && (() => {
        const playUrl = `https://webdayhoc.vercel.app/lighthouse/play?pin=${roomCode}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(playUrl)}&bgcolor=ffffff&color=000000&margin=10`;
        return (
          <div className="w-full min-h-screen flex flex-col">
            <div className="text-center pt-10 pb-3 shrink-0">
              <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-sky-200 to-sky-500 uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                {roomData.settings.gameTitle || 'NGỌN HẢI ĐĂNG'}
              </h1>
              <h2 className="text-lg text-sky-100/80 mt-2 font-semibold tracking-widest uppercase">Cả lớp là một đội — cùng giữ lửa qua đêm bão</h2>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-5 px-6 pb-6 overflow-hidden">
              <div className="lg:w-[30%] shrink-0 flex items-center justify-center">
                <div className="w-full max-w-[280px]"><Lighthouse fuel={MAX_FUEL} /></div>
              </div>

              <div className="lg:w-[32%] shrink-0 flex flex-col items-center justify-center gap-4">
                <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 border border-white/20 flex flex-col items-center gap-3">
                  <p className="text-sky-300 text-lg font-black uppercase tracking-widest border-b border-white/10 pb-2 w-full text-center">Quét Mã QR</p>
                  <div className="bg-white p-3 rounded-2xl"><img src={qrUrl} alt="QR" className="w-[220px] h-[220px] md:w-[280px] md:h-[280px] rounded-xl" /></div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl rounded-3xl px-8 py-4 border border-white/20 text-center">
                  <p className="text-sky-300 text-base font-black uppercase tracking-widest mb-1">Mã Phòng</p>
                  <div className="text-6xl md:text-7xl font-black tracking-[0.15em] text-white select-all">{roomCode}</div>
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-3 text-xl font-black text-white">
                    <div className="bg-sky-600 p-2 rounded-xl"><Users className="w-6 h-6" /></div>
                    <span>{playersList.length} thuỷ thủ</span>
                  </div>
                  <button onClick={startGame} disabled={playersList.length === 0}
                    className={`px-6 py-3 rounded-2xl font-black text-lg flex items-center gap-2 ${playersList.length > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-105 text-white' : 'bg-slate-800 text-gray-500 cursor-not-allowed'}`}>
                    <Play className="w-6 h-6" /> RA KHƠI
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-wrap gap-2 content-start">
                    {playersList.map(p => (
                      <div key={p.id} className="bg-white/10 border border-white/20 px-3 py-2 rounded-xl font-bold text-white text-sm">⚓ {p.name}</div>
                    ))}
                    {playersList.length === 0 && <p className="text-gray-400">Đang chờ thuỷ thủ lên tàu…</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============ ĐANG CHƠI ============ */}
      {localGameState === 'PLAYING' && roomData && roomData.status !== 'END' && (
        <div className="w-full px-2 mt-2">
          <div className="flex flex-wrap justify-end items-center gap-3 mb-4">
            {['QUESTION', 'REVEAL'].includes(roomData.status) && (
              <div className="flex items-center gap-3 mr-auto">
                <div className={`text-3xl font-black px-5 py-2 rounded-xl border flex items-center gap-3 backdrop-blur-md ${roomData.paused ? 'bg-amber-500/30 border-amber-400' : 'bg-black/30 border-white/10'}`}>
                  {roomData.paused ? '⏸' : '⏳'} <span className={roomData.paused ? 'text-amber-300' : (timeLeft <= 10 ? 'text-red-400 animate-pulse' : theme.timerColor)}>{timeLeft}s</span>
                </div>
                <button onClick={togglePause}
                  className={`px-4 py-3 rounded-xl font-black ${roomData.paused ? 'bg-amber-500 hover:bg-amber-400 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'}`}>
                  {roomData.paused ? '▶ Tiếp tục' : '⏸ Tạm dừng'}
                </button>
              </div>
            )}
            <div className="bg-slate-800/80 px-4 py-2 rounded-lg text-lg font-bold text-sky-300">
              Câu {roomData.currentQuestionIndex + 1}/{totalQ}
            </div>
            <div className="bg-slate-800/80 px-4 py-2 rounded-lg text-lg font-bold text-emerald-400">
              Đã trả lời: {answerCount}/{playersList.length}
            </div>
            <button onClick={() => window.open('/scanner', '_blank')} className="bg-indigo-900/60 hover:bg-indigo-600 text-indigo-100 px-4 py-2 rounded-lg font-bold">📷 Quét QR</button>
            <button onClick={endGame} className="bg-red-900/50 hover:bg-red-600 text-red-200 px-4 py-2 rounded-lg font-bold">Kết thúc</button>
          </div>

          <div className="grid lg:grid-cols-[minmax(260px,1fr)_2.2fr] gap-5 items-start">
            {/* Cột trái: ngọn hải đăng + thanh dầu */}
            <div className="bg-black/35 backdrop-blur-md rounded-3xl border border-sky-700/40 p-4">
              <Lighthouse fuel={fuel} stormMode={nextIsStorm || fuel < 30} compact />

              <div className="mt-3">
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span className="text-gray-300">Dầu còn lại</span>
                  <span className={fuel > 50 ? 'text-emerald-400' : fuel > 20 ? 'text-amber-400' : 'text-red-400'}>{fuel}%</span>
                </div>
                <div className="h-5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
                  <div
                    className={`h-full transition-all duration-700 ${fuel > 50 ? 'bg-gradient-to-r from-emerald-500 to-lime-400' : fuel > 20 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-red-600 to-orange-500'}`}
                    style={{ width: `${fuel}%` }}
                  />
                </div>
              </div>

              {nextIsStorm && roomData.status === 'QUESTION' && (
                <div className="mt-3 bg-indigo-900/60 border-2 border-indigo-400 rounded-xl p-3 text-center animate-pulse">
                  <p className="text-indigo-200 font-black">🌪️ CƠN BÃO LỚN</p>
                  <p className="text-white text-sm mt-1">Cần <b>{Math.round(diff.storm * 100)}%</b> lớp trả lời đúng!</p>
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-900/70 rounded-lg py-2">
                  <div className="text-xl font-black text-indigo-300">{roomData.stormsPassed || 0}/{stormsTotal}</div>
                  <div className="text-[11px] text-gray-400 font-bold">bão đã vượt</div>
                </div>
                <div className="bg-slate-900/70 rounded-lg py-2">
                  <div className="text-xl font-black text-red-300">{roomData.blackouts || 0}</div>
                  <div className="text-[11px] text-gray-400 font-bold">lần tắt đèn</div>
                </div>
              </div>
            </div>

            {/* Cột phải: câu hỏi hoặc kết quả */}
            <div>
              {roomData.status === 'QUESTION' && (() => {
                const q = roomData.questions[roomData.currentQuestionIndex];
                const hasImage = q.image && q.image.toString().trim();
                return (
                  <div>
                    <div className={`${theme.questionBg} rounded-3xl mb-4 shadow-xl border-b-8 border-black/25 backdrop-blur-md overflow-hidden ${
                      hasImage ? 'flex flex-col md:flex-row min-h-[220px]' : 'p-7 text-2xl md:text-4xl font-bold text-center flex items-center justify-center min-h-[170px]'
                    }`}>
                      {hasImage ? (
                        <>
                          <div className="flex-1 flex items-center justify-center p-6 text-2xl md:text-3xl font-bold text-left md:border-r border-white/10"><MathText text={q.question} /></div>
                          <div className="md:w-[38%] flex items-center justify-center p-4 bg-black/20"><img src={q.image} alt="minh hoạ" className="max-h-52 rounded-xl object-contain" /></div>
                        </>
                      ) : <MathText text={q.question} />}
                    </div>

                    {q.type === 'TLN' ? (
                      <div className="text-center text-2xl font-bold text-sky-300 bg-black/40 rounded-2xl py-8">✍️ Học sinh nhập đáp án trên thiết bị</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { n: 1, txt: q.optionA, c: 'bg-red-600' },
                          { n: 2, txt: q.optionB, c: 'bg-blue-600' },
                          { n: 3, txt: q.optionC, c: 'bg-yellow-600' },
                          { n: 4, txt: q.optionD, c: 'bg-emerald-600' }
                        ].map(o => (
                          <div key={o.n} className={`${o.c} rounded-2xl p-4 flex items-start gap-3 border-b-8 border-black/25`}>
                            <span className="text-3xl font-black text-white/70 shrink-0 w-9">{['A', 'B', 'C', 'D'][o.n - 1]}</span>
                            <span className="text-xl font-bold text-white pt-1"><MathText text={o.txt} /></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {roomData.status === 'REVEAL' && (() => {
                const q = roomData.questions[roomData.currentQuestionIndex];
                const correctLabel = q.type === 'TLN' ? q.correctOption : ['A', 'B', 'C', 'D'][q.correctOption - 1];
                const pct = Math.round((roomData.lastRatio || 0) * 100);
                const delta = roomData.lastDelta || 0;
                return (
                  <div className="flex flex-col gap-4">
                    {/* Tỉ lệ cả lớp — không nêu tên ai */}
                    <div className={`rounded-3xl p-6 text-center border-4 ${delta >= 0 ? 'bg-emerald-900/60 border-emerald-400' : 'bg-red-900/50 border-red-400'}`}>
                      <p className="uppercase tracking-widest font-bold text-sm text-white/80">Cả lớp trả lời đúng</p>
                      <div className="text-6xl md:text-7xl font-black text-white mt-1">{pct}%</div>
                      <p className="text-white/90 font-bold mt-1">{roomData.lastCorrectCount || 0}/{playersList.length} thuỷ thủ</p>

                      <div className={`text-3xl font-black mt-3 ${delta >= 0 ? 'text-lime-300' : 'text-orange-300'}`}>
                        {delta >= 0 ? `🔥 Tiếp dầu +${delta}%` : `💨 Gió thổi ${delta}%`}
                      </div>

                      {roomData.lastStorm && (
                        <div className={`mt-3 inline-block px-5 py-2 rounded-full font-black ${roomData.lastStormPassed ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'}`}>
                          {roomData.lastStormPassed ? '🌟 VƯỢT BÃO THÀNH CÔNG!' : '🌪️ Cơn bão quật ngã — cố lên nào!'}
                        </div>
                      )}
                      {fuel === 0 && <div className="mt-3 text-amber-300 font-bold">Đèn tắt rồi! Câu sau cả lớp cùng thắp lại nhé 🕯️</div>}
                    </div>

                    <div className="bg-emerald-900/60 border-2 border-emerald-500 rounded-2xl p-5 text-center">
                      <p className="text-emerald-300 uppercase tracking-widest font-bold text-sm">Đáp án đúng</p>
                      <div className="text-3xl md:text-4xl font-black text-white mt-1"><MathText text={String(correctLabel)} /></div>
                      {q.type !== 'TLN' && <div className="text-lg text-emerald-100 mt-1"><MathText text={[q.optionA, q.optionB, q.optionC, q.optionD][q.correctOption - 1]} /></div>}
                    </div>

                    {q.explanation && (
                      <div className="bg-black/45 backdrop-blur-md rounded-2xl p-5 border border-white/15">
                        <p className="text-sky-300 font-black mb-2">💡 Lời giải</p>
                        <div className="text-white text-lg"><MathText text={q.explanation} /></div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ============ TỔNG KẾT ============ */}
      {roomData?.status === 'END' && (() => {
        const rating = classRating({
          fuel,
          blackouts: roomData.blackouts || 0,
          stormsPassed: roomData.stormsPassed || 0,
          stormsTotal
        });
        const hist = Object.entries(roomData.history || {})
          .map(([k, v]) => ({ idx: Number(k), ...v }))
          .sort((a, b) => a.idx - b.idx);
        const avgRatio = hist.length ? Math.round(hist.reduce((s, h) => s + h.ratio, 0) / hist.length) : 0;
        const hardest = [...hist].sort((a, b) => a.ratio - b.ratio)[0];
        const best = [...hist].sort((a, b) => b.ratio - a.ratio)[0];
        // Vinh danh những em đóng góp nhiều nhất, cố tình không xếp hạng đầy đủ
        const heroes = [...playersList].sort((a, b) => (b.correctCount || 0) - (a.correctCount || 0)).slice(0, 5).filter(p => p.correctCount > 0);

        return (
          <div className="w-full h-screen overflow-y-auto px-4 py-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center">
                <div className="text-7xl mb-2">{rating.emoji}</div>
                <h1 className={`text-4xl md:text-6xl font-black uppercase ${rating.color} drop-shadow-[0_0_35px_rgba(56,189,248,0.6)]`}>{rating.title}</h1>
                <p className="text-lg text-white/80 mt-2">{rating.note}</p>
              </div>

              <div className="grid md:grid-cols-[300px_1fr] gap-5 mt-7">
                <div className="bg-black/40 rounded-3xl border border-sky-700/40 p-4">
                  <Lighthouse fuel={fuel} />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/45 rounded-2xl p-4 text-center border border-white/15">
                      <div className="text-4xl font-black text-amber-300">{fuel}%</div>
                      <div className="text-sm text-gray-400 font-bold mt-1">dầu còn lại</div>
                    </div>
                    <div className="bg-black/45 rounded-2xl p-4 text-center border border-white/15">
                      <div className="text-4xl font-black text-emerald-300">{avgRatio}%</div>
                      <div className="text-sm text-gray-400 font-bold mt-1">lớp đúng trung bình</div>
                    </div>
                    <div className="bg-black/45 rounded-2xl p-4 text-center border border-white/15">
                      <div className="text-4xl font-black text-indigo-300">{roomData.stormsPassed || 0}/{stormsTotal}</div>
                      <div className="text-sm text-gray-400 font-bold mt-1">cơn bão vượt qua</div>
                    </div>
                    <div className="bg-black/45 rounded-2xl p-4 text-center border border-white/15">
                      <div className="text-4xl font-black text-red-300">{roomData.blackouts || 0}</div>
                      <div className="text-sm text-gray-400 font-bold mt-1">lần đèn tắt</div>
                    </div>
                  </div>

                  {hardest && best && (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="bg-orange-900/40 border border-orange-600 rounded-2xl p-4">
                        <p className="text-orange-300 font-bold text-sm">🧗 Câu khó nhất</p>
                        <p className="text-white font-black text-lg mt-1">Câu {hardest.idx + 1} — chỉ {hardest.ratio}% lớp đúng</p>
                        <p className="text-gray-400 text-sm">Nên dạy lại phần này</p>
                      </div>
                      <div className="bg-emerald-900/40 border border-emerald-600 rounded-2xl p-4">
                        <p className="text-emerald-300 font-bold text-sm">💪 Cả lớp làm tốt nhất</p>
                        <p className="text-white font-black text-lg mt-1">Câu {best.idx + 1} — {best.ratio}% lớp đúng</p>
                        <p className="text-gray-400 text-sm">Phần này lớp đã nắm chắc</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hành trình giữ lửa qua từng câu */}
              <div className="mt-5 bg-black/45 rounded-3xl border border-sky-600/40 p-5">
                <h3 className="text-xl font-black text-sky-300 mb-3 uppercase text-center">🕯️ Hành trình giữ lửa</h3>
                <div className="flex items-end gap-1.5 h-40">
                  {hist.map(h => (
                    <div key={h.idx} className="flex-1 flex flex-col items-center justify-end h-full group" title={`Câu ${h.idx + 1}: ${h.ratio}% đúng, dầu ${h.fuel}%`}>
                      <span className="text-[10px] text-gray-400 font-bold mb-0.5">{h.fuel}</span>
                      <div
                        className={`w-full rounded-t transition-all ${h.storm ? 'bg-gradient-to-t from-indigo-600 to-indigo-300' : h.fuel > 50 ? 'bg-gradient-to-t from-emerald-600 to-lime-400' : h.fuel > 20 ? 'bg-gradient-to-t from-amber-600 to-yellow-400' : 'bg-gradient-to-t from-red-700 to-orange-500'}`}
                        style={{ height: `${Math.max(4, h.fuel)}%` }}
                      />
                      <span className="text-[10px] text-gray-500 font-bold mt-1">{h.storm ? '🌪️' : h.idx + 1}</span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-gray-500 text-xs mt-2">Cột tím là những cơn bão lớn</p>
              </div>

              {/* Vinh danh, cố ý không xếp hạng toàn lớp */}
              {heroes.length > 0 && (
                <div className="mt-5 bg-black/45 rounded-3xl border border-amber-600/40 p-5">
                  <h3 className="text-xl font-black text-amber-300 mb-1 uppercase text-center">🕯️ Những người giữ lửa</h3>
                  <p className="text-center text-gray-400 text-sm mb-4">Cảm ơn các bạn đã góp nhiều ánh sáng nhất cho cả lớp</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {heroes.map((p, i) => (
                      <div key={p.id} className={`px-4 py-2.5 rounded-2xl font-bold border ${i === 0 ? 'bg-amber-500/25 border-amber-400 text-amber-100' : 'bg-slate-800/80 border-slate-600 text-white'}`}>
                        {i === 0 ? '🌟' : '⭐'} {p.name}
                        <span className="text-amber-300 font-black ml-2">{p.correctCount} câu</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-3 mt-6 pb-8">
                <button onClick={() => setShowStatsModal(true)} className="bg-slate-800/80 hover:bg-slate-700 px-6 py-3 rounded-2xl border border-red-500/50 flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-red-400" />
                  <span className="text-lg font-bold text-red-400">Thống Kê Câu Sai</span>
                </button>
                <button onClick={closeRoom} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-2xl font-black text-lg">Thoát &amp; Xoá Phòng</button>
              </div>
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
                              <div className="text-red-400 font-bold bg-red-900/30 px-3 py-1 rounded-lg">{q.wrongCount} bạn sai</div>
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

export default LighthouseHost;
