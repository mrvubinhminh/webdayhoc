// Luật cược của Ngân Hàng Tri Thức, dùng chung cho màn giáo viên và màn học sinh

// Bốn mức cược tính theo % vốn đang có, nên nhóm nghèo nhất vẫn cược được
export const BET_LEVELS = [
  { percent: 10, label: 'An toàn', sub: '10% vốn', color: 'from-emerald-500 to-emerald-600' },
  { percent: 25, label: 'Tự tin', sub: '25% vốn', color: 'from-sky-500 to-sky-600' },
  { percent: 50, label: 'Chắc chắn', sub: '50% vốn', color: 'from-orange-500 to-orange-600' },
  { percent: 100, label: 'TẤT TAY', sub: 'Toàn bộ vốn', color: 'from-red-500 to-red-600' },
];

export const DEFAULT_BET_TIME = 12;
export const DEFAULT_CAPITAL = 1000;

// Vốn tụt dưới mức này sẽ được cấp lại đúng bằng nó — không nhóm nào bị loại
export const BAILOUT = 100;

export const betAmountOf = (capital, percent) =>
  Math.max(1, Math.round((capital || 0) * (percent || 10) / 100));
