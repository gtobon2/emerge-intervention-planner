// Delta Math Intervention - Standards-based mathematics
// CRA (Concrete-Representational-Abstract) approach
// Integrated with Learning Commons Knowledge Graph for granular skill mapping

import {
  mapSkillToComponents,
  buildLearningProgression,
  getComponentsByCluster,
  searchComponents,
  type LearningComponent,
  type MathSkillMapping,
  type LearningProgression,
} from '../learning-commons';

export interface CRATools {
  concrete: string[];
  representational: string[];
  abstract: string[];
}

export interface MathStandard {
  standard: string;
  description: string;
  skills: string[];
  prerequisite_skills: string[];
  common_errors: string[];
  cra_tools: CRATools;
}

export interface MathDomain {
  domain: string;
  name: string;
  standards: MathStandard[];
}

export interface GradeLevel {
  grade: number;
  domains: MathDomain[];
}

export interface InterventionCycleSession {
  session: number;
  phase: 'concrete' | 'transitional' | 'representational' | 'abstract' | 'mixed' | 'assessment';
  focus: string;
}

export const DELTA_MATH_GRADES: Record<string, GradeLevel> = {
  '3': {
    grade: 3,
    domains: [
      {
        domain: 'NBT',
        name: 'Number & Operations in Base Ten',
        standards: [
          {
            standard: '3.NBT.1',
            description: 'Round whole numbers to nearest 10 or 100',
            skills: ['Place value understanding', 'Number line placement', 'Rounding rules'],
            prerequisite_skills: ['Place value to 1000', 'Number comparison'],
            common_errors: ['Rounding up when should round down', 'Not identifying rounding digit'],
            cra_tools: {
              concrete: ['Number line floor mat', 'Base-10 blocks'],
              representational: ['Open number lines', 'Rounding charts'],
              abstract: ['Rounding rules', 'Mental math']
            }
          },
          {
            standard: '3.NBT.2',
            description: 'Add/subtract within 1000 using strategies and algorithms',
            skills: ['Regrouping in addition', 'Regrouping in subtraction', 'Multiple strategies'],
            prerequisite_skills: ['Place value', 'Basic addition/subtraction facts'],
            common_errors: ['Forgetting to regroup', 'Regrouping errors', 'Subtracting smaller from larger regardless of position'],
            cra_tools: {
              concrete: ['Base-10 blocks', 'Place value mats'],
              representational: ['Place value charts', 'Expanded form'],
              abstract: ['Standard algorithm']
            }
          }
        ]
      },
      {
        domain: 'NF',
        name: 'Number & Operations-Fractions',
        standards: [
          {
            standard: '3.NF.1',
            description: 'Understand fractions as parts of a whole',
            skills: ['Unit fractions', 'Numerator/denominator meaning', 'Fraction notation'],
            prerequisite_skills: ['Equal parts', 'Part-whole relationship'],
            common_errors: ['Confusing numerator and denominator', 'Not making equal parts'],
            cra_tools: {
              concrete: ['Fraction tiles', 'Fraction circles', 'Pattern blocks'],
              representational: ['Area models', 'Number lines'],
              abstract: ['Fraction notation']
            }
          }
        ]
      }
    ]
  },
  '4': {
    grade: 4,
    domains: [
      {
        domain: 'NBT',
        name: 'Number & Operations in Base Ten',
        standards: [
          {
            standard: '4.NBT.4',
            description: 'Add/subtract multi-digit whole numbers using standard algorithm',
            skills: ['Standard addition algorithm', 'Standard subtraction algorithm', 'Regrouping across zeros'],
            prerequisite_skills: ['3.NBT.2', 'Place value to millions'],
            common_errors: ['Regrouping across zeros', 'Alignment errors', 'Computation errors'],
            cra_tools: {
              concrete: ['Base-10 blocks'],
              representational: ['Place value charts', 'Expanded form'],
              abstract: ['Standard algorithm']
            }
          },
          {
            standard: '4.NBT.5',
            description: 'Multiply up to 4-digit by 1-digit, and 2-digit by 2-digit',
            skills: ['Partial products', 'Area model', 'Standard algorithm'],
            prerequisite_skills: ['Multiplication facts', 'Place value'],
            common_errors: ['Place value errors in partial products', 'Forgetting to add partial products'],
            cra_tools: {
              concrete: ['Base-10 blocks', 'Arrays'],
              representational: ['Area model', 'Partial products'],
              abstract: ['Standard algorithm']
            }
          },
          {
            standard: '4.NBT.6',
            description: 'Divide up to 4-digit by 1-digit with remainders',
            skills: ['Partial quotients', 'Standard algorithm', 'Interpreting remainders'],
            prerequisite_skills: ['Division facts', 'Place value', 'Multiplication'],
            common_errors: ['Place value errors in quotient', 'Forgetting to bring down', 'Remainder errors'],
            cra_tools: {
              concrete: ['Base-10 blocks for grouping'],
              representational: ['Partial quotients', 'Arrays'],
              abstract: ['Standard algorithm']
            }
          }
        ]
      },
      {
        domain: 'NF',
        name: 'Number & Operations-Fractions',
        standards: [
          {
            standard: '4.NF.1',
            description: 'Explain equivalent fractions using visual models',
            skills: ['Equivalent fractions', 'Multiplying/dividing by form of 1'],
            prerequisite_skills: ['3.NF.1', 'Basic multiplication'],
            common_errors: ['Adding instead of multiplying', 'Only multiplying numerator or denominator'],
            cra_tools: {
              concrete: ['Fraction bars', 'Fraction circles'],
              representational: ['Area models', 'Number lines'],
              abstract: ['Multiplication method']
            }
          },
          {
            standard: '4.NF.2',
            description: 'Compare fractions with different numerators and denominators',
            skills: ['Common denominators', 'Benchmark fractions', 'Cross multiplication'],
            prerequisite_skills: ['4.NF.1', 'Equivalent fractions'],
            common_errors: ['Comparing numerators without common denominator', 'Thinking larger denominator = larger fraction'],
            cra_tools: {
              concrete: ['Fraction bars side by side'],
              representational: ['Number lines', 'Area models'],
              abstract: ['Common denominator method']
            }
          },
          {
            standard: '4.NF.3c',
            description: 'Add/subtract fractions with like denominators',
            skills: ['Adding numerators', 'Keeping common denominator', 'Simplifying'],
            prerequisite_skills: ['Fraction meaning', 'Basic addition/subtraction'],
            common_errors: ['Adding denominators too', 'Not simplifying'],
            cra_tools: {
              concrete: ['Fraction bars'],
              representational: ['Area models', 'Number lines'],
              abstract: ['Procedure']
            }
          },
          {
            standard: '4.NF.4b',
            description: 'Multiply a fraction by a whole number',
            skills: ['Repeated addition model', 'Multiplication of fractions'],
            prerequisite_skills: ['4.NF.3', 'Multiplication meaning'],
            common_errors: ['Multiplying denominator too', 'Expecting product to be larger'],
            cra_tools: {
              concrete: ['Fraction bars'],
              representational: ['Area models', 'Repeated addition'],
              abstract: ['Multiplication procedure']
            }
          }
        ]
      }
    ]
  },
  '5': {
    grade: 5,
    domains: [
      {
        domain: 'NBT',
        name: 'Number & Operations in Base Ten',
        standards: [
          {
            standard: '5.NBT.1',
            description: 'Recognize place value patterns (10x relationship)',
            skills: ['Powers of 10', 'Place value relationships', 'Decimal place value'],
            prerequisite_skills: ['4.NBT place value', 'Multiplication by 10'],
            common_errors: ['Not recognizing decimal patterns', 'Confusion with zero placeholders'],
            cra_tools: {
              concrete: ['Base-10 blocks including flats for decimals'],
              representational: ['Place value charts', 'Patterns'],
              abstract: ['Powers of 10 notation']
            }
          },
          {
            standard: '5.NBT.3',
            description: 'Read, write, compare decimals to thousandths',
            skills: ['Decimal place value', 'Decimal comparison', 'Decimal equivalence'],
            prerequisite_skills: ['Fraction-decimal connection', '4th grade decimals'],
            common_errors: ['Longer decimal = larger', 'Treating decimals as whole numbers'],
            cra_tools: {
              concrete: ['Decimats (10x10 grids)', 'Money'],
              representational: ['Place value charts', 'Number lines'],
              abstract: ['Comparison symbols']
            }
          },
          {
            standard: '5.NBT.7',
            description: 'Add, subtract, multiply, divide decimals to hundredths',
            skills: ['Decimal operations', 'Place value alignment', 'Estimation'],
            prerequisite_skills: ['5.NBT.3', 'Whole number operations'],
            common_errors: ['Misaligning decimal points', 'Ignoring decimal in multiplication'],
            cra_tools: {
              concrete: ['Decimats', 'Money'],
              representational: ['Area models', 'Number lines'],
              abstract: ['Standard algorithms with decimals']
            }
          }
        ]
      },
      {
        domain: 'NF',
        name: 'Number & Operations-Fractions',
        standards: [
          {
            standard: '5.NF.1',
            description: 'Add/subtract fractions with unlike denominators',
            skills: ['Finding common denominators', 'Equivalent fractions', 'Adding/subtracting'],
            prerequisite_skills: ['4.NF.1', '4.NF.3c'],
            common_errors: ['Adding without common denominator', 'Adding denominators'],
            cra_tools: {
              concrete: ['Fraction bars'],
              representational: ['Area models', 'Number lines'],
              abstract: ['LCD procedure']
            }
          },
          {
            standard: '5.NF.4',
            description: 'Multiply fractions and whole numbers',
            skills: ['Fraction x whole number', 'Fraction x fraction', 'Area model for fractions'],
            prerequisite_skills: ['4.NF.4', 'Fraction meaning'],
            common_errors: ['Expecting larger product', 'Multiplying denominators incorrectly'],
            cra_tools: {
              concrete: ['Fraction bars', 'Paper folding'],
              representational: ['Area models'],
              abstract: ['Multiplication procedure']
            }
          },
          {
            standard: '5.NF.7',
            description: 'Divide unit fractions and whole numbers',
            skills: ['Whole number / unit fraction', 'Unit fraction / whole number'],
            prerequisite_skills: ['Division meaning', 'Fraction understanding'],
            common_errors: ['Inverting wrong number', 'Not understanding "how many X fit in Y"'],
            cra_tools: {
              concrete: ['Fraction bars', 'Measurement contexts'],
              representational: ['Number lines', 'Visual models'],
              abstract: ['Reciprocal method']
            }
          }
        ]
      }
    ]
  }
};

