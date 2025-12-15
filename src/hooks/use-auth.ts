'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

/**
 * Hook to access authentication state and actions
 * Automatically initializes auth on first use
 */
export function useAuth() {
  const {
    user,
    session,
    isLoading,
    error,
    isInitialized,
    initialize,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    clearError,
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
    isLoading,
    error,
    isAuthenticated: !!user,
    isInitialized,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    clearError,
  };
}
