// Learning Commons Knowledge Graph Types
// Based on CZI Learning Commons data model
// https://github.com/learning-commons-org/knowledge-graph

/**
 * StandardsFramework represents a standards document (e.g., Common Core, state standards)
 */
export interface StandardsFramework {
  uuid: string;
  identifier: string;
  title: string;
  description?: string;
  subject?: string;
  publisher?: string;
  version?: string;
  adoptionStatus?: string;
  statusStartDate?: string;
  statusEndDate?: string;
  uri?: string;
}

/**
 * StandardsFrameworkItem represents an individual standard or learning objective
 */
export interface StandardsFrameworkItem {
  uuid: string;
  identifier: string;
  humanCodingScheme?: string;
  fullStatement: string;
  abbreviatedStatement?: string;
  notes?: string;
  educationLevel?: string[];
  subject?: string;
  itemType?: 'Standard' | 'Strand' | 'Cluster' | 'Domain' | 'Grade Level';
  sequenceNumber?: number;
  frameworkUuid: string;
  parentUuid?: string;
}

/**
 * LearningComponent represents a granular, precise skill or concept
 * These are finer-grained than standards and provide more precise targeting
 */
export interface LearningComponent {
  uuid: string;
  identifier: string;
  label: string;
  description: string;
  subject: 'Math' | 'ELA' | 'Science' | 'Social Studies';
  gradeLevel?: string[];
  domain?: string;
  cluster?: string;
  skillType?: 'Conceptual' | 'Procedural' | 'Application';
  prerequisites?: string[]; // UUIDs of prerequisite components
  relatedStandards?: string[]; // UUIDs of related standards
}

/**
 * Relationship types in the Knowledge Graph
 */
export type RelationshipType =
  | 'isChildOf'           // Hierarchical parent-child
  | 'precedes'            // Prerequisite relationship
  | 'isRelatedTo'         // General relationship
  | 'alignsTo'            // Standard alignment
  | 'isPartOf'            // Component of larger concept
  | 'equivalentTo';       // Cross-framework equivalence

/**
 * Relationship represents a directed edge between two entities
 */
export interface Relationship {
  uuid: string;
  sourceUuid: string;
  targetUuid: string;
  relationshipType: RelationshipType;
  weight?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Learning Progression represents a sequence of learning components
 */
export interface LearningProgression {
  uuid: string;
  name: string;
  description: string;
  subject: string;
  gradeSpan: string[];
  components: LearningComponent[];
  pathway: string[]; // Ordered UUIDs of components
}

// ============================================
// Evaluator Types (for AI output assessment)
// ============================================

/**
 * SCASS Rubric dimensions for text complexity
 */
export type TextComplexityDimension =
  | 'structure'
  | 'languageFeatures'
  | 'knowledgeDemands'
  | 'meaningPurpose';

/**
 * Complexity level ratings
 */
export type ComplexityLevel =
  | 'exceedinglyComplex'
  | 'veryComplex'
  | 'moderatelyComplex'
  | 'slightlyComplex'
  | 'accessible';

/**
 * Text complexity evaluation result
 */
export interface TextComplexityEvaluation {
  overallLevel: ComplexityLevel;
  dimensions: {
    structure: ComplexityLevel;
    languageFeatures: ComplexityLevel;
    knowledgeDemands: ComplexityLevel;
    meaningPurpose: ComplexityLevel;
  };
  gradeLevel: string;
  confidence: number;
  rationale: string;
}

/**
 * Literacy evaluator result
 */
export interface LiteracyEvaluation {
  textComplexity: TextComplexityEvaluation;
  vocabularyLevel: {
    tier1Words: number; // Basic words
    tier2Words: number; // Academic vocabulary
    tier3Words: number; // Domain-specific
    appropriatenessScore: number;
  };
  sentenceComplexity: {
    averageLength: number;
    subordinateClauseRatio: number;
    complexityScore: number;
  };
  recommendations: string[];
}

/**
 * Student motivation evaluation dimensions
 */
export interface MotivationEvaluation {
  growthMindsetSupport: number; // 0-1 score
  autonomySupport: number;
  relevanceClarity: number;
  achievabilityCues: number;
  overallScore: number;
  feedback: string[];
}

/**
 * Combined evaluator result
 */
export interface ContentEvaluation {
  literacy?: LiteracyEvaluation;
  motivation?: MotivationEvaluation;
  standardsAlignment?: {
    alignedStandards: string[];
    alignmentScore: number;
    gaps: string[];
  };
  timestamp: string;
  evaluatorVersion: string;
}

// ============================================
// Integration types for EMERGE app
// ============================================

/**
 * Math skill mapping for intervention planning
 */
export interface MathSkillMapping {
  curriculumSkill: string; // From Delta Math curriculum
  learningComponents: LearningComponent[];
  prerequisites: LearningComponent[];
  nextSkills: LearningComponent[];
  commonErrors: string[];
}

/**
 * Standard crosswalk for state alignment
 */
export interface StandardsCrosswalk {
  sourceStandard: StandardsFrameworkItem;
  targetStandards: StandardsFrameworkItem[];
  learningComponents: LearningComponent[];
  alignmentConfidence: number;
}
