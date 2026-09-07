// Dữ liệu cho hoạt động Lộ Trình Nghề Nghiệp — Chủ đề 11 lớp 10
// Học sinh xây dựng bản kế hoạch của riêng mình qua 6 chặng, làm dần qua nhiều tiết.

export const STAGES = [
  {
    id: 'goal', order: 1, emoji: '🎯', name: 'Đích đến',
    lesson: 'HĐ1 · tiết 93',
    hint: 'Nghề em muốn theo đuổi và lý do thật sự — không phải lý do người lớn muốn nghe.',
    fields: [
      { key: 'career', label: 'Nghề em hướng tới', type: 'text', placeholder: 'VD: Kỹ sư phần mềm', required: true },
      { key: 'hollandCode', label: 'Mã Holland của em (nếu đã làm La Bàn)', type: 'text', placeholder: 'VD: IRA — bỏ trống nếu chưa làm' },
      { key: 'why', label: 'Vì sao em chọn nghề này?', type: 'long', placeholder: 'Điều gì ở nghề này khiến em thấy hứng thú?', required: true },
      { key: 'worry', label: 'Điều em còn băn khoăn', type: 'long', placeholder: 'VD: sợ khó xin việc, bố mẹ chưa đồng ý…' },
    ]
  },
  {
    id: 'school', order: 2, emoji: '🏫', name: 'Trường & ngành',
    lesson: 'HĐ1 + HĐ4 · tiết 93, 102',
    hint: 'Tìm ít nhất hai lựa chọn: một trường mơ ước và một trường an toàn hơn.',
    fields: [
      { key: 'major', label: 'Ngành học', type: 'text', placeholder: 'VD: Công nghệ thông tin', required: true },
      { key: 'school1', label: 'Trường lựa chọn 1', type: 'text', placeholder: 'Tên trường em mong muốn nhất', required: true },
      { key: 'school2', label: 'Trường lựa chọn 2 (dự phòng)', type: 'text', placeholder: 'Trường có điểm chuẩn vừa sức hơn' },
      { key: 'admission', label: 'Phương thức xét tuyển em nhắm tới', type: 'long', placeholder: 'VD: xét điểm thi TN THPT, xét học bạ, đánh giá năng lực…' },
      { key: 'benchmark', label: 'Điểm chuẩn năm gần nhất em tra được', type: 'text', placeholder: 'VD: 24.5 điểm (năm 2026)' },
    ]
  },
  {
    id: 'subjects', order: 3, emoji: '📚', name: 'Tổ hợp môn',
    lesson: 'HĐ3 · tiết 99',
    hint: 'Chọn tổ hợp rồi ghi trung thực điểm hiện tại — có nhìn đúng mới đặt mục tiêu đúng.',
    fields: [
      { key: 'combo', label: 'Tổ hợp xét tuyển', type: 'combo', required: true },
      { key: 'sub1', label: 'Môn 1 — điểm hiện tại → mục tiêu', type: 'score' },
      { key: 'sub2', label: 'Môn 2 — điểm hiện tại → mục tiêu', type: 'score' },
      { key: 'sub3', label: 'Môn 3 — điểm hiện tại → mục tiêu', type: 'score' },
      { key: 'weakest', label: 'Môn em lo nhất và cách khắc phục', type: 'long', placeholder: 'VD: Tiếng Anh — mỗi ngày học 20 từ, xem phim có phụ đề' },
    ]
  },
  {
    id: 'skills', order: 4, emoji: '💪', name: 'Năng lực cần rèn',
    lesson: 'HĐ3 · tiết 99',
    hint: 'Nghề nào cũng cần cả kiến thức lẫn phẩm chất. Em đang thiếu gì?',
    fields: [
      { key: 'required', label: 'Nghề này đòi hỏi năng lực, phẩm chất gì?', type: 'long', placeholder: 'VD: tư duy logic, kiên trì, tự học, làm việc nhóm', required: true },
      { key: 'have', label: 'Em đã có sẵn điểm mạnh nào?', type: 'long', placeholder: 'Thành thật với chính mình nhé' },
      { key: 'lack', label: 'Em còn thiếu gì?', type: 'long', placeholder: 'Đây mới là phần quan trọng nhất', required: true },
      { key: 'howTo', label: 'Em sẽ rèn bằng cách nào?', type: 'long', placeholder: 'Càng cụ thể càng dễ làm được' },
    ]
  },
  {
    id: 'milestones', order: 5, emoji: '🚩', name: 'Cột mốc từng năm',
    lesson: 'HĐ6 · tiết 105',
    hint: 'Chia đường dài thành từng chặng ngắn. Việc làm được ngay trong tháng này là gì?',
    fields: [
      { key: 'now', label: 'Ngay trong tháng này em sẽ làm gì?', type: 'long', placeholder: 'Một việc nhỏ thôi nhưng làm được ngay', required: true },
      { key: 'grade10', label: 'Còn lại lớp 10', type: 'long', placeholder: 'VD: giữ điểm TB ≥ 8.0, tham gia CLB Tin học' },
      { key: 'grade11', label: 'Lớp 11', type: 'long', placeholder: 'VD: thi chứng chỉ IELTS 6.0, làm dự án nhỏ' },
      { key: 'grade12', label: 'Lớp 12', type: 'long', placeholder: 'VD: ôn thi, nộp hồ sơ, dự phòng phương án 2' },
    ]
  },
  {
    id: 'advice', order: 6, emoji: '💬', name: 'Tham vấn',
    lesson: 'HĐ2 + HĐ5 · tiết 96, 102',
    hint: 'Hỏi ít nhất hai người. Nghe rồi tự quyết — đó mới là tham vấn đúng nghĩa.',
    fields: [
      { key: 'asked1', label: 'Người thứ nhất em đã hỏi', type: 'text', placeholder: 'VD: Cô chủ nhiệm / Mẹ / Anh họ đang học ngành này', required: true },
      { key: 'said1', label: 'Người đó nói gì?', type: 'long', placeholder: 'Ghi lại trung thực, kể cả ý kiến trái chiều', required: true },
      { key: 'asked2', label: 'Người thứ hai em đã hỏi', type: 'text', placeholder: 'Nên hỏi thêm người có góc nhìn khác' },
      { key: 'said2', label: 'Người đó nói gì?', type: 'long' },
      { key: 'decision', label: 'Sau khi nghe, em quyết định thế nào?', type: 'long', placeholder: 'Giữ nguyên, điều chỉnh, hay đổi hướng? Vì sao?', required: true },
    ]
  },
];

