// Despegando - Spanish Reading Intervention (Steps 1-5)
// Complete curriculum sequence for Spanish phonics instruction
// Based on CaminoALaLectura scope and sequence
// 40 Lessons across 5 Phases (1 school year)

export interface DespegandoLesson {
  lesson: number;
  name: string;
  nameSpanish: string;
  skills: string[];
  syllables: string[];
  sampleWords: string[];
  paFocus: string;
  emergeValue: string;
  lessonType: 'new_letter' | 'vowels_intro' | 'review' | 'assessment' | 'digraph' | 'blend' | 'advanced';
}

export interface DespegandoPhase {
  phase: number;
  name: string;
  nameSpanish: string;
  focus: string;
  lessons: DespegandoLesson[];
}

export interface DespegandoPosition {
  phase: number;
  lesson: number;
}

// Lesson components for Despegando (Spanish intervention structure)
export const DESPEGANDO_LESSON_COMPONENTS = [
  { part: 1, name: 'Syllable Warm-up', nameSpanish: 'Calentamiento de Sílabas', duration_minutes: 2, description: 'Quick review of CV syllables' },
  { part: 2, name: 'Sound/Letter Review', nameSpanish: 'Repaso de Sonido/Letra', duration_minutes: 5, description: 'Sound-symbol correspondence for new letter' },
  { part: 3, name: 'Elkonin Boxes', nameSpanish: 'Cajas de Sonidos', duration_minutes: 5, description: 'Sound segmentation with boxes' },
  { part: 4, name: 'Syllable Reading', nameSpanish: 'Lectura de Sílabas', duration_minutes: 5, description: 'Read CV syllables with new letter' },
  { part: 5, name: 'Word Reading', nameSpanish: 'Lectura de Palabras', duration_minutes: 5, description: 'Read real words with current patterns' },
  { part: 6, name: 'Sentence Reading', nameSpanish: 'Lectura de Oraciones', duration_minutes: 5, description: 'Read controlled sentences' },
  { part: 7, name: 'Dictation', nameSpanish: 'Dictado', duration_minutes: 8, description: 'Write syllables and words from dictation' },
  { part: 8, name: 'Decodable Text', nameSpanish: 'Texto Decodificable', duration_minutes: 10, description: 'Read connected decodable text' },
];

