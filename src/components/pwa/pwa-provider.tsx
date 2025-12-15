'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/pwa/register-sw';
import { InstallPrompt } from './install-prompt';
import { OfflineIndicator } from './offline-indicator';

/**
 * PWA Provider Component
 * Initializes PWA features and renders PWA UI components
 */
export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker();
  }, []);

  return (
    <>
      {children}
      <OfflineIndicator />
      <InstallPrompt />
    </>
  );
}
