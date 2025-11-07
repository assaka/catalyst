/**
 * Simple Donut Chart Component
 * For device/browser/OS breakdown visualization
 */

import React from 'react';

const COLORS = [
  '#4F46E5', // Indigo
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1'  // Indigo-lighter
];

export default function DonutChart({ data, size = 200 }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400" style={{ height: size }}>
        No data
      </div>
    );
  }

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400" style={{ height: size }}>
        No data
      </div>
    );
  }

  const entries = Object.entries(data).map(([label, value], index) => ({
    label,
    value,
    percentage: (value / total) * 100,
    color: COLORS[index % COLORS.length]
  }));

  const radius = size / 2 - 10;
  const innerRadius = radius * 0.6;
  const centerX = size / 2;
  const centerY = size / 2;

  // Calculate arc paths
  let currentAngle = -90; // Start at top

  const arcs = entries.map(entry => {
    const angle = (entry.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    currentAngle = endAngle;

    // Convert to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate arc coordinates
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const x3 = centerX + innerRadius * Math.cos(endRad);
    const y3 = centerY + innerRadius * Math.sin(endRad);
    const x4 = centerX + innerRadius * Math.cos(startRad);
    const y4 = centerY + innerRadius * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
      Z
    `;

    return {
      ...entry,
      path,
      startAngle,
      endAngle
    };
  });

  return (
    <div className="flex items-center gap-8">
      {/* Chart */}
      <div>
        <svg width={size} height={size}>
          {arcs.map((arc, i) => (
            <g key={i}>
              <path
                d={arc.path}
                fill={arc.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <title>{`${arc.label}: ${arc.value} (${arc.percentage.toFixed(1)}%)`}</title>
              </path>
            </g>
          ))}

          {/* Center text */}
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            className="text-2xl font-bold fill-gray-900"
          >
            {total}
          </text>
          <text
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            Total
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <div className="flex-1">
              <div className="text-sm font-medium">{entry.label}</div>
              <div className="text-xs text-gray-500">
                {entry.value} ({entry.percentage.toFixed(1)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
