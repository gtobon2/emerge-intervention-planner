// Camino a la Lectura - Spanish Reading Intervention
// Systematic Spanish reading for K-3 struggling readers

export interface CaminoLesson {
  lesson: number;
  week: number;
  focus: string;
  skills?: string[];
  syllables?: string[];
  sample_words?: string[];
  pa_focus?: string;
  decodable?: string;
  activities?: string[];
}

export interface CaminoPhase {
  phase: number;
  name: string;
  weeks: string;
  lessons: CaminoLesson[];
}

export interface FluencyBenchmark {
  wcpm_target: string;
  accuracy: string;
}

export const CAMINO_PHASES: CaminoPhase[] = [
  {
    phase: 1,
    name: 'Vocales y Primeras Consonantes (Vowels & First Consonants)',
    weeks: '1-10',
    lessons: [
      {
        lesson: 1,
        week: 1,
        focus: 'Vocales: a, e, i, o, u',
        skills: ['5 vowel sounds', 'Vowel identification', 'Consistent vowel pronunciation'],
        syllables: ['a', 'e', 'i', 'o', 'u'],
        sample_words: ['ojo', 'oso', 'ala', 'uva', 'Eva'],
        pa_focus: 'Vowel identification and isolation',
        decodable: undefined
      },
      {
        lesson: 2,
        week: 2,
        focus: 'Letra M',
        skills: ['M sound /m/', 'CV syllables with m', 'Blending ma-me-mi-mo-mu'],
        syllables: ['ma', 'me', 'mi', 'mo', 'mu'],
        sample_words: ['mama', 'mapa', 'mia', 'mula', 'ama', 'amo'],
        pa_focus: 'Syllable blending',
        decodable: 'Book 1: Mi Mama'
      },
      {
        lesson: 3,
        week: 3,
        focus: 'Letra P',
        skills: ['P sound /p/', 'CV syllables with p', 'Two-syllable words'],
        syllables: ['pa', 'pe', 'pi', 'po', 'pu'],
        sample_words: ['papa', 'puma', 'pipa', 'Pepe', 'mapa', 'mopa'],
        pa_focus: 'Syllable segmenting',
        decodable: 'Book 2: Pepe y Papa'
      },
      {
        lesson: 4,
        week: 4,
        focus: 'Letra L',
        skills: ['L sound /l/', 'CV syllables with l', 'Blending with previous letters'],
        syllables: ['la', 'le', 'li', 'lo', 'lu'],
        sample_words: ['loma', 'lima', 'lupa', 'pelo', 'pala', 'mula'],
        pa_focus: 'Initial sound isolation',
        decodable: 'Book 3: La Loma'
      },
      {
        lesson: 5,
        week: 5,
        focus: 'Repaso M, P, L',
        skills: ['Review m, p, l', 'CVC combinations', 'Two-syllable word fluency'],
        syllables: ['ma', 'me', 'mi', 'mo', 'mu', 'pa', 'pe', 'pi', 'po', 'pu', 'la', 'le', 'li', 'lo', 'lu'],
        sample_words: ['mapa', 'pala', 'pelo', 'loma', 'Lupe', 'mula', 'puma'],
        pa_focus: 'Syllable manipulation',
        decodable: 'Book 4: Mapa de Lupe'
      },
      {
        lesson: 6,
        week: 6,
        focus: 'Letra S',
        skills: ['S sound /s/', 'CV syllables with s', 'Final s'],
        syllables: ['sa', 'se', 'si', 'so', 'su'],
        sample_words: ['sopa', 'mesa', 'asa', 'suma', 'piso', 'oso'],
        pa_focus: 'Final sound isolation',
        decodable: 'Book 5: La Sopa'
      },
      {
        lesson: 7,
        week: 7,
        focus: 'Letra T',
        skills: ['T sound /t/', 'CV syllables with t', 'Three-letter combinations'],
        syllables: ['ta', 'te', 'ti', 'to', 'tu'],
        sample_words: ['tapa', 'toma', 'tela', 'ata', 'pato', 'moto'],
        pa_focus: 'Phoneme blending',
        decodable: 'Book 6: El Pato'
      },
      {
        lesson: 8,
        week: 8,
        focus: 'Letra D',
        skills: ['D sound /d/', 'CV syllables with d', 'D vs T contrast'],
        syllables: ['da', 'de', 'di', 'do', 'du'],
        sample_words: ['dedo', 'dia', 'soda', 'lodo', 'moda', 'dama'],
        pa_focus: 'Phoneme segmenting',
        decodable: 'Book 7: El Dedo'
      },
      {
        lesson: 9,
        week: 9,
        focus: 'Repaso S, T, D',
        skills: ['Review s, t, d', 'Multi-syllabic words', 'Fluency building'],
        syllables: ['All Phase 1 syllables'],
        sample_words: ['pelota', 'semilla', 'patata', 'tomate', 'salida', 'pesado'],
        pa_focus: 'Phoneme manipulation',
        decodable: 'Book 8: La Pelota'
      },
      {
        lesson: 10,
        week: 10,
        focus: 'Evaluacion Unidad 1',
        skills: ['Assessment of Phase 1', 'All vowels', 'All Phase 1 consonants'],
        syllables: ['All Phase 1'],
        sample_words: ['Assessment words'],
        pa_focus: 'Full PA battery',
        decodable: 'Books 9-10: Assessment texts'
      }
    ]
  },
  {
    phase: 2,
    name: 'Consonantes Adicionales (Additional Consonants)',
    weeks: '11-20',
    lessons: [
      { lesson: 11, week: 11, focus: 'Letra N', skills: ['N sound /n/', 'CV syllables with n', 'N vs M contrast'], syllables: ['na', 'ne', 'ni', 'no', 'nu'], sample_words: ['nena', 'mano', 'luna', 'uno', 'mono', 'nido'], pa_focus: 'Rhyming', decodable: 'Book 11' },
      { lesson: 12, week: 12, focus: 'Letra R (suave)', skills: ['R tap sound', 'CV syllables with r', 'R between vowels'], syllables: ['ra', 're', 'ri', 'ro', 'ru'], sample_words: ['raton', 'pera', 'rio', 'caro', 'loro', 'toro'], pa_focus: 'Sound matching', decodable: 'Book 12' },
      { lesson: 13, week: 13, focus: 'Letra C (fuerte: ca, co, cu)', skills: ['Hard C sound /k/', 'Ca, co, cu syllables'], syllables: ['ca', 'co', 'cu'], sample_words: ['casa', 'poco', 'cuna', 'saco', 'loco', 'cama'], pa_focus: 'Syllable deletion', decodable: 'Book 13' },
      { lesson: 14, week: 14, focus: 'Letra C (suave: ce, ci)', skills: ['Soft C sound /s/', 'Ce, ci syllables', 'C spelling rule'], syllables: ['ce', 'ci'], sample_words: ['cena', 'cine', 'dulce', 'cero', 'cielo', 'lucir'], pa_focus: 'Syllable addition', decodable: 'Book 14' },
      { lesson: 15, week: 15, focus: 'Repaso N, R, C', skills: ['Review n, r, c', 'Multi-syllabic words', 'Hard/soft c patterns'], syllables: ['All n, r, c syllables'], sample_words: ['corona', 'canela', 'perico', 'cocina', 'cereza'], pa_focus: 'Blending complex words', decodable: 'Book 15' },
      { lesson: 16, week: 16, focus: 'Letra B', skills: ['B sound /b/', 'CV syllables with b', 'B/V same sound in Spanish'], syllables: ['ba', 'be', 'bi', 'bo', 'bu'], sample_words: ['boca', 'lobo', 'Cuba', 'beso', 'sube', 'bueno'], pa_focus: 'Segmenting', decodable: 'Book 16' },
      { lesson: 17, week: 17, focus: 'Letra G (fuerte: ga, go, gu)', skills: ['Hard G sound /g/', 'Ga, go, gu syllables'], syllables: ['ga', 'go', 'gu'], sample_words: ['gato', 'lago', 'aguila', 'gota', 'gusano', 'amigo'], pa_focus: 'Sound substitution', decodable: 'Book 17' },
      { lesson: 18, week: 18, focus: 'Letras F, V', skills: ['F sound /f/', 'V sound /b/ (same as B)', 'F and V syllables'], syllables: ['fa', 'fe', 'fi', 'fo', 'fu', 'va', 've', 'vi', 'vo', 'vu'], sample_words: ['foca', 'cafe', 'vaca', 'uva', 'fila', 'favor'], pa_focus: 'Phoneme deletion', decodable: 'Book 18' },
      { lesson: 19, week: 19, focus: 'Letras Z, J, N with tilde', skills: ['Z sound /s/', 'J sound /x/', 'N with tilde sound', 'Special letters'], syllables: ['za', 'zo', 'zu', 'ja', 'je', 'ji', 'jo', 'ju', 'na', 'ne', 'ni', 'no', 'nu'], sample_words: ['zapato', 'jugo', 'nino', 'zumo', 'ojo', 'ano', 'lena'], pa_focus: 'Phoneme addition', decodable: 'Book 19' },
      { lesson: 20, week: 20, focus: 'Evaluacion Unidad 2', skills: ['Assessment of Phase 2', 'All consonants', 'All CV syllables'], syllables: ['All syllables taught'], sample_words: ['Assessment words'], pa_focus: 'Full review', decodable: 'Book 20' }
    ]
  },
  {
    phase: 3,
    name: 'Digrafos y Letras Dobles (Digraphs & Double Letters)',
    weeks: '21-28',
    lessons: [
      { lesson: 21, week: 21, focus: 'Digrafo CH', syllables: ['cha', 'che', 'chi', 'cho', 'chu'], sample_words: ['chico', 'leche', 'noche', 'mucho', 'cuchara'] },
      { lesson: 22, week: 22, focus: 'Digrafo LL', syllables: ['lla', 'lle', 'lli', 'llo', 'llu'], sample_words: ['llama', 'calle', 'pollo', 'silla', 'lluvia'] },
      { lesson: 23, week: 23, focus: 'Digrafo RR (erre)', syllables: ['rra', 'rre', 'rri', 'rro', 'rru'], sample_words: ['perro', 'carro', 'torre', 'tierra', 'burro'] },
      { lesson: 24, week: 24, focus: 'Combinacion QU', syllables: ['que', 'qui'], sample_words: ['queso', 'paquete', 'quito', 'pequeno', 'mosquito'] },
      { lesson: 25, week: 25, focus: 'Repaso CH, LL, RR, QU', syllables: ['All digraphs'], sample_words: ['mochila', 'tortilla', 'perrito', 'chiquito'] },
      { lesson: 26, week: 26, focus: 'Letra H (muda)', syllables: ['ha', 'he', 'hi', 'ho', 'hu'], sample_words: ['hola', 'ahora', 'hilo', 'hijo', 'hermano'] },
      { lesson: 27, week: 27, focus: 'Diptongos', syllables: ['ai', 'ei', 'oi', 'au', 'eu', 'ou'], sample_words: ['baile', 'peine', 'auto', 'Europa', 'boina'] },
      { lesson: 28, week: 28, focus: 'Evaluacion Unidad 3', syllables: ['All digraphs'], sample_words: ['Assessment words'] }
    ]
  },
  {
    phase: 4,
    name: 'Grupos Consonanticos (Consonant Blends)',
    weeks: '29-36',
    lessons: [
      { lesson: 29, week: 29, focus: 'Grupos con L (bl, cl, fl, gl, pl)', sample_words: ['blanco', 'clase', 'flor', 'globo', 'plato'] },
      { lesson: 30, week: 30, focus: 'Grupos con R - Parte 1 (br, cr, dr)', sample_words: ['brazo', 'crema', 'drama', 'brisa', 'cruz'] },
      { lesson: 31, week: 31, focus: 'Grupos con R - Parte 2 (fr, gr, pr, tr)', sample_words: ['fresa', 'grande', 'primo', 'tren', 'fruta'] },
      { lesson: 32, week: 32, focus: 'Practica mixta de grupos', sample_words: ['biblioteca', 'problema', 'cristal', 'trabajo'] },
      { lesson: 33, week: 33, focus: 'Division silabica', sample_words: ['pa-lo-ma', 'ar-bol', 'cam-pa-na'] },
      { lesson: 34, week: 34, focus: 'Acentuacion basica', sample_words: ['pa-ja-ro', 'ca-fe', 'te-le-fo-no'] },
      { lesson: 35, week: 35, focus: 'Palabras multisilabicas complejas', sample_words: ['mariposa', 'elefante', 'biblioteca'] },
      { lesson: 36, week: 36, focus: 'Evaluacion Unidad 4', sample_words: ['Assessment words'] }
    ]
  },
  {
    phase: 5,
    name: 'Habilidades Avanzadas y Repaso (Advanced Skills & Review)',
    weeks: '37-40',
    lessons: [
      { lesson: 37, week: 37, focus: 'Fluidez lectora', activities: ['Repeated reading', 'Echo reading', 'Timed reading'] },
      { lesson: 38, week: 38, focus: 'Estrategias de comprension', activities: ['Predicting', 'Questioning', 'Summarizing'] },
      { lesson: 39, week: 39, focus: 'Transicion a textos autenticos', activities: ['Leveled readers', 'Text selection'] },
      { lesson: 40, week: 40, focus: 'Evaluacion Final', activities: ['Comprehensive assessment', 'Exit criteria evaluation'] }
    ]
  }
];

