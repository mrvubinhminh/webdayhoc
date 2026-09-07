import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Users, FileSpreadsheet, Play } from 'lucide-react';
import { db } from '../firebase';
import { ref, set, update, onValue, remove, get } from 'firebase/database';
import GameRulesOverlay from '../components/GameRulesOverlay';
import { STAGES, COMBOS, stageDone, progressOf, ratingOf } from '../data/careerPathData';

const HOST_ROOM_KEY = 'pathHostRoom';
const THEME = { background: 'linear-gradient(160deg,#020617 0%,#0c4a6e 55%,#064e3b 100%)' };

const PathHost = () => {
  const navigate = useNavigate();
  const [localState, setLocalState] = useState('SETUP');
  const [roomCode, setRoomCode] = useState('');
  const [gameTitle, setGameTitle] = useState('LỘ TRÌNH NGHỀ NGHIỆP');
  const [defaultClass, setDefaultClass] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [resumeRoom, setResumeRoom] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    if (!roomCode) return;
    const unsub = onValue(ref(db, `pathRooms/${roomCode}`), (snap) => {
      const data = snap.val();
      if (data) setRoomData(data);
    });
    return () => unsub();
  }, [roomCode]);

  useEffect(() => {
    let code = null;
    try { code = localStorage.getItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (!code) return;
    get(ref(db, `pathRooms/${code}`)).then(snap => {
      if (snap.exists()) setResumeRoom(code);
      else { try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ } }
    }).catch(() => {});
  }, []);

  const resumeHosting = () => {
    if (!resumeRoom) return;
    setRoomCode(resumeRoom);
    setLocalState('OPEN');
    setResumeRoom(null);
  };

  const createRoom = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    try { localStorage.setItem(HOST_ROOM_KEY, code); } catch { /* không sao */ }
    setLocalState('LOBBY');
    setShowRules(true);
    await set(ref(db, `pathRooms/${code}`), {
      status: 'LOBBY', players: {}, settings: { gameTitle, defaultClass }
    });
  };

  const openRoom = async () => {
    await update(ref(db, `pathRooms/${roomCode}`), { status: 'OPEN', openedAt: Date.now() });
    setLocalState('OPEN');
  };

  const closeRoom = async () => {
    if (!window.confirm("Xoá hẳn phòng này? Toàn bộ lộ trình của học sinh sẽ mất.\nHãy xuất Excel trước khi xoá!")) return;
    await remove(ref(db, `pathRooms/${roomCode}`));
    try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    setLocalState('SETUP');
    setRoomCode('');
    setRoomData(null);
  };

  const players = roomData?.players ? Object.values(roomData.players) : [];
  const sorted = [...players].sort((a, b) =>
    (a.className || '').localeCompare(b.className || '') || (a.name || '').localeCompare(b.name || '', 'vi'));

  const doneCount = players.filter(p => (p.percent || 0) >= 100).length;
  const avgPercent = players.length ? Math.round(players.reduce((s, p) => s + (p.percent || 0), 0) / players.length) : 0;

  // Bao nhiêu em đã xong từng chặng — cho biết cả lớp đang tắc ở chặng nào
  const stageStats = STAGES.map(s => ({
    stage: s,
    done: players.filter(p => stageDone(s, p.data || {})).length
  }));

  const exportExcel = () => {
    const head = ['STT', 'Họ tên', 'Lớp', 'Nghề hướng tới', 'Ngành', 'Trường 1', 'Tổ hợp', 'Hoàn thành (%)', 'Xếp loại'];
    STAGES.forEach(s => s.fields.forEach(f => head.push(`${s.order}. ${s.name} — ${f.label}`)));

    const rows = [head];
    sorted.forEach((p, i) => {
      const d = p.data || {};
      const pct = p.percent || 0;
      const row = [
        i + 1, p.name || '', p.className || '',
        (d.goal || {}).career || '',
        (d.school || {}).major || '',
        (d.school || {}).school1 || '',
        (d.subjects || {}).combo || '',
        pct, ratingOf(pct).label
      ];
      STAGES.forEach(s => s.fields.forEach(f => {
        const v = (d[s.id] || {})[f.key] || '';
        // Ô điểm lưu dạng "môn|hiện tại|mục tiêu", trải ra cho dễ đọc
        row.push(f.type === 'score' && v
          ? (() => { const [a, b, c] = v.split('|'); return `${a || ''} (${b || '?'} → ${c || '?'})`; })()
          : v);
      }));
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 24 }, { wch: 9 }, { wch: 24 }, { wch: 22 }, { wch: 26 }, { wch: 9 }, { wch: 13 }, { wch: 16 },
      ...STAGES.flatMap(s => s.fields.map(f => ({ wch: f.type === 'long' ? 46 : 22 })))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LoTrinhNgheNghiep");
    const stamp = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    XLSX.writeFile(wb, `LoTrinh_${(defaultClass || roomData?.settings?.defaultClass || 'Lop').replace(/\s+/g, '')}_${stamp}.xlsx`);
  };

  const playUrl = `https://webdayhoc.vercel.app/path/play?pin=${roomCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(playUrl)}&bgcolor=ffffff&color=000000&margin=10`;

  return (
    <div className="min-h-screen text-white relative p-4 md:p-6" style={localState !== 'SETUP' ? THEME : { background: '#0f172a' }}>
      <div className="relative z-10 w-full min-h-screen flex flex-col">

      {/* ============ TẠO PHÒNG ============ */}
      {localState === 'SETUP' && (
        <div className="relative w-full min-h-screen">
          <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate('/hdtnhn')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
              <ArrowLeft className="w-5 h-5" /> Quay lại Hoạt động trải nghiệm
            </button>

            <h1 className="text-4xl font-black mb-2 text-sky-300 text-center">🗺️ Lộ Trình Nghề Nghiệp</h1>
            <p className="text-gray-300 text-center">Mỗi em tự vẽ con đường từ hôm nay tới nghề mình mơ ước</p>
            <p className="text-sky-200/70 text-center text-sm mt-1 mb-10">Dùng cho <b>Chủ đề 11</b> — làm dần qua 5 tiết, cuối cùng ra sản phẩm dự án nộp được</p>

            {resumeRoom && (
              <div className="mb-8 bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-300">🔌 Phòng {resumeRoom} vẫn đang mở</h3>
                  <p className="text-gray-300 text-sm mt-1">Lộ trình học sinh đã làm còn nguyên. Hoạt động này kéo dài nhiều tiết nên hãy dùng lại đúng phòng cũ.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={resumeHosting} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black">Mở lại phòng</button>
                  <button onClick={() => { try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ } setResumeRoom(null); }} className="bg-slate-800 hover:bg-slate-700 text-gray-300 px-4 py-3 rounded-xl font-bold">Bỏ qua</button>
                </div>
              </div>
            )}

            {/* Sáu chặng */}
            <div className="mb-8 bg-slate-900/70 rounded-2xl border border-sky-800/50 p-5">
              <h2 className="text-xl font-black text-sky-200 mb-1">Sáu chặng của lộ trình</h2>
              <p className="text-gray-400 text-sm mb-4">Bám sát các hoạt động của Chủ đề 11 trong kế hoạch dạy học</p>
              <div className="grid md:grid-cols-2 gap-3">
                {STAGES.map(s => (
                  <div key={s.id} className="rounded-xl p-3.5 bg-sky-500/10 border border-sky-700/50">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{s.emoji}</span>
                      <div>
                        <div className="font-black text-white leading-tight">Chặng {s.order}: {s.name}</div>
                        <div className="text-[11px] text-sky-400 font-bold">{s.lesson}</div>
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-2 leading-snug">{s.hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <label className="block text-gray-400 mb-2 font-bold text-sm">📝 Tên buổi hoạt động</label>
                <input type="text" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xl font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-sky-500 mb-5" />
                <label className="block text-gray-400 mb-2 font-bold text-sm">🏫 Lớp mặc định</label>
                <input type="text" value={defaultClass} onChange={(e) => setDefaultClass(e.target.value)} placeholder="VD: 10A1"
                  className="w-full bg-slate-900 text-white text-xl font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-sky-500" />
              </div>

              <div className="bg-gradient-to-br from-sky-950/60 to-slate-900 p-5 rounded-xl border-2 border-sky-700/40">
                <h3 className="text-lg font-black text-sky-200 mb-2">⚠️ Điểm khác các hoạt động kia</h3>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li>• Hoạt động này <b className="text-white">kéo dài 5 tiết</b>, không kết thúc trong một buổi.</li>
                  <li>• Học sinh gõ tới đâu <b className="text-white">lưu tự động tới đó</b>, tiết sau mở lại làm tiếp.</li>
                  <li>• <b className="text-amber-300">Dùng chung một phòng cho cả chủ đề</b> — ghi lại mã PIN, đừng tạo phòng mới mỗi tiết.</li>
                  <li>• Không chấm điểm, xếp <b className="text-white">Đạt / Chưa đạt</b> theo mức hoàn thành.</li>
                </ul>
              </div>
            </div>
          </div>

          <button onClick={createRoom}
            className="absolute top-6 right-6 px-8 py-4 rounded-2xl font-black text-xl bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-500/30 hover:scale-105 transition-all">
            🚀 TẠO PHÒNG
          </button>
        </div>
      )}

      {/* ============ PHÒNG CHỜ ============ */}
      {localState === 'LOBBY' && roomData && (
        <div className="w-full min-h-screen flex flex-col">
          <GameRulesOverlay
            open={showRules} onClose={() => setShowRules(false)} bgStyle={THEME} accent="sky"
            emoji="🗺️" title="Lộ Trình Nghề Nghiệp"
            subtitle="Em tự vẽ con đường từ hôm nay tới nghề mình mơ ước"
            steps={[
              { icon: '1️⃣', text: 'Nhập họ tên và lớp — bản lộ trình này là của riêng em' },
              { icon: '2️⃣', text: 'Đi qua 6 chặng: đích đến · trường ngành · tổ hợp môn · năng lực · cột mốc · tham vấn' },
              { icon: '3️⃣', text: 'Gõ tới đâu máy lưu tới đó', note: 'Không cần bấm nút lưu, không sợ mất bài' },
              { icon: '4️⃣', text: 'Hoạt động kéo dài nhiều tiết — tiết sau em mở lại làm tiếp' },
              { icon: '5️⃣', text: 'Bấm "🗺️ Xem lộ trình" bất cứ lúc nào để nhìn toàn cảnh' },
              { icon: '🎯', text: 'Xong 6 chặng là em có bản kế hoạch nghề nghiệp của riêng mình' },
            ]}
            highlights={[
              { emoji: '✍️', tone: 'good', title: 'Không chấm điểm', text: 'Viết thật lòng, không viết điều người lớn muốn nghe' },
              { emoji: '🔄', tone: 'info', title: 'Sửa được mãi', text: 'Đổi ý giữa chừng là bình thường, cứ quay lại sửa' },
              { emoji: '🧭', tone: 'star', title: 'Nối với La Bàn', text: 'Điền mã Holland để nhận gợi ý nhóm ngành' },
            ]}
            footer="Con đường dài bắt đầu từ một bước nhỏ trong tháng này 🌱"
          />

          <div className="text-center pt-8 pb-3">
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-sky-100 to-sky-400 uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
              {roomData.settings.gameTitle || 'LỘ TRÌNH NGHỀ NGHIỆP'}
            </h1>
            <h2 className="text-lg text-sky-100/80 mt-2 font-semibold tracking-widest uppercase">6 chặng · làm dần qua nhiều tiết</h2>
          </div>

          <div className="flex-1 flex flex-col md:flex-row gap-5 px-6 pb-6">
            <div className="md:w-[42%] shrink-0 flex flex-col items-center justify-center gap-5">
              <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 border border-white/20 flex flex-col items-center gap-3">
                <p className="text-sky-300 text-lg font-black uppercase tracking-widest border-b border-white/10 pb-2 w-full text-center">Quét Mã QR</p>
                <div className="bg-white p-3 rounded-2xl"><img src={qrUrl} alt="QR" className="w-[240px] h-[240px] md:w-[290px] md:h-[290px] rounded-xl" /></div>
              </div>
              <div className="bg-black/40 backdrop-blur-xl rounded-3xl px-9 py-4 border border-white/20 text-center">
                <p className="text-sky-300 text-base font-black uppercase tracking-widest mb-1">Mã Phòng</p>
                <div className="text-6xl md:text-7xl font-black tracking-[0.15em] text-white select-all">{roomCode}</div>
                <p className="text-amber-300 text-xs font-bold mt-2">⚠️ Ghi lại mã này — dùng cho cả 5 tiết</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-white/10 gap-2">
                <div className="flex items-center gap-3 text-xl font-black text-white">
                  <div className="bg-sky-600 p-2 rounded-xl"><Users className="w-6 h-6" /></div>
                  <span>{players.length} học sinh</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowRules(true)} className="px-4 py-3 rounded-2xl font-black bg-slate-800/80 hover:bg-slate-700 text-white border border-white/20">📖 Hướng dẫn</button>
                  <button onClick={openRoom} disabled={players.length === 0}
                    className={`px-6 py-3 rounded-2xl font-black text-lg flex items-center gap-2 ${players.length > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-105 text-white' : 'bg-slate-800 text-gray-500 cursor-not-allowed'}`}>
                    <Play className="w-6 h-6" /> BẮT ĐẦU
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-wrap gap-2 content-start">
                  {players.map(p => (
                    <div key={p.id} className="bg-white/10 border border-white/20 px-3 py-2 rounded-xl text-white text-sm">
                      <span className="font-bold">🗺️ {p.name}</span>
                      {p.className && <span className="text-sky-300 ml-2 font-bold">{p.className}</span>}
                    </div>
                  ))}
                  {players.length === 0 && <p className="text-gray-400">Đang chờ học sinh vào phòng…</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ ĐANG LÀM / THEO DÕI ============ */}
      {localState === 'OPEN' && roomData && (
        <div className="w-full min-h-screen flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-black/35 px-5 py-2.5 rounded-xl text-lg font-bold text-sky-300 border border-white/10">
              Mã phòng <span className="text-white font-black tracking-widest">{roomCode}</span>
            </div>
            <div className="bg-black/35 px-5 py-2.5 rounded-xl text-lg font-bold text-emerald-400 border border-white/10">
              Trung bình {avgPercent}% · {doneCount}/{players.length} xong cả 6 chặng
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setShowRules(true)} className="bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold border border-white/15">📖 Hướng dẫn</button>
              <button onClick={exportExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-black flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" /> Xuất Excel
              </button>
              <button onClick={closeRoom} className="bg-red-900/60 hover:bg-red-600 text-red-100 px-4 py-2.5 rounded-xl font-bold">Xoá phòng</button>
            </div>
          </div>

          <GameRulesOverlay
            open={showRules} onClose={() => setShowRules(false)} bgStyle={THEME} accent="sky"
            emoji="🗺️" title="Lộ Trình Nghề Nghiệp" subtitle="Em tự vẽ con đường tới nghề mình mơ ước"
            steps={[
              { icon: '1️⃣', text: 'Đi qua 6 chặng, gõ tới đâu máy lưu tới đó' },
              { icon: '2️⃣', text: 'Tiết sau mở lại làm tiếp, không mất bài' },
              { icon: '3️⃣', text: 'Bấm "Xem lộ trình" để nhìn toàn cảnh' },
            ]}
            footer="Con đường dài bắt đầu từ một bước nhỏ 🌱"
          />

          {/* Lớp đang tắc ở chặng nào */}
          <div className="bg-black/40 rounded-3xl border border-sky-700/40 p-4">
            <h3 className="text-lg font-black text-sky-200 mb-3 uppercase">Tiến độ theo chặng</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
              {stageStats.map(({ stage: s, done }) => {
                const pct = players.length ? Math.round((done / players.length) * 100) : 0;
                return (
                  <div key={s.id} className="bg-slate-900/70 rounded-2xl p-3 border border-slate-700 text-center">
                    <div className="text-2xl">{s.emoji}</div>
                    <div className="font-bold text-white text-xs mt-1 leading-tight">{s.name}</div>
                    <div className="text-2xl font-black text-sky-300 mt-1">{done}</div>
                    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-400" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold mt-1">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bảng học sinh */}
          <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden flex-1">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-black text-white uppercase">📋 Lộ trình từng em</h3>
              <span className="text-gray-400 text-sm">Bấm vào một em để xem đầy đủ</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-300 text-sm">
                  <tr>
                    <th className="px-4 py-2.5 font-bold">STT</th>
                    <th className="px-4 py-2.5 font-bold">Họ tên</th>
                    <th className="px-4 py-2.5 font-bold">Lớp</th>
                    <th className="px-4 py-2.5 font-bold">Nghề hướng tới</th>
                    <th className="px-4 py-2.5 font-bold">Trường</th>
                    {STAGES.map(s => <th key={s.id} className="px-2 py-2.5 text-center" title={s.name}>{s.emoji}</th>)}
                    <th className="px-4 py-2.5 font-bold text-right">Hoàn thành</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p, i) => {
                    const d = p.data || {};
                    const r = ratingOf(p.percent || 0);
                    return (
                      <tr key={p.id} onClick={() => setPicked(p)} className="border-t border-white/5 cursor-pointer hover:bg-white/5">
                        <td className="px-4 py-2.5 font-black text-gray-300">{i + 1}</td>
                        <td className="px-4 py-2.5 font-bold text-white">{p.name}</td>
                        <td className="px-4 py-2.5 text-sky-300 font-bold">{p.className || '—'}</td>
                        <td className="px-4 py-2.5 text-white/90">{(d.goal || {}).career || <span className="text-gray-600">chưa điền</span>}</td>
                        <td className="px-4 py-2.5 text-gray-300 text-sm">{(d.school || {}).school1 || '—'}</td>
                        {STAGES.map(s => (
                          <td key={s.id} className="px-2 py-2.5 text-center">
                            {stageDone(s, d) ? <span className="text-emerald-400 font-black">✓</span> : <span className="text-gray-700">·</span>}
                          </td>
                        ))}
                        <td className="px-4 py-2.5 text-right font-black" style={{ color: r.color }}>{p.percent || 0}%</td>
                      </tr>
                    );
                  })}
                  {sorted.length === 0 && (
                    <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-500">Chưa có học sinh nào vào phòng</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Xem lộ trình một em — chiếu lên làm mẫu */}
          {picked && (() => {
            const d = picked.data || {};
            const r = ratingOf(picked.percent || 0);
            return (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPicked(null)}>
                <div className="bg-slate-900 border-2 border-sky-600 rounded-3xl w-full max-w-2xl p-6 relative max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setPicked(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-slate-800 rounded-full p-2">✕</button>
                  <h3 className="text-2xl font-black text-white">{picked.name}</h3>
                  <p className="text-sky-300 font-bold">{picked.className} · <span style={{ color: r.color }}>{r.emoji} {r.label} — {picked.percent || 0}%</span></p>

                  <div className="mt-4 flex flex-col gap-3">
                    {STAGES.map(s => {
                      const filled = s.fields.filter(f => ((d[s.id] || {})[f.key] || '').toString().trim());
                      return (
                        <div key={s.id} className={`rounded-2xl p-3.5 border ${stageDone(s, d) ? 'bg-slate-800/70 border-emerald-800/60' : 'bg-slate-900/60 border-slate-700'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{s.emoji}</span>
                            <span className="font-black text-white text-sm">Chặng {s.order}: {s.name}</span>
                            {stageDone(s, d) && <span className="ml-auto text-emerald-400 text-sm font-black">✓</span>}
                          </div>
                          {filled.length === 0 ? <p className="text-gray-500 text-xs italic mt-1.5">Chưa điền</p> : (
                            <div className="mt-2 flex flex-col gap-1.5">
                              {filled.map(f => (
                                <div key={f.key} className="text-sm">
                                  <span className="text-sky-400/80 text-xs font-bold">{f.label}: </span>
                                  <span className="text-white/90 whitespace-pre-wrap">
                                    {f.type === 'score'
                                      ? (() => { const [a, b, c] = ((d[s.id] || {})[f.key] || '||').split('|'); return `${a || '?'} — ${b || '?'} → ${c || '?'}`; })()
                                      : (d[s.id] || {})[f.key]}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      </div>
    </div>
  );
};

export default PathHost;
