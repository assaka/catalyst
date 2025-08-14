import React from 'react';
import MinimalTest from '@/components/editor/MinimalTest';

export default function AIEditor() {
  console.log('AIEditor page is rendering');
  
  return (
    <div style={{ height: '100vh', backgroundColor: 'lightblue' }}>
      <MinimalTest />
    </div>
  );
}