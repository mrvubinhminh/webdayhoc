import React from 'react';
import './Header.css';
import { Search, Bell, MessageSquare, ChevronDown } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <div className="logo-icon">T</div>
          <span className="logo-text">Trợ lý Toán</span>
        </div>
      </div>
      
      <div className="header-center">
        <div className="search-bar">
          <Search className="search-icon" size={20} />
          <input type="text" placeholder="Tìm kiếm toàn hệ thống..." />
        </div>
      </div>
      
      <div className="header-right">
        <button className="year-switcher">
          Năm học 2025-2026
          <ChevronDown size={16} />
        </button>
        <div className="icon-group">
          <button className="icon-btn">
            <MessageSquare size={20} />
            <span className="badge">3</span>
          </button>
          <button className="icon-btn">
            <Bell size={20} />
            <span className="badge">5</span>
          </button>
        </div>
        <div className="user-profile">
          <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="avatar" />
          <div className="user-info">
            <span className="user-name">Thầy Vũ Tiến Lực</span>
            <span className="user-role">Hiệu trưởng</span>
          </div>
          <ChevronDown size={16} className="dropdown-icon" />
        </div>
      </div>
    </header>
  );
};

export default Header;
