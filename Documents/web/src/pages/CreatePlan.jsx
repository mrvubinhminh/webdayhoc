import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

const CreatePlan = () => {
  const navigate = useNavigate();

  const handleSave = (e) => {
    e.preventDefault();
    alert('Đã lưu kế hoạch thành công!');
    navigate('/ke-hoach');
  };

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link to="/ke-hoach" className="btn btn-outline" style={{ padding: '8px', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Tạo kế hoạch giáo dục mới</h2>
          <p style={{ color: 'var(--text-muted)' }}>Điền các thông tin cơ bản để khởi tạo kế hoạch</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 500, color: 'var(--text-main)' }}>Tên kế hoạch <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input 
              type="text" 
              placeholder="VD: Kế hoạch dạy học môn Toán Khối 10" 
              required
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 500, color: 'var(--text-main)' }}>Tổ chuyên môn</label>
              <select style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none', backgroundColor: 'var(--surface)' }}>
                <option value="toan-tin">Tổ Toán - Tin</option>
                <option value="van">Tổ Ngữ Văn</option>
                <option value="ly-hoa-sinh">Tổ Lý - Hóa - Sinh</option>
                <option value="su-dia">Tổ Sử - Địa</option>
                <option value="anh">Tổ Tiếng Anh</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 500, color: 'var(--text-main)' }}>Năm học</label>
              <select style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none', backgroundColor: 'var(--surface)' }}>
                <option value="2025-2026">2025 - 2026</option>
                <option value="2026-2027">2026 - 2027</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 500, color: 'var(--text-main)' }}>Mô tả ngắn</label>
            <textarea 
              rows="4" 
              placeholder="Nhập mô tả cho kế hoạch..." 
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none', resize: 'vertical' }}
            ></textarea>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 500, color: 'var(--text-main)' }}>Đính kèm tệp</label>
            <div style={{ border: '2px dashed var(--border)', padding: '32px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>Kéo thả tệp vào đây hoặc <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>chọn tệp</span></p>
              <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Hỗ trợ PDF, DOCX, XLSX (Tối đa 10MB)</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <Link to="/ke-hoach" className="btn btn-outline" style={{ textDecoration: 'none' }}>Hủy bỏ</Link>
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              Lưu kế hoạch
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreatePlan;
