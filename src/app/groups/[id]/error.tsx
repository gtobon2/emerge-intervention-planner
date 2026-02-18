'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function GroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Group error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-md bg-surface border border-text-muted/10 rounded-xl shadow-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Something went wrong
        </h1>
        <p className="text-text-muted mb-8">
          {error.message || 'An error occurred while loading this group. Please try again.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-movement to-movement-hover text-white shadow-md hover:shadow-lg hover:shadow-movement/25 hover:-translate-y-0.5 transition-all duration-200 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/groups"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-surface text-text-primary border border-text-muted/10 hover:border-text-muted/20 hover:bg-foundation transition-all duration-200 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Groups
          </Link>
        </div>
      </div>
    </div>
  );
}