// 8-session intervention cycle per standard
export const INTERVENTION_CYCLE: InterventionCycleSession[] = [
  { session: 1, phase: 'concrete', focus: 'Diagnostic & introduce with manipulatives' },
  { session: 2, phase: 'concrete', focus: 'Hands-on practice with manipulatives' },
  { session: 3, phase: 'transitional', focus: 'Concrete to representational bridge' },
  { session: 4, phase: 'representational', focus: 'Visual models and diagrams' },
  { session: 5, phase: 'transitional', focus: 'Representational to abstract bridge' },
  { session: 6, phase: 'abstract', focus: 'Procedural fluency' },
  { session: 7, phase: 'mixed', focus: 'Mixed practice and word problems' },
  { session: 8, phase: 'assessment', focus: 'Post-assess and identify remaining gaps' }
];

// Helper functions
export function getMathStandard(standardCode: string): (MathStandard & { grade: number; domainName: string }) | undefined {
  for (const [gradeKey, gradeData] of Object.entries(DELTA_MATH_GRADES)) {
    for (const domain of gradeData.domains) {
      const standard = domain.standards.find(s => s.standard === standardCode);
      if (standard) {
        return { ...standard, grade: gradeData.grade, domainName: domain.name };
      }
    }
  }
  return undefined;
}

