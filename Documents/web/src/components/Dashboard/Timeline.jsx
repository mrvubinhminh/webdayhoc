import React from 'react';
import { Activity, CheckCircle2, FileEdit, UserPlus } from 'lucide-react';
import './Timeline.css';

const timelineEvents = [
  { id: 1, action: 'Trần Thị B đã trình ký', target: 'Kế hoạch Bài dạy tuần 1', time: '10 phút trước', icon: FileEdit, color: 'primary' },
  { id: 2, action: 'Tổ Toán đã phê duyệt', target: 'Ma trận đề kiểm tra', time: '1 giờ trước', icon: CheckCircle2, color: 'success' },
  { id: 3, action: 'BGH phân công', target: 'Lịch dự giờ tuần 2', time: '3 giờ trước', icon: UserPlus, color: 'secondary' },
];

const Timeline = () => {
  return (
    <div className="timeline-widget card">
      <div className="widget-header mb-4">
        <h3 className="widget-title">
          <Activity size={20} className="text-secondary" />
          Hoạt động gần đây
        </h3>
      </div>
      
      <div className="timeline">
        {timelineEvents.map((event, index) => {
          const Icon = event.icon;
          const isLast = index === timelineEvents.length - 1;
          
          return (
            <div key={event.id} className="timeline-item">
              <div className="timeline-indicator">
                <div className={`timeline-icon bg-${event.color}-light text-${event.color}`}>
                  <Icon size={14} />
                </div>
                {!isLast && <div className="timeline-line"></div>}
              </div>
              <div className="timeline-content">
                <p className="timeline-text">
                  <span className="font-medium">{event.action}</span>
                  <br/>
                  <span className="text-muted">{event.target}</span>
                </p>
                <span className="timeline-time">{event.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;
