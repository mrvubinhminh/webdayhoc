import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import './Analytics.css';

const barData = [
  { name: 'Tổ Toán', completed: 85, pending: 15 },
  { name: 'Tổ Văn', completed: 92, pending: 8 },
  { name: 'Tổ Anh', completed: 78, pending: 22 },
  { name: 'Tổ Lý', completed: 88, pending: 12 },
  { name: 'Tổ Hóa', completed: 95, pending: 5 },
];

const pieData = [
  { name: 'Giỏi', value: 45 },
  { name: 'Khá', value: 35 },
  { name: 'Đạt', value: 15 },
  { name: 'Chưa đạt', value: 5 },
];

const COLORS = ['#10B981', '#2563EB', '#F59E0B', '#EF4444'];

const Analytics = () => {
  return (
    <div className="analytics-container card">
      <div className="widget-header mb-4">
        <h3 className="widget-title">
          <BarChart3 size={20} className="text-primary" />
          Tiến độ & Chất lượng
        </h3>
        <select className="filter-select">
          <option>Học kỳ 1</option>
          <option>Học kỳ 2</option>
          <option>Cả năm</option>
        </select>
      </div>

      <div className="charts-grid">
        <div className="chart-wrapper">
          <h4 className="chart-title">Tiến độ hoàn thành Kế hoạch theo Tổ</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <RechartsTooltip cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="completed" name="Hoàn thành" stackId="a" fill="var(--primary)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="pending" name="Chưa hoàn thành" stackId="a" fill="var(--border)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-wrapper">
          <h4 className="chart-title">Xếp loại giờ dạy</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
