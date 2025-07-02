// Clear all cached match data to fix tally mark issues
import { adaptiveStorageAPI } from './adaptiveStorage';

export function clearAllMatchData() {
  try {
    // Clear match history
    const storage = adaptiveStorageAPI;
    
    // Clear current match
    if (typeof storage.clearMatch === 'function') {
      storage.clearMatch();
    }
    
    // Clear match history
    if (typeof storage.clearMatchHistory === 'function') {
      storage.clearMatchHistory();
    }
    
    // Clear cookies manually
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Clear localStorage
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.includes('match') || key.includes('currentMatch') || key.includes('events')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('All match data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing match data:', error);
    return false;
  }
}