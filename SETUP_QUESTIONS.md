# 🎓 Hướng dẫn Thiết lập Câu hỏi toán học

## 📋 Nhanh chóng bắt đầu

### 1. Chọn loại câu hỏi bạn muốn

#### **Option A: Dùng AI sinh câu hỏi**
Nếu bạn không có file Excel, hãy dùng AI để sinh câu hỏi theo cấu trúc JSON

**Bước 1:** Copy prompt này và gửi cho Claude/ChatGPT:

```
Sinh 10 câu hỏi trắc nghiệm Toán 10 về "Phương trình bậc 2" định dạng JSON

Yêu cầu:
1. Type: "multiple_choice"
2. 4 đáp án A, B, C, D
3. Công thức LaTeX trong dấu $...$
4. Lời giải xuống dòng bằng \\newline
5. Giải thích từng bước

Format:
{
  "type": "multiple_choice",
  "content": "Câu hỏi (có công thức $...$)",
  "options": {
    "A": "...",
    "B": "...",
    "C": "...",
    "D": "..."
  },
  "correctAnswer": "A",
  "explanation": "Giải thích\\newlineXuống dòng\\newlineTiếp tục",
  "difficulty": "easy|medium|hard"
}
```

**Bước 2:** Copy JSON trả về từ AI

**Bước 3:** Paste vào file `questions.json` ở project

---

#### **Option B: Dùng Excel + Converter**

**Bước 1:** Tạo file Excel với cấu trúc sau:

| content | option_a | option_b | option_c | option_d | correct_answer | explanation | difficulty | subject | chapter |
|---------|----------|----------|----------|----------|---|---|---|---|---|
| Nội dung câu hỏi | ĐA A | ĐA B | ĐA C | ĐA D | A | Giải thích | easy | Toán 10 | Chương 1 |

**Lưu ý:**
- Nội dung và giải thích có thể chứa công thức LaTeX: `$x^2 - 5x + 6 = 0$`
- Đề cập xuống dòng: `Bước 1\newlineBước 2`

**Bước 2:** Chạy converter:
```bash
python excel_to_json_converter.py your_file.xlsx output.json
```

**Bước 3:** Kiểm tra `output.json` và sử dụng trong app

---

### 2. Sử dụng câu hỏi trong Game

**Trên GameHost (`/game/host`):**
1. Nhập tên bài trình chiếu: "Phương trình bậc 2"
2. Upload file Excel hoặc JSON
3. Chọn giao diện, thời gian, chế độ chơi
4. Nhấn "TẠO PHÒNG CHƠI"

---

## 📚 Chi tiết cấu trúc

### JSON Mẫu - Multiple Choice

```json
{
  "id": "mc_001",
  "type": "multiple_choice",
  "content": "Phương trình $x^2 - 5x + 6 = 0$ có tập nghiệm là:",
  "options": {
    "A": "$\\{2; 3\\}$",
    "B": "$\\{1; 6\\}$",
    "C": "$\\{-2; -3\\}$",
    "D": "$\\{0; 5\\}$"
  },
  "correctAnswer": "A",
  "explanation": "Giải phương trình $x^2 - 5x + 6 = 0$:\\newlinePhân tích: $(x - 2)(x - 3) = 0$\\newline$x = 2$ hoặc $x = 3$\\newlineVậy tập nghiệm là $\\{2; 3\\}$ → Chọn **A**",
  "difficulty": "easy",
  "subject": "Toán 10",
  "chapter": "Phương trình bậc 2"
}
```

### JSON Mẫu - True/False Group

```json
{
  "id": "tf_001",
  "type": "true_false_group",
  "groupTitle": "Cho tam giác $ABC$ với $\\vec{AB} = \\vec{a}$, $\\vec{AC} = \\vec{b}$",
  "groupContext": "$M$ trên $AB$ sao cho $AM = \\frac{1}{3}AB$",
  "questions": [
    {
      "id": 1,
      "content": "$\\vec{AM} = \\frac{1}{3}\\vec{a}$",
      "correctAnswer": "Đ",
      "explanation": "Đúng vì $M$ trên $AB$ với tỷ lệ $\\frac{1}{3}$"
    },
    {
      "id": 2,
      "content": "$\\vec{AM} = \\frac{2}{3}\\vec{a}$",
      "correctAnswer": "S",
      "explanation": "Sai vì tỷ lệ là $\\frac{1}{3}$ không phải $\\frac{2}{3}$"
    }
  ],
  "difficulty": "medium",
  "subject": "Toán 10",
  "chapter": "Vectơ"
}
```

---

## 🧮 Công thức LaTeX thường dùng

