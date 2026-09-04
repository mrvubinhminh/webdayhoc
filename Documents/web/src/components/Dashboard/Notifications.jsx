import React from 'react';
import { Bell, Newspaper } from 'lucide-react';
import './Notifications.css';

const newsItems = [
  { id: 1, title: 'Thông báo triển khai kế hoạch giáo dục năm học 2026-2027', date: '12/08/2026', isNew: true },
  { id: 2, title: 'Hướng dẫn đánh giá chuẩn nghề nghiệp giáo viên', date: '10/08/2026', isNew: false },
  { id: 3, title: 'Kết quả hội thi giáo viên dạy giỏi cấp trường', date: '05/08/2026', isNew: false },
];

const Notifications = () => {
  return (
    <div className="notifications-widget card">
      <div className="widget-header mb-4">
        <h3 className="widget-title">
          <Bell size={20} className="text-warning" />
          Thông báo & Tin tức
        </h3>
      </div>
      
      <div className="news-list">
        {newsItems.map(item => (
          <div key={item.id} className="news-item">
            <div className="news-icon">
              <Newspaper size={18} className="text-muted" />
            </div>
            <div className="news-content">
              <h5 className="news-title">
                {item.title}
                {item.isNew && <span className="badge-new">Mới</span>}
              </h5>
              <span className="news-date">{item.date}</span>
            </div>
          </div>
        ))}
      </div>
      
      <button className="btn btn-outline w-full mt-4">Xem tất cả</button>
    </div>
  );
};

export default Notifications;
