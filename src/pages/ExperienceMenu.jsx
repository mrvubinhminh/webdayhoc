import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, Gem, Drama, Map } from 'lucide-react';

/**
 * Kho hoạt động cho môn Hoạt động trải nghiệm, hướng nghiệp.
 * Khác kho trò chơi ở chỗ: không chấm đúng sai, mà vẽ chân dung học sinh.
 */
const ACTIVITIES = [
  {
    id: 'compass',
    title: 'La Bàn Nghề Nghiệp',
    icon: <Compass className="w-9 h-9" />,
    color: 'from-sky-500 to-blue-800',
    path: '/compass/host',
    ready: true,
    tag: 'Hướng nghiệp',
    desc: 'Trắc nghiệm sở thích Holland (RIASEC). Mỗi em nhận biểu đồ 6 nhóm và mã nghề nghiệp của riêng mình.',
    outcome: 'Hồ sơ hướng nghiệp Excel dùng được cả năm'
  },
  {
    id: 'values',
    title: 'Đấu Giá Giá Trị Sống',
    icon: <Gem className="w-9 h-9" />,
    color: 'from-amber-400 to-orange-700',
    path: '/values/host',
    ready: true,
    tag: 'Hướng vào bản thân',
    desc: 'Mỗi em có ngân sách có hạn để đấu giá các giá trị nghề nghiệp. Buộc phải ưu tiên, không thể chọn tất cả.',
    outcome: 'Bảng giá trị của từng em và của cả lớp'
  },
  {
    id: 'path',
    title: 'Lộ Trình Nghề Nghiệp',
    icon: <Map className="w-9 h-9" />,
    color: 'from-cyan-500 to-emerald-700',
    path: '/path/host',
    ready: true,
    tag: 'Chủ đề 11 · lập kế hoạch',
    desc: 'Mỗi em vẽ con đường từ hôm nay tới nghề mơ ước qua 6 chặng. Làm dần qua nhiều tiết, lưu tự động.',
    outcome: 'Bản kế hoạch cá nhân — sản phẩm dự án nộp được'
  },
  {
    id: 'scenario',
    title: 'Phòng Tình Huống',
    icon: <Drama className="w-9 h-9" />,
    color: 'from-emerald-500 to-teal-800',
    path: '/scenario/host',
    ready: true,
    tag: 'Hướng đến xã hội',
    desc: 'Tình huống thật của tuổi 16–18. Học sinh chọn cách xử lý và viết lý do, cả lớp thảo luận trên nền phân bố ẩn danh.',
    outcome: 'Lý do từng em viết, làm tư liệu thảo luận'
  },
];

const ExperienceMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-24 px-4 pb-20 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors font-bold">
          <ArrowLeft className="w-5 h-5" /> Quay lại trang chủ
        </button>

        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-3 uppercase tracking-wider">
          Hoạt Động Trải Nghiệm · Hướng Nghiệp
        </h1>
        <p className="text-gray-400 text-center mb-3 text-lg">
          Không chấm đúng sai — giúp học sinh hiểu chính mình
        </p>
        <p className="text-sky-300/70 text-center mb-12 text-sm max-w-2xl mx-auto">
          Bốn hoạt động nối tiếp nhau: em <b>thích</b> gì → em <b>coi trọng</b> gì → em sẽ <b>hành xử</b> thế nào → em <b>đi đường nào</b>
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {ACTIVITIES.map(a => (
            <div
              key={a.id}
              onClick={() => a.ready && navigate(a.path)}
              className={`glass-card p-6 rounded-3xl flex flex-col border transition-all duration-300 bg-black/25 ${
                a.ready
                  ? 'cursor-pointer hover:scale-[1.03] border-white/10 hover:border-sky-500/60'
                  : 'border-white/5 opacity-60'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br ${a.color} text-white shadow-lg`}>
                {a.icon}
              </div>

              <span className="text-[11px] font-black uppercase tracking-widest text-sky-400/80">{a.tag}</span>
              <h3 className="text-xl font-bold text-white mt-1 mb-2 leading-tight">{a.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-1">{a.desc}</p>

              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Thầy cô nhận được</p>
                <p className="text-emerald-300/90 text-sm font-semibold mt-0.5">{a.outcome}</p>
              </div>

              <div className="mt-4">
                {a.ready
                  ? <span className="inline-block bg-sky-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Mở hoạt động →</span>
                  : <span className="inline-block bg-slate-800 text-gray-500 px-4 py-2 rounded-xl font-bold text-sm">Sắp có</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-black/30 border border-white/10 rounded-2xl p-5 max-w-3xl mx-auto">
          <p className="text-gray-300 text-sm leading-relaxed">
            <b className="text-white">Vì sao tách riêng khỏi kho trò chơi?</b> Các trò trong kho game đều chấm đúng/sai để lấy điểm.
            Hoạt động trải nghiệm thì ngược lại — hỏi <i>“em thích làm việc với con người hay với máy móc?”</i> thì không ai sai cả.
            Vì vậy bốn hoạt động này không cho điểm số, mà trả về <b className="text-sky-300">chân dung của từng học sinh</b>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExperienceMenu;
