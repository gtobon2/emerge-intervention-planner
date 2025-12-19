import { useSettingsStore } from '@/stores/settings';

export function useSettings() {
  const {
    profile,
    sessionDefaults,
    displayPreferences,
    notificationPreferences,
    isLoading,
    isSaving,
    lastSaved,
    updateProfile,
    updateSessionDefaults,
    updateDisplayPreferences,
    updateNotificationPreferences,
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

    // State
    isLoading,
    isSaving,
    lastSaved,

    // Actions
    updateProfile,
    updateSessionDefaults,
    updateDisplayPreferences,
    updateNotificationPreferences,
    saveSettings,
    loadSettings,
    resetToDefaults,
    exportData,
    clearAllData,
  };
}
