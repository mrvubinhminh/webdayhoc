import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Upload, Play, Users, CheckCircle2, Download, FileSpreadsheet } from 'lucide-react';
import { db } from '../firebase';
import { ref, set, update, onValue, remove, get } from 'firebase/database';
import QuestionGuidePanel from '../components/QuestionGuidePanel';
import GameRulesOverlay from '../components/GameRulesOverlay';
import VaultLocks from '../components/VaultLocks';
import { suspicionOf } from '../hooks/useFocusGuard';
import { buildGates, passCountFor, splitSecret, scoreOf, stuckestGate, DEFAULT_SECRET } from '../data/vaultRules';

const THEMES = [
  { id: 'vault',  name: '🗝️ Hầm Mật', bgStyle: { background: 'linear-gradient(140deg,#0c0a09 0%,#1c1917 55%,#292524 100%)' }, preview: 'from-stone-800 via-stone-900 to-black' },
  { id: 'neon',   name: '💠 Mật Mã',  bgStyle: { background: 'linear-gradient(140deg,#020617 0%,#0f172a 50%,#164e63 100%)' }, preview: 'from-cyan-900 via-slate-900 to-indigo-950' },
  { id: 'ancient',name: '📜 Cổ Tự',   bgStyle: { background: 'linear-gradient(140deg,#1c1917 0%,#422006 55%,#78350f 100%)' }, preview: 'from-amber-900 via-yellow-950 to-stone-900' },
  { id: 'forest', name: '🌲 Rừng Sâu', bgStyle: { background: 'linear-gradient(140deg,#022c22 0%,#064e3b 50%,#0f172a 100%)' }, preview: 'from-emerald-900 via-teal-900 to-slate-900' },
];

const HOST_ROOM_KEY = 'vaultHostRoom';

