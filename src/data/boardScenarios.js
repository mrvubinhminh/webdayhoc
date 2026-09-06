/**
 * Kịch bản ô đặc biệt cho Bản Đồ Kho Báu.
 * Mỗi kịch bản nhận kích thước lưới và sinh ra bộ ô { số ô: số bước }.
 * Bước dương = tiến, bước âm = lùi.
 *
 * Ràng buộc chung để bàn cờ luôn hợp lệ:
 *  - Không đặt ở ô 1 (xuất phát) và ô cuối (đích)
 *  - Ô tiến không đẩy thẳng vào đích — đích chỉ chạm được bằng xúc sắc
 *  - Ô lùi không đẩy xuống dưới ô 1
 *  - Đích đến của một ô không được là ô đặc biệt khác (tránh dây chuyền khó hiểu)
 */

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Bộ dựng bàn cờ: thêm ô đặc biệt vào vùng chỉ định theo tỉ lệ vị trí.
 * from/to là tỉ lệ 0..1 trên tổng số ô.
 */
class BoardBuilder {
  constructor(size) {
    this.total = size * size;
    this.cells = {};
  }

  // Danh sách ô hợp lệ còn trống trong vùng [from, to]
  freeCellsIn(from, to) {
    const lo = Math.max(2, Math.round(this.total * from));
    const hi = Math.min(this.total - 1, Math.round(this.total * to));
    const out = [];
    for (let c = lo; c <= hi; c++) {
      if (!(c in this.cells)) out.push(c);
    }
    return out;
  }

  // Thêm n ô trong vùng, bước lấy ngẫu nhiên trong [minStep, maxStep] (âm = lùi)
  add(from, to, count, minStep, maxStep) {
    const candidates = shuffle(this.freeCellsIn(from, to));
    let added = 0;
    for (const cell of candidates) {
      if (added >= count) break;
      const step = rnd(minStep, maxStep);
      if (step === 0) continue;
      const target = cell + step;
      // Không vượt đích, không lùi quá vạch xuất phát
      if (target >= this.total || target < 1) continue;
      // Đích đến không được là ô đặc biệt khác
      if (target in this.cells) continue;
      // Ô đặc biệt khác cũng không được đang trỏ vào ô này
      const conflict = Object.entries(this.cells).some(([c, s]) => Number(c) + s === cell);
      if (conflict) continue;
      this.cells[cell] = step;
      added++;
    }
    return this;
  }

  build() {
    return this.cells;
  }
}

// Số ô đặc biệt tỉ lệ theo độ lớn bàn, luôn ít nhất 1
const byDensity = (total, ratio) => Math.max(1, Math.round(total * ratio));

