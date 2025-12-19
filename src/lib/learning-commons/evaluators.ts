// Learning Commons Evaluators
// Assess AI-generated content against educational rubrics
// Based on SCASS rubric from Student Achievement Partners
// https://github.com/learning-commons-org/evaluators

import type {
  TextComplexityEvaluation,
  LiteracyEvaluation,
  MotivationEvaluation,
  ContentEvaluation,
  ComplexityLevel,
} from './types';

// ============================================
// SCASS Text Complexity Rubric Implementation
// ============================================

/**
 * SCASS rubric criteria for text structure
 */
const STRUCTURE_CRITERIA = {
  exceedinglyComplex: [
    'Organization is intricate or discipline-specific',
    'Connections between ideas are implicit or subtle',
    'Multiple text structures or genre features',
  ],
  veryComplex: [
    'Organization includes multiple pathways',
    'Connections require some inference',
    'Complex text structure',
  ],
  moderatelyComplex: [
    'Organization is clear but varies from simple chronological or sequential',
    'Connections are explicit but not always stated directly',
    'Some complexity in text structure',
  ],
  slightlyComplex: [
    'Organization is clear and chronological or sequential',
    'Connections are explicit and clear',
    'Simple, well-marked text structure',
  ],
  accessible: [
    'Organization is simple and straightforward',
    'All connections are explicit',
    'Very simple text structure',
  ],
};

/**
 * SCASS rubric criteria for language features
 */
const LANGUAGE_CRITERIA = {
  exceedinglyComplex: [
    'Abstract, ironic, figurative language predominates',
    'Complex sentence structures throughout',
    'Vocabulary generally unfamiliar, archaic, or domain-specific',
  ],
  veryComplex: [
    'Figurative or literary language used significantly',
    'Many complex sentences with subordinate clauses',
    'Much vocabulary is domain-specific or academic',
  ],
  moderatelyComplex: [
    'Some figurative or literary language',
    'Some complex sentence structures',
    'Some academic vocabulary or domain-specific words',
  ],
  slightlyComplex: [
    'Mostly literal, clear language',
    'Mainly simple and compound sentences',
    'Mostly familiar vocabulary with some academic words',
  ],
  accessible: [
    'Language is simple, concrete, literal',
    'Simple sentences predominate',
    'Vocabulary is familiar, everyday words',
  ],
};

/**
 * SCASS rubric criteria for knowledge demands
 */
const KNOWLEDGE_CRITERIA = {
  exceedinglyComplex: [
    'Relies on extensive discipline-specific content knowledge',
    'Requires understanding of multiple theoretical perspectives',
    'Many cultural or literary allusions',
  ],
  veryComplex: [
    'Requires discipline-specific content knowledge',
    'Some theoretical background helpful',
    'Some cultural references or allusions',
  ],
  moderatelyComplex: [
    'Requires some subject-specific knowledge',
    'General knowledge of topic helpful',
    'Few cultural references',
  ],
  slightlyComplex: [
    'Relies on common practical knowledge',
    'Basic background on topic sufficient',
    'References are explained when used',
  ],
  accessible: [
    'Relies only on everyday knowledge',
    'No prior knowledge of topic needed',
    'No unexplained references',
  ],
};

/**
 * SCASS rubric criteria for meaning/purpose
 */
const MEANING_CRITERIA = {
  exceedinglyComplex: [
    'Multiple levels of meaning',
    'Purpose is implicit or ambiguous',
    'Theme or central idea is subtle',
  ],
  veryComplex: [
    'Multiple purposes or perspectives',
    'Purpose must be inferred',
    'Theme requires interpretation',
  ],
  moderatelyComplex: [
    'Purpose is implied but fairly clear',
    'May have secondary meanings',
    'Theme is accessible but requires thought',
  ],
  slightlyComplex: [
    'Purpose is easily identified',
    'Single clear meaning',
    'Theme is straightforward',
  ],
  accessible: [
    'Purpose is stated explicitly',
    'Meaning is simple and clear',
    'Theme is obvious',
  ],
};

// ============================================
// Text Analysis Functions
// ============================================

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length <= 3) return 1;

  let count = clean.match(/[aeiouy]+/g)?.length || 1;

  // Adjust for silent e
  if (clean.endsWith('e') && !clean.endsWith('le')) {
    count = Math.max(1, count - 1);
  }

  return count;
}

