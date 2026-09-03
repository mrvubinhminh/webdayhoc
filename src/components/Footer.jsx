import React from 'react';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-4 glass-card rounded-none border-x-0 border-b-0 border-t z-50 bg-[#0b0f19]/80">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-xs sm:text-sm text-gray-400">
        <div className="text-center md:text-left mb-2 md:mb-0">
          Tác giả: <span className="text-blue-400 font-bold">Thầy Vũ Tiến Lực</span> - Trường THPT Nguyễn Hữu Cảnh
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          Powered by React
        </div>
      </div>
    </footer>
  );
};

export default Footer;