export const FLUENCY_BENCHMARKS: Record<string, FluencyBenchmark> = {
  'weeks_1_10': { wcpm_target: '10-20', accuracy: '90%+' },
  'weeks_11_20': { wcpm_target: '20-40', accuracy: '92%+' },
  'weeks_21_28': { wcpm_target: '40-60', accuracy: '94%+' },
  'weeks_29_36': { wcpm_target: '60-80', accuracy: '96%+' },
  'weeks_37_40': { wcpm_target: '80-100+', accuracy: '98%+' }
};

// Camino lesson structure (11 components, 45 min)
export const CAMINO_LESSON_COMPONENTS = [
  { name: 'Warm-Up Review', duration_minutes: 5, description: 'Review previous skills' },
  { name: 'Phonemic Awareness', duration_minutes: 5, description: 'PA activities' },
  { name: 'New Phonics Concept', duration_minutes: 10, description: 'I Do/We Do/You Do' },
  { name: 'Word Blending/Decoding', duration_minutes: 7, description: 'Syllable and word practice' },
  { name: 'Decodable Text Reading', duration_minutes: 10, description: 'Connected text practice' },
  { name: 'Comprehension & Discussion', duration_minutes: 5, description: 'Understanding check' },
  { name: 'Vocabulary & Oral Language', duration_minutes: 5, description: 'Word meaning and usage' },
  { name: 'Writing/Spelling', duration_minutes: 7, description: 'Dictation and writing' },
  { name: 'Review & Reinforcement', duration_minutes: 3, description: 'Wrap up and preview' }
];