export function getStandardsForGrade(grade: number): MathStandard[] {
  const gradeData = DELTA_MATH_GRADES[grade.toString()];
  if (!gradeData) return [];

  return gradeData.domains.flatMap(domain => domain.standards);
}

export function getCycleSessionInfo(sessionNumber: number): InterventionCycleSession | undefined {
  return INTERVENTION_CYCLE.find(s => s.session === sessionNumber);
}

export function getStandardLabel(standard: string): string {
  const data = getMathStandard(standard);
  if (data) {
    return `${standard}: ${data.description}`;
  }
  return standard;
}

// ============================================
// Learning Commons Integration
// ============================================

/**
 * Map a Delta Math standard to Learning Commons components
 * This provides granular skill breakdown for more precise intervention planning
 */
export function mapStandardToLearningComponents(standardCode: string): MathSkillMapping | null {
  const standard = getMathStandard(standardCode);
  if (!standard) return null;

  // Build search query from standard info
  const searchQuery = `${standard.description} ${standard.skills.join(' ')}`;
  const gradeLevel = standard.grade.toString();

  return mapSkillToComponents(searchQuery, gradeLevel);
}

/**
 * Get a learning progression for a standard's core skill
 */
export function getStandardProgression(standardCode: string): LearningProgression | null {
  const mapping = mapStandardToLearningComponents(standardCode);
  if (!mapping || mapping.learningComponents.length === 0) return null;

  // Build progression from the primary learning component
  const primaryComponent = mapping.learningComponents[0];
  return buildLearningProgression(primaryComponent.uuid, 5);
}