/**
 * Calculate Flesch-Kincaid grade level
 */
function calculateFleschKincaid(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch-Kincaid Grade Level formula
  return 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
}

/**
 * Identify tier levels of vocabulary
 * Tier 1: Basic words (everyday)
 * Tier 2: Academic vocabulary (across domains)
 * Tier 3: Domain-specific (technical)
 */
const TIER_2_WORDS = new Set([
  'analyze', 'approach', 'area', 'assess', 'assume', 'authority', 'available',
  'benefit', 'concept', 'consistent', 'constitute', 'context', 'contract',
  'create', 'data', 'define', 'derive', 'distribute', 'economy', 'environment',
  'establish', 'estimate', 'evident', 'export', 'factor', 'feature', 'final',
  'function', 'identify', 'impact', 'indicate', 'individual', 'interpret',
  'involve', 'issue', 'labor', 'legal', 'legislate', 'major', 'method',
  'occur', 'percent', 'period', 'policy', 'principle', 'proceed', 'process',
  'require', 'research', 'respond', 'role', 'section', 'sector', 'significant',
  'similar', 'source', 'specific', 'structure', 'theory', 'vary', 'obtain',
  'furthermore', 'however', 'therefore', 'consequently', 'moreover', 'whereas',
]);

const TIER_3_MATH_WORDS = new Set([
  'quotient', 'dividend', 'divisor', 'numerator', 'denominator', 'fraction',
  'integer', 'polynomial', 'coefficient', 'variable', 'equation', 'inequality',
  'perimeter', 'circumference', 'diameter', 'radius', 'hypotenuse', 'theorem',
  'congruent', 'perpendicular', 'parallel', 'intersect', 'vertex', 'vertices',
  'axis', 'coordinate', 'quadrant', 'exponent', 'base', 'factor', 'multiple',
  'prime', 'composite', 'algorithm', 'array', 'addend', 'minuend', 'subtrahend',
]);

/**
 * Analyze vocabulary tiers in text
 */
function analyzeVocabulary(text: string): { tier1: number; tier2: number; tier3: number } {
  const words = text.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z]/g, ''));
  let tier1 = 0;
  let tier2 = 0;
  let tier3 = 0;

  for (const word of words) {
    if (word.length === 0) continue;

    if (TIER_3_MATH_WORDS.has(word)) {
      tier3++;
    } else if (TIER_2_WORDS.has(word)) {
      tier2++;
    } else {
      tier1++;
    }
  }

  return { tier1, tier2, tier3 };
}

/**
 * Analyze sentence complexity
 */
function analyzeSentenceComplexity(text: string): {
  avgLength: number;
  subordinateRatio: number;
  complexityScore: number;
} {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) {
    return { avgLength: 0, subordinateRatio: 0, complexityScore: 0 };
  }

  const subordinateMarkers = /\b(although|because|since|while|when|if|unless|after|before|until|whereas|that|which|who|whom)\b/gi;

  let totalWords = 0;
  let subordinateClauses = 0;

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).filter((w) => w.length > 0);
    totalWords += words.length;

    const matches = sentence.match(subordinateMarkers);
    subordinateClauses += matches?.length || 0;
  }

  const avgLength = totalWords / sentences.length;
  const subordinateRatio = subordinateClauses / sentences.length;

  // Score 0-1 based on complexity
  const lengthScore = Math.min(avgLength / 25, 1);
  const subordinateScore = Math.min(subordinateRatio / 2, 1);
  const complexityScore = (lengthScore + subordinateScore) / 2;

  return { avgLength, subordinateRatio, complexityScore };
}

/**
 * Determine complexity level from score
 */
function scoreToLevel(score: number): ComplexityLevel {
  if (score >= 0.8) return 'exceedinglyComplex';
  if (score >= 0.6) return 'veryComplex';
  if (score >= 0.4) return 'moderatelyComplex';
  if (score >= 0.2) return 'slightlyComplex';
  return 'accessible';
}

/**
 * Grade level to complexity level mapping
 */
