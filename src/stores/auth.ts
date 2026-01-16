import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/supabase/config';
import { fetchProfileById, type Profile } from '@/lib/supabase/profiles';
import type { User, Session } from '@supabase/supabase-js';

// User roles for access control
export type UserRole = 'admin' | 'interventionist' | 'teacher';

// Demo users for role-based login
export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'admin-1', name: 'Admin User', email: 'admin@emerge.edu', role: 'admin' },
  { id: 'interventionist-1', name: 'Sarah Martinez', email: 'sarah@emerge.edu', role: 'interventionist' },
  { id: 'teacher-1', name: 'John Smith', email: 'john@emerge.edu', role: 'teacher' },
];

interface AuthState {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  userProfile: Profile | null;
  currentDemoUser: DemoUser | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsDemoUser: (demoUser: DemoUser) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: { full_name?: string; email?: string }) => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  clearError: () => void;
  isAdmin: () => boolean;
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
      userRole: null,
      userProfile: null,
      currentDemoUser: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true, error: null });

        try {
          if (isMockMode()) {
            // Mock mode: check if we have a saved demo user in localStorage
            const savedDemoUser = get().currentDemoUser;
            if (savedDemoUser) {
              // Restore the saved demo user session
              const mockUser: User = {
                id: savedDemoUser.id,
                email: savedDemoUser.email,
                app_metadata: {},
                user_metadata: { full_name: savedDemoUser.name, role: savedDemoUser.role },
                aud: 'authenticated',
                created_at: new Date().toISOString(),
              } as User;

              set({
                user: mockUser,
                session: { ...MOCK_SESSION, user: mockUser },
                userRole: savedDemoUser.role,
                isLoading: false,
                isInitialized: true,
              });
              return;
            }

            // No saved user - require login
            console.warn('⚠️ Running in mock mode - Please select a user to login');
            set({
              user: null,
              session: null,
              userRole: null,
              isLoading: false,
              isInitialized: true,
            });
            return;
          }

          // Get current session
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) throw error;

          // If we have a session, fetch the user's profile
          let profile: Profile | null = null;
          let role: UserRole | null = null;

          if (session?.user) {
            try {
              profile = await fetchProfileById(session.user.id);
              role = profile?.role || (session.user.user_metadata?.role as UserRole) || 'interventionist';
            } catch (profileError) {
              console.error('Error fetching profile during init:', profileError);
              // Fall back to user metadata role
              role = (session.user.user_metadata?.role as UserRole) || 'interventionist';
            }
          }

          set({
            user: session?.user ?? null,
            session: session ?? null,
            userRole: role,
            userProfile: profile,
            isLoading: false,
            isInitialized: true,
          });

          // Set up auth state listener
          supabase.auth.onAuthStateChange(async (_event, session) => {
            let newProfile: Profile | null = null;
            let newRole: UserRole | null = null;

            if (session?.user) {
              try {
                newProfile = await fetchProfileById(session.user.id);
                newRole = newProfile?.role || (session.user.user_metadata?.role as UserRole) || 'interventionist';
              } catch (profileError) {
                console.error('Error fetching profile on auth change:', profileError);
                newRole = (session.user.user_metadata?.role as UserRole) || 'interventionist';
              }
            }

            set({
              user: session?.user ?? null,
              session: session ?? null,
              userRole: newRole,
              userProfile: newProfile,
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
            // Mock mode: find matching demo user by email
            const demoUser = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (demoUser) {
              await new Promise(resolve => setTimeout(resolve, 500));
              const mockUser: User = {
                id: demoUser.id,
                email: demoUser.email,
                app_metadata: {},
                user_metadata: { full_name: demoUser.name, role: demoUser.role },
                aud: 'authenticated',
                created_at: new Date().toISOString(),
              } as User;

              set({
                user: mockUser,
                session: { ...MOCK_SESSION, user: mockUser },
                userRole: demoUser.role,
                currentDemoUser: demoUser,
                isLoading: false,
              });
              return;
            }

            // No matching demo user - use default mock user as admin
            await new Promise(resolve => setTimeout(resolve, 500));
            set({
              user: MOCK_USER,
              session: MOCK_SESSION,
              userRole: 'admin',
              currentDemoUser: DEMO_USERS[0],
              isLoading: false,
            });
            return;
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          // Fetch profile from database to get role
          let profile: Profile | null = null;
          let role: UserRole = 'interventionist';

          if (data.user) {
            try {
              profile = await fetchProfileById(data.user.id);
              role = profile?.role || (data.user.user_metadata?.role as UserRole) || 'interventionist';
            } catch (profileError) {
              console.error('Error fetching profile after login:', profileError);
              role = (data.user.user_metadata?.role as UserRole) || 'interventionist';
            }
          }

          set({
            user: data.user,
            session: data.session,
            userRole: role,
            userProfile: profile,
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

      signInAsDemoUser: async (demoUser: DemoUser) => {
        set({ isLoading: true, error: null });

        try {
          await new Promise(resolve => setTimeout(resolve, 300)); // Simulate brief delay

          const mockUser: User = {
            id: demoUser.id,
            email: demoUser.email,
            app_metadata: {},
            user_metadata: { full_name: demoUser.name, role: demoUser.role },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as User;

          set({
            user: mockUser,
            session: { ...MOCK_SESSION, user: mockUser },
            userRole: demoUser.role,
            currentDemoUser: demoUser,
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
              userRole: null,
              userProfile: null,
              currentDemoUser: null,
              isLoading: false,
            });
            return;
          }

          const { error } = await supabase.auth.signOut();

          if (error) throw error;

          set({
            user: null,
            session: null,
            userRole: null,
            userProfile: null,
            currentDemoUser: null,
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

      fetchUserProfile: async () => {
        const user = get().user;
        if (!user || isMockMode()) return;

        try {
          const profile = await fetchProfileById(user.id);
          if (profile) {
            set({
              userProfile: profile,
              userRole: profile.role,
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      },

      clearError: () => {
        set({ error: null });
      },

      isAdmin: () => {
        return get().userRole === 'admin';
      },
    }),
    {
      name: 'emerge-auth-store',
      partialize: (state) => ({
        // Persist initialization status and demo user for session restoration
        isInitialized: state.isInitialized,
        currentDemoUser: state.currentDemoUser,
        userRole: state.userRole,
      }),
    }
  )
);
