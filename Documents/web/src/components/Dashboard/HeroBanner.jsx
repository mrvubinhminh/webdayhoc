import React from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import './HeroBanner.css';

const HeroBanner = () => {
  return (
    <div className="hero-banner">
      <div className="hero-content">
        <h1 className="hero-title">
          TRỢ LÝ GIÁO VIÊN <br />
          <span className="text-gradient">TOÁN THPT</span>
        </h1>
        <p className="hero-desc">
          Tất cả vì học sinh thân yêu - Trường THPT Nguyễn Hữu Cảnh.
        </p>
        <div className="hero-actions">
          <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Không gian Sáng tạo
            <ArrowRight size={18} />
          </Link>
          <Link to="/ke-hoach/tao-moi" className="btn btn-outline glass-btn" style={{ textDecoration: 'none' }}>
            <Plus size={18} />
            Tạo kế hoạch mới
          </Link>
        </div>
      </div>
      <div className="hero-illustration">
        <div className="abstract-shape shape-1"></div>
        <div className="abstract-shape shape-2"></div>
        <div className="abstract-shape shape-3"></div>
        <div className="glass-card mockup-card-1">
          <div className="skeleton-line w-3/4"></div>
          <div className="skeleton-line w-1/2"></div>
          <div className="skeleton-line w-full mt-4"></div>
          <div className="skeleton-line w-full"></div>
        </div>
        <div className="glass-card mockup-card-2">
          <div className="icon-circle"></div>
          <div className="skeleton-line w-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
