'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface AuthProviderProps {
  children: ReactNode;
}

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

// Routes that require admin role
const ADMIN_ROUTES = ['/admin'];

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, isInitialized, isAdmin } = useAuth();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  useEffect(() => {
    // Wait for auth to initialize
    if (!isInitialized) {
      return;
    }

    // Redirect to login if not authenticated and on protected route
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
      return;
    }

    // Redirect to home if authenticated and on public route
    if (isAuthenticated && isPublicRoute) {
      router.push('/');
      return;
    }

    // Redirect non-admin users away from admin routes
    if (isAuthenticated && isAdminRoute && !isAdmin) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, isPublicRoute, isAdminRoute, isAdmin, isInitialized, router, pathname]);

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

  // Show loading state while redirecting (unauthenticated on protected route)
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

  // Show loading state while redirecting (non-admin on admin route)
  if (isAuthenticated && isAdminRoute && !isAdmin) {
    return (
      <div className="min-h-screen bg-foundation flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-movement mb-4"></div>
          <p className="text-text-muted">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
