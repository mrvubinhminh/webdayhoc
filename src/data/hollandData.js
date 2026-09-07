// Bộ trắc nghiệm sở thích nghề nghiệp Holland (RIASEC) soạn cho học sinh THPT Việt Nam
// Không có câu nào đúng hay sai — chỉ đo mức độ phù hợp với bản thân từng em.

export const GROUPS = [
  {
    code: 'R', name: 'Kỹ thuật', full: 'Realistic — Người thực tế',
    emoji: '🔧', color: '#F97316',
    short: 'Thích làm việc với máy móc, công cụ, vật liệu; ưa hoạt động chân tay và kết quả nhìn thấy được.',
    strengths: ['Khéo tay', 'Bền bỉ', 'Thực tế', 'Giỏi thao tác kỹ thuật']
  },
  {
    code: 'I', name: 'Nghiên cứu', full: 'Investigative — Người tìm tòi',
    emoji: '🔬', color: '#3B82F6',
    short: 'Thích quan sát, phân tích, lý giải; hay đặt câu hỏi vì sao và tự đi tìm câu trả lời.',
    strengths: ['Tư duy logic', 'Tò mò', 'Kiên trì với bài khó', 'Giỏi phân tích']
  },
  {
    code: 'A', name: 'Nghệ thuật', full: 'Artistic — Người sáng tạo',
    emoji: '🎨', color: '#EC4899',
    short: 'Thích tưởng tượng, sáng tác, thể hiện cái riêng; không thích khuôn mẫu gò bó.',
    strengths: ['Giàu tưởng tượng', 'Nhạy cảm thẩm mỹ', 'Độc đáo', 'Biểu đạt tốt']
  },
  {
    code: 'S', name: 'Xã hội', full: 'Social — Người đồng hành',
    emoji: '🤝', color: '#10B981',
    short: 'Thích tiếp xúc, giúp đỡ, hướng dẫn, chăm sóc người khác; thấy vui khi người khác tiến bộ.',
    strengths: ['Lắng nghe', 'Cảm thông', 'Giao tiếp tốt', 'Tinh thần hợp tác']
  },
  {
    code: 'E', name: 'Quản lý', full: 'Enterprising — Người dẫn dắt',
    emoji: '📣', color: '#EF4444',
    short: 'Thích thuyết phục, tổ chức, dẫn dắt, kinh doanh; dám nhận việc khó và chịu trách nhiệm.',
    strengths: ['Tự tin', 'Thuyết phục', 'Quyết đoán', 'Dám mạo hiểm']
  },
  {
    code: 'C', name: 'Nghiệp vụ', full: 'Conventional — Người tổ chức',
    emoji: '📋', color: '#8B5CF6',
    short: 'Thích sự rõ ràng, ngăn nắp, quy trình, số liệu chính xác; làm việc cẩn thận và có kế hoạch.',
    strengths: ['Cẩn thận', 'Ngăn nắp', 'Đáng tin cậy', 'Giỏi con số']
  },
];

export const groupOf = (code) => GROUPS.find(g => g.code === code) || GROUPS[0];

