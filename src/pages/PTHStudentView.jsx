import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { ref, onValue, get, set } from 'firebase/database';
import { situations } from '../data/pth_situations';

const SESSION_KEY = 'pth_student_session';
const saveSession = (pin, name) => { try { localStorage.setItem(SESSION_KEY, JSON.stringify({ pin, name })); } catch { /* bị chặn */ } };
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch { /* không sao */ } };

function StudentView() {
  const [searchParams] = useSearchParams();
  const urlPin = searchParams.get('pin') || '';

  const [pinInput, setPinInput] = useState(urlPin);
  const [nameInput, setNameInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const [roomId, setRoomId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [activeSituationId, setActiveSituationId] = useState(1);
  const [selectedOption, setSelectedOption] = useState('');
  const [reason, setReason] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Vào lại phòng cũ sau khi tải lại trang hoặc rớt mạng
  useEffect(() => {
    const s = readSession();
    if (!s?.pin || !s?.name) return;
    if (urlPin && urlPin !== s.pin) { clearSession(); return; }
    get(ref(db, `scenarioRooms/${s.pin}`)).then((snap) => {
      if (!snap.exists()) { clearSession(); return; }
      setRoomId(s.pin);
      setStudentName(s.name);
    }).catch(() => {});
  }, [urlPin]);

  // Theo dõi tình huống giáo viên đang chiếu
  useEffect(() => {
    if (!roomId) return;
    const unsub = onValue(ref(db, `scenarioRooms/${roomId}`), (snap) => {
      const data = snap.val();
      if (!data) { clearSession(); setRoomId(''); setJoinError('Phòng đã đóng.'); return; }
      if (data.activeSituationId !== activeSituationId) {
        setActiveSituationId(data.activeSituationId);
        setSelectedOption('');
        setReason('');
        setHasSubmitted(false);
      }
    });
    return () => unsub();
  }, [roomId, activeSituationId]);

  // Nếu em đã gửi phiếu cho tình huống này rồi thì hiện lại trạng thái đã gửi
  useEffect(() => {
    if (!roomId || !studentName) return;
    const voteId = `${studentName.replace(/[^\p{L}\p{N}]+/gu, '_')}_${activeSituationId}`;
    get(ref(db, `scenarioRooms/${roomId}/votes/${voteId}`))
      .then(snap => { if (snap.exists()) setHasSubmitted(true); })
      .catch(() => {});
  }, [roomId, studentName, activeSituationId]);

  const handleJoin = async (e) => {
    e.preventDefault();
    const pin = pinInput.trim();
    const name = nameInput.trim();
    if (!/^\d{6}$/.test(pin)) { setJoinError('Mã phòng gồm 6 chữ số, em kiểm tra lại nhé.'); return; }
    if (!name) { setJoinError('Em nhập họ tên trước nhé.'); return; }

    setIsJoining(true);
    setJoinError('');
    try {
      const snap = await get(ref(db, `scenarioRooms/${pin}`));
      if (!snap.exists()) { setJoinError('Không tìm thấy phòng có mã này.'); return; }
      saveSession(pin, name);
      setRoomId(pin);
      setStudentName(name);
      setActiveSituationId(snap.val().activeSituationId || 1);
    } catch {
      setJoinError('Chưa kết nối được, em kiểm tra lại mạng rồi thử lần nữa nhé.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOption) { alert('Em hãy chọn một phương án trước nhé!'); return; }
    if (!reason.trim()) { alert('Em hãy viết ngắn gọn lý do vì sao chọn phương án đó.'); return; }

    setIsSending(true);
    try {
      // Khoá theo tên + số tình huống nên mỗi em chỉ có một phiếu cho mỗi tình huống
      const voteId = `${studentName.replace(/[^\p{L}\p{N}]+/gu, '_')}_${activeSituationId}`;
      await set(ref(db, `scenarioRooms/${roomId}/votes/${voteId}`), {
        id: voteId,
        studentName,
        situationId: activeSituationId,
        optionId: selectedOption,
        reason: reason.trim(),
        timestamp: Date.now()
      });
      setHasSubmitted(true);
    } catch (error) {
      console.error("Error submitting vote:", error);
      alert("Chưa gửi được, em kiểm tra lại mạng rồi thử lần nữa nhé!");
    } finally {
      setIsSending(false);
    }
  };

  if (!roomId) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h2>🎭 Vào Phòng Tình Huống</h2>
          <form onSubmit={handleJoin} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              className="input-field"
              placeholder="Mã phòng (6 chữ số)"
              value={pinInput}
              onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
              style={{ textAlign: 'center', fontSize: '1.6rem', letterSpacing: '8px', fontFamily: 'monospace' }}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Nhập Họ Tên..."
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
            />
            {joinError && <p style={{ color: 'var(--danger, #ef4444)', fontSize: '0.95rem' }}>{joinError}</p>}
            <button type="submit" className="btn-primary" disabled={isJoining}>
              {isJoining ? 'Đang vào…' : 'Tham gia ngay'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const situation = situations.find(s => s.id === activeSituationId);

  if (!situation) return <div className="container">Đang tải tình huống...</div>;

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px', padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>Xin chào, <strong className="text-gradient">{studentName}</strong></div>
        <div style={{ color: 'var(--success)' }}>🟢 Phòng {roomId}</div>
      </header>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
          Tình huống #{situation.id}: {situation.title}
        </h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>{situation.description}</p>

        {hasSubmitted ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h3>Đã gửi câu trả lời!</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Hãy nhìn lên màn hình máy chiếu để xem kết quả chung của cả lớp nhé.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {situation.options.map(opt => (
                <label
                  key={opt.id}
                  style={{
                    display: 'block',
                    padding: '1rem',
                    borderRadius: 'var(--radius)',
                    border: `2px solid ${selectedOption === opt.id ? 'var(--accent-primary)' : 'var(--border)'}`,
                    background: selectedOption === opt.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(15, 23, 42, 0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="radio"
                    name="option"
                    value={opt.id}
                    checked={selectedOption === opt.id}
                    onChange={() => setSelectedOption(opt.id)}
                    style={{ marginRight: '10px' }}
                  />
                  <strong>{opt.id}.</strong> {opt.text}
                </label>
              ))}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Vì sao em chọn phương án này?</label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="Gõ ngắn gọn lý do của em vào đây (ẩn danh trên máy chiếu)..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
              ></textarea>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '1.1rem' }} disabled={!selectedOption || !reason.trim() || isSending}>
              {isSending ? 'Đang gửi…' : 'Gửi lựa chọn'}
            </button>
            {!isSending && (!selectedOption || !reason.trim()) && (
              <p style={{ textAlign: 'center', marginTop: '0.75rem', opacity: 0.7, fontSize: '0.9rem' }}>
                {!selectedOption ? 'Chọn một phương án để gửi được' : 'Viết thêm lý do rồi mới gửi được'}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default StudentView;
