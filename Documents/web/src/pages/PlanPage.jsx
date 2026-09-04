import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Search, Filter } from 'lucide-react';

const PlanPage = () => {
  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Kế hoạch giáo dục</h2>
          <p style={{ color: 'var(--text-muted)' }}>Quản lý kế hoạch giáo dục của nhà trường và các tổ chuyên môn</p>
        </div>
        <Link to="/ke-hoach/tao-moi" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          <Plus size={18} />
          Tạo kế hoạch mới
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div className="search-bar" style={{ flex: 1, maxWidth: '400px' }}>
            <Search className="search-icon" size={20} />
            <input type="text" placeholder="Tìm kiếm kế hoạch..." />
          </div>
          <button className="btn btn-outline">
            <Filter size={18} />
            Lọc
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '16px 8px', fontWeight: 500 }}>Tên kế hoạch</th>
              <th style={{ padding: '16px 8px', fontWeight: 500 }}>Tổ chuyên môn</th>
              <th style={{ padding: '16px 8px', fontWeight: 500 }}>Người tạo</th>
              <th style={{ padding: '16px 8px', fontWeight: 500 }}>Ngày tạo</th>
              <th style={{ padding: '16px 8px', fontWeight: 500 }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '16px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', borderRadius: '8px' }}>
                    <FileText size={18} />
                  </div>
                  <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Kế hoạch dạy học môn Toán HK1</span>
                </div>
              </td>
              <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>Tổ Toán - Tin</td>
              <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>Nguyễn Thị B</td>
              <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>14/08/2026</td>
              <td style={{ padding: '16px 8px' }}>
                <span style={{ padding: '4px 8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 500 }}>
                  Đã duyệt
                </span>
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '16px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', borderRadius: '8px' }}>
                    <FileText size={18} />
                  </div>
                  <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Kế hoạch Sinh hoạt chuyên đề Hóa</span>
                </div>
              </td>
              <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>Tổ Hóa - Sinh</td>
              <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>Trần Văn C</td>
              <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>12/08/2026</td>
              <td style={{ padding: '16px 8px' }}>
                <span style={{ padding: '4px 8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 500 }}>
                  Chờ duyệt
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlanPage;
