// Utility to trigger 404 page display from any component
export const triggerNotFoundPage = (reason = 'Content not found') => {
  const event = new CustomEvent('show404Page', { 
    detail: { reason, timestamp: new Date().toISOString() }
  });
  window.dispatchEvent(event);
};

// Hook to easily trigger 404 from React components
export const useNotFound = () => {
  return {
    showNotFound: triggerNotFoundPage
  };
};