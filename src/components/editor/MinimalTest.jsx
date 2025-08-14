import React from 'react';

export default function MinimalTest() {
  console.log('MinimalTest component is rendering');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'white', 
      border: '2px solid red',
      height: '100vh'
    }}>
      <h1 style={{ color: 'black', fontSize: '24px' }}>
        🚀 AI Editor is Loading!
      </h1>
      <p style={{ color: 'black', marginTop: '10px' }}>
        If you can see this red border and text, the component is working.
      </p>
      <button 
        onClick={() => alert('Button clicked!')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#blue',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          marginTop: '20px'
        }}
      >
        Test Button
      </button>
    </div>
  );
}