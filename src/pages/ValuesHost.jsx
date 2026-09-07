import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Play, Users, CheckCircle2, FileSpreadsheet, ChevronRight } from 'lucide-react';
import { db } from '../firebase';
import { ref, set, update, onValue, remove, get } from 'firebase/database';
import GameRulesOverlay from '../components/GameRulesOverlay';
import { VALUES, valueOf, DEFAULT_BUDGET, DEFAULT_FLOOR, DEFAULT_BID_SECONDS, settleRound, rankValues, classDemand } from '../data/valuesData';

const THEMES = [
  { id: 'gold',   name: '💎 Sàn Vàng', bgStyle: { background: 'linear-gradient(160deg,#0c0a09 0%,#292524 50%,#78350f 100%)' }, preview: 'from-amber-800 via-stone-900 to-black' },
  { id: 'royal',  name: '👑 Hoàng Gia', bgStyle: { background: 'linear-gradient(160deg,#1e1b4b 0%,#4c1d95 50%,#020617 100%)' }, preview: 'from-violet-900 via-purple-900 to-slate-900' },
  { id: 'ocean',  name: '🌊 Đại Dương', bgStyle: { background: 'linear-gradient(160deg,#0c1445 0%,#0a2463 50%,#023e8a 100%)' }, preview: 'from-blue-900 via-sky-900 to-cyan-900' },
  { id: 'forest', name: '🌿 Xanh Lá', bgStyle: { background: 'linear-gradient(160deg,#022c22 0%,#064e3b 50%,#0f172a 100%)' }, preview: 'from-emerald-900 via-teal-900 to-slate-900' },
];

const HOST_ROOM_KEY = 'valuesHostRoom';

