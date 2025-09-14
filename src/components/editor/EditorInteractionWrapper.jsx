import React from 'react';

const EditorInteractionWrapper = ({
  children,
  mode,
  draggable = false,
  isSelected = false,
  className = ''
}) => {
  // Only apply editor styles in edit mode
  if (mode !== 'edit') {
    return children;
  }

  // Clean, stable editor classes and styles
  const editorClasses = [
    'relative',
    'cursor-pointer',
    'transition-all',
    'duration-200',
    draggable ? 'cursor-move' : '',
    'group',
    'rounded-md',
    // Simple hover effects
    'hover:bg-blue-50/30',
    // Selected styles with clear visual feedback
    isSelected ? 'bg-blue-50/40' : ''
  ].filter(Boolean).join(' ');

  const editorStyles = {
    // Clean inline styles without problematic effects
    border: isSelected 
      ? '2px solid rgba(59, 130, 246, 0.7)' 
      : '2px solid transparent',
    borderRadius: '6px',
    transition: 'border-color 0.2s ease-in-out, background-color 0.2s ease-in-out',
    ...(isSelected && {
      borderColor: 'rgba(59, 130, 246, 0.7)',
      boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.2)'
    })
  };

  const handleMouseLeave = (e) => {
    // Remove all borders on mouseout
    if (e.currentTarget) {
      e.currentTarget.style.borderColor = '';
      e.currentTarget.style.border = 'none';
      e.currentTarget.style.outline = 'none';
    }
  };

  return (
    <div
      className={`${editorClasses} ${className}`}
      style={editorStyles}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

export default EditorInteractionWrapper;