// EMERGE Intervention Planner - Material Catalog Data
// Master list of materials by curriculum with lesson-specific positions

import type { MaterialCategory, MaterialCurriculum } from '../supabase/types';

export interface MaterialCatalogItem {
  curriculum: MaterialCurriculum;
  category: MaterialCategory;
  name: string;
  description: string;
  quantity_hint?: string;
  is_consumable?: boolean;
  applicable_positions?: string[]; // null = all positions
  sort_order: number;
  is_essential?: boolean;
}

// ===========================================
// WILSON READING SYSTEM MATERIALS
// ===========================================

export const WILSON_MATERIALS: MaterialCatalogItem[] = [
  // Cards - Base materials (all steps)
  {
    curriculum: 'wilson',
    category: 'cards',
    name: 'Sound Cards - Full Deck',
    description: 'Letter-sound correspondence cards for all sounds',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'cards',
    name: 'Syllable Type Cards',
    description: '6 syllable type reference cards (closed, VCe, open, r-controlled, vowel team, C+le)',
    sort_order: 2,
    is_essential: true,
  },
  // Cards - Step-specific
  {
    curriculum: 'wilson',
    category: 'cards',
    name: 'Trick Word Cards - Step 1',
    description: 'Irregular high-frequency words for Step 1 (the, a, is, his, of, as, has, was, to, do)',
    applicable_positions: ['step_1', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6'],
    sort_order: 10,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'cards',
    name: 'Trick Word Cards - Step 2',
    description: 'Irregular high-frequency words for Step 2 (you, your, who, what, when, where, there, were, from, come)',
    applicable_positions: ['step_2', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6'],
    sort_order: 11,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'cards',
    name: 'Trick Word Cards - Step 3',
    description: 'Irregular high-frequency words for Step 3 (said, says, are, or, for, want, put, push, pull, could)',
    applicable_positions: ['step_3', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6'],
    sort_order: 12,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'cards',
    name: 'Word Cards - Substep 1.1',
    description: 'CVC words with short a (cat, sat, mat, bat, hat, ran, man, can, fan, pan)',
    applicable_positions: ['1.1'],
    sort_order: 20,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'cards',
    name: 'Word Cards - Substep 1.2',
    description: 'CVC words with short i (sit, bit, fit, hit, pit, rim, dim, him, kin, pin)',
    applicable_positions: ['1.2'],
    sort_order: 21,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'cards',
    name: 'Word Cards - Substep 1.3',
    description: 'CVC words with short o (hot, pot, lot, not, got, mop, top, pop, hop, cob)',
    applicable_positions: ['1.3'],
    sort_order: 22,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'cards',
    name: 'Word Cards - Substep 1.4',
    description: 'CVC words with short u (sun, run, fun, bun, but, cut, nut, hut, rub, tub)',
    applicable_positions: ['1.4'],
    sort_order: 23,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'cards',
    name: 'Word Cards - Substep 1.5',
    description: 'CVC words with short e (pet, net, bet, set, wet, led, red, bed, fed, hen)',
    applicable_positions: ['1.5'],
    sort_order: 24,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'cards',
    name: 'Word Cards - Substep 1.6',
    description: 'Mixed CVC review cards - all short vowels',
    applicable_positions: ['1.6'],
    sort_order: 25,
    is_essential: true,
  },

  // Manipulatives - Base materials
  {
    curriculum: 'wilson',
    category: 'manipulatives',
    name: 'Sound Tapping Board',
    description: 'For phoneme segmentation - students tap out sounds',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'manipulatives',
    name: 'Magnetic Letter Tiles',
    description: 'Lowercase letter tiles for word building on magnetic board',
    sort_order: 2,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'manipulatives',
    name: 'Magnetic Board',
    description: 'Board for letter tiles - word building activities',
    sort_order: 3,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'manipulatives',
    name: 'Peeling Off Board',
    description: 'For syllable and morpheme work (Steps 4+)',
    applicable_positions: ['step_4', '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', 'step_5', 'step_6'],
    sort_order: 4,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'manipulatives',
    name: 'Dry Erase Boards',
    description: 'Individual student whiteboards for writing practice',
    quantity_hint: '1 per student',
    sort_order: 5,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'manipulatives',
    name: 'Dry Erase Markers',
    description: 'Fine tip markers, multiple colors for vowel/consonant marking',
    quantity_hint: '1 set per student',
    is_consumable: true,
    sort_order: 6,
    is_essential: true,
  },

  // Texts - Step-specific decodables
  {
    curriculum: 'wilson',
    category: 'texts',
    name: 'Wilson Reader Book 1',
    description: 'Decodable reader for Step 1 - CVC words with short vowels',
    applicable_positions: ['step_1', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6'],
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'texts',
    name: 'Wilson Reader Book 2',
    description: 'Decodable reader for Step 2 - Blends and digraphs',
    applicable_positions: ['step_2', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6'],
    sort_order: 2,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'texts',
    name: 'Wilson Reader Book 3',
    description: 'Decodable reader for Step 3 - Closed syllable exceptions',
    applicable_positions: ['step_3', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6'],
    sort_order: 3,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'texts',
    name: 'Fluency Passages - Step 1',
    description: 'Timed fluency practice passages for Step 1 skills',
    applicable_positions: ['step_1', '1.4', '1.5', '1.6'],
    sort_order: 10,
    is_essential: false,
  },
  {
    curriculum: 'wilson',
    category: 'texts',
    name: 'Fluency Passages - Step 2',
    description: 'Timed fluency practice passages for Step 2 skills',
    applicable_positions: ['step_2', '2.4', '2.5', '2.6'],
    sort_order: 11,
    is_essential: false,
  },

  // Workbooks
  {
    curriculum: 'wilson',
    category: 'workbooks',
    name: 'Student Reader Notebook',
    description: 'Wilson student composition notebook for all steps',
    quantity_hint: '1 per student',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'workbooks',
    name: 'Dictation Paper',
    description: 'Lined paper for word and sentence dictation',
    quantity_hint: 'Stack',
    is_consumable: true,
    sort_order: 2,
    is_essential: true,
  },

  // Teacher Materials
  {
    curriculum: 'wilson',
    category: 'teacher',
    name: 'Wilson Instructor Manual',
    description: 'Complete instructor guide with lesson plans',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'wilson',
    category: 'teacher',
    name: 'Lesson Plan Forms',
    description: 'Daily lesson planning templates',
    is_consumable: true,
    sort_order: 2,
    is_essential: false,
  },
  {
    curriculum: 'wilson',
    category: 'teacher',
    name: 'Progress Monitoring Forms',
    description: 'Student progress tracking sheets',
    is_consumable: true,
    sort_order: 3,
    is_essential: true,
  },
];

// ===========================================
// CAMINO A LA LECTURA / DESPEGANDO MATERIALS
// ===========================================

export const CAMINO_MATERIALS: MaterialCatalogItem[] = [
  // Cards - Base materials
  {
    curriculum: 'camino',
    category: 'cards',
    name: 'Tarjetas de Vocales',
    description: 'Vowel cards A, E, I, O, U with images and letter formation guides',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'cards',
    name: 'Tarjetas de Sílabas Directas',
    description: 'CV syllable cards (ma, me, mi, mo, mu, etc.)',
    sort_order: 2,
    is_essential: true,
  },
  // Cards - Phase-specific
  {
    curriculum: 'camino',
    category: 'cards',
    name: 'Tarjetas de Consonantes - Fase 1',
    description: 'Consonant cards for m, p, l, s, t, d',
    applicable_positions: ['phase_1', '1', '2', '3', '4', '5', '6', '7', '8'],
    sort_order: 10,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'cards',
    name: 'Tarjetas de Consonantes - Fase 2',
    description: 'Consonant cards for n, r, c, b, g, f, v, z, j, ñ',
    applicable_positions: ['phase_2', '9', '10', '11', '12', '13', '14', '15', '16'],
    sort_order: 11,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'cards',
    name: 'Tarjetas de Dígrafos - Fase 3',
    description: 'Digraph cards for ch, ll, rr, qu, h',
    applicable_positions: ['phase_3', '17', '18', '19', '20', '21', '22', '23', '24'],
    sort_order: 12,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'cards',
    name: 'Tarjetas de Palabras de Alta Frecuencia',
    description: 'High-frequency Spanish word cards (el, la, es, en, un, una, etc.)',
    sort_order: 20,
    is_essential: true,
  },

  // Manipulatives
  {
    curriculum: 'camino',
    category: 'manipulatives',
    name: 'Cajas Elkonin',
    description: 'Sound boxes for phonemic awareness - 3, 4, and 5 box versions',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'manipulatives',
    name: 'Fichas de Colores',
    description: 'Colored counters for sound mapping (red for vowels, blue for consonants)',
    quantity_hint: '10+ per student',
    sort_order: 2,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'manipulatives',
    name: 'Letras Magnéticas',
    description: 'Spanish magnetic letters including ñ, ll, ch tiles',
    sort_order: 3,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'manipulatives',
    name: 'Ruedas de Sílabas',
    description: 'Rotating syllable combination wheels for blending practice',
    sort_order: 4,
    is_essential: false,
  },
  {
    curriculum: 'camino',
    category: 'manipulatives',
    name: 'Pizarras Individuales',
    description: 'Student whiteboards for writing practice',
    quantity_hint: '1 per student',
    sort_order: 5,
    is_essential: true,
  },

  // Texts - Phase-specific
  {
    curriculum: 'camino',
    category: 'texts',
    name: 'Lecturas Decodificables - Fase 1',
    description: 'Decodable readers for vowels + m, p, l, s, t, d',
    applicable_positions: ['phase_1', '1', '2', '3', '4', '5', '6', '7', '8'],
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'texts',
    name: 'Lecturas Decodificables - Fase 2',
    description: 'Decodable readers for n, r, c, b, g, f, v, z, j, ñ',
    applicable_positions: ['phase_2', '9', '10', '11', '12', '13', '14', '15', '16'],
    sort_order: 2,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'texts',
    name: 'Lecturas Decodificables - Fase 3',
    description: 'Decodable readers for ch, ll, rr, qu, h + blends',
    applicable_positions: ['phase_3', '17', '18', '19', '20', '21', '22', '23', '24'],
    sort_order: 3,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'texts',
    name: 'Lecturas Decodificables - Fase 4',
    description: 'Decodable readers for complex syllables (CVC, CVCC)',
    applicable_positions: ['phase_4', '25', '26', '27', '28', '29', '30', '31', '32'],
    sort_order: 4,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'texts',
    name: 'Lecturas Decodificables - Fase 5',
    description: 'Decodable readers for multisyllabic words',
    applicable_positions: ['phase_5', '33', '34', '35', '36', '37', '38', '39', '40'],
    sort_order: 5,
    is_essential: true,
  },

  // Workbooks
  {
    curriculum: 'camino',
    category: 'workbooks',
    name: 'Cuaderno del Estudiante',
    description: 'EMERGE student workbook with phonics activities',
    quantity_hint: '1 per student',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'workbooks',
    name: 'Hojas de Trazado',
    description: 'Letter formation practice sheets',
    is_consumable: true,
    sort_order: 2,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'workbooks',
    name: 'Papel de Dictado',
    description: 'Lined paper for dictation activities',
    quantity_hint: 'Stack',
    is_consumable: true,
    sort_order: 3,
    is_essential: true,
  },

  // Visuals
  {
    curriculum: 'camino',
    category: 'visuals',
    name: 'Cartel de Vocales',
    description: 'Large vowel poster with images and formation guides',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'visuals',
    name: 'Cartel de Sílabas',
    description: 'Syllable reference chart showing CV combinations',
    sort_order: 2,
    is_essential: true,
  },
  {
    curriculum: 'camino',
    category: 'visuals',
    name: 'Pared de Palabras',
    description: 'Word wall for high-frequency Spanish words',
    sort_order: 3,
    is_essential: false,
  },
];

// ===========================================
// DELTA MATH MATERIALS
// ===========================================

export const DELTA_MATH_MATERIALS: MaterialCatalogItem[] = [
  // Manipulatives - Base materials
  {
    curriculum: 'delta_math',
    category: 'manipulatives',
    name: 'Base-10 Blocks',
    description: 'Units, rods, flats, and cubes for place value work',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'delta_math',
    category: 'manipulatives',
    name: 'Two-Color Counters',
    description: 'Red/yellow counters for modeling operations',
    quantity_hint: '20 per student',
    sort_order: 2,
    is_essential: true,
  },
  {
    curriculum: 'delta_math',
    category: 'manipulatives',
    name: 'Number Lines',
    description: 'Student number lines (0-20, 0-100, open)',
    quantity_hint: '1 set per student',
    sort_order: 3,
    is_essential: true,
  },
  {
    curriculum: 'delta_math',
    category: 'manipulatives',
    name: 'Fraction Tiles',
    description: 'Color-coded fraction pieces (halves through twelfths)',
    applicable_positions: ['3.NF.1', '3.NF.2', '3.NF.3', '4.NF.1', '4.NF.2', '5.NF.1', '5.NF.2'],
    sort_order: 4,
    is_essential: true,
  },
  {
    curriculum: 'delta_math',
    category: 'manipulatives',
    name: 'Fraction Circles',
    description: 'Circular fraction models for comparing and adding',
    applicable_positions: ['3.NF.1', '3.NF.2', '3.NF.3', '4.NF.1', '4.NF.2', '5.NF.1', '5.NF.2'],
    sort_order: 5,
    is_essential: false,
  },
  {
    curriculum: 'delta_math',
    category: 'manipulatives',
    name: 'Multiplication Arrays Cards',
    description: 'Visual array cards for multiplication facts',
    applicable_positions: ['3.OA.1', '3.OA.3', '3.OA.5', '3.OA.7'],
    sort_order: 6,
    is_essential: true,
  },
  {
    curriculum: 'delta_math',
    category: 'manipulatives',
    name: 'Decimal Place Value Disks',
    description: 'Disks for ones, tenths, hundredths',
    applicable_positions: ['4.NF.6', '4.NF.7', '5.NBT.1', '5.NBT.3', '5.NBT.7'],
    sort_order: 7,
    is_essential: true,
  },
  {
    curriculum: 'delta_math',
    category: 'manipulatives',
    name: 'Dry Erase Boards with Grid',
    description: 'Whiteboards with coordinate grid on one side',
    quantity_hint: '1 per student',
    sort_order: 8,
    is_essential: true,
  },

  // Workbooks
  {
    curriculum: 'delta_math',
    category: 'workbooks',
    name: 'Math Intervention Workbook',
    description: 'Student workbook with intervention activities',
    quantity_hint: '1 per student',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'delta_math',
    category: 'workbooks',
    name: 'Graph Paper',
    description: 'Centimeter graph paper for arrays and area models',
    is_consumable: true,
    sort_order: 2,
    is_essential: true,
  },

  // Assessment
  {
    curriculum: 'delta_math',
    category: 'assessment',
    name: 'Math Fact Fluency Probes',
    description: 'Timed fact fluency assessments (add, subtract, multiply, divide)',
    is_consumable: true,
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'delta_math',
    category: 'assessment',
    name: 'Computation Probes',
    description: 'Multi-digit computation assessments',
    is_consumable: true,
    sort_order: 2,
    is_essential: true,
  },

  // Teacher Materials
  {
    curriculum: 'delta_math',
    category: 'teacher',
    name: 'Delta Math Teacher Guide',
    description: 'Intervention lesson plans by standard',
    sort_order: 1,
    is_essential: true,
  },
];

// ===========================================
// WORDGEN MATERIALS
// ===========================================

export const WORDGEN_MATERIALS: MaterialCatalogItem[] = [
  {
    curriculum: 'wordgen',
    category: 'cards',
    name: 'Vocabulary Word Cards',
    description: 'Target vocabulary words with definitions and images',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'wordgen',
    category: 'workbooks',
    name: 'WordGen Student Workbook',
    description: 'Student workbook with vocabulary activities',
    quantity_hint: '1 per student',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'wordgen',
    category: 'texts',
    name: 'WordGen Passage Collection',
    description: 'Reading passages organized by unit',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'wordgen',
    category: 'assessment',
    name: 'Weekly Vocabulary Assessments',
    description: 'End-of-unit vocabulary quizzes',
    is_consumable: true,
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'wordgen',
    category: 'teacher',
    name: 'WordGen Teacher Manual',
    description: 'Complete teacher guide with 5-day lesson plans',
    sort_order: 1,
    is_essential: true,
  },
];

// ===========================================
// AMIRA MATERIALS
// ===========================================

export const AMIRA_MATERIALS: MaterialCatalogItem[] = [
  {
    curriculum: 'amira',
    category: 'technology',
    name: 'Amira App Access',
    description: 'Student login credentials for Amira Learning platform',
    quantity_hint: '1 per student',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'amira',
    category: 'technology',
    name: 'Headphones with Microphone',
    description: 'For Amira reading sessions',
    quantity_hint: '1 per student',
    sort_order: 2,
    is_essential: true,
  },
  {
    curriculum: 'amira',
    category: 'technology',
    name: 'Tablets or Chromebooks',
    description: 'Devices for accessing Amira',
    quantity_hint: '1 per student',
    sort_order: 3,
    is_essential: true,
  },
  {
    curriculum: 'amira',
    category: 'texts',
    name: 'Decodable Readers - Emergent',
    description: 'Print decodables for emergent readers',
    applicable_positions: ['Emergent'],
    sort_order: 1,
    is_essential: false,
  },
  {
    curriculum: 'amira',
    category: 'texts',
    name: 'Decodable Readers - Beginning',
    description: 'Print decodables for beginning readers',
    applicable_positions: ['Beginning'],
    sort_order: 2,
    is_essential: false,
  },
  {
    curriculum: 'amira',
    category: 'texts',
    name: 'Leveled Readers - Transitional',
    description: 'Print readers for transitional level',
    applicable_positions: ['Transitional'],
    sort_order: 3,
    is_essential: false,
  },
  {
    curriculum: 'amira',
    category: 'texts',
    name: 'Leveled Readers - Fluent',
    description: 'Print readers for fluent level',
    applicable_positions: ['Fluent'],
    sort_order: 4,
    is_essential: false,
  },
];

// ===========================================
// DESPEGANDO MATERIALS (Spanish Reading)
// ===========================================

export const DESPEGANDO_MATERIALS: MaterialCatalogItem[] = [
  // Most Despegando materials mirror Camino with slight differences
  {
    curriculum: 'despegando',
    category: 'cards',
    name: 'Tarjetas de Vocales',
    description: 'Vowel cards A, E, I, O, U with images',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'despegando',
    category: 'cards',
    name: 'Tarjetas de Sílabas',
    description: 'Syllable cards for CV combinations',
    sort_order: 2,
    is_essential: true,
  },
  {
    curriculum: 'despegando',
    category: 'manipulatives',
    name: 'Cajas Elkonin',
    description: 'Sound boxes for phonemic awareness',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'despegando',
    category: 'manipulatives',
    name: 'Fichas de Colores',
    description: 'Colored counters for sound mapping',
    quantity_hint: '10+ per student',
    sort_order: 2,
    is_essential: true,
  },
  {
    curriculum: 'despegando',
    category: 'manipulatives',
    name: 'Letras Magnéticas',
    description: 'Spanish magnetic letters including ñ',
    sort_order: 3,
    is_essential: true,
  },
  {
    curriculum: 'despegando',
    category: 'texts',
    name: 'Lecturas Decodificables Despegando',
    description: 'Decodable readers aligned to Despegando scope and sequence',
    sort_order: 1,
    is_essential: true,
  },
  {
    curriculum: 'despegando',
    category: 'workbooks',
    name: 'Cuaderno Despegando',
    description: 'Student workbook for Despegando curriculum',
    quantity_hint: '1 per student',
    sort_order: 1,
    is_essential: true,
  },
];

// ===========================================
// COMBINED EXPORT
// ===========================================

export const ALL_MATERIALS: MaterialCatalogItem[] = [
  ...WILSON_MATERIALS,
  ...CAMINO_MATERIALS,
  ...DELTA_MATH_MATERIALS,
  ...WORDGEN_MATERIALS,
  ...AMIRA_MATERIALS,
  ...DESPEGANDO_MATERIALS,
];

// Helper to get materials by curriculum
export function getMaterialsByCurriculum(curriculum: MaterialCurriculum): MaterialCatalogItem[] {
  return ALL_MATERIALS.filter((m) => m.curriculum === curriculum);
}

// Helper to get materials by category
export function getMaterialsByCategory(
  curriculum: MaterialCurriculum,
  category: MaterialCategory
): MaterialCatalogItem[] {
  return ALL_MATERIALS.filter((m) => m.curriculum === curriculum && m.category === category);
}

// Helper to check if material applies to a position
export function materialAppliesToPosition(
  material: MaterialCatalogItem,
  positionKey: string
): boolean {
  // If no positions specified, material applies to all
  if (!material.applicable_positions) return true;

  // Check if position key matches any applicable position
  return material.applicable_positions.some((ap) => {
    // Exact match
    if (ap === positionKey) return true;
    // Step/phase match (e.g., "step_1" matches "1.1", "1.2", etc.)
    if (ap.startsWith('step_') && positionKey.startsWith(ap.replace('step_', ''))) return true;
    if (ap.startsWith('phase_') && positionKey.startsWith(ap.replace('phase_', ''))) return true;
    return false;
  });
}
