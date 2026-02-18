import { NextRequest, NextResponse } from 'next/server';
import { getAICompletion, isAIConfigured } from '@/lib/ai';
import { ENGLISH_HF_WORDS, SPANISH_HF_WORDS } from '@/lib/worksheets/high-frequency-words';

interface RequestBody {
  targetWords: string[];
  decodableWords: string[];
  type: 'sentence_completion' | 'draw_and_write';
  language: 'english' | 'spanish';
  count?: number;
  decodableThreshold?: number; // 0.0 to 1.0, default 0.75
}

interface WordAnalysis {
  word: string;
  status: 'decodable' | 'hf' | 'advanced'; // decodable, high-frequency, or not-yet-decodable
}

interface SentenceResult {
  sentence: string;
  targetWord: string;
  distractorWord?: string;
  wordAnalysis?: WordAnalysis[];
  decodablePercent?: number;
}

interface APIResponse {
  sentences: SentenceResult[];
  source: 'ai' | 'fallback';
  reason?: string;
  provider?: string;
  model?: string;
}

// Basic function words allowed in addition to decodable words
const ENGLISH_FUNCTION_WORDS = [
  'the', 'a', 'an', 'is', 'are', 'was', 'in', 'on', 'at', 'to', 'and',
  'i', 'it', 'he', 'she', 'we', 'my', 'his', 'her', 'can', 'see', 'has',
  'big', 'little', 'up', 'down', 'not', 'with', 'for', 'of',
];

const SPANISH_FUNCTION_WORDS = [
  'el', 'la', 'los', 'las', 'un', 'una', 'es', 'son', 'está', 'en', 'y',
  'mi', 'su', 'yo', 'de', 'con', 'tiene', 've', 'hay', 'muy', 'no',
  'grande', 'pequeño', 'aquí', 'allí',
];

const SYSTEM_PROMPT = `You are creating DECODABLE sentences for beginning readers.

VOCABULARY PRIORITY (in order):
1. ALWAYS use words from the DECODABLE WORD LIST when possible
2. You may use common HIGH-FREQUENCY words sparingly (the, a, is, was, etc.)
3. Minimize use of other words - only if absolutely necessary for meaning

TARGET: At least 75-80% of content words should be from the decodable list.

For SENTENCE COMPLETION: Create a sentence using a target word, pick a distractor that doesn't fit.
For DRAW & WRITE: Create simple, concrete sentences kids can visualize and draw.

Keep sentences SHORT (5-8 words max). Make them interesting but simple.
Return ONLY valid JSON array.`;

const SPANISH_SYSTEM_PROMPT = `Estás creando oraciones DECODIFICABLES para lectores principiantes.

PRIORIDAD DE VOCABULARIO (en orden):
1. SIEMPRE usa palabras de la LISTA DECODIFICABLE cuando sea posible
2. Puedes usar palabras de ALTA FRECUENCIA con moderación (el, la, es, un, etc.)
3. Minimiza el uso de otras palabras - solo si es absolutamente necesario

OBJETIVO: Al menos 75-80% de las palabras de contenido deben ser de la lista decodificable.

Para COMPLETAR ORACIONES: Crea una oración con la palabra objetivo, elige un distractor que no encaje.
Para DIBUJA Y ESCRIBE: Crea oraciones simples y concretas que los niños puedan visualizar y dibujar.

Mantén las oraciones CORTAS (5-8 palabras máximo). Hazlas interesantes pero simples.
Devuelve SOLO array JSON válido.`;

