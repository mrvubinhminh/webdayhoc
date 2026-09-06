// Luật chơi Ngọn Hải Đăng — cả lớp là MỘT đội, không có bảng xếp hạng cá nhân

export const MAX_FUEL = 100;

// Ba mức bão: gió thổi hao bao nhiêu dầu mỗi câu
export const DIFFICULTIES = [
  { id: 'calm',  name: '🌤️ Biển lặng', wind: 8,  gain: 24, storm: 0.55, desc: 'Chỉ cần hơn 1/3 lớp đúng là giữ được lửa' },
  { id: 'windy', name: '🌊 Sóng lớn',  wind: 12, gain: 24, storm: 0.65, desc: 'Cần một nửa lớp đúng — mức chuẩn' },
  { id: 'storm', name: '🌪️ Bão tố',   wind: 16, gain: 24, storm: 0.75, desc: 'Cần 2/3 lớp đúng, dành cho lớp đã quen' },
];

// Cứ mấy câu lại có một cơn bão lớn cần cả lớp cùng vượt ngưỡng
export const STORM_EVERY = 5;
export const STORM_PENALTY = 15;
export const STORM_BONUS = 10;

export const isStormQuestion = (idx, total) => {
  if (idx < 0) return false;
  // Câu cuối luôn là cơn bão lớn nhất
  if (idx === total - 1) return true;
  return (idx + 1) % STORM_EVERY === 0;
};

/**
 * Tính lượng dầu thay đổi sau một câu.
 * Tỉ lệ lớp trả lời đúng góp dầu, gió biển thổi hao đi.
 */
export const fuelDelta = ({ correctRatio, difficulty, isStorm }) => {
  const d = DIFFICULTIES.find(x => x.id === difficulty) || DIFFICULTIES[1];
  let delta = Math.round(correctRatio * d.gain) - d.wind;
  let stormPassed = null;

  if (isStorm) {
    stormPassed = correctRatio >= d.storm;
    delta += stormPassed ? STORM_BONUS : -STORM_PENALTY;
  }
  return { delta, stormPassed, threshold: d.storm, breakEven: d.wind / d.gain };
};

export const clampFuel = (v) => Math.max(0, Math.min(MAX_FUEL, Math.round(v)));

// Xếp loại cả lớp theo hành trình, không xếp hạng từng em
export const classRating = ({ fuel, blackouts, stormsPassed, stormsTotal }) => {
  if (fuel >= 80 && blackouts === 0 && stormsPassed === stormsTotal)
    return { title: 'HUYỀN THOẠI BIỂN KHƠI', emoji: '🌟', color: 'text-yellow-300', note: 'Lửa chưa từng tắt, vượt trọn mọi cơn bão!' };
  if (fuel >= 50 && blackouts === 0)
    return { title: 'NGƯỜI GIỮ LỬA XUẤT SẮC', emoji: '🏅', color: 'text-amber-300', note: 'Cả đêm bão không một phút tối đèn.' };
  if (fuel > 0)
    return { title: 'ĐOÀN TÀU ĐÃ VỀ BẾN', emoji: '⚓', color: 'text-emerald-300', note: 'Có lúc chao đảo nhưng cả lớp đã giữ được ánh sáng.' };
  return { title: 'BÌNH MINH VẪN TỚI', emoji: '🌅', color: 'text-sky-300', note: 'Đêm nay lửa tắt, nhưng buổi sau ta thắp lại cùng nhau.' };
};
