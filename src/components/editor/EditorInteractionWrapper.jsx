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

  // Editor-specific classes and styles
  const editorClasses = [
    'relative',
    'cursor-pointer',
    'transition-all',
    'duration-200',
    draggable ? 'cursor-move' : '',
    'group',
    // Hover styles using Tailwind
    'hover:outline',
    'hover:outline-1',
    'hover:outline-blue-400',
    'hover:outline-offset-2',
    // Selected styles
    isSelected ? 'outline outline-2 outline-blue-500 outline-offset-1' : ''
  ].filter(Boolean).join(' ');

  const editorStyles = {
    // Inline styles for editor-specific styling that can't be done with Tailwind
    border: isSelected ? '1px dashed rgba(59, 130, 246, 0.5)' : '1px dashed transparent',
    borderRadius: '4px',
    transition: 'border-color 0.2s ease-in-out',
    ...(isSelected && {
      borderColor: 'rgba(59, 130, 246, 0.5)'
    })
  };

  return (
    <div
      className={`${editorClasses} ${className}`}
      style={editorStyles}
    >
      {children}
    </div>
  );
};

export default EditorInteractionWrapper;