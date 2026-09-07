import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { situations } from '../data/pth_situations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

function ProjectorView() {
  const [searchParams] = useSearchParams();
  const [activeSituationId, setActiveSituationId] = useState(1);
  const [votes, setVotes] = useState([]);

  // Mã phòng lấy từ đường dẫn, nếu mở thẳng thì lấy phòng giáo viên vừa tạo trên máy này
  const [roomId, setRoomId] = useState(() => {
    const fromUrl = searchParams.get('pin');
    if (fromUrl) return fromUrl;
    try { return localStorage.getItem('pth_host_room') || ''; } catch { return ''; }
  });
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    if (!roomId) return;
    const unsub = onValue(ref(db, `scenarioRooms/${roomId}`), (snap) => {
      const data = snap.val();
      if (data?.activeSituationId) setActiveSituationId(data.activeSituationId);
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const unsub = onValue(ref(db, `scenarioRooms/${roomId}/votes`), (snap) => {
      const all = snap.val() || {};
      setVotes(Object.values(all).filter(v => v.situationId === activeSituationId));
    });
    return () => unsub();
  }, [roomId, activeSituationId]);

  const situation = situations.find(s => s.id === activeSituationId);
  
  // Tính toán dữ liệu cho biểu đồ
  const chartData = situation ? situation.options.map((opt, index) => {
    const count = votes.filter(v => v.optionId === opt.id).length;
    return {
      name: `Phương án ${opt.id}`,
      count: count,
      color: COLORS[index % COLORS.length]
    };
  }) : [];

  const highlightedReasons = votes.filter(v => v.isHighlighted);

  if (!roomId) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <h2>🖥️ Màn chiếu Phòng Tình Huống</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Nhập mã phòng của lớp đang học.</p>
          <form
            onSubmit={(e) => { e.preventDefault(); if (/^\d{6}$/.test(pinInput.trim())) setRoomId(pinInput.trim()); }}
            style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <input
              type="tel" inputMode="numeric" maxLength={6} className="input-field"
              placeholder="Mã phòng" value={pinInput}
              onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
              style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: '8px', fontFamily: 'monospace' }}
            />
            <button type="submit" className="btn-primary">Mở màn chiếu</button>
          </form>
        </div>
      </div>
    );
  }

  if (!situation) return <div className="container" style={{ textAlign: 'center', fontSize: '2rem', marginTop: '20vh' }}>Đang tải...</div>;

  return (
    <div style={{ padding: '2rem 4rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      <div style={{ position: 'absolute', top: '1rem', right: '1.5rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
        Mã phòng: <strong style={{ fontFamily: 'monospace', letterSpacing: '3px', color: 'var(--accent-primary)' }}>{roomId}</strong>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
          {situation.title}
        </h1>
        <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginTop: '1rem', maxWidth: '80%', margin: '1rem auto' }}>
          {situation.description}
        </p>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '4rem' }}>
        
        {/* Cột trái: Biểu đồ & Các lựa chọn */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="glass-panel" style={{ padding: '2rem', flex: 1 }}>
            <h3 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.8rem' }}>Phân bố lựa chọn</h3>
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#f8fafc" />
                  <YAxis stroke="#f8fafc" allowDecimals={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {situation.options.map((opt, index) => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.2rem' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <div><strong>{opt.id}.</strong> {opt.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cột phải: Các lý do tiêu biểu */}
        <div style={{ flex: 1 }}>
          <div className="glass-panel" style={{ padding: '2rem', height: '100%' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.8rem', color: 'var(--warning)' }}>
              💬 Góc nhìn của lớp
            </h3>
            
            {highlightedReasons.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70%', color: 'var(--text-secondary)', fontSize: '1.5rem', fontStyle: 'italic', textAlign: 'center' }}>
                Đang chờ giáo viên chọn lọc các lý do tiêu biểu...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {highlightedReasons.map((v, i) => (
                  <div 
                    key={v.id} 
                    className="animate-fade-in"
                    style={{ 
                      padding: '1.5rem', 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      borderRadius: 'var(--radius)',
                      borderLeft: `4px solid ${COLORS[situation.options.findIndex(o => o.id === v.optionId) % COLORS.length]}`,
                      fontSize: '1.3rem',
                      lineHeight: '1.6',
                      animationDelay: `${i * 0.1}s`
                    }}
                  >
                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                      Một bạn chọn phương án {v.optionId} cho biết:
                    </div>
                    "{v.reason}"
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProjectorView;
