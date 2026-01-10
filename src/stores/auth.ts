import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/supabase/config';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: { full_name?: string; email?: string }) => Promise<void>;
  clearError: () => void;
}

// Mock user for development when Supabase is not configured
const MOCK_USER: User = {
  id: 'mock-user-id',
  email: 'demo@emerge.edu',
  app_metadata: {},
  user_metadata: { full_name: 'Demo User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

const MOCK_SESSION: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: MOCK_USER,
} as Session;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true, error: null });

        try {
          if (isMockMode()) {
            // Mock mode: auto-login with demo user
            console.warn('⚠️ Running in mock mode - Supabase not configured');
            set({
              user: MOCK_USER,
              session: MOCK_SESSION,
              isLoading: false,
              isInitialized: true,
            });
            return;
          }

          // Get current session
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) throw error;

          set({
            user: session?.user ?? null,
            session: session ?? null,
            isLoading: false,
            isInitialized: true,
          });

          // Set up auth state listener
          supabase.auth.onAuthStateChange((_event, session) => {
            set({
              user: session?.user ?? null,
              session: session ?? null,
            });
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to initialize auth',
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          if (isMockMode()) {
            // Mock mode: accept any credentials
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
            set({
              user: MOCK_USER,
              session: MOCK_SESSION,
              isLoading: false,
            });
            return;
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          set({
            user: data.user,
            session: data.session,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to sign in',
            isLoading: false,
          });
          throw error;
        }
      },

      signUp: async (email: string, password: string, fullName?: string) => {
        set({ isLoading: true, error: null });

        try {
          if (isMockMode()) {
            // Mock mode: simulate signup
            await new Promise(resolve => setTimeout(resolve, 500));
            set({
              isLoading: false,
            });
            return;
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          });

          if (error) throw error;

          set({
            user: data.user,
            session: data.session,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to sign up',
            isLoading: false,
          });
          throw error;
        }
      },

      signOut: async () => {
        set({ isLoading: true, error: null });

        try {
          if (isMockMode()) {
            // Mock mode: just clear state
            await new Promise(resolve => setTimeout(resolve, 300));
            set({
              user: null,
              session: null,
              isLoading: false,
            });
            return;
          }

          const { error } = await supabase.auth.signOut();

          if (error) throw error;

          set({
            user: null,
            session: null,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to sign out',
            isLoading: false,
          });
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          if (isMockMode()) {
            // Mock mode: simulate password reset
            await new Promise(resolve => setTimeout(resolve, 500));
            set({ isLoading: false });
            return;
          }

          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });

          if (error) throw error;

          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to send reset email',
            isLoading: false,
          });
          throw error;
        }
      },

      updatePassword: async (newPassword: string) => {
        set({ isLoading: true, error: null });

        try {
          if (isMockMode()) {
            // Mock mode: simulate password update
            await new Promise(resolve => setTimeout(resolve, 500));
            set({ isLoading: false });
            return;
          }

          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (error) throw error;

          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update password',
            isLoading: false,
          });
          throw error;
        }
      },

      updateProfile: async (updates: { full_name?: string; email?: string }) => {
        set({ isLoading: true, error: null });

        try {
          if (isMockMode()) {
            // Mock mode: update mock user
            await new Promise(resolve => setTimeout(resolve, 500));
            const currentUser = get().user;
            if (currentUser) {
              const updatedUser = {
                ...currentUser,
                email: updates.email || currentUser.email,
                user_metadata: {
                  ...currentUser.user_metadata,
                  full_name: updates.full_name || currentUser.user_metadata?.full_name,
                },
              };
              set({ user: updatedUser, isLoading: false });
            }
            return;
          }

          const { data, error } = await supabase.auth.updateUser({
            email: updates.email,
            data: {
              full_name: updates.full_name,
            },
          });

          if (error) throw error;

          set({
            user: data.user,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update profile',
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'emerge-auth-store',
      partialize: (state) => ({
        // Only persist initialization status
        isInitialized: state.isInitialized,
      }),
    }
  )
);