// 60 phát biểu, mỗi nhóm 10 câu. Câu đánh dấu core dùng cho bản rút gọn 30 câu.
export const ITEMS = [
  // R — Kỹ thuật
  { g: 'R', core: true,  t: 'Em thích tự tay sửa xe đạp, quạt máy hay đồ điện trong nhà.' },
  { g: 'R', core: true,  t: 'Em thấy hứng thú khi lắp ráp, tháo lắp một thiết bị để xem bên trong nó thế nào.' },
  { g: 'R', core: true,  t: 'Em thích các hoạt động ngoài trời hơn là ngồi lâu một chỗ.' },
  { g: 'R', core: true,  t: 'Em thích dùng dụng cụ, máy móc để làm ra một sản phẩm cụ thể.' },
  { g: 'R', core: true,  t: 'Em thích môn Công nghệ, Thể dục hơn là các môn phải viết nhiều.' },
  { g: 'R', core: false, t: 'Em thích trồng cây, chăm sóc vật nuôi.' },
  { g: 'R', core: false, t: 'Em thấy thoải mái khi làm việc chân tay, kể cả khi hơi vất vả.' },
  { g: 'R', core: false, t: 'Em thích tìm hiểu cách vận hành của xe cộ, máy móc.' },
  { g: 'R', core: false, t: 'Em thích làm ra thứ gì đó cầm nắm được hơn là viết một bài luận.' },
  { g: 'R', core: false, t: 'Em sẵn sàng làm việc ngoài công trường, xưởng, đồng ruộng.' },

  // I — Nghiên cứu
  { g: 'I', core: true,  t: 'Em hay thắc mắc "vì sao lại như vậy" và tự tìm hiểu cho ra.' },
  { g: 'I', core: true,  t: 'Em thích giải những bài toán khó, câu đố hóc búa.' },
  { g: 'I', core: true,  t: 'Em thích đọc sách, xem video khoa học để hiểu bản chất vấn đề.' },
  { g: 'I', core: true,  t: 'Em thích làm thí nghiệm và quan sát kết quả.' },
  { g: 'I', core: true,  t: 'Em thích phân tích số liệu để tìm ra quy luật.' },
  { g: 'I', core: false, t: 'Em kiên nhẫn theo đuổi một vấn đề cho tới khi hiểu rõ.' },
  { g: 'I', core: false, t: 'Em thích tranh luận dựa trên lý lẽ và bằng chứng.' },
  { g: 'I', core: false, t: 'Em thấy thú vị khi tìm ra nhiều cách giải cho cùng một bài.' },
  { g: 'I', core: false, t: 'Em thích tìm hiểu về vũ trụ, cơ thể người, hiện tượng tự nhiên.' },
  { g: 'I', core: false, t: 'Em thích làm việc độc lập để tập trung suy nghĩ.' },

  // A — Nghệ thuật
  { g: 'A', core: true,  t: 'Em thích vẽ, viết, chụp ảnh, làm video hoặc chơi nhạc cụ.' },
  { g: 'A', core: true,  t: 'Em thích nghĩ ra ý tưởng mới lạ, khác với số đông.' },
  { g: 'A', core: true,  t: 'Em thấy khó chịu khi phải làm theo khuôn mẫu cứng nhắc.' },
  { g: 'A', core: true,  t: 'Em để ý tới màu sắc, bố cục, cái đẹp của mọi thứ xung quanh.' },
  { g: 'A', core: true,  t: 'Em thích tự trang trí góc học tập, trang phục theo phong cách riêng.' },
  { g: 'A', core: false, t: 'Em thích tham gia văn nghệ, kịch, dẫn chương trình.' },
  { g: 'A', core: false, t: 'Em hay tưởng tượng ra những câu chuyện, hình ảnh trong đầu.' },
  { g: 'A', core: false, t: 'Em thích thiết kế poster, chỉnh sửa ảnh, dựng video.' },
  { g: 'A', core: false, t: 'Em thích những công việc mỗi ngày một khác hơn là lặp lại.' },
  { g: 'A', core: false, t: 'Em thích viết nhật ký, làm thơ hoặc sáng tác truyện.' },

  // S — Xã hội
  { g: 'S', core: true,  t: 'Em thích giảng lại bài cho bạn khi bạn chưa hiểu.' },
  { g: 'S', core: true,  t: 'Bạn bè hay tìm đến em để tâm sự, xin lời khuyên.' },
  { g: 'S', core: true,  t: 'Em thấy vui khi giúp được người khác, dù mình không được gì.' },
  { g: 'S', core: true,  t: 'Em thích tham gia hoạt động tình nguyện, thiện nguyện.' },
  { g: 'S', core: true,  t: 'Em dễ nhận ra khi bạn mình đang buồn và muốn hỏi han.' },
  { g: 'S', core: false, t: 'Em thích làm việc nhóm hơn là làm một mình.' },
  { g: 'S', core: false, t: 'Em kiên nhẫn khi phải giải thích một điều nhiều lần.' },
  { g: 'S', core: false, t: 'Em thích chăm sóc trẻ nhỏ hoặc người lớn tuổi.' },
  { g: 'S', core: false, t: 'Em thích hoà giải khi bạn bè xích mích.' },
  { g: 'S', core: false, t: 'Em thấy hạnh phúc khi công việc của mình có ích cho cộng đồng.' },

  // E — Quản lý
  { g: 'E', core: true,  t: 'Em thích đứng ra tổ chức hoạt động cho lớp, cho nhóm.' },
  { g: 'E', core: true,  t: 'Em tự tin thuyết trình, nói trước đám đông.' },
  { g: 'E', core: true,  t: 'Em thích thuyết phục người khác đồng ý với ý kiến của mình.' },
  { g: 'E', core: true,  t: 'Em thích buôn bán nhỏ, gây quỹ, kinh doanh thử.' },
  { g: 'E', core: true,  t: 'Em sẵn sàng nhận vai trò nhóm trưởng và chịu trách nhiệm.' },
  { g: 'E', core: false, t: 'Em thích cạnh tranh và muốn giành kết quả tốt nhất.' },
  { g: 'E', core: false, t: 'Em dám thử việc mới dù chưa chắc thành công.' },
  { g: 'E', core: false, t: 'Em thích đàm phán, thương lượng để đạt được điều mình muốn.' },
  { g: 'E', core: false, t: 'Em quan tâm tới chuyện khởi nghiệp, làm chủ.' },
  { g: 'E', core: false, t: 'Em thích kết nối, mở rộng quan hệ với nhiều người.' },

  // C — Nghiệp vụ
  { g: 'C', core: true,  t: 'Em thích sắp xếp sách vở, đồ đạc gọn gàng theo thứ tự.' },
  { g: 'C', core: true,  t: 'Em thích lập kế hoạch, làm thời gian biểu và bám theo nó.' },
  { g: 'C', core: true,  t: 'Em làm việc cẩn thận, ít khi để sai sót nhỏ.' },
  { g: 'C', core: true,  t: 'Em thích làm việc với con số, bảng biểu, sổ sách.' },
  { g: 'C', core: true,  t: 'Em thấy yên tâm khi công việc có hướng dẫn rõ ràng từng bước.' },
  { g: 'C', core: false, t: 'Em thích ghi chép đầy đủ và kiểm tra lại nhiều lần.' },
  { g: 'C', core: false, t: 'Em thích công việc ổn định hơn là hay thay đổi.' },
  { g: 'C', core: false, t: 'Em thích dùng bảng tính, phần mềm để quản lý thông tin.' },
  { g: 'C', core: false, t: 'Em khó chịu khi mọi thứ lộn xộn, thiếu ngăn nắp.' },
  { g: 'C', core: false, t: 'Em thích làm đúng quy định, đúng quy trình.' },
];

