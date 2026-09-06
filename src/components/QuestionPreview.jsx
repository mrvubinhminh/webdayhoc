import React, { useState } from 'react';
import { ChevronDown, Check, X, Copy } from 'lucide-react';
import MathText from './MathText';

const QuestionPreview = ({ question }) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  if (!question) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
        ❌ Không có câu hỏi để preview
      </div>
    );
  }

  const isMultipleChoice = question.type === 'multiple_choice';
  const isTrueFalseGroup = question.type === 'true_false_group';

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">
              {isMultipleChoice ? '🎯 Trắc nghiệm đa lựa chọn' : '📋 Nhóm Đúng/Sai'}
            </h3>
            <p className="text-blue-100 text-sm">
              ID: {question.id} {question.difficulty && `• Mức độ: ${question.difficulty}`}
            </p>
          </div>
          <div className="text-right">
            {question.subject && <p className="text-blue-100 text-sm">{question.subject}</p>}
            {question.chapter && <p className="text-blue-100 text-sm">{question.chapter}</p>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Câu hỏi */}
        {isMultipleChoice && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-gray-600 text-sm font-semibold mb-2">📝 Câu hỏi:</p>
              <div className="text-lg text-gray-800">
                <MathText content={question.content} />
              </div>
            </div>

            {/* Đáp án */}
            <div className="space-y-3">
              <p className="text-gray-600 text-sm font-semibold">✏️ Đáp án:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedAnswer(option)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedAnswer === option
                        ? option === question.correctAnswer
                          ? 'bg-green-100 border-green-500'
                          : 'bg-red-100 border-red-500'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                          selectedAnswer === option
                            ? option === question.correctAnswer
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                            : 'bg-gray-300 text-white'
                        }`}
                      >
                        {option}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <MathText content={question.options[option]} />
                      </div>
                      {selectedAnswer === option && (
                        <div>
                          {option === question.correctAnswer ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <X className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* True/False Group */}
        {isTrueFalseGroup && (
          <>
            {/* Group Title */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-gray-600 text-sm font-semibold mb-2">📌 Tiêu đề nhóm:</p>
              <div className="text-lg font-semibold text-gray-800 mb-3">
                <MathText content={question.groupTitle} />
              </div>
              {question.groupContext && (
                <>
                  <p className="text-gray-600 text-sm font-semibold mb-2">Thông tin chung:</p>
                  <div className="text-gray-700 bg-white p-3 rounded">
                    <MathText content={question.groupContext} />
                  </div>
                </>
              )}
            </div>

            {/* Questions in group */}
            <div className="space-y-3">
              <p className="text-gray-600 text-sm font-semibold">📋 Các câu hỏi:</p>
              {question.questions.map((q, idx) => (
                <div key={q.id} className="border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSelectedAnswer(selectedAnswer === q.id ? null : q.id)}
                    className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-start justify-between"
                  >
                    <div className="text-left flex-1">
                      <p className="font-semibold text-gray-800 mb-2">
                        Câu {q.id}: <MathText content={q.content} />
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAnswer(`${q.id}_D`);
                          }}
                          className={`px-3 py-1 rounded text-sm font-bold transition-all ${
                            selectedAnswer === `${q.id}_D`
                              ? q.correctAnswer === 'Đ'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                              : 'bg-white border border-gray-300'
                          }`}
                        >
                          Đ (Đúng)
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAnswer(`${q.id}_S`);
                          }}
                          className={`px-3 py-1 rounded text-sm font-bold transition-all ${
                            selectedAnswer === `${q.id}_S`
                              ? q.correctAnswer === 'S'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                              : 'bg-white border border-gray-300'
                          }`}
                        >
                          S (Sai)
                        </button>
                      </div>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-gray-600 transition-transform flex-shrink-0 ml-4 ${
                        selectedAnswer === q.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {selectedAnswer === q.id && (
                    <div className="border-t border-gray-300 p-4 bg-blue-50">
                      <p className="text-sm font-semibold text-gray-600 mb-2">💡 Lời giải:</p>
                      <div className="text-gray-800 bg-white p-3 rounded">
                        <MathText content={q.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Explanation */}
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg border-2 border-yellow-300 flex items-center justify-between transition-colors"
        >
          <span className="font-semibold text-yellow-900">
            💡 {isMultipleChoice ? 'Lời giải chi tiết' : 'Lưu ý chung'}
          </span>
          <ChevronDown
            size={20}
            className={`text-yellow-700 transition-transform ${showExplanation ? 'rotate-180' : ''}`}
          />
        </button>

        {showExplanation && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="text-gray-800 space-y-2">
              <MathText content={question.explanation} />
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-2">
          {question.difficulty && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {question.difficulty === 'easy' ? '⭐ Dễ' :
               question.difficulty === 'medium' ? '⭐⭐ Trung bình' :
               '⭐⭐⭐ Khó'}
            </span>
          )}
          {question.subject && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              📚 {question.subject}
            </span>
          )}
          {question.chapter && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              📖 {question.chapter}
            </span>
          )}
        </div>
      </div>

      {/* JSON Preview */}
      <div className="bg-gray-900 text-gray-100 p-4 max-h-48 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-400">📋 JSON:</span>
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(question, null, 2))}
            className="text-xs flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            <Copy size={12} /> Copy
          </button>
        </div>
        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
          {JSON.stringify(question, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default QuestionPreview;
