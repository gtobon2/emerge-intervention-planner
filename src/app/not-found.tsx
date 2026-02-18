import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-foundation flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <p className="text-8xl font-bold text-text-muted/20 mb-2 select-none">
          404
        </p>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Page Not Found
        </h1>
        <p className="text-text-muted mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-movement to-movement-hover text-white shadow-md hover:shadow-lg hover:shadow-movement/25 hover:-translate-y-0.5 transition-all duration-200 min-h-[44px]"
        >
          <Home className="w-4 h-4" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
