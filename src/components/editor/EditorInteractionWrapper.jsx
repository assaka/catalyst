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

  // Framer-style editor classes and styles
  const editorClasses = [
    'relative',
    'cursor-pointer',
    'transition-all',
    'duration-300',
    'ease-out',
    draggable ? 'cursor-move' : '',
    'group',
    'rounded-lg',
    // Framer-style hover effects
    'hover:scale-[1.02]',
    'hover:-translate-y-0.5',
    'hover:shadow-lg',
    'hover:shadow-blue-200/40',
    'hover:bg-blue-50/20',
    'hover:backdrop-blur-sm',
    // Selected styles with enhanced visual feedback
    isSelected ? 'scale-[1.02] -translate-y-0.5 shadow-xl shadow-blue-300/60 bg-blue-50/30' : ''
  ].filter(Boolean).join(' ');

  const editorStyles = {
    // Enhanced inline styles with Framer-style effects
    border: isSelected 
      ? '2px solid rgba(59, 130, 246, 0.6)' 
      : '2px solid transparent',
    borderRadius: '12px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: isSelected ? 'blur(8px)' : 'none',
    ...(isSelected && {
      borderColor: 'rgba(59, 130, 246, 0.6)',
      boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(59, 130, 246, 0.2)',
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%)'
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