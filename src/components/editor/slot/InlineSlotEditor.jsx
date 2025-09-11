import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * InlineSlotEditor - TEMPORARILY DISABLED
 * Just renders static content without editing functionality
 */
export default function InlineSlotEditor({
  slotId,
  text,
  className = '',
  style = {},
  onChange,
  onClassChange,
  onEditSlot,
  mode = 'view',
  isWrapperSlot = false,
  elementType = 'div'
}) {
  // TEMPORARILY DISABLED - Just render static content
  const renderStaticContent = () => {
    if (elementType === 'button') {
      return (
        <Button 
          className={className}
          style={style}
        >
          {text || "Button"}
        </Button>
      );
    }
    
    if (elementType === 'icon') {
      return <ShoppingCart className={className} style={style} />;
    }
    
    // Default text rendering
    const Tag = slotId?.includes('title') ? 'h1' : 
                slotId?.includes('heading') ? 'h2' : 'span';
    
    return (
      <Tag 
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: text || "Text" }}
      />
    );
  };
  
  return renderStaticContent();
}