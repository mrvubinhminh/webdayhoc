import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Users, Video, ClipboardCheck, 
  FolderOpen, Database, FileSignature, PieChart, CalendarDays
} from 'lucide-react';
import './FeatureModules.css';

const modules = [
  { id: 1, title: 'Kế hoạch giáo dục', desc: 'Quản lý PPCT, KHBD', icon: FileText, color: 'primary', link: '/ke-hoach' },
  { id: 2, title: 'Quản lý nhân sự', desc: 'Giáo viên & Học sinh', icon: Users, color: 'success', link: '/nhan-su' },
  { id: 3, title: 'Quản lý học liệu', desc: 'Kho bài giảng, video', icon: Video, color: 'warning', link: '/hoc-lieu' },
  { id: 4, title: 'Đánh giá & Kiểm tra', desc: 'Ngân hàng đề thi', icon: ClipboardCheck, color: 'info', link: '/kiem-tra' },
  { id: 5, title: 'Kho tài liệu chung', desc: 'Văn bản, quyết định', icon: FolderOpen, color: 'primary', link: '/tai-lieu' },
  { id: 6, title: 'Cơ sở dữ liệu', desc: 'Đồng bộ hệ thống', icon: Database, color: 'success', link: '/du-lieu' },
  { id: 7, title: 'Trình ký điện tử', desc: 'Hồ sơ chuyên môn', icon: FileSignature, color: 'warning', link: '/ho-so' },
  { id: 8, title: 'Báo cáo thống kê', desc: 'Chất lượng giáo dục', icon: PieChart, color: 'info', link: '/bao-cao' },
  { id: 9, title: 'Lịch công tác', desc: 'Sự kiện, hội họp', icon: CalendarDays, color: 'primary', link: '/lich' }
];

const FeatureModules = () => {
  return (
    <div className="modules-grid">
      {modules.map((mod) => {
        const Icon = mod.icon;
        return (
          <div key={mod.id} className="module-card card">
            <div className={`module-icon bg-${mod.color}-light text-${mod.color}`}>
              <Icon size={24} />
            </div>
            <div className="module-info">
              <h3 className="module-title">{mod.title}</h3>
              <p className="module-desc">{mod.desc}</p>
            </div>
            <Link to={mod.link || '#'} className="module-action-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Truy cập
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default FeatureModules;
