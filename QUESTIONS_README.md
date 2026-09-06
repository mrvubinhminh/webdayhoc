# 📚 Hệ Thống Câu Hỏi Toán Học

Hệ thống quản lý và sinh câu hỏi toán học với 2 loại câu hỏi chính, hỗ trợ công thức LaTeX và xuống dòng tùy chỉnh.

---

## 🎯 Tính Năng Chính

### 1. **2 Loại Câu Hỏi**

#### 🎯 **Trắc Nghiệm Đa Lựa Chọn (Multiple Choice)**
- 4 đáp án: A, B, C, D
- 1 đáp án đúng
- Lời giải chi tiết
- Đáp án sai là lỗi thường gặp

#### 📋 **Trắc Nghiệm Nhóm Đúng/Sai (True/False Group)**
- Một nhóm câu hỏi cùng đặt vấn đề
- Mỗi câu hỏi có 2 lựa chọn: Đúng (Đ) hoặc Sai (S)
- Lời giải riêng cho từng câu

### 2. **Công Thức LaTeX**
Tất cả công thức toán học được hỗ trợ trong dấu `$...$`
```
$x^2 - 5x + 6 = 0$
$\frac{a}{b}$
$\Delta = b^2 - 4ac$
$\vec{AB}$
```

### 3. **Xuống Dòng Trong Lời Giải**
Sử dụng `\\newline` để tạo xuống dòng
```
"Bước 1\\newlineBước 2\\newlineBước 3"
```

### 4. **JSON Format**
Schema rõ ràng dễ để AI hiểu và sinh câu hỏi

### 5. **Tools & Utilities**
- 📝 **Question Tester** (`/question-tester`) - Test câu hỏi JSON
- 🔄 **Excel Converter** - Chuyển Excel → JSON
- 📊 **Question Guide** - Hướng dẫn chi tiết cho AI

---

## 🚀 Bắt Đầu Nhanh

### Option 1: Dùng AI Sinh Câu Hỏi

```bash
# 1. Copy prompt từ SETUP_QUESTIONS.md
# 2. Gửi cho Claude/ChatGPT
# 3. Copy JSON trả về
# 4. Paste vào /question-tester để preview
# 5. Download và sử dụng trong /game/host
```

### Option 2: Dùng Excel + Converter

```bash
# 1. Tạo file Excel với cột: content, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, subject, chapter
# 2. Chạy converter
python excel_to_json_converter.py your_file.xlsx output.json

# 3. Preview tại /question-tester
# 4. Upload vào /game/host
```

---

## 📁 Cấu Trúc Files

```
project/
├── src/
│   ├── data/
│   │   ├── question-schema.json      # Schema chính thức
│   │   ├── question-examples.json    # 4 ví dụ thực tế
│   │   └── AI_PROMPT_GUIDE.md        # Hướng dẫn AI
│   ├── components/
│   │   ├── QuestionGuidePanel.jsx    # Hướng dẫn trên GameHost
│   │   └── QuestionPreview.jsx       # Hiển thị câu hỏi
│   └── pages/
│       └── QuestionTester.jsx        # Trang test câu hỏi
├── excel_to_json_converter.py        # Script convert Excel
├── QUESTION_FORMAT.md                # Định dạng chi tiết
├── SETUP_QUESTIONS.md                # Hướng dẫn setup
└── QUESTIONS_README.md               # File này
```

---

## 🎓 JSON Schema

### Multiple Choice
```json
{
  "id": "mc_001",
  "type": "multiple_choice",
  "content": "Câu hỏi (có công thức $...$)",
  "options": {
    "A": "Đáp án A (có công thức nếu cần)",
    "B": "Đáp án B",
    "C": "Đáp án C",
    "D": "Đáp án D"
  },
  "correctAnswer": "A",
  "explanation": "Lời giải chi tiết\\newlineXuống dòng\\nTiếp tục giải thích",
  "difficulty": "easy|medium|hard",
  "subject": "Toán 10",
  "chapter": "Phương trình bậc 2"
}
```

### True/False Group
```json
{
  "id": "tf_001",
  "type": "true_false_group",
  "groupTitle": "Tiêu đề nhóm (có công thức $...$)",
  "groupContext": "Thông tin chung",
  "questions": [
    {
      "id": 1,
      "content": "Câu hỏi 1 (có công thức $...$)",
      "correctAnswer": "Đ",
      "explanation": "Lời giải"
    },
    {
      "id": 2,
      "content": "Câu hỏi 2",
      "correctAnswer": "S",
      "explanation": "Lời giải"
    }
  ],
  "difficulty": "medium",
  "subject": "Toán 10",
  "chapter": "Vectơ"
}
```

---

## 🧮 Công Thức LaTeX Thường Dùng

