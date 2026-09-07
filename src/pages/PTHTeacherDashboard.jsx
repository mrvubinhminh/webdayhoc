import React, { useState, useEffect } from 'react';
import { dbFirestore as db } from '../firebase';
import { doc, onSnapshot, setDoc, collection, query, where, updateDoc } from 'firebase/firestore';
import { situations } from '../data/pth_situations';
import * as XLSX from 'xlsx';

function TeacherDashboard() {
  const [activeSituationId, setActiveSituationId] = useState(1);
  const [votes, setVotes] = useState([]);
  const roomId = 'default-room';
  const [showJoin, setShowJoin] = useState(false);
  const studentUrl = `${window.location.origin}/scenario/play`;

  // Listen to active situation
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
      if (docSnap.exists()) {
        setActiveSituationId(docSnap.data().activeSituationId || 1);
      } else {
        // Initialize room if not exists
        setDoc(doc(db, 'rooms', roomId), { activeSituationId: 1 });
      }
    });
    return () => unsub();
  }, []);

  // Listen to votes for the current situation
  useEffect(() => {
    const q = query(collection(db, `rooms/${roomId}/votes`), where("situationId", "==", activeSituationId));
    const unsub = onSnapshot(q, (querySnapshot) => {
      const votesData = [];
      querySnapshot.forEach((doc) => {
        votesData.push({ id: doc.id, ...doc.data() });
      });
      setVotes(votesData);
    });
    return () => unsub();
  }, [activeSituationId]);

  const changeSituation = async (newId) => {
    await setDoc(doc(db, 'rooms', roomId), { activeSituationId: newId }, { merge: true });
  };

  const toggleHighlight = async (voteId, currentStatus) => {
    await updateDoc(doc(db, `rooms/${roomId}/votes`, voteId), {
      isHighlighted: !currentStatus
    });
  };

  const exportToExcel = () => {
    // Tải tất cả phiếu bầu của mọi tình huống để xuất báo cáo
    // Ở bản demo này ta xuất tạm dữ liệu đang có trên state (hoặc fetch full)
    // Để cho nhanh, ta export state hiện tại
    const wsData = votes.map(v => ({
      'Tên Học Sinh': v.studentName,
      'Tình Huống': v.situationId,
      'Lựa chọn': v.optionId,
      'Lý do': v.reason,
      'Đánh giá (Đạt/Chưa đạt)': 'Đạt' // Tự động Đạt nếu có tham gia
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách tham gia");
    XLSX.writeFile(wb, `PhongTinhHuong_ThongKe_TH${activeSituationId}.xlsx`);
  };

  const situation = situations.find(s => s.id === activeSituationId);

  return (
    <div className="container" style={{ maxWidth: '1000px', padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2>🎭 Phòng Tình Huống — Bảng Điều Khiển</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => window.open('/scenario/projector', '_blank')} className="btn-secondary">
            🖥️ Mở màn chiếu
          </button>
          <button onClick={() => setShowJoin(v => !v)} className="btn-secondary">
            📱 {showJoin ? 'Ẩn mã vào' : 'Mã cho học sinh'}
          </button>
          <button onClick={exportToExcel} className="btn-primary" style={{ background: 'var(--success)' }}>
            📊 Xuất File Excel
          </button>
        </div>
      </header>

      {/* Lối vào cho học sinh: quét QR hoặc gõ địa chỉ */}
      {showJoin && (
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(studentUrl)}&bgcolor=ffffff&color=000000&margin=8`}
            alt="QR vào phòng" width="180" height="180"
            style={{ borderRadius: '12px', background: '#fff', padding: '8px' }}
          />
          <div style={{ flex: 1, minWidth: '240px' }}>
            <p style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.4rem' }}>Học sinh quét mã hoặc mở địa chỉ:</p>
            <p style={{ fontFamily: 'monospace', fontSize: '1rem', wordBreak: 'break-all', opacity: 0.85 }}>{studentUrl}</p>
            <p style={{ marginTop: '0.75rem', opacity: 0.7, fontSize: '0.9rem' }}>
              Cả lớp dùng chung một phòng, không cần nhập mã PIN.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Cột trái: Điều khiển */}
        <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <h3>Điều khiển tình huống</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {situations.map(s => (
              <button 
                key={s.id}
                className={s.id === activeSituationId ? "btn-primary" : "btn-secondary"}
                onClick={() => changeSituation(s.id)}
                style={{ textAlign: 'left', padding: '0.75rem' }}
              >
                {s.id}. {s.title}
              </button>
            ))}
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)' }}>
            <h4>Thống kê nhanh</h4>
            <p style={{ marginTop: '0.5rem' }}>Số người đã trả lời: <strong>{votes.length}</strong></p>
          </div>
        </div>

        {/* Cột phải: Xem lý do */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }}>
            Danh sách lý do (Tình huống {activeSituationId})
          </h3>
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Bấm "Chiếu lên" để đưa lý do nổi bật lên màn hình máy chiếu.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {votes.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>Chưa có học sinh nào trả lời...</p>
            ) : (
              votes.map(v => (
                <div key={v.id} style={{ 
                  padding: '1rem', 
                  borderRadius: 'var(--radius)', 
                  border: v.isHighlighted ? '2px solid var(--warning)' : '1px solid var(--border)',
                  background: 'rgba(15, 23, 42, 0.4)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{v.studentName} <span style={{ color: 'var(--accent-primary)' }}>(Chọn {v.optionId})</span></strong>
                    <button 
                      onClick={() => toggleHighlight(v.id, v.isHighlighted)}
                      style={{ 
                        background: v.isHighlighted ? 'var(--warning)' : 'var(--bg-secondary)', 
                        color: v.isHighlighted ? '#000' : '#fff',
                        border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' 
                      }}
                    >
                      {v.isHighlighted ? 'Bỏ chiếu' : 'Chiếu lên'}
                    </button>
                  </div>
                  <p>"{v.reason}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
