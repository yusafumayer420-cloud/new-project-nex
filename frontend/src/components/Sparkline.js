import React, { useMemo } from 'react';

const Sparkline = ({ data, color = '#3B82F6', width = 100, height = 30, fill = true, strokeWidth = 1.5 }) => {
  const id = useMemo(() => `sparkline-grad-${Math.random().toString(36).substr(2, 9)}`, []);

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  const areaPath = fill
    ? `M${points[0].x},${height} ` +
      points.map(p => `L${p.x},${p.y}`).join(' ') +
      ` L${points[points.length - 1].x},${height} Z`
    : null;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && areaPath && (
        <path
          d={areaPath}
          fill={`url(#${id})`}
          style={{ transition: 'd 3s ease-in-out' }}
        />
      )}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={linePoints}
        style={{ transition: 'points 3s ease-in-out' }}
      />
    </svg>
  );
};

export default Sparkline;
