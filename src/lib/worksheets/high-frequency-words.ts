/**
 * High-Frequency (Sight) Words
 *
 * Words that appear frequently in text and are often taught as sight words
 * because they may not follow regular phonics patterns.
 */

// English high-frequency words (Dolch + Fry first 100)
export const ENGLISH_HF_WORDS = new Set([
  // Articles & determiners
  'the', 'a', 'an', 'this', 'that', 'these', 'those',
  // Pronouns
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  // Verbs (common irregulars)
  'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'done',
  'go', 'goes', 'went', 'gone', 'going',
  'come', 'came', 'coming',
  'see', 'saw', 'seen', 'look', 'looked',
  'said', 'say', 'says',
  'get', 'got', 'give', 'gave',
  'make', 'made', 'take', 'took',
  'know', 'knew', 'think', 'thought',
  'want', 'wanted', 'like', 'liked',
  'can', 'could', 'will', 'would', 'shall', 'should',
  'may', 'might', 'must',
  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'up', 'down', 'out', 'into', 'over', 'under',
  'about', 'after', 'before', 'between',
  // Conjunctions
  'and', 'or', 'but', 'so', 'if', 'when', 'because',
  // Adverbs
  'not', 'no', 'yes', 'very', 'just', 'here', 'there',
  'now', 'then', 'always', 'never', 'sometimes',
  // Question words
  'what', 'where', 'when', 'why', 'how', 'who', 'which',
  // Other common words
  'all', 'some', 'any', 'many', 'much', 'more', 'most',
  'other', 'another', 'each', 'every', 'both',
  'new', 'old', 'good', 'bad', 'big', 'little', 'small',
  'first', 'last', 'next', 'only', 'own',
  'one', 'two', 'three', 'four', 'five',
  'people', 'time', 'day', 'way', 'thing', 'place',
  'work', 'water', 'word', 'world',
  'put', 'found', 'house', 'again',
]);

// Spanish high-frequency words
export const SPANISH_HF_WORDS = new Set([
  // Articles & determiners
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
  // Pronouns
  'yo', 'tú', 'él', 'ella', 'usted', 'nosotros', 'ellos', 'ellas', 'ustedes',
  'me', 'te', 'le', 'nos', 'les', 'lo', 'la',
  'mi', 'tu', 'su', 'mis', 'tus', 'sus', 'nuestro', 'nuestra',
  // Verbs (common)
  'es', 'son', 'está', 'están', 'soy', 'eres', 'somos',
  'hay', 'tiene', 'tienen', 'tengo', 'tienes', 'tenemos',
  'va', 'van', 'voy', 'vas', 'vamos', 'ir',
  've', 'ven', 'veo', 'ver', 'mira', 'mirar',
  'hace', 'hacen', 'hago', 'hacer',
  'puede', 'pueden', 'puedo', 'poder',
  'quiere', 'quieren', 'quiero', 'querer',
  'sabe', 'saben', 'sé', 'saber',
  'dice', 'dicen', 'digo', 'decir',
  'da', 'dan', 'doy', 'dar',
  // Prepositions
  'de', 'en', 'con', 'por', 'para', 'a', 'sin',
  'sobre', 'entre', 'hasta', 'desde', 'hacia',
  // Conjunctions
  'y', 'o', 'pero', 'que', 'porque', 'si', 'cuando',
  // Adverbs
  'no', 'sí', 'muy', 'más', 'menos', 'bien', 'mal',
  'aquí', 'allí', 'ahora', 'después', 'antes',
  'siempre', 'nunca', 'también', 'solo',
  // Question words
  'qué', 'quién', 'cómo', 'dónde', 'cuándo', 'por qué', 'cuál',
  // Other common words
  'todo', 'toda', 'todos', 'todas', 'algo', 'nada',
  'mucho', 'mucha', 'muchos', 'muchas', 'poco', 'poca',
  'otro', 'otra', 'otros', 'otras',
  'grande', 'pequeño', 'pequeña', 'nuevo', 'nueva',
  'bueno', 'buena', 'malo', 'mala',
  'uno', 'dos', 'tres', 'cuatro', 'cinco',
  'día', 'vez', 'cosa', 'casa', 'agua', 'tiempo',
]);

/**
 * Check if a word is a high-frequency word
 */
export function isHighFrequencyWord(word: string, language: 'english' | 'spanish'): boolean {
  const hfWords = language === 'spanish' ? SPANISH_HF_WORDS : ENGLISH_HF_WORDS;
  return hfWords.has(word.toLowerCase());
}

/**
 * Get all high-frequency words for a language
 */
export function getHighFrequencyWords(language: 'english' | 'spanish'): Set<string> {
  return language === 'spanish' ? SPANISH_HF_WORDS : ENGLISH_HF_WORDS;
}
