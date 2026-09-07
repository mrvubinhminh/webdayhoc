import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Upload, Play, Users, CheckCircle2, Download, FileSpreadsheet } from 'lucide-react';
import { db } from '../firebase';
import { ref, set, update, onValue, remove, get } from 'firebase/database';
import QuestionGuidePanel from '../components/QuestionGuidePanel';
import GameRulesOverlay from '../components/GameRulesOverlay';
import MountainClimb from '../components/MountainClimb';
import { suspicionOf } from '../hooks/useFocusGuard';
import { LEVELS, levelOf, parseLevel, groupByLevel, passCountFor, maxScoreOf, toTen } from '../data/climbLevels';

const THEMES = [
  { id: 'alpine', name: '🏔️ Núi Tuyết', bgStyle: { background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 45%,#334155 100%)' }, preview: 'from-slate-700 via-slate-900 to-indigo-950' },
  { id: 'sunset', name: '🌄 Hoàng Hôn', bgStyle: { background: 'linear-gradient(180deg,#431407 0%,#7c2d12 45%,#1c1917 100%)' }, preview: 'from-orange-900 via-amber-900 to-stone-900' },
  { id: 'forest', name: '🌲 Rừng Núi', bgStyle: { background: 'linear-gradient(180deg,#022c22 0%,#064e3b 50%,#0f172a 100%)' }, preview: 'from-emerald-900 via-teal-900 to-slate-900' },
  { id: 'cosmos', name: '🌌 Đêm Sao', bgStyle: { background: 'linear-gradient(180deg,#020617 0%,#0f172a 40%,#1e1b4b 100%)' }, preview: 'from-indigo-900 via-slate-900 to-violet-900' },
];

const HOST_ROOM_KEY = 'climbHostRoom';

const ClimbHost = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [fileName, setFileName] = useState('');
  const [localGameState, setLocalGameState] = useState('SETUP');
  const [roomCode, setRoomCode] = useState('');
  const [totalMinutes, setTotalMinutes] = useState(20);
  const [passRatio, setPassRatio] = useState(0.5);
  const [retries, setRetries] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [gameTitle, setGameTitle] = useState('LEO NÚI TRI THỨC');
  const [defaultClass, setDefaultClass] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem('climbBgUrl') || '');
  const [resumeRoom, setResumeRoom] = useState(null);
  const [showRules, setShowRules] = useState(false);

  const currentAudio = useRef(null);
  const playAudio = (url) => {
    if (currentAudio.current) { currentAudio.current.pause(); currentAudio.current.currentTime = 0; }
    if (url) { const a = new Audio(url); currentAudio.current = a; a.play().catch(() => {}); }
  };

  useEffect(() => {
    if (!roomCode) return;
    const unsub = onValue(ref(db, `climbRooms/${roomCode}`), (snap) => {
      const data = snap.val();
      if (data) setRoomData(data);
    });
    return () => unsub();
  }, [roomCode]);

  useEffect(() => {
    if (roomData?.status !== 'CLIMBING' || !roomData?.startedAt) return;
    const totalSec = (roomData.settings?.totalMinutes || 20) * 60;
    const tick = () => {
      const left = Math.max(0, totalSec - Math.floor((Date.now() - roomData.startedAt) / 1000));
      setTimeLeft(left);
      if (left === 0) finishClimb();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [roomData?.status, roomData?.startedAt]);

  useEffect(() => {
    let code = null;
    try { code = localStorage.getItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (!code) return;
    get(ref(db, `climbRooms/${code}`)).then(snap => {
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
        const base = {
          image: row[7] || null,
          timeLimit: parseInt(row[8]) > 0 ? parseInt(row[8]) : null,
          level: parseLevel(row[9])   // cột 10: mức độ nhận thức
        };
        if (row[1]?.toString().trim().toUpperCase() === 'TLN') {
          return { ...base, type: 'TLN', question: row[0] || '', correctOption: row[2]?.toString().trim() || '', explanation: row[3]?.toString() || '' };
        }
        return {
          ...base, type: 'TRAC_NGHIEM', question: row[0] || '',
          optionA: row[1] || '', optionB: row[2] || '', optionC: row[3] || '', optionD: row[4] || '',
          correctOption: parseInt(row[5]) || 1, explanation: row[6] || ''
        };
      }).filter(Boolean);
      setQuestions(parsed);
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws_data = [
      ['Nội dung câu hỏi', 'Đ/A A hoặc TLN', 'Đ/A B hoặc Đáp số', 'Đ/A C hoặc Lời giải', 'Đ/A D', 'Đáp án đúng (1/2/3/4)', 'Lời giải', 'Link ảnh (tùy chọn)', 'Thời gian riêng (giây)', 'Mức độ (NB/TH/VD/VDC)'],
      ['$2+3$ bằng bao nhiêu?', '4', '5', '6', '7', 2, 'Cộng hai số', '', '', 'NB'],
      ['Vì sao $a^0 = 1$?', 'Quy ước', 'Do $a^n/a^n=1$', 'Ngẫu nhiên', 'Không rõ', 2, 'Từ tính chất chia luỹ thừa', '', '', 'TH'],
      ['Giải $x^2-5x+6=0$', '$\\{1;6\\}$', '$\\{2;3\\}$', '$\\{-2;-3\\}$', '$\\{0;5\\}$', 2, 'Phân tích thành nhân tử', '', 60, 'VD'],
      ['Tìm m để phương trình có 2 nghiệm trái dấu', 'TLN', 'm<0', 'Tích hai nghiệm âm', '', '', '', '', 120, 'VDC']
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 40 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 26 }, { wch: 14 }, { wch: 16 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CauHoi");
    XLSX.writeFile(wb, "Mau_Cau_Hoi_LeoNui.xlsx");
  };

  const createRoom = async () => {
    if (questions.length === 0) { alert("Vui lòng tải lên file câu hỏi trước!"); return; }
    const groups = groupByLevel(questions);
    if (groups[1].length === 0) {
      if (!window.confirm("Đề không có câu nào ở tầng Nhận biết (cột 10).\nHọc sinh sẽ bắt đầu từ tầng có câu sớm nhất. Vẫn tạo phòng?")) return;
    }
    try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch { /* bị chặn */ }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    try { localStorage.setItem(HOST_ROOM_KEY, code); } catch { /* không sao */ }
    setLocalGameState('LOBBY');
    setShowRules(true);
    playAudio('https://files.catbox.moe/eopz4f.mp3');

    await set(ref(db, `climbRooms/${code}`), {
      status: 'LOBBY',
      questions,
      players: {},
      settings: { totalMinutes, passRatio, retries, gameTitle, bgUrl, defaultClass }
    });
  };

  const startClimb = async () => {
    playAudio('https://files.catbox.moe/amew8w.mp3');
    await update(ref(db, `climbRooms/${roomCode}`), { status: 'CLIMBING', startedAt: Date.now() });
    setLocalGameState('PLAYING');
  };

  const finishClimb = async () => {
    if (roomData?.status === 'END') return;
    playAudio('https://files.catbox.moe/12vlpb.mp3');
    await update(ref(db, `climbRooms/${roomCode}`), { status: 'END', endedAt: Date.now() });
  };

  const closeRoom = async () => {
    if (!window.confirm("Kết thúc hoàn toàn và xoá phòng chơi này?")) return;
    await remove(ref(db, `climbRooms/${roomCode}`));
    try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setLocalGameState('SETUP');
    setRoomCode('');
    setRoomData(null);
  };

  const playersList = roomData?.players ? Object.values(roomData.players) : [];
  const allQuestions = roomData?.questions || questions;
  const groups = groupByLevel(allQuestions);
  const maxScore = maxScoreOf(allQuestions);
  const ratio = roomData?.settings?.passRatio ?? passRatio;

  const ranked = [...playersList].sort((a, b) => {
    const d = (b.reachedLevel || 0) - (a.reachedLevel || 0);
    if (d !== 0) return d;
    return (b.earned || 0) - (a.earned || 0);
  });

  const doneCount = playersList.filter(p => p.finishedAt).length;
  const theme = selectedTheme;
  const currentBgUrl = roomData?.settings?.bgUrl || bgUrl;
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Xuất bảng điểm: 4 cột chính, kèm phân tích tầng để thầy nhìn phân hoá
  const exportExcel = () => {
    const rows = [['STT', 'Họ tên', 'Lớp', 'Điểm', 'Tầng đạt được', 'NB', 'TH', 'VD', 'VDC', 'Tổng câu đúng', 'Số lần rời màn hình', 'Tổng thời gian rời (giây)', 'Nghi chụp màn hình', 'Ghi chú']];
    ranked.forEach((p, i) => {
      const lv = p.reachedLevel || 0;
      const per = p.perLevel || {};
      rows.push([
        i + 1,
        p.name || '',
        p.className || '',
        toTen(p.earned || 0, maxScore),
        lv === 0 ? 'Chân núi' : levelOf(lv).name,
        `${per[1]?.correct || 0}/${groups[1].length}`,
        `${per[2]?.correct || 0}/${groups[2].length}`,
        `${per[3]?.correct || 0}/${groups[3].length}`,
        `${per[4]?.correct || 0}/${groups[4].length}`,
        p.correctCount || 0,
        p.awayCount || 0,
        Math.round((p.awayMs || 0) / 1000),
        p.shotCount || 0,
        suspicionOf({ awayCount: p.awayCount || 0, shotCount: p.shotCount || 0 }).label
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 26 }, { wch: 10 }, { wch: 8 }, { wch: 16 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BangDiem");
    const stamp = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    const title = (roomData?.settings?.gameTitle || 'LeoNui').replace(/[^\p{L}\p{N}]+/gu, '_');
    XLSX.writeFile(wb, `BangDiem_${title}_${stamp}.xlsx`);
  };

  return (
    <div className="min-h-screen text-white relative p-4 md:p-6" style={localGameState !== 'SETUP' ? theme.bgStyle : { background: '#0f172a' }}>
      {localGameState !== 'SETUP' && currentBgUrl && (
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${currentBgUrl})`, opacity: 0.35 }} />
      )}

      <div className="relative z-10 w-full min-h-screen flex flex-col">

      {/* ============ TẠO PHÒNG ============ */}
      {localGameState === 'SETUP' && (
        <div className="relative w-full min-h-screen">
          <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate('/games')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
              <ArrowLeft className="w-5 h-5" /> Quay lại kho game
            </button>

            <h1 className="text-4xl font-black mb-2 text-sky-200 text-center">⛰️ Leo Núi Tri Thức</h1>
            <p className="text-gray-300 text-center">Đề chia 4 tầng theo mức độ — qua tầng dưới mới được leo lên tầng trên</p>
            <p className="text-sky-200/70 text-center text-sm mt-1 mb-10">Kết thúc thầy cô thấy ngay phổ năng lực cả lớp và có bảng điểm Excel</p>

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
                    {selectedTheme.id === t.id && <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-sky-600" /></div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-5">
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                  <label className="block text-gray-400 mb-2 font-bold text-sm">📝 Tên bài</label>
                  <input type="text" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)}
                    className="w-full bg-slate-900 text-white text-xl font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-sky-500" />
                </div>

                <div className="flex-1 border-2 border-dashed border-sky-500/30 p-7 rounded-xl hover:bg-sky-500/10 text-center flex flex-col justify-center">
                  <Upload className="w-10 h-10 text-sky-400 mx-auto mb-3" />
                  <p className="text-lg mb-1 text-gray-300">Tải lên file Excel chứa câu hỏi</p>
                  <p className="text-sky-300/80 text-sm mb-4">Nhớ điền <b>cột 10</b> mức độ: NB · TH · VD · VDC</p>
                  <div className="flex flex-col md:flex-row justify-center gap-3">
                    <label className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer inline-flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5" /> Chọn File Excel
                      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button onClick={downloadTemplate} className="bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center justify-center gap-2">
                      <Download className="w-5 h-5" /> Tải File Mẫu
                    </button>
                  </div>

                  {fileName && (
                    <div className="mt-4 text-sky-300 bg-sky-900/30 p-3 rounded-lg border border-sky-500/30 text-left">
                      ✅ <strong>{fileName}</strong> — {questions.length} câu hỏi
                      <div className="grid grid-cols-4 gap-1.5 mt-2">
                        {LEVELS.map(lv => (
                          <div key={lv.id} className="rounded-lg py-1.5 text-center" style={{ backgroundColor: lv.color + '22', border: `1px solid ${lv.color}66` }}>
                            <div className="font-black text-white text-sm">{groups[lv.id].length}</div>
                            <div className="text-[10px] font-bold" style={{ color: lv.color }}>{lv.short}</div>
                          </div>
                        ))}
                      </div>
                      {groups[1].length === 0 && (
                        <p className="text-amber-300 text-xs mt-2 font-bold">⚠️ Chưa có câu nào ở tầng Nhận biết — kiểm tra lại cột 10</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                  <label className="block text-gray-400 mb-2 font-bold text-sm">🖼️ Link ảnh nền (tuỳ chọn)</label>
                  <input type="text" value={bgUrl}
                    onChange={(e) => { setBgUrl(e.target.value); localStorage.setItem('climbBgUrl', e.target.value); }}
                    className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg outline-none border border-transparent focus:border-sky-500" placeholder="https://..." />
                </div>
              </div>

              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col justify-center">
                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">⏱ Tổng thời gian (phút)</label>
                <input type="number" min="1" value={totalMinutes}
                  onChange={(e) => setTotalMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 text-sky-300 text-4xl font-black text-center py-3 rounded-lg outline-none mb-5" />

                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">🎯 Ngưỡng qua tầng</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[0.4, 0.5, 0.6, 0.75].map(r => (
                    <button key={r} onClick={() => setPassRatio(r)}
                      className={`py-3 rounded-lg font-black transition-all ${passRatio === r ? 'bg-sky-500 text-slate-900 scale-105' : 'bg-slate-900 text-gray-400 hover:bg-slate-700'}`}>
                      {Math.round(r * 100)}%
                    </button>
                  ))}
                </div>
                <p className="text-gray-500 text-xs text-center mb-5">
                  Đúng {Math.round(passRatio * 100)}% số câu của tầng thì được leo lên tầng trên
                </p>

                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">🔁 Số lần được leo lại một tầng</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[0, 1, 2, 3].map(r => (
                    <button key={r} onClick={() => setRetries(r)}
                      className={`py-3 rounded-lg font-black transition-all ${retries === r ? 'bg-emerald-500 text-slate-900 scale-105' : 'bg-slate-900 text-gray-400 hover:bg-slate-700'}`}>
                      {r === 0 ? 'Không' : r}
                    </button>
                  ))}
                </div>
                <p className="text-gray-500 text-xs text-center mb-5">Trượt tầng thì được làm lại tầng đó, cho em yếu thêm cơ hội</p>

                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">🏫 Lớp mặc định</label>
                <input type="text" value={defaultClass} onChange={(e) => setDefaultClass(e.target.value)} placeholder="VD: 10A1"
                  className="w-full bg-slate-900 text-white text-xl font-bold text-center py-3 rounded-lg outline-none border border-transparent focus:border-sky-500" />
              </div>
            </div>

            {/* Bảng bốn tầng */}
            <div className="mt-8 bg-gradient-to-br from-slate-900 to-indigo-950/60 p-6 rounded-2xl border-2 border-sky-700/40">
              <h2 className="text-2xl font-black text-sky-200 mb-1">🧗 Bốn tầng của ngọn núi</h2>
              <p className="text-gray-400 text-sm mb-4">Điền mã tầng vào <b className="text-white">cột 10</b> của file Excel. Bỏ trống thì câu đó xếp vào tầng Nhận biết.</p>
              <div className="grid md:grid-cols-4 gap-3">
                {LEVELS.map(lv => (
                  <div key={lv.id} className="rounded-xl p-4" style={{ backgroundColor: lv.color + '20', border: `2px solid ${lv.color}77` }}>
                    <div className="text-3xl">{lv.emoji}</div>
                    <div className="font-black text-white mt-1">{lv.name}</div>
                    <div className="font-mono font-black text-sm mt-0.5" style={{ color: lv.color }}>{lv.code} · ×{lv.weight} điểm</div>
                    <div className="text-gray-400 text-xs mt-1.5 leading-snug">{lv.desc}</div>
                  </div>
                ))}
              </div>
              <p className="text-gray-400 text-sm mt-4">
                Cột 10 nhận cả mã viết tắt (<b className="text-white">NB · TH · VD · VDC</b>) lẫn số (<b className="text-white">1 · 2 · 3 · 4</b>).
              </p>
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
        const playUrl = `https://webdayhoc.vercel.app/climb/play?pin=${roomCode}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(playUrl)}&bgcolor=ffffff&color=000000&margin=10`;
        return (
          <div className="w-full min-h-screen flex flex-col">
            <GameRulesOverlay
              open={showRules}
              onClose={() => setShowRules(false)}
              bgStyle={theme.bgStyle}
              accent="sky"
              emoji="⛰️"
              title="Leo Núi Tri Thức"
              subtitle="Càng lên cao câu càng khó, nhưng mỗi câu đúng lại đáng giá hơn"
              steps={[
                { icon: '1️⃣', text: 'Nhập HỌ TÊN và LỚP để thầy cô vào điểm' },
                { icon: '2️⃣', text: 'Bắt đầu từ chân núi, làm hết các câu của tầng mình đang đứng' },
                { icon: '3️⃣', text: `Đúng ${Math.round(ratio * 100)}% số câu của tầng thì được leo lên tầng trên`, note: 'Chưa đạt thì dừng lại ở tầng đó' },
                { icon: '4️⃣', text: 'Càng lên cao điểm mỗi câu càng lớn', note: 'NB ×1 · TH ×1.5 · VD ×2 · VDC ×3' },
                ...(roomData.settings?.retries > 0
                  ? [{ icon: '🔁', text: `Trượt một tầng vẫn được leo lại ${roomData.settings.retries} lần`, note: 'Đừng nản, cứ thử lại!' }]
                  : []),
                { icon: '🏔️', text: `Cả lớp có ${roomData.settings?.totalMinutes || 20} phút để leo cao nhất có thể` },
              ]}
              highlights={[
                { emoji: '🌱', tone: 'good', title: 'Ai cũng có điểm', text: 'Dừng ở tầng nào vẫn được tính điểm các câu đã làm đúng' },
                { emoji: '📈', tone: 'info', title: 'Không đua tốc độ', text: 'Leo cao mới quan trọng, không phải làm nhanh' },
                { emoji: '🎯', tone: 'star', title: 'Biết mình đang ở đâu', text: 'Cuối buổi em thấy rõ mình vững tới mức nào' },
              ]}
              footer="Chậm mà chắc — cứ từng bậc một nhé! 🧗"
            />

            <div className="text-center pt-8 pb-3 shrink-0">
              <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-sky-100 to-sky-400 uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                {roomData.settings.gameTitle || 'LEO NÚI TRI THỨC'}
              </h1>
              <div className="flex justify-center gap-2 mt-3 flex-wrap">
                {LEVELS.map(lv => (
                  <span key={lv.id} className="px-3 py-1 rounded-full text-sm font-black" style={{ backgroundColor: lv.color + '25', color: lv.color, border: `1px solid ${lv.color}77` }}>
                    {lv.emoji} {lv.short}: {groups[lv.id].length} câu
                  </span>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-5 px-6 pb-6 overflow-hidden">
              <div className="md:w-[42%] shrink-0 flex flex-col items-center justify-center gap-5">
                <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 border border-white/20 flex flex-col items-center gap-3">
                  <p className="text-sky-300 text-lg font-black uppercase tracking-widest border-b border-white/10 pb-2 w-full text-center">Quét Mã QR</p>
                  <div className="bg-white p-3 rounded-2xl"><img src={qrUrl} alt="QR" className="w-[240px] h-[240px] md:w-[290px] md:h-[290px] rounded-xl" /></div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl rounded-3xl px-9 py-4 border border-white/20 text-center">
                  <p className="text-sky-300 text-base font-black uppercase tracking-widest mb-1">Mã Phòng</p>
                  <div className="text-6xl md:text-7xl font-black tracking-[0.15em] text-white select-all">{roomCode}</div>
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0 gap-2">
                  <div className="flex items-center gap-3 text-xl font-black text-white">
                    <div className="bg-sky-600 p-2 rounded-xl"><Users className="w-6 h-6" /></div>
                    <span>{playersList.length} nhà leo núi</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowRules(true)} className="px-4 py-3 rounded-2xl font-black bg-slate-800/80 hover:bg-slate-700 text-white border border-white/20">📖 Luật</button>
                    <button onClick={startClimb} disabled={playersList.length === 0}
                      className={`px-6 py-3 rounded-2xl font-black text-lg flex items-center gap-2 ${playersList.length > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-105 text-white' : 'bg-slate-800 text-gray-500 cursor-not-allowed'}`}>
                      <Play className="w-6 h-6" /> BẮT ĐẦU LEO
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-wrap gap-2 content-start">
                    {playersList.map(p => (
                      <div key={p.id} className="bg-white/10 border border-white/20 px-3 py-2 rounded-xl text-white text-sm">
                        <span className="font-bold">🧗 {p.name}</span>
                        {p.className && <span className="text-sky-300 ml-2 font-bold">{p.className}</span>}
                      </div>
                    ))}
                    {playersList.length === 0 && <p className="text-gray-400">Đang chờ các nhà leo núi tập kết…</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============ ĐANG LEO ============ */}
      {localGameState === 'PLAYING' && roomData?.status === 'CLIMBING' && (
        <div className="w-full flex flex-col min-h-screen">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className={`text-4xl font-black px-6 py-2.5 rounded-xl border backdrop-blur-md ${timeLeft <= 60 ? 'bg-red-500/30 border-red-400 text-red-200 animate-pulse' : 'bg-black/35 border-white/15 text-white'}`}>
              ⏱ {mmss(timeLeft)}
            </div>
            <div className="bg-black/35 px-5 py-2.5 rounded-xl text-lg font-bold text-emerald-400 border border-white/10">
              Đã dừng chân: {doneCount}/{playersList.length}
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setShowRules(true)} className="bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold border border-white/15">📖 Luật</button>
              <button onClick={finishClimb} className="bg-red-900/60 hover:bg-red-600 text-red-100 px-5 py-2.5 rounded-xl font-bold">🏔️ Kết thúc ngay</button>
            </div>
          </div>

          <GameRulesOverlay
            open={showRules}
            onClose={() => setShowRules(false)}
            bgStyle={theme.bgStyle}
            accent="sky"
            emoji="⛰️"
            title="Leo Núi Tri Thức"
            subtitle="Càng lên cao câu càng khó, nhưng mỗi câu đúng lại đáng giá hơn"
            steps={[
              { icon: '1️⃣', text: 'Làm hết các câu của tầng mình đang đứng' },
              { icon: '2️⃣', text: `Đúng ${Math.round(ratio * 100)}% số câu của tầng thì được leo lên tầng trên` },
              { icon: '3️⃣', text: 'NB ×1 · TH ×1.5 · VD ×2 · VDC ×3 điểm' },
            ]}
            footer="Cứ từng bậc một nhé! 🧗"
          />

            {(() => {
              // Nhắc thầy cô ngay khi có em rời màn hình nhiều lần
              const flagged = playersList.filter(p => (p.awayCount || 0) >= 2 || (p.shotCount || 0) > 0);
              if (flagged.length === 0) return null;
              return (
                <div className="bg-amber-950/70 border-2 border-amber-500 rounded-2xl px-4 py-2.5 flex items-center gap-3 flex-wrap">
                  <span className="text-2xl">👁</span>
                  <span className="font-black text-amber-200">{flagged.length} bạn rời màn hình nhiều lần:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {flagged.slice(0, 8).map(p => (
                      <span key={p.id} className="bg-amber-500/20 border border-amber-600 text-amber-100 px-2.5 py-1 rounded-full text-sm font-bold">
                        {p.name} · {p.awayCount || 0} lần{(p.shotCount || 0) > 0 ? ' 📸' : ''}
                      </span>
                    ))}
                    {flagged.length > 8 && <span className="text-amber-300 text-sm font-bold self-center">+{flagged.length - 8} bạn</span>}
                  </div>
                </div>
              );
            })()}

          <div className="flex-1">
            <MountainClimb players={playersList} />
          </div>
        </div>
      )}

      {/* ============ KẾT QUẢ ============ */}
      {roomData?.status === 'END' && (
        <div className="w-full min-h-screen overflow-y-auto">
          <div className="max-w-5xl mx-auto py-4">
            <div className="text-center mb-5">
              <div className="text-7xl mb-1">🏔️</div>
              <h1 className="text-4xl md:text-5xl font-black text-sky-200 uppercase drop-shadow-[0_0_30px_rgba(125,211,252,0.5)]">Kết Thúc Hành Trình</h1>
              <p className="text-white/80 mt-2">{playersList.length} nhà leo núi · {allQuestions.length} câu · thang điểm 10</p>
            </div>

            {/* Phổ năng lực cả lớp */}
            <div className="mb-5">
              <h3 className="text-xl font-black text-sky-200 mb-2 text-center uppercase">📊 Phổ năng lực của lớp</h3>
              <MountainClimb players={playersList} compact />
            </div>

            {/* Gợi ý cho giáo viên */}
            {(() => {
              const atBase = playersList.filter(p => (p.reachedLevel || 0) === 0).length;
              const top = playersList.filter(p => (p.reachedLevel || 0) === 4).length;
              const pct = (n) => playersList.length ? Math.round((n / playersList.length) * 100) : 0;
              return (
                <div className="grid md:grid-cols-3 gap-3 mb-5">
                  <div className="bg-orange-900/40 border border-orange-600 rounded-2xl p-4">
                    <p className="text-orange-300 font-bold text-sm">⛺ Còn ở chân núi</p>
                    <p className="text-white font-black text-2xl mt-1">{atBase} bạn ({pct(atBase)}%)</p>
                    <p className="text-gray-400 text-xs mt-1">Cần củng cố lại kiến thức nền</p>
                  </div>
                  <div className="bg-sky-900/40 border border-sky-600 rounded-2xl p-4">
                    <p className="text-sky-300 font-bold text-sm">🧗 Đã qua Thông hiểu</p>
                    <p className="text-white font-black text-2xl mt-1">
                      {playersList.filter(p => (p.reachedLevel || 0) >= 2).length} bạn
                      ({pct(playersList.filter(p => (p.reachedLevel || 0) >= 2).length)}%)
                    </p>
                    <p className="text-gray-400 text-xs mt-1">Nắm được bản chất, sẵn sàng vận dụng</p>
                  </div>
                  <div className="bg-red-900/40 border border-red-600 rounded-2xl p-4">
                    <p className="text-red-300 font-bold text-sm">🏔️ Chinh phục đỉnh</p>
                    <p className="text-white font-black text-2xl mt-1">{top} bạn ({pct(top)}%)</p>
                    <p className="text-gray-400 text-xs mt-1">Có thể giao bài nâng cao</p>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-center gap-3 mb-6">
              <button onClick={exportExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none transition-all">
                <FileSpreadsheet className="w-6 h-6" /> XUẤT BẢNG ĐIỂM EXCEL
              </button>
              <button onClick={closeRoom} className="bg-red-700 hover:bg-red-600 text-white px-6 py-4 rounded-2xl font-black">Thoát &amp; Xoá Phòng</button>
            </div>

            {/* Bảng điểm chi tiết */}
            <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden mb-8">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase">📋 Bảng điểm</h3>
                <span className="text-gray-400 text-sm">Xếp theo tầng đạt được</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-gray-300 text-sm">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">STT</th>
                      <th className="px-4 py-2.5 font-bold">Họ tên</th>
                      <th className="px-4 py-2.5 font-bold">Lớp</th>
                      <th className="px-4 py-2.5 font-bold text-right">Điểm</th>
                      <th className="px-4 py-2.5 font-bold">Tầng đạt được</th>
                      {LEVELS.map(lv => <th key={lv.id} className="px-3 py-2.5 font-bold text-center" style={{ color: lv.color }}>{lv.short}</th>)}
                      <th className="px-4 py-2.5 font-bold text-center">👁 Rời màn hình</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((p, i) => {
                      const sc = toTen(p.earned || 0, maxScore);
                      const lv = p.reachedLevel || 0;
                      const per = p.perLevel || {};
                      return (
                        <tr key={p.id} className={`border-t border-white/5 ${i < 3 ? 'bg-sky-500/10' : ''}`}>
                          <td className="px-4 py-2.5 font-black text-gray-300">{i + 1}</td>
                          <td className="px-4 py-2.5 font-bold text-white">{p.name}</td>
                          <td className="px-4 py-2.5 text-sky-300 font-bold">{p.className || '—'}</td>
                          <td className={`px-4 py-2.5 text-right font-black text-xl ${sc >= 8 ? 'text-emerald-400' : sc >= 5 ? 'text-amber-400' : 'text-red-400'}`}>{sc}</td>
                          <td className="px-4 py-2.5 font-bold" style={{ color: lv === 0 ? '#94a3b8' : levelOf(lv).color }}>
                            {lv === 0 ? '⛺ Chân núi' : `${levelOf(lv).emoji} ${levelOf(lv).name}`}
                          </td>
                          {LEVELS.map(l => (
                            <td key={l.id} className="px-3 py-2.5 text-center text-gray-300 text-sm font-bold">
                              {groups[l.id].length === 0 ? '—' : `${per[l.id]?.correct || 0}/${groups[l.id].length}`}
                            </td>
                          ))}
                          <td className="px-4 py-2.5 text-center">
                            {(() => {
                              const sus = suspicionOf({ awayCount: p.awayCount || 0, shotCount: p.shotCount || 0 });
                              return (
                                <span className={`font-bold text-sm ${sus.color}`}>
                                  {p.awayCount || 0} lần
                                  {(p.awayMs || 0) > 0 && <span className="text-gray-500"> · {Math.round((p.awayMs || 0) / 1000)}s</span>}
                                  {(p.shotCount || 0) > 0 && <span className="text-red-400"> · 📸{p.shotCount}</span>}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                    {ranked.length === 0 && (
                      <tr><td colSpan="10" className="px-4 py-8 text-center text-gray-500">Không có nhà leo núi nào</td></tr>
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

export default ClimbHost;
