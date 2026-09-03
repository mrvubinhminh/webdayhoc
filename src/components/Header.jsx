import React from 'react';
import { Home } from 'lucide-react';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto glass-card rounded-2xl flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg text-white font-bold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-wide text-white hidden sm:block">
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
