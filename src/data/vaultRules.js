// Luật chơi Vượt Ải Mật Mã — luyện lại tới khi thành thạo mới được đi tiếp

// Vượt ải ngay lượt đầu được trọn điểm, làm lại vẫn có điểm nhưng giảm dần
export const ATTEMPT_FACTORS = [1, 0.85, 0.7, 0.6];
export const factorFor = (attempt) => ATTEMPT_FACTORS[Math.min(attempt, ATTEMPT_FACTORS.length) - 1] ?? 0.6;

export const DEFAULT_SECRET = 'HOC TOT MOI NGAY';

/**
 * Gom câu hỏi thành các ải theo cột 10.
 * Cột 10 ghi số (1,2,3…) hoặc tên dạng bài ("Phương trình bậc hai").
 * Bỏ trống thì cả đề gộp vào một ải duy nhất.
 */
export const buildGates = (questions = []) => {
  const order = [];
  const map = new Map();

  questions.forEach((q, idx) => {
    const raw = (q.gate ?? '').toString().trim();
    const key = raw === '' ? 'Ải 1' : raw;
    if (!map.has(key)) { map.set(key, []); order.push(key); }
    map.get(key).push(idx);
  });

  // Cột ghi số thì sắp theo số cho đúng thứ tự ải
  const allNumeric = order.every(k => /^\d+$/.test(k));
  const keys = allNumeric ? [...order].sort((a, b) => Number(a) - Number(b)) : order;

  return keys.map((key, i) => ({
    index: i,
    key,
    name: /^\d+$/.test(key) ? `Ải ${key}` : key,
    questionIds: map.get(key)
  }));
};

// Số câu phải đúng trong một lượt để mở được ải
export const passCountFor = (perAttempt, ratio = 0.75) =>
  Math.max(1, Math.ceil(perAttempt * ratio));

/**
 * Rút đề cho một lượt: ưu tiên những câu học sinh chưa gặp,
 * hết mới quay lại dùng câu cũ, nhờ vậy làm lại được đề khác.
 */
export const drawAttempt = (questionIds = [], seen = [], perAttempt = 4) => {
  const seenSet = new Set(seen);
  const fresh = questionIds.filter(id => !seenSet.has(id));
  const used = questionIds.filter(id => seenSet.has(id));
  const pick = (arr, n) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, n);
  };
  const take = Math.min(perAttempt, questionIds.length);
  const chosen = pick(fresh, take);
  if (chosen.length < take) chosen.push(...pick(used, take - chosen.length));
  return chosen;
};

// Chia một danh sách thành đúng k phần, phần đầu nhận phần dư
const splitEvenly = (items, k) => {
  const base = Math.floor(items.length / k);
  const extra = items.length % k;
  const out = [];
  let at = 0;
  for (let i = 0; i < k; i++) {
    const take = base + (i < extra ? 1 : 0);
    out.push(items.slice(at, at + take));
    at += take;
  }
  return out;
};

/**
 * Chia thông điệp bí mật thành đúng một mảnh cho mỗi ải.
 * Đủ từ thì cắt theo từ cho dễ đọc, không đủ thì cắt theo ký tự.
 * Mảnh nào vẫn rỗng (thông điệp ngắn hơn số ải) thì thay bằng dấu sao.
 */
export const splitSecret = (secret, gateCount) => {
  const text = (secret || DEFAULT_SECRET).trim() || DEFAULT_SECRET;
  if (gateCount <= 0) return [];

  const words = text.split(/\s+/).filter(Boolean);
  const parts = words.length >= gateCount
    ? splitEvenly(words, gateCount).map(g => g.join(' '))
    : splitEvenly([...text.replace(/\s+/g, '')], gateCount).map(g => g.join(''));

  return parts.map(p => p || '★');
};

// Điểm thang 10: mỗi ải giá trị bằng nhau, nhân hệ số theo lượt vượt được
export const scoreOf = (gateResults = {}, gateCount = 1) => {
  if (gateCount <= 0) return 0;
  const perGate = 10 / gateCount;
  const total = Object.values(gateResults).reduce(
    (s, r) => s + (r?.passed ? perGate * factorFor(r.attempts || 1) : 0), 0
  );
  return Math.round(total * 10) / 10;
};

// Ải nào cả lớp phải làm lại nhiều nhất chính là chỗ cần dạy lại
export const stuckestGate = (gates, players) => {
  let worst = null;
  gates.forEach(g => {
    const tries = players.map(p => p.gates?.[g.index]?.attempts || 0).filter(n => n > 0);
    if (tries.length === 0) return;
    const avg = tries.reduce((s, n) => s + n, 0) / tries.length;
    const passed = players.filter(p => p.gates?.[g.index]?.passed).length;
    if (!worst || avg > worst.avgAttempts) worst = { gate: g, avgAttempts: avg, passed, tried: tries.length };
  });
  return worst;
};