export const BOARD_SCENARIOS = [
  {
    id: 'balanced',
    name: '⚖️ Cân Bằng',
    desc: 'Tiến và lùi chia đều khắp bàn, nhịp chơi ổn định — hợp buổi đầu làm quen.',
    build: (size) => {
      const t = size * size;
      const n = byDensity(t, 0.18);
      return new BoardBuilder(size)
        .add(0.1, 0.9, Math.ceil(n / 2), 2, 4)
        .add(0.1, 0.9, Math.floor(n / 2), -4, -2)
        .build();
    }
  },
  {
    id: 'storm_finish',
    name: '🌩️ Bão Tố Cuối Đường',
    desc: 'Nửa đầu êm ả, càng gần đích càng nhiều bẫy nặng — nhóm dẫn đầu luôn nơm nớp.',
    build: (size) => {
      const t = size * size;
      return new BoardBuilder(size)
        .add(0.1, 0.5, byDensity(t, 0.08), 2, 3)
        .add(0.65, 0.95, byDensity(t, 0.16), -7, -4)
        .add(0.5, 0.7, byDensity(t, 0.05), 2, 3)
        .build();
    }
  },
  {
    id: 'speedway',
    name: '🚀 Đường Tắt Thần Tốc',
    desc: 'Dày đặc ô tiến, ít bẫy — ván đấu ngắn, dồn dập, kết thúc nhanh.',
    build: (size) => {
      const t = size * size;
      return new BoardBuilder(size)
        .add(0.1, 0.85, byDensity(t, 0.22), 3, 6)
        .add(0.3, 0.8, byDensity(t, 0.05), -3, -2)
        .build();
    }
  },
  {
    id: 'snake_maze',
    name: '🐍 Mê Cung Đảo Rắn',
    desc: 'Bẫy lùi áp đảo, đường về đích gian nan — thưởng cho nhóm bền bỉ.',
    build: (size) => {
      const t = size * size;
      return new BoardBuilder(size)
        .add(0.15, 0.9, byDensity(t, 0.22), -6, -3)
        .add(0.2, 0.8, byDensity(t, 0.07), 2, 4)
        .build();
    }
  },
  {
    id: 'comeback',
    name: '🔥 Lật Kèo Phút Chót',
    desc: 'Cú tiến cực mạnh nằm ở đoạn cuối — nhóm bét bảng vẫn còn nguyên cửa thắng.',
    build: (size) => {
      const t = size * size;
      return new BoardBuilder(size)
        .add(0.55, 0.85, byDensity(t, 0.1), 6, 10)
        .add(0.15, 0.5, byDensity(t, 0.08), 2, 4)
        .add(0.7, 0.95, byDensity(t, 0.08), -5, -3)
        .build();
    }
  },
  {
    id: 'tsunami',
    name: '🌊 Sóng Thần',
    desc: 'Tiến và lùi xen kẽ liên tục như từng con sóng — thứ hạng đảo lộn mỗi lượt.',
    build: (size) => {
      const t = size * size;
      const b = new BoardBuilder(size);
      const n = byDensity(t, 0.24);
      for (let i = 0; i < n; i++) {
        const zone = 0.12 + (i / n) * 0.75;
        if (i % 2 === 0) b.add(zone, zone + 0.08, 1, 3, 5);
        else b.add(zone, zone + 0.08, 1, -5, -3);
      }
      return b.build();
    }
  },
  {
    id: 'abyss',
    name: '💀 Vực Sâu Tử Thần',
    desc: 'Vài hố sâu kéo tuột về gần vạch xuất phát — một bước sảy chân là trả giá đắt.',
    build: (size) => {
      const t = size * size;
      const deep = Math.max(-Math.round(t * 0.35), -20);
      return new BoardBuilder(size)
        .add(0.45, 0.85, Math.max(2, byDensity(t, 0.06)), deep, Math.round(deep / 2))
        .add(0.15, 0.6, byDensity(t, 0.1), 3, 5)
        .add(0.6, 0.9, byDensity(t, 0.06), -4, -2)
        .build();
    }
  },
  {
    id: 'golden_launch',
    name: '⭐ Bệ Phóng Vàng',
    desc: 'Ít ô nhưng ô nào cũng khủng — trúng là bay vọt, dính là rơi thẳng.',
    build: (size) => {
      const t = size * size;
      const big = Math.max(6, Math.round(t * 0.2));
      return new BoardBuilder(size)
        .add(0.2, 0.7, Math.max(2, byDensity(t, 0.05)), big - 2, big + 2)
        .add(0.45, 0.9, Math.max(2, byDensity(t, 0.05)), -(big + 2), -(big - 2))
        .build();
    }
  },
  {
    id: 'chaos',
    name: '🌀 Ma Trận Hỗn Loạn',
    desc: 'Mật độ ô đặc biệt dày nhất — gần như lượt nào cũng có chuyện xảy ra.',
    build: (size) => {
      const t = size * size;
      return new BoardBuilder(size)
        .add(0.08, 0.95, byDensity(t, 0.2), 2, 6)
        .add(0.08, 0.95, byDensity(t, 0.2), -6, -2)
        .build();
    }
  },
  {
    id: 'showdown',
    name: '🏁 Cuộc Đua Kịch Tính',
    desc: 'Hai đầu bàn yên tĩnh, khúc giữa là chiến trường — bứt phá hay gục ngã đều ở đó.',
    build: (size) => {
      const t = size * size;
      return new BoardBuilder(size)
        .add(0.35, 0.65, byDensity(t, 0.14), 4, 7)
        .add(0.35, 0.7, byDensity(t, 0.14), -7, -4)
        .build();
    }
  }
];

/**
 * Tự tạo ngẫu nhiên một bàn cân bằng mà vẫn gay cấn:
 * nửa đầu thiên về tiến để mở màn nhanh, nửa sau thêm bẫy để giữ kịch tính,
 * và luôn cài một cú lật kèo ở đoạn cuối.
 */
export const randomScenario = (size) => {
  const t = size * size;
  const b = new BoardBuilder(size);
  b.add(0.12, 0.5, byDensity(t, rnd(8, 12) / 100), 2, 5);
  b.add(0.3, 0.75, byDensity(t, rnd(8, 12) / 100), -5, -2);
  b.add(0.55, 0.85, Math.max(1, byDensity(t, 0.05)), 5, 9);   // cú lật kèo
  b.add(0.72, 0.95, Math.max(1, byDensity(t, 0.07)), -6, -3); // bẫy cuối
  return b.build();
};
