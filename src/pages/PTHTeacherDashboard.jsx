import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, get, set, update, remove } from 'firebase/database';
import { situations } from '../data/pth_situations';
import * as XLSX from 'xlsx';

const HOST_ROOM_KEY = 'pth_host_room';

function TeacherDashboard() {
  const [roomId, setRoomId] = useState('');
  const [resumeRoom, setResumeRoom] = useState(null);
  const [className, setClassName] = useState('');
  const [activeSituationId, setActiveSituationId] = useState(1);
  const [allVotes, setAllVotes] = useState([]);
  const [showJoin, setShowJoin] = useState(true);

  const studentUrl = roomId ? `${window.location.origin}/scenario/play?pin=${roomId}` : '';

  // Khôi phục phòng cũ nếu giáo viên lỡ tải lại trang
  useEffect(() => {
    let code = null;
    try { code = localStorage.getItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    if (!code) return;
    get(ref(db, `scenarioRooms/${code}`)).then((snap) => {
      if (snap.exists()) setResumeRoom(code);
      else { try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ } }
    }).catch(() => {});
  }, []);

  // Theo dõi tình huống đang chiếu của phòng
  useEffect(() => {
    if (!roomId) return;
    const unsub = onValue(ref(db, `scenarioRooms/${roomId}`), (snap) => {
      const data = snap.val();
      if (data?.activeSituationId) setActiveSituationId(data.activeSituationId);
      if (data?.className !== undefined) setClassName(data.className || '');
    });
    return () => unsub();
  }, [roomId]);

  // Lấy toàn bộ phiếu của phòng, lọc theo tình huống ngay tại client
  useEffect(() => {
    if (!roomId) return;
    const unsub = onValue(ref(db, `scenarioRooms/${roomId}/votes`), (snap) => {
      setAllVotes(Object.values(snap.val() || {}));
    });
    return () => unsub();
  }, [roomId]);

  const createRoom = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await set(ref(db, `scenarioRooms/${code}`), {
      activeSituationId: 1,
      className: className.trim(),
      createdAt: Date.now()
    });
    try { localStorage.setItem(HOST_ROOM_KEY, code); } catch { /* không sao */ }
    setRoomId(code);
    setShowJoin(true);
  };

  const resumeHosting = () => {
    if (!resumeRoom) return;
    setRoomId(resumeRoom);
    setResumeRoom(null);
  };

  const closeRoom = async () => {
    if (!window.confirm('Xoá hẳn phòng này? Toàn bộ phiếu của học sinh sẽ mất.\nHãy xuất Excel trước khi xoá!')) return;
    await remove(ref(db, `scenarioRooms/${roomId}`));
    try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ }
    setRoomId('');
    setAllVotes([]);
    setActiveSituationId(1);
  };

  const changeSituation = async (newId) => {
    await update(ref(db, `scenarioRooms/${roomId}`), { activeSituationId: newId });
  };

  const toggleHighlight = async (voteId, currentStatus) => {
    await update(ref(db, `scenarioRooms/${roomId}/votes/${voteId}`), {
      isHighlighted: !currentStatus
    });
  };

  const votes = allVotes.filter(v => v.situationId === activeSituationId);

  const exportToExcel = () => {
    // Sheet 1: từng phiếu của mọi tình huống, xếp theo tên rồi tới số tình huống
    const rows = [...allVotes]
      .sort((a, b) => (a.studentName || '').localeCompare(b.studentName || '', 'vi') || a.situationId - b.situationId)
      .map((v, i) => {
        const s = situations.find(x => x.id === v.situationId);
        const opt = s?.options.find(o => o.id === v.optionId);
        return {
          'STT': i + 1,
          'Họ tên': v.studentName,
          'Lớp': className || '',
          'Tình huống': v.situationId,
          'Tên tình huống': s?.title || '',
          'Lựa chọn': v.optionId,
          'Nội dung lựa chọn': opt?.text || '',
          'Lý do': v.reason,
          'Được chiếu lên': v.isHighlighted ? 'x' : ''
        };
      });

    // Sheet 2: mỗi học sinh một dòng, đếm số tình huống đã tham gia để xếp Đạt/Chưa đạt
    const byName = {};
    allVotes.forEach(v => {
      if (!byName[v.studentName]) byName[v.studentName] = new Set();
      byName[v.studentName].add(v.situationId);
    });
    const danhSach = Object.keys(byName)
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map((name, i) => ({
        'STT': i + 1,
        'Họ tên': name,
        'Lớp': className || '',
        'Số tình huống đã tham gia': byName[name].size,
        'Tổng số tình huống': situations.length,
        'Đánh giá': byName[name].size >= Math.ceil(situations.length / 2) ? 'Đạt' : 'Chưa đạt'
      }));

    // Sheet 3: phân bố lựa chọn của từng tình huống
    const thongKe = [];
    situations.forEach(s => {
      const vs = allVotes.filter(v => v.situationId === s.id);
      s.options.forEach(o => {
        thongKe.push({
          'Tình huống': s.id,
          'Tên tình huống': s.title,
          'Phương án': o.id,
          'Nội dung': o.text,
          'Số lượt chọn': vs.filter(v => v.optionId === o.id).length,
          'Tỉ lệ %': vs.length ? Math.round(vs.filter(v => v.optionId === o.id).length / vs.length * 100) : 0
        });
      });
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(danhSach), 'Danh sách đánh giá');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Chi tiết phiếu');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(thongKe), 'Thống kê lựa chọn');
    XLSX.writeFile(wb, `PhongTinhHuong_${className || 'Lop'}_${roomId}.xlsx`);
  };

  // ---- Màn hình tạo phòng ----
  if (!roomId) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '460px', width: '100%' }}>
          <h2 style={{ textAlign: 'center' }}>🎭 Phòng Tình Huống</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Mỗi lớp một mã PIN riêng, phiếu của các lớp không lẫn vào nhau.
          </p>

          {resumeRoom && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: 'var(--radius)', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid var(--warning)' }}>
              <p style={{ fontWeight: 700 }}>Đang có phòng dở dang: <strong>{resumeRoom}</strong></p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button onClick={resumeHosting} className="btn-primary" style={{ flex: 1 }}>Vào lại phòng</button>
                <button
                  onClick={() => { try { localStorage.removeItem(HOST_ROOM_KEY); } catch { /* không sao */ } setResumeRoom(null); }}
                  className="btn-secondary"
                >Bỏ qua</button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Tên lớp (ví dụ: 10A5)"
              value={className}
              onChange={e => setClassName(e.target.value)}
            />
            <button onClick={createRoom} className="btn-primary">🚀 Tạo phòng mới</button>
          </div>
        </div>
      </div>
    );
  }

  const situation = situations.find(s => s.id === activeSituationId);

  return (
    <div className="container" style={{ maxWidth: '1000px', padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2>🎭 Phòng Tình Huống — Bảng Điều Khiển</h2>
          <p style={{ marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
            Mã phòng: <strong style={{ fontFamily: 'monospace', fontSize: '1.4rem', color: 'var(--accent-primary)', letterSpacing: '3px' }}>{roomId}</strong>
            {className && <span> · Lớp {className}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => window.open(`/scenario/projector?pin=${roomId}`, '_blank')} className="btn-secondary">
            🖥️ Mở màn chiếu
          </button>
          <button onClick={() => setShowJoin(v => !v)} className="btn-secondary">
            📱 {showJoin ? 'Ẩn mã vào' : 'Mã cho học sinh'}
          </button>
          <button onClick={exportToExcel} className="btn-primary" style={{ background: 'var(--success)' }}>
            📊 Xuất File Excel
          </button>
          <button onClick={closeRoom} className="btn-secondary" style={{ color: 'var(--danger, #ef4444)' }}>
            🗑️ Đóng phòng
          </button>
        </div>
      </header>

      {/* Lối vào cho học sinh: quét QR hoặc gõ mã PIN */}
      {showJoin && (
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(studentUrl)}&bgcolor=ffffff&color=000000&margin=8`}
            alt="QR vào phòng" width="180" height="180"
            style={{ borderRadius: '12px', background: '#fff', padding: '8px' }}
          />
          <div style={{ flex: 1, minWidth: '240px' }}>
            <p style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.4rem' }}>Học sinh quét mã QR (đã kèm sẵn mã phòng)</p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.95rem', wordBreak: 'break-all', opacity: 0.85 }}>{studentUrl}</p>
            <p style={{ marginTop: '0.75rem', fontSize: '0.95rem' }}>
              Hoặc vào <strong>{window.location.origin}/scenario/play</strong> rồi nhập mã <strong style={{ letterSpacing: '2px' }}>{roomId}</strong>
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Cột trái: Điều khiển */}
        <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <h3>Điều khiển tình huống</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {situations.map(s => {
              const n = allVotes.filter(v => v.situationId === s.id).length;
              return (
                <button
                  key={s.id}
                  className={s.id === activeSituationId ? "btn-primary" : "btn-secondary"}
                  onClick={() => changeSituation(s.id)}
                  style={{ textAlign: 'left', padding: '0.75rem' }}
                >
                  {s.id}. {s.title}{n > 0 ? ` · ${n} phiếu` : ''}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)' }}>
            <h4>Thống kê nhanh</h4>
            <p style={{ marginTop: '0.5rem' }}>Đã trả lời tình huống này: <strong>{votes.length}</strong></p>
            <p style={{ marginTop: '0.25rem' }}>Tổng phiếu cả buổi: <strong>{allVotes.length}</strong></p>
          </div>
        </div>

        {/* Cột phải: Xem lý do */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }}>
            Danh sách lý do (Tình huống {activeSituationId}{situation ? ` — ${situation.title}` : ''})
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
