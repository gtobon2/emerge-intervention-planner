/**
 * CaminoALaLectura Word Sorts Data
 *
 * Word sorting activities for Spanish reading intervention.
 * Organized by unit and lesson, progressing in difficulty.
 *
 * Sort Types by Unit:
 * - Unit 1: Initial sound (2-3 columns) - focus on vowels and basic consonants
 * - Unit 2: Initial sound + syllable position - more consonants
 * - Unit 3: Digraph patterns - ch, ll, rr, qu
 * - Unit 4: Complex syllable patterns - gue/gui, ce/ci, ge/gi
 * - Unit 5: Rhyme families, multisyllabic patterns
 */

import { generateElementId } from './camino-lesson-elements';
import type { CaminoWordSort, WordSortType } from './camino-lesson-elements';

// ============================================
// Unit 1: Vowels and Initial Consonants
// ============================================

export const UNIT_1_WORD_SORTS: CaminoWordSort[] = [
  // Lesson 1: Vowels a, e
  {
    id: generateElementId(),
    sortType: 'initialSound',
    difficulty: 1,
    columns: 2,
    title: 'Clasificar por sonido inicial: /a/ vs /e/',
    titleEn: 'Sort by initial sound: /a/ vs /e/',
    instructions: 'Clasifica las palabras según el sonido inicial.',
    instructionsEn: 'Sort words by their initial sound.',
    categories: [
      { header: '/a/', headerEn: '/a/', words: ['ala', 'agua', 'árbol', 'ama', 'asa'] },
      { header: '/e/', headerEn: '/e/', words: ['eso', 'era', 'eje', 'eco', 'esa'] },
    ],
    oddOneOut: [{ word: 'una', reason: 'Empieza con /u/', reasonEn: 'Starts with /u/' }],
    unit: 1,
    lesson: 1,
  },
  // Lesson 2: Vowels i, o, u
  {
    id: generateElementId(),
    sortType: 'initialSound',
    difficulty: 1,
    columns: 3,
    title: 'Clasificar por sonido inicial: /i/, /o/, /u/',
    titleEn: 'Sort by initial sound: /i/, /o/, /u/',
    instructions: 'Clasifica las palabras según el sonido inicial.',
    instructionsEn: 'Sort words by their initial sound.',
    categories: [
      { header: '/i/', headerEn: '/i/', words: ['isla', 'iba', 'idea', 'ira'] },
      { header: '/o/', headerEn: '/o/', words: ['ojo', 'ola', 'oso', 'ocho'] },
      { header: '/u/', headerEn: '/u/', words: ['uva', 'uno', 'usa', 'una'] },
    ],
    unit: 1,
    lesson: 2,
  },
  // Lesson 3: M and P
  {
    id: generateElementId(),
    sortType: 'initialSound',
    difficulty: 1,
    columns: 2,
    title: 'Clasificar por sonido inicial: /m/ vs /p/',
    titleEn: 'Sort by initial sound: /m/ vs /p/',
    instructions: 'Clasifica las palabras según empiecen con /m/ o /p/.',
    instructionsEn: 'Sort words by whether they start with /m/ or /p/.',
    categories: [
      { header: '/m/', headerEn: '/m/', words: ['mamá', 'mesa', 'mano', 'mono', 'mapa'] },
      { header: '/p/', headerEn: '/p/', words: ['papá', 'pato', 'pelo', 'puma', 'pala'] },
    ],
    oddOneOut: [{ word: 'oso', reason: 'Empieza con vocal', reasonEn: 'Starts with a vowel' }],
    unit: 1,
    lesson: 3,
  },
  // Lesson 4: L and S
  {
    id: generateElementId(),
    sortType: 'initialSound',
    difficulty: 1,
    columns: 2,
    title: 'Clasificar por sonido inicial: /l/ vs /s/',
    titleEn: 'Sort by initial sound: /l/ vs /s/',
    instructions: 'Clasifica las palabras según empiecen con /l/ o /s/.',
    instructionsEn: 'Sort words by whether they start with /l/ or /s/.',
    categories: [
      { header: '/l/', headerEn: '/l/', words: ['luna', 'lata', 'lado', 'lima', 'lomo'] },
      { header: '/s/', headerEn: '/s/', words: ['sol', 'sal', 'sapo', 'sopa', 'suma'] },
    ],
    unit: 1,
    lesson: 4,
  },
  // Lesson 5: T and D
  {
    id: generateElementId(),
    sortType: 'initialSound',
    difficulty: 1,
    columns: 2,
    title: 'Clasificar por sonido inicial: /t/ vs /d/',
    titleEn: 'Sort by initial sound: /t/ vs /d/',
    instructions: 'Clasifica las palabras según empiecen con /t/ o /d/.',
    instructionsEn: 'Sort words by whether they start with /t/ or /d/.',
    categories: [
      { header: '/t/', headerEn: '/t/', words: ['tapa', 'taza', 'toma', 'todo', 'tema'] },
      { header: '/d/', headerEn: '/d/', words: ['dedo', 'dato', 'duda', 'dama', 'dame'] },
    ],
    unit: 1,
    lesson: 5,
  },
  // Lesson 6: Syllable count
  {
    id: generateElementId(),
    sortType: 'syllableCount',
    difficulty: 1,
    columns: 2,
    title: 'Clasificar por número de sílabas',
    titleEn: 'Sort by number of syllables',
    instructions: 'Clasifica las palabras según tengan 1 o 2 sílabas.',
    instructionsEn: 'Sort words by whether they have 1 or 2 syllables.',
    categories: [
      { header: '1 sílaba', headerEn: '1 syllable', words: ['sol', 'sal', 'mal', 'tal'] },
      { header: '2 sílabas', headerEn: '2 syllables', words: ['mamá', 'papá', 'mesa', 'pato', 'luna'] },
    ],
    oddOneOut: [{ word: 'pelota', reason: 'Tiene 3 sílabas', reasonEn: 'Has 3 syllables' }],
    unit: 1,
    lesson: 6,
  },
  // Lesson 7: Mixed consonants review
  {
    id: generateElementId(),
    sortType: 'initialSound',
    difficulty: 2,
    columns: 3,
    title: 'Clasificar por sonido inicial: /m/, /p/, /l/',
    titleEn: 'Sort by initial sound: /m/, /p/, /l/',
    instructions: 'Clasifica las palabras según su sonido inicial.',
    instructionsEn: 'Sort words by their initial sound.',
    categories: [
      { header: '/m/', headerEn: '/m/', words: ['mamá', 'mesa', 'mapa', 'moto'] },
      { header: '/p/', headerEn: '/p/', words: ['papá', 'pato', 'pelo', 'puma'] },
      { header: '/l/', headerEn: '/l/', words: ['luna', 'lata', 'lado', 'lima'] },
    ],
    unit: 1,
    lesson: 7,
  },
  // Lesson 8: All Unit 1 consonants
  {
    id: generateElementId(),
    sortType: 'initialSound',
    difficulty: 3,
    columns: 4,
    title: 'Clasificar por sonido inicial: /s/, /t/, /d/, /m/',
    titleEn: 'Sort by initial sound: /s/, /t/, /d/, /m/',
    instructions: 'Clasifica las palabras según su sonido inicial.',
    instructionsEn: 'Sort words by their initial sound.',
    categories: [
      { header: '/s/', headerEn: '/s/', words: ['sol', 'sapo', 'sopa'] },
      { header: '/t/', headerEn: '/t/', words: ['tapa', 'taza', 'todo'] },
      { header: '/d/', headerEn: '/d/', words: ['dedo', 'dato', 'dama'] },
      { header: '/m/', headerEn: '/m/', words: ['mamá', 'mesa', 'mapa'] },
    ],
    unit: 1,
    lesson: 8,
  },
];

