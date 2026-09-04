import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Video, Users } from 'lucide-react';
import './CalendarWidget.css';

const events = [
  { id: 1, title: 'Họp giao ban BGH', time: '08:00 - 09:30', date: 'Hôm nay', type: 'meeting', icon: Users },
  { id: 2, title: 'Dự giờ lớp 10A1', time: '14:00 - 14:45', date: 'Hôm nay', type: 'observation', icon: Video },
  { id: 3, title: 'Sinh hoạt chuyên môn tổ Toán', time: '15:00 - 17:00', date: 'Ngày mai', type: 'meeting', icon: Users },
];

const CalendarWidget = () => {
  return (
    <div className="calendar-widget card">
      <div className="widget-header">
        <h3 className="widget-title">
          <CalendarIcon size={20} className="text-primary" />
          Lịch công tác
        </h3>
        <div className="calendar-nav">
          <button className="icon-btn-small"><ChevronLeft size={16} /></button>
          <span className="current-month">Tháng 8, 2026</span>
          <button className="icon-btn-small"><ChevronRight size={16} /></button>
        </div>
      </div>
      
      <div className="mini-calendar">
        <div className="calendar-days">
          <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
        </div>
        <div className="calendar-dates">
          {/* Skeleton representation of dates */}
          {[...Array(30)].map((_, i) => (
            <div key={i} className={`date-cell ${i === 13 ? 'active' : ''} ${i === 15 || i === 20 ? 'has-event' : ''}`}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="upcoming-events">
        <h4 className="events-title">Sự kiện sắp tới</h4>
        <div className="events-list">
          {events.map(event => {
            const Icon = event.icon;
            return (
              <div key={event.id} className="event-item">
                <div className={`event-icon-wrap ${event.type}`}>
                  <Icon size={16} />
                </div>
                <div className="event-info">
                  <h5 className="event-name">{event.title}</h5>
                  <div className="event-meta">
                    <span className="event-time">{event.time}</span>
                    <span className="event-date">{event.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button className="btn btn-outline w-full mt-4">Xem toàn bộ lịch</button>
      </div>
    </div>
  );
};

export default CalendarWidget;
