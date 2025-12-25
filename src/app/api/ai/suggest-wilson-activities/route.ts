import { NextRequest, NextResponse } from 'next/server';
import { getAICompletion, isAIConfigured, SYSTEM_PROMPTS } from '@/lib/ai';
import type { LessonComponentType, LessonPlanElement } from '@/lib/curriculum/wilson-lesson-elements';

interface RequestBody {
  substep: string;
  component: LessonComponentType;
  componentName: string;
  elements: LessonPlanElement[];
  currentActivities: string[];
}

// Science of Reading activity database by component type
const SOR_ACTIVITY_HINTS: Record<LessonComponentType, string[]> = {
  'sound-cards': [
    'Tapping/finger counting for phonemes',
    'Air writing the grapheme while saying the sound',
    'Sound card quick flash drill',
    'Keyword connection (show picture, say sound)',
  ],
  'teach-review': [
    'Elkonin boxes for sound-symbol mapping',
    'Concept explanation with visual anchor chart',
    'Teacher modeling with think-aloud',
    'Interactive whiteboard manipulation',
  ],
  'word-cards': [
    'Scooping syllables while reading',
    'Tap and blend procedure',
    'Word card shuffle and read',
    'Partner word card quiz',
  ],
  'word-list-reading': [
    'Choral reading for fluency',
    'Echo reading with teacher model',
    'Timed word list for automaticity',
    'Error correction with immediate feedback',
  ],
  'sentence-reading': [
    'Phrase-cued reading with slashes',
    'Prosody practice with punctuation cues',
    'Sentence reconstruction with word cards',
    'Echo reading for fluency modeling',
  ],
  'passage-reading': [
    'Repeated reading for fluency',
    'Partner reading with comprehension check',
    'Whisper reading with monitoring',
    'Oral reading with expression focus',
  ],
  'quick-drill': [
    'Rapid sound card flip',
    'Beat the clock sound review',
    'Random sound selection drill',
    'Chain drill around the group',
  ],
  'dictation-sounds': [
    'Sound-by-sound dictation with finger spelling',
    'Visual checking against sound cards',
    'Self-correction with model',
    'Auditory discrimination practice',
  ],
  'dictation-words': [
    'Finger spelling before writing',
    'Sound boxes for spelling scaffold',
    'Syllable division before spelling',
    'Proof and edit routine',
  ],
  'dictation-sentences': [
    'Repeat sentence before writing',
    'Count words on fingers first',
    'Capital and punctuation check',
    'Edit with colored pencil',
  ],
};

function generateWilsonActivityPrompt(body: RequestBody): string {
  const { substep, componentName, elements, currentActivities } = body;

  const elementsList = elements.length > 0
    ? elements.map((e) => `- ${e.type}: "${e.value}"`).join('\n')
    : 'No elements added yet';

  const currentList = currentActivities.length > 0
    ? currentActivities.map((a) => `- ${a}`).join('\n')
    : 'None yet';

  const hints = SOR_ACTIVITY_HINTS[body.component] || [];
  const hintsSection = hints.length > 0
    ? `\n\nCommon Science of Reading activities for this component:\n${hints.map((h) => `- ${h}`).join('\n')}`
    : '';

  return `Generate 2-3 specific instructional activities for a Wilson Reading System lesson.

**Lesson Context:**
- Substep: ${substep}
- Component: ${componentName}
- Elements to practice:
${elementsList}

**Current activities already planned:**
${currentList}
${hintsSection}

**Requirements:**
1. Each activity should be specific to the elements listed
2. Include the exact words/sounds from the elements when possible
3. Keep each suggestion to 1-2 sentences
4. Focus on multisensory, explicit instruction
5. Don't repeat activities already planned

Return ONLY the activities as a JSON array of strings. Example:
["Use finger tapping to blend the sounds in 'chip' and 'shop'", "Have students air write 'th' while saying /th/"]`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const { substep, component, componentName, elements } = body;

    if (!substep || !component || !componentName) {
      return NextResponse.json(
        { error: 'Missing required fields: substep, component, componentName' },
        { status: 400 }
      );
    }

    if (!isAIConfigured()) {
      // Return fallback suggestions from SOR database
      const fallbackSuggestions = SOR_ACTIVITY_HINTS[component]?.slice(0, 3) || [
        'Practice with the selected elements',
        'Use multisensory techniques',
        'Provide immediate feedback',
      ];
      return NextResponse.json({ suggestions: fallbackSuggestions });
    }

    const prompt = generateWilsonActivityPrompt(body);

    const result = await getAICompletion({
      systemPrompt: SYSTEM_PROMPTS.wilsonActivities,
      userPrompt: prompt,
      maxTokens: 512,
    });

    // Parse the AI response
    let suggestions: string[] = [];
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(result.text);
      if (Array.isArray(parsed)) {
        suggestions = parsed.filter((s) => typeof s === 'string');
      }
    } catch {
      // If not valid JSON, split by newlines and clean up
      suggestions = result.text
        .split('\n')
        .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
        .filter((line) => line.length > 10 && line.length < 200);
    }

    // Limit to 3 suggestions
    suggestions = suggestions.slice(0, 3);

    // Fallback if no valid suggestions
    if (suggestions.length === 0) {
      suggestions = SOR_ACTIVITY_HINTS[component]?.slice(0, 2) || [
        'Practice with the selected elements using multisensory techniques',
      ];
    }

    return NextResponse.json({
      suggestions,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    console.error('Error suggesting Wilson activities:', error);

    // Return fallback on error
    return NextResponse.json({
      suggestions: [
        'Use multisensory techniques for practice',
        'Provide immediate corrective feedback',
      ],
      error: 'AI unavailable, showing default suggestions',
    });
  }
}
