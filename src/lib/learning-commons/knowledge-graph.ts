// Knowledge Graph Service
// Handles loading and querying Learning Commons data
// https://github.com/learning-commons-org/knowledge-graph

import type {
  StandardsFramework,
  StandardsFrameworkItem,
  LearningComponent,
  Relationship,
  LearningProgression,
  MathSkillMapping,
  StandardsCrosswalk,
  RelationshipType,
} from './types';

// In-memory cache for Knowledge Graph data
interface KnowledgeGraphCache {
  frameworks: Map<string, StandardsFramework>;
  standards: Map<string, StandardsFrameworkItem>;
  components: Map<string, LearningComponent>;
  relationships: Map<string, Relationship>;
  loaded: boolean;
}

const cache: KnowledgeGraphCache = {
  frameworks: new Map(),
  standards: new Map(),
  components: new Map(),
  relationships: new Map(),
  loaded: false,
};

// GitHub raw content URLs for Learning Commons data
const DATA_BASE_URL = 'https://raw.githubusercontent.com/learning-commons-org/knowledge-graph/main/data';

/**
 * Load Knowledge Graph data from CSV/JSON files
 * In production, this would fetch from the actual Learning Commons repository
 */
export async function loadKnowledgeGraph(): Promise<void> {
  if (cache.loaded) return;

  try {
    // For now, we'll use the embedded sample data
    // In production, fetch from:
    // - ${DATA_BASE_URL}/StandardsFramework.csv
    // - ${DATA_BASE_URL}/StandardsFrameworkItem.csv
    // - ${DATA_BASE_URL}/LearningComponent.csv
    // - ${DATA_BASE_URL}/Relationships.csv

    // Load sample Common Core math data
    loadSampleMathComponents();
    cache.loaded = true;
  } catch (error) {
    console.error('Error loading Knowledge Graph:', error);
    throw error;
  }
}

/**
 * Sample math learning components based on Learning Commons structure
 * These represent granular skills that underlie Common Core math standards
 */
