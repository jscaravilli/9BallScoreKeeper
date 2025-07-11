import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Production cache invalidation system
const checkForUpdates = () => {
  // Use deployment timestamp for reliable production cache busting
  const deploymentTime = (window as any).DEPLOYMENT_TIME || Date.now();
  const storedDeploymentTime = localStorage.getItem('deployment-time');
  const forceUpdate = localStorage.getItem('force-app-update');
  
  if (storedDeploymentTime !== deploymentTime.toString() || forceUpdate === 'true') {
    console.log(`App updated: deployment ${storedDeploymentTime} → ${deploymentTime}${forceUpdate ? ' (forced)' : ''}`);
    localStorage.setItem('deployment-time', deploymentTime.toString());
    localStorage.removeItem('force-app-update');
    
    // Clear any cached data except match data
    const keysToKeep = ['currentMatch', 'matches', 'deployment-time'];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear browser caches except airplane mode cache
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          // NEVER delete airplane mode cache - preserves offline functionality
          if (!cacheName.includes('airplane') && !cacheName.includes('offline')) {
            caches.delete(cacheName);
          }
        });
      });
    }
    
    console.log('Production cache cleared - latest dead ball fixes loaded');
  }
};

// Emergency cookie cleanup to prevent 431 errors
const emergencyCleanup = () => {
  const cookies = document.cookie.split(';');
  let totalSize = 0;
  
  cookies.forEach(cookie => {
    totalSize += cookie.length;
  });
  
  console.log(`Total cookie size: ${totalSize} characters`);
  
  if (totalSize > 10000) { // If cookies are too large
    console.log('Cookies too large, performing emergency cleanup');
    
    // Clear all cookies except essential ones
    const essentialCookies = [
      'poolscorer_current_match', 
      'poolscorer_match_counter',
      'match_history_index'  // Preserve match history index
    ];
    
    cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      const cookieName = name.trim();
      
      // Keep essential cookies and match history cookies
      const isEssential = essentialCookies.includes(cookieName);
      const isMatchHistory = cookieName.startsWith('match_history_');
      const isMatchHistoryFlag = cookieName.endsWith('_flag');
      
      if (!isEssential && !isMatchHistory && !isMatchHistoryFlag) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        console.log(`Emergency cleared cookie: ${cookieName}`);
      } else if (isMatchHistory || isEssential || isMatchHistoryFlag) {
        console.log(`Preserved essential cookie: ${cookieName}`);
      }
    });
  }
};

// Emergency cleanup before anything else
emergencyCleanup();

// Force match history recovery check
console.log('=== MATCH HISTORY RECOVERY CHECK ===');
const checkHistory = () => {
  const indexCookie = document.cookie.split(';').find(c => c.trim().startsWith('match_history_index='));
  const localHistory = localStorage.getItem('poolscorer_match_history');
  
  console.log('Index cookie exists:', !!indexCookie);
  console.log('localStorage history exists:', !!localHistory);
  
  if (localHistory) {
    try {
      const parsed = JSON.parse(localHistory);
      console.log(`localStorage has ${parsed.length} matches`);
      
      // If no index cookie but localStorage has data, trigger recovery
      if (!indexCookie && parsed.length > 0) {
        console.log('TRIGGERING EMERGENCY RECOVERY...');
        // Force re-import
        import('./lib/cookieStorage').then(module => {
          module.cookieStorageAPI.migrateFromLocalStorage();
          console.log('Recovery migration triggered');
        });
      }
    } catch (e) {
      console.error('Error parsing localStorage history:', e);
    }
  }
};

// Check immediately and after a short delay
checkHistory();
setTimeout(checkHistory, 1000);

// Check for updates before rendering
checkForUpdates();

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });

  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_LARGE_COOKIES') {
      console.log('Received request to clear large cookies due to 431 error');
      
      // Clear all cookies except essential ones
      const essentialCookies = ['poolscorer_current_match', 'poolscorer_match_counter'];
      const cookies = document.cookie.split(';');
      
      cookies.forEach(cookie => {
        const [name] = cookie.split('=');
        const cookieName = name.trim();
        
        if (!essentialCookies.includes(cookieName)) {
          // Delete non-essential cookies
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          console.log(`Cleared cookie: ${cookieName}`);
        }
      });
      
      // Also clear match history from localStorage if it exists
      try {
        localStorage.removeItem('poolscorer_match_history');
        localStorage.removeItem('poolscorer_current_match_events');
        console.log('Cleared large localStorage items');
      } catch (error) {
        console.warn('Error clearing localStorage:', error);
      }
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
