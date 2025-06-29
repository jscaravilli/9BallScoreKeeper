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
    
    // Clear browser caches aggressively for production
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => caches.delete(cacheName));
      });
    }
    
    console.log('Production cache cleared - latest dead ball fixes loaded');
  }
};

// Check for updates before rendering
checkForUpdates();

createRoot(document.getElementById("root")!).render(<App />);
