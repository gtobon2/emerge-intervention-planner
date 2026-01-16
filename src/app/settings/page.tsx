'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Moon,
  Download,
  Upload,
  Trash2,
  Save,
  Calendar,
  Clock,
  Target,
  CheckSquare,
  Sun,
  Monitor,
  BookOpen,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Switch,
  Checkbox,
  ConfirmModal,
} from '@/components/ui';
import { ImportStudentsModal } from '@/components/students';
import { useSettings } from '@/hooks/use-settings';
import { useAuth } from '@/hooks/use-auth';
import { useUIStore } from '@/stores/ui';
import { useStudentsStore } from '@/stores/students';
import { useGroupsStore } from '@/stores/groups';
import { exportToFile, importFromFile, getDatabaseStats } from '@/lib/local-db/backup';
import type { UserRole, Theme, CalendarStartDay, DateFormat, ReminderTiming } from '@/stores/settings';
import type { ValidatedStudent } from '@/lib/import-utils';

export default function SettingsPage() {
  const {
    profile,
    sessionDefaults,
    displayPreferences,
    notificationPreferences,
    isSaving,
    updateProfile,
    updateSessionDefaults,
    updateDisplayPreferences,
    updateNotificationPreferences,
    saveSettings,
    exportData,
    clearAllData,
  } = useSettings();

  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Settings saved successfully!');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);
  const [localSessionDefaults, setLocalSessionDefaults] = useState(sessionDefaults);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { setSidebarCollapsed } = useUIStore();

  // Password change state
  const { updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const groups = useGroupsStore((state) => state.groups);
  const fetchGroups = useGroupsStore((state) => state.fetchGroups);
  const allStudents = useStudentsStore((state) => state.allStudents);
  const fetchAllStudents = useStudentsStore((state) => state.fetchAllStudents);
  const createStudent = useStudentsStore((state) => state.createStudent);
  const studentsLoading = useStudentsStore((state) => state.isLoading);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    setLocalSessionDefaults(sessionDefaults);
  }, [sessionDefaults]);

  useEffect(() => {
    fetchGroups();
    fetchAllStudents();
  }, [fetchGroups, fetchAllStudents]);

  const handleSaveProfile = async () => {
    updateProfile(localProfile);
    await saveSettings();
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleSaveSessionDefaults = async () => {
    updateSessionDefaults(localSessionDefaults);
    await saveSettings();
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleThemeChange = (theme: Theme) => {
    updateDisplayPreferences({ theme });
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleSidebarDefaultChange = (expanded: boolean) => {
    updateDisplayPreferences({ sidebarDefaultExpanded: expanded });
    setSidebarCollapsed(!expanded);
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      await exportToFile();
      setSuccessMessage('Data exported successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const result = await importFromFile(file, { clearExisting: true, remapIds: true });
      if (result.success) {
        setSuccessMessage(`Imported ${result.stats.total} records successfully!`);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        // Refresh data
        fetchGroups();
        fetchAllStudents();
      } else {
        alert(`Import failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Make sure the file is a valid backup.');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleClearData = async () => {
    try {
      await clearAllData();
      setShowClearDataModal(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('Clear data failed:', error);
    }
  };

  const handleImportStudents = async (validatedStudents: ValidatedStudent[], groupId: string) => {
    let successCount = 0;
    let errorCount = 0;

    // Import students one by one
    for (const validatedStudent of validatedStudents) {
      const result = await createStudent(validatedStudent.data);
      if (result) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    if (successCount > 0) {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      fetchAllStudents();
    }

    if (errorCount > 0) {
      console.error(`Failed to import ${errorCount} students`);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    // Validation
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(newPassword);
      setSuccessMessage('Password changed successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const roleOptions = [
    { value: 'interventionist', label: 'Interventionist' },
    { value: 'coach', label: 'Coach' },
    { value: 'admin', label: 'Admin' },
  ];

  const durationOptions = [
    { value: '15', label: '15 minutes' },
    { value: '20', label: '20 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  const calendarStartDayOptions = [
    { value: 'sunday', label: 'Sunday' },
    { value: 'monday', label: 'Monday' },
  ];

  const dateFormatOptions = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  ];

  const reminderTimingOptions = [
    { value: '15min', label: '15 minutes before' },
    { value: '30min', label: '30 minutes before' },
    { value: '1hour', label: '1 hour before' },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
            <p className="text-text-muted mt-1">
              Manage your account preferences and application settings
            </p>
          </div>
          <SettingsIcon className="w-8 h-8 text-movement" />
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-top">
            <CheckSquare className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-movement" />
              <CardTitle>Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Display Name"
              value={localProfile.displayName}
              onChange={(e) =>
                setLocalProfile({ ...localProfile, displayName: e.target.value })
              }
              placeholder="Your name"
            />

            <Input
              label="Email"
              type="email"
              value={localProfile.email}
              onChange={(e) =>
                setLocalProfile({ ...localProfile, email: e.target.value })
              }
              placeholder="your.email@example.com"
              helperText="Used for notifications and account recovery"
            />

            <Input
              label="School/Organization"
              value={localProfile.schoolOrganization}
              onChange={(e) =>
                setLocalProfile({ ...localProfile, schoolOrganization: e.target.value })
              }
              placeholder="School or organization name"
            />

            <Select
              label="Role"
              options={roleOptions}
              value={localProfile.role}
              onChange={(e) =>
                setLocalProfile({ ...localProfile, role: e.target.value as UserRole })
              }
            />

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveProfile} isLoading={isSaving} className="gap-2">
                <Save className="w-4 h-4" />
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-movement" />
              <CardTitle>Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-muted">
              Change your password to keep your account secure.
            </p>

            {passwordError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500">{passwordError}</p>
              </div>
            )}

            <div className="relative">
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={isChangingPassword}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-9 text-text-muted hover:text-text-primary"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={isChangingPassword}
              helperText="Minimum 6 characters"
            />

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleChangePassword}
                isLoading={isChangingPassword}
                disabled={!newPassword || !confirmNewPassword}
                className="gap-2"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Session Defaults Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-movement" />
              <CardTitle>Session Defaults</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Default Session Duration"
              options={durationOptions}
              value={localSessionDefaults.defaultDuration.toString()}
              onChange={(e) =>
                setLocalSessionDefaults({
                  ...localSessionDefaults,
                  defaultDuration: parseInt(e.target.value),
                })
              }
              helperText="Default length for new intervention sessions"
            />

            <Input
              label="Default OTR Target (per minute)"
              type="number"
              min="1"
              max="20"
              value={localSessionDefaults.defaultOTRTarget}
              onChange={(e) =>
                setLocalSessionDefaults({
                  ...localSessionDefaults,
                  defaultOTRTarget: parseInt(e.target.value) || 5,
                })
              }
              helperText="Target opportunities to respond per minute"
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Default Response Formats
              </label>
              <div className="space-y-2">
                <Checkbox
                  label="Verbal"
                  checked={localSessionDefaults.defaultResponseFormats.includes('verbal')}
                  onChange={(e) => {
                    const formats = e.target.checked
                      ? [...localSessionDefaults.defaultResponseFormats, 'verbal']
                      : localSessionDefaults.defaultResponseFormats.filter(
                          (f) => f !== 'verbal'
                        );
                    setLocalSessionDefaults({
                      ...localSessionDefaults,
                      defaultResponseFormats: formats,
                    });
                  }}
                />
                <Checkbox
                  label="Written"
                  checked={localSessionDefaults.defaultResponseFormats.includes('written')}
                  onChange={(e) => {
                    const formats = e.target.checked
                      ? [...localSessionDefaults.defaultResponseFormats, 'written']
                      : localSessionDefaults.defaultResponseFormats.filter(
                          (f) => f !== 'written'
                        );
                    setLocalSessionDefaults({
                      ...localSessionDefaults,
                      defaultResponseFormats: formats,
                    });
                  }}
                />
                <Checkbox
                  label="Gestural"
                  checked={localSessionDefaults.defaultResponseFormats.includes('gestural')}
                  onChange={(e) => {
                    const formats = e.target.checked
                      ? [...localSessionDefaults.defaultResponseFormats, 'gestural']
                      : localSessionDefaults.defaultResponseFormats.filter(
                          (f) => f !== 'gestural'
                        );
                    setLocalSessionDefaults({
                      ...localSessionDefaults,
                      defaultResponseFormats: formats,
                    });
                  }}
                />
              </div>
              <p className="text-xs text-text-muted mt-2">
                Select default response formats for new sessions
              </p>
            </div>

            <Switch
              label="Auto-save errors to Error Bank"
              helperText="Automatically save student errors to the error bank during sessions"
              checked={localSessionDefaults.autoSaveToErrorBank}
              onChange={(e) =>
                setLocalSessionDefaults({
                  ...localSessionDefaults,
                  autoSaveToErrorBank: e.target.checked,
                })
              }
            />

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveSessionDefaults}
                isLoading={isSaving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save Defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Display Preferences Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-movement" />
              <CardTitle>Display Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${
                      displayPreferences.theme === 'light'
                        ? 'border-movement bg-movement/5'
                        : 'border-text-muted/20 hover:border-text-muted/40'
                    }
                  `}
                >
                  <Sun className="w-5 h-5 mx-auto mb-1 text-text-primary" />
                  <div className="text-sm text-text-primary">Light</div>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${
                      displayPreferences.theme === 'dark'
                        ? 'border-movement bg-movement/5'
                        : 'border-text-muted/20 hover:border-text-muted/40'
                    }
                  `}
                >
                  <Moon className="w-5 h-5 mx-auto mb-1 text-text-primary" />
                  <div className="text-sm text-text-primary">Dark</div>
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${
                      displayPreferences.theme === 'system'
                        ? 'border-movement bg-movement/5'
                        : 'border-text-muted/20 hover:border-text-muted/40'
                    }
                  `}
                >
                  <Monitor className="w-5 h-5 mx-auto mb-1 text-text-primary" />
                  <div className="text-sm text-text-primary">System</div>
                </button>
              </div>
              <p className="text-xs text-text-muted mt-2">
                Choose how EMERGE looks across all pages
              </p>
            </div>

            <Switch
              label="Sidebar expanded by default"
              helperText="Keep the navigation sidebar open when you visit pages"
              checked={displayPreferences.sidebarDefaultExpanded}
              onChange={(e) => handleSidebarDefaultChange(e.target.checked)}
            />

            <Select
              label="Calendar Start Day"
              options={calendarStartDayOptions}
              value={displayPreferences.calendarStartDay}
              onChange={(e) =>
                updateDisplayPreferences({
                  calendarStartDay: e.target.value as CalendarStartDay,
                })
              }
              helperText="Choose which day starts your week in calendar views"
            />

            <Select
              label="Date Format"
              options={dateFormatOptions}
              value={displayPreferences.dateFormat}
              onChange={(e) =>
                updateDisplayPreferences({ dateFormat: e.target.value as DateFormat })
              }
              helperText="How dates are displayed throughout the app"
            />
          </CardContent>
        </Card>

        {/* Notification Preferences Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-movement" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Switch
              label="Email notifications"
              helperText="Receive email updates about your sessions and students"
              checked={notificationPreferences.emailNotifications}
              onChange={(e) =>
                updateNotificationPreferences({ emailNotifications: e.target.checked })
              }
            />

            <Switch
              label="Session reminders"
              helperText="Get notified before scheduled intervention sessions"
              checked={notificationPreferences.sessionReminders}
              onChange={(e) =>
                updateNotificationPreferences({ sessionReminders: e.target.checked })
              }
            />

            <Switch
              label="PM data due reminders"
              helperText="Receive reminders when progress monitoring data is due"
              checked={notificationPreferences.pmDataDueReminders}
              onChange={(e) =>
                updateNotificationPreferences({ pmDataDueReminders: e.target.checked })
              }
            />

            <Select
              label="Reminder Timing"
              options={reminderTimingOptions}
              value={notificationPreferences.reminderTiming}
              onChange={(e) =>
                updateNotificationPreferences({
                  reminderTiming: e.target.value as ReminderTiming,
                })
              }
              helperText="When to send reminders before sessions"
              disabled={!notificationPreferences.sessionReminders}
            />
          </CardContent>
        </Card>

        {/* Curriculum Data Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-movement" />
              <CardTitle>Curriculum Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-muted">
              Manage lesson elements and curriculum-specific data for use in the lesson builder.
            </p>
            <Link
              href="/settings/wilson-data"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-movement hover:bg-movement/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-text-primary">Wilson Reading System</div>
                  <div className="text-sm text-text-muted">Manage sounds, words, sentences by substep</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-movement transition-colors" />
            </Link>
          </CardContent>
        </Card>

        {/* Data Management Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-movement" />
              <CardTitle>Data Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                Important: Your data is stored locally in this browser.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Export regularly to avoid data loss. If you clear browser data, your groups and sessions will be deleted.
              </p>
            </div>

            <div>
              <Button
                onClick={handleExportData}
                variant="secondary"
                className="gap-2 w-full"
                isLoading={isExporting}
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export All Data (Backup)'}
              </Button>
              <p className="text-xs text-text-muted mt-2">
                Download all groups, students, sessions, and settings as a JSON file
              </p>
            </div>

            <div>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                  id="import-file"
                />
                <Button
                  variant="secondary"
                  className="gap-2 w-full cursor-pointer"
                  isLoading={isImporting}
                  onClick={() => document.getElementById('import-file')?.click()}
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? 'Importing...' : 'Restore from Backup'}
                </Button>
              </label>
              <p className="text-xs text-text-muted mt-2">
                Restore all data from a previously exported JSON backup file
              </p>
            </div>

            <div className="pt-4 border-t border-text-muted/10">
              <Button
                onClick={() => setImportModalOpen(true)}
                variant="secondary"
                className="gap-2 w-full"
              >
                <Upload className="w-4 h-4" />
                Import Students (CSV)
              </Button>
              <p className="text-xs text-text-muted mt-2">
                Import student data from CSV file
              </p>
            </div>

            <div className="pt-4 border-t border-text-muted/10">
              <Button
                onClick={() => setShowClearDataModal(true)}
                variant="danger"
                className="gap-2 w-full"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </Button>
              <p className="text-xs text-text-muted mt-2">
                Permanently delete all your data and reset to defaults
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clear Data Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearDataModal}
        onClose={() => setShowClearDataModal(false)}
        onConfirm={handleClearData}
        title="Clear All Data?"
        message="This will permanently delete all your data including groups, students, sessions, and progress data. This action cannot be undone."
        confirmText="Clear All Data"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Import Students Modal */}
      <ImportStudentsModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportStudents}
        groups={groups}
        existingStudents={allStudents}
        isLoading={studentsLoading}
      />
    </AppLayout>
  );
}
