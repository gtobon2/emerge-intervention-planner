// Learning Commons Integration
// https://learningcommons.org
// https://github.com/learning-commons-org

// Knowledge Graph - structured educational data
export {
  loadKnowledgeGraph,
  getLearningComponent,
  getAllLearningComponents,
  getComponentsByGrade,
  getComponentsByDomain,
  getComponentsByCluster,
  getPrerequisites,
  getDependents,
  buildLearningProgression,
  searchComponents,
  mapSkillToComponents,
  getStandardsCrosswalk,
} from './knowledge-graph';

// Evaluators - AI output quality assessment
export {
  evaluateTextComplexity,
  evaluateLiteracy,
  evaluateMotivation,
  evaluateContent,
  generateImprovementSuggestions,
} from './evaluators';

// Types
export type {
  // Knowledge Graph types
  StandardsFramework,
  StandardsFrameworkItem,
  LearningComponent,
  Relationship,
  RelationshipType,
  LearningProgression,
  MathSkillMapping,
  StandardsCrosswalk,
  // Evaluator types
  TextComplexityDimension,
  ComplexityLevel,
  TextComplexityEvaluation,
  LiteracyEvaluation,
  MotivationEvaluation,
  ContentEvaluation,
} from './types';
