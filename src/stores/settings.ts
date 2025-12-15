import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'interventionist' | 'coach' | 'admin';
export type Theme = 'light' | 'dark' | 'system';
export type CalendarStartDay = 'sunday' | 'monday';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type ReminderTiming = '15min' | '30min' | '1hour';

export interface ProfileSettings {
  displayName: string;
  email: string;
  schoolOrganization: string;
  role: UserRole;
}

export interface SessionDefaults {
  defaultDuration: number; // in minutes
  defaultOTRTarget: number; // per minute
  defaultResponseFormats: string[]; // e.g., ['verbal', 'written', 'gestural']
  autoSaveToErrorBank: boolean;
}

export interface DisplayPreferences {
  theme: Theme;
  sidebarDefaultExpanded: boolean;
  calendarStartDay: CalendarStartDay;
  dateFormat: DateFormat;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  sessionReminders: boolean;
  pmDataDueReminders: boolean;
  reminderTiming: ReminderTiming;
}

export interface SettingsState {
  // Settings data
  profile: ProfileSettings;
  sessionDefaults: SessionDefaults;
  displayPreferences: DisplayPreferences;
  notificationPreferences: NotificationPreferences;

  // State
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: string | null;

  // Actions
  updateProfile: (profile: Partial<ProfileSettings>) => void;
  updateSessionDefaults: (defaults: Partial<SessionDefaults>) => void;
  updateDisplayPreferences: (preferences: Partial<DisplayPreferences>) => void;
  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  resetToDefaults: () => void;
  exportData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const defaultSettings = {
  profile: {
    displayName: 'EMERGE User',
    email: 'user@emerge.edu',
    schoolOrganization: 'Sample School',
    role: 'interventionist' as UserRole,
  },
  sessionDefaults: {
    defaultDuration: 30,
    defaultOTRTarget: 5,
    defaultResponseFormats: ['verbal', 'written', 'gestural'],
    autoSaveToErrorBank: true,
  },
  displayPreferences: {
    theme: 'system' as Theme,
    sidebarDefaultExpanded: true,
    calendarStartDay: 'sunday' as CalendarStartDay,
    dateFormat: 'MM/DD/YYYY' as DateFormat,
  },
  notificationPreferences: {
    emailNotifications: true,
    sessionReminders: true,
    pmDataDueReminders: true,
    reminderTiming: '15min' as ReminderTiming,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: defaultSettings.profile,
      sessionDefaults: defaultSettings.sessionDefaults,
      displayPreferences: defaultSettings.displayPreferences,
      notificationPreferences: defaultSettings.notificationPreferences,
      isLoading: false,
      isSaving: false,
      lastSaved: null,

      // Actions
      updateProfile: (profile) => {
        set((state) => ({
          profile: { ...state.profile, ...profile },
        }));
      },

      updateSessionDefaults: (defaults) => {
        set((state) => ({
          sessionDefaults: { ...state.sessionDefaults, ...defaults },
        }));
      },

      updateDisplayPreferences: (preferences) => {
        set((state) => ({
          displayPreferences: { ...state.displayPreferences, ...preferences },
        }));

        // Update UI store if theme changes
        if (preferences.theme !== undefined) {
          // Theme will be applied via useEffect in the settings page
        }

        // Update UI store if sidebar preference changes
        if (preferences.sidebarDefaultExpanded !== undefined) {
          const { useUIStore } = require('./ui');
          useUIStore.getState().setSidebarCollapsed(!preferences.sidebarDefaultExpanded);
        }
      },

      updateNotificationPreferences: (preferences) => {
        set((state) => ({
          notificationPreferences: { ...state.notificationPreferences, ...preferences },
        }));
      },

      saveSettings: async () => {
        set({ isSaving: true });
        try {
          // In a real app, this would save to Supabase
          await new Promise((resolve) => setTimeout(resolve, 500));
          set({ lastSaved: new Date().toISOString() });
        } catch (error) {
          console.error('Failed to save settings:', error);
          throw error;
        } finally {
          set({ isSaving: false });
        }
      },

      loadSettings: async () => {
        set({ isLoading: true });
        try {
          // In a real app, this would load from Supabase
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
          console.error('Failed to load settings:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      resetToDefaults: () => {
        set({
          profile: defaultSettings.profile,
          sessionDefaults: defaultSettings.sessionDefaults,
          displayPreferences: defaultSettings.displayPreferences,
          notificationPreferences: defaultSettings.notificationPreferences,
        });
      },

      exportData: async () => {
        try {
          // Export all data as JSON
          const data = {
            settings: {
              profile: get().profile,
              sessionDefaults: get().sessionDefaults,
              displayPreferences: get().displayPreferences,
              notificationPreferences: get().notificationPreferences,
            },
            exportDate: new Date().toISOString(),
          };

          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `emerge-settings-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Failed to export data:', error);
          throw error;
        }
      },

      clearAllData: async () => {
        try {
          // In a real app, this would clear data from Supabase
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Clear local storage
          localStorage.clear();

          // Reset to defaults
          get().resetToDefaults();
        } catch (error) {
          console.error('Failed to clear data:', error);
          throw error;
        }
      },
    }),
    {
      name: 'emerge-settings-store',
    }
  )
);

// Helper to get formatted reminder timing label
export function getReminderTimingLabel(timing: ReminderTiming): string {
  const labels: Record<ReminderTiming, string> = {
    '15min': '15 minutes before',
    '30min': '30 minutes before',
    '1hour': '1 hour before',
  };
  return labels[timing];
}

// Helper to get theme label
export function getThemeLabel(theme: Theme): string {
  const labels: Record<Theme, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  };
  return labels[theme];
}
