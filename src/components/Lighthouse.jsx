import React from 'react';
import { MAX_FUEL } from '../data/lighthouseRules';

/**
 * Ngọn hải đăng vẽ bằng SVG. Lượng dầu càng cao thì chùm sáng càng rộng
 * và ngọn lửa càng lớn; hết dầu thì cả tháp chìm trong đêm.
 */
const Lighthouse = ({ fuel = 100, stormMode = false, compact = false }) => {
  const level = Math.max(0, Math.min(1, fuel / MAX_FUEL));
  const lit = fuel > 0;

  // Màu lửa chuyển từ vàng ấm sang đỏ cam khi sắp cạn dầu
  const flame = level > 0.6 ? '#FDE047' : level > 0.3 ? '#FB923C' : '#EF4444';
  const beamOpacity = lit ? 0.12 + level * 0.4 : 0;
  const glow = lit ? 12 + level * 46 : 0;
  const seaY = 300;

  return (
    <svg viewBox="0 0 320 360" className="w-full h-auto" role="img" aria-label={`Ngọn hải đăng còn ${fuel}% dầu`}>
      <defs>
        <linearGradient id="lhSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stormMode ? '#1e1b4b' : '#0c1445'} />
          <stop offset="100%" stopColor={stormMode ? '#020617' : '#082f49'} />
        </linearGradient>
        <linearGradient id="lhSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e7490" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#082f49" />
        </linearGradient>
        <radialGradient id="lhGlow">
          <stop offset="0%" stopColor={flame} stopOpacity="0.95" />
          <stop offset="100%" stopColor={flame} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="320" height={seaY} fill="url(#lhSky)" />

      {/* Sao chỉ hiện khi trời quang */}
      {!stormMode && [[40, 40], [90, 70], [250, 45], [285, 95], [150, 30], [200, 80]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.6" fill="#fff" opacity={0.35 + (i % 3) * 0.2} />
      ))}

      {/* Mây bão */}
      {stormMode && (
        <g opacity="0.75">
          <ellipse cx="80" cy="52" rx="60" ry="22" fill="#0f172a" />
          <ellipse cx="150" cy="42" rx="70" ry="26" fill="#1e293b" />
          <ellipse cx="240" cy="58" rx="62" ry="22" fill="#0f172a" />
        </g>
      )}

      {/* Hai chùm sáng quét ra biển */}
      {lit && (
        <g>
          <polygon points={`160,96 8,${40 - level * 30} 8,${150 + level * 20}`} fill={flame} opacity={beamOpacity}>
            <animate attributeName="opacity" values={`${beamOpacity};${beamOpacity * 0.55};${beamOpacity}`} dur="3s" repeatCount="indefinite" />
          </polygon>
          <polygon points={`160,96 312,${40 - level * 30} 312,${150 + level * 20}`} fill={flame} opacity={beamOpacity}>
            <animate attributeName="opacity" values={`${beamOpacity * 0.55};${beamOpacity};${beamOpacity * 0.55}`} dur="3s" repeatCount="indefinite" />
          </polygon>
        </g>
      )}

      {/* Vầng sáng quanh đỉnh tháp */}
      {lit && <circle cx="160" cy="96" r={glow} fill="url(#lhGlow)" />}

      {/* Mỏm đá */}
      <path d="M96 300 L120 262 L200 262 L224 300 Z" fill="#1c1917" />

      {/* Thân tháp kẻ sọc */}
      <path d="M140 262 L146 132 L174 132 L180 262 Z" fill="#e7e5e4" />
      <path d="M143.2 192 L176.8 192 L177.8 214 L142.2 214 Z" fill="#dc2626" />
      <path d="M144.8 160 L175.2 160 L175.9 176 L144.1 176 Z" fill="#dc2626" />
      <path d="M141.6 236 L178.4 236 L179.2 258 L140.8 258 Z" fill="#dc2626" />

      {/* Buồng đèn */}
      <rect x="142" y="112" width="36" height="8" rx="2" fill="#57534e" />
      <rect x="146" y="82" width="28" height="30" rx="3" fill={lit ? '#1c1917' : '#0c0a09'} stroke="#57534e" strokeWidth="2" />

      {/* Ngọn lửa co giãn theo lượng dầu */}
      {lit && (
        <g>
          <ellipse cx="160" cy={100 - level * 4} rx={5 + level * 6} ry={8 + level * 9} fill={flame}>
            <animate attributeName="ry" values={`${8 + level * 9};${6 + level * 7};${8 + level * 9}`} dur="0.9s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="160" cy={102 - level * 3} rx={2 + level * 3} ry={4 + level * 5} fill="#fff" opacity="0.85" />
        </g>
      )}
      {!lit && <text x="160" y="104" textAnchor="middle" fontSize="18">💤</text>}

      {/* Chóp mái */}
      <path d="M144 82 L160 64 L176 82 Z" fill="#dc2626" />

      {/* Biển */}
      <rect x="0" y={seaY} width="320" height={360 - seaY} fill="url(#lhSea)" />
      <path d={`M0 ${seaY + 6} Q 40 ${seaY - 2} 80 ${seaY + 6} T 160 ${seaY + 6} T 240 ${seaY + 6} T 320 ${seaY + 6}`} fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.5">
        <animate attributeName="d"
          values={`M0 ${seaY + 6} Q 40 ${seaY - 2} 80 ${seaY + 6} T 160 ${seaY + 6} T 240 ${seaY + 6} T 320 ${seaY + 6};M0 ${seaY + 6} Q 40 ${seaY + 12} 80 ${seaY + 6} T 160 ${seaY + 6} T 240 ${seaY + 6} T 320 ${seaY + 6};M0 ${seaY + 6} Q 40 ${seaY - 2} 80 ${seaY + 6} T 160 ${seaY + 6} T 240 ${seaY + 6} T 320 ${seaY + 6}`}
          dur="4s" repeatCount="indefinite" />
      </path>

      {/* Con tàu ngoài khơi chỉ thấy đường khi còn đèn */}
      <g opacity={lit ? 0.9 : 0.25}>
        <path d="M246 316 L282 316 L276 328 L252 328 Z" fill="#78350f" />
        <rect x="262" y="298" width="2.5" height="18" fill="#a8a29e" />
        <path d="M264.5 300 L278 312 L264.5 312 Z" fill={lit ? '#fbbf24' : '#57534e'} />
      </g>

      {!compact && (
        <text x="160" y="348" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="15" fontWeight="700">
          {lit ? `Dầu còn ${fuel}%` : 'Đèn đã tắt — cần cả lớp thắp lại'}
        </text>
      )}
    </svg>
  );
};

export default Lighthouse;
