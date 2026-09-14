// Mỗi trò chơi lưu phòng ở một nhánh riêng trên Firebase.
// Trang dọn dẹp quét đúng danh sách này.
export const ROOM_NAMESPACES = [
  { path: 'rooms',           label: 'Trò chơi gốc',          emoji: '🎯' },
  { path: 'treasureRooms',   label: 'Truy Tìm Kho Báu',      emoji: '🏴‍☠️' },
  { path: 'bankRooms',       label: 'Ngân Hàng Tri Thức',    emoji: '🏦' },
  { path: 'lighthouseRooms', label: 'Ngọn Hải Đăng',         emoji: '🏮' },
  { path: 'raceRooms',       label: 'Đường Đua Tri Thức',    emoji: '🏁' },
  { path: 'climbRooms',      label: 'Leo Núi Tri Thức',      emoji: '⛰️' },
  { path: 'vaultRooms',      label: 'Vượt Ải Mật Mã',        emoji: '🗝️' },
  { path: 'compassRooms',    label: 'La Bàn Nghề Nghiệp',    emoji: '🧭' },
  { path: 'valuesRooms',     label: 'Đấu Giá Giá Trị Sống',  emoji: '💎' },
  { path: 'scenarioRooms',   label: 'Phòng Tình Huống',      emoji: '🎭' },
  { path: 'pathRooms',       label: 'Lộ Trình Nghề Nghiệp',  emoji: '🗺️' }
];

const GIO = 60 * 60 * 1000;
export const CON_MOI_GIO = 6;    // dưới ngần này giờ thì coi như buổi học đang diễn ra
export const QUA_CU_GIO = 24;    // quá ngần này giờ thì chắc chắn là phòng bỏ quên

/**
 * Xét một phòng là rác hay đang dùng.
 * Nguyên tắc: thà giữ nhầm còn hơn xoá nhầm buổi học đang chạy.
 */
export const xetPhong = (room, now = Date.now()) => {
  const players = Object.keys(room?.players || {}).length;
  const status = room?.status || '—';
  const createdAt = room?.createdAt || null;
  const tuoiGio = createdAt ? (now - createdAt) / GIO : null;

  if (status === 'END') return { rac: true, ly_do: 'Đã chơi xong', players, status, tuoiGio };
  if (players === 0)    return { rac: true, ly_do: 'Mở ra nhưng không ai vào', players, status, tuoiGio };
  if (tuoiGio === null) return { rac: true, ly_do: 'Tạo trước khi có mốc thời gian', players, status, tuoiGio };
  if (tuoiGio > QUA_CU_GIO) return { rac: true, ly_do: `Bỏ quên ${Math.floor(tuoiGio)} giờ`, players, status, tuoiGio };
  if (tuoiGio < CON_MOI_GIO) return { rac: false, ly_do: 'Có thể đang dạy', players, status, tuoiGio };
  return { rac: false, ly_do: 'Chưa chắc — tự chọn nếu muốn xoá', players, status, tuoiGio };
};

export const doiTuoi = (tuoiGio) => {
  if (tuoiGio === null || tuoiGio === undefined) return 'không rõ';
  if (tuoiGio < 1) return `${Math.max(1, Math.round(tuoiGio * 60))} phút`;
  if (tuoiGio < 48) return `${Math.floor(tuoiGio)} giờ`;
  return `${Math.floor(tuoiGio / 24)} ngày`;
};

export const coChu = (bytes) => bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
