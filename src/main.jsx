import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Global error handler for unhandled filter errors
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('filter is not a function')) {
    console.error('🚨 FILTER ERROR CAUGHT:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      stack: event.error?.stack
    });
  }
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('filter is not a function')) {
    console.error('🚨 UNHANDLED FILTER REJECTION:', {
      reason: event.reason,
      promise: event.promise,
      stack: event.reason?.stack
    });
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
);