function generatePrompt(body: RequestBody): string {
  const { targetWords, decodableWords, type, count = 6 } = body;
  const decodableList = decodableWords.slice(0, 100).join(', '); // Limit for prompt size
  const targetList = targetWords.join(', ');

  if (type === 'sentence_completion') {
    return `DECODABLE WORDS: ${decodableList}

TARGET WORDS (must appear): ${targetList}

Create ${count} sentence completion items. Each needs:
1. A sentence with blank where target word fits
2. The correct target word
3. A distractor from the decodable list that doesn't fit semantically

JSON format: [{"sentence": "The ___ sat on a mat.", "targetWord": "cat", "distractorWord": "hat"}]`;
  } else {
    return `DECODABLE WORDS: ${decodableList}

TARGET WORDS (must appear): ${targetList}

Create ${count} simple, drawable sentences featuring target words.
Each sentence should describe something concrete a child can draw.

JSON format: [{"sentence": "The big cat sat on a mat.", "targetWord": "cat"}]`;
  }
}

function generateSpanishPrompt(body: RequestBody): string {
  const { targetWords, decodableWords, type, count = 6 } = body;
  const decodableList = decodableWords.slice(0, 100).join(', ');
  const targetList = targetWords.join(', ');

  if (type === 'sentence_completion') {
    return `PALABRAS DECODIFICABLES: ${decodableList}

PALABRAS OBJETIVO: ${targetList}

Crea ${count} oraciones para completar. Cada una necesita:
1. Una oración con espacio donde encaja la palabra objetivo
2. La palabra correcta
3. Un distractor de la lista que no encaje semánticamente

Formato JSON: [{"sentence": "El ___ está en la mesa.", "targetWord": "gato", "distractorWord": "pato"}]`;
  } else {
    return `PALABRAS DECODIFICABLES: ${decodableList}

PALABRAS OBJETIVO: ${targetList}

Crea ${count} oraciones simples y dibujables con las palabras objetivo.
Cada oración debe describir algo concreto que un niño pueda dibujar.

Formato JSON: [{"sentence": "El gato grande está en la mesa.", "targetWord": "gato"}]`;
  }
}

/**
 * Analyze words in a sentence
 */
