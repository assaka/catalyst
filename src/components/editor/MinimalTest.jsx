import React from 'react';

export default function MinimalTest() {
  console.log('MinimalTest component is rendering');
  
  return (
    <div style={{ 
      padding: '40px', 
      backgroundColor: 'white', 
      border: '5px solid red',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      <h1 style={{ color: 'red', fontSize: '48px', marginBottom: '20px' }}>
        🚀 AI EDITOR IS WORKING! 🚀
      </h1>
      <p style={{ color: 'black', fontSize: '20px', marginBottom: '20px' }}>
        SUCCESS! The AI Editor component is rendering correctly.
      </p>
      <p style={{ color: 'blue', fontSize: '16px', marginBottom: '30px' }}>
        This proves the routing works and the component loads.
        The sidebar you saw was from the main admin layout wrapping this content.
      </p>
      <button 
        onClick={() => alert('AI Editor component is working perfectly!')}
        style={{
          padding: '15px 30px',
          backgroundColor: '#22c55e',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '18px',
          cursor: 'pointer'
        }}
      >
        🎉 Test Button - Click Me!
      </button>
    </div>
  );
}