// ============================================
// Unit 2: Additional Consonants
// ============================================

export const UNIT_2_WORD_SORTS: CaminoWordSort[] = [
  // Lesson 1: N and R
  {
    id: generateElementId(),
    sortType: 'initialSound',
    difficulty: 1,
    columns: 2,
    title: 'Clasificar por sonido inicial: /n/ vs /r/',
    titleEn: 'Sort by initial sound: /n/ vs /r/',
    instructions: 'Clasifica las palabras según empiecen con /n/ o /r/.',
    instructionsEn: 'Sort words by whether they start with /n/ or /r/.',
    categories: [
      { header: '/n/', headerEn: '/n/', words: ['nube', 'nota', 'nido', 'nena', 'nada'] },
      { header: '/r/', headerEn: '/r/', words: ['rana', 'ropa', 'rosa', 'rojo', 'rata'] },
    ],
    unit: 2,
    lesson: 1,
  },
  // Lesson 2: C (hard) and G (hard)
  {
    id: generateElementId(),
    sortType: 'initialSound',
    difficulty: 1,
    columns: 2,
    title: 'Clasificar por sonido inicial: /k/ vs /g/',
    titleEn: 'Sort by initial sound: /k/ vs /g/',
    instructions: 'Clasifica las palabras según empiecen con /k/ (ca, co, cu) o /g/ (ga, go, gu).',
    instructionsEn: 'Sort words by whether they start with /k/ (ca, co, cu) or /g/ (ga, go, gu).',
    categories: [
      { header: '/k/ (c)', headerEn: '/k/ (c)', words: ['casa', 'copa', 'cuna', 'cama', 'coco'] },
      { header: '/g/', headerEn: '/g/', words: ['gato', 'gota', 'goma', 'gallo', 'garra'] },
    ],
    unit: 2,
    lesson: 2,
  },
  // Lesson 3: B and V
  {
    id: generateElementId(),
    sortType: 'initialSound',
    difficulty: 1,
    columns: 2,
    title: 'Clasificar por letra inicial: B vs V',
    titleEn: 'Sort by initial letter: B vs V',
    instructions: 'Clasifica las palabras según empiecen con B o V. (¡Suenan igual!)',
    instructionsEn: 'Sort words by whether they start with B or V. (They sound the same!)',
    categories: [
      { header: 'B', headerEn: 'B', words: ['boca', 'bote', 'burro', 'banana', 'beso'] },
      { header: 'V', headerEn: 'V', words: ['vaca', 'vida', 'vaso', 'vino', 'vela'] },
    ],
    unit: 2,
    lesson: 3,
  },
  // Lesson 4: F and J
  {
    id: generateElementId(),
    sortType: 'initialSound',
    difficulty: 1,
    columns: 2,
    title: 'Clasificar por sonido inicial: /f/ vs /x/',
    titleEn: 'Sort by initial sound: /f/ vs /x/',
    instructions: 'Clasifica las palabras según empiecen con /f/ o /x/ (j).',
    instructionsEn: 'Sort words by whether they start with /f/ or /x/ (j).',
    categories: [
      { header: '/f/', headerEn: '/f/', words: ['foca', 'fama', 'foto', 'fila', 'faro'] },
      { header: '/x/ (j)', headerEn: '/x/ (j)', words: ['jugo', 'jota', 'jefe', 'jirafa', 'jamón'] },
    ],
    unit: 2,
    lesson: 4,
  },
  // Lesson 5: Z and Ñ
  {
    id: generateElementId(),
    sortType: 'initialSound',
    difficulty: 1,
    columns: 2,
    title: 'Clasificar por sonido inicial: /s/ (z) vs /ñ/',
    titleEn: 'Sort by initial sound: /s/ (z) vs /ñ/',
    instructions: 'Clasifica las palabras según empiecen con z (/s/) o ñ.',
    instructionsEn: 'Sort words by whether they start with z (/s/) or ñ.',
    categories: [
      { header: 'Z', headerEn: 'Z', words: ['zapato', 'zorro', 'zona', 'zumo'] },
      { header: 'Ñ', headerEn: 'Ñ', words: ['niño', 'ñoño', 'ñame', 'ñu'] },
    ],
    oddOneOut: [{ word: 'sopa', reason: 'Empieza con S, no Z', reasonEn: 'Starts with S, not Z' }],
    unit: 2,
    lesson: 5,
  },
  // Lesson 6: Syllable structure CV vs CVC
  {
    id: generateElementId(),
    sortType: 'syllableStructure',
    difficulty: 2,
    columns: 2,
    title: 'Clasificar por estructura de sílaba',
    titleEn: 'Sort by syllable structure',
    instructions: 'Clasifica las palabras según si terminan en vocal (sílaba abierta) o consonante (sílaba cerrada).',
    instructionsEn: 'Sort words by whether they end in a vowel (open syllable) or consonant (closed syllable).',
    categories: [
      { header: 'Termina en vocal', headerEn: 'Ends in vowel', words: ['casa', 'mesa', 'rana', 'gato', 'vaca'] },
      { header: 'Termina en consonante', headerEn: 'Ends in consonant', words: ['sol', 'pan', 'mar', 'luz'] },
    ],
    unit: 2,
    lesson: 6,
  },
  // Lesson 7: RR vs R
  {
    id: generateElementId(),
    sortType: 'digraph',
    difficulty: 2,
    columns: 2,
    title: 'Clasificar: R suave vs RR fuerte',
    titleEn: 'Sort: soft R vs strong RR',
    instructions: 'Clasifica las palabras según tengan r suave o rr fuerte.',
    instructionsEn: 'Sort words by whether they have soft r or strong rr.',
    categories: [
      { header: 'R suave', headerEn: 'Soft R', words: ['rana', 'ropa', 'caro', 'mira', 'para'] },
      { header: 'RR fuerte', headerEn: 'Strong RR', words: ['perro', 'carro', 'torre', 'burro', 'gorra'] },
    ],
    unit: 2,
    lesson: 7,
  },
];