function gradeLevelToComplexity(gradeLevel: number): ComplexityLevel {
  if (gradeLevel >= 12) return 'exceedinglyComplex';
  if (gradeLevel >= 9) return 'veryComplex';
  if (gradeLevel >= 6) return 'moderatelyComplex';
  if (gradeLevel >= 3) return 'slightlyComplex';
  return 'accessible';
}

// ============================================
// Main Evaluator Functions
// ============================================

/**
 * Evaluate text complexity using SCASS rubric
 */
export function evaluateTextComplexity(text: string): TextComplexityEvaluation {
  // Calculate Flesch-Kincaid grade level
  const fkGradeLevel = calculateFleschKincaid(text);

  // Analyze vocabulary
  const vocab = analyzeVocabulary(text);
  const totalWords = vocab.tier1 + vocab.tier2 + vocab.tier3;
  const vocabComplexity = totalWords > 0 ? (vocab.tier2 + vocab.tier3 * 2) / totalWords : 0;

  // Analyze sentence complexity
  const sentenceAnalysis = analyzeSentenceComplexity(text);

  // Structure analysis (simplified - would use NLP in production)
  const structureScore = sentenceAnalysis.complexityScore;

  // Language features score
  const languageScore = (vocabComplexity + sentenceAnalysis.complexityScore) / 2;

  // Knowledge demands (estimated from vocabulary)
  const knowledgeScore = totalWords > 0 ? vocab.tier3 / totalWords : 0;

  // Meaning/purpose (estimated from sentence complexity and connectives)
  const meaningScore = sentenceAnalysis.subordinateRatio / 2;

  // Overall score
  const overallScore = (structureScore + languageScore + knowledgeScore + meaningScore) / 4;

  return {
    overallLevel: scoreToLevel(overallScore),
    dimensions: {
      structure: scoreToLevel(structureScore),
      languageFeatures: scoreToLevel(languageScore),
      knowledgeDemands: scoreToLevel(knowledgeScore),
      meaningPurpose: scoreToLevel(meaningScore),
    },
    gradeLevel: Math.round(fkGradeLevel).toString(),
    confidence: 0.7, // Moderate confidence for algorithmic analysis
    rationale: `Text analyzed at grade level ${fkGradeLevel.toFixed(1)}. ` +
      `Vocabulary: ${vocab.tier2 + vocab.tier3} academic/technical words out of ${totalWords}. ` +
      `Average sentence length: ${sentenceAnalysis.avgLength.toFixed(1)} words.`,
  };
}

/**
 * Full literacy evaluation
 */
export function evaluateLiteracy(text: string, targetGradeLevel?: string): LiteracyEvaluation {
  const textComplexity = evaluateTextComplexity(text);
  const vocab = analyzeVocabulary(text);
  const sentenceAnalysis = analyzeSentenceComplexity(text);
  const totalWords = vocab.tier1 + vocab.tier2 + vocab.tier3;

  // Calculate appropriateness for target grade
  let appropriatenessScore = 1.0;
  if (targetGradeLevel) {
    const targetGrade = parseInt(targetGradeLevel, 10);
    const actualGrade = parseInt(textComplexity.gradeLevel, 10);
    const diff = Math.abs(targetGrade - actualGrade);
    appropriatenessScore = Math.max(0, 1 - diff * 0.2);
  }

  const recommendations: string[] = [];

  // Generate recommendations based on analysis
  if (sentenceAnalysis.avgLength > 20) {
    recommendations.push('Consider breaking long sentences into shorter ones for clarity.');
  }

  if (vocab.tier3 > totalWords * 0.1) {
    recommendations.push('High use of domain-specific vocabulary. Ensure terms are introduced with definitions.');
  }

  if (vocab.tier2 < totalWords * 0.05) {
    recommendations.push('Consider incorporating more academic vocabulary to build language skills.');
  }

  return {
    textComplexity,
    vocabularyLevel: {
      tier1Words: vocab.tier1,
      tier2Words: vocab.tier2,
      tier3Words: vocab.tier3,
      appropriatenessScore,
    },
    sentenceComplexity: {
      averageLength: sentenceAnalysis.avgLength,
      subordinateClauseRatio: sentenceAnalysis.subordinateRatio,
      complexityScore: sentenceAnalysis.complexityScore,
    },
    recommendations,
  };
}

/**
 * Evaluate content for student motivation support
 * Based on growth mindset and motivation research
 */
