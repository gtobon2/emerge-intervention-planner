'use client';

import { useEffect, useState } from 'react';
import { initializeDatabase } from '@/lib/local-db/init';

/**
 * Database Provider Component
 * Initializes the local IndexedDB database on app startup
 * Seeds with demo data if the database is empty
 */
export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        console.log('[DatabaseProvider] Starting database initialization...');
        const result = await initializeDatabase();

        if (!result.success) {
          console.error('[DatabaseProvider] Database initialization failed:', result.error);
          setError(result.error || 'Failed to initialize database');
        } else {
          console.log('[DatabaseProvider] Database initialized successfully');
          if (result.seededWithDemo) {
            console.log('[DatabaseProvider] Database seeded with demo data');
          }
        }

        setIsInitialized(true);
      } catch (err) {
        console.error('[DatabaseProvider] Unexpected error during initialization:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsInitialized(true); // Still allow app to load even if init fails
      }
    }

    init();
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-foundation">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-text-secondary font-brand">Initializing database...</p>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-foundation">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-error-600 text-5xl">⚠️</div>
          <h1 className="text-2xl font-brand font-bold text-text-primary">
            Database Error
          </h1>
          <p className="text-text-secondary">
            Failed to initialize the local database. Please refresh the page to try again.
          </p>
          <p className="text-sm text-text-tertiary font-mono bg-surface-secondary p-3 rounded">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Database initialized successfully, render children
  return <>{children}</>;
}
