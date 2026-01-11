'use client';

import { type WorksheetTemplate, WORKSHEET_TEMPLATES } from '@/lib/worksheets';

interface WorksheetTemplateSelectorProps {
  selected: WorksheetTemplate;
  onSelect: (template: WorksheetTemplate) => void;
}

export function WorksheetTemplateSelector({
  selected,
  onSelect,
}: WorksheetTemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {(Object.entries(WORKSHEET_TEMPLATES) as [WorksheetTemplate, typeof WORKSHEET_TEMPLATES[WorksheetTemplate]][]).map(
        ([key, template]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`
              p-3 rounded-lg border-2 transition-all text-left
              ${
                selected === key
                  ? 'border-wilson bg-wilson/10 text-wilson'
                  : 'border-text-muted/20 hover:border-wilson/50 text-text-secondary'
              }
            `}
          >
            <div className="text-2xl mb-1">{template.icon}</div>
            <div className="text-xs font-medium leading-tight">
              {template.name}
            </div>
          </button>
        )
      )}
    </div>
  );
}
