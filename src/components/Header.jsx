import React from 'react';
import { Home } from 'lucide-react';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto glass-card rounded-2xl flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] transition-all duration-300">
            <img src="https://i.ibb.co/wZRKCnpw/10a9a7ae1ede.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-xl font-bold tracking-wide text-white hidden sm:block drop-shadow-md">
            TRỢ LÝ GIÁO VIÊN TOÁN THPT
          </h1>
        </div>
        
        <button className="flex items-center gap-2 glass-card px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
          <Home className="w-4 h-4" />
          <span>Trang chủ</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
