import React, { useState } from 'react';
import { ArrowLeft, Copy, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuestionPreview from '../components/QuestionPreview';
import examplesData from '../data/question-examples.json';

const QuestionTester = () => {
  const navigate = useNavigate();
  const [jsonInput, setJsonInput] = useState('');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');

  const parseJSON = () => {
    setError('');
    try {
      const parsed = JSON.parse(jsonInput);

      // Handle both array and object with questions property
      let questionsArray = Array.isArray(parsed) ? parsed : parsed.questions || [parsed];

      if (!questionsArray.length) {
        setError('❌ Không tìm thấy câu hỏi nào');
        return;
      }

      setQuestions(questionsArray);
      setCurrentQuestionIdx(0);
    } catch (err) {
      setError(`❌ Lỗi JSON: ${err.message}`);
    }
  };

  const loadExamples = () => {
    setQuestions(examplesData.examples);
    setCurrentQuestionIdx(0);
    setJsonInput(JSON.stringify(examplesData.examples, null, 2));
    setError('');
  };

  const currentQuestion = questions[currentQuestionIdx];

  const downloadJSON = () => {
    const dataStr = JSON.stringify(questions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'questions.json';
    link.click();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/games')}
          className="flex items-center gap-2 text-gray-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Quay lại
        </button>

        <h1 className="text-4xl font-black text-white mb-2">🧪 Test Câu hỏi JSON</h1>
        <p className="text-gray-300 mb-8">
          Paste JSON câu hỏi để xem preview và kiểm tra format
        </p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">📝 Nhập JSON</h2>
                <button
                  onClick={loadExamples}
                  className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded transition-colors"
                >
                  📚 Dùng ví dụ
                </button>
              </div>

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`Paste JSON tại đây, ví dụ:
{
  "type": "multiple_choice",
  "content": "Câu hỏi...",
  "options": {...},
  "correctAnswer": "A",
  "explanation": "Giải thích..."
}`}
                className="w-full h-96 bg-slate-800 text-white rounded-lg p-4 font-mono text-sm border border-slate-700 focus:border-blue-500 focus:outline-none resize-none"
              />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={parseJSON}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  ▶️ Parse JSON
                </button>
                <button
                  onClick={() => copyToClipboard(jsonInput)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <Copy size={18} />
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-900/30 border border-red-600 text-red-200 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {questions.length > 0 && (
                <div className="mt-4 p-4 bg-green-900/30 border border-green-600 text-green-200 rounded-lg text-sm">
                  ✅ {questions.length} câu hỏi được tìm thấy
                </div>
              )}
            </div>

            {/* Quick Copy Examples */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-4">📋 Template nhanh</h3>
              <div className="space-y-2">
                <div className="bg-slate-800 p-3 rounded-lg">
                  <p className="text-gray-300 text-xs mb-2">Multiple Choice:</p>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify({
                      type: "multiple_choice",
                      content: "Câu hỏi $...$",
                      options: { A: "ĐA A $...$", B: "ĐA B", C: "ĐA C", D: "ĐA D" },
                      correctAnswer: "A",
                      explanation: "Giải thích\\newlineXuống dòng",
                      difficulty: "medium"
                    }, null, 2))}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Copy template →
                  </button>
                </div>

                <div className="bg-slate-800 p-3 rounded-lg">
                  <p className="text-gray-300 text-xs mb-2">True/False Group:</p>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify({
                      type: "true_false_group",
                      groupTitle: "Tiêu đề nhóm $...$",
                      groupContext: "Thông tin chung",
                      questions: [
                        { id: 1, content: "Câu 1 $...$", correctAnswer: "Đ", explanation: "Giải thích" },
                        { id: 2, content: "Câu 2 $...$", correctAnswer: "S", explanation: "Giải thích" }
                      ],
                      difficulty: "medium"
                    }, null, 2))}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Copy template →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="space-y-4">
            {questions.length > 0 ? (
              <>
                {/* Navigation */}
                <div className="flex items-center justify-between bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
                  <button
                    onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                    disabled={currentQuestionIdx === 0}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                  >
                    ← Trước
                  </button>

                  <span className="text-white font-bold">
                    Câu {currentQuestionIdx + 1} / {questions.length}
                  </span>

                  <button
                    onClick={() => setCurrentQuestionIdx(Math.min(questions.length - 1, currentQuestionIdx + 1))}
                    disabled={currentQuestionIdx === questions.length - 1}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                  >
                    Sau →
                  </button>

                  <button
                    onClick={downloadJSON}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                  >
                    <Download size={16} /> Download
                  </button>
                </div>

                {/* Preview */}
                <QuestionPreview question={currentQuestion} />
              </>
            ) : (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 text-center">
                <p className="text-gray-300 text-lg mb-4">📦 Chưa có câu hỏi</p>
                <p className="text-gray-400 text-sm mb-6">
                  Nhập hoặc paste JSON để xem preview
                </p>
                <button
                  onClick={loadExamples}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  📚 Tải ví dụ mẫu
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionTester;
