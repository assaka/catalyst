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
  onDragStart
}) => {
  // Only apply editor styles in edit mode
  if (mode !== 'edit') {
    return children;
  }

  // Minimal wrapper - let GridColumn handle all visual styling
  const editorClasses = [
    // Only essential classes for functionality
    ...(className ? [className] : [])
  ].filter(Boolean).join(' ');

  const editorStyles = {
    // Only merge styles from parent, no additional visual styling
    ...style
  };


  return (
    <div
      className={editorClasses}
      style={editorStyles}
      onClick={onClick}
      data-slot-id={dataSlotId}
      data-editable={dataEditable}
      draggable={false}
      onDragStart={onDragStart}
    >
      {children}
    </div>
  );
};

export default EditorInteractionWrapper;