function loadSampleMathComponents(): void {
  // Common Core Math Framework
  const ccMathFramework: StandardsFramework = {
    uuid: 'fw-ccss-math',
    identifier: 'CCSS.MATH',
    title: 'Common Core State Standards for Mathematics',
    description: 'College and Career Readiness Standards for Mathematics',
    subject: 'Math',
    publisher: 'National Governors Association',
    version: '2010',
  };
  cache.frameworks.set(ccMathFramework.uuid, ccMathFramework);

  // Grade 3-5 Number Operations Learning Components
  const mathComponents: LearningComponent[] = [
    // Place Value Components
    {
      uuid: 'lc-pv-001',
      identifier: 'LC.MATH.PV.3.1',
      label: 'Place Value to Thousands',
      description: 'Understand that digits in each place represent amounts of thousands, hundreds, tens, and ones',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Number and Operations in Base Ten',
      cluster: 'Place Value',
      skillType: 'Conceptual',
      prerequisites: [],
      relatedStandards: ['3.NBT.A.1'],
    },
    {
      uuid: 'lc-pv-002',
      identifier: 'LC.MATH.PV.3.2',
      label: 'Read and Write Numbers to 1000',
      description: 'Read and write whole numbers up to 1000 using base-ten numerals, number names, and expanded form',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Number and Operations in Base Ten',
      cluster: 'Place Value',
      skillType: 'Procedural',
      prerequisites: ['lc-pv-001'],
      relatedStandards: ['3.NBT.A.1'],
    },
    {
      uuid: 'lc-pv-003',
      identifier: 'LC.MATH.PV.3.3',
      label: 'Compare Multi-digit Numbers',
      description: 'Compare two multi-digit numbers based on meanings of the digits using >, =, and < symbols',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Number and Operations in Base Ten',
      cluster: 'Place Value',
      skillType: 'Application',
      prerequisites: ['lc-pv-001', 'lc-pv-002'],
      relatedStandards: ['3.NBT.A.1'],
    },
    // Addition Components
    {
      uuid: 'lc-add-001',
      identifier: 'LC.MATH.ADD.3.1',
      label: 'Addition Facts Fluency',
      description: 'Fluently add within 20 using mental strategies',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Operations and Algebraic Thinking',
      cluster: 'Addition',
      skillType: 'Procedural',
      prerequisites: [],
      relatedStandards: ['3.OA.C.7'],
    },
    {
      uuid: 'lc-add-002',
      identifier: 'LC.MATH.ADD.3.2',
      label: 'Add Within 1000 Without Regrouping',
      description: 'Add multi-digit whole numbers within 1000 when no regrouping is required',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Number and Operations in Base Ten',
      cluster: 'Addition',
      skillType: 'Procedural',
      prerequisites: ['lc-add-001', 'lc-pv-001'],
      relatedStandards: ['3.NBT.A.2'],
    },
    {
      uuid: 'lc-add-003',
      identifier: 'LC.MATH.ADD.3.3',
      label: 'Add Within 1000 With Regrouping',
      description: 'Add multi-digit whole numbers within 1000 using place value strategies including regrouping',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Number and Operations in Base Ten',
      cluster: 'Addition',
      skillType: 'Procedural',
      prerequisites: ['lc-add-002', 'lc-pv-001'],
      relatedStandards: ['3.NBT.A.2'],
    },
    // Subtraction Components
    {
      uuid: 'lc-sub-001',
      identifier: 'LC.MATH.SUB.3.1',
      label: 'Subtraction Facts Fluency',
      description: 'Fluently subtract within 20 using mental strategies',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Operations and Algebraic Thinking',
      cluster: 'Subtraction',
      skillType: 'Procedural',
      prerequisites: ['lc-add-001'],
      relatedStandards: ['3.OA.C.7'],
    },
    {
      uuid: 'lc-sub-002',
      identifier: 'LC.MATH.SUB.3.2',
      label: 'Subtract Within 1000 Without Regrouping',
      description: 'Subtract multi-digit whole numbers within 1000 when no regrouping is required',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Number and Operations in Base Ten',
      cluster: 'Subtraction',
      skillType: 'Procedural',
      prerequisites: ['lc-sub-001', 'lc-pv-001'],
      relatedStandards: ['3.NBT.A.2'],
    },
    {
      uuid: 'lc-sub-003',
      identifier: 'LC.MATH.SUB.3.3',
      label: 'Subtract Within 1000 With Regrouping',
      description: 'Subtract multi-digit whole numbers within 1000 using place value strategies including regrouping',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Number and Operations in Base Ten',
      cluster: 'Subtraction',
      skillType: 'Procedural',
      prerequisites: ['lc-sub-002'],
      relatedStandards: ['3.NBT.A.2'],
    },
    // Multiplication Components
    {
      uuid: 'lc-mult-001',
      identifier: 'LC.MATH.MULT.3.1',
      label: 'Multiplication as Equal Groups',
      description: 'Interpret products of whole numbers as the total number of objects in equal groups',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Operations and Algebraic Thinking',
      cluster: 'Multiplication',
      skillType: 'Conceptual',
      prerequisites: ['lc-add-001'],
      relatedStandards: ['3.OA.A.1'],
    },
    {
      uuid: 'lc-mult-002',
      identifier: 'LC.MATH.MULT.3.2',
      label: 'Multiplication as Arrays',
      description: 'Interpret products using rectangular arrays with rows and columns',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Operations and Algebraic Thinking',
      cluster: 'Multiplication',
      skillType: 'Conceptual',
      prerequisites: ['lc-mult-001'],
      relatedStandards: ['3.OA.A.1'],
    },
    {
      uuid: 'lc-mult-003',
      identifier: 'LC.MATH.MULT.3.3',
      label: 'Multiplication Facts to 10',
      description: 'Know from memory all products of two one-digit numbers',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Operations and Algebraic Thinking',
      cluster: 'Multiplication',
      skillType: 'Procedural',
      prerequisites: ['lc-mult-001', 'lc-mult-002'],
      relatedStandards: ['3.OA.C.7'],
    },
    {
      uuid: 'lc-mult-004',
      identifier: 'LC.MATH.MULT.3.4',
      label: 'Commutative Property of Multiplication',
      description: 'Apply properties of operations: if 6 × 4 = 24 then 4 × 6 = 24',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Operations and Algebraic Thinking',
      cluster: 'Multiplication',
      skillType: 'Conceptual',
      prerequisites: ['lc-mult-003'],
      relatedStandards: ['3.OA.B.5'],
    },
    // Division Components
    {
      uuid: 'lc-div-001',
      identifier: 'LC.MATH.DIV.3.1',
      label: 'Division as Equal Sharing',
      description: 'Interpret quotients as the number of objects in each group when dividing equally',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Operations and Algebraic Thinking',
      cluster: 'Division',
      skillType: 'Conceptual',
      prerequisites: ['lc-mult-001'],
      relatedStandards: ['3.OA.A.2'],
    },
    {
      uuid: 'lc-div-002',
      identifier: 'LC.MATH.DIV.3.2',
      label: 'Division as Equal Groups',
      description: 'Interpret quotients as the number of groups when dividing into groups of a known size',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Operations and Algebraic Thinking',
      cluster: 'Division',
      skillType: 'Conceptual',
      prerequisites: ['lc-div-001'],
      relatedStandards: ['3.OA.A.2'],
    },
    {
      uuid: 'lc-div-003',
      identifier: 'LC.MATH.DIV.3.3',
      label: 'Division Facts from Multiplication',
      description: 'Use multiplication facts to find related division facts',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Operations and Algebraic Thinking',
      cluster: 'Division',
      skillType: 'Procedural',
      prerequisites: ['lc-mult-003', 'lc-div-001'],
      relatedStandards: ['3.OA.C.7'],
    },
    // Fractions Components
    {
      uuid: 'lc-frac-001',
      identifier: 'LC.MATH.FRAC.3.1',
      label: 'Unit Fractions',
      description: 'Understand a fraction 1/b as one part when a whole is partitioned into b equal parts',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Number and Operations - Fractions',
      cluster: 'Fractions',
      skillType: 'Conceptual',
      prerequisites: ['lc-div-001'],
      relatedStandards: ['3.NF.A.1'],
    },
    {
      uuid: 'lc-frac-002',
      identifier: 'LC.MATH.FRAC.3.2',
      label: 'Non-Unit Fractions',
      description: 'Understand a fraction a/b as a parts of size 1/b',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Number and Operations - Fractions',
      cluster: 'Fractions',
      skillType: 'Conceptual',
      prerequisites: ['lc-frac-001'],
      relatedStandards: ['3.NF.A.1'],
    },
    {
      uuid: 'lc-frac-003',
      identifier: 'LC.MATH.FRAC.3.3',
      label: 'Fractions on a Number Line',
      description: 'Represent fractions on a number line diagram',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Number and Operations - Fractions',
      cluster: 'Fractions',
      skillType: 'Procedural',
      prerequisites: ['lc-frac-001', 'lc-frac-002'],
      relatedStandards: ['3.NF.A.2'],
    },
    {
      uuid: 'lc-frac-004',
      identifier: 'LC.MATH.FRAC.3.4',
      label: 'Equivalent Fractions',
      description: 'Explain equivalence of fractions and compare fractions by reasoning about their size',
      subject: 'Math',
      gradeLevel: ['3'],
      domain: 'Number and Operations - Fractions',
      cluster: 'Fractions',
      skillType: 'Conceptual',
      prerequisites: ['lc-frac-002', 'lc-frac-003'],
      relatedStandards: ['3.NF.A.3'],
    },
    // Grade 4 components
    {
      uuid: 'lc-mult-4-001',
      identifier: 'LC.MATH.MULT.4.1',
      label: 'Multiply by 10s and 100s',
      description: 'Multiply a whole number of up to four digits by a one-digit whole number using place value',
      subject: 'Math',
      gradeLevel: ['4'],
      domain: 'Number and Operations in Base Ten',
      cluster: 'Multiplication',
      skillType: 'Procedural',
      prerequisites: ['lc-mult-003', 'lc-pv-001'],
      relatedStandards: ['4.NBT.B.5'],
    },
    {
      uuid: 'lc-mult-4-002',
      identifier: 'LC.MATH.MULT.4.2',
      label: 'Multi-digit Multiplication',
      description: 'Multiply a whole number of up to four digits by a one-digit number using strategies based on place value',
      subject: 'Math',
      gradeLevel: ['4'],
      domain: 'Number and Operations in Base Ten',
      cluster: 'Multiplication',
      skillType: 'Procedural',
      prerequisites: ['lc-mult-4-001'],
      relatedStandards: ['4.NBT.B.5'],
    },
  ];

  // Add all components to cache
  for (const component of mathComponents) {
    cache.components.set(component.uuid, component);
  }

  // Create relationships
  const relationships: Relationship[] = [];
  for (const component of mathComponents) {
    if (component.prerequisites) {
      for (const prereqUuid of component.prerequisites) {
        relationships.push({
          uuid: `rel-${prereqUuid}-${component.uuid}`,
          sourceUuid: prereqUuid,
          targetUuid: component.uuid,
          relationshipType: 'precedes',
        });
      }
    }
  }

  for (const rel of relationships) {
    cache.relationships.set(rel.uuid, rel);
  }
}

