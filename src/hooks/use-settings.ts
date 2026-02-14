import { useSettingsStore } from '@/stores/settings';

export function useSettings() {
  const {
    profile,
    sessionDefaults,
    displayPreferences,
    notificationPreferences,
    schoolSettings,
    isLoading,
    isSaving,
    lastSaved,
    updateProfile,
    updateSessionDefaults,
    updateDisplayPreferences,
    updateNotificationPreferences,
    updateSchoolSettings,
    saveSettings,
    loadSettings,
    resetToDefaults,
    exportData,
    clearAllData,
  } = useSettingsStore();

  return {
    // Settings data
    profile,
    sessionDefaults,
    displayPreferences,
    notificationPreferences,
    schoolSettings,

    // State
    isLoading,
    isSaving,
    lastSaved,

    // Actions
    updateProfile,
    updateSessionDefaults,
    updateDisplayPreferences,
    updateNotificationPreferences,
    updateSchoolSettings,
    saveSettings,
    loadSettings,
    resetToDefaults,
    exportData,
    clearAllData,
  };
}