// ============================================
// Unit 3: Digraphs and Consonant Clusters
// ============================================

export const UNIT_3_WORD_SORTS: CaminoWordSort[] = [
  // Lesson 1: CH and LL
  {
    id: generateElementId(),
    sortType: 'digraph',
    difficulty: 1,
    columns: 2,
    title: 'Clasificar por dígrafo: CH vs LL',
    titleEn: 'Sort by digraph: CH vs LL',
    instructions: 'Clasifica las palabras según contengan ch o ll.',
    instructionsEn: 'Sort words by whether they contain ch or ll.',
    categories: [
      { header: 'CH', headerEn: 'CH', words: ['leche', 'chancho', 'cuchara', 'chico', 'ocho'] },
      { header: 'LL', headerEn: 'LL', words: ['pollo', 'silla', 'calle', 'lluvia', 'llave'] },
    ],
    unit: 3,
    lesson: 1,
  },
  // Lesson 2: QU vs C
  {
    id: generateElementId(),
    sortType: 'digraph',
    difficulty: 2,
    columns: 2,
    title: 'Clasificar: QU vs C (sonido /k/)',
    titleEn: 'Sort: QU vs C (/k/ sound)',
    instructions: 'Clasifica las palabras con sonido /k/: que/qui vs ca/co/cu.',
    instructionsEn: 'Sort words with /k/ sound: que/qui vs ca/co/cu.',
    categories: [
      { header: 'QU (e, i)', headerEn: 'QU (e, i)', words: ['queso', 'quiero', 'parque', 'pequeño', 'máquina'] },
      { header: 'C (a, o, u)', headerEn: 'C (a, o, u)', words: ['casa', 'copa', 'cuna', 'coco', 'camino'] },
    ],
    unit: 3,
    lesson: 2,
  },
  // Lesson 3: Blends with L
  {
    id: generateElementId(),
    sortType: 'blend',
    difficulty: 2,
    columns: 3,
    title: 'Clasificar por grupo consonántico con L',
    titleEn: 'Sort by L-blends',
    instructions: 'Clasifica las palabras según el grupo consonántico: bl, cl, fl.',
    instructionsEn: 'Sort words by consonant blend: bl, cl, fl.',
    categories: [
      { header: 'BL', headerEn: 'BL', words: ['blanco', 'blusa', 'bloque', 'tabla'] },
      { header: 'CL', headerEn: 'CL', words: ['clase', 'clavo', 'clima', 'ancla'] },
      { header: 'FL', headerEn: 'FL', words: ['flor', 'flauta', 'flaco', 'reflejo'] },
    ],
    unit: 3,
    lesson: 3,
  },
  // Lesson 4: Blends with R
  {
    id: generateElementId(),
    sortType: 'blend',
    difficulty: 2,
    columns: 3,
    title: 'Clasificar por grupo consonántico con R',
    titleEn: 'Sort by R-blends',
    instructions: 'Clasifica las palabras según el grupo consonántico: br, cr, fr.',
    instructionsEn: 'Sort words by consonant blend: br, cr, fr.',
    categories: [
      { header: 'BR', headerEn: 'BR', words: ['brazo', 'bruja', 'brillo', 'sobre'] },
      { header: 'CR', headerEn: 'CR', words: ['crema', 'cruz', 'criatura', 'secreto'] },
      { header: 'FR', headerEn: 'FR', words: ['fresa', 'frío', 'frito', 'frente'] },
    ],
    unit: 3,
    lesson: 4,
  },
  // Lesson 5: More R-blends
  {
    id: generateElementId(),
    sortType: 'blend',
    difficulty: 2,
    columns: 3,
    title: 'Clasificar por grupo consonántico: gr, pr, tr',
    titleEn: 'Sort by consonant blend: gr, pr, tr',
    instructions: 'Clasifica las palabras según el grupo consonántico.',
    instructionsEn: 'Sort words by consonant blend.',
    categories: [
      { header: 'GR', headerEn: 'GR', words: ['grande', 'grupo', 'grúa', 'negro'] },
      { header: 'PR', headerEn: 'PR', words: ['primo', 'precio', 'prisa', 'compra'] },
      { header: 'TR', headerEn: 'TR', words: ['tren', 'tres', 'trigo', 'estrella'] },
    ],
    unit: 3,
    lesson: 5,
  },
  // Lesson 6: L-blends vs R-blends
  {
    id: generateElementId(),
    sortType: 'blend',
    difficulty: 3,
    columns: 2,
    title: 'Clasificar: Grupos con L vs grupos con R',
    titleEn: 'Sort: L-blends vs R-blends',
    instructions: 'Clasifica las palabras según el tipo de grupo consonántico.',
    instructionsEn: 'Sort words by type of consonant blend.',
    categories: [
      { header: 'Grupos con L', headerEn: 'L-blends', words: ['blanco', 'clase', 'flor', 'globo', 'plato'] },
      { header: 'Grupos con R', headerEn: 'R-blends', words: ['brazo', 'crema', 'fresa', 'grande', 'tren'] },
    ],
    unit: 3,
    lesson: 6,
  },
];

