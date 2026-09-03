import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minimize2, Maximize, Phone, Users, HelpCircle, Trophy, Volume2, VolumeX, Upload } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import * as XLSX from 'xlsx';
import { questions as defaultQuestions, prizeLadder } from '../data/questions';

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

const MillionaireGame = () => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customQuestions, setCustomQuestions] = useState(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [status, setStatus] = useState('playing'); 
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [usedLifelines, setUsedLifelines] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const bgMusicRef = useRef(null);
  const suspenseSoundRef = useRef(null);
  const correctSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);

  useEffect(() => {
    if (bgMusicRef.current) {
      if (isLoggedIn && status === 'playing' && !isMuted) {
        bgMusicRef.current.volume = 0.3;
        bgMusicRef.current.play().catch(e => console.log('Audio autoplay blocked', e));
      } else {
        bgMusicRef.current.pause();
      }
    }
  }, [isLoggedIn, status, isMuted]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
        console.error(`Lỗi toàn màn hình: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };

  const activeQuestions = customQuestions || defaultQuestions;
  const question = activeQuestions[currentQuestionIndex];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        let parsedQuestions = [];
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length < 6) continue;
          if (String(row[0]).toLowerCase().includes('câu hỏi') || String(row[1]).toLowerCase().includes('đáp án')) continue;
          
          parsedQuestions.push({
            question: String(row[0]),
            options: [String(row[1]), String(row[2]), String(row[3]), String(row[4])],
            answer: parseInt(row[5], 10) - 1
          });
        }
        
        if (parsedQuestions.length < 15) {
          alert('File Excel cần ít nhất 15 câu hỏi. Hiện chỉ tìm thấy ' + parsedQuestions.length + ' câu.');
        } else {
          setCustomQuestions(parsedQuestions.slice(0, 15));
          alert('Đã tải thành công ' + parsedQuestions.slice(0, 15).length + ' câu hỏi từ Excel!');
        }
      } catch (err) {
        alert('Lỗi khi đọc file Excel! Hãy đảm bảo file đúng định dạng.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (playerName.trim()) setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] px-4 relative z-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0b0f19] to-[#0b0f19]"></div>
        <div className="glass-card p-8 w-full max-w-md relative z-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ai Là Triệu Phú</h2>
          
          <div className="mb-6 p-4 border-2 border-dashed border-blue-500/30 rounded-xl bg-blue-500/5">
            <p className="text-sm text-blue-200 mb-3">Tuỳ chọn: Tải lên bộ câu hỏi Excel (15 câu)</p>
            <label className="flex items-center justify-center gap-2 cursor-pointer bg-blue-900/40 hover:bg-blue-800/40 text-blue-300 py-2 px-4 rounded-lg border border-blue-500/50 transition">
              <Upload className="w-4 h-4" />
              <span className="text-sm">{customQuestions ? 'Đã tải bộ câu hỏi mới' : 'Chọn file Excel (.xlsx)'}</span>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <p className="text-gray-400 mb-4">Vui lòng nhập tên để bắt đầu trò chơi</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
              placeholder="Ví dụ: LINH"
              className="w-full bg-black/30 border border-blue-500/30 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-center text-xl font-bold uppercase"
              required
            />
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-all">
              Bắt đầu chơi
            </button>
          </form>
          <button onClick={() => navigate('/games')} className="mt-4 text-gray-500 hover:text-white text-sm">Quay lại Kho trò chơi</button>
        </div>
      </div>
    );
  }

  const handleOptionClick = (index) => {
    if (status !== 'playing' || hiddenOptions.includes(index)) return;
    
    setSelectedOption(index);
    setStatus('checking');
    
    if (!isMuted && suspenseSoundRef.current) {
      suspenseSoundRef.current.currentTime = 0;
      suspenseSoundRef.current.play().catch(e => {});
    }
    
    setTimeout(() => {
      if (suspenseSoundRef.current) suspenseSoundRef.current.pause();

      if (index === question.answer) {
        setStatus('correct');
        if (!isMuted && correctSoundRef.current) {
          correctSoundRef.current.currentTime = 0;
          correctSoundRef.current.play().catch(e => {});
        }

        setTimeout(() => {
          if (currentQuestionIndex === activeQuestions.length - 1) {
            setStatus('won');
          } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setStatus('playing');
            setHiddenOptions([]);
          }
        }, 3000);
      } else {
        setStatus('wrong');
        if (!isMuted && wrongSoundRef.current) {
          wrongSoundRef.current.currentTime = 0;
          wrongSoundRef.current.play().catch(e => {});
        }
        
        setTimeout(() => {
          setStatus('lost');
        }, 3000);
      }
    }, 3500);
  };

  const use5050 = () => {
    if (usedLifelines.includes('5050') || status !== 'playing') return;
    setUsedLifelines([...usedLifelines, '5050']);
    let wrongOptions = [0, 1, 2, 3].filter(i => i !== question.answer);
    wrongOptions.sort(() => Math.random() - 0.5);
    setHiddenOptions([wrongOptions[0], wrongOptions[1]]);
  };

  const usePhone = () => {
    if (usedLifelines.includes('phone') || status !== 'playing') return;
    setUsedLifelines([...usedLifelines, 'phone']);
    alert("Người thân: 'Chú nghĩ đáp án đúng là " + ["A", "B", "C", "D"][question.answer] + " đấy!'");
  };

  const useAudience = () => {
    if (usedLifelines.includes('audience') || status !== 'playing') return;
    setUsedLifelines([...usedLifelines, 'audience']);
    alert("Khán giả: Đa số chọn đáp án " + ["A", "B", "C", "D"][question.answer]);
  };

  let questionBoxClass = "hex-border mb-6 md:mb-8 shadow-[0_0_50px_rgba(59,130,246,0.6)]";
  if (status === 'checking') questionBoxClass += " animate-tense";
  if (status === 'correct') questionBoxClass += " animate-correct-flash";
  if (status === 'wrong') questionBoxClass += " animate-wrong-flash animate-shake";

  return (
    <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col font-sans overflow-hidden">
      
      {/* Background Gradient & Spotlights */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-700/80 via-blue-900 to-[#020617] pointer-events-none z-0"></div>
      
      {/* Left Spotlight */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[150%] bg-[radial-gradient(ellipse_at_top_center,rgba(96,165,250,0.15)_0%,transparent_70%)] origin-top animate-[swayLeft_8s_ease-in-out_infinite_alternate] pointer-events-none z-0"></div>
      
      {/* Right Spotlight */}
      <div className="absolute top-[-10%] right-[-20%] w-[60%] h-[150%] bg-[radial-gradient(ellipse_at_top_center,rgba(96,165,250,0.15)_0%,transparent_70%)] origin-top animate-[swayRight_10s_ease-in-out_infinite_alternate] pointer-events-none z-0"></div>
      
      <audio ref={bgMusicRef} src="/sounds/bg.mp3" loop />
      <audio ref={suspenseSoundRef} src="/sounds/suspense.mp3" />
      <audio ref={correctSoundRef} src="/sounds/correct.mp3" />
      <audio ref={wrongSoundRef} src="/sounds/wrong.mp3" />

      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 relative z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            navigate('/games');
          }} className="flex items-center gap-1 bg-red-900/50 text-red-200 px-3 py-1.5 rounded hover:bg-red-900/80 transition border border-red-700">
            <X className="w-4 h-4" /> Đóng
          </button>
          <div className="text-white font-bold text-lg hidden md:block drop-shadow-md">
            Toán 10. Game Ai Là Triệu Phú - Ôn tập 3 chủ đề...
          </div>
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 top-4 flex flex-col items-center gap-2">
          <div className="flex gap-4 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.6)]">
            <button onClick={use5050} className={`font-bold text-yellow-400 drop-shadow-md ${usedLifelines.includes('5050') ? 'opacity-30' : 'hover:scale-110'}`}>50:50</button>
            <div className="w-px h-6 bg-white/30"></div>
            <button onClick={usePhone} className={`text-blue-400 drop-shadow-md ${usedLifelines.includes('phone') ? 'opacity-30' : 'hover:scale-110'}`}><Phone className="w-5 h-5 fill-current" /></button>
            <div className="w-px h-6 bg-white/30"></div>
            <button onClick={useAudience} className={`text-green-400 drop-shadow-md ${usedLifelines.includes('audience') ? 'opacity-30' : 'hover:scale-110'}`}><Users className="w-5 h-5 fill-current" /></button>
          </div>
          <div className="bg-black/70 px-6 py-1 rounded-full border border-yellow-600/60 text-yellow-500 font-bold flex items-center gap-2 shadow-[0_0_10px_rgba(202,138,4,0.4)]">
            {playerName} <Trophy className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center hidden sm:block">
            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Câu hỏi số</div>
            <div className="text-yellow-400 font-extrabold text-xl drop-shadow-md">{currentQuestionIndex + 1}/15</div>
          </div>
          <button onClick={() => setIsMuted(!isMuted)} className={`bg-black/50 p-2 rounded-full border border-white/20 transition ${isMuted ? 'text-red-400' : 'text-gray-200 hover:text-white hover:bg-black/70'}`}>
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button 
            onClick={toggleFullScreen}
            className="flex items-center gap-1 bg-black/50 text-gray-200 hover:text-white hover:bg-black/70 transition px-3 py-1.5 rounded border border-white/20"
          >
            {isFullscreen ? (
              <><Minimize2 className="w-4 h-4" /> <span className="hidden sm:inline">Thu nhỏ</span></>
            ) : (
              <><Maximize className="w-4 h-4" /> <span className="hidden sm:inline">Toàn màn hình</span></>
            )}
          </button>
        </div>
      </div>

      <div className="absolute top-20 left-8 w-14 h-14 rounded-full border-[3px] border-blue-400 flex items-center justify-center bg-black/60 text-blue-400 font-extrabold text-2xl shadow-[0_0_20px_rgba(96,165,250,0.6)] z-20 hidden sm:flex backdrop-blur-sm">
        {playerName.substring(0, 2)}
      </div>

      <div className="flex-1 flex w-full relative z-20">
        <div className="flex-1 flex flex-col items-center justify-start pt-6 p-4 lg:p-8">
          
          {status === 'won' ? (
             <div className="text-center glass-card p-16 mt-20 animate-tense border-yellow-500/50">
               <h2 className="text-6xl text-yellow-400 font-extrabold mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]">CHÚC MỪNG!</h2>
               <p className="text-3xl mt-4 text-white font-bold">Bạn đã giành được {prizeLadder[14]} VNĐ</p>
               <button onClick={() => window.location.reload()} className="mt-12 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-2xl font-bold shadow-lg">Chơi lại</button>
             </div>
          ) : status === 'lost' ? (
             <div className="text-center glass-card p-16 mt-20 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
               <h2 className="text-5xl text-red-500 font-extrabold mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">RẤT TIẾC!</h2>
               <p className="text-3xl text-white font-bold">Bạn đã dừng chân ở câu số {currentQuestionIndex + 1}.</p>
               <button onClick={() => window.location.reload()} className="mt-12 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-2xl font-bold shadow-lg">Chơi lại</button>
             </div>
          ) : (
            <div className="w-full max-w-[98%] lg:max-w-full lg:px-4 flex flex-col items-center justify-start mt-2">
              
              {/* Question Box */}
              <div className={`w-full relative transition-all duration-500 ${questionBoxClass}`}>
                <div className={`hex-shape min-h-[180px] md:min-h-[220px] h-auto flex items-center justify-center p-8 md:p-14 transition-colors duration-500 ${status === 'correct' ? 'bg-green-600/90' : status === 'wrong' ? 'bg-red-600/90' : 'bg-gradient-to-b from-[#0a1128] to-[#020818]'}`}>
                  <h3 className="text-4xl md:text-5xl text-white font-bold text-center leading-[1.4] drop-shadow-lg break-words">
                    <MathText text={question.question} />
                  </h3>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 w-full mt-4">
                {question.options.map((opt, idx) => {
                  let bgColor = "from-[#0a1128] to-[#020818]";
                  let isSelected = selectedOption === idx;
                  let isCorrectAnswer = idx === question.answer;
                  
                  if (isSelected && status === 'checking') {
                    bgColor = "from-orange-500 to-yellow-600";
                  }
                  
                  if ((status === 'correct' || status === 'wrong') && isCorrectAnswer) {
                    bgColor = "from-green-500 to-green-700";
                  }
                  
                  if (status === 'wrong' && isSelected && !isCorrectAnswer) {
                    bgColor = "from-red-600 to-red-800";
                  }

                  let optionClass = "relative w-full hex-border transition-all duration-300 cursor-pointer ";
                  if (hiddenOptions.includes(idx)) optionClass += "opacity-0 pointer-events-none ";
                  else if (status === 'playing') optionClass += "hover:shadow-[0_0_35px_rgba(59,130,246,0.7)] hover:scale-[1.02] ";
                  
                  if (isSelected && status === 'checking') optionClass += "animate-tense ";
                  if (isCorrectAnswer && (status === 'correct' || status === 'wrong')) optionClass += "shadow-[0_0_50px_rgba(34,197,94,0.6)] ";
                  if (isSelected && status === 'wrong' && !isCorrectAnswer) optionClass += "animate-wrong-flash animate-shake ";

                  return (
                    <div 
                      key={idx} 
                      className={optionClass}
                      onClick={() => handleOptionClick(idx)}
                    >
                      <div className={`hex-shape bg-gradient-to-b ${bgColor} min-h-[100px] md:min-h-[140px] h-auto py-8 flex items-center px-10 md:px-14 transition-colors duration-500`}>
                        <span className="text-yellow-400 font-extrabold text-4xl md:text-5xl mr-6 drop-shadow-md">
                          {["A", "B", "C", "D"][idx]}:
                        </span>
                        <span className="text-white text-4xl md:text-5xl font-bold flex-1 leading-[1.4] drop-shadow-md">
                          <MathText text={opt} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:flex w-[24rem] bg-[#050505]/80 backdrop-blur-xl border-l border-white/10 flex-col py-6 px-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-y-auto shrink-0 z-20">
          <div className="text-center text-gray-400 text-sm tracking-[0.2em] font-extrabold mb-6 border-b border-gray-800 pb-4">
            GIẢI THƯỞNG
          </div>
          <div className="flex-1 flex flex-col-reverse justify-end gap-2.5 font-bold text-2xl">
            {prizeLadder.map((prize, idx) => {
              const isCurrent = currentQuestionIndex === idx;
              const isMilestone = idx === 4 || idx === 9 || idx === 14;
              
              let rowStyle = "text-gray-500";
              if (isCurrent) rowStyle = "bg-gradient-to-r from-orange-500 to-yellow-500 text-black rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.6)]";
              else if (currentQuestionIndex > idx) rowStyle = "text-yellow-600/40";
              else if (isMilestone) rowStyle = "text-white";

              return (
                <div key={idx} className={`flex justify-between items-center px-5 py-3 transition-all duration-300 ${rowStyle}`}>
                  <span>Câu {idx + 1}</span>
                  <span className="tracking-wide">{prize}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MillionaireGame;
