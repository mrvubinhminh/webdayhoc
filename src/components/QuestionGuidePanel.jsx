import React, { useState } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import guideMD from '../data/AI_PROMPT_GUIDE.md?raw';

const QuestionGuidePanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const multipleChoiceExample = {
    type: "multiple_choice",
    content: "Giải phương trình $x^2 - 5x + 6 = 0$. Tập nghiệm là:",
    options: {
      A: "$\\{2; 3\\}$",
      B: "$\\{1; 6\\}$",
      C: "$\\{-2; -3\\}$",
      D: "$\\{\\frac{1}{2}; 3\\}$"
    },
    correctAnswer: "A",
    explanation: "Phương trình $x^2 - 5x + 6 = 0$\\newline$\\Delta = b^2 - 4ac = 25 - 24 = 1 > 0$\\newline$x_1 = \\frac{5 - 1}{2} = 2, \\quad x_2 = \\frac{5 + 1}{2} = 3$\\newlineVậy tập nghiệm là $\\{2; 3\\}$",
    difficulty: "easy"
  };

  const trueFalseExample = {
    type: "true_false_group",
    groupTitle: "Xét hàm số $f(x) = -x^2 + 4x + 5$",
    groupContext: "Đây là một parabol quay bề lõm xuống",
    questions: [
      {
        id: 1,
        content: "Trục đối xứng của parabol là $x = 2$",
        correctAnswer: "Đ",
        explanation: "Trục đối xứng: $x = -\\frac{b}{2a} = -\\frac{4}{-2} = 2$"
      },
      {
        id: 2,
        content: "Đỉnh của parabol là $(2; 9)$",
        correctAnswer: "Đ",
        explanation: "Tại $x = 2$: $f(2) = -4 + 8 + 5 = 9$"
      }
    ],
    difficulty: "medium"
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg border border-blue-200 shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📚</span>
          <div className="text-left">
            <h3 className="font-bold text-lg text-blue-900">Hướng dẫn Sinh câu hỏi cho AI</h3>
            <p className="text-sm text-blue-600">JSON + LaTeX + \\newline</p>
          </div>
        </div>
        <ChevronDown
          size={24}
          className={`text-blue-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-blue-200 px-6 py-4 space-y-6">
          {/* 2 Loại câu hỏi */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Loại 1 */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-2">1️⃣ Trắc nghiệm đa lựa chọn</h4>
              <p className="text-sm text-gray-700 mb-3">4 đáp án A, B, C, D - Chọn 1 đáp án đúng</p>
              <div className="bg-white p-3 rounded text-xs font-mono overflow-x-auto mb-2 max-h-40">
                <code>{JSON.stringify(multipleChoiceExample, null, 2)}</code>
              </div>
              <button
                onClick={() => copyToClipboard(JSON.stringify(multipleChoiceExample, null, 2))}
                className="flex items-center gap-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                Copy
              </button>
            </div>

            {/* Loại 2 */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-bold text-green-900 mb-2">2️⃣ Nhóm Đúng/Sai</h4>
              <p className="text-sm text-gray-700 mb-3">Nhóm câu hỏi, mỗi câu chọn Đ (Đúng) hay S (Sai)</p>
              <div className="bg-white p-3 rounded text-xs font-mono overflow-x-auto mb-2 max-h-40">
                <code>{JSON.stringify(trueFalseExample, null, 2)}</code>
              </div>
              <button
                onClick={() => copyToClipboard(JSON.stringify(trueFalseExample, null, 2))}
                className="flex items-center gap-2 text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                Copy
              </button>
            </div>
          </div>

          {/* LaTeX Guide */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-bold text-purple-900 mb-2">🧮 Công thức LaTeX</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div>
                <code className="bg-white px-2 py-1 rounded">${`x^2`}$</code>
                <p className="text-gray-600">Bình phương</p>
              </div>
              <div>
                <code className="bg-white px-2 py-1 rounded">${`\\Delta`}$</code>
                <p className="text-gray-600">Delta</p>
              </div>
              <div>
                <code className="bg-white px-2 py-1 rounded">${`\\frac{a}{b}`}$</code>
                <p className="text-gray-600">Phân số</p>
              </div>
              <div>
                <code className="bg-white px-2 py-1 rounded">${`\\vec{AB}`}$</code>
                <p className="text-gray-600">Vectơ</p>
              </div>
              <div>
                <code className="bg-white px-2 py-1 rounded">${`(-\\infty; 3)`}$</code>
                <p className="text-gray-600">Khoảng</p>
              </div>
              <div>
                <code className="bg-white px-2 py-1 rounded">${`\\{2; 3\\}`}$</code>
                <p className="text-gray-600">Tập hợp</p>
              </div>
            </div>
          </div>

          {/* Xuống dòng */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-bold text-orange-900 mb-2">↩️ Xuống dòng trong lời giải</h4>
            <p className="text-sm text-gray-700 mb-2">Sử dụng <code className="bg-white px-2 py-1 rounded">\\newline</code></p>
            <div className="bg-white p-3 rounded text-xs">
              <p className="font-mono mb-2">
                "explanation": "Bước 1<span className="text-orange-600">\\newline</span>Bước 2<span className="text-orange-600">\\newline</span>Bước 3"
              </p>
              <p className="text-gray-600">
                ✅ Đúng: <code className="bg-gray-100 px-1">\newline</code><br/>
                ❌ Sai: <code className="bg-gray-100 px-1">\n</code>
              </p>
            </div>
          </div>

          {/* AI Prompt */}
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <h4 className="font-bold text-indigo-900 mb-2">🤖 Prompt cho AI sinh câu hỏi</h4>
            <div className="bg-white p-3 rounded text-xs text-gray-700 space-y-2 max-h-48 overflow-y-auto">
              <p className="text-sm">Ví dụ yêu cầu AI:</p>
              <code className="block bg-gray-100 p-2 rounded">
{`Sinh một câu hỏi trắc nghiệm Toán 10 về "Phương trình bậc 2" mức độ trung bình.

Yêu cầu:
1. Format: JSON (type: "multiple_choice")
2. 4 đáp án A, B, C, D
3. Công thức toán trong dấu $...$
4. Lời giải xuống dòng bằng \\newline
5. Giải thích từng bước, không bỏ xước

Return format:
{
  "type": "multiple_choice",
  "content": "...",
  "options": {...},
  "correctAnswer": "...",
  "explanation": "...\\newline...",
  "difficulty": "medium"
}`}
              </code>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-bold text-yellow-900 mb-2">⚡ Lưu ý quan trọng</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✅ Luôn dùng <code className="bg-white px-1">$...$</code> cho công thức toán</li>
              <li>✅ Luôn dùng <code className="bg-white px-1">\\newline</code> để xuống dòng (không <code className="bg-white px-1">\n</code>)</li>
              <li>✅ Lời giải phải đầy đủ, giải thích từng bước</li>
              <li>✅ Đáp án sai phải là những lỗi thường gặp của học sinh</li>
              <li>❌ Tránh câu hỏi quá dễ, quá khó hoặc ambiguous</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionGuidePanel;
