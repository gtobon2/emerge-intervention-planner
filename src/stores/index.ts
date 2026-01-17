// Store exports
export { useAuthStore } from './auth';
export { useGroupsStore, useFilteredGroups } from './groups';
export { useSessionsStore, getSessionsForWeek } from './sessions';
export { useProgressStore, checkDecisionRules, calculateTrendLine } from './progress';
export { useErrorsStore } from './errors';
export { useStudentsStore } from './students';
export { useUIStore, formatElapsedTime } from './ui';
export { useSettingsStore, getReminderTimingLabel, getThemeLabel } from './settings';
export { useAIContextStore } from './ai-context';
export type { StudentContext, GroupContext, SessionContext } from './ai-context';

// New stores for attendance, calendar, and cycles
export { useAttendanceStore, getStudentAttendanceStatus, isAttendanceComplete } from './attendance';
export {
  useSchoolCalendarStore,
  isDateInEvents,
  getDatesBetween,
  expandEventDates,
  NON_STUDENT_DAY_TEMPLATES,
} from './school-calendar';
export {
  useCyclesStore,
  getWeekOfCycle,
  getCycleProgress,
  isCycleActive,
  formatCycleDateRange,
  getCycleStatusColorClass,
} from './cycles';

// Generic store factory for creating new entity stores
export { createEntityStore } from './factory';
export type {
  EntityState,
  EntityActions,
  EntityStore,
  EntityStoreConfig,
  FilterableEntityState,
  FilterableEntityActions,
  FilterableEntityStore,
} from './factory';
export type {
  UserRole,
  Theme,
  CalendarStartDay,
  DateFormat,
  ReminderTiming,
  ProfileSettings,
  SessionDefaults,
  DisplayPreferences,
  NotificationPreferences,
} from './settings';
