'use client';

import { useEffect } from 'react';
import { useAuthStore, DEMO_USERS, type UserRole, type DemoUser } from '@/stores/auth';

/**
 * Hook to access authentication state and actions
 * Automatically initializes auth on first use
 */
export function useAuth() {
  const {
    user,
    session,
    userRole,
    currentDemoUser,
    isLoading,
    error,
    isInitialized,
    initialize,
    signIn,
    signInAsDemoUser,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    clearError,
    isAdmin,
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return {
    user,
    session,
    userRole,
    currentDemoUser,
    isLoading,
    error,
    isAuthenticated: !!user,
    isInitialized,
    isAdmin: isAdmin(),
    demoUsers: DEMO_USERS,
    signIn,
    signInAsDemoUser,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    clearError,
  };
}

export type { UserRole, DemoUser };
