import React from 'react';

const EditorInteractionWrapper = ({
  children,
  mode,
  draggable = false,
  isSelected = false,
  className = '',
  style = {},
  onClick,
  'data-slot-id': dataSlotId,
  'data-editable': dataEditable,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop
}) => {
  // Only apply editor styles in edit mode
  if (mode !== 'edit') {
    return children;
  }

  // Minimal wrapper - let GridColumn handle all visual styling
  const editorClasses = [
    // Only essential classes for functionality
    'relative',
    ...(className ? [className] : []),
    ...(isSelected ? ['ring-2 ring-blue-500'] : [])
  ].filter(Boolean).join(' ');

  const editorStyles = {
    // Only merge styles from parent, no additional visual styling
    ...style,
    cursor: draggable ? 'move' : 'pointer'
  };


  return (
    <div
      className={editorClasses}
      style={editorStyles}
      onClick={onClick}
      data-slot-id={dataSlotId}
      data-editable={dataEditable}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
};

export default EditorInteractionWrapper;