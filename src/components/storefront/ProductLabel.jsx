import React from 'react';

const getPositionClasses = (position) => {
  const baseClasses = "absolute z-10 px-2 py-1 text-xs font-bold rounded shadow-lg";
  
  const positions = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'top-center': 'top-2 left-1/2 transform -translate-x-1/2',
    'center-left': 'top-1/2 left-2 transform -translate-y-1/2',
    'center-right': 'top-1/2 right-2 transform -translate-y-1/2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-center': 'bottom-2 left-1/2 transform -translate-x-1/2'
  };

  return `${baseClasses} ${positions[position] || positions['top-right']}`;
};

export default function ProductLabel({ label, style = {} }) {
  if (!label || !label.text) return null;

  // Debug logging
  console.log('🏷️ ProductLabel rendering:', {
    name: label.name,
    text: label.text,
    position: label.position,
    color: label.color,
    text_color: label.text_color,
    background_color: label.background_color
  });

  const labelStyle = {
    backgroundColor: label.background_color || '#FF0000',
    color: label.color || label.text_color || '#FFFFFF', // Handle both field names
    ...style
  };

  console.log('🎨 Computed labelStyle:', labelStyle);
  console.log('📍 Position classes:', getPositionClasses(label.position));

  return (
    <div
      className={getPositionClasses(label.position)}
      style={labelStyle}
    >
      {label.text}
    </div>
  );
}