export const stageOf = (id) => STAGES.find(s => s.id === id);

// Tổ hợp xét tuyển phổ biến ở Việt Nam
export const COMBOS = [
  { code: 'A00', subjects: 'Toán · Lý · Hoá' },
  { code: 'A01', subjects: 'Toán · Lý · Anh' },
  { code: 'A02', subjects: 'Toán · Lý · Sinh' },
  { code: 'B00', subjects: 'Toán · Hoá · Sinh' },
  { code: 'B08', subjects: 'Toán · Sinh · Anh' },
  { code: 'C00', subjects: 'Văn · Sử · Địa' },
  { code: 'C14', subjects: 'Toán · Văn · GDKT&PL' },
  { code: 'D01', subjects: 'Toán · Văn · Anh' },
  { code: 'D07', subjects: 'Toán · Hoá · Anh' },
  { code: 'D14', subjects: 'Văn · Sử · Anh' },
  { code: 'V00', subjects: 'Toán · Lý · Vẽ' },
  { code: 'H00', subjects: 'Văn · Vẽ' },
  { code: 'KHAC', subjects: 'Tổ hợp khác' },
];

// Gợi ý nhóm ngành theo mã Holland, nối tiếp kết quả từ La Bàn Nghề Nghiệp
export const HINT_BY_HOLLAND = {
  R: 'Kỹ thuật, Cơ khí, Điện, Xây dựng, Ô tô, Nông lâm',
  I: 'Công nghệ thông tin, Y dược, Khoa học dữ liệu, Nghiên cứu',
  A: 'Thiết kế, Kiến trúc, Truyền thông, Nghệ thuật, Biên kịch',
  S: 'Sư phạm, Y tá – Điều dưỡng, Tâm lý, Công tác xã hội, Du lịch',
  E: 'Quản trị kinh doanh, Marketing, Luật, Tài chính, Khởi nghiệp',
  C: 'Kế toán, Kiểm toán, Ngân hàng, Hành chính, Logistics',
};

export const hintFor = (code) => {
  if (!code) return null;
  const first = code.trim().toUpperCase()[0];
  return HINT_BY_HOLLAND[first] || null;
};

// Đếm số ô bắt buộc đã điền để biết mức hoàn thành
export const requiredKeys = (stage) => stage.fields.filter(f => f.required).map(f => f.key);

export const stageDone = (stage, data = {}) => {
  const req = requiredKeys(stage);
  if (req.length === 0) return Object.keys(data[stage.id] || {}).some(k => (data[stage.id][k] || '').toString().trim());
  return req.every(k => ((data[stage.id] || {})[k] || '').toString().trim().length > 0);
};

export const progressOf = (data = {}) => {
  const done = STAGES.filter(s => stageDone(s, data)).length;
  return { done, total: STAGES.length, percent: Math.round((done / STAGES.length) * 100) };
};

// Xếp loại Đạt / Chưa đạt theo mức hoàn thành, đúng cách đánh giá của môn HĐTN
export const ratingOf = (percent) => {
  if (percent >= 100) return { label: 'Đạt — hoàn chỉnh', color: '#10B981', emoji: '🌟' };
  if (percent >= 67) return { label: 'Đạt', color: '#84CC16', emoji: '✅' };
  if (percent >= 34) return { label: 'Cần bổ sung', color: '#F59E0B', emoji: '✏️' };
  return { label: 'Chưa đạt', color: '#EF4444', emoji: '⏳' };
};
