export const questions = [
  {
    question: "Tập hợp $A = \\{x \\in \\mathbb{R} \\mid x^2 - 4 = 0\\}$ có bao nhiêu phần tử?",
    options: ["1", "2", "3", "0"],
    answer: 1, // index of "2"
    level: 1
  },
  {
    question: "Phủ định của mệnh đề '$\\forall x \\in \\mathbb{R}, x^2 > 0$' là gì?",
    options: [
      "$\\exists x \\in \\mathbb{R}, x^2 > 0$",
      "$\\forall x \\in \\mathbb{R}, x^2 \\le 0$",
      "$\\exists x \\in \\mathbb{R}, x^2 \\le 0$",
      "$\\exists x \\in \\mathbb{R}, x^2 < 0$"
    ],
    answer: 2, // index 2
    level: 2
  },
  {
    question: "Cho tập hợp $A = [-2; 5)$ và $B = (1; +\\infty)$. Tìm $A \\cap B$.",
    options: ["$[-2; +\\infty)$", "$(1; 5)$", "$[-2; 1]$", "$(1; 5]$"],
    answer: 1,
    level: 3
  },
  {
    question: "Điều kiện xác định của hàm số $y = \\sqrt{x-2} + \\frac{1}{x-3}$ là:",
    options: ["$x \\ge 2$", "$x > 3$", "$x \\ge 2$ và $x \\ne 3$", "$x \\ne 3$"],
    answer: 2,
    level: 4
  },
  {
    question: "Hàm số nào sau đây là hàm số lẻ?",
    options: ["$y = x^2 + 1$", "$y = x^3 - x$", "$y = |x|$", "$y = x^2 - x$"],
    answer: 1,
    level: 5
  },
  {
    question: "Cho tam giác ABC. Khẳng định nào sau đây là đúng về vectơ?",
    options: [
      "$\\vec{AB} + \\vec{BC} = \\vec{CA}$",
      "$\\vec{AB} + \\vec{BC} = \\vec{AC}$",
      "$\\vec{AB} - \\vec{AC} = \\vec{BC}$",
      "$\\vec{AB} = \\vec{BA}$"
    ],
    answer: 1,
    level: 6
  },
  {
    question: "Tọa độ đỉnh của parabol $y = x^2 - 4x + 3$ là:",
    options: ["$(2; -1)$", "$(-2; 15)$", "$(2; 1)$", "$(4; 3)$"],
    answer: 0,
    level: 7
  },
  {
    question: "Cho $\\vec{a} = (1; 2)$ và $\\vec{b} = (-3; 1)$. Tính $\\vec{a} \\cdot \\vec{b}$.",
    options: ["-1", "5", "1", "0"],
    answer: 0,
    level: 8
  },
  {
    question: "Giá trị của $\\cos 120^\\circ$ là bao nhiêu?",
    options: ["$\\frac{1}{2}$", "$-\\frac{1}{2}$", "$\\frac{\\sqrt{3}}{2}$", "$-\\frac{\\sqrt{3}}{2}$"],
    answer: 1,
    level: 9
  },
  {
    question: "Bất phương trình $x^2 - 3x + 2 < 0$ có tập nghiệm là:",
    options: ["$(1; 2)$", "$(-\\infty; 1) \\cup (2; +\\infty)$", "$[1; 2]$", "$(1; +\\infty)$"],
    answer: 0,
    level: 10
  },
  {
    question: "Cho tam giác ABC có $a=8, b=10, \\widehat{C} = 60^\\circ$. Tính diện tích $S$.",
    options: ["$40$", "$40\\sqrt{3}$", "$20\\sqrt{3}$", "$20$"],
    answer: 2,
    level: 11
  },
  {
    question: "Trong mặt phẳng tọa độ, khoảng cách từ điểm $M(1; -2)$ đến đường thẳng $\\Delta: 3x - 4y + 4 = 0$ là:",
    options: ["$3$", "$5$", "$15$", "$1$"],
    answer: 0, // (3(1) - 4(-2) + 4)/5 = 15/5 = 3
    level: 12
  },
  {
    question: "Số quy tròn của $a = 12,4567$ với độ chính xác $d = 0,01$ là:",
    options: ["$12,45$", "$12,46$", "$12,457$", "$12,5$"],
    answer: 1,
    level: 13
  },
  {
    question: "Phương trình tham số của đường thẳng đi qua $A(1; 2)$ và có VTCP $\\vec{u}=(3; -1)$ là:",
    options: [
      "$\\begin{cases} x=1+3t \\\\ y=2-t \\end{cases}$",
      "$\\begin{cases} x=3+t \\\\ y=-1+2t \\end{cases}$",
      "$\\begin{cases} x=1-t \\\\ y=2+3t \\end{cases}$",
      "$\\begin{cases} x=1+2t \\\\ y=3-t \\end{cases}$"
    ],
    answer: 0,
    level: 14
  },
  {
    question: "Cho hệ bất phương trình $\\begin{cases} x-y>0 \\\\ x+y<2 \\end{cases}$. Điểm nào sau đây thuộc miền nghiệm?",
    options: ["$(2; 1)$", "$(0; 0)$", "$(1; -1)$", "$(1; 2)$"],
    answer: 2,
    level: 15
  }
];

export const prizeLadder = [
  "200.000", "400.000", "600.000", "1.000.000", "2.000.000",
  "3.000.000", "6.000.000", "10.000.000", "14.000.000", "22.000.000",
  "30.000.000", "40.000.000", "60.000.000", "85.000.000", "150.000.000"
];