| Công thức | LaTeX | Ghi chú |
|-----------|-------|--------|
| Bình phương | `$x^2$` | Cơ bản |
| Phân số | `$\frac{a}{b}$` | Dùng cho đáp án |
| Căn bậc 2 | `$\sqrt{x}$` | Dùng cho căn |
| Phương trình | `$ax^2 + bx + c = 0$` | Phương trình bậc 2 |
| Hệ số | `$\\Delta = b^2 - 4ac$` | Delta trong PT bậc 2 |
| Tập hợp | `$\\{2; 3\\}$` | Tập nghiệm |
| Khoảng | `$(-\\infty; 3)$` | Khoảng, nửa khoảng |
| Vectơ | `$\\vec{AB}$` | Vector trong hình học |
| Tích vô hướng | `$\\vec{a} \\cdot \\vec{b}$` | Tích vô hướng |
| Góc | `$\\angle ABC$` hoặc `$\\widehat{ABC}$` | Góc trong hình |

**Ví dụ phức tạp:**
```
$f(x) = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$ 
hoặc 
$\\int_0^1 x^2 dx = \\frac{1}{3}$
```

---

## 💡 Lưu ý quan trọng

### ✅ ĐÚNG:
- `$x^2$` ✅
- `explanation": "Step1\\newlineStep2"` ✅
- `"options": {"A": "$\\{2; 3\\}$", ...}` ✅
- `"correctAnswer": "A"` ✅

### ❌ SAI:
- `x^2` (không có dấu $) ❌
- `explanation": "Step1\nStep2"` (dùng \n thay vì \\newline) ❌
- `"options": {"A": "\{2; 3\}", ...}` (thiếu dấu $) ❌
- `"correctAnswer": "a"` (viết thường) ❌

---

## 🤖 Hướng dẫn AI Comprehensive

### Prompt cho Claude/ChatGPT:

```markdown
# Sinh câu hỏi trắc nghiệm Toán học

Sinh **10 câu** trắc nghiệm về chủ đề "Phương trình bậc 2" định dạng JSON

## Yêu cầu:
1. **Format**: JSON array
2. **Loại**: Multiple Choice (4 đáp án A, B, C, D)
3. **Công thức toán**: Bắt buộc bao trong dấu $ (LaTeX)
4. **Xuống dòng**: Dùng `\\newline` trong lời giải
5. **Lời giải**: Đầy đủ, giải thích từng bước
6. **Đáp án sai**: Là những sai lầm học sinh thường gặp
7. **Mức độ**: 4 easy, 4 medium, 2 hard

## Cấu trúc JSON:
\`\`\`json
[
  {
    "type": "multiple_choice",
    "content": "Câu hỏi (có công thức $...$)",
    "options": {
      "A": "Đáp án A (có công thức nếu cần)",
      "B": "Đáp án B",
      "C": "Đáp án C",
      "D": "Đáp án D"
    },
    "correctAnswer": "A",
    "explanation": "Lời giải chi tiết\\newlineXuống dòng 2\\newlineXuống dòng 3",
    "difficulty": "easy|medium|hard",
    "subject": "Toán 10",
    "chapter": "Phương trình bậc 2"
  }
]
\`\`\`

## Ví dụ lời giải tốt:
\`\`\`
"explanation": "Phương trình $x^2 - 5x + 6 = 0$\\newline$= (x - 2)(x - 3) = 0$\\newline$\\Rightarrow x = 2$ hoặc $x = 3$\\newlineVậy tập nghiệm là $\\{2; 3\\}$"
\`\`\`

## Lưu ý:
- Không dùng `\n`, chỉ dùng `\\newline`
- Tất cả công thức phải trong `$...$`
- Lời giải phải logic và dễ hiểu cho học sinh lớp 10
```

---

## 📁 Files cần biết

| File | Mục đích |
|------|---------|
| `src/data/question-schema.json` | Schema chính thức cho cấu trúc JSON |
| `src/data/question-examples.json` | 4 ví dụ thực tế (2 loại câu hỏi) |
| `src/data/AI_PROMPT_GUIDE.md` | Hướng dẫn chi tiết cho AI |
| `excel_to_json_converter.py` | Script convert Excel → JSON |
| `QUESTION_FORMAT.md` | Hướng dẫn định dạng câu hỏi |
| `src/components/QuestionGuidePanel.jsx` | Component hướng dẫn trên GameHost |

---

## 🚀 Troubleshoot

### JSON không hợp lệ?
```bash
# Kiểm tra cú pháp JSON
python -m json.tool output.json
```

### LaTeX không render đúng?
- Kiểm tra dấu `$` bao quanh công thức
- Kiểm tra escape backslash: `\\` không phải `\`

### Converter báo lỗi?
```bash
# Cần cài openpyxl
pip install openpyxl

# Sau đó chạy lại
python excel_to_json_converter.py file.xlsx
```

---

**Made with ❤️ for Math Teachers**