function analyzeSentence(
  sentence: string,
  decodableWords: string[],
  language: 'english' | 'spanish'
): { wordAnalysis: WordAnalysis[]; decodablePercent: number } {
  const decodableSet = new Set(decodableWords.map(w => w.toLowerCase()));
  const hfWords = language === 'spanish' ? SPANISH_HF_WORDS : ENGLISH_HF_WORDS;
  const functionWords = new Set(
    (language === 'spanish' ? SPANISH_FUNCTION_WORDS : ENGLISH_FUNCTION_WORDS)
      .map(w => w.toLowerCase())
  );

  // Extract words (remove punctuation)
  const words = sentence.toLowerCase()
    .replace(/[.,!?'"_\-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);

  const wordAnalysis: WordAnalysis[] = [];
  let decodableCount = 0;
  let contentWordCount = 0;

  for (const word of words) {
    let status: 'decodable' | 'hf' | 'advanced';

    if (decodableSet.has(word)) {
      status = 'decodable';
      decodableCount++;
      contentWordCount++;
    } else if (hfWords.has(word) || functionWords.has(word)) {
      status = 'hf';
      // HF words don't count toward decodable %, but also not against
    } else {
      status = 'advanced';
      contentWordCount++;
    }

    wordAnalysis.push({ word, status });
  }

  const decodablePercent = contentWordCount > 0
    ? Math.round((decodableCount / contentWordCount) * 100)
    : 100;

  return { wordAnalysis, decodablePercent };
}

/**
 * Validate sentence meets decodability threshold
 */
function validateSentence(
  sentence: string,
  decodableWords: string[],
  language: 'english' | 'spanish',
  threshold: number = 0.75
): { valid: boolean; wordAnalysis: WordAnalysis[]; decodablePercent: number } {
  const { wordAnalysis, decodablePercent } = analyzeSentence(sentence, decodableWords, language);
  const valid = decodablePercent >= threshold * 100;
  return { valid, wordAnalysis, decodablePercent };
}

/**
 * Generate fallback sentences
 */
function getFallbackSentences(body: RequestBody): SentenceResult[] {
  const { targetWords, decodableWords, type, language } = body;

  if (language === 'spanish') {
    if (type === 'sentence_completion') {
      return targetWords.slice(0, 6).map((word, idx) => {
        const sentence = `Yo veo un _____.`;
        const { wordAnalysis, decodablePercent } = analyzeSentence(
          sentence.replace('_____', word),
          decodableWords,
          language
        );
        return {
          sentence,
          targetWord: word,
          distractorWord: decodableWords[(idx + 3) % decodableWords.length] || targetWords[0],
          wordAnalysis,
          decodablePercent,
        };
      });
    } else {
      return targetWords.slice(0, 4).map((word) => {
        const sentence = `Yo veo un ${word}.`;
        const { wordAnalysis, decodablePercent } = analyzeSentence(sentence, decodableWords, language);
        return {
          sentence,
          targetWord: word,
          wordAnalysis,
          decodablePercent,
        };
      });
    }
  }

  // English fallback
  if (type === 'sentence_completion') {
    return targetWords.slice(0, 6).map((word, idx) => {
      const sentence = `I see a _____.`;
      const { wordAnalysis, decodablePercent } = analyzeSentence(
        sentence.replace('_____', word),
        decodableWords,
        language
      );
      return {
        sentence,
        targetWord: word,
        distractorWord: decodableWords[(idx + 3) % decodableWords.length] || targetWords[0],
        wordAnalysis,
        decodablePercent,
      };
    });
  } else {
    return targetWords.slice(0, 4).map((word) => {
      const sentence = `I see a ${word}.`;
      const { wordAnalysis, decodablePercent } = analyzeSentence(sentence, decodableWords, language);
      return {
        sentence,
        targetWord: word,
        wordAnalysis,
        decodablePercent,
      };
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const {
      targetWords,
      decodableWords,
      type,
      language = 'english',
      decodableThreshold = 0.75
    } = body;

    if (!targetWords || targetWords.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: targetWords' },
        { status: 400 }
      );
    }

    if (!decodableWords || decodableWords.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: decodableWords' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400 }
      );
    }

    // Check if AI is configured
    if (!isAIConfigured()) {
      const response: APIResponse = {
        sentences: getFallbackSentences(body),
        source: 'fallback',
        reason: 'AI not configured',
      };
      return NextResponse.json(response);
    }

    // Generate AI sentences
    const systemPrompt = language === 'spanish' ? SPANISH_SYSTEM_PROMPT : SYSTEM_PROMPT;
    const userPrompt = language === 'spanish' ? generateSpanishPrompt(body) : generatePrompt(body);

    const result = await getAICompletion({
      systemPrompt,
      userPrompt,
      maxTokens: 1024,
    });

    // Parse the AI response
    let sentences: SentenceResult[] = [];
    try {
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          const validParsed = parsed.filter(
            (s): s is { sentence: string; targetWord: string; distractorWord?: string } =>
              s && s.sentence && s.targetWord
          );

          for (const s of validParsed) {
            const { valid, wordAnalysis, decodablePercent } = validateSentence(
              s.sentence,
              decodableWords,
              language,
              decodableThreshold
            );

            // Only include if meets threshold
            if (!valid) {
              continue;
            }

            sentences.push({
              sentence: s.sentence,
              targetWord: s.targetWord,
              distractorWord: s.distractorWord,
              wordAnalysis,
              decodablePercent,
            });
          }
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    // If not enough valid sentences, use fallback
    if (sentences.length < 2) {
      const response: APIResponse = {
        sentences: getFallbackSentences(body),
        source: 'fallback',
        reason: 'AI sentences did not meet decodability threshold',
      };
      return NextResponse.json(response);
    }

    const response: APIResponse = {
      sentences,
      source: 'ai',
      provider: result.provider,
      model: result.model,
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error generating worksheet sentences:', error);
    return NextResponse.json({
      sentences: [],
      source: 'fallback',
      reason: 'AI generation error',
    } as APIResponse);
  }
}
