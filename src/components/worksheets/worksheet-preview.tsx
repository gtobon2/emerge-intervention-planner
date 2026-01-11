'use client';

import { Card } from '@/components/ui';
import type { GeneratedWorksheet, WorksheetSection, WorksheetItem } from '@/lib/worksheets';

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
