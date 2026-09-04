import React from 'react';
import { ClipboardList, BookOpen, Clock, FileCheck, BellRing, AlertCircle } from 'lucide-react';
import './DashboardStats.css';

const stats = [
  { id: 1, title: 'Kế hoạch đang thực hiện', value: '12', icon: ClipboardList, color: 'primary', trend: '+2%' },
  { id: 2, title: 'Chuyên đề tháng này', value: '4', icon: BookOpen, color: 'secondary', trend: 'Mới' },
  { id: 3, title: 'Tiết dự giờ', value: '28', icon: Clock, color: 'success', trend: '+5' },
  { id: 4, title: 'Hồ sơ cần duyệt', value: '15', icon: FileCheck, color: 'warning', trend: 'Gấp' },
  { id: 5, title: 'Thông báo mới', value: '8', icon: BellRing, color: 'primary', trend: '' },
  { id: 6, title: 'Công việc quá hạn', value: '2', icon: AlertCircle, color: 'danger', trend: 'Cần xử lý' },
];

const DashboardStats = () => {
  return (
    <div className="stats-grid">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.id} className="stat-card card animate-fade-in">
            <div className="stat-header">
              <div className={`stat-icon-wrapper bg-${stat.color}-light`}>
                <Icon className={`text-${stat.color}`} size={24} />
              </div>
              {stat.trend && (
                <span className={`stat-trend text-${stat.color}`}>{stat.trend}</span>
              )}
            </div>
            <div className="stat-body">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-title">{stat.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;
