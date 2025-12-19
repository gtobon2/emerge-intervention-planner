'use client';

/**
 * Offline Page
 * Shown when the user is offline and tries to access an uncached page
 */

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-foundation flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            You&apos;re Offline
          </h1>
          <p className="text-text-secondary mb-6">
            It looks like you&apos;ve lost your internet connection. Some features may be limited.
          </p>
        </div>

        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            Available Offline:
          </h2>
          <ul className="text-left text-text-secondary space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✓</span>
              <span>View cached intervention plans</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✓</span>
              <span>Access previously loaded student data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">✓</span>
              <span>Review saved reports and charts</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          Try Again
        </button>

        <p className="mt-4 text-sm text-text-secondary">
          When you reconnect, all your changes will be synced automatically.
        </p>
      </div>
    </div>
  );
}
