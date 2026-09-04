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
      { title: 'Vòng Quay Học Tập', path: `/students/view/external/${encodeURIComponent('https://sheetpdf.vercel.app/')}`, category: 'Tiện ích dạy học' }
    );

    // 2. Dynamic items from public folder
    const files = import.meta.glob('/public/**/*.html');
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
