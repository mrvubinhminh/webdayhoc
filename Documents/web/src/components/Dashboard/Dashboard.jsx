import React from 'react';
import HeroBanner from './HeroBanner';
import DashboardStats from './DashboardStats';
import FeatureModules from './FeatureModules';
import CalendarWidget from './CalendarWidget';
import Notifications from './Notifications';
import Analytics from './Analytics';
import Timeline from './Timeline';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard container">
      <HeroBanner />
      
      <div className="dashboard-section">
        <h2 className="section-title">Tổng quan hoạt động</h2>
        <DashboardStats />
      </div>

      <div className="dashboard-grid-layout">
        <div className="grid-main">
          <div className="dashboard-section">
            <h2 className="section-title">Chức năng nổi bật</h2>
            <FeatureModules />
          </div>
          
          <div className="dashboard-section">
            <h2 className="section-title">Báo cáo trực quan</h2>
            <Analytics />
          </div>
        </div>
        
        <div className="grid-sidebar">
          <div className="dashboard-section">
            <CalendarWidget />
          </div>
          
          <div className="dashboard-section">
            <Notifications />
          </div>
          
          <div className="dashboard-section">
            <Timeline />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
