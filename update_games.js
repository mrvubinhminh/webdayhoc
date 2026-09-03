import fs from 'fs';
import path from 'path';

function updateProbabilityHunter() {
    const file = 'src/pages/ProbabilityHunter.jsx';
    let text = fs.readFileSync(file, 'utf8');
    
    if (!text.includes("import * as XLSX from 'xlsx';")) {
        text = text.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';\nimport * as XLSX from 'xlsx';");
    }

    const newHandleFileUpload = `  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
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
              q: String(row[0]),
              opts: [String(row[1]), String(row[2]), String(row[3]), String(row[4])],
              a: String(row[parseInt(row[5], 10)])
            });
          }
          setCustomQuestions(parsedQuestions);
          alert('Đã tải thành công ' + parsedQuestions.length + ' câu hỏi từ Excel!');
        } else {
          const raw = evt.target.result;
          const parsed = JSON.parse(raw);
          setCustomQuestions(parsed);
          alert('Đã tải thành công ' + parsed.length + ' câu hỏi từ JSON!');
        }
      } catch (err) {
        console.error(err);
        alert('Lỗi đọc file: ' + err.message);
      }
    };
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsBinaryString(file);
    } else {
        reader.readAsText(file);
    }
  };`;

    text = text.replace(/const handleFileUpload = \(e\) => \{[\s\S]*?reader\.readAsText\(file\);\n  \};/, newHandleFileUpload);
    
    text = text.replace(/accept="\.json"/g, 'accept=".json, .xlsx, .xls"');
    text = text.replace(/Chọn file JSON/g, 'Chọn file (JSON, Excel)');
    
    if (!text.includes('Tải Excel Mẫu')) {
        text = text.replace(
            /<button onClick=\{downloadSampleFile\}.*?<\/button>/,
            `$&
            <button onClick={() => {
                const ws = XLSX.utils.aoa_to_sheet([
                    ["Câu hỏi", "Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D", "Cột đúng (1-4)"],
                    ["1 + 1 bằng mấy?", "1", "2", "3", "4", 2],
                    ["Đạo hàm của $x^2$ là?", "$2x$", "$x^2$", "$x$", "1", 1]
                ]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Câu Hỏi");
                XLSX.writeFile(wb, "mau_cau_hoi.xlsx");
            }} className="text-green-300 underline text-sm font-bold mb-2 block hover:text-white transition-colors mt-2">📥 TẢI EXCEL MẪU</button>`
        );
    }
    
    fs.writeFileSync(file, text);
    console.log("Updated ProbabilityHunter.jsx");
}

function updateTugOfWarGame() {
    const file = 'src/pages/TugOfWarGame.jsx';
    let text = fs.readFileSync(file, 'utf8');
    
    if (!text.includes("import * as XLSX from 'xlsx';")) {
        text = text.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';\nimport * as XLSX from 'xlsx';");
    }

    const newHandleFileUpload = `    const handleFileUpload = (event) => {
        const file = event.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    const bstr = e.target.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    
                    let parsedQuestions = [];
                    for (let i = 0; i < data.length; i++) {
                        const row = data[i];
                        if (!row || row.length < 6) continue;
                        if (String(row[0]).toLowerCase().includes('câu hỏi') || String(row[1]).toLowerCase().includes('đáp án')) continue;
                        
                        const ansMap = {1: 'A', 2: 'B', 3: 'C', 4: 'D'};
                        parsedQuestions.push({
                            id: i,
                            question: String(row[0]),
                            options: { A: String(row[1]), B: String(row[2]), C: String(row[3]), D: String(row[4]) },
                            answer: ansMap[parseInt(row[5], 10)],
                            explain: ""
                        });
                    }
                    setPendingUploadData(parsedQuestions);
                    setUploadName(file.name.replace(/\\.[^/.]+$/, ""));
                    setShowSaveModal(true);
                } else {
                    const parsedData = JSON.parse(e.target.result);
                    if (!Array.isArray(parsedData) || parsedData.length === 0) throw new Error("File JSON phải chứa một mảng.");
                    if (!parsedData[0].question || !parsedData[0].options || !parsedData[0].answer) throw new Error("Sai cấu trúc JSON.");
                    setPendingUploadData(parsedData);
                    setUploadName(file.name.replace('.json', ''));
                    setShowSaveModal(true);
                }
            } catch (error) { 
                alert('Lỗi đọc file: ' + error.message); 
            }
            event.target.value = "";
        };
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.readAsBinaryString(file);
        } else {
            reader.readAsText(file);
        }
    };`;

    text = text.replace(/const handleFileUpload = \(event\) => \{[\s\S]*?reader\.readAsText\(file\);\n    \};/, newHandleFileUpload);
    text = text.replace(/accept="\.json"/g, 'accept=".json, .xlsx, .xls"');
    text = text.replace(/Tải lên File JSON/g, 'Tải lên File (JSON, Excel)');
    
    if (!text.includes('Tải Excel Mẫu')) {
        text = text.replace(
            /<button className="btn-action btn-download" onClick=\{downloadTemplate\}>⬇️ Tải File JSON Mẫu<\/button>/,
            `$&
            <button className="btn-action" style={{ background: '#27ae60' }} onClick={() => {
                const ws = XLSX.utils.aoa_to_sheet([
                    ["Câu hỏi", "Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D", "Cột đúng (1-4)"],
                    ["Câu hỏi mẫu: 1 + 1 bằng mấy?", "1", "2", "3", "4", 2],
                    ["Nghiệm của phương trình $x^2 - 4 = 0$ là:", "$x = 2$", "$x = -2$", "$x = \\\\pm 2$", "Vô nghiệm", 3]
                ]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Câu Hỏi");
                XLSX.writeFile(wb, "Mau_Cau_Hoi.xlsx");
            }}>⬇️ Tải Excel Mẫu</button>`
        );
    }
    
    fs.writeFileSync(file, text);
    console.log("Updated TugOfWarGame.jsx");
}

