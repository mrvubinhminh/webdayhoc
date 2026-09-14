// Gom các câu hỏi mà lớp làm sai nhiều nhất, để chiếu lên chữa lại cuối giờ.

/**
 * Xếp câu hỏi theo số người làm sai, nhiều nhất lên trước.
 * `wrongCountOf(q, index)` tuỳ từng trò chơi mà đếm theo cách khác nhau.
 */
export const rankWrongQuestions = (questions, wrongCountOf) =>
  (questions || [])
    .map((q, index) => ({ ...q, index, wrongCount: wrongCountOf(q, index) || 0 }))
    .filter(q => q.wrongCount > 0)
    .sort((a, b) => b.wrongCount - a.wrongCount || a.index - b.index);

/**
 * Các trò chơi cả lớp cùng nhịp (Trò chơi gốc, Kho Báu, Ngân Hàng, Hải Đăng)
 * đã đếm sẵn số người sai ngay khi công bố đáp án.
 */
export const wrongCountFromQuestion = (q) => q.wrongCount || 0;

/**
 * Các trò chơi mỗi em làm theo nhịp riêng (Đường Đua, Leo Núi, Vượt Ải)
 * không có mốc công bố chung, nên mỗi người tự đánh dấu câu mình làm sai
 * vào `wrongs`. Ở đây chỉ việc cộng lại.
 */
export const wrongCountFromPlayers = (players) => {
  const tally = {};
  Object.values(players || {}).forEach(p => {
    Object.keys(p?.wrongs || {}).forEach(idx => {
      tally[idx] = (tally[idx] || 0) + 1;
    });
  });
  return (q, index) => tally[index] || 0;
};
