import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { db } from '../firebase';
import { ref, onValue, set, get, update } from 'firebase/database';
import { Camera, AlertCircle, Pause, Play, Zap, ZapOff, CheckCircle2 } from 'lucide-react';

// Hai kho phòng: game thường và Truy Tìm Kho Báu — scanner tự dò
const ROOM_PATHS = ['rooms', 'treasureRooms'];

// Số frame liên tiếp phải cho cùng một đáp án thì mới chốt (chống đọc nhầm khi thẻ đang xoay)
const CONFIRM_STREAK = 2;

const Scanner = () => {
  const [pin, setPin] = useState('');
  const [dbPath, setDbPath] = useState('rooms');
  const [isScanning, setIsScanning] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [scannedTeams, setScannedTeams] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [detectCount, setDetectCount] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const trackRef = useRef(null);
  const streakRef = useRef({});     // { teamId: { answer, count } }
  const roomRef = useRef(null);     // roomData mới nhất cho vòng lặp quét
  const pathRef = useRef('rooms');
  const pinRef = useRef('');

  useEffect(() => { roomRef.current = roomData; }, [roomData]);
  useEffect(() => { pathRef.current = dbPath; }, [dbPath]);
  useEffect(() => { pinRef.current = pin; }, [pin]);

  useEffect(() => {
    if (isScanning && pin) {
      const r = ref(db, `${dbPath}/${pin}`);
      const unsubscribe = onValue(r, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRoomData(data);
        } else {
          setErrorMsg("Phòng đã kết thúc!");
          stopScan();
        }
      });
      return () => unsubscribe();
    }
  }, [isScanning, pin, dbPath]);

  // Sang câu mới thì xoá kết quả quét của câu trước
  useEffect(() => {
    streakRef.current = {};
    setScannedTeams({});
  }, [roomData?.currentQuestionIndex]);

  const startScan = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    if (!pin) return;

    // Tự dò phòng nằm ở kho nào
    let foundPath = null;
    let data = null;
    for (const p of ROOM_PATHS) {
      const snap = await get(ref(db, `${p}/${pin}`));
      if (snap.exists()) { foundPath = p; data = snap.val(); break; }
    }
    if (!foundPath) {
      setErrorMsg("Mã phòng không tồn tại!");
      return;
    }

    setDbPath(foundPath);
    pathRef.current = foundPath;
    setRoomData(data);
    setIsScanning(true);
    setScannedTeams({});
    streakRef.current = {};

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        }
      });
      const track = stream.getVideoTracks()[0];
      trackRef.current = track;

      // Bật lấy nét liên tục nếu máy hỗ trợ
      const caps = track.getCapabilities ? track.getCapabilities() : {};
      const advanced = [];
      if (caps.focusMode?.includes('continuous')) advanced.push({ focusMode: 'continuous' });
      if (advanced.length) track.applyConstraints({ advanced }).catch(() => {});
      setTorchSupported(!!caps.torch);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", true);
        await videoRef.current.play();
        requestRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      setErrorMsg("Không thể truy cập camera! Vui lòng cấp quyền.");
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    setIsScanning(false);
    setTorchOn(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    cancelAnimationFrame(requestRef.current);
  };

  const toggleTorch = async () => {
    const track = trackRef.current;
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(!torchOn);
    } catch {
      setTorchSupported(false);
    }
  };

  // Tạm dừng / chạy lại đồng hồ của phòng
  const togglePause = async () => {
    const room = roomRef.current;
    if (!room) return;
    await update(ref(db, `${pathRef.current}/${pinRef.current}`), { paused: !room.paused });
  };

  // Quét xong → yêu cầu host công bố đáp án ngay
  const finishAndReveal = async () => {
    await update(ref(db, `${pathRef.current}/${pinRef.current}`), {
      paused: false,
      scanRequestReveal: true
    });
  };

  /**
   * Quét nhiều mã QR trong một khung hình.
   * jsQR chỉ trả về 1 mã mỗi lần gọi, nên ta quét cả khung rồi quét thêm
   * từng ô của lưới 3×3 có chồng mép — nhờ vậy nhận được nhiều thẻ cùng lúc.
   */
  const scanRegions = (ctx, width, height) => {
    const found = [];
    const seen = new Set();

    const runOn = (sx, sy, sw, sh) => {
      if (sw < 40 || sh < 40) return;
      const img = ctx.getImageData(sx, sy, sw, sh);
      // Lần 1 nhanh, lần 2 thử cả ảnh âm bản cho thẻ in ngược màu / thiếu sáng
      let code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (!code) code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
      if (!code || !code.data) return;
      if (seen.has(code.data)) return;
      seen.add(code.data);
      // Đưa toạ độ về hệ của khung đầy đủ để vẽ overlay
      const shift = (pt) => ({ x: pt.x + sx, y: pt.y + sy });
      found.push({
        data: code.data,
        location: {
          topLeftCorner: shift(code.location.topLeftCorner),
          topRightCorner: shift(code.location.topRightCorner),
          bottomRightCorner: shift(code.location.bottomRightCorner),
          bottomLeftCorner: shift(code.location.bottomLeftCorner)
        }
      });
    };

    runOn(0, 0, width, height);

    // Lưới 3×3, mỗi ô rộng 40% khung nên các ô chồng mép nhau
    const tw = Math.floor(width * 0.4);
    const th = Math.floor(height * 0.4);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const sx = Math.min(Math.floor(c * (width - tw) / 2), width - tw);
        const sy = Math.min(Math.floor(r * (height - th) / 2), height - th);
        runOn(Math.max(0, sx), Math.max(0, sy), tw, th);
      }
    }

    return found;
  };

  const tick = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      requestRef.current = requestAnimationFrame(tick);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const codes = scanRegions(ctx, canvas.width, canvas.height);
    setDetectCount(codes.length);

    codes.forEach(code => {
      const info = processQR(code);

      ctx.beginPath();
      ctx.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
      ctx.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
      ctx.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
      ctx.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
      ctx.closePath();
      ctx.lineWidth = 6;
      ctx.strokeStyle = info ? (info.locked ? '#10B981' : '#FACC15') : '#3B82F6';
      ctx.stroke();

      if (info) {
        ctx.fillStyle = info.locked ? '#10B981' : '#FACC15';
        ctx.font = 'bold 28px sans-serif';
        const label = `${info.label}: ${['A', 'B', 'C', 'D'][info.answer - 1]}${info.locked ? ' ✓' : '…'}`;
        ctx.fillText(label, code.location.topLeftCorner.x, Math.max(30, code.location.topLeftCorner.y - 10));
      }
    });

    requestRef.current = requestAnimationFrame(tick);
  };

  // Góc xoay của thẻ quyết định đáp án: A trên, B trái, C ngược, D phải
  const angleToAnswer = (loc) => {
    const dxTop = loc.topRightCorner.x - loc.topLeftCorner.x;
    const dyTop = loc.topRightCorner.y - loc.topLeftCorner.y;
    const dxBottom = loc.bottomRightCorner.x - loc.bottomLeftCorner.x;
    const dyBottom = loc.bottomRightCorner.y - loc.bottomLeftCorner.y;
    // Trung bình 2 cạnh ngang cho ổn định hơn khi thẻ hơi vênh
    const angle = (Math.atan2((dyTop + dyBottom) / 2, (dxTop + dxBottom) / 2) * 180) / Math.PI;

    if (angle > -45 && angle <= 45) return 1;    // A
    if (angle > -135 && angle <= -45) return 2;  // B
    if (angle > 45 && angle <= 135) return 4;    // D
    return 3;                                     // C
  };

  // Tìm người chơi ứng với thẻ: chế độ nhóm dùng team_n, cá nhân dùng thứ tự vào phòng
  const resolvePlayer = (room, num) => {
    const teamId = `team_${num}`;
    if (room.players?.[teamId]) return { id: teamId, name: room.players[teamId].name };
    const list = Object.values(room.players || {});
    const byOrder = list[num - 1];
    if (byOrder) return { id: byOrder.id, name: byOrder.name };
    return null;
  };

  const processQR = (code) => {
    const room = roomRef.current;
    if (!room || room.status !== 'QUESTION') return null;

    const currentQ = room.questions?.[room.currentQuestionIndex];
    if (!currentQ || currentQ.type === 'TLN') return null;

    const raw = (code.data || '').trim().toUpperCase();
    const match = raw.match(/^(?:TEAM|NHOM|HS|P)[_-]?(\d+)$/);
    if (!match) return null;

    const num = parseInt(match[1]);
    const target = resolvePlayer(room, num);
    if (!target) return null;

    const answer = angleToAnswer(code.location);

    // Cần thấy cùng một đáp án đủ số frame mới ghi nhận
    const prev = streakRef.current[target.id];
    const streak = prev && prev.answer === answer ? prev.count + 1 : 1;
    streakRef.current[target.id] = { answer, count: streak };
    const locked = streak >= CONFIRM_STREAK;

    if (locked && room.players[target.id].currentAnswer !== answer) {
      set(ref(db, `${pathRef.current}/${pinRef.current}/players/${target.id}/currentAnswer`), answer);
      setScannedTeams(prev2 => ({ ...prev2, [target.id]: answer }));
    }

    return { label: target.name, answer, locked };
  };

  useEffect(() => {
    return () => stopScan();
  }, []);

  const isPaused = !!roomData?.paused;
  const totalPlayers = Object.keys(roomData?.players || {}).length;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4">
      {!isScanning ? (
        <form onSubmit={startScan} className="w-full max-w-sm bg-slate-800 p-8 rounded-3xl mt-12 text-center border border-slate-700 shadow-xl">
          <Camera className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-white mb-2">Máy Quét Đáp Án</h1>
          <p className="text-gray-400 text-sm mb-6">Quét nhiều thẻ cùng lúc • Tự dò phòng • Dừng giờ khi quét</p>

          <input
            type="text"
            placeholder="Mã phòng (PIN)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-2xl font-bold bg-slate-900 text-white rounded-xl p-4 mb-6 outline-none border-2 border-slate-700 focus:border-emerald-500"
          />

          {errorMsg && <p className="text-red-400 mb-4 font-bold">{errorMsg}</p>}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl py-4 rounded-xl shadow-[0_8px_0_#047857] active:shadow-none active:translate-y-2 transition-all"
          >
            MỞ CAMERA
          </button>
        </form>
      ) : (
        <div className="w-full max-w-md flex flex-col h-[94vh]">
          <div className="flex justify-between items-center bg-slate-800 p-3 rounded-t-2xl border border-slate-700 gap-2">
            <div className="min-w-0">
              <div className="text-xs text-gray-400 truncate">
                {dbPath === 'treasureRooms' ? '🏴‍☠️ Kho Báu' : '🎮 Trò chơi'} • {detectCount} mã trong khung
              </div>
              <div className="text-xl font-black text-white">{pin}</div>
            </div>

            <div className="flex gap-2 shrink-0">
              {torchSupported && (
                <button onClick={toggleTorch} className={`p-2.5 rounded-lg font-bold ${torchOn ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-white'}`}>
                  {torchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                </button>
              )}
              <button
                onClick={togglePause}
                className={`p-2.5 rounded-lg font-bold ${isPaused ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white'}`}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              <button onClick={stopScan} className="bg-red-600 px-3 py-2 rounded-lg font-bold text-white text-sm">
                Đóng
              </button>
            </div>
          </div>

          {isPaused && (
            <div className="bg-amber-500 text-slate-900 text-center py-2 font-black text-sm border-x border-amber-600">
              ⏸ ĐÃ DỪNG ĐỒNG HỒ — quét xong hãy bấm "Chốt & Hết giờ"
            </div>
          )}

          <div className="relative flex-1 bg-black overflow-hidden border-x border-slate-700">
             <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
             <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-10" />

             <div className="absolute inset-0 border-[10px] border-black/30 pointer-events-none z-20" />
             <div className="absolute inset-6 border-2 border-dashed border-white/40 rounded-3xl pointer-events-none z-20" />

             {roomData?.status !== 'QUESTION' && (
               <div className="absolute inset-0 bg-black/80 z-30 flex flex-col items-center justify-center p-8 text-center">
                 <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
                 <h2 className="text-2xl font-bold text-white mb-2">Đang chờ câu hỏi...</h2>
                 <p className="text-gray-400">Máy quét sẽ tự bật khi có câu hỏi trắc nghiệm mới.</p>
               </div>
             )}
          </div>

          <div className="bg-slate-800 p-3 rounded-b-2xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-emerald-400 font-bold text-sm">
                Đã chốt {Object.keys(scannedTeams).length}/{totalPlayers}
              </h3>
              <button
                onClick={finishAndReveal}
                disabled={roomData?.status !== 'QUESTION'}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-black text-sm flex items-center gap-2 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" /> Chốt & Hết giờ
              </button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
               {Object.entries(scannedTeams).map(([teamId, ans]) => {
                 const isCorrect = ans === roomData?.questions?.[roomData?.currentQuestionIndex]?.correctOption;
                 return (
                   <div key={teamId} className={`px-3 py-1 rounded-full flex items-center gap-2 border ${isCorrect ? 'bg-emerald-900/50 border-emerald-500/50' : 'bg-red-900/50 border-red-500/50'}`}>
                     <span className="text-white font-bold text-sm">{roomData?.players?.[teamId]?.name || teamId}</span>
                     <span className={`font-black px-2 bg-slate-800 rounded ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                       {['A', 'B', 'C', 'D'][ans - 1]}
                     </span>
                   </div>
                 );
               })}
               {Object.keys(scannedTeams).length === 0 && (
                 <div className="text-gray-500 italic text-sm">Chưa có kết quả... Đưa camera bao quát các thẻ QR.</div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
