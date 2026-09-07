import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Play, Users, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { db } from '../firebase';
import { ref, set, update, onValue, remove, get } from 'firebase/database';
import GameRulesOverlay from '../components/GameRulesOverlay';
import RadarChart from '../components/RadarChart';
import { GROUPS, groupOf, itemsFor, scoreGroups, hollandCode, careersFor } from '../data/hollandData';

const THEMES = [
  { id: 'compass', name: '🧭 La Bàn', bgStyle: { background: 'linear-gradient(160deg,#0c1445 0%,#0a2463 50%,#020617 100%)' }, preview: 'from-blue-900 via-indigo-950 to-slate-900' },
  { id: 'dawn',    name: '🌅 Bình Minh', bgStyle: { background: 'linear-gradient(160deg,#431407 0%,#7c2d12 45%,#0c4a6e 100%)' }, preview: 'from-orange-900 via-amber-800 to-sky-900' },
  { id: 'forest',  name: '🌿 Xanh Lá', bgStyle: { background: 'linear-gradient(160deg,#022c22 0%,#064e3b 50%,#0f172a 100%)' }, preview: 'from-emerald-900 via-teal-900 to-slate-900' },
  { id: 'violet',  name: '💜 Tím Mộng', bgStyle: { background: 'linear-gradient(160deg,#1e1b4b 0%,#4c1d95 50%,#020617 100%)' }, preview: 'from-violet-900 via-purple-900 to-slate-900' },
];

const HOST_ROOM_KEY = 'compassHostRoom';

