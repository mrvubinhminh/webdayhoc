import React from 'react';

const PlaceholderPage = ({ title, icon: Icon }) => {
  return (
    <div className="container" style={{ padding: '40px 24px', minHeight: '60vh' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        {Icon && <Icon size={64} style={{ color: 'var(--primary)', opacity: 0.8 }} />}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{title}</h2>
        <p style={{ color: 'var(--text-muted)' }}>Tính năng đang được phát triển. Vui lòng quay lại sau!</p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
