// Deployment version timer to track when production updates
let lastCommitHash = null;
let checkInterval = null;

export function startDeploymentTimer() {
  // Get current commit hash from build time or git
  const getCurrentCommit = async () => {
    try {
      // In production, this would come from build-time injection
      // For now, we'll use a timestamp as a proxy
      const response = await fetch('/__deployment-info', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.headers.get('x-commit-hash') || Date.now().toString();
    } catch {
      return Date.now().toString();
    }
  };

  const checkForUpdates = async () => {
    try {
      const currentCommit = await getCurrentCommit();

      if (lastCommitHash === null) {
        lastCommitHash = currentCommit;
        console.log('🚀 Deployment Timer Started', {
          initialCommit: currentCommit.substring(0, 8),
          timestamp: new Date().toLocaleTimeString()
        });
        return;
      }

      if (currentCommit !== lastCommitHash) {
        console.log('🔄 NEW DEPLOYMENT DETECTED!', {
          oldCommit: lastCommitHash.substring(0, 8),
          newCommit: currentCommit.substring(0, 8),
          timestamp: new Date().toLocaleTimeString(),
          message: 'Production version has been updated - refresh page to see changes'
        });

        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Deployment Update', {
            body: 'New version deployed! Refresh to see changes.',
            icon: '/favicon.ico'
          });
        }

        lastCommitHash = currentCommit;
      }
    } catch (error) {
      console.log('⚠️ Deployment check failed:', error.message);
    }
  };

  // Check every 30 seconds
  checkInterval = setInterval(checkForUpdates, 30000);

  // Initial check
  checkForUpdates();

  return () => stopDeploymentTimer();
}

export function stopDeploymentTimer() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log('🛑 Deployment Timer Stopped');
  }
}

// Auto-start in development mode
if (import.meta.env.DEV) {
  console.log('📡 Starting deployment timer for development...');
  startDeploymentTimer();
}