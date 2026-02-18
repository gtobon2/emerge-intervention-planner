'use client';

import { useEffect, useState } from 'react';

/**
 * Offline Status Indicator Component
 * Shows a banner when the user is offline
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);

      // Show "Back online" message briefly
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show banner if online and banner timeout has passed
  if (isOnline && !showBanner) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showBanner ? 'translate-y-0' : '-translate-y-full'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`px-4 py-3 text-center text-sm font-medium ${
          isOnline
            ? 'bg-green-500 text-white'
            : 'bg-yellow-500 text-gray-900'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-current"></span>
          {isOnline ? (
            <span>Back online - All features available</span>
          ) : (
            <span>You are offline - Some features may be limited</span>
          )}
        </div>
      </div>
    </div>
  );
}
