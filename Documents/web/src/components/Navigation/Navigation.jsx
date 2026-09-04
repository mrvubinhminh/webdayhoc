import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

const navItems = [
  { path: '/', label: 'Trang chủ' },
  { path: '/ke-hoach', label: 'Kế hoạch giáo dục' },
  { path: '/nhan-su', label: 'Quản lý nhân sự' },
  { path: '/hoc-lieu', label: 'Quản lý học liệu' },
  { path: '/kiem-tra', label: 'Đánh giá - Kiểm tra' },
  { path: '/tai-lieu', label: 'Kho tài liệu' },
  { path: '/du-lieu', label: 'Cơ sở dữ liệu' },
  { path: '/ho-so', label: 'Trình ký hồ sơ' },
  { path: '/bao-cao', label: 'Báo cáo thống kê' },
  { path: '/lich', label: 'Lịch công tác' }
];

const Navigation = () => {
  return (
    <nav className="main-nav">
      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.path} className="nav-item">
            <NavLink
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;
