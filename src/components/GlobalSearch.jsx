import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gather search data
  const searchData = useRef([]);

  useEffect(() => {
    const allItems = [];

    // 1. Static items
    allItems.push(
      { title: 'Trò chơi: Triệu Phú Toán Học', path: '/game/trieu-phu', category: 'Trò chơi' },
      { title: 'Trò chơi: Thợ Săn Xác Suất', path: '/game/tho-san', category: 'Trò chơi' },
      { title: 'Trò chơi: Kéo Co', path: '/game/keo-co', category: 'Trò chơi' },
      { title: 'Công cụ: Vòng Quay Gọi Tên', path: '/tool/vong-quay', category: 'Công cụ' },
      { title: 'Công Cụ Toán Học', path: `/tools/view/external/${encodeURIComponent('https://www.congcutoanhoc.com/')}`, category: 'Công cụ' },
      { title: 'Máy Tính Mathda', path: 'https://mathda.com/calculator/vi', category: 'Công cụ', isExternal: true },
      { title: 'Lớp Học Dojo', path: `/students/view/external/${encodeURIComponent('https://dojovtl.vercel.app')}`, category: 'Tiện ích dạy học' },
      { title: 'Quản Lý Nhận Xét Điểm', path: `/students/view/external/${encodeURIComponent('https://bangdiem-delta.vercel.app')}`, category: 'Tiện ích dạy học' },
      { title: 'Phím Tắt iMac', path: `/students/view/external/${encodeURIComponent('https://phimtatimac.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'Vòng Quay Học Tập', path: `/students/view/external/${encodeURIComponent('https://sheetpdf.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'CHUYỂN ĐỊNH DẠNG LATEX', path: `/students/view/external/${encodeURIComponent('https://latextojson.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'QUẢN LÝ MARKDOWN', path: `/students/view/external/${encodeURIComponent('https://quanlymd.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TẠO ID, CHUẨN HÓA, LỌC FILE LATEX, NHẬP EXCEL, KIỂM DUYỆT ĐỀ VÀ LƯU GOOGLE SHEETS TỰ ĐỘNG.', path: `/students/view/external/${encodeURIComponent('https://quanlymdid.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'MARKDOWN TO WORD', path: `/students/view/external/${encodeURIComponent('https://soangiangvbm.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'SOẠN LATEX', path: `/students/view/external/${encodeURIComponent('https://0tex.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TẠO TÀI LIỆU LATEX', path: `/students/view/external/${encodeURIComponent('https://soanthaolatexvtl.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TẠO LỆNH NOTEBOOK', path: `/students/view/external/${encodeURIComponent('https://notebookvtl.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TOÁN 10-THƯ VIỆN TOANMATH 41 TÀI LIỆU', path: `/students/view/external/${encodeURIComponent('https://notebook.google.com/notebook/f64f21fe-8c99-4993-86f8-fb531c61c816')}`, category: 'Tiện ích dạy học' },
      { title: 'TOÁN 9 -21 TÀI LIỆU', path: `/students/view/external/${encodeURIComponent('https://notebook.google.com/notebook/066eed7c-9442-4573-9237-819dab4b8dd8')}`, category: 'Tiện ích dạy học' },
      { title: 'CHỈNH SỬA PDF', path: `/students/view/external/${encodeURIComponent('https://catgheppdf.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'KHEN THƯỞNG', path: `/students/view/external/${encodeURIComponent('https://khenthuong-kappa.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'ANKI', path: `/students/view/external/${encodeURIComponent('https://hoccung-thayluc.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'WORKSHEET GEN - ĐỀ TOÁN HỌC', path: `/students/view/external/${encodeURIComponent('https://word-ai-psi.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TRÌNH ĐÓNG GÓI SCORM 1.2 (BẢN CHUYÊN NGHIỆP)', path: `/students/view/external/${encodeURIComponent('https://scormk12.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TRỢ LÝ VĂN BẢN GIÁO DỤC', path: `/students/view/external/${encodeURIComponent('https://notebook.google.com/notebook/ce2d3b36-3998-4c5a-9612-3283f18cf309')}`, category: 'Tiện ích dạy học' },
      { title: 'NGÂN HÀNG CÂU HỎI', path: `/students/view/external/${encodeURIComponent('https://nganhangbaihoc.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'SOẠN GIẢNG 4.0', path: `/students/view/external/${encodeURIComponent('https://baigiangthaytienluc.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'AI TEACHER STUDIO', path: `/students/view/external/${encodeURIComponent('https://k12onlineppt2026.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'BÁO GIẢNG THPT NGUYỄN HỮU CẢNH', path: `/students/view/external/${encodeURIComponent('https://lichbaogiang-ten.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'MATHFLASH HỌC CÔNG THỨC TOÁN HỌC QUA THẺ GHI NHỚ', path: `/students/view/external/${encodeURIComponent('https://khongcogitucodaucon.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'CÔNG CỤ TẠO TRÒ CHƠI GIÁO DỤC', path: `/students/view/external/${encodeURIComponent('https://mathgamev1.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'VÒNG QUAY HỌC TẬP TÍCH CỰC', path: `/students/view/external/${encodeURIComponent('https://vongquaytoanhoc.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'QUIZIZZ-KAHOOT', path: `/students/view/external/${encodeURIComponent('https://quizizzvsk12.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'BẢNG VẼ', path: `/students/view/external/${encodeURIComponent('https://boardtienluc.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'CHUYỂN ĐÁP ÁN K12', path: `/students/view/external/${encodeURIComponent('https://gemchuyendapank12.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TẠO SLIDE PPT', path: `/students/view/external/${encodeURIComponent('https://pptvtl.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TẠO FORMPT ẢNH', path: `/students/view/external/${encodeURIComponent('https://formptposter.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'QUẢN LÝ HTML', path: `/students/view/external/${encodeURIComponent('https://htmlmanager.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'LỆNH NOTEBOOK', path: `/students/view/external/${encodeURIComponent('https://notebooklm-beta-tawny.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'CÔNG CỤ CHUẨN HÓA ĐỀ TOÁN K12', path: `/students/view/external/${encodeURIComponent('https://chuanhoadetoan.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TẢI ẢNH SINH LINK', path: `/students/view/external/${encodeURIComponent('https://taianh2026.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'BẢNG VẼ V1', path: `/students/view/external/${encodeURIComponent('https://bang2026.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'CÔNG CỤ ĐỔI TÊN FILE HÀNG LOẠT', path: `/students/view/external/${encodeURIComponent('https://dattenfile.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TẠO CÔNG THỨC TOÁN', path: `/students/view/external/${encodeURIComponent('https://congthuctoan.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TẠO CÔNG THỨC TOÁN V2', path: `/students/view/external/${encodeURIComponent('https://incongthuc.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'NGÂN HÀNG CÂU HỎI', path: `/students/view/external/${encodeURIComponent('https://nganhang-id.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TRÌNH CHIẾU', path: `/students/view/external/${encodeURIComponent('https://motngaytuoidep.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'SOẠN LA TEX', path: `/students/view/external/${encodeURIComponent('https://latexcoban.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'XUẤT PNG TIKZ', path: `/students/view/external/${encodeURIComponent('https://tikzvutienluc.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'SOẠN LATEX V2', path: `/students/view/external/${encodeURIComponent('https://textienluc.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'SOẠN LATEX', path: `/students/view/external/${encodeURIComponent('https://latex26.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TẠO ĐỀ K12', path: `/students/view/external/${encodeURIComponent('https://k12online.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TẠO SCOM', path: `/students/view/external/${encodeURIComponent('https://k12scorm-3kj9.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'NGÂN HÀNG LUYỆN TẬP', path: `/students/view/external/${encodeURIComponent('https://nganhangbaitap.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'HỆ SINH THÁI LATEX: SINH ĐỀ & TRỘN ĐỀ', path: `/students/view/external/${encodeURIComponent('https://latex2026v1.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'SOẠN BEAMMER LATEX', path: `/students/view/external/${encodeURIComponent('https://latexbaigiang.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TIK SANG SVG ẢNH', path: `/students/view/external/${encodeURIComponent('https://tikz2svg.com/')}`, category: 'Tiện ích dạy học' },
      { title: 'SÔ TAY', path: `/students/view/external/${encodeURIComponent('https://sotay24.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TIỆN ÍCH TẢI NHẠC', path: `/students/view/external/${encodeURIComponent('https://catbox.moe/#')}`, category: 'Tiện ích dạy học' },
      { title: 'THÔNG BÁO K12', path: `/students/view/external/${encodeURIComponent('https://thongbaok-12.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TẠO NHẬN XÉT', path: `/students/view/external/${encodeURIComponent('https://taonhanxet.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TẠO NHẬN XÉT 2', path: `/students/view/external/${encodeURIComponent('https://nhanxethocba-lime.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'MD TO WORD', path: `/students/view/external/${encodeURIComponent('https://mdtoword-topaz.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'SỔ HỌP', path: `/students/view/external/${encodeURIComponent('https://sohopvtl.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'MÃ NGUỒN AVATA', path: `/students/view/external/${encodeURIComponent('https://www.dicebear.com/')}`, category: 'Tiện ích dạy học' },
      { title: 'CHUYỂN ĐỔI SANG JSON', path: `/students/view/external/${encodeURIComponent('https://jsonchuyendoi.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'ANKI 2027', path: `/students/view/external/${encodeURIComponent('https://vutienlucstudy.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'PPCT', path: `/students/view/external/${encodeURIComponent('https://soppct.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'GEO TO ẢNH PNG', path: `/students/view/external/${encodeURIComponent('https://geocode-sigma.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TRÌNH CHIẾU EXCEL CÓ BẢNG', path: `/students/view/external/${encodeURIComponent('https://trinhchieuvtl.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TẠO VIDEO', path: `/students/view/external/${encodeURIComponent('https://cuonsachkidieu.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'MÃ TIKZ SANG GEO', path: `/students/view/external/${encodeURIComponent('https://tikztogeo.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'SCRPIT GEO V1', path: `/students/view/external/${encodeURIComponent('https://geovascript.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'SCRPIT GEO V2', path: `/students/view/external/${encodeURIComponent('https://taohinhdongvtl.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'ĐƯA TÀI LIỆU VÀO. NHẬN MARKDOWN RA.', path: `/students/view/external/${encodeURIComponent('https://vutienluc-docs.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'MD TO EPUB PRO', path: `/students/view/external/${encodeURIComponent('https://dichsach.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'VĂN BẢN → GIỌNG NÓI TIẾNG VIỆT', path: `/students/view/external/${encodeURIComponent('https://vanbanvaloinoi.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'QUÉT GOOGLE DRIVE VÀ XUẤT DANH SÁCH RA GOOGLE SHEET HOẶC GOOGLE DOC.', path: `/students/view/external/${encodeURIComponent('https://script.google.com/macros/s/AKfycbzCosxbuJsYsVsyEm3YeqNcD0DzPMM8XU8x_SVuYFNSYTIjcMcmFhhGmQIvYYe1r3WSIA/exec')}`, category: 'Tiện ích dạy học' },
      { title: 'TẠO BẢN SAO GOOGLE SHEETS & THƯ MỤC DRIVE MỘT CÁCH DỄ DÀNG', path: `/students/view/external/${encodeURIComponent('https://script.google.com/macros/s/AKfycbwdGun2DI6zO305El_Tc5HnZdHRkY8Nv3xwKp-IwKjD3fi34CpghYsGquUzldMOpY6yIQ/exec')}`, category: 'Tiện ích dạy học' },
      { title: 'QUẢN LÝ TRUNG TÂM', path: `/students/view/external/${encodeURIComponent('https://binhminhvanhoa.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TRÌNH TẠO BÀI GIẢNG PRO', path: `/students/view/external/${encodeURIComponent('https://pptonline-self.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TRÌNH TẠO PROMPT SINH ĐỀ K12ONLINE', path: `/students/view/external/${encodeURIComponent('https://k12allin1.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'TRÌNH TẠO BÀI GIẢNG PRO (TOÁN & QUIZ & ENDING)', path: `/students/view/external/${encodeURIComponent('https://slide-lac.vercel.app/')}`, category: 'Tiện ích dạy học' },
      { title: 'CẨM NANG TIỆN ÍCH GIÁO VIÊN', path: `/students/view/external/${encodeURIComponent('https://camnanggiaovien.vercel.app/')}`, category: 'Tiện ích dạy học' }
    );

    // 2. Dynamic items from public folder
    const files = import.meta.glob('/public/**/*.html', { query: '?url' });
    Object.keys(files).forEach(path => {
      // Match something like /public/tools/10/file-name.html
      const match = path.match(/\/public\/(tools|models|students|games)\/([a-zA-Z0-9_-]+)\/(.+)\.html$/);
      if (match) {
        const type = match[1]; // tools, models, students, games
        const grade = match[2];
        const fileName = match[3];

        let categoryName = 'Tiện ích';
        if (type === 'tools') categoryName = 'Trợ lý thao tác';
        if (type === 'models') categoryName = 'Mô hình 3D';
        if (type === 'students') categoryName = 'Tiện ích dạy học';
        if (type === 'games') categoryName = 'Trò chơi nhúng';

        // Clean title
        const titleMatch = fileName.match(/^(\d+)[.\-_]?\s*(.*)/);
        const cleanTitle = titleMatch ? titleMatch[2].replace(/-/g, ' ').toUpperCase() : fileName.replace(/-/g, ' ').toUpperCase();

        const routePath = type === 'games' 
          ? `/game-nhung/${grade}_${encodeURIComponent(fileName)}` // rough guess for games route
          : `/${type}/view/${grade}/${encodeURIComponent(fileName)}`;

        allItems.push({
          title: cleanTitle + ` (Lớp ${grade})`,
          path: routePath,
          category: categoryName
        });
      }
    });

    searchData.current = allItems;
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim().length > 0) {
      const searchTerm = value.toLowerCase();
      const filtered = searchData.current.filter(item => 
        item.title.toLowerCase().includes(searchTerm) || 
        item.category.toLowerCase().includes(searchTerm)
      );
      setResults(filtered);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (item) => {
    setQuery('');
    setIsOpen(false);
    if (item.isExternal) {
      window.open(item.path, '_blank');
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="relative w-full max-w-xs md:max-w-md ml-4" ref={searchRef}>
      <div className="relative flex items-center">
        <div className="absolute left-3 text-gray-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          onFocus={() => { if (query.trim().length > 0) setIsOpen(true); }}
          placeholder="Tìm kiếm trò chơi, công cụ..."
          className="w-full bg-slate-900/50 border border-white/20 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all backdrop-blur-md"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(item)}
                  className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center justify-between group transition-colors border-b border-white/5 last:border-0"
                >
                  <div>
                    <div className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {item.category}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400">
              Không tìm thấy kết quả nào cho "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
