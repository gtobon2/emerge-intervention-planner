import { NextRequest, NextResponse } from 'next/server';
import { getAICompletion, isAIConfigured } from '@/lib/ai';

interface RequestBody {
  words: string[];
  type: 'sentence_completion' | 'draw_and_write';
  language: 'english' | 'spanish';
  count?: number;
}

interface SentenceResult {
  sentence: string;
  targetWord: string;
  distractorWord?: string; // For sentence_completion
}

const SYSTEM_PROMPT = `You are an expert reading intervention specialist creating decodable sentences for elementary students.

Your sentences must be:
1. SEMANTICALLY CORRECT - The sentence must make logical sense with the target word
2. DECODABLE - Use simple, phonetically regular words appropriate for early readers
3. ENGAGING - Create sentences that are interesting and relatable for children
4. SHORT - Keep sentences to 5-8 words maximum
5. AGE-APPROPRIATE - Suitable for K-3 students

For SENTENCE COMPLETION worksheets:
- Create a sentence where the target word fits naturally
- Provide a distractor word from the same word list that does NOT fit
- The distractor should be phonetically similar but semantically wrong

For DRAW AND WRITE worksheets:
- Create simple, concrete sentences that students can easily visualize and draw
- Focus on objects, animals, actions, or scenes that are easy to illustrate

IMPORTANT: Every sentence MUST make logical sense. Never create nonsensical combinations.`;

const SPANISH_SYSTEM_PROMPT = `Eres un especialista experto en intervención de lectura creando oraciones decodificables para estudiantes de primaria.

Tus oraciones deben ser:
1. SEMÁNTICAMENTE CORRECTAS - La oración debe tener sentido lógico con la palabra objetivo
2. DECODIFICABLES - Usa palabras simples y fonéticamente regulares apropiadas para lectores principiantes
3. INTERESANTES - Crea oraciones que sean interesantes y relacionables para niños
4. CORTAS - Mantén las oraciones de 5-8 palabras máximo
5. APROPIADAS PARA LA EDAD - Adecuadas para estudiantes de K-3

Para hojas de COMPLETAR LA ORACIÓN:
- Crea una oración donde la palabra objetivo encaje naturalmente
- Proporciona una palabra distractora de la misma lista que NO encaje
- El distractor debe ser fonéticamente similar pero semánticamente incorrecto

Para hojas de DIBUJA Y ESCRIBE:
- Crea oraciones simples y concretas que los estudiantes puedan visualizar y dibujar fácilmente
- Enfócate en objetos, animales, acciones o escenas fáciles de ilustrar

IMPORTANTE: Cada oración DEBE tener sentido lógico. Nunca crees combinaciones sin sentido.`;

function generatePrompt(body: RequestBody): string {
  const { words, type, count = 6 } = body;
  const wordList = words.join(', ');

  if (type === 'sentence_completion') {
    return `Create ${count} sentence completion items using these target words: ${wordList}

For each item, provide:
1. A sentence with a blank where the target word fits perfectly
2. The correct target word
3. A distractor word from the same list that does NOT make sense in the sentence

Return as JSON array:
[
  {
    "sentence": "The ___ swims in the pond.",
    "targetWord": "fish",
    "distractorWord": "dish"
  }
]

CRITICAL: The target word MUST make sense in the sentence. The distractor MUST NOT make sense.`;
  } else {
    return `Create ${count} simple, drawable sentences using these target words: ${wordList}

Each sentence should be:
- Easy to visualize and draw
- Feature the target word prominently
- Be about concrete things (animals, objects, actions)

Return as JSON array:
[
  {
    "sentence": "The big cat sat on a mat.",
    "targetWord": "cat"
  }
]

CRITICAL: Every sentence must be concrete enough for a child to draw a picture of it.`;
  }
}

function generateSpanishPrompt(body: RequestBody): string {
  const { words, type, count = 6 } = body;
  const wordList = words.join(', ');

  if (type === 'sentence_completion') {
    return `Crea ${count} elementos de completar oraciones usando estas palabras objetivo: ${wordList}

Para cada elemento, proporciona:
1. Una oración con un espacio en blanco donde la palabra objetivo encaja perfectamente
2. La palabra correcta objetivo
3. Una palabra distractora de la misma lista que NO tiene sentido en la oración

Devuelve como array JSON:
[
  {
    "sentence": "El ___ nada en el lago.",
    "targetWord": "pato",
    "distractorWord": "gato"
  }
]

CRÍTICO: La palabra objetivo DEBE tener sentido en la oración. El distractor NO DEBE tener sentido.`;
  } else {
    return `Crea ${count} oraciones simples y dibujables usando estas palabras objetivo: ${wordList}

Cada oración debe ser:
- Fácil de visualizar y dibujar
- Presentar la palabra objetivo prominentemente
- Ser sobre cosas concretas (animales, objetos, acciones)

Devuelve como array JSON:
[
  {
    "sentence": "El gato grande está en la mesa.",
    "targetWord": "gato"
  }
]

CRÍTICO: Cada oración debe ser lo suficientemente concreta para que un niño pueda dibujarla.`;
  }
}

// Fallback sentences when AI is not available
function getFallbackSentences(body: RequestBody): SentenceResult[] {
  const { words, type, language } = body;

  if (language === 'spanish') {
    if (type === 'sentence_completion') {
      return words.slice(0, 6).map((word, idx) => ({
        sentence: `El ___ está aquí.`,
        targetWord: word,
        distractorWord: words[(idx + 3) % words.length] || words[0],
      }));
    } else {
      return words.slice(0, 4).map((word) => ({
        sentence: `Yo veo un ${word}.`,
        targetWord: word,
      }));
    }
  }

  // English fallback
  if (type === 'sentence_completion') {
    return words.slice(0, 6).map((word, idx) => ({
      sentence: `I see a ___.`,
      targetWord: word,
      distractorWord: words[(idx + 3) % words.length] || words[0],
    }));
  } else {
    return words.slice(0, 4).map((word) => ({
      sentence: `The ${word} is here.`,
      targetWord: word,
    }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const { words, type, language = 'english' } = body;

    if (!words || words.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: words' },
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

    const result = await getAICompletion({
      systemPrompt,
      userPrompt,
      maxTokens: 1024,
    });

    // Parse the AI response
    let sentences: SentenceResult[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          sentences = parsed.filter(
            (s) => s.sentence && s.targetWord
          ) as SentenceResult[];
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    // Fallback if parsing failed
    if (sentences.length === 0) {
      console.log('AI response parsing failed, using fallback');
      return NextResponse.json({
        sentences: getFallbackSentences(body),
        source: 'fallback',
        parseError: true,
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

    // Return fallback on error
    const body = { words: [], type: 'draw_and_write', language: 'english' } as RequestBody;
    try {
      body.words = (await request.clone().json()).words || [];
      body.type = (await request.clone().json()).type || 'draw_and_write';
      body.language = (await request.clone().json()).language || 'english';
    } catch {
      // Ignore parse errors
    }

    return NextResponse.json({
      sentences: getFallbackSentences(body),
      source: 'fallback',
      error: 'AI generation failed',
    });
  }
}