export function evaluateMotivation(text: string): MotivationEvaluation {
  const lowerText = text.toLowerCase();
  const feedback: string[] = [];

  // Growth mindset indicators
  const growthMindsetPhrases = [
    'yet', 'learning', 'improve', 'practice', 'effort', 'strategy', 'try again',
    'mistake is', 'mistakes help', 'challenge', 'grow', 'develop', 'progress',
  ];
  let growthMindsetCount = 0;
  for (const phrase of growthMindsetPhrases) {
    if (lowerText.includes(phrase)) growthMindsetCount++;
  }
  const growthMindsetSupport = Math.min(growthMindsetCount / 5, 1);

  if (growthMindsetSupport < 0.4) {
    feedback.push('Consider adding language that emphasizes effort and growth (e.g., "not yet", "keep practicing").');
  }

  // Autonomy support indicators
  const autonomyPhrases = [
    'choose', 'option', 'decide', 'your choice', 'you can', 'you might', 'would you like',
  ];
  let autonomyCount = 0;
  for (const phrase of autonomyPhrases) {
    if (lowerText.includes(phrase)) autonomyCount++;
  }
  const autonomySupport = Math.min(autonomyCount / 3, 1);

  if (autonomySupport < 0.3) {
    feedback.push('Consider offering choices or options to support student autonomy.');
  }

  // Relevance clarity
  const relevancePhrases = [
    'because', 'helps you', 'use this', 'real life', 'example', 'when you', 'important for',
  ];
  let relevanceCount = 0;
  for (const phrase of relevancePhrases) {
    if (lowerText.includes(phrase)) relevanceCount++;
  }
  const relevanceClarity = Math.min(relevanceCount / 3, 1);

  if (relevanceClarity < 0.3) {
    feedback.push('Consider explaining why this skill is important or how it connects to real life.');
  }

  // Achievability cues
  const achievabilityPhrases = [
    'step', 'first', 'start', 'begin', 'simple', 'easy', 'you know', 'already',
    'break down', 'one at a time',
  ];
  let achievabilityCount = 0;
  for (const phrase of achievabilityPhrases) {
    if (lowerText.includes(phrase)) achievabilityCount++;
  }
  const achievabilityCues = Math.min(achievabilityCount / 4, 1);

  if (achievabilityCues < 0.3) {
    feedback.push('Consider breaking the task into smaller steps to make it feel more achievable.');
  }

  const overallScore = (growthMindsetSupport + autonomySupport + relevanceClarity + achievabilityCues) / 4;

  return {
    growthMindsetSupport,
    autonomySupport,
    relevanceClarity,
    achievabilityCues,
    overallScore,
    feedback,
  };
}

/**
 * Comprehensive content evaluation
 */
export function evaluateContent(
  text: string,
  options?: {
    targetGradeLevel?: string;
    checkLiteracy?: boolean;
    checkMotivation?: boolean;
    checkStandards?: boolean;
  }
): ContentEvaluation {
  const result: ContentEvaluation = {
    timestamp: new Date().toISOString(),
    evaluatorVersion: '1.0.0',
  };

  if (options?.checkLiteracy !== false) {
    result.literacy = evaluateLiteracy(text, options?.targetGradeLevel);
  }

  if (options?.checkMotivation !== false) {
    result.motivation = evaluateMotivation(text);
  }

  // Standards alignment would require Knowledge Graph integration
  if (options?.checkStandards) {
    result.standardsAlignment = {
      alignedStandards: [],
      alignmentScore: 0,
      gaps: ['Standards alignment requires Knowledge Graph integration'],
    };
  }

  return result;
}

/**
 * Generate improvement suggestions for AI-generated content
 */
export function generateImprovementSuggestions(evaluation: ContentEvaluation): string[] {
  const suggestions: string[] = [];

  if (evaluation.literacy) {
    suggestions.push(...evaluation.literacy.recommendations);
  }

  if (evaluation.motivation) {
    suggestions.push(...evaluation.motivation.feedback);
  }

  if (evaluation.standardsAlignment?.gaps) {
    for (const gap of evaluation.standardsAlignment.gaps) {
      suggestions.push(`Standards gap: ${gap}`);
    }
  }

  return suggestions;
}
