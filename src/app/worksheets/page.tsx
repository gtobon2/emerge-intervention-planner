'use client';

import { useState, useMemo } from 'react';
import { FileText, Printer, Download, RefreshCw, Eye, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { WorksheetConfigPanel } from '@/components/worksheets/worksheet-config-panel';
import { WorksheetPreview } from '@/components/worksheets/worksheet-preview';
import { WorksheetTemplateSelector } from '@/components/worksheets/worksheet-template-selector';
import {
  generateWorksheet,
  type WorksheetConfig,
  type WorksheetTemplate,
  type DifficultyLevel,
  type GeneratedWorksheet,
  WORKSHEET_TEMPLATES,
} from '@/lib/worksheets';
import { exportWorksheetToPDF, exportAnswerKeyToPDF } from '@/lib/worksheets/pdf-export';
import { WILSON_STEPS, getAllWilsonSubsteps } from '@/lib/curriculum/wilson';
import { getWordsForSubstep, getCumulativeWords } from '@/lib/worksheets/word-utils';

export default function WorksheetsPage() {
  // Configuration state
  const [selectedTemplate, setSelectedTemplate] = useState<WorksheetTemplate>('word_list');
  const [selectedSubstep, setSelectedSubstep] = useState<string>('1.1');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [wordCount, setWordCount] = useState<number>(12);
  const [includeNonsense, setIncludeNonsense] = useState<boolean>(true);
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(true);
  const [studentName, setStudentName] = useState<string>('');

  // Generated worksheet state
  const [worksheet, setWorksheet] = useState<GeneratedWorksheet | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // AI generation state
  const [useAI, setUseAI] = useState<boolean>(true);
  const [aiStatus, setAiStatus] = useState<string>('');

  // Check if template needs AI sentences
  const needsAISentences = selectedTemplate === 'sentence_completion' || selectedTemplate === 'draw_and_write';

  // Get all substeps for dropdown
  const allSubsteps = useMemo(() => getAllWilsonSubsteps(), []);

  // Group substeps by step for the dropdown
  const substepOptions = useMemo(() => {
    return WILSON_STEPS.map(step => ({
      label: `Step ${step.step}: ${step.name}`,
      options: step.substeps.map(ss => ({
        value: ss.substep,
        label: `${ss.substep} - ${ss.name}`,
      })),
    }));
  }, []);

  // Generate worksheet
  const handleGenerate = async () => {
    setIsGenerating(true);
    setAiStatus('');

    const config: WorksheetConfig = {
      template: selectedTemplate,
      substep: selectedSubstep,
      difficulty,
      wordCount,
      includeNonsenseWords: includeNonsense,
      includeAnswerKey,
      studentName: studentName || undefined,
      date: new Date().toLocaleDateString(),
    };

    // Generate base worksheet
    const generated = generateWorksheet(config);

    if (!generated) {
      setIsGenerating(false);
      return;
    }

    // If AI is enabled and template needs sentences, enhance with AI
    if (useAI && needsAISentences) {
      setAiStatus('Generating decodable sentences with AI...');

      try {
        // Get target words from the substep
        const { realWords } = getWordsForSubstep(selectedSubstep, wordCount, false);

        // Get ALL decodable words up to this substep
        const decodableWords = getCumulativeWords(selectedSubstep);

        // Call AI endpoint with decodable word constraint
        const response = await fetch('/api/ai/generate-worksheet-sentences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetWords: realWords.slice(0, 8),
            decodableWords: decodableWords,
            type: selectedTemplate,
            language: 'english',
            count: selectedTemplate === 'draw_and_write' ? 4 : 6,
          }),
        });

        if (response.ok) {
          const data = await response.json();

          if (data.sentences && data.sentences.length > 0) {
            // Update the worksheet with AI-generated sentences
            const updatedContent = { ...generated.content };

            updatedContent.sections = updatedContent.sections.map(section => {
              if (section.type === 'sentence_choice') {
                return {
                  ...section,
                  items: data.sentences.slice(0, section.items.length).map((s: { sentence: string; targetWord: string; distractorWord?: string }, idx: number) => ({
                    id: idx + 1,
                    prompt: s.sentence.replace(s.targetWord, '_____'),
                    answer: s.targetWord,
                    options: s.distractorWord
                      ? (Math.random() > 0.5 ? [s.targetWord, s.distractorWord] : [s.distractorWord, s.targetWord])
                      : [s.targetWord, realWords[(idx + 3) % realWords.length]],
                  })),
                };
              }
              if (section.type === 'draw_area') {
                return {
                  ...section,
                  items: data.sentences.slice(0, section.items.length).map((s: { sentence: string; targetWord: string }, idx: number) => ({
                    id: idx + 1,
                    prompt: s.sentence,
                    answer: s.sentence,
                  })),
                };
              }
              return section;
            });

            generated.content = updatedContent;
            setAiStatus(data.source === 'ai' ? '✨ AI-enhanced sentences' : '');
          }
        }
      } catch (error) {
        console.error('AI generation failed:', error);
        setAiStatus('Using default sentences (AI unavailable)');
      }
    }

    setWorksheet(generated);
    setShowPreview(true);
    setIsGenerating(false);
  };

  // Export handlers
  const handleExportPDF = () => {
    if (worksheet) {
      exportWorksheetToPDF(worksheet);
    }
  };

  const handleExportAnswerKey = () => {
    if (worksheet && worksheet.answerKey) {
      exportAnswerKeyToPDF(worksheet);
    }
  };

  const handlePrint = () => {
    // Generate PDF and print
    if (worksheet) {
      exportWorksheetToPDF(worksheet);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
              <FileText className="w-6 h-6 text-wilson" />
              Wilson Worksheet Generator
            </h1>
            <p className="text-sm md:text-base text-text-muted mt-1">
              Create practice worksheets aligned to Wilson Reading System scope and sequence
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-1 space-y-4">
            {/* Template Selection */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                1. Choose Template
              </h2>
              <WorksheetTemplateSelector
                selected={selectedTemplate}
                onSelect={setSelectedTemplate}
              />
            </Card>

            {/* Configuration Panel */}
            <WorksheetConfigPanel
              selectedSubstep={selectedSubstep}
              onSubstepChange={setSelectedSubstep}
              difficulty={difficulty}
              onDifficultyChange={setDifficulty}
              wordCount={wordCount}
              onWordCountChange={setWordCount}
              includeNonsense={includeNonsense}
              onIncludeNonsenseChange={setIncludeNonsense}
              includeAnswerKey={includeAnswerKey}
              onIncludeAnswerKeyChange={setIncludeAnswerKey}
              studentName={studentName}
              onStudentNameChange={setStudentName}
              substepOptions={substepOptions}
            />

            {/* AI Option (only for sentence templates) */}
            {needsAISentences && (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="useAI"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="w-4 h-4 rounded border-border-default text-wilson focus:ring-wilson"
                  />
                  <label htmlFor="useAI" className="flex items-center gap-2 text-sm text-text-secondary">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Use AI to create meaningful sentences
                  </label>
                </div>
                <p className="text-xs text-text-muted mt-2 ml-7">
                  AI generates sentences that make sense with your target words
                </p>
              </Card>
            )}

            {/* Generate Button */}
            <Button
              className="w-full gap-2"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {aiStatus || 'Generating...'}
                </>
              ) : (
                <>
                  {needsAISentences && useAI ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  Generate Worksheet
                </>
              )}
            </Button>

            {/* AI Status */}
            {aiStatus && !isGenerating && (
              <p className="text-sm text-center text-emerald-600">{aiStatus}</p>
            )}
          </div>

          {/* Right Column: Preview & Export */}
          <div className="lg:col-span-2">
            {worksheet && showPreview ? (
              <div className="space-y-4">
                {/* Export Actions */}
                <Card className="p-4">
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-wilson" />
                      <span className="font-medium text-text-primary">
                        Preview: {worksheet.title}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                        onClick={handlePrint}
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                        onClick={handleExportPDF}
                      >
                        <Download className="w-4 h-4" />
                        Export PDF
                      </Button>
                      {worksheet.answerKey && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="gap-1"
                          onClick={handleExportAnswerKey}
                        >
                          <Download className="w-4 h-4" />
                          Answer Key
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Worksheet Preview */}
                <WorksheetPreview worksheet={worksheet} />
              </div>
            ) : (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  No Worksheet Generated
                </h3>
                <p className="text-text-muted mb-4">
                  Configure your options and click &quot;Generate Worksheet&quot; to create a practice sheet.
                </p>
                <div className="text-sm text-text-muted">
                  <p className="font-medium mb-2">Available Templates:</p>
                  <ul className="space-y-1">
                    {Object.entries(WORKSHEET_TEMPLATES).map(([key, template]) => (
                      <li key={key} className="flex items-center justify-center gap-2">
                        <span>{template.icon}</span>
                        <span>{template.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