// Complete Despegando curriculum - 5 Phases, 40 Lessons
export const DESPEGANDO_PHASES: DespegandoPhase[] = [
  {
    phase: 1,
    name: 'Vowels & First Consonants',
    nameSpanish: 'Vocales y Primeras Consonantes',
    focus: 'Master vowels and 6 high-frequency consonants (m, p, s, l, t, d)',
    lessons: [
      {
        lesson: 1,
        name: 'Vowels Introduction',
        nameSpanish: 'Introducción a las Vocales',
        skills: ['Vowel identification: a, e, i, o, u', 'Vowel sounds', 'Letter-sound correspondence'],
        syllables: ['a', 'e', 'i', 'o', 'u'],
        sampleWords: ['ojo', 'oso', 'ala', 'asa', 'uno'],
        paFocus: 'Vowel identification',
        emergeValue: 'Expression',
        lessonType: 'vowels_intro'
      },
      {
        lesson: 2,
        name: 'Letter M',
        nameSpanish: 'Letra M',
        skills: ['Letter m sound /m/', 'CV syllables with m', 'Blending ma-me-mi-mo-mu'],
        syllables: ['ma', 'me', 'mi', 'mo', 'mu'],
        sampleWords: ['mamá', 'mapa', 'mía', 'mula', 'mesa'],
        paFocus: 'Syllable blending',
        emergeValue: 'Empathy',
        lessonType: 'new_letter'
      },
      {
        lesson: 3,
        name: 'Letter P',
        nameSpanish: 'Letra P',
        skills: ['Letter p sound /p/', 'CV syllables with p', 'Blending pa-pe-pi-po-pu'],
        syllables: ['pa', 'pe', 'pi', 'po', 'pu'],
        sampleWords: ['papá', 'puma', 'pipa', 'Pepe', 'palo'],
        paFocus: 'Syllable segmenting',
        emergeValue: 'Mindfulness',
        lessonType: 'new_letter'
      },
      {
        lesson: 4,
        name: 'Letter S',
        nameSpanish: 'Letra S',
        skills: ['Letter s sound /s/', 'CV syllables with s', 'Blending sa-se-si-so-su'],
        syllables: ['sa', 'se', 'si', 'so', 'su'],
        sampleWords: ['sopa', 'mesa', 'asa', 'suma', 'sol'],
        paFocus: 'Initial sound isolation',
        emergeValue: 'Resilience',
        lessonType: 'new_letter'
      },
      {
        lesson: 5,
        name: 'Review M, P, S',
        nameSpanish: 'Repaso M, P, S',
        skills: ['Review m, p, s syllables', 'Mixed syllable reading', '2-syllable word decoding'],
        syllables: ['ma', 'me', 'mi', 'mo', 'mu', 'pa', 'pe', 'pi', 'po', 'pu', 'sa', 'se', 'si', 'so', 'su'],
        sampleWords: ['mapa', 'pasa', 'mesa', 'sopa', 'suma'],
        paFocus: 'Syllable manipulation',
        emergeValue: 'Growth',
        lessonType: 'review'
      },
      {
        lesson: 6,
        name: 'Letter L',
        nameSpanish: 'Letra L',
        skills: ['Letter l sound /l/', 'CV syllables with l', 'Blending la-le-li-lo-lu'],
        syllables: ['la', 'le', 'li', 'lo', 'lu'],
        sampleWords: ['loma', 'lima', 'lupa', 'pelo', 'luna'],
        paFocus: 'Final sound isolation',
        emergeValue: 'Expression',
        lessonType: 'new_letter'
      },
      {
        lesson: 7,
        name: 'Letter T',
        nameSpanish: 'Letra T',
        skills: ['Letter t sound /t/', 'CV syllables with t', 'Blending ta-te-ti-to-tu'],
        syllables: ['ta', 'te', 'ti', 'to', 'tu'],
        sampleWords: ['tapa', 'toma', 'tela', 'ata', 'pato'],
        paFocus: 'Phoneme blending',
        emergeValue: 'Empathy',
        lessonType: 'new_letter'
      },
      {
        lesson: 8,
        name: 'Letter D',
        nameSpanish: 'Letra D',
        skills: ['Letter d sound /d/', 'CV syllables with d', 'Blending da-de-di-do-du'],
        syllables: ['da', 'de', 'di', 'do', 'du'],
        sampleWords: ['dedo', 'día', 'soda', 'lodo', 'dama'],
        paFocus: 'Phoneme segmenting',
        emergeValue: 'Mindfulness',
        lessonType: 'new_letter'
      },
      {
        lesson: 9,
        name: 'Review L, T, D',
        nameSpanish: 'Repaso L, T, D',
        skills: ['Review l, t, d syllables', 'Multi-syllabic words', '3-syllable decoding'],
        syllables: ['la', 'le', 'li', 'lo', 'lu', 'ta', 'te', 'ti', 'to', 'tu', 'da', 'de', 'di', 'do', 'du'],
        sampleWords: ['pelota', 'semilla', 'patata', 'paleta', 'tomate'],
        paFocus: 'Phoneme manipulation',
        emergeValue: 'Resilience',
        lessonType: 'review'
      },
      {
        lesson: 10,
        name: 'Unit 1 Assessment',
        nameSpanish: 'Evaluación Unidad 1',
        skills: ['All vowels', 'Letters m, p, s, l, t, d', '30 CV syllables', '2-3 syllable words'],
        syllables: ['All Phase 1 syllables'],
        sampleWords: ['Assessment words'],
        paFocus: 'Full PA battery',
        emergeValue: 'Growth',
        lessonType: 'assessment'
      }
    ]
  },
  {
    phase: 2,
    name: 'Additional Consonants',
    nameSpanish: 'Consonantes Adicionales',
    focus: 'Expand to full alphabet with n, r, c, b, g, f, v, z, j, ñ',
    lessons: [
      {
        lesson: 11,
        name: 'Letter N',
        nameSpanish: 'Letra N',
        skills: ['Letter n sound /n/', 'CV syllables with n', 'Blending na-ne-ni-no-nu'],
        syllables: ['na', 'ne', 'ni', 'no', 'nu'],
        sampleWords: ['nena', 'mano', 'luna', 'uno', 'nido'],
        paFocus: 'Rhyming',
        emergeValue: 'Expression',
        lessonType: 'new_letter'
      },
      {
        lesson: 12,
        name: 'Letter R (Simple)',
        nameSpanish: 'Letra R (Suave)',
        skills: ['Letter r sound /r/', 'Single r between vowels', 'CV syllables with r'],
        syllables: ['ra', 're', 'ri', 'ro', 'ru'],
        sampleWords: ['ratón', 'pera', 'río', 'caro', 'rosa'],
        paFocus: 'Sound matching',
        emergeValue: 'Empathy',
        lessonType: 'new_letter'
      },
      {
        lesson: 13,
        name: 'Letter C (Hard)',
        nameSpanish: 'Letra C (Fuerte)',
        skills: ['Hard c sound /k/ with a, o, u', 'CV syllables ca, co, cu'],
        syllables: ['ca', 'co', 'cu'],
        sampleWords: ['casa', 'poco', 'cuna', 'cola', 'cama'],
        paFocus: 'Syllable deletion',
        emergeValue: 'Mindfulness',
        lessonType: 'new_letter'
      },
      {
        lesson: 14,
        name: 'Letter C (Soft)',
        nameSpanish: 'Letra C (Suave)',
        skills: ['Soft c sound /s/ with e, i', 'CV syllables ce, ci'],
        syllables: ['ce', 'ci'],
        sampleWords: ['cena', 'cine', 'dulce', 'circo', 'cinco'],
        paFocus: 'Syllable addition',
        emergeValue: 'Resilience',
        lessonType: 'new_letter'
      },
      {
        lesson: 15,
        name: 'Review N, R, C',
        nameSpanish: 'Repaso N, R, C',
        skills: ['Review n, r, c syllables', 'Hard vs soft c distinction', 'Multi-syllabic words'],
        syllables: ['na', 'ne', 'ni', 'no', 'nu', 'ra', 're', 'ri', 'ro', 'ru', 'ca', 'ce', 'ci', 'co', 'cu'],
        sampleWords: ['corona', 'canela', 'perico', 'cocina', 'naranja'],
        paFocus: 'Blending',
        emergeValue: 'Growth',
        lessonType: 'review'
      },
      {
        lesson: 16,
        name: 'Letter B',
        nameSpanish: 'Letra B',
        skills: ['Letter b sound /b/', 'CV syllables with b', 'Blending ba-be-bi-bo-bu'],
        syllables: ['ba', 'be', 'bi', 'bo', 'bu'],
        sampleWords: ['boca', 'lobo', 'Cuba', 'bebé', 'bata'],
        paFocus: 'Segmenting',
        emergeValue: 'Expression',
        lessonType: 'new_letter'
      },
      {
        lesson: 17,
        name: 'Letter G (Hard)',
        nameSpanish: 'Letra G (Fuerte)',
        skills: ['Hard g sound /g/ with a, o, u', 'CV syllables ga, go, gu'],
        syllables: ['ga', 'go', 'gu'],
        sampleWords: ['gato', 'lago', 'águila', 'goma', 'gusano'],
        paFocus: 'Sound substitution',
        emergeValue: 'Empathy',
        lessonType: 'new_letter'
      },
      {
        lesson: 18,
        name: 'Letters F, V',
        nameSpanish: 'Letras F, V',
        skills: ['Letter f sound /f/', 'Letter v sound /b/', 'CV syllables with f and v'],
        syllables: ['fa', 'fe', 'fi', 'fo', 'fu', 'va', 've', 'vi', 'vo', 'vu'],
        sampleWords: ['foca', 'café', 'vaca', 'uva', 'foto'],
        paFocus: 'Phoneme deletion',
        emergeValue: 'Mindfulness',
        lessonType: 'new_letter'
      },
      {
        lesson: 19,
        name: 'Letters Z, J, Ñ',
        nameSpanish: 'Letras Z, J, Ñ',
        skills: ['Letter z sound /s/', 'Letter j sound /h/', 'Letter ñ sound /ny/'],
        syllables: ['za', 'ze', 'zi', 'zo', 'zu', 'ja', 'je', 'ji', 'jo', 'ju', 'ña', 'ñe', 'ñi', 'ño', 'ñu'],
        sampleWords: ['zapato', 'jugo', 'niño', 'José', 'piña'],
        paFocus: 'Phoneme addition',
        emergeValue: 'Resilience',
        lessonType: 'new_letter'
      },
      {
        lesson: 20,
        name: 'Unit 2 Assessment',
        nameSpanish: 'Evaluación Unidad 2',
        skills: ['Complete Spanish alphabet', 'All basic CV syllables', '3-syllable words', 'Hard vs soft c/g'],
        syllables: ['All Phase 2 syllables'],
        sampleWords: ['Assessment words'],
        paFocus: 'Full review',
        emergeValue: 'Growth',
        lessonType: 'assessment'
      }
    ]
  },
  {
    phase: 3,
    name: 'Digraphs & Special Letters',
    nameSpanish: 'Dígrafos y Letras Especiales',
    focus: 'Master Spanish digraphs (ch, ll, rr, qu) and silent h',
    lessons: [
      {
        lesson: 21,
        name: 'Digraph CH',
        nameSpanish: 'Dígrafo CH',
        skills: ['Digraph ch sound /ch/', 'CV syllables with ch', 'Ch as single unit'],
        syllables: ['cha', 'che', 'chi', 'cho', 'chu'],
        sampleWords: ['chico', 'leche', 'noche', 'mucho', 'ocho'],
        paFocus: 'Ch sound isolation',
        emergeValue: 'Expression',
        lessonType: 'digraph'
      },
      {
        lesson: 22,
        name: 'Digraph LL',
        nameSpanish: 'Dígrafo LL',
        skills: ['Digraph ll sound /y/', 'CV syllables with ll', 'Ll vs L distinction'],
        syllables: ['lla', 'lle', 'lli', 'llo', 'llu'],
        sampleWords: ['llama', 'calle', 'pollo', 'silla', 'ella'],
        paFocus: 'Ll vs L distinction',
        emergeValue: 'Empathy',
        lessonType: 'digraph'
      },
      {
        lesson: 23,
        name: 'Digraph RR',
        nameSpanish: 'Dígrafo RR',
        skills: ['Digraph rr sound (trilled)', 'CV syllables with rr', 'Rr vs R distinction'],
        syllables: ['rra', 'rre', 'rri', 'rro', 'rru'],
        sampleWords: ['perro', 'carro', 'torre', 'borra', 'arroz'],
        paFocus: 'Rr vs R distinction',
        emergeValue: 'Mindfulness',
        lessonType: 'digraph'
      },
      {
        lesson: 24,
        name: 'QU Combination',
        nameSpanish: 'Combinación QU',
        skills: ['Qu sound /k/', 'Que, qui syllables', 'Silent u in qu'],
        syllables: ['que', 'qui'],
        sampleWords: ['queso', 'paquete', 'quito', 'pequeño', 'quema'],
        paFocus: 'Qu pattern',
        emergeValue: 'Resilience',
        lessonType: 'digraph'
      },
      {
        lesson: 25,
        name: 'Review CH, LL, RR, QU',
        nameSpanish: 'Repaso CH, LL, RR, QU',
        skills: ['All digraphs review', 'Multi-syllabic words with digraphs', 'Digraph blending'],
        syllables: ['cha', 'che', 'chi', 'cho', 'chu', 'lla', 'lle', 'lli', 'llo', 'llu', 'rra', 'rre', 'rri', 'rro', 'rru', 'que', 'qui'],
        sampleWords: ['mochila', 'tortilla', 'perrito', 'chaqueta', 'quesadilla'],
        paFocus: 'Digraph blending',
        emergeValue: 'Growth',
        lessonType: 'review'
      },
      {
        lesson: 26,
        name: 'Silent H',
        nameSpanish: 'H Muda',
        skills: ['Silent h recognition', 'Words beginning with h', 'H never pronounced'],
        syllables: ['ha', 'he', 'hi', 'ho', 'hu'],
        sampleWords: ['hola', 'ahora', 'hilo', 'hora', 'huevo'],
        paFocus: 'Silent letter awareness',
        emergeValue: 'Expression',
        lessonType: 'new_letter'
      },
      {
        lesson: 27,
        name: 'Diphthongs',
        nameSpanish: 'Diptongos',
        skills: ['Diphthongs ai, ei, oi', 'Diphthongs au, eu, ou', 'Vowel combinations'],
        syllables: ['ai', 'ei', 'oi', 'au', 'eu', 'ou'],
        sampleWords: ['baile', 'peine', 'auto', 'reina', 'Europa'],
        paFocus: 'Vowel combinations',
        emergeValue: 'Empathy',
        lessonType: 'advanced'
      },
      {
        lesson: 28,
        name: 'Unit 3 Assessment',
        nameSpanish: 'Evaluación Unidad 3',
        skills: ['All Spanish digraphs', 'Silent h', 'Common diphthongs', '4+ syllable words'],
        syllables: ['All Phase 3 syllables'],
        sampleWords: ['Assessment words'],
        paFocus: 'Full review',
        emergeValue: 'Growth',
        lessonType: 'assessment'
      }
    ]
  },
  {
    phase: 4,
    name: 'Consonant Blends',
    nameSpanish: 'Grupos Consonánticos',
    focus: 'Master all consonant blends (bl, cl, fl, br, cr, dr, etc.)',
    lessons: [
      {
        lesson: 29,
        name: 'L-Blends',
        nameSpanish: 'Grupos con L',
        skills: ['Blends bl, cl, fl, gl, pl', 'CCVC pattern', 'Blend identification'],
        syllables: ['bla', 'ble', 'bli', 'blo', 'blu', 'cla', 'cle', 'cli', 'clo', 'clu', 'fla', 'fle', 'fli', 'flo', 'flu', 'gla', 'gle', 'gli', 'glo', 'glu', 'pla', 'ple', 'pli', 'plo', 'plu'],
        sampleWords: ['blanco', 'clase', 'flor', 'globo', 'plato'],
        paFocus: 'Blend identification',
        emergeValue: 'Expression',
        lessonType: 'blend'
      },
      {
        lesson: 30,
        name: 'R-Blends Part 1',
        nameSpanish: 'Grupos con R (Parte 1)',
        skills: ['Blends br, cr, dr', 'CCVC pattern', 'Blend blending'],
        syllables: ['bra', 'bre', 'bri', 'bro', 'bru', 'cra', 'cre', 'cri', 'cro', 'cru', 'dra', 'dre', 'dri', 'dro', 'dru'],
        sampleWords: ['brazo', 'crema', 'drama', 'brisa', 'cristal'],
        paFocus: 'Blend blending',
        emergeValue: 'Empathy',
        lessonType: 'blend'
      },
      {
        lesson: 31,
        name: 'R-Blends Part 2',
        nameSpanish: 'Grupos con R (Parte 2)',
        skills: ['Blends fr, gr, pr, tr', 'CCVC pattern', 'Blend segmenting'],
        syllables: ['fra', 'fre', 'fri', 'fro', 'fru', 'gra', 'gre', 'gri', 'gro', 'gru', 'pra', 'pre', 'pri', 'pro', 'pru', 'tra', 'tre', 'tri', 'tro', 'tru'],
        sampleWords: ['fresa', 'grande', 'primo', 'tren', 'grupo'],
        paFocus: 'Blend segmenting',
        emergeValue: 'Mindfulness',
        lessonType: 'blend'
      },
      {
        lesson: 32,
        name: 'Mixed Blends Practice',
        nameSpanish: 'Práctica de Grupos Mixtos',
        skills: ['All blends review', 'Complex words', 'Blend automaticity'],
        syllables: ['All L-blends and R-blends'],
        sampleWords: ['biblioteca', 'problema', 'cristal', 'estrella', 'escribir'],
        paFocus: 'Complex blending',
        emergeValue: 'Resilience',
        lessonType: 'review'
      },
      {
        lesson: 33,
        name: 'Syllable Division',
        nameSpanish: 'División Silábica',
        skills: ['V/CV pattern', 'VC/V pattern', 'Syllable division rules'],
        syllables: ['Division patterns'],
        sampleWords: ['pa-lo-ma', 'ár-bol', 'ca-mi-no', 'pe-lo-ta', 'ma-ri-po-sa'],
        paFocus: 'Syllable rules',
        emergeValue: 'Growth',
        lessonType: 'advanced'
      },
      {
        lesson: 34,
        name: 'Accentuation Basics',
        nameSpanish: 'Acentuación Básica',
        skills: ['Stressed syllables', 'Accent marks', 'Prosody basics'],
        syllables: ['Accent patterns'],
        sampleWords: ['pájaro', 'café', 'rápido', 'música', 'teléfono'],
        paFocus: 'Prosody',
        emergeValue: 'Expression',
        lessonType: 'advanced'
      },
      {
        lesson: 35,
        name: 'Complex Multisyllabics',
        nameSpanish: 'Palabras Multisílabas Complejas',
        skills: ['4-5 syllable words', 'Long word strategies', 'Chunking'],
        syllables: ['Complex patterns'],
        sampleWords: ['mariposa', 'elefante', 'biblioteca', 'computadora', 'refrigerador'],
        paFocus: 'Long word strategies',
        emergeValue: 'Empathy',
        lessonType: 'advanced'
      },
      {
        lesson: 36,
        name: 'Unit 4 Assessment',
        nameSpanish: 'Evaluación Unidad 4',
        skills: ['All consonant blends', 'Syllable division', 'Accentuation', 'Complex words'],
        syllables: ['All Phase 4 patterns'],
        sampleWords: ['Assessment words'],
        paFocus: 'Full review',
        emergeValue: 'Growth',
        lessonType: 'assessment'
      }
    ]
  },
  {
    phase: 5,
    name: 'Fluency & Review',
    nameSpanish: 'Fluidez y Repaso',
    focus: 'Consolidation, fluency building, and transition to authentic texts',
    lessons: [
      {
        lesson: 37,
        name: 'Reading Fluency',
        nameSpanish: 'Fluidez Lectora',
        skills: ['Repeated reading', 'Echo reading', 'Speed and accuracy'],
        syllables: ['All patterns'],
        sampleWords: ['Fluency passages'],
        paFocus: 'Speed/accuracy',
        emergeValue: 'Expression',
        lessonType: 'advanced'
      },
      {
        lesson: 38,
        name: 'Comprehension Strategies',
        nameSpanish: 'Estrategias de Comprensión',
        skills: ['Predicting', 'Questioning', 'Summarizing'],
        syllables: ['All patterns'],
        sampleWords: ['Comprehension texts'],
        paFocus: 'Understanding',
        emergeValue: 'Mindfulness',
        lessonType: 'advanced'
      },
      {
        lesson: 39,
        name: 'Authentic Text Transition',
        nameSpanish: 'Transición a Textos Auténticos',
        skills: ['Introduction to leveled readers', 'Text selection', 'Independent reading'],
        syllables: ['All patterns'],
        sampleWords: ['Leveled readers'],
        paFocus: 'Text selection',
        emergeValue: 'Resilience',
        lessonType: 'advanced'
      },
      {
        lesson: 40,
        name: 'Final Assessment',
        nameSpanish: 'Evaluación Final',
        skills: ['BOY vs EOY comparison', 'Exit assessment', 'Progress documentation'],
        syllables: ['All patterns'],
        sampleWords: ['Comprehensive assessment'],
        paFocus: 'Comprehensive exit',
        emergeValue: 'Growth',
        lessonType: 'assessment'
      }
    ]
  }
];

