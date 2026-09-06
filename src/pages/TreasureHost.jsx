import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Upload, Play, Users, Trophy, ChevronRight, CheckCircle2, XCircle, Crown, Download } from 'lucide-react';
import { db } from '../firebase';
import { ref, set, update, onValue, remove, get } from 'firebase/database';
import MathText from '../components/MathText';
import QuestionGuidePanel from '../components/QuestionGuidePanel';
import TreasureBoard, { getTeamColor } from '../components/TreasureBoard';
import { BOARD_SCENARIOS, randomScenario } from '../data/boardScenarios';

// Định nghĩa 5 theme giao diện
const THEMES = [
  {
    id: 'cosmos',
    name: '🌌 Vũ Trụ',
    bgStyle: { background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e1b4b 100%)', backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(6,182,212,0.1) 0%, transparent 50%)' },
    questionBg: 'bg-slate-800/90 text-white',
    timerColor: 'text-cyan-400',
    preview: 'from-indigo-900 via-slate-900 to-violet-900'
  },
  {
    id: 'forest',
    name: '🌿 Rừng Xanh',
    bgStyle: { background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)', backgroundImage: 'radial-gradient(circle at 50% 100%, rgba(16,185,129,0.2) 0%, transparent 60%)' },
    questionBg: 'bg-emerald-900/80 text-white border border-emerald-700',
    timerColor: 'text-lime-400',
    preview: 'from-emerald-900 via-teal-900 to-green-900'
  },
  {
    id: 'fire',
    name: '🔥 Lửa Thiêng',
    bgStyle: { background: 'linear-gradient(135deg, #1c0a00 0%, #431407 50%, #7c2d12 100%)', backgroundImage: 'radial-gradient(circle at 50% 120%, rgba(251,146,60,0.3) 0%, transparent 60%)' },
    questionBg: 'bg-orange-900/70 text-white border border-orange-700',
    timerColor: 'text-orange-400',
    preview: 'from-red-900 via-orange-900 to-yellow-900'
  },
  {
    id: 'ocean',
    name: '🌊 Đại Dương',
    bgStyle: { background: 'linear-gradient(180deg, #0c1445 0%, #0a2463 50%, #023e8a 100%)', backgroundImage: 'radial-gradient(ellipse at 50% 150%, rgba(56,189,248,0.2) 0%, transparent 60%)' },
    questionBg: 'bg-blue-900/80 text-white border border-blue-700',
    timerColor: 'text-sky-400',
    preview: 'from-blue-900 via-sky-900 to-cyan-900'
  },
  {
    id: 'candy',
    name: '🍭 Kẹo Ngọt',
    bgStyle: { background: 'linear-gradient(135deg, #1a0a1e 0%, #2d1b69 50%, #1e1b4b 100%)', backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(236,72,153,0.2) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(167,139,250,0.2) 0%, transparent 50%)' },
    questionBg: 'bg-pink-900/70 text-white border border-pink-700',
    timerColor: 'text-fuchsia-400',
    preview: 'from-pink-900 via-fuchsia-900 to-purple-900'
  },
];

const STAR_PICK_SECONDS = 5;
const DICE_ROLL_SECONDS = 6;

// Nhớ mã phòng để giáo viên nối lại được nếu lỡ tải lại trang hoặc rớt mạng
const HOST_ROOM_KEY = 'treasureHostRoom';

