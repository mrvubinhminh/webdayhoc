import React from 'react';
import './Sunflowers.css';

const Sunflowers = () => {
  // Generate some random positions for sunflowers
  const flowers = Array.from({ length: 15 }).map((_, i) => {
    const size = Math.random() * 40 + 30; // 30-70px
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = Math.random() * 4 + 4;
    return { id: i, size, left, top, delay, duration };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {flowers.map((f) => (
        <div
          key={f.id}
          className="absolute sunflower-container"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        >
          {/* Simple Sunflower SVG */}
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Petals */}
            {[...Array(12)].map((_, i) => (
              <ellipse
                key={i}
                cx="50"
                cy="20"
                rx="8"
                ry="25"
                fill="#FFD700"
                transform={`rotate(${i * 30} 50 50)`}
              />
            ))}
            {/* Center */}
            <circle cx="50" cy="50" r="20" fill="#8B4513" />
            <circle cx="50" cy="50" r="15" fill="#5C3317" />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default Sunflowers;