// ============================================
// Query Functions
// ============================================

/**
 * Get a learning component by UUID
 */
export function getLearningComponent(uuid: string): LearningComponent | undefined {
  return cache.components.get(uuid);
}

/**
 * Get all learning components
 */
export function getAllLearningComponents(): LearningComponent[] {
  return Array.from(cache.components.values());
}

/**
 * Get learning components by grade level
 */
export function getComponentsByGrade(gradeLevel: string): LearningComponent[] {
  return Array.from(cache.components.values()).filter(
    (c) => c.gradeLevel?.includes(gradeLevel)
  );
}

/**
 * Get learning components by domain
 */
export function getComponentsByDomain(domain: string): LearningComponent[] {
  return Array.from(cache.components.values()).filter(
    (c) => c.domain === domain
  );
}

/**
 * Get learning components by cluster/skill area
 */
export function getComponentsByCluster(cluster: string): LearningComponent[] {
  return Array.from(cache.components.values()).filter(
    (c) => c.cluster === cluster
  );
}

/**
 * Get prerequisites for a learning component
 */
export function getPrerequisites(componentUuid: string): LearningComponent[] {
  const component = cache.components.get(componentUuid);
  if (!component?.prerequisites) return [];

  return component.prerequisites
    .map((uuid) => cache.components.get(uuid))
    .filter((c): c is LearningComponent => c !== undefined);
}