const VaultHost = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [fileName, setFileName] = useState('');
  const [localGameState, setLocalGameState] = useState('SETUP');
  const [roomCode, setRoomCode] = useState('');
  const [totalMinutes, setTotalMinutes] = useState(25);
  const [perAttempt, setPerAttempt] = useState(4);
  const [passRatio, setPassRatio] = useState(0.75);
  const [secret, setSecret] = useState(DEFAULT_SECRET);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [gameTitle, setGameTitle] = useState('VƯỢT ẢI MẬT MÃ');
  const [defaultClass, setDefaultClass] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem('vaultBgUrl') || '');
  const [resumeRoom, setResumeRoom] = useState(null);
  const [showRules, setShowRules] = useState(false);

  const currentAudio = useRef(null);
  const playAudio = (url) => {
    if (currentAudio.current) { currentAudio.current.pause(); currentAudio.current.currentTime = 0; }
    if (url) { const a = new Audio(url); currentAudio.current = a; a.play().catch(() => {}); }
  };

  useEffect(() => {
    if (!roomCode) return;
    const unsub = onValue(ref(db, `vaultRooms/${roomCode}`), (snap) => {
      const data = snap.val();
      if (data) setRoomData(data);
    });
    return () => unsub();
  }, [roomCode]);

  useEffect(() => {
    if (roomData?.status !== 'PLAYING' || !roomData?.startedAt) return;
    const totalSec = (roomData.settings?.totalMinutes || 25) * 60;
    const tick = () => {
      const left = Math.max(0, totalSec - Math.floor((Date.now() - roomData.startedAt) / 1000));
      setTimeLeft(left);
      if (left === 0) finishGame();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [roomData?.status, roomData?.startedAt]);

  useEffect(() => {
    let code = null;
    try { code = localStorage.getItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (!code) return;
    get(ref(db, `vaultRooms/${code}`)).then(snap => {
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
          gate: row[9] === undefined || row[9] === null ? '' : row[9].toString().trim()  // cột 10: ải / dạng bài
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
      ['Nội dung câu hỏi', 'Đ/A A hoặc TLN', 'Đ/A B hoặc Đáp số', 'Đ/A C hoặc Lời giải', 'Đ/A D', 'Đáp án đúng (1/2/3/4)', 'Lời giải', 'Link ảnh (tùy chọn)', 'Thời gian riêng (giây)', 'Ải / Dạng bài'],
      ['Giải $x^2-5x+6=0$', '$\\{1;6\\}$', '$\\{2;3\\}$', '$\\{-2;-3\\}$', '$\\{0;5\\}$', 2, 'Phân tích thành nhân tử', '', '', 'Phương trình bậc hai'],
      ['Giải $x^2-7x+12=0$', '$\\{3;4\\}$', '$\\{2;6\\}$', '$\\{1;12\\}$', '$\\{-3;-4\\}$', 1, 'Phân tích thành nhân tử', '', '', 'Phương trình bậc hai'],
      ['Giải $x^2-x-6=0$', '$\\{2;-3\\}$', '$\\{3;-2\\}$', '$\\{1;6\\}$', '$\\{-1;6\\}$', 2, 'Phân tích thành nhân tử', '', '', 'Phương trình bậc hai'],
      ['Giải $x^2-4=0$', '$\\{2\\}$', '$\\{-2\\}$', '$\\{2;-2\\}$', 'Vô nghiệm', 3, 'Hằng đẳng thức', '', '', 'Phương trình bậc hai'],
      ['Giải $x^2-9=0$', '$\\{3;-3\\}$', '$\\{3\\}$', '$\\{9\\}$', 'Vô nghiệm', 1, 'Hằng đẳng thức', '', '', 'Phương trình bậc hai'],
      ['Giải $x^2+2x-8=0$', '$\\{2;-4\\}$', '$\\{-2;4\\}$', '$\\{1;8\\}$', '$\\{4;2\\}$', 1, 'Phân tích thành nhân tử', '', '', 'Phương trình bậc hai'],
      ['Hệ $x+y=5$, $x-y=1$ có nghiệm', '$(3;2)$', '$(2;3)$', '$(4;1)$', '$(1;4)$', 1, 'Cộng hai vế', '', '', 'Hệ phương trình'],
      ['Hệ $x+y=7$, $x-y=3$ có nghiệm', '$(5;2)$', '$(2;5)$', '$(4;3)$', '$(3;4)$', 1, 'Cộng hai vế', '', '', 'Hệ phương trình'],
      ['Hệ $2x+y=8$, $x-y=1$ có nghiệm', '$(3;2)$', '$(2;4)$', '$(1;6)$', '$(4;0)$', 1, 'Thế hoặc cộng đại số', '', '', 'Hệ phương trình'],
      ['Hệ $x+2y=9$, $x-y=3$ có nghiệm', '$(5;2)$', '$(3;3)$', '$(7;1)$', '$(1;4)$', 1, 'Trừ hai vế', '', '', 'Hệ phương trình'],
      ['Hệ $3x+y=10$, $x+y=6$ có nghiệm', '$(2;4)$', '$(4;2)$', '$(3;3)$', '$(1;5)$', 1, 'Trừ hai vế', '', '', 'Hệ phương trình'],
      ['Hệ $x+y=0$, $x-y=4$ có nghiệm', '$(2;-2)$', '$(-2;2)$', '$(4;-4)$', '$(0;0)$', 1, 'Cộng hai vế', '', '', 'Hệ phương trình']
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 34 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 26 }, { wch: 12 }, { wch: 16 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CauHoi");
    XLSX.writeFile(wb, "Mau_Cau_Hoi_VuotAi.xlsx");
  };

  const gates = buildGates(questions.length ? questions : (roomData?.questions || []));
  const activeGates = buildGates(roomData?.questions || questions);
  const secretParts = splitSecret(roomData?.settings?.secret || secret, activeGates.length);
  const need = passCountFor(roomData?.settings?.perAttempt || perAttempt, roomData?.settings?.passRatio ?? passRatio);
  const thin = gates.filter(g => g.questionIds.length < (perAttempt + 1));

  const createRoom = async () => {
    if (questions.length === 0) { alert("Vui lòng tải lên file câu hỏi trước!"); return; }
    if (thin.length > 0) {
      const names = thin.slice(0, 3).map(g => `${g.name} (${g.questionIds.length} câu)`).join(', ');
      if (!window.confirm(
        `Các ải sau có ít hơn ${perAttempt + 1} câu: ${names}${thin.length > 3 ? '…' : ''}\n\n` +
        `Khi làm lại, học sinh sẽ gặp lại câu cũ vì không đủ câu mới.\nVẫn tạo phòng?`
      )) return;
    }
    try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch { /* bị chặn */ }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    try { localStorage.setItem(HOST_ROOM_KEY, code); } catch { /* không sao */ }
    setLocalGameState('LOBBY');
    setShowRules(true);
    playAudio('https://files.catbox.moe/eopz4f.mp3');

    await set(ref(db, `vaultRooms/${code}`), {
      status: 'LOBBY',
      questions,
      players: {},
      settings: { totalMinutes, perAttempt, passRatio, secret: secret.trim() || DEFAULT_SECRET, gameTitle, bgUrl, defaultClass }
    });
  };

  const startGame = async () => {
    playAudio('https://files.catbox.moe/amew8w.mp3');
    await update(ref(db, `vaultRooms/${roomCode}`), { status: 'PLAYING', startedAt: Date.now() });
    setLocalGameState('PLAYING');
  };

  const finishGame = async () => {
    if (roomData?.status === 'END') return;
    playAudio('https://files.catbox.moe/12vlpb.mp3');
    await update(ref(db, `vaultRooms/${roomCode}`), { status: 'END', endedAt: Date.now() });
  };

  const closeRoom = async () => {
    if (!window.confirm("Kết thúc hoàn toàn và xoá phòng chơi này?")) return;
    await remove(ref(db, `vaultRooms/${roomCode}`));
    try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setLocalGameState('SETUP');
    setRoomCode('');
    setRoomData(null);
  };

  const playersList = roomData?.players ? Object.values(roomData.players) : [];
  const gateCount = activeGates.length || 1;
  const ranked = [...playersList].sort((a, b) => {
    const d = scoreOf(b.gates || {}, gateCount) - scoreOf(a.gates || {}, gateCount);
    if (d !== 0) return d;
    return (a.finishedAt || Infinity) - (b.finishedAt || Infinity);
  });
  const clearedAll = playersList.filter(p => Object.values(p.gates || {}).filter(g => g.passed).length >= gateCount).length;
  const stuck = stuckestGate(activeGates, playersList);
  const theme = selectedTheme;
  const currentBgUrl = roomData?.settings?.bgUrl || bgUrl;
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const exportExcel = () => {
    const head = ['STT', 'Họ tên', 'Lớp', 'Điểm', 'Số ải vượt', 'Tổng ải', 'Tổng lượt làm'];
    activeGates.forEach(g => head.push(`${g.name} (lượt)`));
    head.push('Số lần rời màn hình', 'Tổng thời gian rời (giây)', 'Ghi chú');

    const rows = [head];
    ranked.forEach((p, i) => {
      const gs = p.gates || {};
      const cleared = Object.values(gs).filter(g => g.passed).length;
      const totalTries = Object.values(gs).reduce((s, g) => s + (g.attempts || 0), 0);
      const row = [
        i + 1, p.name || '', p.className || '',
        scoreOf(gs, gateCount), cleared, gateCount, totalTries
      ];
      activeGates.forEach(g => {
        const r = gs[g.index];
        row.push(!r ? '—' : r.passed ? `${r.attempts} lượt` : `chưa qua (${r.attempts})`);
      });
      row.push(
        p.awayCount || 0,
        Math.round((p.awayMs || 0) / 1000),
        suspicionOf({ awayCount: p.awayCount || 0, shotCount: p.shotCount || 0 }).label
      );
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 26 }, { wch: 10 }, { wch: 8 }, { wch: 11 }, { wch: 9 }, { wch: 13 },
      ...activeGates.map(() => ({ wch: 18 })), { wch: 18 }, { wch: 22 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BangDiem");
    const stamp = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    const title = (roomData?.settings?.gameTitle || 'VuotAi').replace(/[^\p{L}\p{N}]+/gu, '_');
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

            <h1 className="text-4xl font-black mb-2 text-amber-300 text-center">🗝️ Vượt Ải Mật Mã</h1>
            <p className="text-gray-300 text-center">Chưa vững một dạng thì <b className="text-amber-200">chưa được đi tiếp</b> — luyện lại bằng đề khác cùng dạng</p>
            <p className="text-amber-200/70 text-center text-sm mt-1 mb-10">Mỗi ải mở ra một mảnh mật mã, ghép đủ mới ra thông điệp cuối</p>

            {resumeRoom && (
              <div className="mb-8 bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-300">🔌 Phòng {resumeRoom} vẫn đang chạy</h3>
                  <p className="text-gray-300 text-sm mt-1">Tiến trình vượt ải còn nguyên. Nối lại để tiếp tục và xuất điểm.</p>
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
                    {selectedTheme.id === t.id && <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /></div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-5">
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                  <label className="block text-gray-400 mb-2 font-bold text-sm">📝 Tên bài</label>
                  <input type="text" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)}
                    className="w-full bg-slate-900 text-white text-xl font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-amber-500" />
                </div>

                <div className="flex-1 border-2 border-dashed border-amber-500/30 p-7 rounded-xl hover:bg-amber-500/10 text-center flex flex-col justify-center">
                  <Upload className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                  <p className="text-lg mb-1 text-gray-300">Tải lên file Excel chứa câu hỏi</p>
                  <p className="text-amber-300/80 text-sm mb-4"><b>Cột 10</b> ghi tên dạng bài — mỗi dạng thành một ải</p>
                  <div className="flex flex-col md:flex-row justify-center gap-3">
                    <label className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer inline-flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5" /> Chọn File Excel
                      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button onClick={downloadTemplate} className="bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center justify-center gap-2">
                      <Download className="w-5 h-5" /> Tải File Mẫu
                    </button>
                  </div>

                  {fileName && (
                    <div className="mt-4 text-amber-200 bg-amber-900/30 p-3 rounded-lg border border-amber-500/30 text-left">
                      ✅ <strong>{fileName}</strong> — {questions.length} câu · <b>{gates.length} ải</b>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {gates.map(g => (
                          <span key={g.index}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${g.questionIds.length < perAttempt + 1 ? 'bg-red-900/40 border-red-600 text-red-200' : 'bg-slate-800 border-slate-600 text-gray-200'}`}
                            title={g.questionIds.length < perAttempt + 1 ? 'Ít câu quá, làm lại sẽ gặp lại câu cũ' : ''}>
                            🔒 {g.name}: {g.questionIds.length} câu
                          </span>
                        ))}
                      </div>
                      {thin.length > 0 && (
                        <p className="text-red-300 text-xs mt-2 font-bold">
                          ⚠️ {thin.length} ải có dưới {perAttempt + 1} câu — nên thêm câu để học sinh làm lại được đề khác
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                  <label className="block text-gray-400 mb-2 font-bold text-sm">🖼️ Link ảnh nền (tuỳ chọn)</label>
                  <input type="text" value={bgUrl}
                    onChange={(e) => { setBgUrl(e.target.value); localStorage.setItem('vaultBgUrl', e.target.value); }}
                    className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg outline-none border border-transparent focus:border-amber-500" placeholder="https://..." />
                </div>
              </div>

              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col justify-center">
                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">⏱ Tổng thời gian (phút)</label>
                <input type="number" min="1" value={totalMinutes}
                  onChange={(e) => setTotalMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 text-amber-300 text-4xl font-black text-center py-3 rounded-lg outline-none mb-5" />

                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">📋 Số câu mỗi lượt vào ải</label>
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {[3, 4, 5, 6].map(n => (
                    <button key={n} onClick={() => setPerAttempt(n)}
                      className={`py-3 rounded-lg font-black transition-all ${perAttempt === n ? 'bg-amber-500 text-slate-900 scale-105' : 'bg-slate-900 text-gray-400 hover:bg-slate-700'}`}>
                      {n}
                    </button>
                  ))}
                </div>

                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">🎯 Ngưỡng mở khoá</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[0.6, 0.75, 1].map(r => (
                    <button key={r} onClick={() => setPassRatio(r)}
                      className={`py-3 rounded-lg font-black transition-all ${passRatio === r ? 'bg-emerald-500 text-slate-900 scale-105' : 'bg-slate-900 text-gray-400 hover:bg-slate-700'}`}>
                      {r === 1 ? 'Đúng hết' : `${Math.round(r * 100)}%`}
                    </button>
                  ))}
                </div>
                <p className="text-gray-500 text-xs text-center mb-5">
                  Phải đúng <b className="text-white">{passCountFor(perAttempt, passRatio)}/{perAttempt}</b> câu mới mở được ải
                </p>

                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">🔐 Thông điệp bí mật</label>
                <input type="text" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={DEFAULT_SECRET}
                  className="w-full bg-slate-900 text-yellow-200 text-lg font-black text-center py-3 rounded-lg outline-none mb-2 border border-transparent focus:border-amber-500 tracking-wider" />
                <p className="text-gray-500 text-xs text-center mb-5">Chia đều cho các ải, vượt ải nào mở mảnh đó</p>

                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">🏫 Lớp mặc định</label>
                <input type="text" value={defaultClass} onChange={(e) => setDefaultClass(e.target.value)} placeholder="VD: 10A1"
                  className="w-full bg-slate-900 text-white text-xl font-bold text-center py-3 rounded-lg outline-none border border-transparent focus:border-amber-500" />
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-br from-amber-950/50 to-slate-900 p-6 rounded-2xl border-2 border-amber-700/40">
              <h2 className="text-2xl font-black text-amber-300 mb-3">📋 Trò này khác gì các trò kia?</h2>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Đề gom theo <b className="text-white">dạng bài</b> (cột 10). Mỗi dạng là một ải khoá.</li>
                <li>• Mỗi lượt vào ải học sinh nhận <b className="text-white">{perAttempt} câu bốc ngẫu nhiên</b> từ ải đó.</li>
                <li>• Chưa đúng đủ <b className="text-white">{passCountFor(perAttempt, passRatio)}/{perAttempt}</b> thì <b className="text-amber-300">làm lại bằng đề khác cùng dạng</b> — không giới hạn số lượt.</li>
                <li>• Vượt lượt đầu được trọn điểm; làm lại vẫn có điểm nhưng giảm dần (100% → 85% → 70% → 60%).</li>
                <li>• Thầy cô thấy ngay <b className="text-white">ải nào cả lớp phải làm lại nhiều nhất</b> — đó là dạng cần dạy lại.</li>
              </ul>
            </div>

            <div className="mt-10 mb-8"><QuestionGuidePanel /></div>
          </div>

          <button onClick={createRoom} disabled={questions.length === 0 || !gameTitle.trim()}
            className={`absolute top-6 right-6 px-8 py-4 rounded-2xl font-black text-xl transition-all ${questions.length > 0 && gameTitle.trim() ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
            🚀 TẠO PHÒNG
          </button>
        </div>
      )}

      {/* ============ PHÒNG CHỜ ============ */}
      {localGameState === 'LOBBY' && roomData && (() => {
        const playUrl = `https://webdayhoc.vercel.app/vault/play?pin=${roomCode}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(playUrl)}&bgcolor=ffffff&color=000000&margin=10`;
        return (
          <div className="w-full min-h-screen flex flex-col">
            <GameRulesOverlay
              open={showRules}
              onClose={() => setShowRules(false)}
              bgStyle={theme.bgStyle}
              accent="amber"
              emoji="🗝️"
              title="Vượt Ải Mật Mã"
              subtitle="Vững một dạng rồi mới được sang dạng tiếp theo"
              steps={[
                { icon: '1️⃣', text: 'Nhập HỌ TÊN và LỚP để thầy cô vào điểm' },
                { icon: '2️⃣', text: `Mỗi ải là một dạng bài. Vào ải, em nhận ${roomData.settings?.perAttempt || 4} câu cùng dạng` },
                { icon: '3️⃣', text: `Đúng ${need}/${roomData.settings?.perAttempt || 4} câu thì ải mở khoá 🔓` },
                { icon: '4️⃣', text: 'Chưa đạt thì làm lại ải đó bằng ĐỀ KHÁC cùng dạng', note: 'Không giới hạn số lần — cứ luyện tới khi vững' },
                { icon: '5️⃣', text: 'Vượt ngay lượt đầu được trọn điểm, làm lại vẫn có điểm nhưng ít hơn' },
                { icon: '🔐', text: `Mỗi ải mở ra một mảnh mật mã — vượt hết ${activeGates.length} ải sẽ ghép được thông điệp bí mật` },
              ]}
              highlights={[
                { emoji: '🔁', tone: 'good', title: 'Sai không sao cả', text: 'Làm lại là chuyện bình thường, quan trọng là cuối cùng em vững' },
                { emoji: '🧠', tone: 'info', title: 'Đề luôn đổi', text: 'Mỗi lượt là câu khác nên học vẹt đáp án không ăn thua' },
                { emoji: '⏱️', tone: 'star', title: `${roomData.settings?.totalMinutes || 25} phút`, text: 'Cứ bình tĩnh, chắc từng ải một' },
              ]}
              footer="Mở được hết ổ khoá là biết mình đã thật sự vững 🗝️"
            />

            <div className="text-center pt-8 pb-3 shrink-0">
              <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                {roomData.settings.gameTitle || 'VƯỢT ẢI MẬT MÃ'}
              </h1>
              <h2 className="text-lg text-amber-100/80 mt-2 font-semibold tracking-widest uppercase">
                {activeGates.length} ải · {roomData.settings?.perAttempt || 4} câu mỗi lượt · cần đúng {need}
              </h2>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-5 px-6 pb-6 overflow-hidden">
              <div className="md:w-[42%] shrink-0 flex flex-col items-center justify-center gap-5">
                <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 border border-white/20 flex flex-col items-center gap-3">
                  <p className="text-amber-300 text-lg font-black uppercase tracking-widest border-b border-white/10 pb-2 w-full text-center">Quét Mã QR</p>
                  <div className="bg-white p-3 rounded-2xl"><img src={qrUrl} alt="QR" className="w-[240px] h-[240px] md:w-[290px] md:h-[290px] rounded-xl" /></div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl rounded-3xl px-9 py-4 border border-white/20 text-center">
                  <p className="text-amber-300 text-base font-black uppercase tracking-widest mb-1">Mã Phòng</p>
                  <div className="text-6xl md:text-7xl font-black tracking-[0.15em] text-white select-all">{roomCode}</div>
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0 gap-2">
                  <div className="flex items-center gap-3 text-xl font-black text-white">
                    <div className="bg-amber-600 p-2 rounded-xl"><Users className="w-6 h-6" /></div>
                    <span>{playersList.length} thí sinh</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowRules(true)} className="px-4 py-3 rounded-2xl font-black bg-slate-800/80 hover:bg-slate-700 text-white border border-white/20">📖 Luật</button>
                    <button onClick={startGame} disabled={playersList.length === 0}
                      className={`px-6 py-3 rounded-2xl font-black text-lg flex items-center gap-2 ${playersList.length > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-105 text-white' : 'bg-slate-800 text-gray-500 cursor-not-allowed'}`}>
                      <Play className="w-6 h-6" /> MỞ ẢI ĐẦU
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-wrap gap-2 content-start">
                    {playersList.map(p => (
                      <div key={p.id} className="bg-white/10 border border-white/20 px-3 py-2 rounded-xl text-white text-sm">
                        <span className="font-bold">🗝️ {p.name}</span>
                        {p.className && <span className="text-amber-300 ml-2 font-bold">{p.className}</span>}
                      </div>
                    ))}
                    {playersList.length === 0 && <p className="text-gray-400">Đang chờ thí sinh tới trước cổng ải…</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============ ĐANG CHƠI ============ */}
      {localGameState === 'PLAYING' && roomData?.status === 'PLAYING' && (
        <div className="w-full flex flex-col min-h-screen gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className={`text-4xl font-black px-6 py-2.5 rounded-xl border backdrop-blur-md ${timeLeft <= 60 ? 'bg-red-500/30 border-red-400 text-red-200 animate-pulse' : 'bg-black/35 border-white/15 text-white'}`}>
              ⏱ {mmss(timeLeft)}
            </div>
            <div className="bg-black/35 px-5 py-2.5 rounded-xl text-lg font-bold text-emerald-400 border border-white/10">
              🔓 Mở hết ải: {clearedAll}/{playersList.length}
            </div>
            {stuck && stuck.avgAttempts >= 1.5 && (
              <div className="bg-red-950/60 border border-red-500 px-5 py-2.5 rounded-xl text-red-200 font-bold">
                🔥 Ải khó nhất: <b className="text-white">{stuck.gate.name}</b> — TB {stuck.avgAttempts.toFixed(1)} lượt
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <button onClick={() => setShowRules(true)} className="bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold border border-white/15">📖 Luật</button>
              <button onClick={finishGame} className="bg-red-900/60 hover:bg-red-600 text-red-100 px-5 py-2.5 rounded-xl font-bold">🏁 Kết thúc ngay</button>
            </div>
          </div>

          {(() => {
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

          <VaultLocks gates={activeGates} players={playersList} secretParts={secretParts} />

          {/* Ai đang ở ải nào */}
          <div className="bg-black/40 rounded-2xl border border-white/15 p-3">
            <div className="flex flex-wrap gap-2">
              {ranked.map(p => {
                const cleared = Object.values(p.gates || {}).filter(g => g.passed).length;
                const cur = activeGates[p.currentGate ?? 0];
                const tries = p.gates?.[p.currentGate ?? 0]?.attempts || 0;
                const allDone = cleared >= gateCount;
                return (
                  <div key={p.id} className={`px-3 py-1.5 rounded-full text-sm font-bold border ${allDone ? 'bg-emerald-900/60 border-emerald-500 text-emerald-200' : tries >= 3 ? 'bg-red-900/50 border-red-600 text-red-200' : 'bg-slate-800/70 border-slate-600 text-gray-200'}`}>
                    {p.name} · {allDone ? '✅ xong hết' : `${cleared}/${gateCount} ải`}
                    {!allDone && cur && <span className="text-white/50"> · đang ở {cur.name}{tries > 1 ? ` (lượt ${tries})` : ''}</span>}
                  </div>
                );
              })}
              {ranked.length === 0 && <p className="text-gray-500">Chưa có thí sinh nào</p>}
            </div>
          </div>
        </div>
      )}

      {/* ============ KẾT QUẢ ============ */}
      {roomData?.status === 'END' && (
        <div className="w-full min-h-screen overflow-y-auto">
          <div className="max-w-6xl mx-auto py-4">
            <div className="text-center mb-5">
              <div className="text-7xl mb-1">🗝️</div>
              <h1 className="text-4xl md:text-5xl font-black text-amber-300 uppercase drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]">Mở Khoá Xong</h1>
              <p className="text-white/80 mt-2">{playersList.length} thí sinh · {activeGates.length} ải · {clearedAll} bạn mở hết</p>
            </div>

            {/* Thông điệp bí mật */}
            <div className="bg-gradient-to-r from-yellow-900/50 via-amber-900/40 to-yellow-900/50 border-2 border-yellow-500 rounded-3xl px-6 py-5 mb-5 text-center">
              <p className="text-yellow-300 uppercase tracking-[0.25em] font-bold text-xs">Thông điệp bí mật</p>
              <p className="text-3xl md:text-5xl font-black text-white mt-2 tracking-wider">
                {roomData.settings?.secret || DEFAULT_SECRET}
              </p>
            </div>

            <div className="mb-5">
              <VaultLocks gates={activeGates} players={playersList} secretParts={secretParts} revealAll compact />
            </div>

            {/* Ải cần dạy lại */}
            {stuck && (
              <div className="bg-red-950/50 border-2 border-red-600 rounded-2xl p-5 mb-5">
                <h3 className="text-lg font-black text-red-300">🔥 Dạng bài cả lớp vất vả nhất</h3>
                <p className="text-white font-black text-2xl mt-1">{stuck.gate.name}</p>
                <p className="text-gray-300 mt-1">
                  Trung bình phải làm <b className="text-red-300">{stuck.avgAttempts.toFixed(1)} lượt</b> mới qua ·
                  chỉ <b className="text-white">{stuck.passed}/{stuck.tried}</b> bạn mở được khoá
                </p>
                <p className="text-red-200/80 text-sm mt-2">Đây là dạng nên dành thời gian giảng lại ở buổi sau</p>
              </div>
            )}

            <div className="flex justify-center gap-3 mb-6">
              <button onClick={exportExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none transition-all">
                <FileSpreadsheet className="w-6 h-6" /> XUẤT BẢNG ĐIỂM EXCEL
              </button>
              <button onClick={closeRoom} className="bg-red-700 hover:bg-red-600 text-white px-6 py-4 rounded-2xl font-black">Thoát &amp; Xoá Phòng</button>
            </div>

            <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden mb-8">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase">📋 Bảng điểm</h3>
                <span className="text-gray-400 text-sm">Số trong ô là số lượt phải làm</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-gray-300 text-sm">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">STT</th>
                      <th className="px-4 py-2.5 font-bold">Họ tên</th>
                      <th className="px-4 py-2.5 font-bold">Lớp</th>
                      <th className="px-4 py-2.5 font-bold text-right">Điểm</th>
                      <th className="px-4 py-2.5 font-bold text-center">Ải vượt</th>
                      {activeGates.map(g => (
                        <th key={g.index} className="px-2 py-2.5 font-bold text-center text-amber-300" title={g.name}>#{g.index + 1}</th>
                      ))}
                      <th className="px-4 py-2.5 font-bold text-center">👁</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((p, i) => {
                      const gs = p.gates || {};
                      const sc = scoreOf(gs, gateCount);
                      const cleared = Object.values(gs).filter(g => g.passed).length;
                      const sus = suspicionOf({ awayCount: p.awayCount || 0, shotCount: p.shotCount || 0 });
                      return (
                        <tr key={p.id} className={`border-t border-white/5 ${i < 3 ? 'bg-amber-500/10' : ''}`}>
                          <td className="px-4 py-2.5 font-black text-gray-300">{i + 1}</td>
                          <td className="px-4 py-2.5 font-bold text-white">{p.name}</td>
                          <td className="px-4 py-2.5 text-amber-300 font-bold">{p.className || '—'}</td>
                          <td className={`px-4 py-2.5 text-right font-black text-xl ${sc >= 8 ? 'text-emerald-400' : sc >= 5 ? 'text-amber-400' : 'text-red-400'}`}>{sc}</td>
                          <td className="px-4 py-2.5 text-center font-bold text-gray-300">{cleared}/{gateCount}</td>
                          {activeGates.map(g => {
                            const r = gs[g.index];
                            return (
                              <td key={g.index} className="px-2 py-2.5 text-center">
                                {!r ? <span className="text-gray-600">—</span>
                                  : r.passed
                                    ? <span className={`font-black ${r.attempts === 1 ? 'text-emerald-400' : r.attempts === 2 ? 'text-lime-400' : 'text-amber-400'}`}>{r.attempts}</span>
                                    : <span className="text-red-400 font-black">✕{r.attempts}</span>}
                              </td>
                            );
                          })}
                          <td className={`px-4 py-2.5 text-center font-bold text-sm ${sus.color}`}>{p.awayCount || 0}</td>
                        </tr>
                      );
                    })}
                    {ranked.length === 0 && (
                      <tr><td colSpan={6 + activeGates.length} className="px-4 py-8 text-center text-gray-500">Không có thí sinh nào</td></tr>
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

export default VaultHost;
