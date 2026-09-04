import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, Cuboid, Cylinder, Layers, Pyramid, LayoutGrid, CheckSquare } from 'lucide-react';

const StudentsMenu = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('10');

  // Discover all HTML files in public/models
  const files = import.meta.glob('/public/students/**/*.html');
  const studentPaths = Object.keys(files);

  const parsedStudents = studentPaths.map(path => {
    // Allow alphanumeric characters for the category folder
    const match = path.match(/\/public\/students\/([a-zA-Z0-9_-]+)\/(.+)\.html$/);
    if (!match) return null;
    
    const titleMatch = match[2].match(/^(\d+)[.\-_]?\s*(.*)/);
    const order = titleMatch ? parseInt(titleMatch[1], 10) : 9999;
    
    return {
      grade: match[1],
      id: match[2],
      title: match[2].replace(/-/g, ' ').toUpperCase(),
      order: order,
      path: `/students/view/${match[1]}/${encodeURIComponent(match[2])}`
    };
  }).filter(Boolean).sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });

  const studentsByGrade = {
    '10': parsedStudents.filter(m => m.grade === '10'),
    '11': parsedStudents.filter(m => m.grade === '11'),
    '12': parsedStudents.filter(m => m.grade === '12'),
    'khac': [
      ...parsedStudents.filter(m => m.grade === 'khac'),
      {
        id: 'dojovtl',
        title: 'LỚP HỌC DOJO',
        path: `/students/view/external/${encodeURIComponent('https://dojovtl.vercel.app')}`,
        isExternal: false
      },
      {
        id: 'bangdiem-delta',
        title: 'QUẢN LÝ NHẬN XÉT ĐIỂM HỌC SINH',
        path: `/students/view/external/${encodeURIComponent('https://bangdiem-delta.vercel.app')}`,
        isExternal: false
      },
      {
        id: 'phimtatimac',
        title: 'PHÍM TẮT IMAC',
        path: `/students/view/external/${encodeURIComponent('https://phimtatimac.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'sheetpdf',
        title: 'VÒNG QUAY HỌC TẬP',
        path: `/students/view/external/${encodeURIComponent('https://sheetpdf.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'chuynnhdnglatex0',
        title: 'CHUYỂN ĐỊNH DẠNG LATEX',
        path: `/students/view/external/${encodeURIComponent('https://latextojson.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'qunlmarkdown1',
        title: 'QUẢN LÝ MARKDOWN',
        path: `/students/view/external/${encodeURIComponent('https://quanlymd.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'toidchunhalcfilelatexnhpexcelkimduytvlugooglesheetstng2',
        title: 'TẠO ID, CHUẨN HÓA, LỌC FILE LATEX, NHẬP EXCEL, KIỂM DUYỆT ĐỀ VÀ LƯU GOOGLE SHEETS TỰ ĐỘNG.',
        path: `/students/view/external/${encodeURIComponent('https://quanlymdid.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'markdowntoword3',
        title: 'MARKDOWN TO WORD',
        path: `/students/view/external/${encodeURIComponent('https://soangiangvbm.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'sonlatex4',
        title: 'SOẠN LATEX',
        path: `/students/view/external/${encodeURIComponent('https://0tex.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'totiliulatex5',
        title: 'TẠO TÀI LIỆU LATEX',
        path: `/students/view/external/${encodeURIComponent('https://soanthaolatexvtl.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'tolnhnotebook6',
        title: 'TẠO LỆNH NOTEBOOK',
        path: `/students/view/external/${encodeURIComponent('https://notebookvtl.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'ton10thvintoanmath41tiliu7',
        title: 'TOÁN 10-THƯ VIỆN TOANMATH 41 TÀI LIỆU',
        path: `/students/view/external/${encodeURIComponent('https://notebook.google.com/notebook/f64f21fe-8c99-4993-86f8-fb531c61c816')}`,
        isExternal: false
      },
      {
        id: 'ton921tiliu8',
        title: 'TOÁN 9 -21 TÀI LIỆU',
        path: `/students/view/external/${encodeURIComponent('https://notebook.google.com/notebook/066eed7c-9442-4573-9237-819dab4b8dd8')}`,
        isExternal: false
      },
      {
        id: 'chnhsapdf9',
        title: 'CHỈNH SỬA PDF',
        path: `/students/view/external/${encodeURIComponent('https://catgheppdf.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'khenthng10',
        title: 'KHEN THƯỞNG',
        path: `/students/view/external/${encodeURIComponent('https://khenthuong-kappa.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'anki11',
        title: 'ANKI',
        path: `/students/view/external/${encodeURIComponent('https://hoccung-thayluc.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'worksheetgentonhc12',
        title: 'WORKSHEET GEN - ĐỀ TOÁN HỌC',
        path: `/students/view/external/${encodeURIComponent('https://word-ai-psi.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'trnhnggiscorm12bnchuynnghip13',
        title: 'TRÌNH ĐÓNG GÓI SCORM 1.2 (BẢN CHUYÊN NGHIỆP)',
        path: `/students/view/external/${encodeURIComponent('https://scormk12.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'trlvnbngiodc14',
        title: 'TRỢ LÝ VĂN BẢN GIÁO DỤC',
        path: `/students/view/external/${encodeURIComponent('https://notebook.google.com/notebook/ce2d3b36-3998-4c5a-9612-3283f18cf309')}`,
        isExternal: false
      },
      {
        id: 'ngnhngcuhi15',
        title: 'NGÂN HÀNG CÂU HỎI',
        path: `/students/view/external/${encodeURIComponent('https://nganhangbaihoc.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'songing4016',
        title: 'SOẠN GIẢNG 4.0',
        path: `/students/view/external/${encodeURIComponent('https://baigiangthaytienluc.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'aiteacherstudio17',
        title: 'AI TEACHER STUDIO',
        path: `/students/view/external/${encodeURIComponent('https://k12onlineppt2026.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'bogingthptnguynhucnh18',
        title: 'BÁO GIẢNG THPT NGUYỄN HỮU CẢNH',
        path: `/students/view/external/${encodeURIComponent('https://lichbaogiang-ten.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'mathflashhccngthctonhcquathghinh19',
        title: 'MATHFLASH HỌC CÔNG THỨC TOÁN HỌC QUA THẺ GHI NHỚ',
        path: `/students/view/external/${encodeURIComponent('https://khongcogitucodaucon.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'cngctotrchigiodc20',
        title: 'CÔNG CỤ TẠO TRÒ CHƠI GIÁO DỤC',
        path: `/students/view/external/${encodeURIComponent('https://mathgamev1.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'vngquayhctptchcc21',
        title: 'VÒNG QUAY HỌC TẬP TÍCH CỰC',
        path: `/students/view/external/${encodeURIComponent('https://vongquaytoanhoc.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'quizizzkahoot22',
        title: 'QUIZIZZ-KAHOOT',
        path: `/students/view/external/${encodeURIComponent('https://quizizzvsk12.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'bngv23',
        title: 'BẢNG VẼ',
        path: `/students/view/external/${encodeURIComponent('https://boardtienluc.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'chuynpnk1224',
        title: 'CHUYỂN ĐÁP ÁN K12',
        path: `/students/view/external/${encodeURIComponent('https://gemchuyendapank12.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'toslideppt25',
        title: 'TẠO SLIDE PPT',
        path: `/students/view/external/${encodeURIComponent('https://pptvtl.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'toformptnh26',
        title: 'TẠO FORMPT ẢNH',
        path: `/students/view/external/${encodeURIComponent('https://formptposter.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'qunlhtml27',
        title: 'QUẢN LÝ HTML',
        path: `/students/view/external/${encodeURIComponent('https://htmlmanager.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'lnhnotebook28',
        title: 'LỆNH NOTEBOOK',
        path: `/students/view/external/${encodeURIComponent('https://notebooklm-beta-tawny.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'cngcchunhatonk1229',
        title: 'CÔNG CỤ CHUẨN HÓA ĐỀ TOÁN K12',
        path: `/students/view/external/${encodeURIComponent('https://chuanhoadetoan.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'tinhsinhlink30',
        title: 'TẢI ẢNH SINH LINK',
        path: `/students/view/external/${encodeURIComponent('https://taianh2026.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'bngvv131',
        title: 'BẢNG VẼ V1',
        path: `/students/view/external/${encodeURIComponent('https://bang2026.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'cngcitnfilehnglot32',
        title: 'CÔNG CỤ ĐỔI TÊN FILE HÀNG LOẠT',
        path: `/students/view/external/${encodeURIComponent('https://dattenfile.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'tocngthcton33',
        title: 'TẠO CÔNG THỨC TOÁN',
        path: `/students/view/external/${encodeURIComponent('https://congthuctoan.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'tocngthctonv234',
        title: 'TẠO CÔNG THỨC TOÁN V2',
        path: `/students/view/external/${encodeURIComponent('https://incongthuc.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'ngnhngcuhi35',
        title: 'NGÂN HÀNG CÂU HỎI',
        path: `/students/view/external/${encodeURIComponent('https://nganhang-id.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'trnhchiu36',
        title: 'TRÌNH CHIẾU',
        path: `/students/view/external/${encodeURIComponent('https://motngaytuoidep.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'sonlatex37',
        title: 'SOẠN LA TEX',
        path: `/students/view/external/${encodeURIComponent('https://latexcoban.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'xutpngtikz38',
        title: 'XUẤT PNG TIKZ',
        path: `/students/view/external/${encodeURIComponent('https://tikzvutienluc.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'sonlatexv239',
        title: 'SOẠN LATEX V2',
        path: `/students/view/external/${encodeURIComponent('https://textienluc.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'sonlatex40',
        title: 'SOẠN LATEX',
        path: `/students/view/external/${encodeURIComponent('https://latex26.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'tok1241',
        title: 'TẠO ĐỀ K12',
        path: `/students/view/external/${encodeURIComponent('https://k12online.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'toscom42',
        title: 'TẠO SCOM',
        path: `/students/view/external/${encodeURIComponent('https://k12scorm-3kj9.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'ngnhngluyntp43',
        title: 'NGÂN HÀNG LUYỆN TẬP',
        path: `/students/view/external/${encodeURIComponent('https://nganhangbaitap.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'hsinhthilatexsinhtrn44',
        title: 'HỆ SINH THÁI LATEX: SINH ĐỀ & TRỘN ĐỀ',
        path: `/students/view/external/${encodeURIComponent('https://latex2026v1.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'sonbeammerlatex45',
        title: 'SOẠN BEAMMER LATEX',
        path: `/students/view/external/${encodeURIComponent('https://latexbaigiang.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'tiksangsvgnh46',
        title: 'TIK SANG SVG ẢNH',
        path: `/students/view/external/${encodeURIComponent('https://tikz2svg.com/')}`,
        isExternal: false
      },
      {
        id: 'stay47',
        title: 'SÔ TAY',
        path: `/students/view/external/${encodeURIComponent('https://sotay24.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'tinchtinhc48',
        title: 'TIỆN ÍCH TẢI NHẠC',
        path: `/students/view/external/${encodeURIComponent('https://catbox.moe/#')}`,
        isExternal: false
      },
      {
        id: 'thngbok1249',
        title: 'THÔNG BÁO K12',
        path: `/students/view/external/${encodeURIComponent('https://thongbaok-12.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'tonhnxt50',
        title: 'TẠO NHẬN XÉT',
        path: `/students/view/external/${encodeURIComponent('https://taonhanxet.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'tonhnxt251',
        title: 'TẠO NHẬN XÉT 2',
        path: `/students/view/external/${encodeURIComponent('https://nhanxethocba-lime.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'mdtoword52',
        title: 'MD TO WORD',
        path: `/students/view/external/${encodeURIComponent('https://mdtoword-topaz.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'shp53',
        title: 'SỔ HỌP',
        path: `/students/view/external/${encodeURIComponent('https://sohopvtl.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'mngunavata54',
        title: 'MÃ NGUỒN AVATA',
        path: `/students/view/external/${encodeURIComponent('https://www.dicebear.com/')}`,
        isExternal: false
      },
      {
        id: 'chuynisangjson55',
        title: 'CHUYỂN ĐỔI SANG JSON',
        path: `/students/view/external/${encodeURIComponent('https://jsonchuyendoi.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'anki202756',
        title: 'ANKI 2027',
        path: `/students/view/external/${encodeURIComponent('https://vutienlucstudy.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'ppct57',
        title: 'PPCT',
        path: `/students/view/external/${encodeURIComponent('https://soppct.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'geotonhpng58',
        title: 'GEO TO ẢNH PNG',
        path: `/students/view/external/${encodeURIComponent('https://geocode-sigma.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'trnhchiuexcelcbng59',
        title: 'TRÌNH CHIẾU EXCEL CÓ BẢNG',
        path: `/students/view/external/${encodeURIComponent('https://trinhchieuvtl.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'tovideo60',
        title: 'TẠO VIDEO',
        path: `/students/view/external/${encodeURIComponent('https://cuonsachkidieu.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'mtikzsanggeo61',
        title: 'MÃ TIKZ SANG GEO',
        path: `/students/view/external/${encodeURIComponent('https://tikztogeo.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'scrpitgeov162',
        title: 'SCRPIT GEO V1',
        path: `/students/view/external/${encodeURIComponent('https://geovascript.vercel.app/')}`,
        isExternal: false
      },
      {
        id: 'scrpitgeov263',
        title: 'SCRPIT GEO V2',
        path: `/students/view/external/${encodeURIComponent('https://taohinhdongvtl.vercel.app/')}`,
        isExternal: false
      }
    ]
  };

  const tabs = [
    { id: '10', label: 'Lớp 10' },
    { id: '11', label: 'Lớp 11' },
    { id: '12', label: 'Lớp 12' },
    { id: 'khac', label: 'Tiện ích khác' }
  ];

  const icons = [Box, Cuboid, Cylinder, Layers, Pyramid, LayoutGrid, CheckSquare];
  
  const getIcon = (idx) => {
    const IconComponent = icons[idx % icons.length];
    return <IconComponent className="w-8 h-8" />;
  };

  const currentStudents = studentsByGrade[activeTab] || [];

  return (
    <div className="min-h-screen pt-24 px-4 pb-20 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors font-bold"
        >
          <ArrowLeft className="w-5 h-5" /> Quay lại trang chủ
        </button>

        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4 uppercase tracking-wider">
          Công Cụ Tiện Ích Dạy Học
        </h1>
        <p className="text-gray-400 text-center mb-8 text-lg">
          Chọn lớp học để xem các danh sách tương ứng
        </p>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 sm:px-8 py-3 rounded-xl font-bold text-lg transition-all ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Models Grid */}
        {currentStudents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full max-w-6xl mx-auto">
            {currentStudents.map((model, idx) => (
              <div 
                key={model.id}
                onClick={() => navigate(model.path)}
                className="glass-card p-3 rounded-xl flex flex-row items-center gap-4 cursor-pointer group hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 border border-emerald-500/10 hover:border-emerald-500/50 bg-slate-900/60"
              >
                <div className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md group-hover:scale-110 transition-transform`}>
                  {getIcon(idx)}
                </div>
                <h3 className="text-sm font-semibold text-gray-300 group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2 text-left flex-1">
                  {model.title}
                </h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 border border-slate-800 rounded-3xl border-dashed">
            <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl font-bold mb-2">Chưa có tiện ích nào</p>
            <p>Vui lòng copy file HTML vào thư mục <code>public/students/{activeTab}/</code></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsMenu;