const TreasureHost = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [fileName, setFileName] = useState('');
  const [localGameState, setLocalGameState] = useState('SETUP');
  const [roomCode, setRoomCode] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);
  const [revealTimeLimit, setRevealTimeLimit] = useState(30);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [gameTitle, setGameTitle] = useState('TRUY TÌM KHO BÁU');
  const [roomData, setRoomData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [playMode, setPlayMode] = useState('INDIVIDUAL');
  const [teamCount, setTeamCount] = useState(4);
  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem('treasureBgUrl') || '');
  const [bgPresets, setBgPresets] = useState(() => JSON.parse(localStorage.getItem('treasureBgPresets') || '[]'));
  const [presetName, setPresetName] = useState('');
  const [showQuestionOnDevice, setShowQuestionOnDevice] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedStatQ, setSelectedStatQ] = useState(null);
  const [enableHighStakes, setEnableHighStakes] = useState(false);
  // Bản đồ kho báu (chỉ dùng cho chế độ nhóm)
  const [boardSize, setBoardSize] = useState(6);
  const [boardBgUrl, setBoardBgUrl] = useState(() => localStorage.getItem('treasureBoardBg') || '');
  const [specialCells, setSpecialCells] = useState({});
  const [newCellNo, setNewCellNo] = useState('');
  const [newCellStep, setNewCellStep] = useState('');
  const [activeScenario, setActiveScenario] = useState('');

  // Áp một kịch bản ô đặc biệt dựng sẵn
  const applyScenario = (scenario) => {
    setSpecialCells(scenario.build(boardSize));
    setActiveScenario(scenario.id);
  };

  const applyRandomScenario = () => {
    setSpecialCells(randomScenario(boardSize));
    setActiveScenario('random');
  };

  // Đổi kích thước lưới: dựng lại kịch bản cho vừa bàn mới,
  // nếu đặt tay thì loại các ô đã rơi ra ngoài phạm vi
  useEffect(() => {
    if (activeScenario === 'random') {
      setSpecialCells(randomScenario(boardSize));
      return;
    }
    const sc = BOARD_SCENARIOS.find(s => s.id === activeScenario);
    if (sc) {
      setSpecialCells(sc.build(boardSize));
      return;
    }
    setSpecialCells(prev => {
      const limit = boardSize * boardSize;
      const next = {};
      Object.entries(prev).forEach(([cell, step]) => {
        const c = Number(cell);
        if (c >= 2 && c < limit && c + step >= 1 && c + step < limit) next[c] = step;
      });
      return next;
    });
  }, [boardSize]);

  const currentAudio = useRef(null);

  const playAudio = (url) => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.currentTime = 0;
    }
    if (url) {
      const audio = new Audio(url);
      currentAudio.current = audio;
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  useEffect(() => {
    if (roomCode) {
      const roomRef = ref(db, `treasureRooms/${roomCode}`);
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          if (roomData && roomData.status !== data.status) {
             if (data.status === 'QUESTION') {
               // Cột 9 của Excel cho phép đặt thời gian riêng từng câu
               setTimeLeft(data.questions?.[data.currentQuestionIndex]?.timeLimit || data.settings.timeLimit || 60);
             } else if (data.status === 'REVEAL') {
               setTimeLeft(data.settings.revealTimeLimit || 60);
             } else if (data.status === 'STAR_PICK') {
               setTimeLeft(STAR_PICK_SECONDS);
             } else if (data.status === 'DICE_ROLL') {
               setTimeLeft(DICE_ROLL_SECONDS);
             }
          }
          if (!roomData && data) {
             if (data.status === 'QUESTION') setTimeLeft(data.questions?.[data.currentQuestionIndex]?.timeLimit || data.settings.timeLimit || 60);
             else if (data.status === 'REVEAL') setTimeLeft(data.settings.revealTimeLimit || 60);
             else if (data.status === 'STAR_PICK') setTimeLeft(STAR_PICK_SECONDS);
             else if (data.status === 'DICE_ROLL') setTimeLeft(DICE_ROLL_SECONDS);
          }
          setRoomData(data);
        }
      });
      return () => unsubscribe();
    }
  }, [roomCode, roomData]);

  useEffect(() => {
    let timer;
    if (!roomData?.paused && (roomData?.status === 'QUESTION' || roomData?.status === 'REVEAL' || roomData?.status === 'STAR_PICK' || roomData?.status === 'DICE_ROLL') && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
             clearInterval(timer);
             if (roomData.status === 'QUESTION') {
                revealAnswer();
             } else if (roomData.status === 'REVEAL') {
                afterReveal();
             } else if (roomData.status === 'STAR_PICK') {
                showQuestionAfterStarPick();
             } else if (roomData.status === 'DICE_ROLL') {
                openBoardSummary();
             }
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [roomData?.status, roomData?.paused, timeLeft]);

  // Tạm dừng / chạy lại đồng hồ (dùng khi giáo viên đang quét thẻ QR đáp án)
  const togglePause = async () => {
    if (!roomCode) return;
    await update(ref(db, `treasureRooms/${roomCode}`), { paused: !roomData?.paused });
  };

  // Máy quét bấm "Chốt & Hết giờ" → công bố đáp án ngay
  useEffect(() => {
    if (!roomCode || !roomData?.scanRequestReveal) return;
    if (roomData.status !== 'QUESTION') return;
    update(ref(db, `treasureRooms/${roomCode}`), { scanRequestReveal: false });
    revealAnswer();
  }, [roomData?.scanRequestReveal, roomData?.status, roomCode]);

  // Phòng cũ còn sống thì mời giáo viên nối lại thay vì mất trắng buổi chơi
  const [resumeRoom, setResumeRoom] = useState(null);
  useEffect(() => {
    let code = null;
    try { code = localStorage.getItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (!code) return;
    get(ref(db, `treasureRooms/${code}`)).then(snap => {
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
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      const parsedQuestions = data.slice(1).map(row => {
        if (!row[0]) return null;
        
        const typeIndicator = row[1]?.toString().trim().toUpperCase();
        if (typeIndicator === 'TLN') {
          return {
            type: 'TLN',
            question: row[0] || '',
            correctOption: row[2]?.toString().trim() || '',
            explanation: row[3]?.toString() || '',
            image: row[7] || null,
          timeLimit: parseInt(row[8]) > 0 ? parseInt(row[8]) : null,
          };
        } else {
          return {
            type: 'TRAC_NGHIEM',
            question: row[0] || '',
            optionA: row[1] || '',
            optionB: row[2] || '',
            optionC: row[3] || '',
            optionD: row[4] || '',
            correctOption: parseInt(row[5]) || 1,
            explanation: row[6] || '',
            image: row[7] || null,
          timeLimit: parseInt(row[8]) > 0 ? parseInt(row[8]) : null,
          };
        }
      }).filter(Boolean);

      setQuestions(parsedQuestions);
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws_data = [
      ['Nội dung câu hỏi', 'Đ/A A hoặc TLN', 'Đ/A B hoặc Đáp số', 'Đ/A C hoặc Lời giải', 'Đ/A D', 'Đáp án đúng (1/2/3/4)', 'Lời giải', 'Link ảnh (tùy chọn)', 'Thời gian riêng (giây, tùy chọn)'],
      ['Thủ đô của Việt Nam là gì?', 'Hồ Chí Minh', 'Đà Nẵng', 'Hà Nội', 'Huế', 3, 'Hà Nội là thủ đô của Việt Nam', 'https://example.com/hanoi.jpg', 30],
      ['$2x + 3 = 7$ thì x bằng mấy?', 'TLN', '2', 'Chuyển vế $2x = 4 \\Rightarrow x = 2$', '', '', '', '', 90]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CauHoi");
    XLSX.writeFile(wb, "Mau_Cau_Hoi.xlsx");
  };

  const createRoom = async () => {
    if (questions.length === 0) {
      alert("Vui lòng tải lên file câu hỏi trước!");
      return;
    }
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.log('Fullscreen error:', err);
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    try { localStorage.setItem(HOST_ROOM_KEY, code); } catch { /* không sao */ }
    setLocalGameState('LOBBY');
    
    playAudio('https://files.catbox.moe/eopz4f.mp3');
    
    const TEAM_NAMES = [
      "Hải Tặc Mũ Rơm", "Thuyền Trưởng Râu Đen", "Đoàn Thám Hiểm Vàng", "Kho Báu Đại Dương",
      "Cướp Biển Vùng Caribe", "Bản Đồ Cổ", "La Bàn Thần Kỳ", "Đảo Đầu Lâu",
      "Rương Vàng Bí Ẩn", "Thợ Lặn Ngọc Trai", "Con Tàu Ma", "Kim Cương Xanh",
      "Chìa Khoá Vàng", "Hạm Đội Bão Tố", "Ngọn Hải Đăng", "Mật Mã Kho Báu",
      "Săn Lùng Bảo Vật", "Thuỷ Thủ Dũng Cảm", "Cánh Buồm Đỏ Thắm", "Vịnh Bí Mật",
      "Chiếc Neo Vàng", "Sóng Thần Xanh", "Hang Động Ngọc Bích", "Người Gác Kho Báu",
      "Vương Miện Biển Cả", "Đội Quân Bạch Tuộc", "Cá Mập Trắng", "Ngôi Sao Phương Bắc",
      "Đội Thám Hiểm Sa Mạc", "Chiến Thuyền Hoàng Kim"
    ];

    let teams = {};
    if (playMode === 'TEAM') {
      const shuffledNames = TEAM_NAMES.sort(() => 0.5 - Math.random()).slice(0, teamCount);
      for (let i = 1; i <= teamCount; i++) {
        teams[`team_${i}`] = {
          id: `team_${i}`,
          index: i,
          name: shuffledNames[i - 1]
        };
      }
    }

    await set(ref(db, `treasureRooms/${code}`), {
      status: 'LOBBY', 
      currentQuestionIndex: 0,
      questions: questions,
      players: {},
      teams: teams,
      settings: {
        timeLimit: timeLimit,
        revealTimeLimit: revealTimeLimit,
        gameTitle: gameTitle,
        playMode: playMode,
        teamCount: teamCount,
        bgUrl: bgUrl,
        showQuestionOnDevice: showQuestionOnDevice,
        enableHighStakes: enableHighStakes,
        // Bản đồ kho báu chỉ chạy ở chế độ nhóm
        boardEnabled: playMode === 'TEAM',
        boardSize: boardSize,
        boardBgUrl: boardBgUrl,
        specialCells: specialCells
      }
    });
  };

  // 3 câu cuối là các câu được phép dùng Ngôi Sao May Mắn
  const isStarQuestion = (idx) => {
    if (!roomData?.settings?.enableHighStakes) return false;
    const totalQ = roomData?.questions?.length || 0;
    return totalQ > 0 && idx >= totalQ - 3;
  };

  const startGame = async () => {
    playAudio('https://files.catbox.moe/amew8w.mp3');

    await update(ref(db, `treasureRooms/${roomCode}`), { status: isStarQuestion(0) ? 'STAR_PICK' : 'QUESTION' });
    setLocalGameState('PLAYING');
  };

  // Hết 5 giây cân nhắc ngôi sao → mở câu hỏi
  const showQuestionAfterStarPick = async () => {
    playAudio('https://files.catbox.moe/amew8w.mp3');
    await update(ref(db, `treasureRooms/${roomCode}`), { status: 'QUESTION' });
  };

  const revealAnswer = async () => {
    playAudio('https://files.catbox.moe/r1fiz6.mp3');
    const currentQ = roomData.questions[roomData.currentQuestionIndex];
    const players = roomData.players || {};
    const enableHS = roomData.settings?.enableHighStakes;
    const totalQ = roomData.questions?.length || 0;
    const isLastThree = totalQ > 0 && roomData.currentQuestionIndex >= totalQ - 3;

    let wrongCount = 0;
    const updates = {};
    updates['status'] = 'REVEAL';

    Object.keys(players).forEach(playerId => {
      const p = players[playerId];
      if (p.currentAnswer) {
         let isCorrect = false;
         if (currentQ.type === 'TLN') {
            const normalizedPlayerAns = p.currentAnswer.toString().trim().toLowerCase().replace(/,/g, '.');
            const normalizedCorrect = currentQ.correctOption.toString().trim().toLowerCase().replace(/,/g, '.');
            isCorrect = normalizedPlayerAns === normalizedCorrect;
         } else {
            isCorrect = p.currentAnswer === currentQ.correctOption;
         }

         let points;
         if (enableHS && isLastThree && p.starActive) {
            points = isCorrect ? 300 : -300;
         } else if (isCorrect) {
            points = 100;
         } else {
            points = 0;
         }
         if (!isCorrect) wrongCount++;

         updates[`players/${playerId}/score`] = (p.score || 0) + points;
         // Ngôi sao chỉ ăn điểm cho đúng câu đã chọn; starUsed giữ nguyên (1 lần/ván)
         updates[`players/${playerId}/starActive`] = false;
         // Đúng thì được quyền gieo xúc sắc ở lượt bản đồ
         updates[`players/${playerId}/canRoll`] = isCorrect;
         updates[`players/${playerId}/hasRolled`] = false;
         updates[`players/${playerId}/diceValue`] = null;
      } else {
         wrongCount++;
         updates[`players/${playerId}/starActive`] = false;
         updates[`players/${playerId}/canRoll`] = false;
         updates[`players/${playerId}/hasRolled`] = false;
         updates[`players/${playerId}/diceValue`] = null;
      }
    });

    updates[`questions/${roomData.currentQuestionIndex}/wrongCount`] = wrongCount;

    await update(ref(db, `treasureRooms/${roomCode}`), updates);
  };

  // Hết giờ xem đáp án: có bản đồ thì mở lượt gieo xúc sắc, không thì sang câu kế
  const afterReveal = async () => {
    if (roomData?.settings?.boardEnabled) {
      playAudio('https://files.catbox.moe/amew8w.mp3');
      await update(ref(db, `treasureRooms/${roomCode}`), { status: 'DICE_ROLL' });
    } else {
      nextQuestion();
    }
  };

  // Mở / đóng bản đồ toàn màn hình. Mở thì đồng hồ dừng, đóng thì chạy lại.
  const toggleBoard = async (open) => {
    if (!roomCode) return;
    const next = open ?? !roomData?.boardOpen;
    await update(ref(db, `treasureRooms/${roomCode}`), { boardOpen: next, paused: next });
  };

  // Hết 6 giây gieo xúc sắc → mở bản đồ tổng kết, chờ giáo viên bấm câu tiếp theo
  const openBoardSummary = async () => {
    playAudio('https://files.catbox.moe/r1fiz6.mp3');
    await update(ref(db, `treasureRooms/${roomCode}`), { boardOpen: true, paused: true });
  };

  const nextQuestion = async () => {
    const nextIdx = roomData.currentQuestionIndex + 1;
    if (nextIdx >= roomData.questions.length) {
      endGame();
      return;
    }
    
    playAudio('https://files.catbox.moe/amew8w.mp3');

    const players = roomData.players || {};
    const updates = {};
    updates['status'] = isStarQuestion(nextIdx) ? 'STAR_PICK' : 'QUESTION';
    updates['currentQuestionIndex'] = nextIdx;
    // Sang câu mới thì đóng bản đồ và cho đồng hồ chạy lại
    updates['boardOpen'] = false;
    updates['paused'] = false;

    Object.keys(players).forEach(playerId => {
      updates[`players/${playerId}/currentAnswer`] = null;
      updates[`players/${playerId}/canRoll`] = false;
      updates[`players/${playerId}/hasRolled`] = false;
      updates[`players/${playerId}/diceValue`] = null;
      updates[`players/${playerId}/justLanded`] = false;
    });

    await update(ref(db, `treasureRooms/${roomCode}`), updates);
  };

  const endGame = async () => {
    if (window.confirm("Bạn có chắc muốn kết thúc và xem tổng kết xếp hạng?")) {
      playAudio('https://files.catbox.moe/12vlpb.mp3');
      await update(ref(db, `treasureRooms/${roomCode}`), { status: 'END' });
    }
  };

  const closeRoom = async () => {
    if (window.confirm("Kết thúc hoàn toàn và xoá phòng chơi này?")) {
      await remove(ref(db, `treasureRooms/${roomCode}`));
      try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setLocalGameState('SETUP');
      setRoomCode('');
      setRoomData(null);
    }
  };

  const playersList = roomData?.players ? Object.values(roomData.players) : [];
  const answerCount = playersList.filter(p => p.currentAnswer).length;
  const sortedTop10 = [...playersList].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);

  const theme = roomData?.settings?.theme || selectedTheme;
  const currentBgUrl = roomData?.settings?.bgUrl || bgUrl;

  // Dữ liệu bản đồ kho báu
  const activeBoardSize = roomData?.settings?.boardSize || boardSize;
  const totalCells = activeBoardSize * activeBoardSize;
  const boardTeams = playersList.map(p => ({
    id: p.id,
    name: p.name,
    position: p.position || 1,
    index: roomData?.teams?.[p.id]?.index || 1
  }));
  const winner = playersList.find(p => (p.position || 0) >= totalCells);

  // Có nhóm chạm ô cờ → mở màn nhận kho báu
  useEffect(() => {
    if (!roomCode || !roomData?.settings?.boardEnabled) return;
    if (roomData.status === 'TREASURE_END' || roomData.status === 'END') return;
    if (!winner) return;
    playAudio('https://files.catbox.moe/12vlpb.mp3');
    update(ref(db, `treasureRooms/${roomCode}`), { status: 'TREASURE_END', winnerId: winner.id });
  }, [winner?.id, roomData?.status, roomCode]);

  return (
    <div className={`min-h-screen text-white relative ${roomData?.status !== 'END' && roomData?.status !== 'TREASURE_END' ? 'p-4 md:p-8' : ''}`} style={localGameState !== 'SETUP' ? theme.bgStyle : { background: '#0f172a' }}>
      {localGameState !== 'SETUP' && currentBgUrl && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${currentBgUrl})`, opacity: 0.6 }}
        />
      )}

      {/* Cần set các div con có z-10 để đè lên background */}
      <div className={`relative z-10 w-full flex flex-col ${roomData?.status !== 'END' && roomData?.status !== 'TREASURE_END' ? 'min-h-screen' : 'h-screen'}`}>
      {localGameState === 'SETUP' && (
        <div className="relative w-full min-h-screen">
          <div className="max-w-3xl mx-auto">
            <button onClick={() => navigate('/games')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
              <ArrowLeft className="w-5 h-5" /> Quay lại kho game
            </button>

            <h1 className="text-4xl font-black mb-2 text-emerald-400 text-center">🏴‍☠️ Truy Tìm Kho Báu</h1>
            <p className="text-gray-400 text-center mb-10">Tải file, chọn giao diện và bắt đầu!</p>

          {resumeRoom && (
            <div className="mb-8 bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-black text-emerald-300">🔌 Phòng {resumeRoom} vẫn đang chạy</h3>
                <p className="text-gray-300 text-sm mt-1">
                  Học sinh, điểm số và tiến trình vẫn còn nguyên trên máy chủ. Nối lại để tiếp tục đúng chỗ đang dở.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={resumeHosting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black transition-colors"
                >
                  Nối lại phòng
                </button>
                <button
                  onClick={() => { try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ } setResumeRoom(null); }}
                  className="bg-slate-800 hover:bg-slate-700 text-gray-300 px-4 py-3 rounded-xl font-bold transition-colors"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          )}


          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Chọn Giao Diện Trình Chiếu</h2>
            <div className="grid grid-cols-5 gap-3">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t)}
                  className={`relative rounded-2xl overflow-hidden h-28 transition-all duration-300 border-4 ${
                    selectedTheme.id === t.id
                      ? 'border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                      : 'border-transparent hover:border-white/40 hover:scale-102'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${t.preview}`}></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
                    <span className="text-2xl mb-1">{t.name.split(' ')[0]}</span>
                    <span className="text-white text-xs font-bold drop-shadow-lg">{t.name.split(' ').slice(1).join(' ')}</span>
                  </div>
                  {selectedTheme.id === t.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-6">
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <label className="block text-gray-400 mb-2 font-bold text-sm">📝 Tên bài trình chiếu</label>
                <input 
                  type="text" 
                  value={gameTitle} 
                  onChange={(e) => setGameTitle(e.target.value)} 
                  className="w-full bg-slate-900 text-white text-xl font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-emerald-500" 
                  placeholder="Nhập tên bài..."
                />
              </div>

              <div className="flex-1 border-2 border-dashed border-emerald-500/30 p-8 rounded-xl hover:bg-emerald-500/10 transition-colors text-center flex flex-col justify-center">
                <Upload className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-lg mb-4 text-gray-300">Tải lên file Excel chứa câu hỏi</p>
                <div className="flex flex-col md:flex-row justify-center gap-4">
                  <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer transition-colors inline-flex items-center justify-center gap-2">
                    <Upload className="w-5 h-5" /> Chọn File Excel
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button onClick={downloadTemplate} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold transition-colors inline-flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" /> Tải File Mẫu
                  </button>
                </div>
                {fileName && (
                  <div className="mt-4 text-emerald-300 bg-emerald-900/30 p-3 rounded-lg border border-emerald-500/30">
                    ✅ <strong>{fileName}</strong> — {questions.length} câu hỏi
                      {questions.filter(q => q.timeLimit).length > 0 && (
                        <div className="text-xs opacity-80 mt-1">
                          ⏱ {questions.filter(q => q.timeLimit).length} câu có thời gian riêng
                        </div>
                      )}
                  </div>
                )}
              </div>

              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <label className="block text-gray-400 mb-2 font-bold text-sm">🖼️ Link ảnh nền (tuỳ chọn)</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    value={bgUrl} 
                    onChange={(e) => {
                      setBgUrl(e.target.value);
                      localStorage.setItem('treasureBgUrl', e.target.value);
                    }}
                    className="flex-1 w-full bg-slate-900 text-white text-lg font-bold px-4 py-3 rounded-lg outline-none border border-transparent focus:border-emerald-500" 
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-2 mb-3 border-t border-slate-700 pt-4 mt-2">
                   <input
                     type="text"
                     value={presetName}
                     onChange={e => setPresetName(e.target.value)}
                     placeholder="Đặt tên mẫu..."
                     className="flex-1 bg-slate-900 text-white px-3 py-2 rounded-lg outline-none border border-transparent focus:border-emerald-500"
                   />
                   <button 
                     onClick={() => {
                        if (!bgUrl || !presetName) return;
                        const newPresets = [...bgPresets, { name: presetName, url: bgUrl }];
                        setBgPresets(newPresets);
                        localStorage.setItem('treasureBgPresets', JSON.stringify(newPresets));
                        setPresetName('');
                     }}
                     className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap"
                   >
                     Lưu Mẫu
                   </button>
                </div>
                {bgPresets.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {bgPresets.map((p, i) => (
                      <div key={i} className="flex items-center bg-slate-700 rounded-lg overflow-hidden border border-slate-600">
                        <button 
                          onClick={() => {
                             setBgUrl(p.url);
                             localStorage.setItem('treasureBgUrl', p.url);
                          }}
                          className="px-3 py-1.5 text-sm font-semibold hover:bg-slate-600 transition-colors"
                        >
                          {p.name}
                        </button>
                        <button
                          onClick={() => {
                             const newPresets = bgPresets.filter((_, idx) => idx !== i);
                             setBgPresets(newPresets);
                             localStorage.setItem('treasureBgPresets', JSON.stringify(newPresets));
                          }}
                          className="px-2 py-1.5 text-red-400 hover:bg-red-500/20 transition-colors border-l border-slate-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 h-full flex flex-col justify-center">
                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">⏱ Thời gian mỗi câu (giây)</label>
                <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 text-white text-3xl font-black text-center py-3 rounded-lg outline-none border border-transparent focus:border-emerald-500 mb-6" />
                
                <label className="block text-gray-400 mb-2 font-bold text-sm text-center">👀 Thời gian xem đáp án (giây)</label>
                <input type="number" value={revealTimeLimit} onChange={(e) => setRevealTimeLimit(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 text-white text-3xl font-black text-center py-3 rounded-lg outline-none border border-transparent focus:border-emerald-500 mb-6" />

                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-gray-400 mb-2 font-bold text-sm text-center">Chế độ chơi</label>
                    <select value={playMode} onChange={e => setPlayMode(e.target.value)} className="w-full bg-slate-900 text-white text-lg font-bold text-center py-3 rounded-lg outline-none border border-transparent focus:border-emerald-500">
                      <option value="INDIVIDUAL">Cá nhân</option>
                      <option value="TEAM">Theo nhóm</option>
                    </select>
                  </div>
                  {playMode === 'TEAM' && (
                    <div className="flex-1">
                      <label className="block text-gray-400 mb-2 font-bold text-sm text-center">Số nhóm (1-12)</label>
                      <input type="number" min="1" max="12" value={teamCount} onChange={(e) => setTeamCount(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))} className="w-full bg-slate-900 text-white text-lg font-bold text-center py-3 rounded-lg outline-none border border-transparent focus:border-emerald-500" />
                    </div>
                  )}
                </div>

                {playMode === 'INDIVIDUAL' && (
                  <label className="flex items-center gap-3 cursor-pointer mt-4 bg-slate-900 p-4 rounded-lg border border-transparent hover:border-emerald-500/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={showQuestionOnDevice}
                      onChange={(e) => setShowQuestionOnDevice(e.target.checked)}
                      className="w-5 h-5 accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-gray-300 font-bold select-none text-sm">
                      Hiển thị nội dung câu hỏi trên thiết bị học sinh
                    </span>
                  </label>
                )}

                <label className="flex items-center gap-3 cursor-pointer mt-4 bg-slate-900 p-4 rounded-lg border border-transparent hover:border-yellow-500/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={enableHighStakes}
                    onChange={(e) => setEnableHighStakes(e.target.checked)}
                    className="w-5 h-5 accent-yellow-500 cursor-pointer"
                  />
                  <span className="text-gray-300 font-bold select-none text-sm">
                    ⭐ Ngôi sao hy vọng — 3 câu cuối có 5 giây chốt trước khi hiện câu hỏi. Đúng ×3, sai −300. Cả ván chỉ dùng 1 lần.
                  </span>
                </label>

                <button onClick={() => window.open('/print-qr', '_blank')} className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg w-full flex items-center justify-center gap-2 transition-colors">
                  🖨️ In thẻ QR Đáp Án
                </button>

                <button onClick={() => window.open('https://chuyendoijson.vercel.app/', '_blank')} className="mt-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg w-full flex items-center justify-center gap-2 transition-colors">
                  🔄 JSON → Excel
                </button>
              </div>
            </div>
          </div>

          {playMode === 'INDIVIDUAL' && (
            <button
              onClick={() => setPlayMode('TEAM')}
              className="mt-8 w-full bg-amber-950/40 hover:bg-amber-900/50 border-2 border-dashed border-amber-600/50 p-5 rounded-2xl text-left transition-colors"
            >
              <h2 className="text-xl font-black text-amber-400 flex items-center gap-2">🗺️ Bản Đồ Kho Báu — đang tắt</h2>
              <p className="text-gray-400 text-sm mt-1">
                Bản đồ, xúc sắc và ô đặc biệt chỉ chạy ở <b className="text-amber-300">chế độ Theo nhóm</b>.
                Bấm vào đây để chuyển sang chơi nhóm và mở phần cài đặt bản đồ.
              </p>
            </button>
          )}

          {playMode === 'TEAM' && (
            <div className="mt-8 bg-gradient-to-br from-amber-950/60 to-slate-900 p-6 rounded-2xl border-2 border-amber-600/40">
              <h2 className="text-2xl font-black text-amber-400 mb-1 flex items-center gap-2">🗺️ Bản Đồ Kho Báu</h2>
              <p className="text-gray-400 text-sm mb-5">Nhóm trả lời đúng được gieo xúc sắc để tiến trên bản đồ. Về ô cờ 🏁 là thắng!</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  {/* Kích thước lưới */}
                  <div>
                    <label className="block text-gray-400 mb-2 font-bold text-sm">Kích thước lưới</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 6, 7, 8].map(s => (
                        <button
                          key={s}
                          onClick={() => setBoardSize(s)}
                          className={`py-3 rounded-lg font-black text-lg transition-all ${
                            boardSize === s
                              ? 'bg-amber-500 text-slate-900 scale-105 shadow-lg'
                              : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                          }`}
                        >
                          {s}×{s}
                          <span className="block text-[10px] font-bold opacity-70">{s * s} ô</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ảnh nền bản đồ */}
                  <div>
                    <label className="block text-gray-400 mb-2 font-bold text-sm">🖼️ Link ảnh nền bản đồ (tuỳ chọn)</label>
                    <input
                      type="text"
                      value={boardBgUrl}
                      onChange={(e) => {
                        setBoardBgUrl(e.target.value);
                        localStorage.setItem('treasureBoardBg', e.target.value);
                      }}
                      className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg outline-none border border-transparent focus:border-amber-500"
                      placeholder="https://... (ảnh đảo, biển, rừng...)"
                    />
                  </div>

                  {/* Kịch bản dựng sẵn */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-gray-400 font-bold text-sm">🎬 Kịch bản ô đặc biệt</label>
                      <div className="flex gap-2">
                        <button
                          onClick={applyRandomScenario}
                          className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                        >
                          🎲 Ngẫu nhiên
                        </button>
                        {Object.keys(specialCells).length > 0 && (
                          <button
                            onClick={() => { setSpecialCells({}); setActiveScenario(''); }}
                            className="bg-slate-700 hover:bg-red-600 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                          >
                            🗑 Xoá hết
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                      {BOARD_SCENARIOS.map(sc => (
                        <button
                          key={sc.id}
                          onClick={() => applyScenario(sc)}
                          title={sc.desc}
                          className={`text-left p-2.5 rounded-lg border transition-all ${
                            activeScenario === sc.id
                              ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                              : 'bg-slate-800/80 border-slate-700 hover:border-amber-500/60 hover:bg-slate-800'
                          }`}
                        >
                          <div className="font-black text-white text-xs leading-tight">{sc.name}</div>
                          <div className="text-gray-400 text-[10px] leading-snug mt-1 line-clamp-2">{sc.desc}</div>
                        </button>
                      ))}
                    </div>

                    {activeScenario && (
                      <p className="text-amber-300 text-xs mt-2 font-bold">
                        ✅ Đã tạo {Object.keys(specialCells).length} ô đặc biệt
                        {activeScenario === 'random' ? ' — bấm 🎲 lần nữa để đổi bàn khác' : ' — bấm lại để xáo vị trí mới'}
                      </p>
                    )}
                  </div>

                  {/* Ô đặc biệt */}
                  <div>
                    <label className="block text-gray-400 mb-2 font-bold text-sm">⚡ Thêm / sửa thủ công</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="number" min="1" max={boardSize * boardSize}
                        value={newCellNo}
                        onChange={(e) => setNewCellNo(e.target.value)}
                        placeholder="Ô số"
                        className="flex-1 bg-slate-900 text-white px-3 py-2 rounded-lg outline-none border border-transparent focus:border-amber-500"
                      />
                      <input
                        type="number"
                        value={newCellStep}
                        onChange={(e) => setNewCellStep(e.target.value)}
                        placeholder="+3 hoặc -2"
                        className="flex-1 bg-slate-900 text-white px-3 py-2 rounded-lg outline-none border border-transparent focus:border-amber-500"
                      />
                      <button
                        onClick={() => {
                          const no = parseInt(newCellNo);
                          const step = parseInt(newCellStep);
                          if (!no || !step) return;
                          if (no < 1 || no >= boardSize * boardSize) return;
                          setSpecialCells({ ...specialCells, [no]: step });
                          setNewCellNo('');
                          setNewCellStep('');
                        }}
                        className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-bold whitespace-nowrap"
                      >
                        Thêm
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {Object.entries(specialCells).sort((a, b) => a[0] - b[0]).map(([cell, step]) => (
                        <div key={cell} className={`flex items-center rounded-lg overflow-hidden border ${step > 0 ? 'bg-emerald-900/40 border-emerald-600' : 'bg-red-900/40 border-red-600'}`}>
                          <span className="px-3 py-1.5 text-sm font-bold text-white">
                            Ô {cell} {step > 0 ? `▲ tiến ${step}` : `▼ lùi ${Math.abs(step)}`}
                          </span>
                          <button
                            onClick={() => {
                              const next = { ...specialCells };
                              delete next[cell];
                              setSpecialCells(next);
                            }}
                            className="px-2 py-1.5 text-red-300 hover:bg-red-500/30 border-l border-white/20"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {Object.keys(specialCells).length === 0 && (
                        <p className="text-gray-500 text-sm italic">Chưa có ô đặc biệt nào</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Xem trước bản đồ */}
                <div>
                  <label className="block text-gray-400 mb-2 font-bold text-sm">👁️ Xem trước</label>
                  <TreasureBoard
                    size={boardSize}
                    bgUrl={boardBgUrl}
                    specialCells={specialCells}
                    teams={Array.from({ length: Math.min(teamCount, 4) }, (_, i) => ({
                      id: `preview_${i}`, name: `Nhóm ${i + 1}`, position: 1, index: i + 1
                    }))}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 mb-8 space-y-4">
            <QuestionGuidePanel />

            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-4">🔧 Công Cụ Hỗ Trợ</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button onClick={() => navigate('/question-tester')} className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  🧪 Test Câu Hỏi
                </button>
                <button onClick={() => window.open('https://chuyendoijson.vercel.app/', '_blank')} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  🔄 JSON ↔ Excel
                </button>
                <button onClick={() => window.open('/scanner', '_blank')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  📱 QR Scanner
                </button>
              </div>
            </div>
          </div>

          </div>

          <button
            onClick={createRoom} disabled={questions.length === 0 || !gameTitle.trim()}
            className={`absolute top-6 right-6 px-8 py-4 rounded-2xl font-black text-xl transition-all flex items-center gap-2 ${questions.length > 0 && gameTitle.trim() ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
          >
            🚀 TẠO PHÒNG
          </button>
        </div>
      )}

      {localGameState === 'LOBBY' && roomData && (() => {
        const playUrl = `https://webdayhoc.vercel.app/treasure/play?pin=${roomCode}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(playUrl)}&bgcolor=ffffff&color=000000&margin=10`;
        return (
          <div className="w-full min-h-screen relative flex flex-col z-10">
            {/* Tiêu đề */}
            <div className="text-center pt-16 pb-4 animate-fade-in shrink-0">
              <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-wide uppercase" style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.3)' }}>
                {roomData.settings.gameTitle || 'TRUY TÌM KHO BÁU'}
              </h1>
              <h2 className="text-lg text-yellow-100/80 mt-2 font-semibold tracking-widest uppercase">
                Quét mã QR hoặc nhập PIN để tham gia
              </h2>
            </div>

            {/* Bố cục chính: QR bên trái, danh sách bên phải */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 px-6 pb-6 overflow-hidden">
              {/* BÊN TRÁI - QR Code lớn + PIN */}
              <div className="md:w-[45%] shrink-0 flex flex-col items-center justify-center gap-6">
                <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center gap-4">
                  <p className="text-yellow-400 text-xl font-black uppercase tracking-widest text-center w-full border-b border-white/10 pb-3">Quét Mã QR</p>
                  <div className="bg-white p-4 rounded-3xl shadow-2xl">
                    <img src={qrUrl} alt="QR Code" className="w-[280px] h-[280px] md:w-[360px] md:h-[360px] rounded-2xl" />
                  </div>
                  <p className="text-xs text-gray-400 font-mono bg-black/50 px-4 py-2 rounded-full">{playUrl}</p>
                </div>

                <div className="bg-black/40 backdrop-blur-xl rounded-3xl px-10 py-6 border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] text-center">
                  <p className="text-yellow-400 text-lg font-black uppercase tracking-widest mb-2">Mã Phòng (PIN)</p>
                  <div className="text-7xl md:text-8xl font-black tracking-[0.15em] text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.8)] select-all">
                    {roomCode}
                  </div>
                </div>
              </div>

              {/* BÊN PHẢI - Danh sách học sinh + Nút bắt đầu */}
              <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-3 text-2xl font-black text-white">
                    <div className="bg-blue-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.6)]"><Users className="w-7 h-7 text-white" /></div>
                    <span>{playersList.length} Học sinh</span>
                  </div>
                  <button
                    onClick={startGame}
                    disabled={playersList.length === 0}
                    className={`px-8 py-4 rounded-2xl font-black text-xl flex items-center gap-3 transition-all ${
                      playersList.length > 0
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)] text-white hover:scale-105'
                        : 'bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Play className="w-7 h-7" /> BẮT ĐẦU
                  </button>
                </div>

                {/* Danh sách học sinh */}
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="flex flex-wrap gap-3 content-start">
                    {playersList.length === 0 && (
                      <p className="text-gray-400 text-xl italic w-full text-center py-12 animate-pulse">Đang chờ học sinh tham gia...</p>
                    )}
                    {playersList.map((p, i) => (
                      <div key={i} className="bg-white/10 pr-5 pl-2 py-2 rounded-full text-base font-bold shadow-lg flex items-center gap-2.5 border border-white/20 backdrop-blur-sm animate-bounce-in hover:bg-white/20 transition-colors cursor-default">
                        <div className="w-9 h-9 bg-black/30 rounded-full overflow-hidden p-0.5 shadow-inner">
                          <img src={p.avatar} alt="avt" className="w-full h-full object-contain" />
                        </div>
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {localGameState === 'PLAYING' && roomData && (
        <div className="w-full px-4 mt-4">
          <div className="flex justify-end items-center mb-6">
            {(roomData.status === 'QUESTION' || roomData.status === 'REVEAL' || roomData.status === 'STAR_PICK' || roomData.status === 'DICE_ROLL') && (
               <div className="flex items-center gap-3 mr-auto">
                 <div className={`text-3xl font-black px-6 py-2 rounded-xl border flex items-center gap-3 backdrop-blur-md ${roomData.paused ? 'bg-amber-500/30 border-amber-400' : 'bg-black/30 border-white/10'}`}>
                   {roomData.paused ? '⏸' : '⏳'} <span className={roomData.paused ? 'text-amber-300' : (timeLeft <= 10 ? 'text-red-400 animate-pulse' : theme.timerColor)}>{timeLeft}s</span>
                 </div>
                 <button
                   onClick={togglePause}
                   className={`px-5 py-3 rounded-xl font-black text-lg transition-colors ${roomData.paused ? 'bg-amber-500 hover:bg-amber-400 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'}`}
                 >
                   {roomData.paused ? '▶ Tiếp tục' : '⏸ Tạm dừng'}
                 </button>
                 {roomData.paused && (
                   <span className="text-amber-300 font-bold animate-pulse">Đang chờ quét đáp án…</span>
                 )}
               </div>
            )}

            <div className="flex gap-4">
              <div className="bg-slate-800 px-6 py-2 rounded-lg text-xl font-bold text-emerald-400">
                Đã trả lời: {answerCount}/{playersList.length}
              </div>
              {roomData.settings?.boardEnabled && (
                <button
                  onClick={() => toggleBoard(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-black flex items-center gap-2 shadow-lg shadow-amber-900/40"
                >
                  🗺️ Bản đồ
                </button>
              )}
              <button onClick={() => window.open('/scanner', '_blank')} className="bg-indigo-900/60 hover:bg-indigo-600 text-indigo-100 px-4 py-2 rounded-lg font-bold">📷 Quét QR</button>
              <button onClick={endGame} className="bg-red-900/50 hover:bg-red-600 text-red-200 px-4 py-2 rounded-lg font-bold">Kết thúc</button>
            </div>
          </div>

          {/* Bản đồ toàn màn hình: che hẳn câu hỏi, đồng hồ dừng, kèm tổng kết điểm */}
          {roomData.settings?.boardEnabled && roomData.boardOpen && (() => {
            const ranked = [...playersList].sort(
              (a, b) => (b.position || 1) - (a.position || 1) || (b.score || 0) - (a.score || 0)
            );
            const lastMover = playersList.find(p => p.justLanded);
            const isLastQuestion = roomData.currentQuestionIndex >= (roomData.questions?.length || 0) - 1;

            return (
              <div className="fixed inset-0 z-50 flex flex-col" style={theme.bgStyle}>
                {/* Ảnh nền thuộc về bản đồ, chỉ nằm sau lưới ô — không phủ ra toàn màn hình */}
                <div className="relative z-10 flex flex-col h-full p-4 md:p-6">
                  {/* Thanh trên */}
                  <div className="shrink-0 flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl md:text-4xl font-black text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]">
                        🗺️ BẢN ĐỒ KHO BÁU
                      </h2>
                      <span className="bg-amber-500/25 border border-amber-400 text-amber-200 px-3 py-1.5 rounded-full font-bold text-sm">
                        ⏸ Đồng hồ đang dừng
                      </span>
                    </div>

                    <button
                      onClick={() => toggleBoard(false)}
                      className="bg-slate-800/90 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-bold border border-white/20 flex items-center gap-2 transition-colors"
                    >
                      ✕ Đóng, về câu hỏi
                    </button>
                  </div>

                  {/* Bản đồ + tổng kết */}
                  <div className="flex-1 min-h-0 grid lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6">
                    <div className="min-h-0 flex items-center justify-center">
                      <div className="w-full" style={{ maxWidth: 'min(100%, 68vh)' }}>
                        <TreasureBoard
                          size={activeBoardSize}
                          bgUrl={roomData.settings?.boardBgUrl}
                          specialCells={roomData.settings?.specialCells || {}}
                          teams={boardTeams}
                          highlightCell={lastMover?.position || null}
                          scale="stage"
                        />
                      </div>
                    </div>

                    {/* Bảng tổng kết điểm */}
                    <div className="min-h-0 flex flex-col bg-black/55 backdrop-blur-xl rounded-3xl border border-amber-500/40 overflow-hidden">
                      <div className="shrink-0 px-5 py-4 border-b border-white/10">
                        <h3 className="text-xl font-black text-white uppercase tracking-wide">🏆 Tổng kết</h3>
                        <p className="text-gray-400 text-sm">
                          Sau câu {roomData.currentQuestionIndex + 1}/{roomData.questions?.length || 0}
                        </p>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                        {ranked.map((p, i) => {
                          const idx = roomData.teams?.[p.id]?.index || 1;
                          return (
                            <div
                              key={p.id}
                              className={`flex items-center gap-3 px-3 py-3 rounded-xl border ${
                                i === 0 ? 'bg-yellow-500/20 border-yellow-500' : 'bg-slate-800/70 border-slate-700'
                              }`}
                            >
                              <span className="font-black text-lg w-7 shrink-0 text-gray-300">#{i + 1}</span>
                              <div
                                className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center font-black text-white text-sm shrink-0"
                                style={{ backgroundColor: getTeamColor(idx) }}
                              >
                                {idx}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-white truncate">{p.name}</div>
                                <div className="text-xs text-gray-400">
                                  Ô {p.position || 1}/{totalCells}
                                  {p.hasRolled && <span className="text-amber-300 font-bold"> • 🎲 {p.diceValue}</span>}
                                  {p.lastJump > 0 && <span className="text-emerald-400 font-bold"> • ⚡ +{p.lastJump}</span>}
                                  {p.lastJump < 0 && <span className="text-red-400 font-bold"> • 💀 {p.lastJump}</span>}
                                </div>
                              </div>
                              <div className="text-2xl font-black text-emerald-400 shrink-0">{p.score || 0}</div>
                            </div>
                          );
                        })}
                        {ranked.length === 0 && (
                          <p className="text-gray-500 text-center py-8">Chưa có nhóm nào tham gia</p>
                        )}
                      </div>

                      {/* Nút sang câu tiếp theo */}
                      <div className="shrink-0 p-4 border-t border-white/10">
                        <button
                          onClick={isLastQuestion ? endGame : nextQuestion}
                          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-5 rounded-2xl font-black text-xl shadow-[0_8px_0_rgba(4,120,87,1)] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3"
                        >
                          {isLastQuestion ? '🏆 Kết thúc & Xếp hạng' : '▶ CÂU TIẾP THEO'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Mini bản đồ luôn hiện khi đang hỏi / xem đáp án để lớp không mất mạch cục diện */}
          {roomData.settings?.boardEnabled && !roomData.boardOpen && (roomData.status === 'QUESTION' || roomData.status === 'REVEAL') && (
            <button
              onClick={() => toggleBoard(true)}
              className="fixed bottom-4 right-4 w-40 md:w-52 z-30 opacity-90 hover:opacity-100 hover:scale-105 transition-all"
              title="Mở bản đồ toàn màn hình (dừng đồng hồ)"
            >
              <div className="bg-black/60 backdrop-blur-md rounded-2xl p-2 border border-amber-500/40">
                <TreasureBoard
                  size={activeBoardSize}
                  bgUrl={roomData.settings?.boardBgUrl}
                  specialCells={roomData.settings?.specialCells || {}}
                  teams={boardTeams}
                  compact
                />
                <p className="text-center text-amber-300 text-[10px] font-bold mt-1.5">🗺️ Bấm để mở bản đồ</p>
              </div>
            </button>
          )}

          {!roomData.boardOpen && roomData.status === 'STAR_PICK' && (() => {
            const starPickers = playersList.filter(p => p.starActive);
            const remainQ = (roomData.questions?.length || 0) - roomData.currentQuestionIndex;
            return (
              <div className="animate-fade-in flex flex-col items-center justify-center text-center py-10">
                <div className="text-[8rem] leading-none animate-pulse drop-shadow-[0_0_50px_rgba(250,204,21,0.9)]">⭐</div>
                <h2 className="text-4xl md:text-6xl font-black text-yellow-400 uppercase mt-4 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]">
                  Ngôi Sao May Mắn
                </h2>
                <p className="text-xl md:text-2xl text-yellow-100/90 mt-4 font-semibold">
                  Còn {remainQ} câu cuối — quyết định <b>trước khi thấy câu hỏi</b>!
                </p>
                <p className="text-lg text-gray-300 mt-2">Đúng ×3 điểm &nbsp;•&nbsp; Sai −300 điểm &nbsp;•&nbsp; Cả ván chỉ dùng 1 lần</p>

                <div className="mt-8 text-8xl font-black text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.8)]">
                  {timeLeft}
                </div>

                <div className="mt-8 bg-black/40 backdrop-blur-xl px-8 py-4 rounded-2xl border border-yellow-500/40">
                  <p className="text-yellow-400 font-black text-2xl">
                    {starPickers.length} / {playersList.length} đã chốt ngôi sao
                  </p>
                  {starPickers.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-3 max-w-3xl">
                      {starPickers.map(p => (
                        <span key={p.id} className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-3 py-1 rounded-full text-sm font-bold">
                          ⭐ {p.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={showQuestionAfterStarPick} className="mt-8 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold text-lg transition-colors">
                  Bỏ qua chờ → Hiện câu hỏi
                </button>
              </div>
            );
          })()}

          {!roomData.boardOpen && roomData.status === 'QUESTION' && (() => {
            const q = roomData.questions[roomData.currentQuestionIndex];
            const hasImage = q.image && q.image.trim();
            return (
              <div className="animate-fade-in">
                <div className={`${theme.questionBg} rounded-3xl mb-6 shadow-xl border-b-8 border-black/20 backdrop-blur-md overflow-hidden ${
                  hasImage ? 'flex flex-row min-h-[260px]' : 'p-8 md:p-10 text-2xl md:text-4xl font-bold text-center flex items-center justify-center min-h-[200px]'
                }`}>
                  {hasImage ? (
                    <>
                      <div className="flex-1 flex items-center justify-center p-8 text-2xl md:text-3xl font-bold text-left border-r border-white/10">
                        <MathText text={q.question} />
                      </div>
                      <div className="flex-1 flex items-center justify-center p-4 bg-black/20">
                        <img src={q.image.trim()} alt="Hình minh họa" className="max-h-64 object-contain rounded-2xl shadow-lg" onError={(e) => e.target.style.display='none'} />
                      </div>
                    </>
                  ) : (
                    <MathText text={q.question} />
                  )}
                </div>

                {q.type !== 'TLN' && (
                  <div className="grid grid-cols-2 gap-4 md:gap-5">
                    {[
                      { text: q.optionA, style: 'bg-red-500 border-red-700' },
                      { text: q.optionB, style: 'bg-blue-500 border-blue-700' },
                      { text: q.optionC, style: 'bg-yellow-500 border-yellow-700' },
                      { text: q.optionD, style: 'bg-emerald-500 border-emerald-700' }
                    ].map((opt, i) => (
                      <div key={i} className={`${opt.style.split(' ')[0]} text-white p-5 md:p-7 rounded-2xl text-xl md:text-3xl font-bold shadow-lg border-b-8 ${opt.style.split(' ')[1]} flex items-center justify-center text-center gap-3`}>
                        <span className="text-white/60 font-black shrink-0">{['A','B','C','D'][i]}.</span>
                        <MathText text={opt.text} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button onClick={revealAnswer} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-2xl shadow-lg flex items-center gap-2">
                    Hiển Thị Đáp Án <ChevronRight />
                  </button>
                </div>
              </div>
            );
          })()}

          {!roomData.boardOpen && roomData.status === 'REVEAL' && (
            <div className="animate-fade-in flex flex-col md:flex-row gap-6 min-h-[70vh]">
               <div className="flex-1 bg-slate-800 p-8 rounded-3xl border-4 border-slate-700 flex flex-col gap-6">
                  <div className="flex flex-col items-center justify-center text-center bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                    <h2 className="text-2xl text-gray-400 mb-2">Đáp án đúng là:</h2>
                    <div className="text-5xl md:text-7xl font-black text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]">
                      {roomData.questions[roomData.currentQuestionIndex].type === 'TLN' 
                        ? <MathText text={roomData.questions[roomData.currentQuestionIndex].correctOption} />
                        : ['A', 'B', 'C', 'D'][roomData.questions[roomData.currentQuestionIndex].correctOption - 1]
                      }
                    </div>
                  </div>
                  
                  {roomData.questions[roomData.currentQuestionIndex].explanation && (
                    <div className="flex-1 bg-slate-900 p-6 rounded-2xl text-left border border-slate-700 overflow-y-auto max-h-[50vh] shadow-inner">
                      <h3 className="text-2xl font-bold text-emerald-400 mb-4 border-b-2 border-slate-700/50 pb-2 flex items-center gap-3">
                        Lời giải chi tiết
                      </h3>
                      <div className="text-xl leading-[1.8] text-gray-200">
                        <MathText text={roomData.questions[roomData.currentQuestionIndex].explanation} />
                      </div>
                    </div>
                  )}

                  <div className="mt-auto flex justify-end">
                    <button onClick={nextQuestion} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg flex items-center gap-2">
                      Câu Tiếp Theo <ChevronRight />
                    </button>
                  </div>
               </div>

               <div className="md:w-1/3 bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl overflow-y-auto max-h-[70vh]">
                 <h3 className="text-2xl font-black text-yellow-400 mb-6 text-center flex items-center justify-center gap-2">
                   <Trophy className="w-8 h-8" /> BẢNG XẾP HẠNG TOP 10
                 </h3>
                 <div className="space-y-3">
                   {sortedTop10.map((p, i) => {
                     let bgClass = 'bg-slate-900/50 text-gray-300';
                     if (i === 0) bgClass = 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black scale-[1.02] shadow-[0_0_15px_rgba(250,204,21,0.5)]';
                     else if (i === 1) bgClass = 'bg-gradient-to-r from-gray-400 to-gray-300 text-black shadow-lg';
                     else if (i === 2) bgClass = 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-lg';

                     return (
                       <div key={i} className={`flex justify-between items-center p-3 rounded-xl font-bold transition-all ${bgClass}`}>
                         <div className="flex items-center gap-3 w-full">
                           <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-black ${i < 3 ? 'bg-black/20' : 'bg-slate-800'}`}>
                             #{i+1}
                           </div>
                           <div className={`w-10 h-10 rounded-full overflow-hidden p-0.5 shrink-0 ${i < 3 ? 'bg-white/30' : 'bg-white/10'}`}>
                             <img src={p.avatar} alt="avt" className="w-full h-full object-contain" />
                           </div>
                           <span className="truncate flex-1 min-w-0 pr-2">{p.name}</span>
                           <div className="text-lg font-black shrink-0">{p.score || 0}</div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
            </div>
          )}

          {!roomData.boardOpen && roomData.status === 'DICE_ROLL' && (() => {
            const eligible = playersList.filter(p => p.canRoll);
            const rolled = eligible.filter(p => p.hasRolled);
            const lastMover = playersList.find(p => p.hasRolled && p.justLanded);
            return (
              <div className="animate-fade-in grid lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] gap-6 items-start">
                {/* Bản đồ — nhân vật chính, giới hạn theo chiều cao màn chiếu */}
                <div className="mx-auto w-full" style={{ maxWidth: 'min(100%, 74vh)' }}>
                  <TreasureBoard
                    size={activeBoardSize}
                    bgUrl={roomData.settings?.boardBgUrl}
                    specialCells={roomData.settings?.specialCells || {}}
                    teams={boardTeams}
                    highlightCell={lastMover?.position || null}
                    scale="stage"
                    legend
                  />
                </div>

                {/* Bảng điều khiển lượt gieo */}
                <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-amber-500/40 p-6 flex flex-col gap-4">
                  <div className="text-center">
                    <div className="text-6xl animate-bounce">🎲</div>
                    <h2 className="text-3xl font-black text-amber-400 uppercase mt-2">Gieo Xúc Sắc</h2>
                    <p className="text-gray-300 mt-1">Nhóm trả lời đúng được tiến bước</p>
                    <div className={`text-7xl font-black mt-3 ${timeLeft <= 2 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                      {timeLeft}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{rolled.length}/{eligible.length} nhóm đã gieo</p>
                  </div>

                  <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-[45vh]">
                    {playersList.length === 0 && <p className="text-gray-500 text-center">Chưa có nhóm nào</p>}
                    {playersList.map(p => {
                      const idx = roomData.teams?.[p.id]?.index || 1;
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                            p.hasRolled ? 'bg-amber-500/20 border-amber-500' :
                            p.canRoll ? 'bg-emerald-900/30 border-emerald-600 animate-pulse' :
                            'bg-slate-800/60 border-slate-700 opacity-60'
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-black text-white text-xs shrink-0"
                            style={{ backgroundColor: getTeamColor(idx) }}
                          >
                            {idx}
                          </div>
                          <span className="flex-1 min-w-0 truncate font-bold text-white">{p.name}</span>
                          {p.hasRolled ? (
                            <span className="text-2xl font-black text-amber-300 shrink-0">🎲 {p.diceValue}</span>
                          ) : p.canRoll ? (
                            <span className="text-emerald-400 text-sm font-bold shrink-0">Đang chờ gieo…</span>
                          ) : (
                            <span className="text-gray-500 text-sm shrink-0">Sai — không gieo</span>
                          )}
                          <span className="text-white/70 text-sm font-bold shrink-0">Ô {p.position || 1}</span>
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={nextQuestion} className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-lg transition-colors">
                    Bỏ qua chờ → Câu tiếp theo
                  </button>
                </div>
              </div>
            );
          })()}

          {roomData.status === 'TREASURE_END' && (() => {
            const champion = playersList.find(p => p.id === roomData.winnerId) || winner;
            const ranked = [...playersList].sort((a, b) => (b.position || 1) - (a.position || 1) || (b.score || 0) - (a.score || 0));
            return (
              <div className="w-full h-screen flex flex-col items-center justify-center px-4 animate-fade-in relative z-20 overflow-y-auto py-8">
                <div className="text-[7rem] leading-none animate-bounce drop-shadow-[0_0_60px_rgba(250,204,21,0.9)]">💎</div>
                <h1 className="text-4xl md:text-6xl font-black text-center text-yellow-400 drop-shadow-[0_0_40px_rgba(250,204,21,1)] uppercase mt-2">
                  Kho Báu Đã Mở!
                </h1>

                {champion && (
                  <div className="mt-6 bg-gradient-to-br from-yellow-500/30 to-amber-900/40 backdrop-blur-xl px-10 py-6 rounded-3xl border-2 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.4)] text-center">
                    <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-yellow-200 uppercase tracking-widest font-bold text-sm">Nhóm chiếm được kho báu</p>
                    <p className="text-4xl md:text-5xl font-black text-white mt-2 drop-shadow-lg">{champion.name}</p>
                    <p className="text-yellow-300 font-bold text-xl mt-2">🏁 Về đích • {champion.score || 0} điểm</p>
                  </div>
                )}

                {/* Bảng xếp hạng theo vị trí trên bản đồ */}
                <div className="mt-8 w-full max-w-2xl bg-black/50 backdrop-blur-xl rounded-3xl border border-white/20 p-5">
                  <h3 className="text-xl font-black text-white mb-3 text-center uppercase tracking-widest">Hành trình các nhóm</h3>
                  <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto">
                    {ranked.map((p, i) => {
                      const idx = roomData.teams?.[p.id]?.index || 1;
                      return (
                        <div key={p.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${i === 0 ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-slate-800/70'}`}>
                          <span className="font-black text-lg w-8 shrink-0 text-gray-300">#{i + 1}</span>
                          <div
                            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-black text-white text-xs shrink-0"
                            style={{ backgroundColor: getTeamColor(idx) }}
                          >
                            {idx}
                          </div>
                          <span className="flex-1 min-w-0 truncate font-bold text-white">{p.name}</span>
                          <span className="text-amber-300 font-bold shrink-0">Ô {p.position || 1}/{totalCells}</span>
                          <span className="text-emerald-400 font-black shrink-0 w-16 text-right">{p.score || 0}đ</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 mt-8 shrink-0">
                  <button onClick={() => setShowStatsModal(true)} className="bg-slate-800/80 hover:bg-slate-700 px-6 py-3 rounded-2xl border border-red-500/50 flex items-center gap-2 transition-colors">
                    <XCircle className="w-6 h-6 text-red-400" />
                    <span className="text-lg font-bold text-red-400">Thống Kê Câu Sai</span>
                  </button>
                  <button onClick={closeRoom} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-2xl font-black text-lg shadow-lg transition-transform hover:scale-105">
                    Thoát & Xoá Phòng
                  </button>
                </div>

                {showStatsModal && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
                      <button onClick={() => setShowStatsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-slate-800 rounded-full p-2 z-10">✕</button>
                      <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                        <h2 className="text-3xl font-black text-white flex items-center gap-3"><XCircle className="text-red-500" /> Thống Kê Các Câu Sai</h2>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                        {(() => {
                          const wrongQs = [...roomData.questions]
                            .map((q, idx) => ({ ...q, index: idx }))
                            .filter(q => q.wrongCount > 0)
                            .sort((a, b) => b.wrongCount - a.wrongCount);
                          if (wrongQs.length === 0) return <div className="text-center text-emerald-400 text-2xl py-10 font-bold">Tuyệt vời! Không có câu nào sai! 🎉</div>;
                          return wrongQs.map((q, i) => (
                            <div key={i} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                              <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-700/50" onClick={() => setSelectedStatQ(selectedStatQ === q.index ? null : q.index)}>
                                <div className="font-bold text-xl text-gray-300">Câu hỏi số {q.index + 1}</div>
                                <div className="flex items-center gap-4">
                                  <div className="text-red-400 font-bold bg-red-900/30 px-3 py-1 rounded-lg">{q.wrongCount} nhóm sai</div>
                                  <ChevronRight className={`w-6 h-6 transition-transform ${selectedStatQ === q.index ? 'rotate-90 text-emerald-400' : 'text-gray-500'}`} />
                                </div>
                              </div>
                              {selectedStatQ === q.index && (
                                <div className="p-6 bg-slate-900/80 border-t border-slate-700">
                                  <div className="text-xl mb-4 text-white"><MathText text={q.question} /></div>
                                  {q.image && <img src={q.image} className="max-h-40 rounded-lg mb-4" alt="minh hoạ" />}
                                  <div className="text-emerald-400 font-bold mt-4">
                                    Đáp án đúng: {q.type === 'TLN' ? <MathText text={q.correctOption} /> : ['A', 'B', 'C', 'D'][q.correctOption - 1]}
                                  </div>
                                </div>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {roomData.status === 'END' && (() => {
             const top3 = sortedTop10.slice(0, 3);
             return (
                <div className="w-full max-w-5xl mx-auto px-4 animate-fade-in relative z-20 h-screen flex flex-col pt-12">
                  {/* Tiêu đề trên cao */}
                  <div className="shrink-0">
                    <h1 className="text-4xl md:text-6xl font-black text-center text-yellow-400 drop-shadow-[0_0_40px_rgba(250,204,21,1)] uppercase animate-pulse">
                       🏆 TỔNG KẾT BẢNG XẾP HẠNG 🏆
                    </h1>
                  </div>

                  {/* Bục xếp hạng trung tâm */}
                  <div className="flex-1 flex justify-center items-center gap-4 md:gap-8 mt-12 mb-8">
                     {top3[1] && (
                        <div className="flex flex-col items-center animate-bounce-in" style={{ animationDelay: '0.2s' }}>
                           <div className="text-2xl font-bold text-gray-300 mb-2 w-[100px] md:w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-center">{top3[1].name}</div>
                           <div className="w-20 h-20 bg-gray-300 rounded-full p-1 mb-2 shadow-[0_0_15px_rgba(209,213,219,0.5)] relative">
                              <img src={top3[1].avatar} className="w-full h-full object-contain rounded-full bg-slate-800" alt="avt" />
                           </div>
                           <div className="w-24 h-40 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-xl flex items-center justify-center text-5xl font-black text-white shadow-2xl">2</div>
                           <div className="text-xl font-bold mt-3 text-gray-300">{top3[1].score || 0} đ</div>
                        </div>
                     )}
                     
                     {top3[0] && (
                        <div className="flex flex-col items-center animate-bounce-in z-10 mx-2">
                           <Crown className="w-20 h-20 text-yellow-400 mb-[-10px] drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-pulse" />
                           <div className="text-3xl font-black text-yellow-400 mb-2 w-[120px] md:w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-center">{top3[0].name}</div>
                           <div className="w-28 h-28 bg-yellow-400 rounded-full p-1.5 mb-2 shadow-[0_0_30px_rgba(250,204,21,0.8)] relative">
                              <img src={top3[0].avatar} className="w-full h-full object-contain rounded-full bg-slate-800" alt="avt" />
                           </div>
                           <div className="w-32 h-56 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-xl flex items-center justify-center text-7xl font-black text-white shadow-2xl">1</div>
                           <div className="text-2xl font-black mt-3 text-yellow-400">{top3[0].score || 0} đ</div>
                        </div>
                     )}

                     {top3[2] && (
                        <div className="flex flex-col items-center animate-bounce-in" style={{ animationDelay: '0.4s' }}>
                           <div className="text-2xl font-bold text-amber-600 mb-2 w-[100px] md:w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-center">{top3[2].name}</div>
                           <div className="w-20 h-20 bg-amber-600 rounded-full p-1 mb-2 shadow-[0_0_15px_rgba(217,119,6,0.5)] relative">
                              <img src={top3[2].avatar} className="w-full h-full object-contain rounded-full bg-slate-800" alt="avt" />
                           </div>
                           <div className="w-24 h-32 bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-xl flex items-center justify-center text-5xl font-black text-white shadow-2xl">3</div>
                           <div className="text-xl font-bold mt-3 text-amber-600">{top3[2].score || 0} đ</div>
                        </div>
                     )}
                  </div>

                  {/* Các nút bấm sát mép dưới */}
                  <div className="shrink-0 flex flex-col items-center gap-4 pb-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
                     <button onClick={() => setShowStatsModal(true)} className="bg-slate-800/80 hover:bg-slate-700 px-8 py-4 rounded-3xl border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)] flex items-center justify-center gap-3 transition-colors">
                        <XCircle className="w-8 h-8 text-red-400" />
                        <span className="text-2xl font-bold text-red-400">Xem Thống Kê Câu Sai</span>
                     </button>

                     <button onClick={closeRoom} className="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-3">
                        Thoát & Xoá Phòng
                     </button>
                  </div>

                  {/* Modal Thống kê */}
                  {showStatsModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative animate-bounce-in">
                        <button onClick={() => setShowStatsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-slate-800 rounded-full p-2 z-10 transition-colors">
                           ✕
                        </button>
                        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                           <h2 className="text-3xl font-black text-white flex items-center gap-3">
                              <XCircle className="text-red-500" /> Thống Kê Các Câu Sai
                           </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                           {(() => {
                             const wrongQs = [...roomData.questions]
                               .map((q, idx) => ({ ...q, index: idx }))
                               .filter(q => q.wrongCount > 0)
                               .sort((a, b) => b.wrongCount - a.wrongCount);
                             
                             if (wrongQs.length === 0) return <div className="text-center text-emerald-400 text-2xl py-10 font-bold">Tuyệt vời! Không có câu nào sai! 🎉</div>;
                             
                             return wrongQs.map((q, i) => (
                               <div key={i} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                                 <div 
                                   className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-700/50 transition-colors"
                                   onClick={() => setSelectedStatQ(selectedStatQ === q.index ? null : q.index)}
                                 >
                                    <div className="font-bold text-xl text-gray-300">Câu hỏi số {q.index + 1}</div>
                                    <div className="flex items-center gap-4">
                                       <div className="text-red-400 font-bold bg-red-900/30 px-3 py-1 rounded-lg">{q.wrongCount} học sinh sai</div>
                                       <ChevronRight className={`w-6 h-6 transition-transform ${selectedStatQ === q.index ? 'rotate-90 text-emerald-400' : 'text-gray-500'}`} />
                                    </div>
                                 </div>
                                 {selectedStatQ === q.index && (
                                   <div className="p-6 bg-slate-900/80 border-t border-slate-700">
                                      <div className="text-xl mb-4 text-white"><MathText text={q.question} /></div>
                                      {q.image && <img src={q.image} className="max-h-40 rounded-lg mb-4" alt="minh hoạ" />}
                                      <div className="text-emerald-400 font-bold mt-4">
                                        Đáp án đúng: {q.type === 'TLN' ? <MathText text={q.correctOption} /> : ['A', 'B', 'C', 'D'][q.correctOption - 1]}
                                      </div>
                                   </div>
                                 )}
                               </div>
                             ));
                           })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
             );
          })()}

        </div>
      )}
      </div>
    </div>
  );
};

export default TreasureHost;
