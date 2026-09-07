import React from 'react';
import { GROUPS } from '../data/hollandData';

/**
 * Biểu đồ radar 6 cạnh cho sáu nhóm sở thích Holland.
 * Vẽ thẳng bằng SVG nên không cần thư viện biểu đồ.
 */
const RadarChart = ({ scores = {}, compare = null, size = 300, showLabels = true, className = '' }) => {
  const cx = size / 2, cy = size / 2;
  const r = size * (showLabels ? 0.32 : 0.4);
  const n = GROUPS.length;

  // Đỉnh đầu tiên hướng lên trên
  const pointAt = (i, ratio) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * r * ratio, cy + Math.sin(a) * r * ratio];
  };

  const polygon = (obj) => GROUPS
    .map((g, i) => pointAt(i, Math.max(0, Math.min(100, obj[g.code] || 0)) / 100).join(','))
    .join(' ');

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={`w-full h-auto ${className}`} role="img" aria-label="Biểu đồ sáu nhóm sở thích nghề nghiệp">
      {/* Lưới */}
      {rings.map(t => (
        <polygon key={t}
          points={GROUPS.map((_, i) => pointAt(i, t).join(',')).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="1" />
      ))}
      {GROUPS.map((_, i) => {
        const [x, y] = pointAt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.13)" strokeWidth="1" />;
      })}

      {/* Đường so sánh, dùng để chồng phổ của cả lớp lên */}
      {compare && (
        <polygon points={polygon(compare)} fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeDasharray="6 4" />
      )}

      {/* Vùng điểm của học sinh */}
      <polygon points={polygon(scores)} fill="rgba(56,189,248,0.28)" stroke="#38BDF8" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Chấm đỉnh mang màu của từng nhóm */}
      {GROUPS.map((g, i) => {
        const [x, y] = pointAt(i, Math.max(0, Math.min(100, scores[g.code] || 0)) / 100);
        return <circle key={g.code} cx={x} cy={y} r="5" fill={g.color} stroke="#0b1220" strokeWidth="1.5" />;
      })}

      {/* Nhãn nhóm quanh biểu đồ */}
      {showLabels && GROUPS.map((g, i) => {
        const [x, y] = pointAt(i, 1.3);
        return (
          <g key={g.code}>
            <text x={x} y={y - 4} textAnchor="middle" fontSize={size * 0.055} fill={g.color} fontWeight="800">
              {g.emoji} {g.code}
            </text>
            <text x={x} y={y + size * 0.05} textAnchor="middle" fontSize={size * 0.042} fill="rgba(255,255,255,0.75)" fontWeight="700">
              {g.name}
            </text>
            <text x={x} y={y + size * 0.1} textAnchor="middle" fontSize={size * 0.045} fill={g.color} fontWeight="900">
              {scores[g.code] || 0}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default RadarChart;
