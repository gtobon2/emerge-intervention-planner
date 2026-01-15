/**
 * CaminoALaLectura / Despegando - Spanish Reading Intervention Module
 *
 * Re-exports all types, data, and utilities for the Spanish curriculum.
 */

// Types and helpers from camino-lesson-elements
export type {
  SpanishSoundType,
  SyllableStructure,
  CaminoSoundCard,
  CaminoSyllable,
  CaminoWord,
  CaminoHighFrequencyWord,
  CaminoSentence,
  CaminoDecodableText,
  WordSortType,
  WordSortCategory,
  WordSortOddOneOut,
  CaminoWordSort,
  CaminoLessonElements,
  CaminoLessonComponentType,
  CaminoLessonPlanElement,
  CaminoLessonPlanSection,
  CaminoLessonPlan,
  CaminoLessonBlock,
} from './camino-lesson-elements';

export {
  CAMINO_LESSON_SECTIONS,
  CAMINO_UNITS,
  getLessonCode,
  getLessonsForUnit,
  generateElementId,
  createEmptyCaminoLessonElements,
  createEmptyCaminoLessonPlan,
  calculateCaminoLessonDuration,
  getCaminoAcceptedElementTypes,
} from './camino-lesson-elements';

// Prepopulated data
export * from './camino-data';

// Word sorts
export * from './camino-word-sorts';