// ============================================
// Unit 4: Complex Syllables
// ============================================

export const UNIT_4_WORD_SORTS: CaminoWordSort[] = [
  // Lesson 1: GUE/GUI vs GE/GI
  {
    id: generateElementId(),
    sortType: 'digraph',
    difficulty: 2,
    columns: 2,
    title: 'Clasificar: gue/gui vs ge/gi',
    titleEn: 'Sort: gue/gui vs ge/gi',
    instructions: 'Clasifica las palabras según contengan gue/gui (sonido /g/) o ge/gi (sonido /x/).',
    instructionsEn: 'Sort words by whether they contain gue/gui (/g/ sound) or ge/gi (/x/ sound).',
    categories: [
      { header: 'GUE/GUI (/g/)', headerEn: 'GUE/GUI (/g/)', words: ['juguete', 'guitarra', 'guerra', 'águila', 'manguera'] },
      { header: 'GE/GI (/x/)', headerEn: 'GE/GI (/x/)', words: ['gente', 'girasol', 'gigante', 'general', 'magia'] },
    ],
    unit: 4,
    lesson: 1,
  },
  // Lesson 2: CE/CI vs QUE/QUI
  {
    id: generateElementId(),
    sortType: 'digraph',
    difficulty: 2,
    columns: 2,
    title: 'Clasificar: ce/ci vs que/qui',
    titleEn: 'Sort: ce/ci vs que/qui',
    instructions: 'Clasifica las palabras según contengan ce/ci (sonido /s/) o que/qui (sonido /k/).',
    instructionsEn: 'Sort words by whether they contain ce/ci (/s/ sound) or que/qui (/k/ sound).',
    categories: [
      { header: 'CE/CI (/s/)', headerEn: 'CE/CI (/s/)', words: ['cena', 'cielo', 'cine', 'ciudad', 'dulce'] },
      { header: 'QUE/QUI (/k/)', headerEn: 'QUE/QUI (/k/)', words: ['queso', 'quiero', 'parque', 'pequeño', 'chiquito'] },
    ],
    unit: 4,
    lesson: 2,
  },
  // Lesson 3: GÜE/GÜI (with dieresis)
  {
    id: generateElementId(),
    sortType: 'digraph',
    difficulty: 3,
    columns: 3,
    title: 'Clasificar: gue vs güe vs ge',
    titleEn: 'Sort: gue vs güe vs ge',
    instructions: 'Clasifica las palabras según la pronunciación de la u.',
    instructionsEn: 'Sort words by how the u is pronounced.',
    categories: [
      { header: 'GUE (u muda)', headerEn: 'GUE (silent u)', words: ['juguete', 'guerra', 'manguera'] },
      { header: 'GÜE (u suena)', headerEn: 'GÜE (u sounds)', words: ['pingüino', 'cigüeña', 'vergüenza'] },
      { header: 'GE (sin u)', headerEn: 'GE (no u)', words: ['gente', 'general', 'gentil'] },
    ],
    unit: 4,
    lesson: 3,
  },
  // Lesson 4: All soft sounds review
  {
    id: generateElementId(),
    sortType: 'initialSound',
    difficulty: 3,
    columns: 3,
    title: 'Clasificar sonidos suaves: /s/, /x/',
    titleEn: 'Sort soft sounds: /s/, /x/',
    instructions: 'Clasifica las palabras por sonido: ce/ci/z, ge/gi/j.',
    instructionsEn: 'Sort words by sound: ce/ci/z, ge/gi/j.',
    categories: [
      { header: 'CE/CI (/s/)', headerEn: 'CE/CI (/s/)', words: ['cena', 'cielo', 'dulce'] },
      { header: 'Z (/s/)', headerEn: 'Z (/s/)', words: ['zapato', 'zona', 'azul'] },
      { header: 'GE/GI/J (/x/)', headerEn: 'GE/GI/J (/x/)', words: ['gente', 'jirafa', 'juego'] },
    ],
    unit: 4,
    lesson: 4,
  },
];

