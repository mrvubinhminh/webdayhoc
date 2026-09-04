import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import PlanPage from './pages/PlanPage';
import CreatePlan from './pages/CreatePlan';
import PlaceholderPage from './pages/PlaceholderPage';
import { 
  Users, Video, ClipboardCheck, 
  FolderOpen, Database, FileSignature, PieChart, CalendarDays
} from 'lucide-react';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ke-hoach" element={<PlanPage />} />
          <Route path="/ke-hoach/tao-moi" element={<CreatePlan />} />
          <Route path="/nhan-su" element={<PlaceholderPage title="Quản lý nhân sự" icon={Users} />} />
          <Route path="/hoc-lieu" element={<PlaceholderPage title="Quản lý học liệu" icon={Video} />} />
          <Route path="/kiem-tra" element={<PlaceholderPage title="Đánh giá & Kiểm tra" icon={ClipboardCheck} />} />
          <Route path="/tai-lieu" element={<PlaceholderPage title="Kho tài liệu chung" icon={FolderOpen} />} />
          <Route path="/du-lieu" element={<PlaceholderPage title="Cơ sở dữ liệu" icon={Database} />} />
          <Route path="/ho-so" element={<PlaceholderPage title="Trình ký điện tử" icon={FileSignature} />} />
          <Route path="/bao-cao" element={<PlaceholderPage title="Báo cáo thống kê" icon={PieChart} />} />
          <Route path="/lich" element={<PlaceholderPage title="Lịch công tác" icon={CalendarDays} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
