import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Upload, Play, Users, CheckCircle2, Download, FileSpreadsheet } from 'lucide-react';
import { db } from '../firebase';
import { ref, set, update, onValue, remove, get } from 'firebase/database';
import QuestionGuidePanel from '../components/QuestionGuidePanel';
import GameRulesOverlay from '../components/GameRulesOverlay';
import RaceTrack from '../components/RaceTrack';

const THEMES = [
  { id: 'speed',  name: '🏁 Tốc Độ',  bgStyle: { background: 'linear-gradient(135deg,#0c0a09 0%,#1c1917 50%,#7f1d1d 100%)' }, preview: 'from-red-900 via-stone-900 to-black' },
  { id: 'cosmos', name: '🌌 Vũ Trụ',  bgStyle: { background: 'linear-gradient(135deg,#020617 0%,#0f172a 40%,#1e1b4b 100%)' }, preview: 'from-indigo-900 via-slate-900 to-violet-900' },
  { id: 'forest', name: '🌿 Rừng Xanh', bgStyle: { background: 'linear-gradient(135deg,#022c22 0%,#064e3b 50%,#065f46 100%)' }, preview: 'from-emerald-900 via-teal-900 to-green-900' },
  { id: 'ocean',  name: '🌊 Đại Dương', bgStyle: { background: 'linear-gradient(180deg,#0c1445 0%,#0a2463 50%,#023e8a 100%)' }, preview: 'from-blue-900 via-sky-900 to-cyan-900' },
];

const HOST_ROOM_KEY = 'raceHostRoom';

// Điểm quy về thang 10 để vào sổ luôn
export const scoreOf = (correct, total) =>
  total > 0 ? Math.round((correct / total) * 100) / 10 : 0;

