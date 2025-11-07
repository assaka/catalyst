/**
 * Simple Line Chart Component
 * Google Analytics-style time series visualization
 */

import React from 'react';

export default function SimpleLineChart({ data, height = 200, color = '#4F46E5' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400" style={{ height }}>
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 800;
  const chartHeight = height;
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Calculate points for line
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * plotWidth;
    const y = padding.top + plotHeight - ((d.value - minValue) / range) * plotHeight;
    return { x, y, ...d };
  });

  // Create path
  const linePath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  // Create area path (filled)
  const areaPath = `
    M ${points[0].x} ${padding.top + plotHeight}
    L ${points[0].x} ${points[0].y}
    ${points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}
    L ${points[points.length - 1].x} ${padding.top + plotHeight}
    Z
  `;

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(fraction => {
    const value = minValue + (range * fraction);
    const y = padding.top + plotHeight - (fraction * plotHeight);
    return { value: Math.round(value), y };
  });

  return (
    <div className="w-full overflow-x-auto">
      <svg width={chartWidth} height={chartHeight} className="w-full">
        {/* Grid lines */}
        {yLabels.map(({ y }, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={y}
            x2={chartWidth - padding.right}
            y2={y}
            stroke="#E5E7EB"
            strokeWidth="1"
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map(({ value, y }, i) => (
          <text
            key={i}
            x={padding.left - 10}
            y={y + 4}
            textAnchor="end"
            className="text-xs fill-gray-500"
          >
            {value.toLocaleString()}
          </text>
        ))}

        {/* Area fill */}
        <path
          d={areaPath}
          fill={color}
          fillOpacity="0.1"
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill={color}
              stroke="white"
              strokeWidth="2"
            />
            <title>{`${p.label}: ${p.value}`}</title>
          </g>
        ))}

        {/* X-axis labels (show every nth label to avoid crowding) */}
        {points.filter((_, i) => i % Math.ceil(points.length / 8) === 0 || i === points.length - 1).map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={chartHeight - padding.bottom + 20}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