export const LIKERT = [
  { v: 1, label: 'Rất không đúng', short: 'Không hề', color: '#64748B' },
  { v: 2, label: 'Không đúng lắm', short: 'Ít thôi', color: '#0EA5E9' },
  { v: 3, label: 'Bình thường', short: 'Cũng được', color: '#F59E0B' },
  { v: 4, label: 'Khá đúng', short: 'Khá đúng', color: '#84CC16' },
  { v: 5, label: 'Rất đúng với em', short: 'Rất đúng', color: '#10B981' },
];

// Gợi ý ngành nghề theo hai nhóm nổi trội nhất
export const CAREER_MAP = {
  RI: 'Kỹ thuật cơ khí, Điện – Điện tử, Ô tô, Xây dựng, Kỹ thuật hàng không',
  RA: 'Kiến trúc, Thiết kế công nghiệp, Mộc mỹ nghệ, Dựng phim kỹ thuật',
  RS: 'Kỹ thuật y sinh, Điều dưỡng, Cứu hộ, Huấn luyện viên thể thao',
  RE: 'Quản lý sản xuất, Giám sát công trình, Kinh doanh thiết bị kỹ thuật',
  RC: 'Kỹ thuật viên phòng thí nghiệm, Trắc địa, Kiểm định chất lượng, Logistics kho vận',
  IR: 'Công nghệ thông tin, Khoa học dữ liệu, Kỹ thuật điều khiển, Vật lý kỹ thuật',
  IA: 'Kiến trúc, Thiết kế game, Nghiên cứu truyền thông, Khoa học nhận thức',
  IS: 'Y đa khoa, Dược, Tâm lý học, Y tế công cộng, Nghiên cứu giáo dục',
  IE: 'Phân tích kinh doanh, Tài chính định lượng, Quản trị công nghệ, Tư vấn chiến lược',
  IC: 'Kế toán – Kiểm toán, Thống kê, Công nghệ sinh học, Khoa học môi trường',
  AR: 'Thiết kế đồ hoạ, Kiến trúc, Thiết kế nội thất, Nhiếp ảnh',
  AI: 'Truyền thông đa phương tiện, Thiết kế UX/UI, Biên kịch, Nghiên cứu văn hoá',
  AS: 'Sư phạm Âm nhạc – Mỹ thuật, Trị liệu nghệ thuật, Tổ chức sự kiện văn hoá',
  AE: 'Truyền thông – Quảng cáo, Đạo diễn, Quản lý nghệ thuật, Marketing sáng tạo',
  AC: 'Biên tập – Xuất bản, Thiết kế dàn trang, Lưu trữ bảo tàng',
  SR: 'Giáo dục thể chất, Điều dưỡng, Kỹ thuật viên phục hồi chức năng',
  SI: 'Sư phạm các môn khoa học, Tâm lý học đường, Công tác xã hội, Y học dự phòng',
  SA: 'Sư phạm Ngữ văn, Giáo dục mầm non, Hướng dẫn viên du lịch, Truyền thông cộng đồng',
  SE: 'Quản trị nhân sự, Luật, Quan hệ công chúng, Quản lý giáo dục',
  SC: 'Hành chính văn phòng, Thư viện, Công tác xã hội, Quản lý hồ sơ y tế',
  ER: 'Quản trị kinh doanh, Logistics, Bất động sản, Kinh doanh nông nghiệp',
  EI: 'Tài chính – Ngân hàng, Phân tích đầu tư, Quản trị công nghệ, Khởi nghiệp',
  EA: 'Marketing, Truyền thông – Quảng cáo, Quản lý thương hiệu, Tổ chức sự kiện',
  ES: 'Quản trị nhân sự, Du lịch – Khách sạn, Luật, Quản lý dự án cộng đồng',
  EC: 'Quản trị tài chính, Kinh doanh quốc tế, Quản lý chuỗi cung ứng',
  CR: 'Kế toán, Kiểm định, Quản lý kho, Vận hành sản xuất',
  CI: 'Kiểm toán, Thống kê, Phân tích dữ liệu, Bảo hiểm',
  CA: 'Biên tập, Thiết kế dàn trang, Quản lý hồ sơ nghệ thuật',
  CS: 'Hành chính nhân sự, Thư ký y khoa, Văn thư lưu trữ, Ngân hàng giao dịch',
  CE: 'Kế toán quản trị, Ngân hàng, Bảo hiểm, Quản lý văn phòng',
};

