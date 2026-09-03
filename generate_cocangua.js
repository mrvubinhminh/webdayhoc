import fs from 'fs';
import path from 'path';

const html = `<!DOCTYPE html>
<html lang="vi" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game cờ cá ngựa</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background-color: #0f172a; color: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; overflow: hidden; margin: 0; padding: 0; }
        .glass-panel { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5); }
        .btn-action { background: linear-gradient(135deg, #8b5cf6, #d946ef); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.3s; width: 100%; text-transform: uppercase; }
        .btn-action:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(217, 70, 239, 0.4); }
        .btn-dice { background: linear-gradient(135deg, #06b6d4, #0ea5e9); color: white; border: none; padding: 15px 30px; border-radius: 12px; font-size: 1.2rem; font-weight: bold; cursor: pointer; box-shadow: 0 0 20px rgba(6, 182, 212, 0.6); width: 100%; transition: all 0.2s; }
        .btn-dice:active { transform: scale(0.95); }
        
        /* Question Modal */
        #question-modal { display: none; position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.9); flex-direction: column; }
        #question-modal.active { display: flex; }
        .question-box { flex: 1.5; padding: 4vh 4vw; display: flex; align-items: center; justify-content: center; }
        .question-text { font-size: 5vh; font-weight: bold; color: white; text-align: center; }
        .options-grid { height: 55%; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 2vh; padding: 2vh 4vw 4vh 4vw; }
        .btn-option { background: white; color: #1e293b; border: none; border-radius: 16px; font-size: 3.5vh; font-weight: bold; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 0 #cbd5e1; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px; }
        .btn-option:active { transform: translateY(8px); box-shadow: none; }
        .btn-option.correct { background: #10b981; color: white; box-shadow: 0 8px 0 #059669; }
        .btn-option.wrong { background: #ef4444; color: white; box-shadow: 0 8px 0 #b91c1c; opacity: 0.7; }
        
        /* Ludo Board Simplified */
        .board { width: 60vh; height: 60vh; background: #1e293b; border-radius: 20px; position: relative; padding: 20px; border: 2px solid #334155; }
        .base { position: absolute; width: 40%; height: 40%; border-radius: 15px; border: 4px solid; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; padding: 10px; gap: 10px; }
        .base-0 { top: 20px; left: 20px; border-color: #ef4444; }
        .base-1 { top: 20px; right: 20px; border-color: #06b6d4; }
        .base-2 { bottom: 20px; right: 20px; border-color: #eab308; }
        .base-3 { bottom: 20px; left: 20px; border-color: #22c55e; }
        
        .horse { width: 30px; height: 40px; background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M22 28v2H10v-2h12zm-2-2H12v-2h8v2zm-1-8c0-3.3-2-6.2-5-7.5V7c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2v3.5C8 9.8 6 12.7 6 16c0 1.9.7 3.6 2 5v3h16v-3c1.3-1.4 2-3.1 2-5z"/></svg>'); background-size: cover; filter: drop-shadow(0 0 5px currentColor); transition: all 0.5s; position: absolute; transform: translate(-50%, -50%); }
        .horse-0 { color: #ef4444; }
        .horse-1 { color: #06b6d4; }
        .horse-2 { color: #eab308; }
        .horse-3 { color: #22c55e; }
        
        /* Path */
        .path-cell { position: absolute; width: 40px; height: 40px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; transform: translate(-50%, -50%); }
        
        .team-panel { width: 200px; padding: 15px; border-radius: 12px; margin-bottom: 15px; background: rgba(30, 41, 59, 0.8); border-left: 4px solid; display: flex; align-items: center; gap: 15px; }
        .team-panel-0 { border-color: #ef4444; }
        .team-panel-1 { border-color: #06b6d4; }
        .team-panel-2 { border-color: #eab308; }
        .team-panel-3 { border-color: #22c55e; }
        
        .dice { font-size: 60px; color: white; display: flex; justify-content: center; margin: 20px 0; animation: none; }
        @keyframes roll { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .rolling { animation: roll 0.5s infinite; }
    </style>
</head>
<body>

    <!-- Setup Screen -->
    <div id="setup-screen" class="min-h-screen flex items-center justify-center relative">
        <div class="glass-panel p-8 w-full max-w-md z-10">
            <h1 class="text-3xl font-black text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">ĐĂNG KÝ THẦN MÃ</h1>
            <p class="text-center text-slate-400 mb-8 text-sm">Toán 11: Đạo Hàm - Cập Nhật Lỗi Màn Hình Đen</p>
            
            <div class="space-y-4 mb-6">
                <div class="flex items-center bg-slate-900 rounded-lg p-2 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                    <div class="w-10 h-10 flex items-center justify-center text-red-500 text-xl"><i class="fas fa-chess-knight"></i></div>
                    <input type="text" id="team0" value="Huyết Mã" class="bg-transparent border-none outline-none text-white px-2 flex-1 font-bold">
                </div>
                <div class="flex items-center bg-slate-900 rounded-lg p-2 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    <div class="w-10 h-10 flex items-center justify-center text-cyan-500 text-xl"><i class="fas fa-chess-knight"></i></div>
                    <input type="text" id="team1" value="Băng Mã" class="bg-transparent border-none outline-none text-white px-2 flex-1 font-bold">
                </div>
                <div class="flex items-center bg-slate-900 rounded-lg p-2 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                    <div class="w-10 h-10 flex items-center justify-center text-yellow-500 text-xl"><i class="fas fa-chess-knight"></i></div>
                    <input type="text" id="team2" value="Kim Mã" class="bg-transparent border-none outline-none text-white px-2 flex-1 font-bold">
                </div>
                <div class="flex items-center bg-slate-900 rounded-lg p-2 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                    <div class="w-10 h-10 flex items-center justify-center text-green-500 text-xl"><i class="fas fa-chess-knight"></i></div>
                    <input type="text" id="team3" value="Mộc Mã" class="bg-transparent border-none outline-none text-white px-2 flex-1 font-bold">
                </div>
            </div>
            
            <button class="btn-action mb-4" onclick="document.getElementById('file-upload').click()">Tải File (JSON, Excel)</button>
            <input type="file" id="file-upload" accept=".json, .xlsx, .xls" style="display: none;" onchange="handleFileUpload(event)">
            <button class="btn-action mb-4" style="background:#27ae60" onclick="downloadSampleExcel()">⬇️ Tải Excel Mẫu</button>
            <button class="btn-action" onclick="startGame()"><i class="fas fa-play mr-2"></i> KHỞI TRANH</button>
        </div>
    </div>

    <!-- Main Game -->
    <div id="game-screen" class="hidden min-h-screen p-4 flex flex-col">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">ĐẤU TRƯỜNG ĐẠO HÀM</h1>
            <div class="flex gap-2" id="top-ranks">
                <!-- Ranks -->
            </div>
            <button class="bg-red-900/50 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg font-bold" onclick="location.reload()"><i class="fas fa-stop-circle mr-2"></i> DỪNG</button>
        </div>
        
        <div class="flex flex-1 gap-8 items-center justify-center">
            <!-- Left Teams -->
            <div class="flex flex-col gap-4">
                <div class="team-panel team-panel-0" id="tp-0">
                    <div class="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-red-500 font-black text-xl">H</div>
                    <div>
                        <div class="font-bold text-red-500 name">Huyết Mã</div>
                        <div class="text-xs text-slate-400">Rank: <span class="rank">#1</span></div>
                        <div class="text-xs mt-1 bg-slate-800 px-2 py-1 rounded w-32 text-center steps">0 bước</div>
                    </div>
                </div>
                <div class="team-panel team-panel-3" id="tp-3">
                    <div class="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-green-500 font-black text-xl">M</div>
                    <div>
                        <div class="font-bold text-green-500 name">Mộc Mã</div>
                        <div class="text-xs text-slate-400">Rank: <span class="rank">#4</span></div>
                        <div class="text-xs mt-1 bg-slate-800 px-2 py-1 rounded w-32 text-center steps">0 bước</div>
                    </div>
                </div>
            </div>
            
            <!-- Board -->
            <div class="board" id="ludo-board">
                <div class="base base-0" id="base-0"></div>
                <div class="base base-1" id="base-1"></div>
                <div class="base base-2" id="base-2"></div>
                <div class="base base-3" id="base-3"></div>
                
                <div class="absolute inset-0" id="path-cells"></div>
                <div class="absolute inset-0" id="horses-layer"></div>
                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-500 text-5xl opacity-80"><i class="fas fa-crown"></i></div>
            </div>
            
            <!-- Right Teams & Controls -->
            <div class="flex flex-col gap-4">
                <div class="team-panel team-panel-1" id="tp-1">
                    <div class="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-500 font-black text-xl">B</div>
                    <div>
                        <div class="font-bold text-cyan-500 name">Băng Mã</div>
                        <div class="text-xs text-slate-400">Rank: <span class="rank">#2</span></div>
                        <div class="text-xs mt-1 bg-slate-800 px-2 py-1 rounded w-32 text-center steps">0 bước</div>
                    </div>
                </div>
                <div class="team-panel team-panel-2" id="tp-2">
                    <div class="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-yellow-500 font-black text-xl">K</div>
                    <div>
                        <div class="font-bold text-yellow-500 name">Kim Mã</div>
                        <div class="text-xs text-slate-400">Rank: <span class="rank">#3</span></div>
                        <div class="text-xs mt-1 bg-slate-800 px-2 py-1 rounded w-32 text-center steps">0 bước</div>
                    </div>
                </div>
                
                <!-- Dice Panel -->
                <div class="glass-panel p-6 mt-4 flex flex-col items-center">
                    <div class="text-sm text-slate-400 mb-1">LƯỢT HIỆN TẠI</div>
                    <div class="text-2xl font-black mb-4" id="current-turn-name">Băng Mã</div>
                    <div class="dice" id="dice"><i class="fas fa-dice-one"></i></div>
                    <button class="btn-dice mt-4" id="btn-roll" onclick="rollDice()">TUNG XÚC XẮC</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Question Modal -->
    <div id="question-modal">
        <div class="question-box">
            <div class="question-text" id="q-text">Câu hỏi sẽ hiện ở đây</div>
        </div>
        <div class="options-grid">
            <button class="btn-option" id="btn-A" onclick="checkAnswer('A')">A</button>
            <button class="btn-option" id="btn-B" onclick="checkAnswer('B')">B</button>
            <button class="btn-option" id="btn-C" onclick="checkAnswer('C')">C</button>
            <button class="btn-option" id="btn-D" onclick="checkAnswer('D')">D</button>
        </div>
    </div>

    <script>
        // Data
        let questions = [
            { q: "Đạo hàm của $y = x^2$ là gì?", options: { A: "$2x$", B: "$x$", C: "$2$", D: "$0$" }, answer: "A" }
        ];
        
        let teams = [
            { id: 0, name: "Huyết Mã", color: "red", score: 0 },
            { id: 1, name: "Băng Mã", color: "cyan", score: 0 },
            { id: 2, name: "Kim Mã", color: "yellow", score: 0 },
            { id: 3, name: "Mộc Mã", color: "green", score: 0 }
        ];
        
        let currentTurn = 0;
        let currentDice = 0;
        let currentQuestion = null;
        
        // Init Path Coordinates (Simplified circular path around center)
        const pathCells = [];
        const radius = 25; // 25vh
        for(let i=0; i<40; i++) {
            const angle = (i / 40) * Math.PI * 2 - Math.PI/2;
            pathCells.push({
                x: 50 + radius * Math.cos(angle) + '%',
                y: 50 + radius * Math.sin(angle) + '%'
            });
        }
        
        function initBoard() {
            const container = document.getElementById('path-cells');
            pathCells.forEach((c, i) => {
                const div = document.createElement('div');
                div.className = 'path-cell';
                div.style.left = c.x;
                div.style.top = c.y;
                if(i%10===0) div.style.borderColor = ['#ef4444', '#06b6d4', '#eab308', '#22c55e'][i/10];
                container.appendChild(div);
            });
            updateHorses();
        }
        
        function updateHorses() {
            const container = document.getElementById('horses-layer');
            container.innerHTML = '';
            
            teams.forEach(team => {
                // 4 horses per team
                for(let i=0; i<4; i++) {
                    const h = document.createElement('div');
                    h.className = 'horse horse-' + team.id;
                    
                    let pos = team.score;
                    if(pos === 0) {
                        // Base
                        const base = document.getElementById('base-' + team.id);
                        h.style.position = 'relative';
                        h.style.transform = 'none';
                        base.appendChild(h);
                    } else {
                        // On track (simplified: one horse moving)
                        if(i===0) {
                            const pathIdx = ((team.id * 10) + pos) % 40;
                            h.style.left = pathCells[pathIdx].x;
                            h.style.top = pathCells[pathIdx].y;
                            container.appendChild(h);
                        } else {
                            const base = document.getElementById('base-' + team.id);
                            h.style.position = 'relative';
                            h.style.transform = 'none';
                            base.appendChild(h);
                        }
                    }
                }
            });
            updateUI();
        }
        
        function updateUI() {
            // Sort ranks
            let sorted = [...teams].sort((a,b) => b.score - a.score);
            
            document.getElementById('top-ranks').innerHTML = sorted.map((t, i) => 
                \`<div class="bg-slate-800 border border-slate-700 px-3 py-1 rounded flex gap-2 items-center">
                    <span class="text-yellow-500 font-bold">#\${i+1}</span>
                    <span style="color:var(--tw-color-\${t.color}-500)" class="font-bold text-sm">\${t.name}</span>
                    <span class="text-white font-bold">\${t.score}</span>
                </div>\`
            ).join('');
            
            teams.forEach(t => {
                const p = document.getElementById('tp-' + t.id);
                p.querySelector('.name').innerText = t.name;
                p.querySelector('.steps').innerText = t.score + ' bước';
                p.querySelector('.rank').innerText = '#' + (sorted.findIndex(x => x.id === t.id) + 1);
            });
            
            const curr = teams[currentTurn];
            const nameEl = document.getElementById('current-turn-name');
            nameEl.innerText = curr.name;
            nameEl.className = 'text-2xl font-black mb-4 text-' + curr.color + '-500';
            
            document.getElementById('btn-roll').style.background = getGradient(curr.color);
        }
        
        function getGradient(color) {
            if(color==='red') return 'linear-gradient(135deg, #dc2626, #ef4444)';
            if(color==='cyan') return 'linear-gradient(135deg, #0891b2, #06b6d4)';
            if(color==='yellow') return 'linear-gradient(135deg, #ca8a04, #eab308)';
            if(color==='green') return 'linear-gradient(135deg, #16a34a, #22c55e)';
        }
        
        const diceClasses = ['fa-dice-one', 'fa-dice-two', 'fa-dice-three', 'fa-dice-four', 'fa-dice-five', 'fa-dice-six'];
        
        function rollDice() {
            if(questions.length === 0) return alert('Hết câu hỏi!');
            const diceEl = document.getElementById('dice');
            diceEl.classList.add('rolling');
            document.getElementById('btn-roll').disabled = true;
            
            setTimeout(() => {
                diceEl.classList.remove('rolling');
                currentDice = Math.floor(Math.random() * 6) + 1;
                diceEl.innerHTML = \`<i class="fas \${diceClasses[currentDice-1]}"></i>\`;
                
                setTimeout(showQuestion, 1000);
            }, 1000);
        }
        
        function showQuestion() {
            currentQuestion = questions[Math.floor(Math.random() * questions.length)];
            document.getElementById('q-text').innerText = currentQuestion.q;
            document.getElementById('btn-A').innerText = "A. " + currentQuestion.options.A;
            document.getElementById('btn-B').innerText = "B. " + currentQuestion.options.B;
            document.getElementById('btn-C').innerText = "C. " + currentQuestion.options.C;
            document.getElementById('btn-D').innerText = "D. " + currentQuestion.options.D;
            
            ['A','B','C','D'].forEach(o => document.getElementById('btn-'+o).className = 'btn-option');
            
            document.getElementById('question-modal').classList.add('active');
        }
        
        function checkAnswer(ans) {
            ['A','B','C','D'].forEach(o => document.getElementById('btn-'+o).disabled = true);
            if(ans === currentQuestion.answer) {
                document.getElementById('btn-'+ans).classList.add('correct');
                teams[currentTurn].score += currentDice;
            } else {
                document.getElementById('btn-'+ans).classList.add('wrong');
                document.getElementById('btn-'+currentQuestion.answer).classList.add('correct');
            }
            
            setTimeout(() => {
                document.getElementById('question-modal').classList.remove('active');
                ['A','B','C','D'].forEach(o => document.getElementById('btn-'+o).disabled = false);
                currentTurn = (currentTurn + 1) % 4;
                updateHorses();
                document.getElementById('btn-roll').disabled = false;
            }, 2000);
        }
        
        function startGame() {
            teams[0].name = document.getElementById('team0').value || 'Huyết Mã';
            teams[1].name = document.getElementById('team1').value || 'Băng Mã';
            teams[2].name = document.getElementById('team2').value || 'Kim Mã';
            teams[3].name = document.getElementById('team3').value || 'Mộc Mã';
            
            document.getElementById('setup-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            
            initBoard();
        }

        // --- EXCEL & JSON LOGIC ---
        function downloadSampleExcel() {
            const ws = XLSX.utils.aoa_to_sheet([
                ["Câu hỏi", "Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D", "Cột đúng (1-4)"],
                ["Đạo hàm của $y = x^2$ là gì?", "$2x$", "$x$", "$2$", "$0$", 1]
            ]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Câu Hỏi");
            XLSX.writeFile(wb, "Mau_Cau_Hoi.xlsx");
        }

        function parseExcelToJSON(file, callback) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = e.target.result;
                    const wb = XLSX.read(data, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    
                    let qs = [];
                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row || row.length < 6) continue;
                        if (String(row[0]).toLowerCase().includes('câu hỏi') || String(row[1]).toLowerCase().includes('đáp án')) continue;
                        const ansMap = {1: 'A', 2: 'B', 3: 'C', 4: 'D'};
                        qs.push({
                            id: i,
                            q: String(row[0]),
                            options: { A: String(row[1]), B: String(row[2]), C: String(row[3]), D: String(row[4]) },
                            answer: ansMap[parseInt(row[5], 10)],
                        });
                    }
                    callback(null, qs);
                } catch (error) { callback(error, null); }
            };
            reader.readAsBinaryString(file);
        }

        function handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                parseExcelToJSON(file, function(err, parsedData) {
                    if (err) { alert('Lỗi đọc Excel: ' + err.message); return; }
                    questions = parsedData;
                    alert('Đã tải ' + questions.length + ' câu hỏi từ Excel!');
                });
            } else {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        questions = JSON.parse(e.target.result);
                        alert('Đã tải ' + questions.length + ' câu hỏi từ JSON!');
                    } catch(err) { alert("Lỗi JSON!"); }
                };
                reader.readAsText(file);
            }
        }
    </script>
</body>
</html>
`;
fs.writeFileSync('public/games/co-ca-ngua.html', html);
console.log("Game created");