// ============================================
// Unit 5: Multisyllabic Words
// ============================================

export const UNIT_5_WORD_SORTS: CaminoWordSort[] = [
  // Lesson 1: Syllable count
  {
    id: generateElementId(),
    sortType: 'syllableCount',
    difficulty: 2,
    columns: 3,
    title: 'Clasificar por número de sílabas',
    titleEn: 'Sort by syllable count',
    instructions: 'Clasifica las palabras según el número de sílabas.',
    instructionsEn: 'Sort words by number of syllables.',
    categories: [
      { header: '2 sílabas', headerEn: '2 syllables', words: ['casa', 'mesa', 'perro', 'gato'] },
      { header: '3 sílabas', headerEn: '3 syllables', words: ['semilla', 'cocina', 'conejo', 'zapato'] },
      { header: '4+ sílabas', headerEn: '4+ syllables', words: ['mariposa', 'elefante', 'chocolate', 'calendario'] },
    ],
    unit: 5,
    lesson: 1,
  },
  // Lesson 2: Rhyme families -ón
  {
    id: generateElementId(),
    sortType: 'rhymeFamily',
    difficulty: 2,
    columns: 2,
    title: 'Clasificar por rima: palabras que riman con -ón',
    titleEn: 'Sort by rhyme: words that rhyme with -ón',
    instructions: 'Clasifica las palabras según rimen con -ón o no.',
    instructionsEn: 'Sort words by whether they rhyme with -ón or not.',
    categories: [
      { header: 'Rima con -ón', headerEn: 'Rhymes with -ón', words: ['dragón', 'camión', 'limón', 'canción', 'avión'] },
      { header: 'No rima', headerEn: 'Does not rhyme', words: ['mesa', 'casa', 'perro', 'libro'] },
    ],
    unit: 5,
    lesson: 2,
  },
  // Lesson 3: Rhyme families -ito/-ita
  {
    id: generateElementId(),
    sortType: 'rhymeFamily',
    difficulty: 2,
    columns: 2,
    title: 'Clasificar por terminación: -ito/-ita',
    titleEn: 'Sort by ending: -ito/-ita',
    instructions: 'Clasifica las palabras según terminen en -ito o -ita.',
    instructionsEn: 'Sort words by whether they end in -ito or -ita.',
    categories: [
      { header: '-ito', headerEn: '-ito', words: ['gatito', 'perrito', 'pajarito', 'pollito'] },
      { header: '-ita', headerEn: '-ita', words: ['casita', 'mesita', 'florecita', 'estrellita'] },
    ],
    unit: 5,
    lesson: 3,
  },
  // Lesson 4: Open sort - Student decides
  {
    id: generateElementId(),
    sortType: 'open',
    difficulty: 3,
    columns: 3,
    title: 'Clasificación abierta',
    titleEn: 'Open sort',
    instructions: '¡Tú decides cómo clasificar estas palabras! Puedes usar número de sílabas, sonido inicial, rima, etc.',
    instructionsEn: 'You decide how to sort these words! You can use syllable count, initial sound, rhyme, etc.',
    categories: [
      { header: 'Grupo 1', headerEn: 'Group 1', words: [] },
      { header: 'Grupo 2', headerEn: 'Group 2', words: [] },
      { header: 'Grupo 3', headerEn: 'Group 3', words: [] },
    ],
    // Provide words for open sort
    oddOneOut: [
      { word: 'mariposa', reason: 'Incluir en clasificación', reasonEn: 'Include in sort' },
      { word: 'elefante', reason: 'Incluir en clasificación', reasonEn: 'Include in sort' },
      { word: 'chocolate', reason: 'Incluir en clasificación', reasonEn: 'Include in sort' },
      { word: 'dinosaurio', reason: 'Incluir en clasificación', reasonEn: 'Include in sort' },
      { word: 'semilla', reason: 'Incluir en clasificación', reasonEn: 'Include in sort' },
      { word: 'cocina', reason: 'Incluir en clasificación', reasonEn: 'Include in sort' },
      { word: 'calendario', reason: 'Incluir en clasificación', reasonEn: 'Include in sort' },
      { word: 'refrigerador', reason: 'Incluir en clasificación', reasonEn: 'Include in sort' },
      { word: 'supermercado', reason: 'Incluir en clasificación', reasonEn: 'Include in sort' },
    ],
    unit: 5,
    lesson: 4,
  },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Get word sorts by unit
 */
export function getWordSortsByUnit(unit: number): CaminoWordSort[] {
  switch (unit) {
    case 1:
      return UNIT_1_WORD_SORTS;
    case 2:
      return UNIT_2_WORD_SORTS;
    case 3:
      return UNIT_3_WORD_SORTS;
    case 4:
      return UNIT_4_WORD_SORTS;
    case 5:
      return UNIT_5_WORD_SORTS;
    default:
      return [];
  }
}

/**
 * Get word sort by unit and lesson
 */
export function getWordSortByLesson(unit: number, lesson: number): CaminoWordSort | undefined {
  const unitSorts = getWordSortsByUnit(unit);
  return unitSorts.find((ws) => ws.lesson === lesson);
}

/**
 * Get all word sorts
 */
export function getAllWordSorts(): CaminoWordSort[] {
  return [
    ...UNIT_1_WORD_SORTS,
    ...UNIT_2_WORD_SORTS,
    ...UNIT_3_WORD_SORTS,
    ...UNIT_4_WORD_SORTS,
    ...UNIT_5_WORD_SORTS,
  ];
}

/**
 * Get word sorts by type
 */
export function getWordSortsByType(sortType: WordSortType): CaminoWordSort[] {
  return getAllWordSorts().filter((ws) => ws.sortType === sortType);
}

// Export all for direct access
export const ALL_WORD_SORTS = {
  unit1: UNIT_1_WORD_SORTS,
  unit2: UNIT_2_WORD_SORTS,
  unit3: UNIT_3_WORD_SORTS,
  unit4: UNIT_4_WORD_SORTS,
  unit5: UNIT_5_WORD_SORTS,
};