| Công thức | LaTeX | Ví dụ |
|-----------|-------|-------|
| Bình phương | `$x^2$` | x² |
| Phân số | `$\frac{a}{b}$` | a/b |
| Delta | `$\Delta = b^2 - 4ac$` | Δ = b² - 4ac |
| Căn | `$\sqrt{x}$` | √x |
| Tập hợp | `$\{2; 3\}$` | {2; 3} |
| Khoảng | `$(-\infty; 3)$` | (-∞; 3) |
| Vectơ | `$\vec{AB}$` | Vector AB |
| Tích vô hướng | `$\vec{a} \cdot \vec{b}$` | a·b |
| Tích phân | `$\int_a^b f(x)dx$` | ∫ |
| Đạo hàm | `$f'(x)$` | f'(x) |
| Giới hạn | `$\lim_{x \to 0}$` | lim |
| Căn bậc n | `$\sqrt[n]{x}$` | ⁿ√x |

---

## 🤖 Hướng Dẫn AI

### Prompt Template

```markdown
Sinh 10 câu hỏi trắc nghiệm Toán 10 về "Phương trình bậc 2"

Yêu cầu:
1. Format: JSON array
2. Type: "multiple_choice"
3. 4 đáp án A, B, C, D
4. Công thức LaTeX: $...$
5. Lời giải xuống dòng: \\newline
6. Mức độ: 4 easy, 4 medium, 2 hard

Cấu trúc:
[
  {
    "type": "multiple_choice",
    "content": "Câu hỏi (có công thức $...$)",
    "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
    "correctAnswer": "A",
    "explanation": "Giải thích\\newlineXuống dòng\\nTiếp tục",
    "difficulty": "easy",
    "subject": "Toán 10",
    "chapter": "Phương trình bậc 2"
  }
]
```

---

## ✅ Checklist Trước Khi Sử Dụng

- [ ] Công thức toán trong dấu `$...$`
- [ ] Không dùng `\n`, chỉ dùng `\\newline`
- [ ] Lời giải đầy đủ, từng bước
- [ ] Đáp án sai là lỗi thường gặp
- [ ] Câu hỏi phù hợp mức độ
- [ ] Không có lỗi chính tả
- [ ] `correctAnswer` viết HOA (A, B, C, D)

---

## 🎮 Sử Dụng Trong Ứng Dụng

### 1. Test Câu Hỏi
Vào `/question-tester`
- Paste JSON
- Xem preview
- Download nếu OK

### 2. Upload Vào Game
Vào `/game/host`
- Chọn file Excel hoặc JSON
- Xem hướng dẫn (click "Hướng dẫn Sinh câu hỏi")
- Chọn giao diện, thời gian
- Bắt đầu trò chơi

### 3. Hướng Dẫn Trên GameHost
Click "Hướng dẫn Sinh câu hỏi" để xem:
- Schema cho 2 loại câu hỏi
- Ví dụ JSON
- Công thức LaTeX
- Tips quan trọng

---

## 📊 Thống Kê & Monitoring

Excel converter tự động thống kê:
- Số lượng câu theo độ khó
- Phân bố theo môn/chương
- Kiểm tra lỗi format

```bash
python excel_to_json_converter.py file.xlsx
# Output:
# ✅ Thành công! 10 câu hỏi
# 📊 Phân bố:
#   Theo độ khó:
#     - easy: 4
#     - medium: 4
#     - hard: 2
```

---

## 🔧 Troubleshoot

### JSON không hợp lệ
```bash
python -m json.tool questions.json
```

### LaTeX không render
- Kiểm tra `$` bao quanh công thức
- Kiểm tra `\\` (2 dấu gạch chéo)

### Converter báo lỗi
```bash
pip install openpyxl
python excel_to_json_converter.py file.xlsx
```

### QuestionTester không hiển thị
- Kiểm tra route: `/question-tester`
- Kiểm tra App.jsx có import QuestionTester không

---

## 📚 Tài Liệu Chi Tiết

- **question-schema.json** - Schema chính thức
- **question-examples.json** - 4 ví dụ thực tế
- **AI_PROMPT_GUIDE.md** - Hướng dẫn cho AI
- **QUESTION_FORMAT.md** - Định dạng chi tiết
- **SETUP_QUESTIONS.md** - Hướng dẫn setup đầy đủ

---

## 🎯 Workflow Đề Nghị

```
1. Viết prompt AI
   ↓
2. Nhận JSON từ AI
   ↓
3. Test tại /question-tester
   ↓
4. Chỉnh sửa nếu cần
   ↓
5. Download JSON
   ↓
6. Upload vào /game/host
   ↓
7. Chọn giao diện + bắt đầu
```

---

## 🚀 Features Tương Lai

- [ ] Import Excel trực tiếp từ browser
- [ ] Batch test multiple JSON files
- [ ] Auto-fix common mistakes
- [ ] AI-powered validation
- [ ] Question bank storage
- [ ] Share questions with team

---

**Made with ❤️ for Math Teachers**

Hỗ trợ: Xem AI_PROMPT_GUIDE.md hoặc SETUP_QUESTIONS.md
