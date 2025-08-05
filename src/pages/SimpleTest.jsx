import React from 'react';

export default function SimpleTest() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Test Page</h1>
      <p>This is a simple test to verify React Router is working.</p>
      <p>Current URL: {window.location.pathname}</p>
      <p>If you can see this, React Router routing is functioning correctly.</p>
    </div>
  );
}