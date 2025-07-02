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
    const essentialCookies = ['poolscorer_current_match', 'poolscorer_match_counter'];
    
    cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      const cookieName = name.trim();
      
      if (!essentialCookies.includes(cookieName)) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        console.log(`Emergency cleared cookie: ${cookieName}`);
      }
    });
  }
};

// Emergency cleanup before anything else
emergencyCleanup();

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
