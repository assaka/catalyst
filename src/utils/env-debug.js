/**
 * Debug utility to check environment and API configuration
 */

export function debugEnvironment() {
  const env = {
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    dev: import.meta.env.DEV,
    baseUrl: import.meta.env.BASE_URL,
    apiUrl: import.meta.env.VITE_API_URL || '/api',
  };

  console.log('🔍 Environment Debug Info:', env);
  
  // Check if we're in production
  if (import.meta.env.PROD) {
    console.log('📦 Running in PRODUCTION mode');
    console.log('🌐 API calls will go to:', window.location.origin + '/api');
  } else {
    console.log('🚧 Running in DEVELOPMENT mode');
    console.log('🌐 API calls will be proxied to:', 'https://catalyst-backend-fzhu.onrender.com');
  }

  // Check localStorage for auth token
  const token = localStorage.getItem('token');
  console.log('🔑 Auth token present:', !!token);
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('👤 Token user:', payload.email);
      console.log('⏰ Token expires:', new Date(payload.exp * 1000).toLocaleString());
    } catch (e) {
      console.error('❌ Invalid token format');
    }
  }

  return env;
}