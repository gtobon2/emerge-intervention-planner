import { NextRequest, NextResponse } from 'next/server';
import { getAICompletion, isAIConfigured } from '@/lib/ai';

interface RequestBody {
  targetWords: string[];           // Words to feature in sentences
  decodableWords: string[];        // ALL words the student can decode
  type: 'sentence_completion' | 'draw_and_write';
  language: 'english' | 'spanish';
  count?: number;
}

interface SentenceResult {
  sentence: string;
  targetWord: string;
  distractorWord?: string;
}

// Very basic function words that even early readers encounter
const ENGLISH_FUNCTION_WORDS = [
  'the', 'a', 'an', 'is', 'are', 'was', 'in', 'on', 'at', 'to', 'and',
  'I', 'it', 'he', 'she', 'we', 'my', 'his', 'her', 'can', 'see', 'has',
];

const SPANISH_FUNCTION_WORDS = [
  'el', 'la', 'los', 'las', 'un', 'una', 'es', 'son', 'está', 'en', 'y',
  'mi', 'su', 'yo', 'de', 'con', 'tiene', 've', 'hay',
];

const SYSTEM_PROMPT = `You are creating DECODABLE sentences for beginning readers. This is CRITICAL:

**STRICT VOCABULARY RULE**: You may ONLY use words from these two sources:
1. The DECODABLE WORD LIST provided (words the student can sound out)
2. These basic function words: ${ENGLISH_FUNCTION_WORDS.join(', ')}

**DO NOT use ANY other words.** No exceptions. Every content word must come from the decodable list.

If you cannot make a sensible sentence with the available words, use a very simple pattern like:
- "I see a [word]."
- "The [word] is big."
- "[Word] can run."

For SENTENCE COMPLETION: Create a sentence using a target word, then pick a distractor from the decodable list that doesn't fit.

For DRAW & WRITE: Create simple, concrete sentences about things kids can draw.

Return ONLY valid JSON array. No explanation.`;

const SPANISH_SYSTEM_PROMPT = `Estás creando oraciones DECODIFICABLES para lectores principiantes. Esto es CRÍTICO:

**REGLA ESTRICTA DE VOCABULARIO**: SOLO puedes usar palabras de estas dos fuentes:
1. La LISTA DE PALABRAS DECODIFICABLES proporcionada
2. Estas palabras funcionales básicas: ${SPANISH_FUNCTION_WORDS.join(', ')}

**NO uses NINGUNA otra palabra.** Sin excepciones. Cada palabra de contenido debe venir de la lista decodificable.

Si no puedes hacer una oración sensata con las palabras disponibles, usa un patrón muy simple como:
- "Yo veo un/una [palabra]."
- "El/La [palabra] es grande."

Para COMPLETAR ORACIONES: Crea una oración usando una palabra objetivo, luego elige un distractor de la lista que no encaje.

Para DIBUJA Y ESCRIBE: Crea oraciones simples y concretas sobre cosas que los niños pueden dibujar.

Devuelve SOLO array JSON válido. Sin explicación.`;

function generatePrompt(body: RequestBody): string {
  const { targetWords, decodableWords, type, count = 6 } = body;

  const decodableList = decodableWords.join(', ');
  const targetList = targetWords.join(', ');

  if (type === 'sentence_completion') {
    return `DECODABLE WORDS AVAILABLE: ${decodableList}

TARGET WORDS (must appear in sentences): ${targetList}

Create ${count} sentence completion items. For each:
1. Use a target word in a sentence that makes sense
2. Pick a distractor word from the decodable list that does NOT fit

REMEMBER: Every word except basic function words MUST be from the decodable list above.

Return JSON array:
[{"sentence": "I see a ___.", "targetWord": "cat", "distractorWord": "hat"}]`;
  } else {
    return `DECODABLE WORDS AVAILABLE: ${decodableList}

TARGET WORDS (must appear in sentences): ${targetList}

Create ${count} simple drawable sentences. Each sentence:
- Features one target word
- Uses ONLY decodable words + basic function words
- Is about something concrete a child can draw

Return JSON array:
[{"sentence": "The cat is on a mat.", "targetWord": "cat"}]`;
  }
}

