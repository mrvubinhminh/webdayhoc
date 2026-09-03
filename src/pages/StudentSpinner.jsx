import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Maximize } from 'lucide-react';

const baseColors = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"];
const prizeColor = "#facc15"; // Gold

const soundNotes = {
    marioCoin: [1046.50], mario1Up: [659.25, 783.99, 1318.51, 1046.50, 1396.91, 1567.98],
    journeyTick: [330, 220], journeyWin: [523.25, 659.25, 783.99, 880.00, 1046.50],
    defaultWin: [261.63, 329.63, 392.00], arcadeTicks: [1244.51, 1396.91, 1567.98, 1760.00],
    arcadeWin: [523.25, 659.25, 783.99, 1046.50], musicalTicks: [523.25, 587.33, 659.25, 783.99, 880.00],
    musicalWin: [523.25, 659.25, 783.99, 1046.50], prizeWin: [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50, 1318.51]
};

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

const StudentSpinner = () => {
    const navigate = useNavigate();

    // Canvas Refs
    const wheelCanvasRef = useRef(null);
    const confettiCanvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const audioCtxRef = useRef(null);

    // --- State ---
    const [namesInput, setNamesInput] = useState('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [resultHTML, setResultHTML] = useState('');
    const [classLists, setClassLists] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('studentClassLists'));
            if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) return saved;
        } catch (e) {}
        return {'Danh sách mặc định': "An\nBình\nCường\nDũng\nEm\nGiang\nHương"};
    });
    const [currentClass, setCurrentClass] = useState(() => {
        return localStorage.getItem('currentClassName') || 'Danh sách mặc định';
    });

    const [history, setHistory] = useState(() => {
        try {
            const h = JSON.parse(localStorage.getItem('spinHistory'));
            return Array.isArray(h) ? h : [];
        } catch(e) { return []; }
    });

    const [settings, setSettings] = useState(() => {
        return {
            removeWinner: localStorage.getItem('removeWinner') === 'true',
            prizeMode: localStorage.getItem('prizeMode') === 'true',
            soundMode: localStorage.getItem('soundMode') || 'default',
            spinMode: localStorage.getItem('spinMode') || 'classic',
        };
    });

    // --- Mutable Animation State ---
    const animState = useRef({
        names: [], colors: [], rotation: 0, spinSpeed: 0,
        lastTickAngle: 0, prizeName: null, confetti: [],
        isSuspenseAnimating: false, suspenseStartTime: 0, suspenseDuration: 2500,
        startRotation: 0, targetRotation: 0, isSpinningRef: false
    });

    // --- Audio Init ---
    const initAudio = () => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtxRef.current = new AudioContext();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const playSound = (notes, duration = 0.1, type = 'sine') => {
        if (!audioCtxRef.current || settings.soundMode === 'mute') return;
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;
        notes.forEach((note, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = type; o.frequency.value = note;
            g.gain.setValueAtTime(0.5, now + i * duration);
            g.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * duration);
            o.start(now + i * duration); o.stop(now + (i + 1) * duration);
        });
    };

    const playTickSound = (speed) => {
        if (!audioCtxRef.current || settings.soundMode !== 'default') return;
        const ctx = audioCtxRef.current;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.value = 500 + speed * 1500;
        g.gain.setValueAtTime(0.5, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.1);
    };

    // --- Core Methods ---
    const getNames = useCallback(() => {
        return namesInput.split('\n').map(n => n.trim()).filter(n => n);
    }, [namesInput]);

    const saveClassLists = (newLists) => {
        localStorage.setItem('studentClassLists', JSON.stringify(newLists));
    };

    const triggerConfetti = () => {
        animState.current.confetti = [];
        const canvas = confettiCanvasRef.current;
        if (!canvas) return;
        for (let i = 0; i < 150; i++) {
            animState.current.confetti.push({
                x: canvas.clientWidth / 2, y: canvas.clientHeight / 2,
                vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10 - 5,
                radius: Math.random() * 4 + 2, 
                color: baseColors[Math.floor(Math.random() * baseColors.length)], 
                alpha: 1,
            });
        }
    };

    // --- Drawing ---
    const drawWheel = useCallback(() => {
        const canvas = wheelCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        
        // Reset scale on each draw is bad, so we handle it by clearing and using transform
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const names = getNames();
        if (names.length === 0) return;
        
        const colors = names.map((_, i) => baseColors[i % baseColors.length]);
        const arcSize = (2 * Math.PI) / names.length;
        const centerX = (rect.width * dpr) / 2;
        const centerY = (rect.height * dpr) / 2;
        const radius = Math.min(centerX, centerY) * 0.9;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(animState.current.rotation);
        
        for (let i = 0; i < names.length; i++) {
            const isPrize = settings.prizeMode && names[i] === animState.current.prizeName;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, i * arcSize, (i + 1) * arcSize);
            ctx.closePath();
            ctx.fillStyle = isPrize ? prizeColor : colors[i];
            ctx.fill();
            
            ctx.save();
            ctx.rotate(i * arcSize + arcSize / 2);
            ctx.fillStyle = isPrize ? "#1f2937" : "white";
            ctx.font = `bold ${Math.min(24, radius / 8)}px 'Inter'`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "rgba(0,0,0,0.3)";
            ctx.shadowBlur = 4;
            const text = isPrize ? `★ ${names[i]} ★` : names[i];
            ctx.fillText(text, radius * 0.6, 0);
            ctx.restore();
        }
        ctx.restore();
    }, [getNames, settings.prizeMode]);

    const updateAndDrawConfetti = () => {
        const canvas = confettiCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        animState.current.confetti.forEach((p, i) => {
            p.vy += 0.2; p.x += p.vx; p.y += p.vy; p.alpha -= 0.01;
            if (p.alpha <= 0) animState.current.confetti.splice(i, 1);
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.beginPath(); 
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); 
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    };

    const setupCanvases = useCallback(() => {
        const dpr = window.devicePixelRatio || 1;
        const rect = wheelCanvasRef.current.parentElement.getBoundingClientRect();
        
        [wheelCanvasRef.current, confettiCanvasRef.current].forEach(canvas => {
            if(canvas) {
                canvas.width = rect.width * dpr; 
                canvas.height = rect.height * dpr;
            }
        });
        drawWheel();
    }, [drawWheel]);

    // --- Animation Loop ---
    const animate = useCallback(() => {
        const state = animState.current;
        if (state.isSuspenseAnimating) {
            const progress = Math.min((performance.now() - state.suspenseStartTime) / state.suspenseDuration, 1);
            state.rotation = state.startRotation + (state.targetRotation - state.startRotation) * easeOutCubic(progress);
            if (progress >= 1) onSpinEnd();
        } else if (state.isSpinningRef) {
            state.rotation += state.spinSpeed; 
            state.spinSpeed *= 0.992;
            const namesCount = getNames().length || 1;
            const arcSize = (2 * Math.PI) / namesCount;
            const currentAngle = Math.floor(state.rotation / arcSize);
            
            if (currentAngle !== state.lastTickAngle) {
                const randomNote = (notes) => [notes[Math.floor(Math.random() * notes.length)]];
                const soundMap = { 
                    mario: soundNotes.marioCoin, journey: soundNotes.journeyTick, 
                    arcade: randomNote(soundNotes.arcadeTicks), musical: randomNote(soundNotes.musicalTicks) 
                };
                const typeMap = { journey: 'square', arcade: 'square' };
                if (soundMap[settings.soundMode]) playSound(soundMap[settings.soundMode], 0.05, typeMap[settings.soundMode] || 'sine');
                else if (settings.soundMode === 'default' && audioCtxRef.current) playTickSound(state.spinSpeed);
                state.lastTickAngle = currentAngle;
            }
            if (state.spinSpeed < 0.005 && settings.spinMode === 'suspense') {
                state.isSpinningRef = false; 
                state.isSuspenseAnimating = true;
                state.suspenseStartTime = performance.now();
                state.startRotation = state.rotation;
                const randomOvershoot = arcSize * (1 + Math.random() * 1.5);
                state.targetRotation = state.rotation + randomOvershoot;
            } else if (state.spinSpeed < 0.001) {
                onSpinEnd();
            }
        }
        
        drawWheel();
        if (state.confetti.length > 0) updateAndDrawConfetti();
        
        animationFrameRef.current = requestAnimationFrame(animate);
    }, [drawWheel, getNames, settings]);

    // Ensure loop starts and stops
    useEffect(() => {
        setupCanvases();
        window.addEventListener('resize', setupCanvases);
        animationFrameRef.current = requestAnimationFrame(animate);
        return () => {
            window.removeEventListener('resize', setupCanvases);
            cancelAnimationFrame(animationFrameRef.current);
            if(audioCtxRef.current) audioCtxRef.current.close();
        };
    }, [setupCanvases, animate]);

    // Initial Load Data to text area
    useEffect(() => {
        if(!namesInput && classLists[currentClass]) {
            setNamesInput(classLists[currentClass]);
        }
    }, [currentClass, classLists]);

    // Update canvas whenever text area changes
    useEffect(() => {
        if(!animState.current.isSpinningRef) {
            animState.current.rotation = 0;
            setResultHTML('');
            drawWheel();
            
            // Auto save
            if(namesInput !== classLists[currentClass]) {
                const newLists = {...classLists, [currentClass]: namesInput};
                setClassLists(newLists);
                saveClassLists(newLists);
            }
        }
    }, [namesInput, drawWheel]);

    // --- Spin Logic ---
    const getWinner = () => {
         const names = getNames();
         const totalAngle = 2 * Math.PI;
         const pointerAngle = (totalAngle * 3/4); // The pointer is at the top (270 degrees = 3/4 PI in canvas)
         const effectiveRotation = animState.current.rotation % totalAngle;
         let finalAngle = (pointerAngle - effectiveRotation + totalAngle) % totalAngle;
         return names[Math.floor(finalAngle / (totalAngle / names.length))];
    };

    const onSpinEnd = () => {
        animState.current.isSpinningRef = false; 
        animState.current.isSuspenseAnimating = false;
        setIsSpinning(false);
        
        const winner = getWinner();
        if(!winner) return;

        const isPrize = settings.prizeMode && winner === animState.current.prizeName;
        let html = `<span style="font-size: 2rem; text-align: center; display: block; font-weight: bold;">`;
        if (isPrize) html += `🎁 PHẦN THƯỞNG! 🎁<br/>`;
        html += `🎉 ${winner} 🎉</span>`;
        setResultHTML(html);
        
        triggerConfetti();
        playSound(isPrize ? soundNotes.prizeWin : (soundNotes[`${settings.soundMode}Win`] || soundNotes.defaultWin), 0.08);
        
        const newHistory = [winner, ...history].slice(0, 5);
        setHistory(newHistory);
        localStorage.setItem('spinHistory', JSON.stringify(newHistory));

        if (settings.removeWinner) {
            const remaining = getNames().filter(n => n !== winner).join('\n');
            setNamesInput(remaining); // Will trigger useEffect and redraw
        }
    };

    const handleSpin = () => {
        if (isSpinning || getNames().length < 2) return;
        initAudio();
        setIsSpinning(true);
        animState.current.isSpinningRef = true;
        animState.current.isSuspenseAnimating = false;
        setResultHTML('');
        animState.current.spinSpeed = Math.random() * 0.4 + 0.4;
        
        if (settings.prizeMode) {
            const names = getNames();
            animState.current.prizeName = names.length > 0 ? names[Math.floor(Math.random() * names.length)] : null;
        }
    };

    // --- Grouping ---
    const createGroups = (groupSize) => {
        initAudio(); 
        const names = getNames();
        if (names.length < groupSize) {
            setResultHTML(`<span style="font-size: 1.25rem; text-align: center; display: block;">Không đủ học sinh để chia nhóm ${groupSize}.</span>`);
            return;
        }
        const shuffled = [...names].sort(() => Math.random() - 0.5);
        const groups = Array.from({length: Math.ceil(names.length / groupSize)}, (_, i) => shuffled.slice(i * groupSize, i * groupSize + groupSize));
        
        let html = `<h3 class="text-xl font-bold mb-4 text-center text-white">Kết quả chia nhóm (${groupSize} người)</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-base">`;
        groups.forEach((g, i) => {
            html += `<div class="bg-white/20 p-3 rounded-lg"><h4 class="font-bold text-white mb-2 border-b border-white/30 pb-1">Nhóm ${i + 1}</h4><ul class="list-disc list-inside text-white">${g.map(m => `<li>${m}</li>`).join('')}</ul></div>`;
        });
        html += '</div>';
        setResultHTML(html);
        triggerConfetti(); 
        playSound(soundNotes[`${settings.soundMode}Win`] || soundNotes.defaultWin, 0.08);
    };

    // --- Class Lists Logic ---
    const handleSaveNewList = () => {
        const className = prompt('Nhập tên danh sách mới:', 'Lớp 12A1');
        if (className && !classLists[className]) {
            const newLists = {...classLists, [className]: namesInput};
            setClassLists(newLists);
            setCurrentClass(className);
            localStorage.setItem('currentClassName', className);
            saveClassLists(newLists);
        } else if (className) {
            alert('Tên danh sách này đã tồn tại!');
        }
    };

    const handleDeleteList = () => {
        if (Object.keys(classLists).length <= 1) {
            alert('Không thể xóa danh sách cuối cùng.'); return;
        }
        if (window.confirm(`Bạn có chắc chắn muốn xóa danh sách "${currentClass}" không?`)) {
            const newLists = {...classLists};
            delete newLists[currentClass];
            const nextClass = Object.keys(newLists)[0];
            setClassLists(newLists);
            setCurrentClass(nextClass);
            setNamesInput(newLists[nextClass]);
            localStorage.setItem('currentClassName', nextClass);
            saveClassLists(newLists);
        }
    };

    const updateSetting = (key, value) => {
        const next = {...settings, [key]: value};
        setSettings(next);
        localStorage.setItem(key, String(value));
        if(key === 'prizeMode') {
            setTimeout(drawWheel, 0); // redraw after render
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 md:p-8 font-sans pb-24">
            
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => {
                    if (document.fullscreenElement) document.exitFullscreen();
                    navigate('/games');
                }} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Về Kho Trò Chơi
                </button>
                <button onClick={() => {
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch(err => alert(err.message));
                    } else {
                        document.exitFullscreen();
                    }
                }} className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-bold transition-colors">
                    <Maximize className="w-4 h-4" /> Toàn màn hình
                </button>
            </div>

            <header className="text-center mb-8">
                <h1 className="text-3xl md:text-5xl font-black text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow-sm">Vòng Quay Kì Diệu</h1>
                <p className="text-lg text-gray-500 mt-2 font-medium">Trợ lý gọi tên học sinh & chia nhóm ngẫu nhiên</p>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                {/* Cột Trái: Canvas */}
                <div className="relative w-full aspect-square max-w-[600px] mx-auto">
                    <div className="absolute inset-0 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.1)]">
                        <canvas ref={wheelCanvasRef} className="w-full h-full block absolute top-0 left-0 rounded-full"></canvas>
                        <canvas ref={confettiCanvasRef} className="w-full h-full block absolute top-0 left-0 pointer-events-none rounded-full"></canvas>
                    </div>
                    {/* Cây kim (Pointer) */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[20%] z-10 filter drop-shadow-xl">
                        <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M30 80C30 80 60 48.9509 60 30C60 13.4315 46.5685 0 30 0C13.4315 0 0 13.4315 0 30C0 48.9509 30 80 30 80Z" fill="#ef4444"/>
                            <circle cx="30" cy="30" r="12" fill="white"/>
                        </svg>
                    </div>
                </div>

                {/* Cột Phải: Bảng điều khiển */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col space-y-6">
                    
                    {/* Class Management */}
                    <div>
                        <label className="font-bold text-lg mb-2 block text-gray-700">Quản lý lớp học:</label>
                        <div className="flex items-center gap-2">
                            <select 
                                value={currentClass} 
                                onChange={e => {
                                    setCurrentClass(e.target.value);
                                    localStorage.setItem('currentClassName', e.target.value);
                                    setNamesInput(classLists[e.target.value]);
                                }}
                                className="flex-1 rounded-xl border-2 border-gray-200 bg-gray-50 py-3 px-4 focus:border-blue-500 focus:ring-0 font-medium"
                            >
                                {Object.keys(classLists).map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                            <button onClick={handleSaveNewList} title="Lưu danh sách mới" className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-xl transition-colors">
                                <Save className="w-6 h-6" />
                            </button>
                            <button onClick={handleDeleteList} title="Xóa danh sách này" className="p-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors">
                                <Trash2 className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Text Area */}
                    <div>
                        <label className="font-bold text-lg mb-2 block text-gray-700">Danh sách tên (mỗi tên một dòng):</label>
                        <textarea 
                            value={namesInput}
                            onChange={e => setNamesInput(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-4 min-h-[150px] font-medium resize-y focus:border-blue-500 focus:ring-0"
                            placeholder="Nhập tên học sinh vào đây..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            disabled={isSpinning}
                            onClick={handleSpin}
                            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-black text-xl py-4 rounded-xl shadow-[0_6px_0_#16a34a] disabled:shadow-none active:translate-y-[6px] active:shadow-none transition-all uppercase tracking-wider"
                        >
                            Quay!
                        </button>
                        <button 
                            disabled={isSpinning}
                            onClick={() => { setNamesInput(''); setTimeout(() => setResultHTML(''), 0); }}
                            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-black text-xl py-4 rounded-xl shadow-[0_6px_0_#c2410c] disabled:shadow-none active:translate-y-[6px] active:shadow-none transition-all uppercase tracking-wider"
                        >
                            Làm mới
                        </button>
                    </div>

                    {/* Result Display */}
                    <div 
                        className={`bg-indigo-600 text-white p-6 rounded-2xl transition-all duration-500 ease-out origin-top shadow-lg overflow-hidden ${resultHTML ? 'scale-100 opacity-100 max-h-[500px]' : 'scale-0 opacity-0 max-h-0 py-0'}`}
                        dangerouslySetInnerHTML={{ __html: resultHTML }}
                    />

                    {/* Grouping */}
                    <div className="border-t border-gray-100 pt-6">
                        <h4 className="font-bold text-gray-700 mb-3 text-center uppercase tracking-wide text-sm">Hoặc chia nhóm ngẫu nhiên</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => createGroups(4)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 rounded-xl border border-blue-200 transition-colors">Nhóm 4</button>
                            <button onClick={() => createGroups(6)} className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-3 rounded-xl border border-purple-200 transition-colors">Nhóm 6</button>
                            <button onClick={() => createGroups(8)} className="bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold py-3 rounded-xl border border-pink-200 transition-colors">Nhóm 8</button>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="border-t border-gray-100 pt-6 space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={settings.removeWinner} onChange={e => updateSetting('removeWinner', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer" />
                            <span className="font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">Xóa tên người vừa quay trúng</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={settings.prizeMode} onChange={e => updateSetting('prizeMode', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer" />
                            <span className="font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">Bật ô phần thưởng đặc biệt ★</span>
                        </label>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-1">Chế độ quay</label>
                                <select value={settings.spinMode} onChange={e => updateSetting('spinMode', e.target.value)} className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 py-2 px-3 focus:border-indigo-500 font-medium">
                                    <option value="classic">Cổ điển</option>
                                    <option value="suspense">Hồi hộp</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-1">Âm thanh</label>
                                <select value={settings.soundMode} onChange={e => updateSetting('soundMode', e.target.value)} className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 py-2 px-3 focus:border-indigo-500 font-medium">
                                    <option value="default">Mặc định</option>
                                    <option value="mario">Mario</option>
                                    <option value="journey">Tây Du Ký</option>
                                    <option value="arcade">Arcade</option>
                                    <option value="musical">Nhạc cụ</option>
                                    <option value="mute">Tắt tiếng</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    {history.length > 0 && (
                        <div className="border-t border-gray-100 pt-6">
                            <h4 className="font-bold text-gray-500 mb-3 text-center uppercase tracking-wide text-xs">Lịch sử quay gần đây</h4>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {history.map((name, i) => (
                                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200">{name}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentSpinner;