// Spanish digraphs and special combinations
export const SPANISH_DIGRAPHS = ['ch', 'll', 'rr', 'qu', 'gu', 'gü'];

// EMERGE values in Spanish
export const EMERGE_VALUES = {
  Mindfulness: { english: 'Mindfulness', spanish: 'Atención Plena' },
  Empathy: { english: 'Empathy', spanish: 'Empatía' },
  Resilience: { english: 'Resilience', spanish: 'Resiliencia' },
  Growth: { english: 'Growth', spanish: 'Crecimiento' },
  Expression: { english: 'Expression', spanish: 'Expresión' }
};

// Helper functions
export function getDespegandoPhase(phaseNumber: number): DespegandoPhase | undefined {
  return DESPEGANDO_PHASES.find(p => p.phase === phaseNumber);
}

export function getDespegandoLesson(lessonNumber: number): { phase: DespegandoPhase; lesson: DespegandoLesson } | undefined {
  for (const phase of DESPEGANDO_PHASES) {
    const lesson = phase.lessons.find(l => l.lesson === lessonNumber);
    if (lesson) {
      return { phase, lesson };
    }
  }
  return undefined;
}

export function getDespegandoPositionLabel(position: DespegandoPosition): string {
  const result = getDespegandoLesson(position.lesson);
  if (result) {
    return `Lesson ${position.lesson}: ${result.lesson.name}`;
  }
  return `Lesson ${position.lesson}`;
}

export function getDespegandoPositionLabelSpanish(position: DespegandoPosition): string {
  const result = getDespegandoLesson(position.lesson);
  if (result) {
    return `Lección ${position.lesson}: ${result.lesson.nameSpanish}`;
  }
  return `Lección ${position.lesson}`;
}

export function getNextDespegandoPosition(currentLesson: number): DespegandoPosition | null {
  if (currentLesson >= 40) return null;

  const nextLesson = currentLesson + 1;
  const result = getDespegandoLesson(nextLesson);

  if (result) {
    return { phase: result.phase.phase, lesson: nextLesson };
  }
  return null;
}

export function getAllDespegandoLessons(): Array<{ phase: number; lesson: DespegandoLesson }> {
  const result: Array<{ phase: number; lesson: DespegandoLesson }> = [];
  for (const phase of DESPEGANDO_PHASES) {
    for (const lesson of phase.lessons) {
      result.push({ phase: phase.phase, lesson });
    }
  }
  return result;
}

// Total lesson count
export const TOTAL_DESPEGANDO_LESSONS = 40;
