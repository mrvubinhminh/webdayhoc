import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { db } from '../firebase';
import { ref, onValue, set, get } from 'firebase/database';
import { Camera, CheckCircle2, AlertCircle } from 'lucide-react';

const Scanner = () => {
  const [pin, setPin] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [scannedTeams, setScannedTeams] = useState({}); // Local state for immediate feedback
  const [errorMsg, setErrorMsg] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    if (isScanning && pin) {
      const roomRef = ref(db, `rooms/${pin}`);
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRoomData(data);
          // If question changed, clear local scanned state
          setScannedTeams(prev => {
            if (data.status !== 'QUESTION') return {};
            return prev; // We might need a better way to reset, but roomData.players handles state.
          });
        } else {
          setErrorMsg("Phòng đã kết thúc!");
          stopScan();
        }
      });
      return () => unsubscribe();
    }
  }, [isScanning, pin]);

  const startScan = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    if (!pin) return;

    const snapshot = await get(ref(db, `rooms/${pin}`));
    if (!snapshot.exists()) {
      setErrorMsg("Mã phòng không tồn tại!");
      return;
    }

    const data = snapshot.val();
    if (data.settings?.playMode !== 'TEAM') {
      setErrorMsg("Phòng này không ở chế độ CHƠI NHÓM!");
      return;
    }

    setRoomData(data);
    setIsScanning(true);
    setScannedTeams({});

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", true);
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      setErrorMsg("Không thể truy cập camera! Vui lòng cấp quyền.");
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    setIsScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    cancelAnimationFrame(requestRef.current);
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
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

    if (code) {
      processQR(code);
      // Vẽ viền quanh QR để GV thấy
      ctx.beginPath();
      ctx.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
      ctx.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
      ctx.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
      ctx.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
      ctx.lineTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#10B981"; // Emerald 500
      ctx.stroke();
    }

    requestRef.current = requestAnimationFrame(tick);
  };

  const processQR = async (code) => {
    if (roomData?.status !== 'QUESTION') return;
    
    const currentQ = roomData.questions[roomData.currentQuestionIndex];
    if (currentQ.type === 'TLN') return; // Không hỗ trợ quét TLN

    const data = code.data; // e.g. TEAM_1
    if (!data.startsWith('TEAM_')) return;
    
    const teamNum = parseInt(data.replace('TEAM_', ''));
    const teamId = `team_${teamNum}`;
    
    // Check if team is in the game
    if (!roomData.players || !roomData.players[teamId]) return;

    // Calculate orientation
    const dx = code.location.topRightCorner.x - code.location.topLeftCorner.x;
    const dy = code.location.topRightCorner.y - code.location.topLeftCorner.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    let answer = 1; // 1=A, 2=B, 3=C, 4=D
    if (angle > -45 && angle <= 45) answer = 1; // A (Upright)
    else if (angle > -135 && angle <= -45) answer = 2; // B (Rotated Left, B is Up)
    else if (angle > 45 && angle <= 135) answer = 4; // D (Rotated Right, D is Up)
    else answer = 3; // C (Upside Down)

    // Only update if answer changed
    const currentAnsInFirebase = roomData.players[teamId].currentAnswer;
    if (currentAnsInFirebase !== answer) {
      await set(ref(db, `rooms/${pin}/players/${teamId}/currentAnswer`), answer);
      setScannedTeams(prev => ({ ...prev, [teamId]: answer }));
    }
  };

  useEffect(() => {
    return () => stopScan(); // Cleanup
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4">
      {!isScanning ? (
        <form onSubmit={startScan} className="w-full max-w-sm bg-slate-800 p-8 rounded-3xl mt-12 text-center border border-slate-700 shadow-xl">
          <Camera className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-white mb-6">Máy Quét Đáp Án</h1>
          
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
        <div className="w-full max-w-md flex flex-col h-[90vh]">
          <div className="flex justify-between items-center bg-slate-800 p-4 rounded-t-2xl border border-slate-700">
            <div>
              <div className="text-sm text-gray-400">Đang quét phòng</div>
              <div className="text-2xl font-black text-white">{pin}</div>
            </div>
            <button onClick={stopScan} className="bg-red-600 px-4 py-2 rounded-lg font-bold text-white shadow-lg">
              Đóng
            </button>
          </div>

          <div className="relative flex-1 bg-black overflow-hidden border-x border-slate-700">
             <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
             <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-10" />
             
             {/* Target overlay */}
             <div className="absolute inset-0 border-[10px] border-black/30 pointer-events-none z-20" />
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-dashed border-white/50 rounded-3xl pointer-events-none z-20" />
             
             {roomData?.status !== 'QUESTION' && (
               <div className="absolute inset-0 bg-black/80 z-30 flex flex-col items-center justify-center p-8 text-center">
                 <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
                 <h2 className="text-2xl font-bold text-white mb-2">Đang chờ câu hỏi...</h2>
                 <p className="text-gray-400">Vui lòng đợi Host bắt đầu câu hỏi trắc nghiệm mới.</p>
               </div>
             )}
          </div>

          <div className="bg-slate-800 p-4 rounded-b-2xl border border-slate-700 max-h-48 overflow-y-auto">
            <h3 className="text-emerald-400 font-bold mb-2">Đã nhận diện: {Object.keys(scannedTeams).length} nhóm</h3>
            <div className="flex flex-wrap gap-2">
               {Object.entries(scannedTeams).map(([teamId, ans]) => (
                 <div key={teamId} className="bg-slate-700 px-3 py-1 rounded-full flex items-center gap-2 border border-slate-600">
                   <span className="text-white font-bold">{roomData?.players?.[teamId]?.name || teamId}</span>
                   <span className="text-emerald-400 font-black px-2 bg-slate-800 rounded">
                     {['A', 'B', 'C', 'D'][ans - 1]}
                   </span>
                 </div>
               ))}
               {Object.keys(scannedTeams).length === 0 && (
                 <div className="text-gray-500 italic text-sm">Chưa có kết quả... Hướng camera vào tờ giấy QR.</div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