function generateSpanishPrompt(body: RequestBody): string {
  const { targetWords, decodableWords, type, count = 6 } = body;

  const decodableList = decodableWords.join(', ');
  const targetList = targetWords.join(', ');

  if (type === 'sentence_completion') {
    return `PALABRAS DECODIFICABLES DISPONIBLES: ${decodableList}

PALABRAS OBJETIVO (deben aparecer en las oraciones): ${targetList}

Crea ${count} elementos de completar oraciones. Para cada uno:
1. Usa una palabra objetivo en una oración que tenga sentido
2. Elige un distractor de la lista decodificable que NO encaje

RECUERDA: Cada palabra excepto las funcionales básicas DEBE ser de la lista decodificable.

Devuelve array JSON:
[{"sentence": "Yo veo un ___.", "targetWord": "gato", "distractorWord": "pato"}]`;
  } else {
    return `PALABRAS DECODIFICABLES DISPONIBLES: ${decodableList}

PALABRAS OBJETIVO (deben aparecer en las oraciones): ${targetList}

Crea ${count} oraciones simples dibujables. Cada oración:
- Presenta una palabra objetivo
- Usa SOLO palabras decodificables + funcionales básicas
- Es sobre algo concreto que un niño puede dibujar

Devuelve array JSON:
[{"sentence": "El gato está en la mesa.", "targetWord": "gato"}]`;
  }
}

// Fallback sentences when AI is not available
function getFallbackSentences(body: RequestBody): SentenceResult[] {
  const { targetWords, decodableWords, type, language } = body;

  if (language === 'spanish') {
    if (type === 'sentence_completion') {
      return targetWords.slice(0, 6).map((word, idx) => ({
        sentence: `Yo veo un _____.`,
        targetWord: word,
        distractorWord: decodableWords[(idx + 3) % decodableWords.length] || targetWords[0],
      }));
    } else {
      return targetWords.slice(0, 4).map((word) => ({
        sentence: `Yo veo un ${word}.`,
        targetWord: word,
      }));
    }
  }

  // English fallback
  if (type === 'sentence_completion') {
    return targetWords.slice(0, 6).map((word, idx) => ({
      sentence: `I see a _____.`,
      targetWord: word,
      distractorWord: decodableWords[(idx + 3) % decodableWords.length] || targetWords[0],
    }));
  } else {
    return targetWords.slice(0, 4).map((word) => ({
      sentence: `I see a ${word}.`,
      targetWord: word,
    }));
  }
}

// Validate that a sentence only uses allowed words
function validateSentence(
  sentence: string,
  decodableWords: string[],
  functionWords: string[]
): boolean {
  const allowedWords = new Set([
    ...decodableWords.map(w => w.toLowerCase()),
    ...functionWords.map(w => w.toLowerCase()),
  ]);

  // Extract words from sentence (remove punctuation)
  const words = sentence.toLowerCase()
    .replace(/[.,!?'"_]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);

  // Check each word
  for (const word of words) {
    if (!allowedWords.has(word)) {
      console.log(`Invalid word in sentence: "${word}"`);
      return false;
    }
  }
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const { targetWords, decodableWords, type, language = 'english' } = body;

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
      console.log('AI not configured, returning fallback sentences');
      return NextResponse.json({
        sentences: getFallbackSentences(body),
        source: 'fallback',
      });
    }

    // Generate AI sentences
    const systemPrompt = language === 'spanish' ? SPANISH_SYSTEM_PROMPT : SYSTEM_PROMPT;
    const userPrompt = language === 'spanish' ? generateSpanishPrompt(body) : generatePrompt(body);
    const functionWords = language === 'spanish' ? SPANISH_FUNCTION_WORDS : ENGLISH_FUNCTION_WORDS;

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
          // Filter and validate sentences
          sentences = parsed
            .filter((s): s is SentenceResult => s.sentence && s.targetWord)
            .filter(s => {
              // Validate the sentence only uses allowed words
              const isValid = validateSentence(s.sentence, decodableWords, functionWords);
              if (!isValid) {
                console.log(`Rejecting sentence with non-decodable words: "${s.sentence}"`);
              }
              return isValid;
            });
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    // If we don't have enough valid sentences, use fallback
    if (sentences.length < 2) {
      console.log('Not enough valid AI sentences, using fallback');
      return NextResponse.json({
        sentences: getFallbackSentences(body),
        source: 'fallback',
        reason: 'AI sentences contained non-decodable words',
      });
    }

    return NextResponse.json({
      sentences,
      source: 'ai',
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    console.error('Error generating worksheet sentences:', error);

    return NextResponse.json({
      sentences: [],
      source: 'error',
      error: 'AI generation failed',
    });
  }
}
