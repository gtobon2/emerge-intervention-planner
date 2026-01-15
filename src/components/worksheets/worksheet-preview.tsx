'use client';

import { Card } from '@/components/ui';
import type { GeneratedWorksheet, WorksheetSection, WorksheetItem, WordAnalysis } from '@/lib/worksheets';

/**
 * Render text with highlighted words based on word analysis
 * - Decodable words: normal style
 * - HF (high-frequency) words: bold
 * - Advanced (not-yet-decodable) words: italic with underline
 */
function HighlightedText({ text, wordAnalysis }: { text: string; wordAnalysis?: WordAnalysis[] }) {
  if (!wordAnalysis || wordAnalysis.length === 0) {
    return <>{text}</>;
  }

  // Create a map for quick lookup
  const analysisMap = new Map<string, 'decodable' | 'hf' | 'advanced'>();
  wordAnalysis.forEach(wa => {
    analysisMap.set(wa.word.toLowerCase(), wa.status);
  });

  // Split text into words and non-words (punctuation, spaces)
  const tokens = text.split(/(\s+|[.,!?'"_\-]+)/);

  return (
    <>
      {tokens.map((token, idx) => {
        const cleanWord = token.toLowerCase().replace(/[.,!?'"_\-]/g, '');
        const status = analysisMap.get(cleanWord);

        if (status === 'hf') {
          return (
            <span key={idx} className="font-bold text-amber-700" title="High-frequency word">
              {token}
            </span>
          );
        } else if (status === 'advanced') {
          return (
            <span key={idx} className="italic underline text-red-600" title="Not yet decodable">
              {token}
            </span>
          );
        }
        return <span key={idx}>{token}</span>;
      })}
    </>
  );
}

interface WorksheetPreviewProps {
  worksheet: GeneratedWorksheet;
}

export function WorksheetPreview({ worksheet }: WorksheetPreviewProps) {
  return (
    <Card className="p-6 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {worksheet.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Step {worksheet.stepNumber}: {worksheet.stepName}
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Name: ___________________</p>
            <p className="mt-1">Date: ___________________</p>
          </div>
        </div>
        <p className="text-sm italic text-gray-600 mt-4">
          {worksheet.instructions}
        </p>
      </div>

      {/* Word Analysis Legend (for AI-generated sentences) */}
      {worksheet.config.template === 'sentence_completion' || worksheet.config.template === 'draw_and_write' ? (
        <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-medium text-blue-800 mb-2">Word Highlighting Key:</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="text-gray-700">Regular = Decodable</span>
            <span className="font-bold text-amber-700">Bold = High-frequency</span>
            <span className="italic underline text-red-600">Italic = Not yet decodable</span>
          </div>
        </div>
      ) : null}

      {/* Sections */}
      <div className="space-y-8">
        {worksheet.content.sections.map((section, idx) => (
          <SectionRenderer key={idx} section={section} />
        ))}
      </div>

      {/* Concepts Reference */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Key Concepts ({worksheet.substepData.substep})
        </h3>
        <ul className="text-xs text-gray-600 space-y-1">
          {worksheet.substepData.concepts.slice(0, 3).map((concept, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-wilson">•</span>
              {concept}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function SectionRenderer({ section }: { section: WorksheetSection }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-100">
        {section.title}
      </h2>

      {section.type === 'word_list' && (
        <WordListSection items={section.items} />
      )}

      {section.type === 'sound_boxes' && (
        <SoundBoxSection items={section.items} />
      )}

      {section.type === 'sentences' && (
        <SentenceSection items={section.items} />
      )}

      {section.type === 'syllable_split' && (
        <SyllableSplitSection items={section.items} />
      )}

      {section.type === 'fill_blank' && (
        <FillBlankSection items={section.items} />
      )}

      {section.type === 'matching' && (
        <MatchingSection items={section.items} />
      )}

      {section.type === 'sentence_choice' && (
        <SentenceChoiceSection items={section.items} />
      )}

      {section.type === 'draw_area' && (
        <DrawAreaSection items={section.items} />
      )}
    </div>
  );
}

function WordListSection({ items }: { items: WorksheetItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 p-2 bg-gray-50 rounded"
        >
          <span className="text-xs text-gray-400 w-5">{item.id}.</span>
          <span className="text-gray-800 font-medium">{item.prompt}</span>
        </div>
      ))}
    </div>
  );
}

function SoundBoxSection({ items }: { items: WorksheetItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-20">
            {item.id}. {item.prompt}
          </span>
          <div className="flex gap-1">
            {item.soundBoxes?.map((box, idx) => (
              <div
                key={idx}
                className="w-10 h-10 border-2 border-gray-300 rounded flex items-center justify-center text-lg font-medium text-gray-400"
              >
                {box.filled ? box.sound : ''}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SentenceSection({ items }: { items: WorksheetItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id}>
          <p className="text-sm text-gray-600 mb-1">{item.prompt}</p>
          <div className="h-8 border-b-2 border-gray-300 border-dashed" />
          <div className="h-8 border-b-2 border-gray-300 border-dashed mt-2" />
        </div>
      ))}
    </div>
  );
}

function SyllableSplitSection({ items }: { items: WorksheetItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-4">
          <span className="text-sm text-gray-600 w-24">
            {item.id}. {item.prompt}
          </span>
          <span className="text-gray-400">→</span>
          <div className="flex gap-2">
            <div className="w-20 h-8 border-b-2 border-gray-300" />
            <span className="text-gray-400">/</span>
            <div className="w-20 h-8 border-b-2 border-gray-300" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FillBlankSection({ items }: { items: WorksheetItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{item.id}.</span>
          <span className="text-gray-800">{item.prompt}</span>
        </div>
      ))}
    </div>
  );
}

function MatchingSection({ items }: { items: WorksheetItem[] }) {
  const options = items[0]?.options || [];

  return (
    <div>
      <div className="mb-4 p-2 bg-gray-100 rounded text-sm text-gray-600">
        <span className="font-medium">Options: </span>
        {options.join('  |  ')}
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4">
            <span className="text-sm text-gray-600 w-32">
              {item.id}. {item.prompt}
            </span>
            <div className="flex-1 h-6 border-b-2 border-gray-300 max-w-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SentenceChoiceSection({ items }: { items: WorksheetItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm text-gray-700">
              {item.id}. <HighlightedText text={item.prompt} wordAnalysis={item.wordAnalysis} />
            </p>
            {item.decodablePercent !== undefined && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                item.decodablePercent >= 80 ? 'bg-green-100 text-green-700' :
                item.decodablePercent >= 60 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {item.decodablePercent}% decodable
              </span>
            )}
          </div>
          <div className="flex gap-4 ml-4">
            {item.options?.map((option, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <span className="w-5 h-5 border-2 border-gray-400 rounded-full" />
                <span className="text-gray-800 font-medium">{option}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DrawAreaSection({ items }: { items: WorksheetItem[] }) {
  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm text-gray-700 font-medium">
              {item.id}. Read: &quot;<HighlightedText text={item.prompt} wordAnalysis={item.wordAnalysis} />&quot;
            </p>
            {item.decodablePercent !== undefined && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                item.decodablePercent >= 80 ? 'bg-green-100 text-green-700' :
                item.decodablePercent >= 60 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {item.decodablePercent}% decodable
              </span>
            )}
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 h-32 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Draw your picture here</span>
          </div>
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Write the sentence:</p>
            <div className="h-6 border-b-2 border-gray-300 border-dashed" />
          </div>
        </div>
      ))}
    </div>
  );
}