// Helper functions
export function getCaminoLesson(lessonNumber: number): (CaminoLesson & { phaseName: string }) | undefined {
  for (const phase of CAMINO_PHASES) {
    const lesson = phase.lessons.find(l => l.lesson === lessonNumber);
    if (lesson) {
      return { ...lesson, phaseName: phase.name };
    }
  }
  return undefined;
}

export function getCaminoPhase(phaseNumber: number): CaminoPhase | undefined {
  return CAMINO_PHASES.find(p => p.phase === phaseNumber);
}

export function getPhaseForLesson(lessonNumber: number): CaminoPhase | undefined {
  return CAMINO_PHASES.find(phase =>
    phase.lessons.some(l => l.lesson === lessonNumber)
  );
}

export function getCaminoLessonLabel(lessonNumber: number): string {
  const lesson = getCaminoLesson(lessonNumber);
  if (lesson) {
    return `Leccion ${lessonNumber}: ${lesson.focus}`;
  }
  return `Leccion ${lessonNumber}`;
}

export function getNextCaminoLesson(currentLesson: number): number | null {
  if (currentLesson >= 40) return null;
  return currentLesson + 1;
}

export function getFluencyBenchmarkForLesson(lessonNumber: number): FluencyBenchmark | undefined {
  if (lessonNumber <= 10) return FLUENCY_BENCHMARKS['weeks_1_10'];
  if (lessonNumber <= 20) return FLUENCY_BENCHMARKS['weeks_11_20'];
  if (lessonNumber <= 28) return FLUENCY_BENCHMARKS['weeks_21_28'];
  if (lessonNumber <= 36) return FLUENCY_BENCHMARKS['weeks_29_36'];
  return FLUENCY_BENCHMARKS['weeks_37_40'];
}
