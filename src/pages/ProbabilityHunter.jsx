import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minimize2, Maximize, Trophy, Clock, Flame, Upload, Download } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import * as XLSX from 'xlsx';
import { probabilityQuestions } from '../data/probability_questions';

const MathText = ({ text }) => {
  const renderMath = (str) => {
    const parts = str.split('$');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        try {
          return <span key={index} dangerouslySetInnerHTML={{ __html: katex.renderToString(part, { throwOnError: false }) }} />;
        } catch (e) {
          return <span key={index}>{part}</span>;
        }
      }
      return <span key={index}>{part}</span>;
    });
  };
  return <>{renderMath(text)}</>;
};

const BlueBird = ({ size = 60, direction = 'right' }) => (
  <div style={{ transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)', width: size, height: size * 0.8 }} className="relative">
    {/* Body */}
    <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-[#0ea5e9] rounded-full"></div>
    {/* Eye */}
    <div className="absolute top-[30%] right-[35%] w-[15%] h-[15%] bg-white rounded-full">
      <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-black rounded-full"></div>
    </div>
    {/* Beak */}
    <div className="absolute top-[40%] right-[10%] w-[15%] h-[15%] bg-yellow-400" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}></div>
    {/* Tail */}
    <div className="absolute top-[40%] left-[10%] w-[20%] h-[20%] bg-[#0284c7]" style={{ clipPath: 'polygon(100% 50%, 0 0, 0 100%)' }}></div>
    {/* Wing */}
    <div className="absolute top-[50%] left-[30%] w-[30%] h-[20%] bg-[#38bdf8] rounded-full shadow-sm"></div>
  </div>
);

const ProbabilityHunter = () => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [gameMode, setGameMode] = useState(null); // null = not started, 0 = Vượt ải, 1,2,3 = Level
  const [customQuestions, setCustomQuestions] = useState(null);
  
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [birds, setBirds] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Filter questions based on mode
  let baseQuestions = customQuestions || probabilityQuestions;
  const activeQuestions = gameMode === 0 
    ? baseQuestions 
    : baseQuestions.filter(q => q.level === gameMode || !q.level); // fallback to all if no level in custom

  const question = activeQuestions[currentQuestionIndex] || activeQuestions[0];

  useEffect(() => {
    if (gameMode !== null && !gameOver) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameMode, gameOver]);

  // Generate birds when question changes
  useEffect(() => {
    if (gameMode !== null && question && !gameOver) {
      const newBirds = question.options.map((opt, index) => {
        const direction = Math.random() > 0.5 ? 'right' : 'left';
        return {
          id: `${currentQuestionIndex}-${index}-${Date.now()}`,
          optionIndex: index,
          text: opt,
          top: Math.floor(Math.random() * 40) + 15, // 15% to 55% height
          duration: Math.floor(Math.random() * 6) + 8, // 8s to 14s
          direction,
          delay: Math.random() * 2 // 0s to 2s delay
        };
      });
      setBirds(newBirds);
    }
  }, [currentQuestionIndex, gameMode, question, gameOver]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(e => console.error(e));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };

  const handleStart = (mode) => {
    if (!playerName.trim()) {
      alert("Vui lòng nhập tên!");
      return;
    }
    if (customQuestions && customQuestions.length === 0) {
      alert("File Excel tải lên chưa có câu hỏi hợp lệ nào!");
      return;
    }
    setGameMode(mode);
    setScore(0);
    setCombo(0);
    setTimeLeft(60);
    setCurrentQuestionIndex(0);
    setGameOver(false);
  };

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleShootBird = (birdIndex, optionIndex) => {
    if (gameOver) return;

    if (optionIndex === question.answer) {
      // Đúng
      const points = 10 + (combo * 2);
      setScore(prev => prev + points);
      setCombo(prev => prev + 1);
      if (gameMode === 0) setTimeLeft(prev => prev + 5);
      
      // Xoá con chim sai cho đẹp mắt trước khi nhảy
      setBirds(prev => prev.filter((_, i) => i === birdIndex));

      setTimeout(() => {
        setCurrentQuestionIndex(prev => (prev + 1) % activeQuestions.length);
      }, 300);
    } else {
      // Sai
      setCombo(0);
      if (gameMode === 0) setTimeLeft(prev => Math.max(0, prev - 5)); 
      
      setBirds(prev => prev.filter((_, i) => i !== birdIndex));
    }
  };

  const downloadSampleExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Câu hỏi", "Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D", "STT Đáp án đúng (1,2,3,4)", "Level (1,2,3)"],
      ["Gieo một con xúc xắc. Xác suất để xuất hiện mặt lẻ là:", "1/2", "1/3", "1/6", "1/4", 1, 1],
      ["Có 3 viên bi đỏ, 4 viên bi xanh. Bốc ngẫu nhiên 2 viên. Xác suất để 2 viên cùng màu là:", "3/7", "2/7", "1/7", "4/7", 1, 2],
      ["Từ các chữ số 1,2,3 lập số có 2 chữ số khác nhau. XS để số đó lẻ là:", "2/3", "1/3", "1/2", "1/4", 1, 3]
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Câu Hỏi");
    XLSX.writeFile(wb, "mau_cau_hoi_tho_san.xlsx");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        let parsedQuestions = [];
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length < 6) continue;
          if (String(row[0]).toLowerCase().includes('câu hỏi')) continue;
          
          parsedQuestions.push({
            question: String(row[0]),
            options: [String(row[1]), String(row[2]), String(row[3]), String(row[4])],
            answer: parseInt(row[5], 10) - 1,
            level: row[6] ? parseInt(row[6], 10) : 1
          });
        }
        
        if (parsedQuestions.length > 0) {
          setCustomQuestions(parsedQuestions);
          alert('Đã tải thành công ' + parsedQuestions.length + ' câu hỏi từ Excel!');
        } else {
          alert('Không tìm thấy câu hỏi hợp lệ trong file!');
        }
      } catch (err) {
        alert('Lỗi khi đọc file Excel! Hãy đảm bảo file đúng định dạng.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  if (gameMode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4 relative z-50 font-sans">
        <div className="max-w-2xl w-full flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-black text-yellow-400 tracking-wider mb-2" style={{ textShadow: '4px 4px 0 #b45309' }}>
            THỢ SĂN XÁC SUẤT
          </h1>
          <p className="text-white text-lg font-bold tracking-widest mb-10 font-mono">
            VIBE CODER: HUNG YEN MATHS (Toán 10 - KNTT)
          </p>

          <div className="bg-white rounded-[2rem] p-8 w-full max-w-xl text-center shadow-2xl">
            
            <div className="mb-6 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-4">
              <p className="text-sm text-blue-800 font-bold mb-3">Tải lên bộ câu hỏi Excel (Tùy chọn)</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                <button 
                  onClick={downloadSampleExcel}
                  className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg border-2 border-blue-200 hover:bg-blue-100 transition-colors font-bold text-sm"
                >
                  <Download className="w-4 h-4" /> Tải file mẫu
                </button>
                <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-bold text-sm">
                  <Upload className="w-4 h-4" /> 
                  {customQuestions ? `Đã tải ${customQuestions.length} câu` : 'Chọn file Excel'}
                  <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
              placeholder="Nhập tên của bạn..."
              className="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-xl px-6 py-4 focus:outline-none focus:border-blue-500 text-center text-xl font-bold uppercase mb-6 placeholder:text-gray-400"
              required
            />
            
            <p className="text-gray-600 text-sm mb-6 font-medium px-4">
              <span className="font-bold text-gray-800">Cách chơi:</span> Bắn chim mang đáp án đúng.<br/>
              <span className="font-bold text-gray-800">Chế độ:</span> Chọn Vượt ải để leo rank (cộng giờ) hoặc luyện tập riêng từng Level.
            </p>

            <button
              onClick={() => handleStart(0)}
              className="w-full bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-4 px-6 rounded-2xl transition-transform hover:scale-105 active:scale-95 text-xl shadow-[0_6px_0_#7e22ce] mb-6 flex items-center justify-center gap-2"
            >
              🏆 CHẾ ĐỘ VƯỢT ẢI (Đề xuất)
            </button>

            <div className="grid grid-cols-3 gap-4">
              <button onClick={() => handleStart(1)} className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-3 rounded-xl shadow-[0_4px_0_#15803d] active:translate-y-1 active:shadow-none transition-all">
                Chỉ Level 1
              </button>
              <button onClick={() => handleStart(2)} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-3 rounded-xl shadow-[0_4px_0_#1d4ed8] active:translate-y-1 active:shadow-none transition-all">
                Chỉ Level 2
              </button>
              <button onClick={() => handleStart(3)} className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold py-3 rounded-xl shadow-[0_4px_0_#b91c1c] active:translate-y-1 active:shadow-none transition-all">
                Chỉ Level 3
              </button>
            </div>
          </div>
          <button onClick={() => navigate('/games')} className="mt-8 text-gray-500 hover:text-white">Quay lại Kho trò chơi</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#A5DDF0] flex flex-col font-sans overflow-hidden cursor-none select-none"
      onMouseMove={handleMouseMove}
    >
      {/* Custom Crosshair */}
      <div 
        className="fixed pointer-events-none z-[110] w-12 h-12 border-[3px] border-yellow-400 rounded-full flex items-center justify-center drop-shadow-md"
        style={{ left: mousePos.x - 24, top: mousePos.y - 24 }}
      >
        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
      </div>

      {/* Scenery Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg className="absolute bottom-0 w-full h-[60%]" preserveAspectRatio="none" viewBox="0 0 100 100">
          {/* Left Mountain */}
          <polygon points="10,100 30,30 50,100" fill="#909F79" />
          {/* Right Mountain */}
          <polygon points="50,100 70,10 90,100" fill="#75855E" />
          
          {/* Back Grass Layer */}
          <path d="M0,70 Q5,60 10,70 T20,70 T30,70 T40,70 T50,70 T60,70 T70,70 T80,70 T90,70 T100,70 L100,100 L0,100 Z" fill="#209827" />
          
          {/* Front Grass Layer */}
          <path d="M-5,85 Q0,75 5,85 T15,85 T25,85 T35,85 T45,85 T55,85 T65,85 T75,85 T85,85 T95,85 T105,85 L105,100 L-5,100 Z" fill="#2DD934" />
          
          {/* Small Grass Details (Black lines) */}
          <path d="M2,90 v10 M4,92 v8 M6,95 v5 M8,90 v10 M10,93 v7 M12,90 v10 M14,92 v8 M16,89 v11 M18,94 v6 M20,91 v9 M22,88 v12 M24,92 v8 M26,90 v10 M28,89 v11 M30,94 v6 M32,90 v10 M34,92 v8 M36,95 v5 M38,90 v10 M40,93 v7 M42,90 v10 M44,92 v8 M46,89 v11 M48,94 v6 M50,91 v9 M52,88 v12 M54,92 v8 M56,90 v10 M58,89 v11 M60,94 v6 M62,90 v10 M64,92 v8 M66,95 v5 M68,90 v10 M70,93 v7 M72,90 v10 M74,92 v8 M76,89 v11 M78,94 v6 M80,91 v9 M82,88 v12 M84,92 v8 M86,90 v10 M88,89 v11 M90,94 v6 M92,90 v10 M94,92 v8 M96,95 v5 M98,90 v10 M100,93 v7" stroke="#137319" strokeWidth="0.2" fill="none" />
        </svg>
      </div>

      {/* Header Bar */}
      <div className="flex items-center justify-between p-2 bg-[#111827] text-white relative z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/games')} className="flex items-center gap-1 bg-red-900/50 text-red-200 px-3 py-1.5 rounded hover:bg-red-900/80 border border-red-700 cursor-pointer">
            <X className="w-4 h-4" /> Đóng
          </button>
          <div className="font-bold text-sm hidden md:block">Toán 10.Game bắn chim Xác Suất</div>
        </div>
        <button onClick={toggleFullScreen} className="flex items-center gap-1 bg-black/40 text-gray-300 hover:text-white px-3 py-1.5 rounded border border-white/20 cursor-pointer">
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize className="w-4 h-4" />} Thu nhỏ
        </button>
      </div>

      {/* Main Game UI */}
      <div className="flex-1 relative z-10 p-4">
        
        {/* HUD Top Left */}
        <div className="absolute top-4 left-4 flex gap-4 items-center">
          <div className="bg-white rounded-[2rem] px-6 py-2 shadow-lg border-2 border-blue-200 text-center min-w-[120px]">
            <div className="text-xs text-gray-500 font-bold uppercase">{playerName}</div>
            <div className="text-blue-600 font-black text-2xl">ĐIỂM: {score}</div>
            <div className="text-orange-500 font-bold text-sm flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 fill-current" /> COMBO x{combo}
            </div>
          </div>
          
          <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center border-4 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
            <Clock className="w-6 h-6 text-gray-600 mb-1" />
            <span className="text-red-500 font-black text-xl">{timeLeft}s</span>
          </div>
        </div>

        {/* End Game Button Top Right */}
        <button onClick={() => setGameOver(true)} className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-md cursor-pointer border-2 border-white z-50">
          KẾT THÚC SỚM
        </button>

        {/* Question Box (Top Center) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-4xl text-center pointer-events-none z-40">
          <div className="inline-block bg-[#3b82f6] text-white text-[11px] font-bold px-6 py-1.5 rounded-t-lg uppercase tracking-wider relative top-1">
            {gameMode === 0 ? "TOÁN 10 (TỰ CHỌN) - LEVEL HỖN HỢP" : `TOÁN 10 (TỰ CHỌN) - LEVEL ${gameMode}`}
          </div>
          <div className="bg-white/95 backdrop-blur-sm border-4 border-yellow-400 rounded-[2rem] px-12 py-8 shadow-2xl flex flex-col items-center justify-center pointer-events-auto">
            <h2 className="text-[#92400e] font-extrabold text-2xl md:text-3xl leading-relaxed">
              {question ? <MathText text={question.question} /> : "Đang tải câu hỏi..."}
            </h2>
          </div>
        </div>

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 cursor-default">
            <div className="bg-white rounded-[2rem] p-12 text-center max-w-lg border-4 border-yellow-400">
              <h2 className="text-5xl font-black text-red-500 mb-2">HẾT GIỜ!</h2>
              <p className="text-xl text-gray-600 font-bold mb-8">Trò chơi kết thúc</p>
              
              <div className="bg-blue-50 rounded-xl p-6 mb-8">
                <div className="text-gray-500 uppercase font-bold text-sm mb-1">Điểm số cuối cùng của bạn</div>
                <div className="text-6xl font-black text-blue-600">{score}</div>
              </div>

              <div className="flex gap-4 justify-center">
                <button onClick={() => window.location.reload()} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl cursor-pointer">
                  Chơi Lại
                </button>
                <button onClick={() => navigate('/games')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl cursor-pointer">
                  Về Kho Trò Chơi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Birds Layer */}
        {!gameOver && birds.map((bird, idx) => (
          <div
            key={bird.id}
            onClick={() => handleShootBird(idx, bird.optionIndex)}
            className="bird-container group"
            style={{
              top: `${bird.top}%`,
              animationName: bird.direction === 'right' ? 'fly-right' : 'fly-left',
              animationDuration: `${bird.duration}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDelay: `${bird.delay}s`
            }}
          >
            <div className="flex flex-col items-center">
              <BlueBird direction={bird.direction} size={80} />
              <div className="mt-2 bg-[#f97316] text-white px-4 py-1.5 rounded-lg font-extrabold border-[3px] border-black shadow-sm text-2xl group-hover:scale-110 transition-transform cursor-crosshair">
                <MathText text={bird.text} />
              </div>
            </div>
          </div>
        ))}
        
      </div>
    </div>
  );
};

export default ProbabilityHunter;
