# 📚 Định dạng Câu hỏi Toán học

## 🎯 2 loại câu hỏi được hỗ trợ

### 1️⃣ **Trắc nghiệm đa lựa chọn (Multiple Choice)**

4 đáp án A, B, C, D - Chọn 1 đáp án đúng

**Cấu trúc JSON:**
```json
{
  "id": "mc_001",
  "type": "multiple_choice",
  "content": "Giải phương trình $x^2 - 5x + 6 = 0$. Tập nghiệm là:",
  "options": {
    "A": "$\\{2; 3\\}$",
    "B": "$\\{1; 6\\}$",
    "C": "$\\{-2; -3\\}$",
    "D": "$\\{\\frac{1}{2}; 3\\}$"
  },
  "correctAnswer": "A",
  "explanation": "Phương trình $x^2 - 5x + 6 = 0$\\newline$\\Delta = b^2 - 4ac = 25 - 24 = 1 > 0$\\newline$x_1 = \\frac{5 - 1}{2} = 2, \\quad x_2 = \\frac{5 + 1}{2} = 3$\\newlineVậy tập nghiệm là $\\{2; 3\\}$",
  "difficulty": "easy",
  "subject": "Toán 10",
  "chapter": "Phương trình bậc 2"
}
```

**Cấu trúc Excel:**
| content | option_a | option_b | option_c | option_d | correct_answer | explanation | difficulty | subject | chapter |
|---------|----------|----------|----------|----------|----------------|-------------|-----------|---------|---------|
| Giải phương trình $x^2 - 5x + 6 = 0$. Tập nghiệm là: | $\{2; 3\}$ | $\{1; 6\}$ | $\{-2; -3\}$ | $\{\frac{1}{2}; 3\}$ | A | Phương trình $x^2 - 5x + 6 = 0$\newline$\Delta = b^2 - 4ac = 25 - 24 = 1 > 0$\newline... | easy | Toán 10 | Phương trình bậc 2 |

---

### 2️⃣ **Trắc nghiệm nhóm Đúng/Sai (True/False Group)**

Một nhóm câu hỏi cùng đặt vấn đề, mỗi câu trả lời Đúng (Đ) hoặc Sai (S)

**Cấu trúc JSON:**
```json
{
  "id": "tf_001",
  "type": "true_false_group",
  "groupTitle": "Xét hàm số $f(x) = -x^2 + 4x + 5$",
  "groupContext": "Đây là một parabol quay bề lõm xuống",
  "questions": [
    {
      "id": 1,
      "content": "Trục đối xứng của parabol là $x = 2$",
      "correctAnswer": "Đ",
      "explanation": "Trục đối xứng: $x = -\\frac{b}{2a} = -\\frac{4}{-2} = 2$"
    },
    {
      "id": 2,
      "content": "Đỉnh của parabol là $(2; 9)$",
      "correctAnswer": "Đ",
      "explanation": "Tại $x = 2$: $f(2) = -4 + 8 + 5 = 9$"
    },
    {
      "id": 3,
      "content": "Giá trị lớn nhất của hàm số là 5",
      "correctAnswer": "S",
      "explanation": "Giá trị lớn nhất = $f(2) = 9$, không phải 5"
    }
  ],
  "difficulty": "medium",
  "subject": "Toán 10",
  "chapter": "Hàm số bậc 2"
}
```

---

## 🧮 Công thức LaTeX

Sử dụng dấu `$` để bao quanh công thức toán:

### Ví dụ phổ biến:

| Công thức | LaTeX | Kết quả |
|-----------|-------|---------|
| Bình phương | `$x^2$` | x² |
| Phân số | `$\frac{a}{b}$` | a/b |
| Delta | `$\Delta = b^2 - 4ac$` | Δ = b² - 4ac |
| Nghiệm | `$x = \frac{-b \pm \sqrt{\Delta}}{2a}$` | Công thức nghiệm |
| Tập hợp | `$\{2; 3\}$` | {2; 3} |
| Khoảng | `$(-\infty; 3)$ hoặc $[1; 5]$` | Khoảng |
| Vectơ | `$\vec{AB}$` | vectơ AB |
| Tích phân | `$\int_a^b f(x)dx$` | ∫ |
| Đạo hàm | `$f'(x)$` | f'(x) |
| Căn bậc 2 | `$\sqrt{x}$` | √x |
| Lũy thừa | `$a^{n+1}$` | a^(n+1) |

---

## ↩️ Xuống dòng trong lời giải

Sử dụng **`\newline`** để xuống dòng:

```
"explanation": "Bước 1\\newlineBước 2\\newlineBước 3"
```

### Ví dụ thực tế:
```
"explanation": "Phương trình $x^2 - 5x + 6 = 0$\\newline$\\Delta = 25 - 24 = 1 > 0$\\newline$x_1 = 2, x_2 = 3$\\newlineVậy tập nghiệm là $\\{2; 3\\}$"
```

**Lưu ý:** Dùng `\\newline` (2 dấu gạch chéo) không phải `\n`

---

## 🔄 Chuyển đổi Excel → JSON

### Bước 1: Chuẩn bị file Excel
File Excel phải có các cột **đúng tên**:
- `content` - Nội dung câu hỏi
- `option_a, option_b, option_c, option_d` - Các đáp án
- `correct_answer` - Đáp án đúng (A, B, C, D)
- `explanation` - Lời giải
- `difficulty` - Độ khó (easy, medium, hard)
- `subject` - Môn học
- `chapter` - Chương/Bài học

### Bước 2: Chạy converter
```bash
python excel_to_json_converter.py your_file.xlsx output.json
```

### Bước 3: Kiểm tra output
```bash
cat output.json
```

---

## ✅ Checklist trước khi gửi

- [ ] Công thức toán đều trong dấu `$...$`
- [ ] Không có `\n`, chỉ dùng `\newline`
- [ ] Lời giải đầy đủ, giải thích từng bước
- [ ] Đáp án sai là những lỗi thường gặp của học sinh
- [ ] Câu hỏi không quá dễ/khó
- [ ] Không có lỗi chính tả
- [ ] Đáp án A/B/C/D đều có nội dung

---

## 🚀 Hướng dẫn cho AI sinh câu hỏi

### Prompt ví dụ:

```
Sinh 5 câu hỏi trắc nghiệm Toán 10 về "Phương trình bậc 2"

Yêu cầu:
1. Format: JSON (type: "multiple_choice")
2. 4 đáp án A, B, C, D (các lỗi thường gặp)
3. Công thức toán trong dấu $...$ (LaTeX)
4. Lời giải xuống dòng bằng \\newline
5. Giải thích từng bước, không bỏ xước
6. Mức độ: 2 câu easy, 2 câu medium, 1 câu hard

Return JSON array:
[
  {
    "type": "multiple_choice",
    "content": "...",
    "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
    "correctAnswer": "...",
    "explanation": "...\\newline...\\newline...",
    "difficulty": "..."
  },
  ...
]
```

---

## 📞 Liên hệ & Hỗ trợ

- Tham khảo `question-examples.json` để xem ví dụ thực tế
- Đọc `AI_PROMPT_GUIDE.md` để hiểu chi tiết cách sinh câu hỏi
- Kiểm tra `question-schema.json` để xem schema chính thức