/**
 * Get components that depend on this one (next skills)
 */
export function getDependents(componentUuid: string): LearningComponent[] {
  const dependents: LearningComponent[] = [];

  for (const rel of cache.relationships.values()) {
    if (rel.sourceUuid === componentUuid && rel.relationshipType === 'precedes') {
      const target = cache.components.get(rel.targetUuid);
      if (target) dependents.push(target);
    }
  }

  return dependents;
}

/**
 * Build a learning progression from a component
 */
export function buildLearningProgression(
  startComponentUuid: string,
  maxDepth: number = 5
): LearningProgression | null {
  const startComponent = cache.components.get(startComponentUuid);
  if (!startComponent) return null;

  const components: LearningComponent[] = [startComponent];
  const pathway: string[] = [startComponent.uuid];
  const visited = new Set<string>([startComponent.uuid]);

  // Build backwards (prerequisites)
  function addPrereqs(uuid: string, depth: number) {
    if (depth >= maxDepth) return;
    const prereqs = getPrerequisites(uuid);
    for (const prereq of prereqs) {
      if (!visited.has(prereq.uuid)) {
        visited.add(prereq.uuid);
        components.unshift(prereq);
        pathway.unshift(prereq.uuid);
        addPrereqs(prereq.uuid, depth + 1);
      }
    }
  }

  // Build forwards (next skills)
  function addNextSkills(uuid: string, depth: number) {
    if (depth >= maxDepth) return;
    const nextSkills = getDependents(uuid);
    for (const next of nextSkills) {
      if (!visited.has(next.uuid)) {
        visited.add(next.uuid);
        components.push(next);
        pathway.push(next.uuid);
        addNextSkills(next.uuid, depth + 1);
      }
    }
  }

  addPrereqs(startComponent.uuid, 0);
  addNextSkills(startComponent.uuid, 0);

  return {
    uuid: `prog-${startComponent.uuid}`,
    name: `${startComponent.label} Progression`,
    description: `Learning progression for ${startComponent.label}`,
    subject: startComponent.subject,
    gradeSpan: [...new Set(components.flatMap((c) => c.gradeLevel || []))],
    components,
    pathway,
  };
}

/**
 * Search learning components by keyword
 */
export function searchComponents(query: string): LearningComponent[] {
  const lowerQuery = query.toLowerCase();
  return Array.from(cache.components.values()).filter(
    (c) =>
      c.label.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.domain?.toLowerCase().includes(lowerQuery) ||
      c.cluster?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Map a curriculum skill to learning components
 */
export function mapSkillToComponents(
  skillDescription: string,
  gradeLevel?: string
): MathSkillMapping {
  // Simple keyword matching - in production, use semantic search
  const keywords = skillDescription.toLowerCase().split(/\s+/);

  let candidates = Array.from(cache.components.values());

  if (gradeLevel) {
    candidates = candidates.filter((c) => c.gradeLevel?.includes(gradeLevel));
  }

  const scored = candidates.map((c) => {
    let score = 0;
    const text = `${c.label} ${c.description} ${c.domain} ${c.cluster}`.toLowerCase();
    for (const keyword of keywords) {
      if (text.includes(keyword)) score++;
    }
    return { component: c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const topComponents = scored
    .filter((s) => s.score > 0)
    .slice(0, 3)
    .map((s) => s.component);

  const allPrereqs = new Set<LearningComponent>();
  const allNextSkills = new Set<LearningComponent>();

  for (const comp of topComponents) {
    for (const prereq of getPrerequisites(comp.uuid)) {
      allPrereqs.add(prereq);
    }
    for (const next of getDependents(comp.uuid)) {
      allNextSkills.add(next);
    }
  }

  return {
    curriculumSkill: skillDescription,
    learningComponents: topComponents,
    prerequisites: Array.from(allPrereqs),
    nextSkills: Array.from(allNextSkills),
    commonErrors: [], // Would be populated from error bank
  };
}

/**
 * Get standards crosswalk (Common Core to state standards)
 */
export function getStandardsCrosswalk(
  _standardUuid: string,
  _targetFrameworkUuid: string
): StandardsCrosswalk | null {
  // This would query the relationships to find equivalent standards
  // For now, return null as we don't have state standards loaded
  return null;
}

// Initialize on module load
loadKnowledgeGraph().catch(console.error);
