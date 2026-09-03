    
        // Data
        let questions = [
            { q: "Đạo hàm của hàm số $y = x^3 - 3x^2 + 2x$ là:", options: { A: "$y' = 3x^2 - 6x + 2$", B: "$y' = 3x^2 - 3x + 2$", C: "$y' = 3x^2 - 6x$", D: "$y' = x^2 - 6x + 2$" }, answer: "A" },
            { q: "Đạo hàm của hàm số $y = \\sin(2x)$ là:", options: { A: "$y' = 2\\cos(2x)$", B: "$y' = \\cos(2x)$", C: "$y' = -2\\cos(2x)$", D: "$y' = -\\sin(2x)$" }, answer: "A" },
            { q: "Đạo hàm của hàm số $y = \\sqrt{x^2 + 1}$ là:", options: { A: "$y' = \\frac{x}{\\sqrt{x^2 + 1}}$", B: "$y' = \\frac{1}{2\\sqrt{x^2 + 1}}$", C: "$y' = \\frac{2x}{\\sqrt{x^2 + 1}}$", D: "$y' = \\frac{1}{\\sqrt{x^2 + 1}}$" }, answer: "A" },
            { q: "Đạo hàm của hàm số $y = \\frac{2x - 1}{x + 1}$ là:", options: { A: "$y' = \\frac{3}{(x + 1)^2}$", B: "$y' = \\frac{1}{(x + 1)^2}$", C: "$y' = \\frac{-3}{(x + 1)^2}$", D: "$y' = \\frac{2}{(x + 1)^2}$" }, answer: "A" },
            { q: "Đạo hàm của hàm số $y = x\\ln(x)$ là:", options: { A: "$y' = \\ln(x) + 1$", B: "$y' = \\ln(x)$", C: "$y' = 1$", D: "$y' = \\frac{1}{x}$" }, answer: "A" },
            { q: "Cho hàm số $y = \\tan(x)$. Đạo hàm của hàm số là:", options: { A: "$y' = \\frac{1}{\\cos^2(x)}$", B: "$y' = \\frac{1}{\\sin^2(x)}$", C: "$y' = \\cot(x)$", D: "$y' = -\\frac{1}{\\cos^2(x)}$" }, answer: "A" },
            { q: "Đạo hàm của hàm số $y = e^{3x}$ là:", options: { A: "$y' = 3e^{3x}$", B: "$y' = e^{3x}$", C: "$y' = \\frac{1}{3}e^{3x}$", D: "$y' = 3e^x$" }, answer: "A" },
            { q: "Tìm hệ số góc của tiếp tuyến với đồ thị hàm số $y = x^2 - 4x + 3$ tại điểm có hoành độ $x_0 = 2$.", options: { A: "$0$", B: "$2$", C: "$-2$", D: "$4$" }, answer: "A" },
            { q: "Đạo hàm cấp hai của hàm số $y = x^4 - 2x^2$ là:", options: { A: "$y'' = 12x^2 - 4$", B: "$y'' = 4x^3 - 4x$", C: "$y'' = 12x^2$", D: "$y'' = 12x^2 - 2$" }, answer: "A" },
            { q: "Đạo hàm của hàm số $y = \\cot(x)$ là:", options: { A: "$y' = -\\frac{1}{\\sin^2(x)}$", B: "$y' = \\frac{1}{\\sin^2(x)}$", C: "$y' = -\\frac{1}{\\cos^2(x)}$", D: "$y' = \\frac{1}{\\cos^2(x)}$" }, answer: "A" },
            { q: "Phương trình tiếp tuyến của đồ thị hàm số $y = x^3 - 3x + 1$ tại điểm $M(1, -1)$ là:", options: { A: "$y = -1$", B: "$y = 0$", C: "$y = x - 2$", D: "$y = -3x + 2$" }, answer: "B" },
            { q: "Đạo hàm của hàm số $y = \\cos^2(x)$ là:", options: { A: "$y' = -\\sin(2x)$", B: "$y' = \\sin(2x)$", C: "$y' = -2\\sin(x)$", D: "$y' = 2\\cos(x)$" }, answer: "A" },
            { q: "Cho hàm số $y = \\sqrt{2x - 1}$. Giá trị của $y'(1)$ là:", options: { A: "$1$", B: "$\\frac{1}{2}$", C: "$\\frac{1}{\\sqrt{2}}$", D: "$2$" }, answer: "A" },
            { q: "Đạo hàm của hàm số $y = (2x + 1)^3$ là:", options: { A: "$y' = 6(2x + 1)^2$", B: "$y' = 3(2x + 1)^2$", C: "$y' = 2(2x + 1)^2$", D: "$y' = 6(2x + 1)^3$" }, answer: "A" },
            { q: "Đạo hàm của hàm số $y = \\frac{x^2 - x + 1}{x - 1}$ là:", options: { A: "$y' = \\frac{x^2 - 2x}{(x - 1)^2}$", B: "$y' = \\frac{x^2 - 2x + 2}{(x - 1)^2}$", C: "$y' = \\frac{x^2 + 2x}{(x - 1)^2}$", D: "$y' = 1$" }, answer: "A" }
        ];
        
        let teams = [
            { id: 0, name: "Huyết Mã", color: "rose", score: 0 },
            { id: 1, name: "Băng Mã", color: "cyan", score: 0 },
            { id: 2, name: "Kim Mã", color: "yellow", score: 0 },
            { id: 3, name: "Mộc Mã", color: "green", score: 0 }
        ];
        
        let currentTurn = 0;
        let currentDice = 0;
        let currentQuestion = null;
        
        const pathCoords = [];
        const WIN_SCORE = 56;
        
        function initGrid() {
            const grid = document.getElementById('path-grid');
            
            const pMap = [
                [7,1],[7,2],[7,3],[7,4],[7,5],[6,6],[5,6],[4,6],[3,6],[2,6],[1,6],[1,7],[1,8],
                [2,8],[3,8],[4,8],[5,8],[6,8],[7,9],[7,10],[7,11],[7,12],[7,13],[7,14],[7,15],
                [8,15],[9,15],[9,14],[9,13],[9,12],[9,11],[9,10],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
                [15,8],[15,7],[14,7],[13,7],[12,7],[11,7],[10,7],[9,7],[9,6],[9,5],[9,4],[9,3],[9,2],[9,1],[8,1]
            ];
            
            pMap.forEach((p, idx) => {
                const cell = document.createElement('div');
                cell.className = 'path-cell';
                cell.style.gridColumn = p[1];
                cell.style.gridRow = p[0];
                
                // Colors for starting positions
                if(idx === 0) cell.style.background = 'rgba(244,63,94,0.3)'; // Red start
                if(idx === 13) cell.style.background = 'rgba(6,182,212,0.3)'; // Cyan start
                if(idx === 26) cell.style.background = 'rgba(234,179,8,0.3)'; // Yellow start
                if(idx === 39) cell.style.background = 'rgba(34,197,94,0.3)'; // Green start
                
                grid.appendChild(cell);
                pathCoords.push({ x: p[1], y: p[0] });
            });
            
            // Home stretch
            for(let i=2; i<=6; i++) {
                // Red home
                const r = document.createElement('div'); r.className='path-cell'; r.style.gridColumn='8'; r.style.gridRow=i; r.style.background='rgba(244,63,94,0.2)'; grid.appendChild(r);
                // Cyan home
                const c = document.createElement('div'); c.className='path-cell'; c.style.gridColumn=16-i; c.style.gridRow='8'; c.style.background='rgba(6,182,212,0.2)'; grid.appendChild(c);
                // Yellow home
                const y = document.createElement('div'); y.className='path-cell'; y.style.gridColumn='8'; y.style.gridRow=16-i; y.style.background='rgba(234,179,8,0.2)'; grid.appendChild(y);
                // Green home
                const g = document.createElement('div'); g.className='path-cell'; g.style.gridColumn=i; g.style.gridRow='8'; g.style.background='rgba(34,197,94,0.2)'; grid.appendChild(g);
            }
        }
        
        function getHorsePos(teamId, score) {
            if (score === 0) return null; // In base
            if (score > 56) score = 56;
            
            const startOffsets = { 0: 0, 1: 13, 2: 26, 3: 39 };
            let posIdx = startOffsets[teamId] + (score - 1);
            
            if (score > 51) {
                // In home stretch
                const stepsIn = score - 51;
                if(teamId === 0) return { x: 8, y: stepsIn + 1 };
                if(teamId === 1) return { x: 15 - stepsIn, y: 8 };
                if(teamId === 2) return { x: 8, y: 15 - stepsIn };
                if(teamId === 3) return { x: stepsIn + 1, y: 8 };
            }
            
            posIdx = posIdx % 52;
            return pathCoords[posIdx];
        }
        
        function updateHorses() {
            teams.forEach(team => {
                const pos = getHorsePos(team.id, team.score);
                const h0 = document.querySelector(`.h${team.id}-0`);
                
                if (pos) {
                    h0.style.position = 'absolute';
                    // Convert grid coords to %
                    // grid is 15x15, inset 2vh.
                    const cellSize = 100 / 15;
                    h0.style.left = ((pos.x - 0.5) * cellSize) + '%';
                    h0.style.top = ((pos.y - 0.5) * cellSize) + '%';
                    h0.style.transform = 'translate(-50%, -50%)';
                    document.getElementById('ludo-board').appendChild(h0);
                } else {
                    h0.style.position = 'static';
                    h0.style.transform = 'none';
                    document.querySelector(`.base-${team.id}`).appendChild(h0);
                }
            });
            updateUI();
        }
        
        function updateUI() {
            let sorted = [...teams].sort((a,b) => b.score - a.score);
            
            document.getElementById('top-ranks').innerHTML = sorted.map((t, i) => {
                let badgeColor = i===0 ? 'text-yellow-400' : 'text-slate-400';
                return `<div class="top-rank">
                    <span class="${badgeColor} font-black text-lg">#${i+1}</span>
                    <span style="color:var(--tw-color-${t.color}-500)" class="font-bold">${t.name}</span>
                    <span class="text-white font-bold bg-slate-700 px-2 rounded">${t.score}</span>
                </div>`;
            }).join('');
            
            teams.forEach(t => {
                const p = document.getElementById('tp-' + t.id);
                p.querySelector('.name').innerText = t.name;
                p.querySelector('.steps').innerText = t.score + ' bước';
                p.querySelector('.rank').innerText = '#' + (sorted.findIndex(x => x.id === t.id) + 1);
                p.querySelector('.progress').style.width = Math.min((t.score / WIN_SCORE) * 100, 100) + '%';
            });
            
            const curr = teams[currentTurn];
            const nameEl = document.getElementById('current-turn-name');
            nameEl.innerText = curr.name;
            nameEl.className = 'text-2xl font-black mb-2 text-' + curr.color + '-500';
            
            const dp = document.getElementById('dice-panel');
            dp.style.borderColor = `var(--tw-color-${curr.color}-500)`;
            document.getElementById('dice').style.color = `var(--tw-color-${curr.color}-500)`;
            
            document.getElementById('btn-roll').style.background = getGradient(curr.color);
        }
        
        function getGradient(color) {
            if(color==='rose') return 'linear-gradient(135deg, #e11d48, #f43f5e)';
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
                diceEl.innerHTML = `<i class="fas ${diceClasses[currentDice-1]}"></i>`;
                
                setTimeout(showQuestion, 1000);
            }, 1000);
        }
        
        function showQuestion() {
            currentQuestion = questions[Math.floor(Math.random() * questions.length)];
            
            const renderLatex = (text) => text.replace(/\\$([^$]+)\\$/g, "\\\\($1\\\\)");
            
            document.getElementById('q-text').innerHTML = renderLatex(currentQuestion.q);
            document.getElementById('btn-A').innerHTML = "A. " + renderLatex(currentQuestion.options.A);
            document.getElementById('btn-B').innerHTML = "B. " + renderLatex(currentQuestion.options.B);
            document.getElementById('btn-C').innerHTML = "C. " + renderLatex(currentQuestion.options.C);
            document.getElementById('btn-D').innerHTML = "D. " + renderLatex(currentQuestion.options.D);
            
            if (window.MathJax) {
                MathJax.typesetPromise();
            }
            
            ['A','B','C','D'].forEach(o => document.getElementById('btn-'+o).className = 'btn-opt');
            
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
            }, 2500);
        }
        
        function startGame() {
            teams[0].name = document.getElementById('team0').value || 'Huyết Mã';
            teams[1].name = document.getElementById('team1').value || 'Băng Mã';
            teams[2].name = document.getElementById('team2').value || 'Kim Mã';
            teams[3].name = document.getElementById('team3').value || 'Mộc Mã';
            
            document.getElementById('setup-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            
            initGrid();
            updateHorses();
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
        
        function toggleFullScreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
    
