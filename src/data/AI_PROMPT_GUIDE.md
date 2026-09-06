# 📚 Hướng dẫn sinh câu hỏi toán học cho AI

## 🎯 Mục đích
Cấu trúc này giúp AI hiểu và sinh ra câu hỏi toán học chất lượng cao theo 2 loại chính.

---

## 📋 2 LOẠI CÂU HỎI

### 1️⃣ **Loại 1: Trắc nghiệm đa lựa chọn (Multiple Choice)**
- **4 đáp án**: A, B, C, D
- **1 đáp án đúng**
- **Lời giải chi tiết** với xuống dòng

**JSON Structure:**
```json
{
  "type": "multiple_choice",
  "content": "Nội dung câu hỏi",
  "options": {
    "A": "Đáp án A",
    "B": "Đáp án B", 
    "C": "Đáp án C",
    "D": "Đáp án D"
  },
  "correctAnswer": "A",
  "explanation": "Lời giải\\newlineXuống dòng thứ 2\\newlineXuống dòng thứ 3",
  "difficulty": "easy|medium|hard"
}
```

---

### 2️⃣ **Loại 2: Trắc nghiệm nhóm Đúng/Sai (True/False Group)**
- **Một nhóm câu hỏi** cùng đặt vấn đề
- **Mỗi câu hỏi có 2 lựa chọn**: Đúng (Đ) hoặc Sai (S)
- **Lời giải riêng cho từng câu**

**JSON Structure:**
```json
{
  "type": "true_false_group",
  "groupTitle": "Tiêu đề nhóm",
  "groupContext": "Thông tin chung cho cả nhóm",
  "questions": [
    {
      "id": 1,
      "content": "Câu hỏi 1",
      "correctAnswer": "Đ",
      "explanation": "Lời giải câu 1"
    },
    {
      "id": 2,
      "content": "Câu hỏi 2",
      "correctAnswer": "S",
      "explanation": "Lời giải câu 2"
    }
  ]
}
```

---

## 🧮 CÔNG THỨC LATEX

Sử dụng dấu **$** để bao quanh công thức toán:

### Ví dụ:
```
"content": "Giải phương trình $x^2 - 5x + 6 = 0$"

"options": {
  "A": "$\\{2; 3\\}$",
  "B": "$\\{1; 6\\}$"
}

"explanation": "Sử dụng công thức $\\Delta = b^2 - 4ac = 25 - 24 = 1$"
```

### Các công thức phổ biến:
- **Phương trình**: `$ax^2 + bx + c = 0$`
- **Delta**: `$\\Delta = b^2 - 4ac$`
- **Nghiệm**: `$x_1 = \\frac{-b + \\sqrt{\\Delta}}{2a}$`
- **Tập hợp**: `$\\{x_1; x_2\\}$`
- **Khoảng**: `$(-\\infty; 3)$` hoặc `$[1; 5]$`
- **Vectơ**: `$\\vec{AB}$`
- **Ma trận**: `$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$`
- **Tích phân**: `$\\int_a^b f(x)dx$`
- **Đạo hàm**: `$f'(x) = \\lim_{\\Delta x \\to 0} \\frac{\\Delta y}{\\Delta x}$`

---

## 🔄 XUỐNG DÒNG TRONG LỜI GIẢI

Sử dụng **`\newline`** để xuống dòng:

```
"explanation": "Bước 1\\newlineBước 2\\newlineBước 3"
```

### Ví dụ thực tế:
```json
"explanation": "Phương trình $x^2 - 5x + 6 = 0$\\newline$\\Delta = 25 - 24 = 1 > 0$\\newline$x_1 = 2, x_2 = 3$\\newlineVậy tập nghiệm là $\\{2; 3\\}$"
```

**Kết quả hiển thị:**
```
Phương trình x² - 5x + 6 = 0
Δ = 25 - 24 = 1 > 0
x₁ = 2, x₂ = 3
Vậy tập nghiệm là {2; 3}
```

---

## 📝 HƯỚNG DẪN CHI TIẾT

### ✅ TIÊU CHUẨN TỐT:
1. **Nội dung rõ ràng**: Câu hỏi phải dễ hiểu, không ambiguous
2. **Đáp án hợp lý**: Các option sai phải là lỗi thường gặp của học sinh
3. **Lời giải đầy đủ**: Giải thích từng bước, không bỏ xước
4. **Công thức chính xác**: Sử dụng LaTeX đúng cú pháp
5. **Mức độ phù hợp**: Câu hỏi phù hợp với lớp và chương học

### ❌ TRÁNH:
1. ❌ Câu hỏi quá dễ hoặc quá khó
2. ❌ Công thức LaTeX sai cú pháp
3. ❌ Lời giải thiếu bước giữa
4. ❌ Đáp án không có logic
5. ❌ Xuống dòng mà quên `\newline`

---

## 🎓 VÍ DỤ HOÀN CHỈNH

### Ví dụ 1: Multiple Choice
```json
{
  "id": "mc_001",
  "type": "multiple_choice",
  "subject": "Toán 10",
  "chapter": "Phương trình bậc 2",
  "content": "Phương trình $x^2 - 5x + 6 = 0$ có tập nghiệm là:",
  "options": {
    "A": "$\\{2; 3\\}$",
    "B": "$\\{1; 6\\}$",
    "C": "$\\{-2; -3\\}$",
    "D": "$\\{\\frac{1}{2}; 3\\}$"
  },
  "correctAnswer": "A",
  "explanation": "Phương trình $x^2 - 5x + 6 = 0$\\newline$\\Delta = b^2 - 4ac = 25 - 24 = 1 > 0$\\newline$x_1 = \\frac{5 - 1}{2} = 2, \\quad x_2 = \\frac{5 + 1}{2} = 3$\\newlineVậy tập nghiệm là $\\{2; 3\\}$",
  "difficulty": "easy"
}
```

### Ví dụ 2: True/False Group
```json
{
  "id": "tf_001",
  "type": "true_false_group",
  "subject": "Toán 10",
  "chapter": "Hàm số bậc 2",
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
  "difficulty": "medium"
}
```

---

## 🚀 PROMPT CHO AI

### Khi yêu cầu AI sinh câu hỏi:

```
Sinh một câu hỏi trắc nghiệm Toán 10 về "Phương trình bậc 2" với mức độ trung bình.

Yêu cầu:
1. Loại: multiple_choice
2. 4 đáp án A, B, C, D
3. Công thức toán phải trong dấu $ (LaTeX)
4. Lời giải phải có xuống dòng bằng \newline
5. Lời giải giải thích từng bước, không bỏ xước

Format JSON:
{
  "type": "multiple_choice",
  "content": "...",
  "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
  "correctAnswer": "...",
  "explanation": "...\\newline...\\newline...",
  "difficulty": "medium"
}
```

---

## 📞 LƯU Ý QUAN TRỌNG

1. **Luôn kiểm tra cú pháp LaTeX**
   - Sử dụng: `$x^2$` ✅
   - Không sử dụng: `x^2` ❌

2. **Luôn dùng `\newline` thay vì `\n`**
   - Đúng: `"text1\\newlinetext2"` ✅
   - Sai: `"text1\ntext2"` ❌

3. **Đáp án A luôn phải là đáp án đúng** (nếu sinh random, có thể đổi chỗ các option)

4. **Lời giải phải logic và dễ hiểu** cho học sinh lớp 10

---

**File này được sử dụng để huấn luyện AI sinh câu hỏi. Hãy tham khảo các ví dụ thực tế trong `question-examples.json`**
