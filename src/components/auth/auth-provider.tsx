'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface AuthProviderProps {
  children: ReactNode;
}

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password'];

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, isInitialized } = useAuth();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    // Wait for auth to initialize
    if (!isInitialized) {
      return;
    }

    // Redirect to login if not authenticated and on protected route
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
    }

    // Redirect to home if authenticated and on public route
    if (isAuthenticated && isPublicRoute) {
      router.push('/');
    }
  }, [isAuthenticated, isPublicRoute, isInitialized, router, pathname]);

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-foundation flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-movement mb-4"></div>
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-foundation flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-movement mb-4"></div>
          <p className="text-text-muted">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