export const careersFor = (code3) => {
  if (!code3 || code3.length < 2) return 'Cần làm đủ bài để có gợi ý';
  return CAREER_MAP[code3.slice(0, 2)] || CAREER_MAP[code3[0] + code3[2]] || 'Nhiều nhóm ngành phù hợp — em nên trao đổi thêm với thầy cô';
};

// Điểm mỗi nhóm quy về phần trăm để so sánh được giữa bản 30 câu và 60 câu
export const scoreGroups = (answers = {}, items = ITEMS) => {
  const sum = {}, count = {};
  GROUPS.forEach(g => { sum[g.code] = 0; count[g.code] = 0; });
  items.forEach((it, idx) => {
    const v = answers[idx];
    if (!v) return;
    sum[it.g] += v;
    count[it.g] += 1;
  });
  const pct = {};
  GROUPS.forEach(g => {
    // Thang 1..5 nên điểm sàn là 1, quy về 0..100
    pct[g.code] = count[g.code] ? Math.round(((sum[g.code] / count[g.code]) - 1) / 4 * 100) : 0;
  });
  return pct;
};

// Mã Holland: ba nhóm điểm cao nhất
export const hollandCode = (pct = {}) =>
  [...GROUPS].sort((a, b) => (pct[b.code] || 0) - (pct[a.code] || 0)).slice(0, 3).map(g => g.code).join('');

export const itemsFor = (mode) => mode === 'short' ? ITEMS.filter(i => i.core) : ITEMS;
