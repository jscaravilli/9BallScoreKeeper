import { Button } from "@/components/ui/button";
import { cookieStorageAPI } from "@/lib/cookieStorage";
import { localStorageAPI } from "@/lib/localStorage";

export default function ClearStorage() {
  const handleClearAll = () => {
    try {
      // Clear cookies
      cookieStorageAPI.clearHistory();
      
      // Clear localStorage
      localStorageAPI.clearHistory();
      
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      alert('All storage cleared! The page will reload.');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing storage:', error);
      alert('Error clearing storage. Check console for details.');
    }
  };

  return (
    <div className="p-8 space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">Clear Browser Storage</h1>
      <p className="text-gray-600">
        This will clear all match history, cookies, and localStorage data to fix the HTTP 431 error.
      </p>
      
      <Button onClick={handleClearAll} className="w-full bg-red-600 hover:bg-red-700">
        Clear All Storage & Reload
      </Button>
      
      <div className="text-sm text-gray-500">
        <p>This will clear:</p>
        <ul className="list-disc pl-4">
          <li>Match history (cookies)</li>
          <li>Local storage data</li>
          <li>Session storage</li>
          <li>All browser cookies for this site</li>
        </ul>
      </div>
    </div>
  );
}