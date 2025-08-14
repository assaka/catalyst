import React from 'react';
import MinimalTest from '@/components/editor/MinimalTest';

export default function AIEditor() {
  console.log('AIEditor page is rendering');
  
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      backgroundColor: 'lightblue'
    }}>
      <MinimalTest />
    </div>
  );
}