const CompassHost = () => {
  const navigate = useNavigate();
  const [localGameState, setLocalGameState] = useState('SETUP');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState('full');           // 'short' 30 câu | 'full' 60 câu
  const [totalMinutes, setTotalMinutes] = useState(15);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [gameTitle, setGameTitle] = useState('LA BÀN NGHỀ NGHIỆP');
  const [defaultClass, setDefaultClass] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [resumeRoom, setResumeRoom] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [pickedStudent, setPickedStudent] = useState(null);

  const currentAudio = useRef(null);
  const playAudio = (url) => {
    if (currentAudio.current) { currentAudio.current.pause(); currentAudio.current.currentTime = 0; }
    if (url) { const a = new Audio(url); currentAudio.current = a; a.play().catch(() => {}); }
  };

  useEffect(() => {
    if (!roomCode) return;
    const unsub = onValue(ref(db, `compassRooms/${roomCode}`), (snap) => {
      const data = snap.val();
      if (data) setRoomData(data);
    });
    return () => unsub();
  }, [roomCode]);

  useEffect(() => {
    if (roomData?.status !== 'DOING' || !roomData?.startedAt) return;
    const totalSec = (roomData.settings?.totalMinutes || 15) * 60;
    const tick = () => {
      const left = Math.max(0, totalSec - Math.floor((Date.now() - roomData.startedAt) / 1000));
      setTimeLeft(left);
      if (left === 0) finishSurvey();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [roomData?.status, roomData?.startedAt]);

  useEffect(() => {
    let code = null;
    try { code = localStorage.getItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (!code) return;
    get(ref(db, `compassRooms/${code}`)).then(snap => {
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

  const createRoom = async () => {
    try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch { /* bị chặn */ }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    try { localStorage.setItem(HOST_ROOM_KEY, code); } catch { /* không sao */ }
    setLocalGameState('LOBBY');
    setShowRules(true);
    playAudio('https://files.catbox.moe/eopz4f.mp3');

    await set(ref(db, `compassRooms/${code}`), {
      status: 'LOBBY',
      players: {},
      settings: { mode, totalMinutes, gameTitle, defaultClass }
    });
  };

  const startSurvey = async () => {
    playAudio('https://files.catbox.moe/amew8w.mp3');
    await update(ref(db, `compassRooms/${roomCode}`), { status: 'DOING', startedAt: Date.now() });
    setLocalGameState('PLAYING');
  };

  const finishSurvey = async () => {
    if (roomData?.status === 'END') return;
    playAudio('https://files.catbox.moe/12vlpb.mp3');
    await update(ref(db, `compassRooms/${roomCode}`), { status: 'END', endedAt: Date.now() });
  };

  const closeRoom = async () => {
    if (!window.confirm("Kết thúc hoàn toàn và xoá phòng này?")) return;
    await remove(ref(db, `compassRooms/${roomCode}`));
    try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setLocalGameState('SETUP');
    setRoomCode('');
    setRoomData(null);
  };

  const activeMode = roomData?.settings?.mode || mode;
  const items = itemsFor(activeMode);
  const playersList = roomData?.players ? Object.values(roomData.players) : [];
  const done = playersList.filter(p => p.finishedAt);

  // Phổ sở thích của cả lớp: trung bình sáu nhóm
  const classAvg = (() => {
    const out = {};
    GROUPS.forEach(g => {
      const vals = done.map(p => p.scores?.[g.code] ?? 0);
      out[g.code] = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
    });
    return out;
  })();

  // Đếm số em có nhóm này đứng đầu
  const topCounts = GROUPS.map(g => ({
    group: g,
    count: done.filter(p => (p.code || '')[0] === g.code).length
  })).sort((a, b) => b.count - a.count);

  const theme = selectedTheme;
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const exportExcel = () => {
    const head = ['STT', 'Họ tên', 'Lớp', 'Mã Holland', 'Nhóm nổi trội', 'Nhóm ngành gợi ý',
      ...GROUPS.map(g => `${g.code} ${g.name}`), 'Đã hoàn thành'];
    const rows = [head];

    const sorted = [...playersList].sort((a, b) =>
      (a.className || '').localeCompare(b.className || '') || (a.name || '').localeCompare(b.name || '', 'vi')
    );

    sorted.forEach((p, i) => {
      const sc = p.scores || {};
      rows.push([
        i + 1,
        p.name || '',
        p.className || '',
        p.code || '—',
        p.code ? groupOf(p.code[0]).name : '—',
        p.code ? careersFor(p.code) : 'Chưa làm xong',
        ...GROUPS.map(g => sc[g.code] ?? ''),
        p.finishedAt ? 'Đã xong' : 'Chưa xong'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 26 }, { wch: 9 }, { wch: 12 }, { wch: 14 }, { wch: 52 },
      ...GROUPS.map(() => ({ wch: 13 })), { wch: 13 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HoSoHuongNghiep");
    const stamp = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    XLSX.writeFile(wb, `HoSoHuongNghiep_${(defaultClass || 'Lop').replace(/\s+/g, '')}_${stamp}.xlsx`);
  };

  return (
    <div className="min-h-screen text-white relative p-4 md:p-6" style={localGameState !== 'SETUP' ? theme.bgStyle : { background: '#0f172a' }}>
      <div className="relative z-10 w-full min-h-screen flex flex-col">

      {/* ============ TẠO PHÒNG ============ */}
      {localGameState === 'SETUP' && (
        <div className="relative w-full min-h-screen">
          <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate('/hdtnhn')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
              <ArrowLeft className="w-5 h-5" /> Quay lại Hoạt động trải nghiệm
            </button>

            <h1 className="text-4xl font-black mb-2 text-sky-300 text-center">🧭 La Bàn Nghề Nghiệp</h1>
            <p className="text-gray-300 text-center">Trắc nghiệm sở thích nghề nghiệp <b className="text-sky-200">Holland (RIASEC)</b></p>
            <p className="text-sky-200/70 text-center text-sm mt-1 mb-10">Không có câu nào đúng hay sai — chỉ đo xem em hợp với nhóm nghề nào</p>

            {resumeRoom && (
              <div className="mb-8 bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-300">🔌 Phòng {resumeRoom} vẫn đang mở</h3>
                  <p className="text-gray-300 text-sm mt-1">Bài làm của học sinh còn nguyên. Nối lại để xem kết quả và xuất hồ sơ.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={resumeHosting} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black">Nối lại phòng</button>
                  <button onClick={() => { try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ } setResumeRoom(null); }} className="bg-slate-800 hover:bg-slate-700 text-gray-300 px-4 py-3 rounded-xl font-bold">Bỏ qua</button>
                </div>
              </div>
            )}

            {/* Sáu nhóm sở thích */}
            <div className="mb-8 bg-slate-900/70 rounded-2xl border border-sky-800/50 p-5">
              <h2 className="text-xl font-black text-sky-200 mb-1">Sáu nhóm sở thích nghề nghiệp</h2>
              <p className="text-gray-400 text-sm mb-4">Mỗi em sẽ nhận một mã gồm 3 chữ cái, là 3 nhóm nổi trội nhất của mình.</p>
              <div className="grid md:grid-cols-3 gap-3">
                {GROUPS.map(g => (
                  <div key={g.code} className="rounded-xl p-3.5" style={{ backgroundColor: g.color + '18', border: `1px solid ${g.color}66` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{g.emoji}</span>
                      <div>
                        <div className="font-black text-white leading-tight">{g.name}</div>
                        <div className="font-mono font-black text-xs" style={{ color: g.color }}>{g.code}</div>
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-2 leading-snug">{g.short}</p>
                  </div>
                ))}
              </div>
            </div>

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
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <label className="block text-gray-400 mb-2 font-bold text-sm">📝 Tên buổi hoạt động</label>
                <input type="text" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xl font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-sky-500 mb-5" />

                <label className="block text-gray-400 mb-2 font-bold text-sm">🏫 Lớp mặc định</label>
                <input type="text" value={defaultClass} onChange={(e) => setDefaultClass(e.target.value)} placeholder="VD: 11A3"
                  className="w-full bg-slate-900 text-white text-xl font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-sky-500" />
                <p className="text-gray-500 text-xs mt-2">Điền sẵn cho học sinh khỏi phải gõ, các em vẫn sửa được</p>
              </div>

              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">📋 Độ dài bài trắc nghiệm</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button onClick={() => setMode('short')}
                    className={`py-4 rounded-xl font-black transition-all ${mode === 'short' ? 'bg-sky-500 text-slate-900 scale-105' : 'bg-slate-900 text-gray-400 hover:bg-slate-700'}`}>
                    Rút gọn
                    <span className="block text-xs font-bold opacity-80">30 câu · ~8 phút</span>
                  </button>
                  <button onClick={() => setMode('full')}
                    className={`py-4 rounded-xl font-black transition-all ${mode === 'full' ? 'bg-sky-500 text-slate-900 scale-105' : 'bg-slate-900 text-gray-400 hover:bg-slate-700'}`}>
                    Đầy đủ
                    <span className="block text-xs font-bold opacity-80">60 câu · ~15 phút</span>
                  </button>
                </div>
                <p className="text-gray-500 text-xs text-center mb-5">Bản đầy đủ cho kết quả tin cậy hơn, nên dùng khi có trọn tiết</p>

                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">⏱ Thời gian tối đa (phút)</label>
                <input type="number" min="1" value={totalMinutes}
                  onChange={(e) => setTotalMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 text-sky-300 text-4xl font-black text-center py-3 rounded-lg outline-none mb-2" />
                <p className="text-gray-500 text-xs text-center">Hết giờ hệ thống tự chốt bài. Em nào xong sớm vẫn xem kết quả ngay.</p>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-br from-sky-950/60 to-slate-900 p-6 rounded-2xl border-2 border-sky-700/40">
              <h2 className="text-2xl font-black text-sky-200 mb-3">💡 Gợi ý cho thầy cô</h2>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Nhắc học sinh trả lời theo <b className="text-white">điều mình thật sự thích</b>, không theo nghề bố mẹ mong muốn — kết quả mới có giá trị.</li>
                <li>• Không có đáp án đúng sai nên <b className="text-white">không chấm điểm</b>. Kết quả là hồ sơ tham khảo, dùng được cả năm học.</li>
                <li>• Mã Holland gồm 3 chữ, ví dụ <b className="text-sky-300">SEA</b> nghĩa là nổi trội Xã hội – Quản lý – Nghệ thuật.</li>
                <li>• Sau khi có kết quả, cho các em <b className="text-white">ngồi theo nhóm cùng mã</b> để chia sẻ — hoạt động này rất sôi nổi.</li>
                <li>• File Excel xuất ra là <b className="text-white">hồ sơ hướng nghiệp</b>, nên lưu lại để tư vấn chọn tổ hợp, chọn trường về sau.</li>
              </ul>
            </div>
          </div>

          <button onClick={createRoom}
            className="absolute top-6 right-6 px-8 py-4 rounded-2xl font-black text-xl bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-500/30 hover:scale-105 transition-all">
            🚀 TẠO PHÒNG
          </button>
        </div>
      )}

      {/* ============ PHÒNG CHỜ ============ */}
      {localGameState === 'LOBBY' && roomData && (() => {
        const playUrl = `https://webdayhoc.vercel.app/compass/play?pin=${roomCode}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(playUrl)}&bgcolor=ffffff&color=000000&margin=10`;
        return (
          <div className="w-full min-h-screen flex flex-col">
            <GameRulesOverlay
              open={showRules}
              onClose={() => setShowRules(false)}
              bgStyle={theme.bgStyle}
              accent="sky"
              emoji="🧭"
              title="La Bàn Nghề Nghiệp"
              subtitle="Không có câu nào đúng hay sai — chỉ có câu đúng với em"
              steps={[
                { icon: '1️⃣', text: 'Nhập HỌ TÊN và LỚP của em' },
                { icon: '2️⃣', text: `Đọc ${items.length} phát biểu, mỗi câu chọn mức độ đúng với em`, note: 'Từ "Không hề" đến "Rất đúng với em"' },
                { icon: '3️⃣', text: 'Trả lời theo điều em THẬT SỰ thích', note: 'Không theo bạn bè, không theo mong muốn của người lớn' },
                { icon: '4️⃣', text: 'Đừng suy nghĩ quá lâu — cảm nhận đầu tiên thường đúng nhất' },
                { icon: '5️⃣', text: 'Xong bài em nhận ngay biểu đồ 6 nhóm và mã nghề nghiệp của mình' },
                { icon: '🧭', text: `Cả lớp có ${roomData.settings?.totalMinutes || 15} phút, em nào xong sớm xem kết quả trước` },
              ]}
              highlights={[
                { emoji: '🙂', tone: 'good', title: 'Không chấm điểm', text: 'Đây không phải bài kiểm tra, em cứ thành thật' },
                { emoji: '🔒', tone: 'info', title: 'Kết quả là của em', text: 'Máy chiếu chỉ hiện tổng hợp cả lớp, không bêu tên ai' },
                { emoji: '🎯', tone: 'star', title: 'Dùng được lâu dài', text: 'Kết quả giúp em chọn tổ hợp, chọn ngành sau này' },
              ]}
              footer="Hiểu mình là bước đầu tiên để chọn đúng nghề 🧭"
            />

            <div className="text-center pt-8 pb-3 shrink-0">
              <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-sky-100 to-sky-400 uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                {roomData.settings.gameTitle || 'LA BÀN NGHỀ NGHIỆP'}
              </h1>
              <h2 className="text-lg text-sky-100/80 mt-2 font-semibold tracking-widest uppercase">
                {items.length} phát biểu · {roomData.settings?.totalMinutes || 15} phút · không chấm điểm
              </h2>
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
                    <span>{playersList.length} học sinh</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowRules(true)} className="px-4 py-3 rounded-2xl font-black bg-slate-800/80 hover:bg-slate-700 text-white border border-white/20">📖 Hướng dẫn</button>
                    <button onClick={startSurvey} disabled={playersList.length === 0}
                      className={`px-6 py-3 rounded-2xl font-black text-lg flex items-center gap-2 ${playersList.length > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-105 text-white' : 'bg-slate-800 text-gray-500 cursor-not-allowed'}`}>
                      <Play className="w-6 h-6" /> BẮT ĐẦU
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-wrap gap-2 content-start">
                    {playersList.map(p => (
                      <div key={p.id} className="bg-white/10 border border-white/20 px-3 py-2 rounded-xl text-white text-sm">
                        <span className="font-bold">🧭 {p.name}</span>
                        {p.className && <span className="text-sky-300 ml-2 font-bold">{p.className}</span>}
                      </div>
                    ))}
                    {playersList.length === 0 && <p className="text-gray-400">Đang chờ học sinh vào phòng…</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============ ĐANG LÀM ============ */}
      {localGameState === 'PLAYING' && roomData?.status === 'DOING' && (
        <div className="w-full flex flex-col min-h-screen gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className={`text-4xl font-black px-6 py-2.5 rounded-xl border backdrop-blur-md ${timeLeft <= 60 ? 'bg-red-500/30 border-red-400 text-red-200 animate-pulse' : 'bg-black/35 border-white/15 text-white'}`}>
              ⏱ {mmss(timeLeft)}
            </div>
            <div className="bg-black/35 px-5 py-2.5 rounded-xl text-lg font-bold text-emerald-400 border border-white/10">
              ✅ Xong: {done.length}/{playersList.length}
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setShowRules(true)} className="bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold border border-white/15">📖 Hướng dẫn</button>
              <button onClick={finishSurvey} className="bg-sky-800/70 hover:bg-sky-600 text-sky-100 px-5 py-2.5 rounded-xl font-bold">🧭 Xem kết quả lớp</button>
            </div>
          </div>

          <GameRulesOverlay
            open={showRules}
            onClose={() => setShowRules(false)}
            bgStyle={theme.bgStyle}
            accent="sky"
            emoji="🧭"
            title="La Bàn Nghề Nghiệp"
            subtitle="Không có câu nào đúng hay sai — chỉ có câu đúng với em"
            steps={[
              { icon: '1️⃣', text: 'Chọn mức độ đúng với em cho từng phát biểu' },
              { icon: '2️⃣', text: 'Trả lời theo điều em thật sự thích' },
              { icon: '3️⃣', text: 'Đừng nghĩ quá lâu, cảm nhận đầu tiên thường đúng nhất' },
            ]}
            footer="Hiểu mình là bước đầu tiên để chọn đúng nghề 🧭"
          />

          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-5 items-start">
            <div className="bg-black/40 rounded-3xl border border-sky-700/40 p-5">
              <h3 className="text-lg font-black text-sky-200 mb-1 text-center uppercase">Phổ sở thích của lớp</h3>
              <p className="text-gray-400 text-xs text-center mb-2">Cập nhật theo số bạn đã làm xong</p>
              <RadarChart scores={classAvg} size={320} />
            </div>

            <div className="bg-black/40 rounded-3xl border border-white/15 p-4">
              <h3 className="text-lg font-black text-white mb-3 uppercase">Tiến độ lớp</h3>
              <div className="flex flex-wrap gap-2 max-h-[52vh] overflow-y-auto">
                {playersList.map(p => {
                  const pct = Math.round(((p.answered || 0) / items.length) * 100);
                  return (
                    <div key={p.id} className={`px-3 py-2 rounded-xl border text-sm font-bold ${p.finishedAt ? 'bg-emerald-900/50 border-emerald-600 text-emerald-200' : 'bg-slate-800/70 border-slate-600 text-gray-300'}`}>
                      {p.name}
                      {p.finishedAt
                        ? <span className="ml-2 font-mono text-emerald-300">{p.code}</span>
                        : <span className="ml-2 text-white/50">{pct}%</span>}
                    </div>
                  );
                })}
                {playersList.length === 0 && <p className="text-gray-500">Chưa có học sinh nào</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ KẾT QUẢ LỚP ============ */}
      {roomData?.status === 'END' && (
        <div className="w-full min-h-screen overflow-y-auto">
          <div className="max-w-6xl mx-auto py-4">
            <div className="text-center mb-5">
              <div className="text-7xl mb-1">🧭</div>
              <h1 className="text-4xl md:text-5xl font-black text-sky-200 uppercase drop-shadow-[0_0_30px_rgba(125,211,252,0.5)]">Bản Đồ Nghề Nghiệp Của Lớp</h1>
              <p className="text-white/80 mt-2">{done.length}/{playersList.length} học sinh hoàn thành · {items.length} phát biểu</p>
            </div>

            <div className="grid lg:grid-cols-[380px_1fr] gap-5 mb-5">
              <div className="bg-black/40 rounded-3xl border border-sky-700/40 p-5">
                <h3 className="text-lg font-black text-sky-200 mb-2 text-center uppercase">Phổ sở thích cả lớp</h3>
                <RadarChart scores={classAvg} size={340} />
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-black text-white uppercase">Lớp mình nghiêng về nhóm nào?</h3>
                {topCounts.map(({ group: g, count }) => {
                  const pct = done.length ? Math.round((count / done.length) * 100) : 0;
                  return (
                    <div key={g.code} className="rounded-2xl p-3.5" style={{ backgroundColor: g.color + '18', border: `1px solid ${g.color}55` }}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl shrink-0">{g.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-black text-white">{g.name} <span className="font-mono text-sm" style={{ color: g.color }}>({g.code})</span></span>
                            <span className="font-black" style={{ color: g.color }}>{count} bạn · {pct}%</span>
                          </div>
                          <div className="h-2 bg-black/40 rounded-full overflow-hidden mt-1.5">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <p className="text-gray-400 text-sm">Số bạn có nhóm đó đứng đầu trong mã Holland của mình</p>
              </div>
            </div>

            <div className="flex justify-center gap-3 mb-6">
              <button onClick={exportExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none transition-all">
                <FileSpreadsheet className="w-6 h-6" /> XUẤT HỒ SƠ HƯỚNG NGHIỆP
              </button>
              <button onClick={closeRoom} className="bg-red-700 hover:bg-red-600 text-white px-6 py-4 rounded-2xl font-black">Thoát &amp; Xoá Phòng</button>
            </div>

            {/* Danh sách học sinh, bấm vào xem biểu đồ riêng */}
            <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden mb-8">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase">📋 Hồ sơ từng em</h3>
                <span className="text-gray-400 text-sm">Bấm vào một em để xem biểu đồ riêng</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-gray-300 text-sm">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">STT</th>
                      <th className="px-4 py-2.5 font-bold">Họ tên</th>
                      <th className="px-4 py-2.5 font-bold">Lớp</th>
                      <th className="px-4 py-2.5 font-bold text-center">Mã Holland</th>
                      <th className="px-4 py-2.5 font-bold">Nhóm nổi trội</th>
                      <th className="px-4 py-2.5 font-bold">Nhóm ngành gợi ý</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...playersList]
                      .sort((a, b) => (a.className || '').localeCompare(b.className || '') || (a.name || '').localeCompare(b.name || '', 'vi'))
                      .map((p, i) => (
                        <tr key={p.id} onClick={() => p.scores && setPickedStudent(p)}
                          className={`border-t border-white/5 ${p.scores ? 'cursor-pointer hover:bg-white/5' : 'opacity-60'}`}>
                          <td className="px-4 py-2.5 font-black text-gray-300">{i + 1}</td>
                          <td className="px-4 py-2.5 font-bold text-white">{p.name}</td>
                          <td className="px-4 py-2.5 text-sky-300 font-bold">{p.className || '—'}</td>
                          <td className="px-4 py-2.5 text-center">
                            {p.code
                              ? <span className="font-mono font-black text-lg tracking-widest" style={{ color: groupOf(p.code[0]).color }}>{p.code}</span>
                              : <span className="text-gray-500 text-sm">chưa xong</span>}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-white/90">
                            {p.code ? `${groupOf(p.code[0]).emoji} ${groupOf(p.code[0]).name}` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-gray-300 text-sm">{p.code ? careersFor(p.code) : '—'}</td>
                        </tr>
                      ))}
                    {playersList.length === 0 && (
                      <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">Chưa có học sinh nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Xem biểu đồ riêng của một em, đối chiếu với cả lớp */}
          {pickedStudent && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPickedStudent(null)}>
              <div className="bg-slate-900 border-2 border-sky-600 rounded-3xl w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setPickedStudent(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-slate-800 rounded-full p-2">✕</button>
                <h3 className="text-2xl font-black text-white">{pickedStudent.name}</h3>
                <p className="text-sky-300 font-bold">{pickedStudent.className}</p>
                <div className="my-3">
                  <RadarChart scores={pickedStudent.scores || {}} compare={classAvg} size={320} />
                </div>
                <p className="text-center text-gray-400 text-xs mb-3">Vùng xanh là của em · đường nét đứt là trung bình cả lớp</p>
                <div className="bg-sky-500/15 border border-sky-500 rounded-2xl px-5 py-4 text-center">
                  <p className="text-sky-200 text-xs uppercase tracking-widest font-bold">Mã Holland</p>
                  <p className="text-4xl font-black text-white font-mono tracking-[0.2em] mt-1">{pickedStudent.code}</p>
                  <p className="text-gray-300 text-sm mt-2">{careersFor(pickedStudent.code)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      </div>
    </div>
  );
};

export default CompassHost;
