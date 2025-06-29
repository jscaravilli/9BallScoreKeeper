import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Production cache invalidation system
const checkForUpdates = () => {
  // Version tracking for production cache busting
  const APP_VERSION = "1.0.2"; // Increment this to force cache clear - DEAD BALL LOCKING FIX
  const storedVersion = localStorage.getItem('app-version');
  const forceUpdate = localStorage.getItem('force-app-update');
  
  if (storedVersion !== APP_VERSION || forceUpdate === 'true') {
    console.log(`App version updated: ${storedVersion} → ${APP_VERSION}${forceUpdate ? ' (forced)' : ''}`);
    localStorage.setItem('app-version', APP_VERSION);
    localStorage.removeItem('force-app-update');
    
    // Clear any cached data except match data
    const keysToKeep = ['currentMatch', 'matches'];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear any browser-specific caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => caches.delete(cacheName));
      });
    }
    
    console.log('Cache cleared - dead ball locking fix applied');
  }
};

// Check for updates before rendering
checkForUpdates();

createRoot(document.getElementById("root")!).render(<App />);
