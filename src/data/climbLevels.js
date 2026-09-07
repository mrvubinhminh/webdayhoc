// Bốn tầng năng lực theo thang nhận thức, đọc từ cột 10 của file Excel

export const LEVELS = [
  { id: 1, code: 'NB',  name: 'Nhận biết',    short: 'NB',  weight: 1,   color: '#10B981', emoji: '🌱', desc: 'Nhớ và nhận ra kiến thức' },
  { id: 2, code: 'TH',  name: 'Thông hiểu',   short: 'TH',  weight: 1.5, color: '#3B82F6', emoji: '🌿', desc: 'Giải thích được, hiểu bản chất' },
  { id: 3, code: 'VD',  name: 'Vận dụng',     short: 'VD',  weight: 2,   color: '#F59E0B', emoji: '⛰️', desc: 'Áp dụng vào tình huống quen' },
  { id: 4, code: 'VDC', name: 'Vận dụng cao', short: 'VDC', weight: 3,   color: '#EF4444', emoji: '🏔️', desc: 'Giải quyết tình huống mới, phức tạp' },
];

export const levelOf = (id) => LEVELS.find(l => l.id === id) || LEVELS[0];

/**
 * Đọc mức độ từ cột 10. Chấp nhận cả số (1-4) lẫn chữ (NB/TH/VD/VDC),
 * viết hoa thường hay có dấu cách đều được. Bỏ trống thì xếp vào tầng 1.
 */
export const parseLevel = (raw) => {
  if (raw === undefined || raw === null || raw === '') return 1;
  const n = parseInt(raw);
  if (n >= 1 && n <= 4) return n;

  const t = raw.toString().trim().toUpperCase().replace(/\s+/g, '');
  if (t === 'VDC' || t.startsWith('VANDUNGCAO')) return 4;
  if (t === 'VD' || t.startsWith('VANDUNG')) return 3;
  if (t === 'TH' || t.startsWith('THONGHIEU')) return 2;
  if (t === 'NB' || t.startsWith('NHANBIET')) return 1;
  return 1;
};

// Gom câu hỏi theo tầng, giữ nguyên chỉ số gốc để chấm bài
export const groupByLevel = (questions = []) => {
  const groups = { 1: [], 2: [], 3: [], 4: [] };
  questions.forEach((q, idx) => {
    groups[q.level || 1].push(idx);
  });
  return groups;
};

// Số câu phải đúng để được leo lên tầng trên
export const passCountFor = (levelSize, passRatio = 0.5) =>
  levelSize === 0 ? 0 : Math.max(1, Math.ceil(levelSize * passRatio));

// Tổng điểm tối đa của cả đề, dùng để quy về thang 10
export const maxScoreOf = (questions = []) =>
  questions.reduce((s, q) => s + levelOf(q.level || 1).weight, 0);

export const toTen = (earned, max) =>
  max > 0 ? Math.round((earned / max) * 100) / 10 : 0;
