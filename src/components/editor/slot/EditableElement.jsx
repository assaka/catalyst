import React from 'react';
import { cn } from '@/lib/utils';

/**
 * EditableElement - Wrapper component that marks elements as editable for the EditorSidebar
 * 
 * Usage:
 * <EditableElement slotId="header.title">
 *   <h1>My Title</h1>
 * </EditableElement>
 */
const EditableElement = ({ 
  children, 
  slotId,
  className,
  editable = true,
  ...props 
}) => {
  if (!editable) {
    return children;
  }

  // Clone the child element and add editable attributes
  return React.cloneElement(React.Children.only(children), {
    'data-editable': 'true',
    'data-slot-id': slotId,
    className: cn(
      children.props.className,
      'cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400 hover:outline-offset-2 transition-outline',
      className
    ),
    ...props
  });
};

export default EditableElement;