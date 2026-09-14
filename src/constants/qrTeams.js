// CHẾ ĐỘ THẺ QR — dành cho lớp không có điện thoại.
//
// Bình thường mỗi nhóm phải dùng điện thoại vào phòng thì mới có mặt trong
// `players`, và máy quét mới tìm ra nhóm để ghi đáp án. Lớp không có điện
// thoại thì `players` rỗng nên quét thẻ xong chẳng ghi được gì.
//
// Ở chế độ này giáo viên chỉ khai báo số nhóm: các nhóm được tạo sẵn ngay
// lúc mở phòng, không nhóm nào cần "vào phòng", và giáo viên dùng điện
// thoại của mình quét thẻ giấy để chốt phương án cho từng nhóm.

export const QR_CARD = 'QR_CARD';

// Số thẻ tối đa in được ở trang /print-qr
export const MAX_QR_TEAMS = 12;

const TEAM_COLORS = [
  '#FF6B6B', '#FFA500', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6',
  '#FF69B4', '#2C3E50', '#3498DB', '#16A085', '#E67E22', '#8E44AD'
];

export const isQrCardMode = (settings) => settings?.playMode === QR_CARD;

/**
 * Dựng sẵn danh sách nhóm cho phòng chơi bằng thẻ QR.
 * Tên nhóm cố định là "Nhóm 1", "Nhóm 2"… đúng bằng số in trên thẻ,
 * để giáo viên cầm thẻ lên là biết ngay thẻ đó của nhóm nào.
 */
export const buildQrTeams = (teamCount) => {
  const n = Math.min(MAX_QR_TEAMS, Math.max(1, parseInt(teamCount, 10) || 1));
  const players = {};
  const teams = {};

  for (let i = 1; i <= n; i++) {
    const id = `team_${i}`;
    const name = `Nhóm ${i}`;
    const color = TEAM_COLORS[(i - 1) % TEAM_COLORS.length];

    teams[id] = { id, index: i, name };
    players[id] = {
      id,
      name,
      index: i,
      score: 0,
      currentAnswer: null,
      avatar: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=qrteam${i}&backgroundColor=${color.replace('#', '')}`,
      avatarColor: color,
      avatarEmoji: '🎴',
      avatarName: name,
      // Thẻ giấy không bấm được Ngôi Sao Hy Vọng nên khoá sẵn
      starUsed: true,
      starActive: false,
      // Đánh dấu để màn hình chủ biết nhóm này chơi bằng thẻ, không phải điện thoại
      viaQrCard: true
    };
  }

  return { players, teams, count: n };
};
