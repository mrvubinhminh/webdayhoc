import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './TugOfWarGame.css';

const MAX_FONT_SCALE = 1.6;
const MIN_FONT_SCALE = 0.6;

const TugOfWarGame = () => {
    const navigate = useNavigate();

    // --- LOBBY STATES ---
    const [screen, setScreen] = useState('menu'); // 'menu' | 'game'
    const [quizBank, setQuizBank] = useState(() => {
        const saved = localStorage.getItem('tug_quiz_bank');
        if (saved) return JSON.parse(saved);
        const initial = {};
        for (let i = 1; i <= 12; i++) initial[i] = [];
        return initial;
    });
    const [activeQuizData, setActiveQuizData] = useState(null);
    const [t1Name, setT1Name] = useState('Đội 1');
    const [t2Name, setT2Name] = useState('Đội 2');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [pendingUploadData, setPendingUploadData] = useState(null);
    const [uploadName, setUploadName] = useState('');
    const [uploadGrade, setUploadGrade] = useState('10');
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [promptResult, setPromptResult] = useState('');
    const [toasts, setToasts] = useState([]);

    // --- GAME STATES ---
    const [showTutorial, setShowTutorial] = useState(false);
    const [showPause, setShowPause] = useState(false);
    const [showWin, setShowWin] = useState(false);
    const [winMsg, setWinMsg] = useState('');
    const [winTeam, setWinTeam] = useState(0); // 1 or 2
    
    const [fontScale, setFontScale] = useState(1);
    const [timeLeft, setTimeLeft] = useState(12);
    const [scoreT1, setScoreT1] = useState(0);
    const [scoreT2, setScoreT2] = useState(0);
    const [audioMuted, setAudioMuted] = useState(() => localStorage.getItem('tug_muted') === 'true');
    
    const [qT1, setQT1] = useState(null);
    const [qT2, setQT2] = useState(null);
    const [lockedT1, setLockedT1] = useState(false);
    const [lockedT2, setLockedT2] = useState(false);
    const [selT1, setSelT1] = useState(null);
    const [selT2, setSelT2] = useState(null);
    const [feedT1, setFeedT1] = useState({ show: false, correct: false, text: '' });
    const [feedT2, setFeedT2] = useState({ show: false, correct: false, text: '' });
    const [shakeT1, setShakeT1] = useState(false);
    const [shakeT2, setShakeT2] = useState(false);

    // --- REFS FOR GAME LOGIC ---
    const gameState = useRef({
        qSequenceT1: [], qSequenceT2: [], roundIndex: 0,
        tugPosition: 0, targetTugPosition: 0, visualX: 0, velocity: 0, recoilAmount: 0,
        isRoundActive: false, isGameOver: false, isPaused: false,
        timerInterval: null
    });
    
    const audioRef = useRef({ ctx: null, bgmGain: null, sfxGain: null, isInit: false });
    const ropeRef = useRef(null);
    const animationFrameRef = useRef(null);
    const promptInputRef = useRef(null);

    // --- TOAST SYSTEM ---
    const showToast = (message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    // --- SAVE BANK ---
    useEffect(() => {
        localStorage.setItem('tug_quiz_bank', JSON.stringify(quizBank));
    }, [quizBank]);

    // --- AUDIO SYSTEM ---
    const initAudio = () => {
        if (audioRef.current.isInit) {
            if (audioRef.current.ctx && audioRef.current.ctx.state === 'suspended' && !audioMuted) {
                audioRef.current.ctx.resume();
            }
            return;
        }
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const bgmGain = ctx.createGain();
            const sfxGain = ctx.createGain();
            bgmGain.connect(ctx.destination);
            sfxGain.connect(ctx.destination);
            audioRef.current = { ctx, bgmGain, sfxGain, isInit: true };
            updateMuteState(audioMuted);
            playProceduralBGM();
        } catch (e) {
            console.warn("WebAudio err", e);
        }
    };

    const updateMuteState = (muted) => {
        if (audioRef.current.isInit) {
            audioRef.current.bgmGain.gain.value = muted ? 0 : 0.15;
            audioRef.current.sfxGain.gain.value = muted ? 0 : 0.5;
        }
    };

    useEffect(() => {
        updateMuteState(audioMuted);
        localStorage.setItem('tug_muted', audioMuted);
    }, [audioMuted]);

    const playProceduralBGM = () => {
        const { ctx, bgmGain } = audioRef.current;
        if (!ctx) return;
        let nextNoteTime = ctx.currentTime + 0.1;
        let step = 0;
        
        const scheduler = () => {
            if (gameState.current.isGameOver) return; // Stop if game over
            while (nextNoteTime < ctx.currentTime + 0.1) {
                if (step % 4 === 0) {
                    let osc = ctx.createOscillator();
                    let gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(bgmGain);
                    osc.frequency.setValueAtTime(150, nextNoteTime);
                    osc.frequency.exponentialRampToValueAtTime(0.01, nextNoteTime + 0.5);
                    gain.gain.setValueAtTime(1, nextNoteTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, nextNoteTime + 0.5);
                    osc.start(nextNoteTime);
                    osc.stop(nextNoteTime + 0.5);
                }
                nextNoteTime += 0.25;
                step = (step + 1) % 16;
            }
            if (screen === 'game' && !gameState.current.isGameOver) {
                setTimeout(scheduler, 50);
            }
        };
        scheduler();
    };

    const playSFX = (type) => {
        const { ctx, sfxGain } = audioRef.current;
        if (!ctx || audioMuted) return;
        let osc = ctx.createOscillator();
        let gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(sfxGain);
        let t = ctx.currentTime;
        
        if (type === 'click') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(600, t); gain.gain.setValueAtTime(0.5, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1); osc.start(t); osc.stop(t + 0.1);
        } else if (type === 'correct') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(400, t); osc.frequency.setValueAtTime(600, t + 0.1); gain.gain.setValueAtTime(0.8, t); gain.gain.linearRampToValueAtTime(0, t + 0.3); osc.start(t); osc.stop(t + 0.3);
        } else if (type === 'wrong') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, t); osc.frequency.exponentialRampToValueAtTime(50, t + 0.3); gain.gain.setValueAtTime(0.8, t); gain.gain.linearRampToValueAtTime(0, t + 0.3); osc.start(t); osc.stop(t + 0.3);
        } else if (type === 'pull') {
            osc.type = 'square'; osc.frequency.setValueAtTime(100, t); osc.frequency.linearRampToValueAtTime(150, t + 0.5); gain.gain.setValueAtTime(0.2, t); gain.gain.linearRampToValueAtTime(0, t + 0.5); osc.start(t); osc.stop(t + 0.5);
        }
    };

    // --- GAME LOOP & LOGIC ---
    const startGameFromMenu = () => {
        if (!activeQuizData || activeQuizData.questions.length === 0) {
            showToast("Dữ liệu trống!", "error"); return;
        }
        setScreen('game');
        setShowTutorial(true);
        if (!audioRef.current.isInit) initAudio();
    };

    const startRealGame = () => {
        playSFX('click');
        setShowTutorial(false);
        initGame();
    };

    const initGame = () => {
        if (audioRef.current.ctx && audioRef.current.ctx.state === 'suspended' && !audioMuted) {
            audioRef.current.ctx.resume();
        }

        const len = activeQuizData.questions.length;
        let baseIndices = Array.from({length: len}, (_, i) => i);
        for (let i = baseIndices.length - 1; i > 0; i--) { 
            const j = Math.floor(Math.random() * (i + 1)); 
            [baseIndices[i], baseIndices[j]] = [baseIndices[j], baseIndices[i]]; 
        }
        
        let qSeq1 = [...baseIndices];
        let qSeq2 = len === 1 ? [...qSeq1] : [...qSeq1.slice(Math.floor(len/2)), ...qSeq1.slice(0, Math.floor(len/2))];

        gameState.current = {
            ...gameState.current,
            qSequenceT1: qSeq1, qSequenceT2: qSeq2, roundIndex: 0,
            tugPosition: 0, targetTugPosition: 0, visualX: 0, velocity: 0, recoilAmount: 0,
            isRoundActive: false, isGameOver: false, isPaused: false
        };

        setScoreT1(0); setScoreT2(0);
        setShowWin(false); setShowPause(false);
        startRound();
        
        if (!animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(animationLoop);
        }
    };

    const animationLoop = () => {
        const gs = gameState.current;
        const stiffness = 0.08; 
        const damping = 0.75; 
        const force = (gs.targetTugPosition - gs.tugPosition) * stiffness; 
        gs.velocity = (gs.velocity + force) * damping; 
        gs.tugPosition += gs.velocity;
        
        const maxVisualShift = 350; 
        let baseVisualX = -(gs.tugPosition / 100) * maxVisualShift;
        if (Math.abs(gs.recoilAmount) > 0.5) { 
            baseVisualX += gs.recoilAmount; 
            gs.recoilAmount *= 0.8; 
        }
        
        if (Math.abs(gs.visualX - baseVisualX) > 0.1) { 
            gs.visualX = baseVisualX; 
            if (ropeRef.current) {
                ropeRef.current.style.transform = `translate3d(${gs.visualX}px, 0, 0)`;
            }
        }
        
        if (!gs.isGameOver || Math.abs(gs.velocity) > 0.1) {
            animationFrameRef.current = requestAnimationFrame(animationLoop);
        } else {
            animationFrameRef.current = null; // Stop animation loop when game is over and physics settled
        }
    };

    const startRound = () => {
        const gs = gameState.current;
        if (gs.isGameOver) return;
        
        gs.isRoundActive = true;
        setLockedT1(false); setLockedT2(false);
        setSelT1(null); setSelT2(null);
        setFeedT1({show: false}); setFeedT2({show: false});
        setShakeT1(false); setShakeT2(false);
        
        setTimeLeft(12);
        
        const q1 = activeQuizData.questions[gs.qSequenceT1[gs.roundIndex]];
        const q2 = activeQuizData.questions[gs.qSequenceT2[gs.roundIndex]];
        setQT1(q1); setQT2(q2);

        clearInterval(gs.timerInterval);
        gs.timerInterval = setInterval(() => { 
            setTimeLeft(prev => {
                if (prev <= 1) {
                    evaluateRound();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const evaluateRound = () => {
        const gs = gameState.current;
        clearInterval(gs.timerInterval); 
        if (!gs.isRoundActive) return; 
        gs.isRoundActive = false;

        const q1 = activeQuizData.questions[gs.qSequenceT1[gs.roundIndex]];
        const q2 = activeQuizData.questions[gs.qSequenceT2[gs.roundIndex]];
        
        // This function will be called either by timer (state closure might be stale) 
        // so we need to rely on the latest selT1/selT2 which is tricky. 
        // Best approach in React: Use setState callback to evaluate based on latest selections.
        
        setSelT1(currentSelT1 => {
            setSelT2(currentSelT2 => {
                let isCorrect1 = currentSelT1 === q1.answer;
                let isCorrect2 = currentSelT2 === q2.answer;
                
                if (isCorrect1) setScoreT1(s => s + 10);
                if (isCorrect2) setScoreT2(s => s + 10);

                // Show Feedback
                setFeedT1({ show: true, correct: isCorrect1, text: q1.explain || "Không có giải thích" });
                setFeedT2({ show: true, correct: isCorrect2, text: q2.explain || "Không có giải thích" });
                
                if (isCorrect1) playSFX('correct'); else { playSFX('wrong'); setShakeT1(true); }
                if (isCorrect2) playSFX('correct'); else { playSFX('wrong'); setShakeT2(true); }

                // Apply forces
                let t1Force = isCorrect1 ? 12 : -6; 
                let t2Force = isCorrect2 ? -12 : 6; 
                let netForce = t1Force + t2Force;
                
                gs.targetTugPosition += netForce; 
                if (netForce !== 0) { 
                    gs.recoilAmount = (netForce > 0 ? -15 : 15); 
                    playSFX('pull'); 
                }

                // Check win
                if (gs.targetTugPosition >= 100) gs.targetTugPosition = 100; 
                if (gs.targetTugPosition <= -100) gs.targetTugPosition = -100;
                
                if (gs.targetTugPosition >= 100 || gs.targetTugPosition <= -100) {
                    gs.isGameOver = true;
                    clearInterval(gs.timerInterval);
                    setTimeout(() => {
                        setWinTeam(gs.targetTugPosition >= 100 ? 1 : 2);
                        setWinMsg(`${gs.targetTugPosition >= 100 ? t1Name : t2Name} CHIẾN THẮNG!`);
                        setShowWin(true);
                    }, 1000);
                } else {
                    setTimeout(() => { 
                        if(gs.isGameOver) return; 
                        gs.roundIndex = (gs.roundIndex + 1) % activeQuizData.questions.length; 
                        startRound(); 
                    }, 3000);
                }
                
                return currentSelT2;
            });
            return currentSelT1;
        });
    };

    const handleOptionSelect = (team, optionKey) => {
        if (!gameState.current.isRoundActive || gameState.current.isPaused) return;
        if (!audioRef.current.isInit) initAudio();
        
        if (team === 1 && lockedT1) return;
        if (team === 2 && lockedT2) return;

        playSFX('click');
        
        if (team === 1) {
            setSelT1(optionKey);
            setTimeout(() => {
                if (!gameState.current.isRoundActive || gameState.current.isPaused) return;
                setLockedT1(true);
                setLockedT2(l2 => {
                    if (l2) evaluateRound();
                    return l2;
                });
            }, 300);
        } else {
            setSelT2(optionKey);
            setTimeout(() => {
                if (!gameState.current.isRoundActive || gameState.current.isPaused) return;
                setLockedT2(true);
                setLockedT1(l1 => {
                    if (l1) evaluateRound();
                    return l1;
                });
            }, 300);
        }
    };

    const togglePause = () => {
        const gs = gameState.current;
        if (gs.isGameOver || !gs.isRoundActive) return;
        gs.isPaused = !gs.isPaused;
        setShowPause(gs.isPaused);

        if (gs.isPaused) {
            clearInterval(gs.timerInterval);
            if (audioRef.current.ctx && audioRef.current.ctx.state === 'running') audioRef.current.ctx.suspend();
        } else {
            if (audioRef.current.ctx && audioRef.current.ctx.state === 'suspended' && !audioMuted) audioRef.current.ctx.resume();
            gs.timerInterval = setInterval(() => { 
                setTimeLeft(prev => {
                    if (prev <= 1) { evaluateRound(); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === 'p' || e.key === 'P') && screen === 'game') togglePause();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [screen]);

    const addTime = (secs) => {
        if (gameState.current.isGameOver || !gameState.current.isRoundActive) {
            showToast('Chỉ có thể cộng thời gian khi câu hỏi đang diễn ra!', 'error'); return;
        }
        setTimeLeft(t => t + secs);
        playSFX('click');
    };

    const returnToMenu = () => {
        setScreen('menu');
        gameState.current.isGameOver = true;
        clearInterval(gameState.current.timerInterval);
        if (audioRef.current.ctx) audioRef.current.ctx.suspend();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };

    // --- UPLOAD LOGIC ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsedData = JSON.parse(evt.target.result);
                if (!Array.isArray(parsedData) || parsedData.length === 0) throw new Error("File JSON phải chứa một mảng (array).");
                if (!parsedData[0].question || !parsedData[0].options || !parsedData[0].answer) throw new Error("Sai cấu trúc JSON.");
                setPendingUploadData(parsedData);
                setUploadName(file.name.replace('.json', ''));
                setShowSaveModal(true);
            } catch (err) {
                showToast('Lỗi đọc file: ' + err.message, 'error');
            }
            e.target.value = "";
        };
        reader.readAsText(file);
    };

    const confirmSaveUpload = () => {
        if (!uploadName.trim()) { showToast("Vui lòng nhập tên bài học!", "error"); return; }
        const newQuiz = { id: 'quiz_' + Date.now(), name: uploadName.trim(), questions: pendingUploadData };
        setQuizBank(prev => {
            const next = { ...prev };
            if (!next[uploadGrade]) next[uploadGrade] = [];
            next[uploadGrade].push(newQuiz);
            return next;
        });
        setShowSaveModal(false);
        setPendingUploadData(null);
        showToast(`Đã lưu "${uploadName}" vào Lớp ${uploadGrade}`, 'success');
    };

    const downloadTemplate = () => {
        const template = [{
            "id": 1, "question": "Câu hỏi mẫu: 1 + 1 bằng mấy?",
            "options": { "A": "1", "B": "2", "C": "3", "D": "4" },
            "answer": "B", "explain": "Giải thích: 1 + 1 = 2 theo toán học cơ bản."
        }];
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 4));
        const a = document.createElement('a');
        a.href = dataStr; a.download = "Mau_Cau_Hoi.json"; a.click();
    };

    const generatePrompt = () => {
        const promptText = `Hãy đóng vai là một giáo viên kinh nghiệm, biên soạn ngân hàng câu hỏi trắc nghiệm về chủ đề được yêu cầu.
BẮT BUỘC: Bạn phải trả về kết quả ĐÚNG định dạng mảng JSON (Array of Objects) chính xác theo mẫu dưới đây. KHÔNG giải thích, KHÔNG thêm bất kỳ văn bản markdown (như \`\`\`json) ở đầu hay cuối.

[
    {
        "id": 1,
        "question": "Nội dung câu hỏi?",
        "options": {
            "A": "Đáp án A", "B": "Đáp án B", "C": "Đáp án C", "D": "Đáp án D"
        },
        "answer": "A",
        "explain": "Giải thích ngắn gọn lý do chọn đáp án này."
    }
]`;
        setPromptResult(promptText);
    };

    const copyPrompt = () => {
        if (!promptResult) { showToast('Vui lòng tạo lệnh trước khi Copy!', 'error'); return; }
        if (promptInputRef.current) {
            promptInputRef.current.select();
            promptInputRef.current.setSelectionRange(0, 99999);
            try {
                document.execCommand('copy');
                showToast('Đã copy Lệnh vào Clipboard!', 'success');
            } catch (err) {
                showToast('Lỗi khi copy, vui lòng copy thủ công.', 'error');
            }
        }
    };

    const renderQuizTree = () => {
        return Object.keys(quizBank).map(grade => {
            const quizzes = quizBank[grade];
            return (
                <details key={grade} className="grade-details">
                    <summary className="grade-summary">Lớp {grade} ({quizzes.length} bài)</summary>
                    <ul className="quiz-list">
                        {quizzes.map(quiz => (
                            <li key={quiz.id} className={`quiz-item ${activeQuizData?.id === quiz.id ? 'active' : ''}`}>
                                <span style={{ flex: 1 }} onClick={() => setActiveQuizData(quiz)}>{quiz.name}</span>
                                <button className="btn-delete" onClick={(e) => {
                                    e.stopPropagation();
                                    setQuizBank(prev => {
                                        const next = {...prev};
                                        next[grade] = next[grade].filter(q => q.id !== quiz.id);
                                        return next;
                                    });
                                    if (activeQuizData?.id === quiz.id) setActiveQuizData(null);
                                    showToast('Đã xóa bài học', 'success');
                                }}>Xóa</button>
                            </li>
                        ))}
                    </ul>
                </details>
            );
        });
    };

    return (
        <div className="tug-app">
            
            {/* TOASTS */}
            <div id="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className="toast" style={t.type === 'error' ? { borderLeftColor: '#e84118' } : {}}>{t.message}</div>
                ))}
            </div>

            {/* MODALS */}
            {showSaveModal && (
                <div className="modal-overlay show">
                    <div className="modal-content">
                        <h3>Lưu Bài Học</h3>
                        <div className="input-group">
                            <label>Tên bài học:</label>
                            <input type="text" value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="Ví dụ: Ôn tập hô hấp tế bào" />
                        </div>
                        <div className="input-group">
                            <label>Chọn Khối Lớp:</label>
                            <select value={uploadGrade} onChange={e => setUploadGrade(e.target.value)}>
                                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Lớp {i+1}</option>)}
                            </select>
                        </div>
                        <div className="modal-btns">
                            <button className="btn-cancel" onClick={() => setShowSaveModal(false)}>Hủy</button>
                            <button className="btn-save" onClick={confirmSaveUpload}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {showPromptModal && (
                <div className="modal-overlay show">
                    <div className="modal-content prompt-content">
                        <h3>🪄 Tạo Lệnh (Prompt) Cho AI</h3>
                        <div className="input-group">
                            <label style={{ color: '#fbc531' }}>👇 Kết quả Lệnh (Copy & Dán vào AI):</label>
                            <textarea ref={promptInputRef} id="p-result" readOnly value={promptResult} placeholder="Bấm 'Tạo Lệnh' để lấy nội dung chuẩn JSON..." />
                        </div>
                        <div className="modal-btns">
                            <button className="btn-cancel" onClick={() => setShowPromptModal(false)}>Đóng</button>
                            <button className="btn-action" style={{ background: '#fbc531', color: '#2f3640', marginBottom: 0, fontWeight: 'bold' }} onClick={generatePrompt}>⚙️ Tạo Lệnh</button>
                            <button className="btn-save" onClick={copyPrompt}>📋 Copy Lệnh</button>
                        </div>
                    </div>
                </div>
            )}

            {/* LOBBY SCREEN */}
            {screen === 'menu' && (
                <div id="menu-screen">
                    <div className="menu-container">
                        <div className="tree-panel">
                            <h2>Ngân Hàng Câu Hỏi</h2>
                            <div className="tree-scroll">
                                <button className="btn-action btn-download mb-4" onClick={() => navigate('/games')}>⬅️ Quay lại Kho Game</button>
                                {renderQuizTree()}
                            </div>
                        </div>

                        <div className="control-panel">
                            <div className="control-group">
                                <h3>Cài đặt đội chơi</h3>
                                <div className="input-group">
                                    <label>Tên Đội 1 (Trái - Xanh):</label>
                                    <input type="text" value={t1Name} onChange={e => setT1Name(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label>Tên Đội 2 (Phải - Đỏ):</label>
                                    <input type="text" value={t2Name} onChange={e => setT2Name(e.target.value)} />
                                </div>
                            </div>

                            <div className="control-group">
                                <h3>Quản lý dữ liệu</h3>
                                <button className="btn-action btn-prompt" onClick={() => setShowPromptModal(true)}>🪄 Tạo Lệnh Nhờ AI Viết Bài</button>
                                <hr style={{ border: 0, borderTop: '1px dashed rgba(255,255,255,0.2)', margin: '15px 0' }} />
                                <input type="file" id="file-upload" accept=".json, .xlsx, .xls" style={{ display: 'none' }} onChange={handleFileUpload} />
                                <button className="btn-action btn-upload" onClick={() => document.getElementById('file-upload').click()}>📂 Tải lên File (JSON, Excel)</button>
                                <button className="btn-action btn-download" onClick={downloadTemplate}>⬇️ Tải File JSON Mẫu</button>
            <button className="btn-action" style={{ background: '#27ae60' }} onClick={() => {
                const ws = XLSX.utils.aoa_to_sheet([
                    ["Câu hỏi", "Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D", "Cột đúng (1-4)"],
                    ["Câu hỏi mẫu: 1 + 1 bằng mấy?", "1", "2", "3", "4", 2],
                    ["Nghiệm của phương trình $x^2 - 4 = 0$ là:", "$x = 2$", "$x = -2$", "$x = \\pm 2$", "Vô nghiệm", 3]
                ]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Câu Hỏi");
                XLSX.writeFile(wb, "Mau_Cau_Hoi.xlsx");
            }}>⬇️ Tải Excel Mẫu</button>
                            </div>

                            <div className="selected-info">
                                {activeQuizData ? `Đã chọn: ${activeQuizData.name} (${activeQuizData.questions.length} câu)` : "Chưa chọn bài học nào"}
                            </div>
                            
                            <button className="btn-action btn-start" disabled={!activeQuizData} onClick={startGameFromMenu}>🚀 BẮT ĐẦU TRÒ CHƠI</button>
                        </div>
                    </div>
                </div>
            )}

            {/* GAME SCREEN */}
            {screen === 'game' && (
                <div id="game-wrapper" style={{ '--font-scale': fontScale }}>
                    <header>
                        <div className="header-left">
                            <button className="icon-btn" title="Về Menu" onClick={() => {
                                if (document.fullscreenElement) document.exitFullscreen();
                                navigate('/games');
                            }}>🏠</button>
                            <button className="icon-btn" title="Tạm dừng / Tiếp tục (Phím P)" onClick={togglePause}>
                                {showPause ? '▶️' : '⏸️'} <small style={{ fontSize: '0.6em', marginLeft: '0.5cqw' }}>(P)</small>
                            </button>
                            <button className="icon-btn" title="Toàn màn hình" onClick={() => {
                                if (!document.fullscreenElement) {
                                    document.documentElement.requestFullscreen().catch(err => alert(err.message));
                                } else {
                                    document.exitFullscreen();
                                }
                            }}>🖵</button>
                            <div className="font-controls">
                                <button className="icon-btn" title="Giảm cỡ chữ" onClick={() => setFontScale(Math.max(MIN_FONT_SCALE, fontScale - 0.1))}>A-</button>
                                <button className="icon-btn" title="Tăng cỡ chữ" onClick={() => setFontScale(Math.min(MAX_FONT_SCALE, fontScale + 0.1))}>A+</button>
                            </div>
                            <span className="score-t1">{scoreT1}</span>
                        </div>
                        <div className="header-title">{activeQuizData?.name?.toUpperCase()}</div>
                        <div className="score-board">
                            <div className="time-controls">
                                <button className="time-btn" onClick={() => addTime(30)}>+30s</button>
                                <button className="time-btn" onClick={() => addTime(60)}>+1m</button>
                                <button className="time-btn" onClick={() => addTime(180)}>+3m</button>
                            </div>
                            <div className={`timer ${timeLeft <= 3 ? 'warning' : ''}`}>{timeLeft}</div>
                            <span className="score-t2">{scoreT2}</span>
                            <button className="icon-btn" title="Âm thanh" onClick={() => setAudioMuted(!audioMuted)}>{audioMuted ? '🔇' : '🔊'}</button>
                        </div>
                    </header>

                    <main>
                        {/* TEAM 1 */}
                        <section className={`panel panel-t1 ${shakeT1 ? 'shake' : ''}`} onAnimationEnd={() => setShakeT1(false)}>
                            <div className="panel-header">{t1Name}</div>
                            <div className="question-box">
                                <div className="question-text">{qT1?.question || "Loading..."}</div>
                            </div>
                            <div className="options-grid">
                                {qT1 && Object.entries(qT1.options).map(([key, val]) => {
                                    let btnClass = 'btn-option';
                                    if (selT1 === key) btnClass += ' selected';
                                    if (feedT1.show && qT1.answer === key) btnClass += ' correct';
                                    else if (feedT1.show && selT1 === key) btnClass += ' wrong';
                                    
                                    return (
                                        <button key={key} className={btnClass} disabled={lockedT1} onClick={() => handleOptionSelect(1, key)}>
                                            {key}: {val}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className={`feedback-overlay ${feedT1.show ? 'show' : ''}`}>
                                <div className={`feedback-icon ${feedT1.correct ? 'icon-correct' : 'icon-wrong'}`}>
                                    {feedT1.correct ? '✓' : '✕'}
                                </div>
                                <div className="explanation-text">{feedT1.text}</div>
                            </div>
                        </section>

                        {/* ARENA SVG */}
                        <section className="arena">
                            <div className="center-line"></div>
                            <svg className="svg-container" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
                                <g ref={ropeRef} transform="translate(0, 0)">
                                    <line x1="100" y1="350" x2="900" y2="350" stroke="#715842" strokeWidth="12" strokeLinecap="round"/>
                                    <polygon points="500,320 525,350 500,380 475,350" fill="#fbc531" stroke="#e1b12c" strokeWidth="3"/>
                                    
                                    {/* TEAM 1 CHARACTERS */}
                                    <g>
                                        <g transform="translate(350, 270)">
                                            <circle cx="0" cy="0" r="25" fill="#00a8ff" stroke="#192a56" strokeWidth="3"/>
                                            <line x1="0" y1="25" x2="-20" y2="80" stroke="#00a8ff" strokeWidth="15" strokeLinecap="round"/>
                                            <line x1="-20" y1="80" x2="-40" y2="130" stroke="#192a56" strokeWidth="10" strokeLinecap="round"/>
                                            <line x1="-20" y1="80" x2="10" y2="130" stroke="#192a56" strokeWidth="10" strokeLinecap="round"/>
                                            <path d="M 0 40 Q 30 50 60 75" fill="none" stroke="#00a8ff" strokeWidth="10" strokeLinecap="round"/>
                                        </g>
                                        <g transform="translate(200, 270)">
                                            <circle cx="0" cy="0" r="25" fill="#00a8ff" stroke="#192a56" strokeWidth="3"/>
                                            <line x1="0" y1="25" x2="-20" y2="80" stroke="#00a8ff" strokeWidth="15" strokeLinecap="round"/>
                                            <line x1="-20" y1="80" x2="-40" y2="130" stroke="#192a56" strokeWidth="10" strokeLinecap="round"/>
                                            <line x1="-20" y1="80" x2="10" y2="130" stroke="#192a56" strokeWidth="10" strokeLinecap="round"/>
                                            <path d="M 0 40 Q 30 50 60 75" fill="none" stroke="#00a8ff" strokeWidth="10" strokeLinecap="round"/>
                                        </g>
                                    </g>

                                    {/* TEAM 2 CHARACTERS */}
                                    <g>
                                        <g transform="translate(650, 270)">
                                            <circle cx="0" cy="0" r="25" fill="#e84118" stroke="#2f3640" strokeWidth="3"/>
                                            <line x1="0" y1="25" x2="20" y2="80" stroke="#e84118" strokeWidth="15" strokeLinecap="round"/>
                                            <line x1="20" y1="80" x2="40" y2="130" stroke="#2f3640" strokeWidth="10" strokeLinecap="round"/>
                                            <line x1="20" y1="80" x2="-10" y2="130" stroke="#2f3640" strokeWidth="10" strokeLinecap="round"/>
                                            <path d="M 0 40 Q -30 50 -60 75" fill="none" stroke="#e84118" strokeWidth="10" strokeLinecap="round"/>
                                        </g>
                                        <g transform="translate(800, 270)">
                                            <circle cx="0" cy="0" r="25" fill="#e84118" stroke="#2f3640" strokeWidth="3"/>
                                            <line x1="0" y1="25" x2="20" y2="80" stroke="#e84118" strokeWidth="15" strokeLinecap="round"/>
                                            <line x1="20" y1="80" x2="40" y2="130" stroke="#2f3640" strokeWidth="10" strokeLinecap="round"/>
                                            <line x1="20" y1="80" x2="-10" y2="130" stroke="#2f3640" strokeWidth="10" strokeLinecap="round"/>
                                            <path d="M 0 40 Q -30 50 -60 75" fill="none" stroke="#e84118" strokeWidth="10" strokeLinecap="round"/>
                                        </g>
                                    </g>
                                </g>
                            </svg>
                        </section>

                        {/* TEAM 2 */}
                        <section className={`panel panel-t2 ${shakeT2 ? 'shake' : ''}`} onAnimationEnd={() => setShakeT2(false)}>
                            <div className="panel-header">{t2Name}</div>
                            <div className="question-box">
                                <div className="question-text">{qT2?.question || "Loading..."}</div>
                            </div>
                            <div className="options-grid">
                                {qT2 && Object.entries(qT2.options).map(([key, val]) => {
                                    let btnClass = 'btn-option';
                                    if (selT2 === key) btnClass += ' selected';
                                    if (feedT2.show && qT2.answer === key) btnClass += ' correct';
                                    else if (feedT2.show && selT2 === key) btnClass += ' wrong';
                                    
                                    return (
                                        <button key={key} className={btnClass} disabled={lockedT2} onClick={() => handleOptionSelect(2, key)}>
                                            {key}: {val}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className={`feedback-overlay ${feedT2.show ? 'show' : ''}`}>
                                <div className={`feedback-icon ${feedT2.correct ? 'icon-correct' : 'icon-wrong'}`}>
                                    {feedT2.correct ? '✓' : '✕'}
                                </div>
                                <div className="explanation-text">{feedT2.text}</div>
                            </div>
                        </section>
                    </main>

                    {/* OVERLAYS */}
                    {showPause && (
                        <div id="pause-overlay" className="show">TẠM DỪNG</div>
                    )}

                    {showWin && (
                        <div id="win-overlay" className="show">
                            <div className={`win-title win-t${winTeam}`}>{winMsg}</div>
                            <div className="win-buttons">
                                <button id="btn-play-again" onClick={initGame}>Chơi Lại Bài Này</button>
                                <button id="btn-back-menu" onClick={returnToMenu}>Về Menu Chính</button>
                            </div>
                        </div>
                    )}

                    {showTutorial && (
                        <div id="tutorial-overlay" className="show">
                            <div className="tutorial-content">
                                <h2>📜 HƯỚNG DẪN LUẬT CHƠI</h2>
                                <ul className="tutorial-list">
                                    <li><span>🎯</span> <b>Mục tiêu:</b> Trả lời đúng và nhanh để kéo cờ về phía đội mình.</li>
                                    <li><span>✅</span> <b>Trả lời đúng:</b> Tăng lực kéo mạnh mẽ!</li>
                                    <li><span>❌</span> <b>Trả lời sai:</b> Bị trượt chân và kéo ngược lại.</li>
                                    <li><span>⏱️</span> <b>Thời gian:</b> Mỗi câu hỏi có giới hạn thời gian, hãy nhanh tay!</li>
                                    <li><span>⏸️</span> <b>Phím tắt:</b> Nhấn phím <b>P</b> để Tạm dừng / Tiếp tục.</li>
                                </ul>
                                <button id="btn-start-real-game" onClick={startRealGame}>SẴN SÀNG CHIẾN ĐẤU! ⚔️</button>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default TugOfWarGame;
