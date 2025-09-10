import React, { useState } from 'react';
import TailwindStyleEditor from '@/components/editor/slot/TailwindStyleEditor';

function SimpleInlineEdit({ text, className = '', onChange, slotId, onClassChange, style = {}, mode = 'edit' }) {
  const [showEditor, setShowEditor] = useState(false);
  
  // Debug: Log what classes this element is receiving
  console.log('🎨 SimpleInlineEdit render:', { slotId, className, style });

  // Check if text contains HTML
  const hasHtml = text && (text.includes('<') || text.includes('&'));
  
  return (
    <>
      <div 
        {...(mode === 'edit' && !hasHtml ? {
          onClick: () => setShowEditor(true)
        } : {})}
        className={`${mode === 'edit' ? 'cursor-pointer hover:ring-1 hover:ring-gray-300' : ''} px-1 rounded inline-block ${className}`}
        title={mode === 'edit' ? (hasHtml ? "Use pencil icon to edit HTML content" : "Click to edit text and style") : ""}
        style={{
          ...(hasHtml || mode === 'preview' ? { cursor: 'default' } : {}),
          ...style,
          // Ensure inline styles override any class-based colors with !important equivalent
          ...(style.color && { color: style.color }),
          ...(style.backgroundColor && { backgroundColor: style.backgroundColor })
        }}
      >
        {hasHtml ? (
          <div dangerouslySetInnerHTML={{ __html: text }} />
        ) : (
          text || (mode === 'edit' ? <span className="text-gray-400">Click to edit...</span> : '')
        )}
      </div>
      
      {showEditor && !hasHtml && mode === 'edit' && (
        <TailwindStyleEditor
          text={text}
          className={className}
          onChange={(newText, newClass, stylesToClear) => {
            onChange(newText);
            if (onClassChange) {
              onClassChange(slotId, newClass, stylesToClear);
            } else {
            }
          }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}

export default SimpleInlineEdit;