const ValuesHost = () => {
  const navigate = useNavigate();
  const [localGameState, setLocalGameState] = useState('SETUP');
  const [roomCode, setRoomCode] = useState('');
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [floor, setFloor] = useState(DEFAULT_FLOOR);
  const [bidSeconds, setBidSeconds] = useState(DEFAULT_BID_SECONDS);
  const [picked, setPicked] = useState(() => VALUES.map(v => v.id));
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [gameTitle, setGameTitle] = useState('ĐẤU GIÁ GIÁ TRỊ SỐNG');
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
    const unsub = onValue(ref(db, `valuesRooms/${roomCode}`), (snap) => {
      const data = snap.val();
      if (data) setRoomData(data);
    });
    return () => unsub();
  }, [roomCode]);

  // Đồng hồ của lượt đấu giá đang diễn ra
  useEffect(() => {
    if (roomData?.status !== 'BIDDING' || !roomData?.roundStartedAt) return;
    const secs = roomData.settings?.bidSeconds || DEFAULT_BID_SECONDS;
    const tick = () => {
      const left = Math.max(0, secs - Math.floor((Date.now() - roomData.roundStartedAt) / 1000));
      setTimeLeft(left);
      if (left === 0) closeRound();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [roomData?.status, roomData?.roundStartedAt]);

  useEffect(() => {
    let code = null;
    try { code = localStorage.getItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (!code) return;
    get(ref(db, `valuesRooms/${code}`)).then(snap => {
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

  const toggleValue = (id) =>
    setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const createRoom = async () => {
    if (picked.length < 3) { alert("Hãy chọn ít nhất 3 giá trị để đấu giá!"); return; }
    try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch { /* bị chặn */ }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    try { localStorage.setItem(HOST_ROOM_KEY, code); } catch { /* không sao */ }
    setLocalGameState('LOBBY');
    setShowRules(true);
    playAudio('https://files.catbox.moe/eopz4f.mp3');

    // Thứ tự đấu giá xáo trộn để học sinh không đoán trước được điều gì sắp ra
    const order = [...picked].sort(() => 0.5 - Math.random());

    await set(ref(db, `valuesRooms/${code}`), {
      status: 'LOBBY',
      players: {},
      order,
      roundIndex: 0,
      settings: { budget, floor, bidSeconds, gameTitle, defaultClass }
    });
  };

  const startAuction = async () => {
    playAudio('https://files.catbox.moe/amew8w.mp3');
    await update(ref(db, `valuesRooms/${roomCode}`), {
      status: 'BIDDING', roundIndex: 0, roundStartedAt: Date.now(), bids: null, lastResult: null
    });
    setLocalGameState('PLAYING');
  };

  // Chốt lượt: ai trả từ giá sàn trở lên thì sở hữu, trừ đúng số đã trả
  const closeRound = async () => {
    if (!roomData || roomData.status !== 'BIDDING') return;
    const valueId = roomData.order?.[roomData.roundIndex];
    if (!valueId) return;

    playAudio('https://files.catbox.moe/r1fiz6.mp3');
    const bids = roomData.bids || {};
    const fl = roomData.settings?.floor ?? DEFAULT_FLOOR;
    const result = settleRound(bids, fl);

    const updates = { status: 'RESULT' };
    result.winners.forEach(w => {
      const p = roomData.players?.[w.id];
      if (!p) return;
      updates[`players/${w.id}/owned/${valueId}`] = w.amount;
      updates[`players/${w.id}/remaining`] = Math.max(0, (p.remaining ?? roomData.settings.budget) - w.amount);
    });
    updates['lastResult'] = {
      valueId,
      topId: result.topId,
      topName: result.topId ? (roomData.players?.[result.topId]?.name || '') : '',
      topAmount: result.topAmount,
      buyers: result.winners.length,
      demand: result.demand,
      total: Object.keys(roomData.players || {}).length
    };

    await update(ref(db, `valuesRooms/${roomCode}`), updates);
  };

  const nextRound = async () => {
    const next = (roomData.roundIndex || 0) + 1;
    if (next >= (roomData.order?.length || 0)) { finishAuction(); return; }
    playAudio('https://files.catbox.moe/amew8w.mp3');
    await update(ref(db, `valuesRooms/${roomCode}`), {
      status: 'BIDDING', roundIndex: next, roundStartedAt: Date.now(), bids: null, lastResult: null
    });
  };

  const finishAuction = async () => {
    playAudio('https://files.catbox.moe/12vlpb.mp3');
    await update(ref(db, `valuesRooms/${roomCode}`), { status: 'END' });
  };

  const closeRoom = async () => {
    if (!window.confirm("Kết thúc hoàn toàn và xoá phòng này?")) return;
    await remove(ref(db, `valuesRooms/${roomCode}`));
    try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setLocalGameState('SETUP');
    setRoomCode('');
    setRoomData(null);
  };

  const playersList = roomData?.players ? Object.values(roomData.players) : [];
  const order = roomData?.order || picked;
  const roundIndex = roomData?.roundIndex || 0;
  const currentValue = valueOf(order[roundIndex]);
  const bidsNow = roomData?.bids || {};
  const bidCount = Object.keys(bidsNow).length;
  const theme = selectedTheme;
  const demand = classDemand(playersList, order);

  const exportExcel = () => {
    const head = ['STT', 'Họ tên', 'Lớp', 'Giá trị số 1', 'Giá trị số 2', 'Giá trị số 3',
      'Số giá trị sở hữu', 'Đã tiêu', 'Còn lại', ...order.map(id => valueOf(id)?.name || id)];
    const rows = [head];
    const sorted = [...playersList].sort((a, b) =>
      (a.className || '').localeCompare(b.className || '') || (a.name || '').localeCompare(b.name || '', 'vi'));

    sorted.forEach((p, i) => {
      const ranked = rankValues(p.owned || {});
      const spent = Object.values(p.owned || {}).reduce((s, v) => s + v, 0);
      rows.push([
        i + 1, p.name || '', p.className || '',
        ranked[0]?.value.name || '—',
        ranked[1]?.value.name || '—',
        ranked[2]?.value.name || '—',
        ranked.length, spent, p.remaining ?? 0,
        ...order.map(id => p.owned?.[id] || 0)
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 26 }, { wch: 9 }, { wch: 22 }, { wch: 22 }, { wch: 22 },
      { wch: 16 }, { wch: 10 }, { wch: 10 }, ...order.map(() => ({ wch: 18 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BangGiaTri");
    const stamp = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    XLSX.writeFile(wb, `BangGiaTri_${(defaultClass || 'Lop').replace(/\s+/g, '')}_${stamp}.xlsx`);
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

            <h1 className="text-4xl font-black mb-2 text-amber-300 text-center">💎 Đấu Giá Giá Trị Sống</h1>
            <p className="text-gray-300 text-center">Ngân sách có hạn — <b className="text-amber-200">không thể mua tất cả</b>, buộc phải chọn điều mình coi trọng nhất</p>
            <p className="text-amber-200/70 text-center text-sm mt-1 mb-10">Không chấm điểm — kết quả là bảng giá trị của riêng từng em</p>

            {resumeRoom && (
              <div className="mb-8 bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-300">🔌 Phòng {resumeRoom} vẫn đang mở</h3>
                  <p className="text-gray-300 text-sm mt-1">Phiên đấu giá còn nguyên. Nối lại để tiếp tục.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={resumeHosting} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black">Nối lại phòng</button>
                  <button onClick={() => { try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ } setResumeRoom(null); }} className="bg-slate-800 hover:bg-slate-700 text-gray-300 px-4 py-3 rounded-xl font-bold">Bỏ qua</button>
                </div>
              </div>
            )}

            {/* Chọn giá trị đem ra đấu */}
            <div className="mb-8 bg-slate-900/70 rounded-2xl border border-amber-800/50 p-5">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <h2 className="text-xl font-black text-amber-200">Chọn giá trị đem ra đấu giá</h2>
                <div className="flex gap-2">
                  <button onClick={() => setPicked(VALUES.map(v => v.id))} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg font-bold">Chọn tất cả</button>
                  <button onClick={() => setPicked([])} className="text-xs bg-slate-700 hover:bg-red-600 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg font-bold">Bỏ hết</button>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Đang chọn <b className="text-amber-300">{picked.length}</b> giá trị · mỗi lượt {bidSeconds}s ·
                cả buổi khoảng <b className="text-white">{Math.ceil(picked.length * (bidSeconds + 12) / 60)} phút</b>
              </p>

              <div className="grid md:grid-cols-3 gap-2.5">
                {VALUES.map(v => {
                  const on = picked.includes(v.id);
                  return (
                    <button key={v.id} onClick={() => toggleValue(v.id)}
                      className={`text-left rounded-xl p-3 border-2 transition-all ${on ? 'scale-[1.02]' : 'opacity-45 hover:opacity-75'}`}
                      style={{ backgroundColor: v.color + (on ? '22' : '10'), borderColor: on ? v.color + 'aa' : 'transparent' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{v.emoji}</span>
                        <span className="font-black text-white text-sm leading-tight">{v.name}</span>
                        {on && <span className="ml-auto text-xs" style={{ color: v.color }}>✓</span>}
                      </div>
                      <p className="text-gray-400 text-xs mt-1.5 leading-snug">{v.desc}</p>
                    </button>
                  );
                })}
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
                    {selectedTheme.id === t.id && <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /></div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <label className="block text-gray-400 mb-2 font-bold text-sm">📝 Tên buổi hoạt động</label>
                <input type="text" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xl font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-amber-500 mb-5" />

                <label className="block text-gray-400 mb-2 font-bold text-sm">🏫 Lớp mặc định</label>
                <input type="text" value={defaultClass} onChange={(e) => setDefaultClass(e.target.value)} placeholder="VD: 11A3"
                  className="w-full bg-slate-900 text-white text-xl font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-amber-500" />
              </div>

              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">💰 Ngân sách mỗi em</label>
                <input type="number" min="100" step="100" value={budget}
                  onChange={(e) => setBudget(Math.max(100, parseInt(e.target.value) || 100))}
                  className="w-full bg-slate-900 text-amber-300 text-4xl font-black text-center py-3 rounded-lg outline-none mb-5" />

                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">🔨 Giá sàn mỗi giá trị</label>
                <input type="number" min="0" step="10" value={floor}
                  onChange={(e) => setFloor(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 text-white text-2xl font-black text-center py-3 rounded-lg outline-none mb-1" />
                <p className="text-gray-500 text-xs text-center mb-5">Trả dưới giá sàn thì không mua được, nhưng cũng không mất tiền</p>

                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">⏱ Thời gian mỗi lượt (giây)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 20, 25, 30].map(s => (
                    <button key={s} onClick={() => setBidSeconds(s)}
                      className={`py-3 rounded-lg font-black transition-all ${bidSeconds === s ? 'bg-amber-500 text-slate-900 scale-105' : 'bg-slate-900 text-gray-400 hover:bg-slate-700'}`}>
                      {s}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-br from-amber-950/50 to-slate-900 p-6 rounded-2xl border-2 border-amber-700/40">
              <h2 className="text-2xl font-black text-amber-300 mb-3">💡 Gợi ý cho thầy cô</h2>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Thứ tự các giá trị được <b className="text-white">xáo trộn ngẫu nhiên</b> — học sinh không biết điều gì sắp ra nên phải quyết định thật.</li>
                <li>• Khoảnh khắc quý nhất là khi một em <b className="text-amber-200">tiếc vì đã tiêu hết tiền</b> cho giá trị trước đó. Hãy dừng lại hỏi em ấy.</li>
                <li>• Sau mỗi lượt, màn hình hiện <b className="text-white">bao nhiêu phần trăm lớp chịu bỏ tiền</b> cho giá trị đó — dữ liệu rất tốt để thảo luận.</li>
                <li>• Cuối buổi nên hỏi: <i>“Bảng giá trị này có giống điều em vẫn nghĩ về mình không?”</i></li>
                <li>• Kết hợp với <b className="text-sky-300">🧭 La Bàn Nghề Nghiệp</b>: thích gì (La Bàn) và coi trọng gì (Đấu Giá) có khớp nhau không?</li>
              </ul>
            </div>
          </div>

          <button onClick={createRoom} disabled={picked.length < 3}
            className={`absolute top-6 right-6 px-8 py-4 rounded-2xl font-black text-xl transition-all ${picked.length >= 3 ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
            🚀 TẠO PHÒNG
          </button>
        </div>
      )}

      {/* ============ PHÒNG CHỜ ============ */}
      {localGameState === 'LOBBY' && roomData && (() => {
        const playUrl = `https://webdayhoc.vercel.app/values/play?pin=${roomCode}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(playUrl)}&bgcolor=ffffff&color=000000&margin=10`;
        return (
          <div className="w-full min-h-screen flex flex-col">
            <GameRulesOverlay
              open={showRules}
              onClose={() => setShowRules(false)}
              bgStyle={theme.bgStyle}
              accent="amber"
              emoji="💎"
              title="Đấu Giá Giá Trị Sống"
              subtitle="Tiền có hạn — em không thể mua tất cả, hãy chọn điều mình coi trọng nhất"
              steps={[
                { icon: '1️⃣', text: `Mỗi em bắt đầu với ${roomData.settings?.budget || DEFAULT_BUDGET} điểm ngân sách` },
                { icon: '2️⃣', text: `Lần lượt ${order.length} giá trị được đưa ra đấu giá, mỗi lượt ${roomData.settings?.bidSeconds || 20} giây` },
                { icon: '3️⃣', text: 'Em quyết định trả bao nhiêu cho giá trị đó — hoặc bỏ qua để dành tiền' },
                { icon: '4️⃣', text: `Trả từ ${roomData.settings?.floor ?? DEFAULT_FLOOR} điểm trở lên thì em sở hữu giá trị đó`, note: 'Trả thấp hơn thì không mua được nhưng cũng không mất tiền' },
                { icon: '5️⃣', text: 'Thứ tự các giá trị là NGẪU NHIÊN', note: 'Không ai biết điều gì sắp ra — hãy cân nhắc kỹ trước khi dốc hết' },
                { icon: '💎', text: 'Cuối buổi em nhận bảng giá trị của riêng mình, xếp theo số tiền đã bỏ ra' },
              ]}
              highlights={[
                { emoji: '🤔', tone: 'info', title: 'Không có lựa chọn sai', text: 'Ai coi trọng điều gì là quyền của người đó' },
                { emoji: '💸', tone: 'warn', title: 'Tiêu rồi là hết', text: 'Dốc hết ngay đầu thì về sau chỉ biết đứng nhìn' },
                { emoji: '🙈', tone: 'good', title: 'Giá bí mật', text: 'Không ai thấy em trả bao nhiêu cho tới khi chốt lượt' },
              ]}
              footer="Điều em sẵn sàng trả giá cao nhất chính là điều em coi trọng nhất 💎"
            />

            <div className="text-center pt-8 pb-3 shrink-0">
              <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                {roomData.settings.gameTitle || 'ĐẤU GIÁ GIÁ TRỊ SỐNG'}
              </h1>
              <h2 className="text-lg text-amber-100/80 mt-2 font-semibold tracking-widest uppercase">
                {order.length} giá trị · {roomData.settings?.budget} điểm mỗi em
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
                    <span>{playersList.length} nhà đấu giá</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowRules(true)} className="px-4 py-3 rounded-2xl font-black bg-slate-800/80 hover:bg-slate-700 text-white border border-white/20">📖 Luật</button>
                    <button onClick={startAuction} disabled={playersList.length === 0}
                      className={`px-6 py-3 rounded-2xl font-black text-lg flex items-center gap-2 ${playersList.length > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-105 text-white' : 'bg-slate-800 text-gray-500 cursor-not-allowed'}`}>
                      <Play className="w-6 h-6" /> MỞ PHIÊN
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-wrap gap-2 content-start">
                    {playersList.map(p => (
                      <div key={p.id} className="bg-white/10 border border-white/20 px-3 py-2 rounded-xl text-white text-sm">
                        <span className="font-bold">💎 {p.name}</span>
                        {p.className && <span className="text-amber-300 ml-2 font-bold">{p.className}</span>}
                      </div>
                    ))}
                    {playersList.length === 0 && <p className="text-gray-400">Đang chờ các nhà đấu giá vào sàn…</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============ ĐANG ĐẤU GIÁ ============ */}
      {localGameState === 'PLAYING' && (roomData?.status === 'BIDDING' || roomData?.status === 'RESULT') && currentValue && (
        <div className="w-full flex flex-col min-h-screen">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="bg-black/35 px-5 py-2.5 rounded-xl text-lg font-bold text-amber-300 border border-white/10">
              Lượt {roundIndex + 1}/{order.length}
            </div>
            {roomData.status === 'BIDDING' && (
              <div className={`text-4xl font-black px-6 py-2 rounded-xl border backdrop-blur-md ${timeLeft <= 5 ? 'bg-red-500/30 border-red-400 text-red-200 animate-pulse' : 'bg-black/35 border-white/15 text-white'}`}>
                ⏱ {timeLeft}s
              </div>
            )}
            <div className="bg-black/35 px-5 py-2.5 rounded-xl text-lg font-bold text-emerald-400 border border-white/10">
              🔨 Đã chốt giá: {bidCount}/{playersList.length}
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setShowRules(true)} className="bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold border border-white/15">📖 Luật</button>
              <button onClick={finishAuction} className="bg-red-900/60 hover:bg-red-600 text-red-100 px-5 py-2.5 rounded-xl font-bold">Kết thúc phiên</button>
            </div>
          </div>

          <GameRulesOverlay
            open={showRules} onClose={() => setShowRules(false)} bgStyle={theme.bgStyle} accent="amber"
            emoji="💎" title="Đấu Giá Giá Trị Sống" subtitle="Tiền có hạn — hãy chọn điều em coi trọng nhất"
            steps={[
              { icon: '1️⃣', text: 'Mỗi lượt một giá trị được đưa ra' },
              { icon: '2️⃣', text: 'Em quyết định trả bao nhiêu, hoặc bỏ qua để dành tiền' },
              { icon: '3️⃣', text: 'Thứ tự ngẫu nhiên — không ai biết điều gì sắp ra' },
            ]}
            footer="Điều em trả giá cao nhất chính là điều em coi trọng nhất 💎"
          />

          {/* Giá trị đang lên sàn */}
          <div className="rounded-3xl border-4 p-8 text-center mb-4"
            style={{ backgroundColor: currentValue.color + '20', borderColor: currentValue.color }}>
            <div className="text-8xl mb-2">{currentValue.emoji}</div>
            <h2 className="text-4xl md:text-6xl font-black text-white">{currentValue.name}</h2>
            <p className="text-xl text-white/80 mt-3 max-w-2xl mx-auto">{currentValue.desc}</p>
            <p className="mt-4 inline-block px-5 py-2 rounded-full font-black text-lg"
              style={{ backgroundColor: currentValue.color + '35', color: '#fff' }}>
              Giá sàn {roomData.settings?.floor ?? DEFAULT_FLOOR} điểm
            </p>
          </div>

          {roomData.status === 'BIDDING' && (
            <div className="flex-1 flex flex-col gap-3">
              <div className="bg-black/40 rounded-2xl border border-white/15 p-4">
                <p className="text-center text-gray-300 font-bold mb-3">
                  Mức giá được giữ kín tới khi gõ búa 🔨
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {playersList.map(p => (
                    <span key={p.id} className={`px-3 py-1.5 rounded-full text-sm font-bold border ${bidsNow[p.id] !== undefined ? 'bg-emerald-900/50 border-emerald-500 text-emerald-200' : 'bg-slate-800/70 border-slate-600 text-gray-400'}`}>
                      {bidsNow[p.id] !== undefined ? '✅' : '⏳'} {p.name}
                    </span>
                  ))}
                </div>
              </div>

              <button onClick={closeRound}
                className="mx-auto bg-amber-600 hover:bg-amber-500 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-[0_8px_0_#92400e] active:translate-y-2 active:shadow-none transition-all">
                🔨 GÕ BÚA CHỐT LƯỢT
              </button>
            </div>
          )}

          {/* Kết quả lượt vừa chốt */}
          {roomData.status === 'RESULT' && roomData.lastResult && (() => {
            const r = roomData.lastResult;
            const winners = playersList
              .filter(p => (p.owned?.[r.valueId] || 0) > 0)
              .sort((a, b) => (b.owned[r.valueId] || 0) - (a.owned[r.valueId] || 0));
            return (
              <div className="flex-1 flex flex-col gap-4">
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-black/45 rounded-2xl border border-white/15 p-4 text-center">
                    <div className="text-4xl font-black text-emerald-400">{r.buyers}/{r.total}</div>
                    <div className="text-sm text-gray-400 font-bold mt-1">bạn chịu bỏ tiền mua</div>
                  </div>
                  <div className="bg-black/45 rounded-2xl border border-white/15 p-4 text-center">
                    <div className="text-4xl font-black text-amber-300">{r.demand}%</div>
                    <div className="text-sm text-gray-400 font-bold mt-1">tỉ lệ cả lớp coi trọng</div>
                  </div>
                  <div className="bg-yellow-500/15 rounded-2xl border-2 border-yellow-500 p-4 text-center">
                    <div className="text-xs text-yellow-300 font-black uppercase tracking-widest">Trả cao nhất</div>
                    <div className="text-xl font-black text-white mt-1 truncate">{r.topName || '—'}</div>
                    <div className="text-2xl font-black text-yellow-300">{r.topAmount} điểm</div>
                  </div>
                </div>

                <div className="bg-black/40 rounded-2xl border border-white/15 p-4 flex-1">
                  <h3 className="font-black text-white mb-2">Ai đã mua được {currentValue.emoji} {currentValue.name}?</h3>
                  <div className="flex flex-wrap gap-2">
                    {winners.map(p => (
                      <span key={p.id} className="px-3 py-1.5 rounded-full text-sm font-bold bg-emerald-900/50 border border-emerald-600 text-emerald-100">
                        {p.name} <span className="text-amber-300">{p.owned[r.valueId]}đ</span>
                      </span>
                    ))}
                    {winners.length === 0 && <p className="text-gray-500">Không ai trả tới giá sàn — giá trị này ế!</p>}
                  </div>
                </div>

                <button onClick={nextRound}
                  className="mx-auto bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none transition-all flex items-center gap-3">
                  {roundIndex + 1 >= order.length ? '💎 XEM TỔNG KẾT' : <>GIÁ TRỊ TIẾP THEO <ChevronRight className="w-6 h-6" /></>}
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* ============ TỔNG KẾT ============ */}
      {roomData?.status === 'END' && (
        <div className="w-full min-h-screen overflow-y-auto">
          <div className="max-w-6xl mx-auto py-4">
            <div className="text-center mb-5">
              <div className="text-7xl mb-1">💎</div>
              <h1 className="text-4xl md:text-5xl font-black text-amber-300 uppercase drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]">Bảng Giá Trị Của Lớp</h1>
              <p className="text-white/80 mt-2">{playersList.length} học sinh · {order.length} giá trị đã đấu giá</p>
            </div>

            {/* Lớp coi trọng điều gì nhất */}
            <div className="bg-black/45 rounded-3xl border border-amber-600/40 p-5 mb-5">
              <h3 className="text-xl font-black text-amber-200 mb-1 uppercase">Lớp mình coi trọng điều gì nhất?</h3>
              <p className="text-gray-400 text-sm mb-4">Xếp theo tổng số điểm cả lớp đã bỏ ra — đây là tư liệu rất tốt để thảo luận</p>
              <div className="flex flex-col gap-2">
                {demand.map((d, i) => {
                  const max = demand[0]?.totalSpent || 1;
                  const pct = Math.round((d.totalSpent / max) * 100);
                  return (
                    <div key={d.value.id} className="flex items-center gap-3">
                      <span className="font-black text-gray-500 w-6 shrink-0">{i + 1}</span>
                      <span className="text-xl shrink-0">{d.value.emoji}</span>
                      <span className="font-bold text-white w-44 shrink-0 truncate">{d.value.name}</span>
                      <div className="flex-1 h-6 bg-black/50 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(pct, 6)}%`, backgroundColor: d.value.color }}>
                          <span className="text-xs font-black text-white drop-shadow">{d.totalSpent}</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-400 w-28 text-right shrink-0">
                        {d.buyers} bạn · TB {d.avgPaid}đ
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center gap-3 mb-6">
              <button onClick={exportExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 shadow-[0_8px_0_#047857] active:translate-y-2 active:shadow-none transition-all">
                <FileSpreadsheet className="w-6 h-6" /> XUẤT BẢNG GIÁ TRỊ
              </button>
              <button onClick={closeRoom} className="bg-red-700 hover:bg-red-600 text-white px-6 py-4 rounded-2xl font-black">Thoát &amp; Xoá Phòng</button>
            </div>

            <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden mb-8">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase">📋 Bảng giá trị từng em</h3>
                <span className="text-gray-400 text-sm">Bấm vào một em để xem đầy đủ</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-gray-300 text-sm">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">STT</th>
                      <th className="px-4 py-2.5 font-bold">Họ tên</th>
                      <th className="px-4 py-2.5 font-bold">Lớp</th>
                      <th className="px-4 py-2.5 font-bold">Giá trị số 1</th>
                      <th className="px-4 py-2.5 font-bold">Giá trị số 2</th>
                      <th className="px-4 py-2.5 font-bold text-center">Sở hữu</th>
                      <th className="px-4 py-2.5 font-bold text-right">Còn lại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...playersList]
                      .sort((a, b) => (a.className || '').localeCompare(b.className || '') || (a.name || '').localeCompare(b.name || '', 'vi'))
                      .map((p, i) => {
                        const ranked = rankValues(p.owned || {});
                        return (
                          <tr key={p.id} onClick={() => setPickedStudent(p)} className="border-t border-white/5 cursor-pointer hover:bg-white/5">
                            <td className="px-4 py-2.5 font-black text-gray-300">{i + 1}</td>
                            <td className="px-4 py-2.5 font-bold text-white">{p.name}</td>
                            <td className="px-4 py-2.5 text-amber-300 font-bold">{p.className || '—'}</td>
                            <td className="px-4 py-2.5 font-bold" style={{ color: ranked[0]?.value.color }}>
                              {ranked[0] ? `${ranked[0].value.emoji} ${ranked[0].value.name}` : '—'}
                              {ranked[0] && <span className="text-gray-500 font-normal text-sm"> ({ranked[0].paid}đ)</span>}
                            </td>
                            <td className="px-4 py-2.5 font-bold" style={{ color: ranked[1]?.value.color }}>
                              {ranked[1] ? `${ranked[1].value.emoji} ${ranked[1].value.name}` : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-center font-bold text-gray-300">{ranked.length}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-amber-300">{p.remaining ?? 0}</td>
                          </tr>
                        );
                      })}
                    {playersList.length === 0 && (
                      <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">Chưa có học sinh nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {pickedStudent && (() => {
            const ranked = rankValues(pickedStudent.owned || {});
            return (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPickedStudent(null)}>
                <div className="bg-slate-900 border-2 border-amber-600 rounded-3xl w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setPickedStudent(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-slate-800 rounded-full p-2">✕</button>
                  <h3 className="text-2xl font-black text-white">{pickedStudent.name}</h3>
                  <p className="text-amber-300 font-bold mb-4">{pickedStudent.className}</p>
                  <div className="flex flex-col gap-2">
                    {ranked.map((r, i) => (
                      <div key={r.value.id} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: r.value.color + '20', border: `1px solid ${r.value.color}66` }}>
                        <span className="font-black text-gray-400 w-5">{i + 1}</span>
                        <span className="text-xl">{r.value.emoji}</span>
                        <span className="flex-1 font-bold text-white text-sm">{r.value.name}</span>
                        <span className="font-black" style={{ color: r.value.color }}>{r.paid}đ</span>
                      </div>
                    ))}
                    {ranked.length === 0 && <p className="text-gray-500 text-center py-6">Em này chưa mua được giá trị nào</p>}
                  </div>
                  <p className="text-center text-gray-400 text-sm mt-4">Còn lại {pickedStudent.remaining ?? 0} điểm chưa tiêu</p>
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

export default ValuesHost;