const RaceHost = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [fileName, setFileName] = useState('');
  const [localGameState, setLocalGameState] = useState('SETUP');
  const [roomCode, setRoomCode] = useState('');
  const [totalMinutes, setTotalMinutes] = useState(15);
  const [shuffle, setShuffle] = useState(true);
  const [instantFeedback, setInstantFeedback] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [gameTitle, setGameTitle] = useState('ĐƯỜNG ĐUA TRI THỨC');
  const [defaultClass, setDefaultClass] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem('raceBgUrl') || '');
  const [resumeRoom, setResumeRoom] = useState(null);
  const [showRules, setShowRules] = useState(false);

  const currentAudio = useRef(null);
  const playAudio = (url) => {
    if (currentAudio.current) { currentAudio.current.pause(); currentAudio.current.currentTime = 0; }
    if (url) { const a = new Audio(url); currentAudio.current = a; a.play().catch(() => {}); }
  };

  useEffect(() => {
    if (!roomCode) return;
    const unsub = onValue(ref(db, `raceRooms/${roomCode}`), (snap) => {
      const data = snap.val();
      if (data) setRoomData(data);
    });
    return () => unsub();
  }, [roomCode]);

  // Đồng hồ chung của cả cuộc đua, tính từ mốc xuất phát trên máy chủ
  useEffect(() => {
    if (roomData?.status !== 'RACING' || !roomData?.startedAt) return;
    const totalSec = (roomData.settings?.totalMinutes || 15) * 60;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - roomData.startedAt) / 1000);
      const left = Math.max(0, totalSec - elapsed);
      setTimeLeft(left);
      if (left === 0) finishRace();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [roomData?.status, roomData?.startedAt]);

  useEffect(() => {
    let code = null;
    try { code = localStorage.getItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (!code) return;
    get(ref(db, `raceRooms/${code}`)).then(snap => {
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
          return {
            type: 'TLN', question: row[0] || '', correctOption: row[2]?.toString().trim() || '',
            explanation: row[3]?.toString() || '', image: row[7] || null,
            timeLimit: parseInt(row[8]) > 0 ? parseInt(row[8]) : null
          };
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
    setShowRules(true);
    playAudio('https://files.catbox.moe/eopz4f.mp3');

    await set(ref(db, `raceRooms/${code}`), {
      status: 'LOBBY',
      questions,
      players: {},
      settings: { totalMinutes, shuffle, instantFeedback, gameTitle, bgUrl, defaultClass }
    });
  };

  const startRace = async () => {
    playAudio('https://files.catbox.moe/amew8w.mp3');
    await update(ref(db, `raceRooms/${roomCode}`), { status: 'RACING', startedAt: Date.now() });
    setLocalGameState('PLAYING');
  };

  const finishRace = async () => {
    if (roomData?.status === 'END') return;
    playAudio('https://files.catbox.moe/12vlpb.mp3');
    await update(ref(db, `raceRooms/${roomCode}`), { status: 'END', endedAt: Date.now() });
  };

  const closeRoom = async () => {
    if (!window.confirm("Kết thúc hoàn toàn và xoá phòng chơi này?")) return;
    await remove(ref(db, `raceRooms/${roomCode}`));
    try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setLocalGameState('SETUP');
    setRoomCode('');
    setRoomData(null);
  };

  const playersList = roomData?.players ? Object.values(roomData.players) : [];
  const totalQ = roomData?.questions?.length || questions.length || 1;

  const ranked = [...playersList].sort((a, b) => {
    const d = (b.correctCount || 0) - (a.correctCount || 0);
    if (d !== 0) return d;
    const fa = a.finishedAt || Infinity, fb = b.finishedAt || Infinity;
    return fa - fb;
  });

  const finishedCount = playersList.filter(p => p.finishedAt).length;
  const theme = selectedTheme;
  const currentBgUrl = roomData?.settings?.bgUrl || bgUrl;

  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Xuất bảng điểm: 4 cột chính theo yêu cầu, kèm vài cột tham khảo phía sau
  const exportExcel = () => {
    const startedAt = roomData?.startedAt || 0;
    const rows = [['STT', 'Họ tên', 'Lớp', 'Điểm', 'Số câu đúng', 'Số câu đã làm', 'Tổng câu', 'Thời gian làm bài']];

    ranked.forEach((p, i) => {
      const correct = p.correctCount || 0;
      const secs = p.finishedAt && startedAt ? Math.round((p.finishedAt - startedAt) / 1000) : null;
      rows.push([
        i + 1,
        p.name || '',
        p.className || '',
        scoreOf(correct, totalQ),
        correct,
        p.answeredCount || 0,
        totalQ,
        secs === null ? 'Chưa nộp' : mmss(secs)
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 26 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BangDiem");

    const stamp = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    const title = (roomData?.settings?.gameTitle || 'DuongDua').replace(/[^\p{L}\p{N}]+/gu, '_');
    XLSX.writeFile(wb, `BangDiem_${title}_${stamp}.xlsx`);
  };

  return (
    <div className="min-h-screen text-white relative p-4 md:p-6" style={localGameState !== 'SETUP' ? theme.bgStyle : { background: '#0f172a' }}>
      {localGameState !== 'SETUP' && currentBgUrl && (
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${currentBgUrl})`, opacity: 0.4 }} />
      )}

      <div className="relative z-10 w-full min-h-screen flex flex-col">

      {/* ============ TẠO PHÒNG ============ */}
      {localGameState === 'SETUP' && (
        <div className="relative w-full min-h-screen">
          <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate('/games')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
              <ArrowLeft className="w-5 h-5" /> Quay lại kho game
            </button>

            <h1 className="text-4xl font-black mb-2 text-red-400 text-center">🏁 Đường Đua Tri Thức</h1>
            <p className="text-gray-300 text-center">Học sinh <b className="text-red-300">tự làm theo nhịp riêng</b> trên điện thoại, không phải chờ nhau</p>
            <p className="text-red-200/70 text-center text-sm mt-1 mb-10">Kết thúc có bảng điểm xuất ra Excel để vào sổ</p>

            {resumeRoom && (
              <div className="mb-8 bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-300">🔌 Phòng {resumeRoom} vẫn đang chạy</h3>
                  <p className="text-gray-300 text-sm mt-1">Bài làm của học sinh còn nguyên. Nối lại để tiếp tục và xuất điểm.</p>
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
                    className={`relative rounded-2xl overflow-hidden h-24 transition-all border-4 ${selectedTheme.id === t.id ? 'border-white scale-105' : 'border-transparent hover:border-white/40'}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${t.preview}`} />
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                      <span className="text-2xl">{t.name.split(' ')[0]}</span>
                      <span className="text-white text-xs font-bold">{t.name.split(' ').slice(1).join(' ')}</span>
                    </div>
                    {selectedTheme.id === t.id && <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-red-600" /></div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-5">
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                  <label className="block text-gray-400 mb-2 font-bold text-sm">📝 Tên bài</label>
                  <input type="text" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)}
                    className="w-full bg-slate-900 text-white text-xl font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-red-500" />
                </div>

                <div className="flex-1 border-2 border-dashed border-red-500/30 p-7 rounded-xl hover:bg-red-500/10 text-center flex flex-col justify-center">
                  <Upload className="w-10 h-10 text-red-400 mx-auto mb-3" />
                  <p className="text-lg mb-4 text-gray-300">Tải lên file Excel chứa câu hỏi</p>
                  <div className="flex flex-col md:flex-row justify-center gap-3">
                    <label className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer inline-flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5" /> Chọn File Excel
                      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button onClick={downloadTemplate} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center justify-center gap-2">
                      <Download className="w-5 h-5" /> Tải File Mẫu
                    </button>
                  </div>
                  {fileName && (
                    <div className="mt-4 text-red-300 bg-red-900/30 p-3 rounded-lg border border-red-500/30">
                      ✅ <strong>{fileName}</strong> — {questions.length} câu hỏi
                      {questions.filter(q => q.timeLimit).length > 0 && (
                        <div className="text-xs opacity-80 mt-1">⏱ {questions.filter(q => q.timeLimit).length} câu có thời gian riêng</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                  <label className="block text-gray-400 mb-2 font-bold text-sm">🖼️ Link ảnh nền (tuỳ chọn)</label>
                  <input type="text" value={bgUrl}
                    onChange={(e) => { setBgUrl(e.target.value); localStorage.setItem('raceBgUrl', e.target.value); }}
                    className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg outline-none border border-transparent focus:border-red-500" placeholder="https://..." />
                </div>
              </div>

              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col justify-center">
                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">⏱ Tổng thời gian làm bài (phút)</label>
                <input type="number" min="1" value={totalMinutes}
                  onChange={(e) => setTotalMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 text-red-400 text-4xl font-black text-center py-3 rounded-lg outline-none mb-2" />
                <p className="text-gray-500 text-xs text-center mb-5">Hết giờ hệ thống tự thu bài của tất cả học sinh</p>

                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">🏫 Lớp mặc định (điền sẵn cho học sinh)</label>
                <input type="text" value={defaultClass} onChange={(e) => setDefaultClass(e.target.value)}
                  placeholder="VD: 10A1"
                  className="w-full bg-slate-900 text-white text-xl font-bold text-center py-3 rounded-lg outline-none mb-5 border border-transparent focus:border-red-500" />

                <label className="flex items-center gap-3 cursor-pointer bg-slate-900 p-4 rounded-lg border border-transparent hover:border-red-500/50 mb-3">
                  <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} className="w-5 h-5 accent-red-500 cursor-pointer" />
                  <span className="text-gray-300 font-bold select-none text-sm">
                    🔀 Xáo trộn thứ tự câu hỏi cho từng học sinh
                    <span className="block text-gray-500 font-normal text-xs mt-0.5">Mỗi em một thứ tự riêng nên khó nhìn bài nhau</span>
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer bg-slate-900 p-4 rounded-lg border border-transparent hover:border-red-500/50">
                  <input type="checkbox" checked={instantFeedback} onChange={(e) => setInstantFeedback(e.target.checked)} className="w-5 h-5 accent-red-500 cursor-pointer" />
                  <span className="text-gray-300 font-bold select-none text-sm">
                    ⚡ Báo đúng/sai ngay sau mỗi câu
                    <span className="block text-gray-500 font-normal text-xs mt-0.5">Tắt đi nếu muốn giống một bài kiểm tra thật</span>
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-br from-red-950/60 to-slate-900 p-6 rounded-2xl border-2 border-red-700/40">
              <h2 className="text-2xl font-black text-red-400 mb-3">📋 Trò này khác gì các trò kia?</h2>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Học sinh <b className="text-white">tự làm hết đề theo tốc độ riêng</b>, không dừng lại chờ cả lớp từng câu.</li>
                <li>• Xe trên đường đua chỉ tiến khi <b className="text-emerald-300">trả lời ĐÚNG</b> — bấm bừa cho nhanh cũng đứng yên tại chỗ.</li>
                <li>• Bằng điểm nhau thì <b className="text-amber-300">ai nộp sớm hơn xếp trên</b>.</li>
                <li>• Kết thúc có nút <b className="text-white">xuất Excel</b>: STT · Họ tên · Lớp · Điểm (thang 10).</li>
              </ul>
            </div>

            <div className="mt-10 mb-8"><QuestionGuidePanel /></div>
          </div>

          <button onClick={createRoom} disabled={questions.length === 0 || !gameTitle.trim()}
            className={`absolute top-6 right-6 px-8 py-4 rounded-2xl font-black text-xl transition-all ${questions.length > 0 && gameTitle.trim() ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30 hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
            🚀 TẠO PHÒNG
          </button>
        </div>
      )}

      {/* ============ PHÒNG CHỜ ============ */}
      {localGameState === 'LOBBY' && roomData && (() => {
        const playUrl = `https://webdayhoc.vercel.app/race/play?pin=${roomCode}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(playUrl)}&bgcolor=ffffff&color=000000&margin=10`;
        return (
          <div className="w-full min-h-screen flex flex-col">
            <GameRulesOverlay
              open={showRules}
              onClose={() => setShowRules(false)}
              bgStyle={theme.bgStyle}
              accent="amber"
              emoji="🏁"
              title="Đường Đua Tri Thức"
              subtitle="Ai vừa nhanh vừa chắc thì về đích trước"
              steps={[
                { icon: '1️⃣', text: 'Nhập HỌ TÊN và LỚP của em để thầy cô vào điểm' },
                { icon: '2️⃣', text: 'Cả đề nằm trên điện thoại của em — tự làm theo tốc độ riêng', note: 'Không phải chờ các bạn khác từng câu' },
                { icon: '3️⃣', text: `Cả lớp có ${roomData.settings?.totalMinutes || 15} phút cho toàn bộ bài`, note: 'Hết giờ hệ thống tự thu bài' },
                { icon: '4️⃣', text: 'Xe chỉ tiến khi em trả lời ĐÚNG', note: 'Bấm bừa cho nhanh thì xe đứng yên tại chỗ' },
                ...(roomData.settings?.shuffle ? [{ icon: '🔀', text: 'Mỗi bạn có thứ tự câu hỏi riêng nên nhìn bài nhau vô ích' }] : []),
                { icon: '🏁', text: 'Làm xong bấm NỘP BÀI — bằng điểm thì ai nộp sớm hơn xếp trên' },
              ]}
              highlights={[
                { emoji: '⚡', tone: 'info', title: 'Nhanh nhưng phải chắc', text: 'Sai một câu là mất một bước tiến' },
                { emoji: '📱', tone: 'good', title: 'Làm trọn trên điện thoại', text: 'Câu hỏi và đáp án đều hiện trên máy của em' },
                { emoji: '📊', tone: 'star', title: 'Có điểm vào sổ', text: 'Kết thúc thầy cô nhận bảng điểm thang 10' },
              ]}
              footer="Sẵn sàng vào vạch xuất phát chưa nào? 🏎️"
            />

            <div className="text-center pt-8 pb-3 shrink-0">
              <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-200 to-red-500 uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                {roomData.settings.gameTitle || 'ĐƯỜNG ĐUA TRI THỨC'}
              </h1>
              <h2 className="text-lg text-red-100/80 mt-2 font-semibold tracking-widest uppercase">
                {totalQ} câu · {roomData.settings?.totalMinutes || 15} phút
              </h2>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-5 px-6 pb-6 overflow-hidden">
              <div className="md:w-[42%] shrink-0 flex flex-col items-center justify-center gap-5">
                <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 border border-white/20 flex flex-col items-center gap-3">
                  <p className="text-red-300 text-lg font-black uppercase tracking-widest border-b border-white/10 pb-2 w-full text-center">Quét Mã QR</p>
                  <div className="bg-white p-3 rounded-2xl"><img src={qrUrl} alt="QR" className="w-[240px] h-[240px] md:w-[300px] md:h-[300px] rounded-xl" /></div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl rounded-3xl px-9 py-4 border border-white/20 text-center">
                  <p className="text-red-300 text-base font-black uppercase tracking-widest mb-1">Mã Phòng</p>
                  <div className="text-6xl md:text-7xl font-black tracking-[0.15em] text-white select-all">{roomCode}</div>
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0 gap-2">
                  <div className="flex items-center gap-3 text-xl font-black text-white">
                    <div className="bg-red-600 p-2 rounded-xl"><Users className="w-6 h-6" /></div>
                    <span>{playersList.length} tay đua</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowRules(true)} className="px-4 py-3 rounded-2xl font-black bg-slate-800/80 hover:bg-slate-700 text-white border border-white/20">📖 Luật</button>
                    <button onClick={startRace} disabled={playersList.length === 0}
                      className={`px-6 py-3 rounded-2xl font-black text-lg flex items-center gap-2 ${playersList.length > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-105 text-white' : 'bg-slate-800 text-gray-500 cursor-not-allowed'}`}>
                      <Play className="w-6 h-6" /> XUẤT PHÁT
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-wrap gap-2 content-start">
                    {playersList.map(p => (
                      <div key={p.id} className="bg-white/10 border border-white/20 px-3 py-2 rounded-xl text-white text-sm">
                        <span className="font-bold">{p.name}</span>
                        {p.className && <span className="text-red-300 ml-2 font-bold">{p.className}</span>}
                      </div>
                    ))}
                    {playersList.length === 0 && <p className="text-gray-400">Đang chờ các tay đua vào vạch xuất phát…</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============ ĐANG ĐUA ============ */}
      {localGameState === 'PLAYING' && roomData?.status === 'RACING' && (
        <div className="w-full flex flex-col min-h-screen">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className={`text-4xl font-black px-6 py-2.5 rounded-xl border backdrop-blur-md ${timeLeft <= 60 ? 'bg-red-500/30 border-red-400 text-red-200 animate-pulse' : 'bg-black/35 border-white/15 text-white'}`}>
              ⏱ {mmss(timeLeft)}
            </div>
            <div className="bg-black/35 px-5 py-2.5 rounded-xl text-lg font-bold text-emerald-400 border border-white/10">
              Đã nộp: {finishedCount}/{playersList.length}
            </div>
            <div className="bg-black/35 px-5 py-2.5 rounded-xl text-lg font-bold text-red-300 border border-white/10">
              {totalQ} câu
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setShowRules(true)} className="bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold border border-white/15">📖 Luật</button>
              <button onClick={finishRace} className="bg-red-900/60 hover:bg-red-600 text-red-100 px-5 py-2.5 rounded-xl font-bold">🏁 Thu bài ngay</button>
            </div>
          </div>

          <GameRulesOverlay
            open={showRules}
            onClose={() => setShowRules(false)}
            bgStyle={theme.bgStyle}
            accent="amber"
            emoji="🏁"
            title="Đường Đua Tri Thức"
            subtitle="Ai vừa nhanh vừa chắc thì về đích trước"
            steps={[
              { icon: '1️⃣', text: 'Cả đề nằm trên điện thoại, tự làm theo tốc độ riêng' },
              { icon: '2️⃣', text: 'Xe chỉ tiến khi trả lời ĐÚNG' },
              { icon: '3️⃣', text: 'Làm xong bấm NỘP BÀI' },
            ]}
            footer="Cố lên các tay đua! 🏎️"
          />

          <div className="flex-1">
            <RaceTrack players={playersList} totalQuestions={totalQ} maxLanes={14} />
          </div>

          <div className="mt-3 bg-black/35 rounded-2xl border border-white/15 p-3">
            <div className="flex flex-wrap gap-2 justify-center">
              {ranked.slice(0, 24).map(p => (
                <div key={p.id} className={`px-3 py-1.5 rounded-full text-sm font-bold border ${p.finishedAt ? 'bg-emerald-900/50 border-emerald-500 text-emerald-200' : 'bg-slate-800/70 border-slate-600 text-gray-300'}`}>
                  {p.name} <span className="text-amber-300">{p.correctCount || 0}/{totalQ}</span>
                  {p.finishedAt && ' ✅'}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ KẾT QUẢ ============ */}
      {roomData?.status === 'END' && (
        <div className="w-full min-h-screen overflow-y-auto">
          <div className="max-w-5xl mx-auto py-4">
            <div className="text-center mb-6">
              <div className="text-7xl mb-1">🏁</div>
              <h1 className="text-4xl md:text-5xl font-black text-red-300 uppercase drop-shadow-[0_0_30px_rgba(248,113,113,0.5)]">Kết Thúc Cuộc Đua</h1>
              <p className="text-white/80 mt-2">{playersList.length} tay đua · {totalQ} câu · {finishedCount} bạn đã nộp bài</p>
            </div>

            {/* Bục ba hạng đầu */}
            <div className="flex justify-center items-end gap-4 md:gap-7 mb-7">
              {ranked[1] && (
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-gray-300 mb-1 max-w-[120px] truncate text-center">{ranked[1].name}</div>
                  <div className="w-24 h-28 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-xl flex items-center justify-center text-5xl font-black text-white">2</div>
                  <div className="text-xl font-black mt-2 text-gray-300">{scoreOf(ranked[1].correctCount || 0, totalQ)}đ</div>
                </div>
              )}
              {ranked[0] && (
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-1">👑</div>
                  <div className="text-xl font-black text-yellow-400 mb-1 max-w-[160px] truncate text-center">{ranked[0].name}</div>
                  <div className="w-32 h-40 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-xl flex items-center justify-center text-7xl font-black text-white">1</div>
                  <div className="text-2xl font-black mt-2 text-yellow-400">{scoreOf(ranked[0].correctCount || 0, totalQ)}đ</div>
                </div>
              )}
              {ranked[2] && (
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-amber-600 mb-1 max-w-[120px] truncate text-center">{ranked[2].name}</div>
                  <div className="w-24 h-20 bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-xl flex items-center justify-center text-5xl font-black text-white">3</div>
                  <div className="text-xl font-black mt-2 text-amber-600">{scoreOf(ranked[2].correctCount || 0, totalQ)}đ</div>
                </div>
              )}
            </div>

            {/* Nút xuất Excel */}
            <div className="flex justify-center gap-3 mb-6">
              <button onClick={exportExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none transition-all">
                <FileSpreadsheet className="w-6 h-6" /> XUẤT BẢNG ĐIỂM EXCEL
              </button>
              <button onClick={closeRoom} className="bg-red-700 hover:bg-red-600 text-white px-6 py-4 rounded-2xl font-black">Thoát &amp; Xoá Phòng</button>
            </div>

            {/* Bảng điểm đầy đủ */}
            <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden mb-8">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase">📊 Bảng điểm</h3>
                <span className="text-gray-400 text-sm">Điểm quy về thang 10</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-gray-300 text-sm">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">STT</th>
                      <th className="px-4 py-2.5 font-bold">Họ tên</th>
                      <th className="px-4 py-2.5 font-bold">Lớp</th>
                      <th className="px-4 py-2.5 font-bold text-right">Điểm</th>
                      <th className="px-4 py-2.5 font-bold text-right">Đúng</th>
                      <th className="px-4 py-2.5 font-bold text-right">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((p, i) => {
                      const sc = scoreOf(p.correctCount || 0, totalQ);
                      const secs = p.finishedAt && roomData.startedAt ? Math.round((p.finishedAt - roomData.startedAt) / 1000) : null;
                      return (
                        <tr key={p.id} className={`border-t border-white/5 ${i < 3 ? 'bg-yellow-500/10' : ''}`}>
                          <td className="px-4 py-2.5 font-black text-gray-300">{i + 1}</td>
                          <td className="px-4 py-2.5 font-bold text-white">{p.name}</td>
                          <td className="px-4 py-2.5 text-red-300 font-bold">{p.className || '—'}</td>
                          <td className={`px-4 py-2.5 text-right font-black text-xl ${sc >= 8 ? 'text-emerald-400' : sc >= 5 ? 'text-amber-400' : 'text-red-400'}`}>{sc}</td>
                          <td className="px-4 py-2.5 text-right text-gray-300 font-bold">{p.correctCount || 0}/{totalQ}</td>
                          <td className="px-4 py-2.5 text-right text-gray-400 text-sm">{secs === null ? 'Chưa nộp' : mmss(secs)}</td>
                        </tr>
                      );
                    })}
                    {ranked.length === 0 && (
                      <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">Không có tay đua nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default RaceHost;