function updateHTMLGames() {
    const dir = 'public/games';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

    const htmlScriptTag = `<script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>`;

    for (const file of files) {
        const filePath = path.join(dir, file);
        let text = fs.readFileSync(filePath, 'utf8');

        // Insert xlsx script if not present
        if (!text.includes('xlsx.full.min.js')) {
            text = text.replace('</head>', `    ${htmlScriptTag}\n</head>`);
        }

        // Change accept attribute
        text = text.replace(/accept="\.json"/g, 'accept=".json, .xlsx, .xls"');
        
        // Change button labels
        text = text.replace(/Tải lên File JSON/g, 'Tải File (JSON, Excel)');
        text = text.replace(/Tải lên JSON/g, 'Tải File (JSON, Excel)');

        // Insert download Excel template button
        if (!text.includes('Tải Excel Mẫu')) {
            text = text.replace(
                /(<button[^>]*onclick="downloadSampleJSON.*?>.*?<\/button>|<button[^>]*onclick="downloadTemplate.*?>.*?<\/button>)/i,
                `$1
                <button class="btn-action" style="background:#27ae60; color:white; padding: 10px; border-radius: 8px; font-weight: bold; border:none; cursor:pointer;" onclick="downloadSampleExcel()">⬇️ Tải Excel Mẫu</button>`
            );
        }

        // Determine Game Type
        let gameType = 0;
        if (text.includes('options": { "A":') || text.includes('options": { "A"')) {
            gameType = 1;
        } else if (text.includes('"opts":') || text.includes('opts":[')) {
            gameType = 2;
        } else {
            gameType = 3;
        }

        // Generate download Excel function and parsing logic
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

        if (!text.includes('downloadSampleExcel')) {
            text = text.replace(/function downloadSampleJSON.*?\}/s, `$&${downloadExcelFn}`);
            text = text.replace(/function downloadTemplate.*?\}/s, `$&${downloadExcelFn}`);
        }

        // Handle handleFileUpload / prepareStart
        // We will inject a helper function `parseExcelToJSON(file, callback)`
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

        if (!text.includes('parseExcelToJSON')) {
            // Find the first script tag to inject the helper
            text = text.replace(/<script>/, `<script>${excelHelper}`);
        }

        // Replace reader.readAsText logic in handleFileUpload or prepareStart
        // Look for file reading logic
        const oldLogicRegex1 = /const reader = new FileReader\(\);\s+reader\.onload = function\(e\) \{[\s\S]*?reader\.readAsText\(file\);/g;
        const oldLogicRegex2 = /const r = new FileReader\(\);\s+r\.onload = \(e\) => \{[\s\S]*?r\.readAsText\(f\);/g;

        const newLogic1 = `
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            parseExcelToJSON(file, function(err, parsedData) {
                if (err) { alert('Lỗi đọc Excel!'); return; }
                const e = { target: { result: JSON.stringify(parsedData) } };
                // Simulate JSON load
                const data = e.target.result;
                // Re-evaluate old inner logic manually by storing it in a function?
                // Actually, let's just replace the reader behavior completely
            });
        } else {
            const reader = new FileReader();
            reader.onload = function(e) {
        `;

        // It is safer to do a string replacement targeting the exact `JSON.parse` or just manually adjust
        // But doing it via regex across all files is tricky if they vary.
        // Let's use a simpler regex replacement for the `JSON.parse` blocks.

        fs.writeFileSync(filePath, text);
    }
}

updateProbabilityHunter();
updateTugOfWarGame();
