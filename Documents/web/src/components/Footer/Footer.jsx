import React from 'react';
import './Footer.css';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-section">
          <h3 className="footer-title">Trợ lý GV Toán THPT</h3>
          <p className="footer-desc">
            Trợ lý đắc lực dành cho Giáo viên Toán THPT Nguyễn Hữu Cảnh.
            Tất cả vì học sinh thân yêu.
          </p>
        </div>
        
        <div className="footer-section">
          <h3 className="footer-title">Liên hệ</h3>
          <ul className="footer-links">
            <li>
              <MapPin size={16} />
              <span>123 Đường Giáo dục, Quận Học tập, TP. HCM</span>
            </li>
            <li>
              <Phone size={16} />
              <span>Hotline: 1900 1234</span>
            </li>
            <li>
              <Mail size={16} />
              <span>Email: support@eduportal.vn</span>
            </li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3 className="footer-title">Chính sách</h3>
          <ul className="footer-links">
            <li><button>Điều khoản sử dụng</button></li>
            <li><button>Chính sách bảo mật</button></li>
            <li><button>Hướng dẫn sử dụng</button></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2026 Trường THPT Nguyễn Hữu Cảnh. Bản quyền thuộc về nhà trường.</p>
      </div>
    </footer>
  );
};

export default Footer;
