import { useEffect, useRef, useState } from 'react';

/**
 * Theo dõi việc học sinh rời khỏi màn hình làm bài.
 *
 * Bắt được chắc chắn:
 *  - Chuyển sang tab hoặc ứng dụng khác, thu nhỏ trình duyệt, khoá màn hình
 *    (dùng Page Visibility API — tín hiệu đáng tin trên cả điện thoại và máy tính)
 *  - Bấm ra cửa sổ khác trên máy tính (window blur — tín hiệu yếu hơn nên đếm riêng)
 *
 * Bắt được một phần:
 *  - Phím chụp màn hình trên máy tính (PrintScreen, Cmd+Shift+3/4/5)
 *
 * KHÔNG bắt được: chụp màn hình trên điện thoại. Trình duyệt không cho phép
 * trang web biết điều đó, không có cách nào vòng qua.
 */
export const useFocusGuard = ({ enabled = true, onEvent } = {}) => {
  const [awayCount, setAwayCount] = useState(0);
  const [awayMs, setAwayMs] = useState(0);
  const [blurCount, setBlurCount] = useState(0);
  const [shotCount, setShotCount] = useState(0);
  const [justReturned, setJustReturned] = useState(null); // { seconds } để hiện cảnh báo

  const leftAt = useRef(null);
  const cb = useRef(onEvent);
  useEffect(() => { cb.current = onEvent; }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (document.hidden) {
        leftAt.current = Date.now();
        cb.current?.({ type: 'leave', at: Date.now() });
      } else if (leftAt.current) {
        const ms = Date.now() - leftAt.current;
        leftAt.current = null;
        setAwayCount(c => c + 1);
        setAwayMs(t => t + ms);
        setJustReturned({ seconds: Math.max(1, Math.round(ms / 1000)) });
        cb.current?.({ type: 'return', ms, at: Date.now() });
      }
    };

    // Bấm ra cửa sổ khác: đếm riêng vì có thể chỉ là chạm nhầm thanh địa chỉ
    const onBlur = () => {
      if (document.hidden) return; // đã tính ở visibilitychange rồi
      setBlurCount(c => c + 1);
      cb.current?.({ type: 'blur', at: Date.now() });
    };

    const onKey = (e) => {
      const isPrintScreen = e.key === 'PrintScreen';
      const isMacShot = e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key);
      const isWinShot = e.key === 'S' && e.shiftKey && e.metaKey;
      if (isPrintScreen || isMacShot || isWinShot) {
        setShotCount(c => c + 1);
        cb.current?.({ type: 'screenshot', at: Date.now() });
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('keyup', onKey);
    window.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('keydown', onKey);
    };
  }, [enabled]);

  return {
    awayCount, awayMs, blurCount, shotCount,
    justReturned,
    dismissWarning: () => setJustReturned(null)
  };
};

// Mức độ nghi ngờ để tô màu trong bảng của giáo viên
export const suspicionOf = ({ awayCount = 0, shotCount = 0 }) => {
  if (shotCount > 0 || awayCount >= 5) return { level: 'high', label: 'Cần xem lại', color: 'text-red-400' };
  if (awayCount >= 2) return { level: 'mid', label: 'Có rời màn hình', color: 'text-amber-400' };
  if (awayCount === 1) return { level: 'low', label: 'Rời 1 lần', color: 'text-yellow-300' };
  return { level: 'none', label: 'Nghiêm túc', color: 'text-emerald-400' };
};
