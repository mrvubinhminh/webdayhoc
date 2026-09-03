import fs from 'fs';
import path from 'path';

const dir = 'public/games';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const htmlScriptTag = `<script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>`;

for (const file of files) {
    const filePath = path.join(dir, file);
    let text = fs.readFileSync(filePath, 'utf8');

    // 1. Inject script tag
    if (!text.includes('xlsx.full.min.js')) {
        text = text.replace('</head>', `    ${htmlScriptTag}\n</head>`);
    }

    // 2. Accept attributes & labels
    text = text.replace(/accept="\.json"/g, 'accept=".json, .xlsx, .xls"');
    text = text.replace(/Tải lên File JSON/g, 'Tải File (JSON, Excel)');
    text = text.replace(/Tải lên JSON/g, 'Tải File (JSON, Excel)');
    text = text.replace(/Tải File JSON Mẫu/g, 'Tải JSON Mẫu'); // shorten

    // 3. Inject download Excel button UI
    if (!text.includes('downloadSampleExcel()')) {
        text = text.replace(
            /onclick="downloadSampleJSON\(\)"[^>]*>.*?<\/button>/,
            `$& <button class="btn-action" style="background:#27ae60; color:white; padding: 10px; border-radius: 8px; font-weight: bold; border:none; cursor:pointer; margin-left: 5px;" onclick="downloadSampleExcel()">⬇️ Tải Excel Mẫu</button>`
        );
        text = text.replace(
            /onclick="downloadTemplate\(\)"[^>]*>.*?<\/button>/,
            `$& <button class="btn-action" style="background:#27ae60; color:white; padding: 10px; border-radius: 8px; font-weight: bold; border:none; cursor:pointer; margin-left: 5px;" onclick="downloadSampleExcel()">⬇️ Tải Excel Mẫu</button>`
        );
    }

    // 4. Inject downloadExcelFn right before window.onload or the end of script
    const downloadExcelFn = `
    function downloadSampleExcel() {
        const ws = XLSX.utils.aoa_to_sheet([
            ["Câu hỏi", "Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D", "Cột đúng (1-4)"],
            ["Câu hỏi mẫu: 1 + 1 bằng mấy?", "1", "2", "3", "4", 2]
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Câu Hỏi");
        XLSX.writeFile(wb, "Mau_Cau_Hoi.xlsx");
    }
    `;
    if (!text.includes('function downloadSampleExcel')) {
        text = text.replace('window.onload =', `${downloadExcelFn}\n    window.onload =`);
    }

    // 5. Determine Game Type
    let gameType = 0;
    if (text.includes('options": { "A":') || text.includes('options": { "A"')) {
        gameType = 1;
    } else if (text.includes('"opts":') || text.includes('opts":[')) {
        gameType = 2;
    } else {
        gameType = 3;
    }

    // 6. Inject parseExcelToJSON helper
    const excelHelper = `
    function parseExcelToJSON(file, callback) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = e.target.result;
                const wb = XLSX.read(data, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
                
                let questions = [];
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length < 6) continue;
                    if (String(row[0]).toLowerCase().includes('câu hỏi') || String(row[1]).toLowerCase().includes('đáp án')) continue;
                    
                    ${
                        gameType === 1 ? `
                        const ansMap = {1: 'A', 2: 'B', 3: 'C', 4: 'D'};
                        questions.push({
                            id: i,
                            question: String(row[0]),
                            options: { A: String(row[1]), B: String(row[2]), C: String(row[3]), D: String(row[4]) },
                            answer: ansMap[parseInt(row[5], 10)],
                            explain: ""
                        });
                        ` : gameType === 2 ? `
                        questions.push({
                            q: String(row[0]),
                            opts: [String(row[1]), String(row[2]), String(row[3]), String(row[4])],
                            a: String(row[parseInt(row[5], 10)])
                        });
                        ` : `
                        const ansMap = {1: 'A', 2: 'B', 3: 'C', 4: 'D'};
                        questions.push({
                            q: String(row[0]),
                            a: String(row[1]), b: String(row[2]), c: String(row[3]), d: String(row[4]),
                            correct: ansMap[parseInt(row[5], 10)]
                        });
                        `
                    }
                }
                callback(null, questions);
            } catch (error) {
                callback(error, null);
            }
        };
        reader.readAsBinaryString(file);
    }
    `;

    if (!text.includes('function parseExcelToJSON')) {
        text = text.replace(/<script>/, `<script>\n${excelHelper}\n`);
    }

    // 7. Replace JSON parse with EXCEL logic manually for EACH TYPE
    if (gameType === 1) {
        // e.g. xay-cau-vuot-song.html, dua-xe-toc-do.html
        // Format:
        // const parsedData = JSON.parse(e.target.result);
        // setPendingUploadData(parsedData); ...
        
        // We will replace `const reader = new FileReader(); reader.onload = function(e) {` 
        text = text.replace(/const reader = new FileReader\(\);\s*reader\.onload = function\(e\) \{/, 
            `if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                parseExcelToJSON(file, function(err, parsedData) {
                    if (err) { alert('Lỗi đọc Excel!'); return; }
                    const e = { target: { result: JSON.stringify(parsedData) } };
                    try {
                        const parsedData2 = JSON.parse(e.target.result);
                        if (!Array.isArray(parsedData2) || parsedData2.length === 0) throw new Error("File phải chứa một mảng.");
                        pendingUploadData = parsedData2;
                        document.getElementById('upload-lesson-name').value = file.name.replace(/\\.[^/.]+$/, "");
                        document.getElementById('save-modal').classList.add('show');
                    } catch (error) { showToast('Lỗi đọc file: ' + error.message, 'error'); }
                });
                event.target.value = "";
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {`
        );
    } else if (gameType === 2) {
        // e.g. alchemy-lab.html, bong-ro.html
        // Format:
        // const r = new FileReader(); r.onload = (e) => { const parsed = JSON.parse(raw); ... }
        text = text.replace(/const r = new FileReader\(\);\s*r\.onload = \(e\) => \{/, 
            `if (f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) {
                parseExcelToJSON(f, function(err, parsedData) {
                    if (err) { alert('Lỗi đọc Excel!'); return; }
                    const e = { target: { result: JSON.stringify(parsedData) } };
                    try {
                        let raw = e.target.result.replace(/(?<!\\\\)\\\\([a-zA-Z{}%$])/g, '\\\\\\\\$1');
                        const parsed = JSON.parse(raw);
                        const name = document.getElementById('bank-name').value || 'Công thức mới';
                        if (shouldSave || save) {
                            const b = getBanksFromLocal ? getBanksFromLocal() : getBanks(); 
                            const id = 'bank_' + Date.now();
                            b[id] = { id, name, grade: document.getElementById('bank-grade').value, questions: parsed };
                            saveBanksToLocal ? saveBanksToLocal(b) : saveBanks(b); renderTree();
                        }
                        loadedQuestions = parsed; 
                        if (typeof currentLessonName !== 'undefined') currentLessonName = name;
                        if (typeof campaignName !== 'undefined') campaignName = name;
                        if (typeof openIntroModal === 'function') openIntroModal();
                        else startPlay();
                    } catch(err) { alert("Lỗi nạp file Excel!"); }
                });
                return;
            }
            const r = new FileReader();
            r.onload = (e) => {`
        );
    } else if (gameType === 3) {
        // e.g. xay-dung-de-che.html, chiem-linh-lanh-tho.html
        text = text.replace(/const reader = new FileReader\(\);\s*reader\.onload = e => \{/, 
            `if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                parseExcelToJSON(file, function(err, parsedData) {
                    if (err) { alert('Lỗi đọc Excel!'); return; }
                    try {
                        const name = file.name.replace(/\\.[^/.]+$/, "");
                        lessonBanks[10].push({ id: Date.now().toString(), name: name, questions: parsedData });
                        saveStorage(); renderTree();
                    } catch(err) { alert("Lỗi nạp file Excel!"); }
                });
                return;
            }
            const reader = new FileReader();
            reader.onload = e => {`
        );
    }

    fs.writeFileSync(filePath, text);
    console.log("Updated", filePath, "- GameType:", gameType);
}

