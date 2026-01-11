'use client';

import { useState, useMemo } from 'react';
import { FileText, Printer, Download, RefreshCw, Eye } from 'lucide-react';
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
  const handleGenerate = () => {
    setIsGenerating(true);

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

    // Simulate slight delay for UX
    setTimeout(() => {
      const generated = generateWorksheet(config);
      setWorksheet(generated);
      setShowPreview(true);
      setIsGenerating(false);
    }, 300);
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

            {/* Generate Button */}
            <Button
              className="w-full gap-2"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Worksheet
                </>
              )}
            </Button>
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
