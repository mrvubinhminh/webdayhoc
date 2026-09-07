// Bộ giá trị nghề nghiệp dùng cho hoạt động Đấu Giá Giá Trị Sống.
// Không giá trị nào tốt hơn giá trị nào — ngân sách có hạn mới là điều buộc học sinh phải ưu tiên.

export const VALUES = [
  { id: 'income',    emoji: '💰', name: 'Thu nhập cao',            desc: 'Kiếm được nhiều tiền, lo được cho bản thân và gia đình', color: '#F59E0B' },
  { id: 'stable',    emoji: '🏛️', name: 'Ổn định lâu dài',          desc: 'Công việc chắc chắn, ít lo mất việc, có lương hưu',      color: '#3B82F6' },
  { id: 'creative',  emoji: '🎨', name: 'Tự do sáng tạo',           desc: 'Được nghĩ ra cái mới, làm theo cách của riêng mình',      color: '#EC4899' },
  { id: 'help',      emoji: '🤝', name: 'Giúp đỡ người khác',       desc: 'Công việc mang lại điều tốt cho người xung quanh',        color: '#10B981' },
  { id: 'respect',   emoji: '🏆', name: 'Được tôn trọng',           desc: 'Nghề được xã hội coi trọng, mọi người nể phục',           color: '#EF4444' },
  { id: 'balance',   emoji: '🏡', name: 'Cân bằng với gia đình',    desc: 'Có thời gian cho gia đình, không cuốn hết vào công việc', color: '#84CC16' },
  { id: 'learn',     emoji: '📚', name: 'Được học hỏi liên tục',    desc: 'Luôn có cái mới để học, không bị cũ đi',                  color: '#8B5CF6' },
  { id: 'freedom',   emoji: '🕊️', name: 'Tự chủ giờ giấc',          desc: 'Tự sắp xếp thời gian, không bị gò bó giờ hành chính',     color: '#06B6D4' },
  { id: 'team',      emoji: '👥', name: 'Đồng nghiệp vui vẻ',       desc: 'Làm việc cùng những người hợp ý, không khí thân thiện',   color: '#F97316' },
  { id: 'travel',    emoji: '✈️', name: 'Được đi đây đi đó',        desc: 'Công việc cho đi nhiều nơi, gặp nhiều người',             color: '#0EA5E9' },
  { id: 'challenge', emoji: '⚡', name: 'Thử thách, mạo hiểm',      desc: 'Việc khó, nhiều áp lực nhưng không bao giờ nhàm chán',    color: '#DC2626' },
  { id: 'society',   emoji: '🌏', name: 'Đóng góp cho xã hội',      desc: 'Việc mình làm có ý nghĩa với cộng đồng, đất nước',        color: '#14B8A6' },
  { id: 'family',    emoji: '👨‍👩‍👧', name: 'Được ở gần gia đình',   desc: 'Làm việc gần nhà, không phải đi xa quê',                  color: '#A855F7' },
  { id: 'promote',   emoji: '📈', name: 'Cơ hội thăng tiến',        desc: 'Có lộ trình đi lên rõ ràng, làm tốt là được cất nhắc',    color: '#22C55E' },
  { id: 'calm',      emoji: '🍃', name: 'Ít áp lực, yên bình',      desc: 'Công việc nhẹ nhàng, không căng thẳng, ngủ ngon',         color: '#94A3B8' },
];

export const valueOf = (id) => VALUES.find(v => v.id === id);

export const DEFAULT_BUDGET = 1000;
export const DEFAULT_FLOOR = 50;   // giá sàn: trả dưới mức này thì không sở hữu được
export const DEFAULT_BID_SECONDS = 20;

// Các mức trả giá nhanh, tính theo phần trăm ngân sách còn lại
export const QUICK_BIDS = [
  { pct: 0,   label: 'Bỏ qua',   sub: 'không trả gì',   tone: 'skip' },
  { pct: 10,  label: 'Trả ít',   sub: '10% còn lại',    tone: 'low' },
  { pct: 25,  label: 'Trả vừa',  sub: '25% còn lại',    tone: 'mid' },
  { pct: 50,  label: 'Trả nhiều', sub: '50% còn lại',   tone: 'high' },
  { pct: 100, label: 'DỐC HẾT',  sub: 'toàn bộ còn lại', tone: 'max' },
];

export const bidAmount = (remaining, pct) => Math.floor((remaining || 0) * pct / 100);

/**
 * Chốt một lượt đấu giá.
 * Ai trả từ giá sàn trở lên thì sở hữu giá trị đó và bị trừ đúng số đã trả.
 * Trả dưới sàn thì không mua được nhưng cũng không mất tiền — để học sinh
 * không bị phạt oan khi đã hết ngân sách.
 */
export const settleRound = (bids = {}, floor = DEFAULT_FLOOR) => {
  const entries = Object.entries(bids).map(([id, amount]) => ({ id, amount: amount || 0 }));
  const winners = entries.filter(e => e.amount >= floor);
  const top = winners.reduce((best, e) => (!best || e.amount > best.amount ? e : best), null);
  return {
    winners,
    topId: top?.id || null,
    topAmount: top?.amount || 0,
    // Bao nhiêu phần trăm lớp chịu bỏ tiền cho giá trị này
    demand: entries.length ? Math.round((winners.length / entries.length) * 100) : 0
  };
};

// Bảng giá trị của một em: xếp theo số tiền đã bỏ ra
export const rankValues = (owned = {}) =>
  Object.entries(owned)
    .map(([id, paid]) => ({ value: valueOf(id), paid }))
    .filter(x => x.value)
    .sort((a, b) => b.paid - a.paid);

// Giá trị nào cả lớp trả cao nhất — dùng để dẫn dắt thảo luận cuối buổi
export const classDemand = (players = [], valueIds = []) =>
  valueIds.map(id => {
    const paids = players.map(p => p.owned?.[id]).filter(v => v > 0);
    const totalSpent = paids.reduce((s, v) => s + v, 0);
    return {
      value: valueOf(id),
      buyers: paids.length,
      avgPaid: paids.length ? Math.round(totalSpent / paids.length) : 0,
      totalSpent
    };
  }).filter(x => x.value).sort((a, b) => b.totalSpent - a.totalSpent);
