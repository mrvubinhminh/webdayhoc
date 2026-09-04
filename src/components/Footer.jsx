import React from 'react';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-4 glass-card rounded-none border-x-0 border-b-0 border-t z-50 bg-[#0b0f19]/80">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center text-center">
        <div className="text-lg md:text-xl font-bold tracking-wide animate-pulse">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.7)]">
            Tác giả: Thầy Vũ Tiến Lực - Trường THPT Nguyễn Hữu Cảnh
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