/**
 * Find prerequisite skills from Learning Commons that aren't in the standard
 */
export function identifySkillGaps(standardCode: string): LearningComponent[] {
  const mapping = mapStandardToLearningComponents(standardCode);
  if (!mapping) return [];

  return mapping.prerequisites;
}

/**
 * Get related Learning Components by skill cluster
 */
export function getRelatedComponentsByCluster(standardCode: string): LearningComponent[] {
  const standard = getMathStandard(standardCode);
  if (!standard) return [];

  // Determine cluster from standard domain
  const clusterMap: Record<string, string[]> = {
    'NBT': ['Place Value', 'Addition', 'Subtraction', 'Multiplication'],
    'NF': ['Fractions'],
    'OA': ['Addition', 'Subtraction', 'Multiplication', 'Division'],
  };

  const domainPrefix = standardCode.split('.')[1]; // e.g., "NBT" from "3.NBT.1"
  const clusters = clusterMap[domainPrefix] || [];

  const components: LearningComponent[] = [];
  for (const cluster of clusters) {
    components.push(...getComponentsByCluster(cluster));
  }

  return components;
}

/**
 * Search Learning Commons for skills related to a standard's error patterns
 */
export function findRemediationComponents(standardCode: string): LearningComponent[] {
  const standard = getMathStandard(standardCode);
  if (!standard) return [];

  // Search for components related to common error patterns
  const results: LearningComponent[] = [];

  for (const error of standard.common_errors) {
    const components = searchComponents(error);
    for (const comp of components) {
      if (!results.find(r => r.uuid === comp.uuid)) {
        results.push(comp);
      }
    }
  }

  return results;
}

/**
 * Get a comprehensive skill analysis for intervention planning
 */
export interface StandardSkillAnalysis {
  standard: MathStandard & { grade: number; domainName: string };
  learningComponents: LearningComponent[];
  prerequisites: LearningComponent[];
  nextSkills: LearningComponent[];
  relatedComponents: LearningComponent[];
  remediationComponents: LearningComponent[];
  progression: LearningProgression | null;
}

export function analyzeStandardSkills(standardCode: string): StandardSkillAnalysis | null {
  const standard = getMathStandard(standardCode);
  if (!standard) return null;

  const mapping = mapStandardToLearningComponents(standardCode);

  return {
    standard,
    learningComponents: mapping?.learningComponents || [],
    prerequisites: mapping?.prerequisites || [],
    nextSkills: mapping?.nextSkills || [],
    relatedComponents: getRelatedComponentsByCluster(standardCode),
    remediationComponents: findRemediationComponents(standardCode),
    progression: getStandardProgression(standardCode),
  };
}
