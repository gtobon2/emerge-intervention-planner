// Hook exports
export { useAuth } from './use-auth';
export { useGroups, useGroup } from './use-groups';
export { useSessions, useSession, useTodaySessions } from './use-sessions';
export { useProgress, useStudentProgress } from './use-progress';
export { useErrors, useSuggestedErrors } from './use-errors';
export { useStudents } from './use-students';
export { useAllStudents } from './use-all-students';
export type { StudentWithGroup } from './use-all-students';
export {
  useCurriculum,
  useWilsonData,
  useDeltaMathData,
  useCaminoData,
  useWordGenData,
  useAmiraData,
} from './use-curriculum';
export { useSpeechRecognition } from './use-speech-recognition';
export { useSettings } from './use-settings';
export { useSearch } from './use-search';
export { useNotifications, useNotificationGenerator, useFilteredNotifications } from './use-notifications';
export {
  useGroupMaterials,
  useSessionMaterials,
  useWeeklyMaterials,
  useMaterialCatalog,
} from './use-group-materials';
