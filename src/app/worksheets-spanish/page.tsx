'use client';

import { useState, useMemo } from 'react';
import { FileText, Printer, Download, RefreshCw, Eye, Languages, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import {
  generateSpanishWorksheet,
  type SpanishWorksheetConfig,
  type SpanishWorksheetTemplate,
  type GeneratedSpanishWorksheet,
  SPANISH_WORKSHEET_TEMPLATES,
  getAllDespegandoLessonsForDropdown,
} from '@/lib/worksheets/despegando-generators';
import { type DifficultyLevel, DIFFICULTY_SETTINGS } from '@/lib/worksheets/types';
import { DESPEGANDO_PHASES } from '@/lib/curriculum/despegando';
import { getCumulativeSpanishWords } from '@/lib/worksheets/spanish-word-utils';
import { exportWorksheetToPDF, exportAnswerKeyToPDF } from '@/lib/worksheets/pdf-export';

export default function SpanishWorksheetsPage() {
  // Configuration state
  const [selectedTemplate, setSelectedTemplate] = useState<SpanishWorksheetTemplate>('syllable_grid');
  const [selectedLesson, setSelectedLesson] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [wordCount, setWordCount] = useState<number>(12);
  const [includeNonsense, setIncludeNonsense] = useState<boolean>(true);
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(true);
  const [studentName, setStudentName] = useState<string>('');

  // Generated worksheet state
  const [worksheet, setWorksheet] = useState<GeneratedSpanishWorksheet | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // AI generation state
  const [useAI, setUseAI] = useState<boolean>(true);
  const [aiStatus, setAiStatus] = useState<string>('');

  // Check if template needs AI sentences
  const needsAISentences = selectedTemplate === 'sentence_completion_spanish' || selectedTemplate === 'draw_and_write_spanish';

  // Group lessons by phase for the dropdown
  const lessonOptions = useMemo(() => {
    return DESPEGANDO_PHASES.map(phase => ({
      label: `Phase ${phase.phase}: ${phase.name}`,
      labelSpanish: `Fase ${phase.phase}: ${phase.nameSpanish}`,
      options: phase.lessons.map(lesson => ({
        value: lesson.lesson,
        label: `L${lesson.lesson} - ${lesson.name}`,
        labelSpanish: `L${lesson.lesson} - ${lesson.nameSpanish}`,
      })),
    }));
  }, []);

  // Generate worksheet
  const handleGenerate = async () => {
    setIsGenerating(true);
    setAiStatus('');

    const config: SpanishWorksheetConfig = {
      template: selectedTemplate,
      lesson: selectedLesson,
      difficulty,
      wordCount,
      includeNonsenseWords: includeNonsense,
      includeAnswerKey,
      studentName: studentName || undefined,
      date: new Date().toLocaleDateString(),
    };

    // Generate base worksheet
    const generated = generateSpanishWorksheet(config);

    if (!generated) {
      setIsGenerating(false);
      return;
    }

    // If AI is enabled and template needs sentences, enhance with AI
    if (useAI && needsAISentences) {
      setAiStatus('Generando oraciones decodificables con IA...');

      try {
        // Get target words from the lesson
        const targetWords = generated.lessonData.sampleWords.slice(0, 8);

        // Get ALL decodable words up to this lesson
        const decodableWords = getCumulativeSpanishWords(selectedLesson);

        // Call AI endpoint with decodable word constraint
        const response = await fetch('/api/ai/generate-worksheet-sentences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetWords: targetWords,
            decodableWords: decodableWords,
            type: selectedTemplate.replace('_spanish', ''),
            language: 'spanish',
            count: selectedTemplate === 'draw_and_write_spanish' ? 4 : 6,
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
                  items: data.sentences.slice(0, section.items.length).map((s: { sentence: string; targetWord: string; distractorWord?: string; wordAnalysis?: Array<{word: string; status: string}>; decodablePercent?: number }, idx: number) => ({
                    id: idx + 1,
                    prompt: s.sentence.replace(s.targetWord, '_____'),
                    answer: s.targetWord,
                    options: s.distractorWord
                      ? (Math.random() > 0.5 ? [s.targetWord, s.distractorWord] : [s.distractorWord, s.targetWord])
                      : [s.targetWord, targetWords[(idx + 3) % targetWords.length]],
                    wordAnalysis: s.wordAnalysis,
                    decodablePercent: s.decodablePercent,
                  })),
                };
              }
              if (section.type === 'draw_area') {
                return {
                  ...section,
                  items: data.sentences.slice(0, section.items.length).map((s: { sentence: string; targetWord: string; wordAnalysis?: Array<{word: string; status: string}>; decodablePercent?: number }, idx: number) => ({
                    id: idx + 1,
                    prompt: s.sentence,
                    answer: s.sentence,
                    wordAnalysis: s.wordAnalysis,
                    decodablePercent: s.decodablePercent,
                  })),
                };
              }
              return section;
            });

            generated.content = updatedContent;

            // Show detailed status
            if (data.source === 'ai') {
              const avgDecodable = data.sentences.reduce((sum: number, s: {decodablePercent?: number}) => sum + (s.decodablePercent || 0), 0) / data.sentences.length;
              setAiStatus(`✨ IA generada (${Math.round(avgDecodable)}% decodificable)`);
            } else {
              setAiStatus(`📝 Predeterminado: ${data.reason || 'IA no disponible'}`);
            }
          }
        }
      } catch (error) {
        console.error('AI generation failed:', error);
        setAiStatus('Usando oraciones predeterminadas');
      }
    }

    setWorksheet(generated);
    setShowPreview(true);
    setIsGenerating(false);
  };

  // Export handlers - will need Spanish-specific PDF export
  const handleExportPDF = () => {
    if (worksheet) {
      // For now, use a simplified export - can enhance later
      exportSpanishWorksheetToPDF(worksheet);
    }
  };

  const handleExportAnswerKey = () => {
    if (worksheet && worksheet.answerKey) {
      exportSpanishAnswerKeyToPDF(worksheet);
    }
  };

  const handlePrint = () => {
    if (worksheet) {
      exportSpanishWorksheetToPDF(worksheet);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
              <Languages className="w-6 h-6 text-emerald-600" />
              Despegando Worksheet Generator
            </h1>
            <p className="text-sm md:text-base text-text-muted mt-1">
              Generador de Hojas de Práctica - Spanish reading intervention worksheets
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-1 space-y-4">
            {/* Template Selection */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                1. Choose Template / Escoge Plantilla
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(SPANISH_WORKSHEET_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTemplate(key as SpanishWorksheetTemplate)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedTemplate === key
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-border-default hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{template.icon}</span>
                      <span className="font-medium text-text-primary text-sm">
                        {template.name}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted line-clamp-2">
                      {template.descriptionSpanish}
                    </p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Configuration Panel */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                2. Configure / Configurar
              </h2>

              {/* Lesson Select */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Lesson / Lección
                  </label>
                  <select
                    value={selectedLesson}
                    onChange={(e) => setSelectedLesson(parseInt(e.target.value, 10))}
                    className="w-full p-2 rounded-lg border border-border-default bg-surface-secondary text-text-primary focus:ring-2 focus:ring-emerald-500"
                  >
                    {lessonOptions.map(phase => (
                      <optgroup key={phase.label} label={phase.label}>
                        {phase.options.map(lesson => (
                          <option key={lesson.value} value={lesson.value}>
                            {lesson.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Difficulty / Dificultad
                  </label>
                  <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                          difficulty === level
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'border-border-default text-text-secondary hover:border-emerald-300'
                        }`}
                      >
                        {level === 'easy' ? 'Fácil' : level === 'medium' ? 'Medio' : 'Difícil'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Word Count */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Word Count / Cantidad de Palabras: {wordCount}
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="20"
                    value={wordCount}
                    onChange={(e) => setWordCount(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>6</span>
                    <span>20</span>
                  </div>
                </div>

                {/* Include Nonsense Words */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeNonsense"
                    checked={includeNonsense}
                    onChange={(e) => setIncludeNonsense(e.target.checked)}
                    className="w-4 h-4 rounded border-border-default text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="includeNonsense" className="text-sm text-text-secondary">
                    Include Nonsense Words / Incluir Pseudopalabras
                  </label>
                </div>

                {/* Include Answer Key */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeAnswerKey"
                    checked={includeAnswerKey}
                    onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                    className="w-4 h-4 rounded border-border-default text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="includeAnswerKey" className="text-sm text-text-secondary">
                    Include Answer Key / Incluir Clave de Respuestas
                  </label>
                </div>

                {/* Student Name */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Student Name / Nombre del Estudiante (optional)
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter student name..."
                    className="w-full p-2 rounded-lg border border-border-default bg-surface-secondary text-text-primary focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </Card>

            {/* AI Option (only for sentence templates) */}
            {needsAISentences && (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="useAI"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="w-4 h-4 rounded border-border-default text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="useAI" className="flex items-center gap-2 text-sm text-text-secondary">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Usar IA para crear oraciones / Use AI for sentences
                  </label>
                </div>
                <p className="text-xs text-text-muted mt-2 ml-7">
                  La IA genera oraciones que tienen sentido con las palabras objetivo
                </p>
              </Card>
            )}

            {/* Generate Button */}
            <Button
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {aiStatus || 'Generando...'}
                </>
              ) : (
                <>
                  {needsAISentences && useAI ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  Generate Worksheet / Generar Hoja
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
                      <Eye className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-text-primary">
                        {worksheet.titleSpanish}
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
                        Print / Imprimir
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
                          Answer Key / Clave
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Worksheet Preview */}
                <SpanishWorksheetPreview worksheet={worksheet} />
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Languages className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  No Worksheet Generated / Ninguna Hoja Generada
                </h3>
                <p className="text-text-muted mb-4">
                  Configure your options and click &quot;Generate Worksheet&quot; to create a practice sheet.
                </p>
                <p className="text-text-muted mb-4 text-sm">
                  Configura las opciones y haz clic en &quot;Generar Hoja&quot; para crear una hoja de práctica.
                </p>
                <div className="text-sm text-text-muted">
                  <p className="font-medium mb-2">Plantillas Disponibles:</p>
                  <ul className="space-y-1">
                    {Object.entries(SPANISH_WORKSHEET_TEMPLATES).map(([key, template]) => (
                      <li key={key} className="flex items-center justify-center gap-2">
                        <span>{template.icon}</span>
                        <span>{template.nameSpanish}</span>
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

/**
 * Helper: Render text with highlighted words based on word analysis
 */
interface WordAnalysis {
  word: string;
  status: 'decodable' | 'hf' | 'advanced';
}

function HighlightedText({ text, wordAnalysis }: { text: string; wordAnalysis?: WordAnalysis[] }) {
  if (!wordAnalysis || wordAnalysis.length === 0) {
    return <>{text}</>;
  }

  const analysisMap = new Map<string, 'decodable' | 'hf' | 'advanced'>();
  wordAnalysis.forEach(wa => {
    analysisMap.set(wa.word.toLowerCase(), wa.status);
  });

  const tokens = text.split(/(\s+|[.,!?'"_\-¿¡]+)/);

  return (
    <>
      {tokens.map((token, idx) => {
        const cleanWord = token.toLowerCase().replace(/[.,!?'"_\-¿¡]/g, '');
        const status = analysisMap.get(cleanWord);

        if (status === 'hf') {
          return (
            <span key={idx} className="font-bold text-amber-700" title="Palabra de alta frecuencia">
              {token}
            </span>
          );
        } else if (status === 'advanced') {
          return (
            <span key={idx} className="italic underline text-red-600" title="Aún no decodificable">
              {token}
            </span>
          );
        }
        return <span key={idx}>{token}</span>;
      })}
    </>
  );
}

/**
 * Spanish Worksheet Preview Component
 */
function SpanishWorksheetPreview({ worksheet }: { worksheet: GeneratedSpanishWorksheet }) {
  return (
    <Card className="p-6 bg-white dark:bg-surface-primary">
      {/* Header */}
      <div className="border-b border-border-default pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-text-primary">{worksheet.titleSpanish}</h2>
            <p className="text-sm text-text-muted">{worksheet.title}</p>
            <p className="text-sm text-text-muted mt-1">
              Phase {worksheet.phaseNumber} - Lesson {worksheet.lessonData.lesson}
            </p>
          </div>
          <div className="text-right text-sm text-text-muted">
            {worksheet.config.studentName && (
              <p>Nombre: {worksheet.config.studentName}</p>
            )}
            <p>Fecha: {worksheet.config.date}</p>
          </div>
        </div>
        <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            <strong>Instructions:</strong> {worksheet.instructions}
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
            <strong>Instrucciones:</strong> {worksheet.instructionsSpanish}
          </p>
        </div>
      </div>

      {/* Word Analysis Legend (for AI-generated sentences) */}
      {(worksheet.config.template === 'sentence_completion_spanish' || worksheet.config.template === 'draw_and_write_spanish') && (
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-2">Clave de resaltado de palabras:</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="text-gray-700 dark:text-gray-300">Normal = Decodificable</span>
            <span className="font-bold text-amber-700">Negritas = Alta frecuencia</span>
            <span className="italic underline text-red-600">Itálica = Aún no decodificable</span>
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="space-y-6">
        {worksheet.content.sections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            <h3 className="text-lg font-semibold text-text-primary mb-3 pb-2 border-b border-border-subtle">
              {section.title}
            </h3>

            {section.type === 'word_list' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-border-default rounded-lg text-center"
                  >
                    <span className="text-lg font-medium text-text-primary">
                      {item.prompt}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {section.type === 'sound_boxes' && (
              <div className="space-y-4">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-lg font-medium text-text-primary w-24">
                      {item.prompt}:
                    </span>
                    <div className="flex gap-1">
                      {item.soundBoxes?.map((box, boxIdx) => (
                        <div
                          key={boxIdx}
                          className="w-10 h-10 border-2 border-emerald-500 rounded flex items-center justify-center"
                        >
                          <span className="text-text-muted text-xs">
                            {box.filled ? box.sound : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.type === 'syllable_split' && (
              <div className="space-y-3">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-lg font-medium text-text-primary w-32">
                      {item.prompt}
                    </span>
                    <span className="text-text-muted">→</span>
                    <div className="flex-1 border-b border-dashed border-border-default">
                      {/* Empty line for student to write */}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.type === 'fill_blank' && (
              <div className="space-y-3">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-muted">{item.id}.</span>
                    <span className="text-text-primary">{item.prompt}</span>
                  </div>
                ))}
              </div>
            )}

            {section.type === 'sentences' && (
              <div className="space-y-4">
                {section.items.map((item, idx) => (
                  <div key={idx} className="border-b border-dashed border-border-default pb-3">
                    <span className="text-text-primary">{item.prompt}</span>
                  </div>
                ))}
              </div>
            )}

            {section.type === 'matching' && (
              <div className="space-y-3">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-lg font-medium text-text-primary flex-1">
                      {item.prompt}
                    </span>
                    <div className="flex gap-2">
                      {item.options?.map((opt, optIdx) => (
                        <span
                          key={optIdx}
                          className="px-2 py-1 border border-border-default rounded text-sm text-text-secondary"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.type === 'sentence_choice' && (
              <div className="space-y-4">
                {section.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-text-primary">
                        {item.id}. <HighlightedText text={item.prompt} wordAnalysis={item.wordAnalysis as WordAnalysis[] | undefined} />
                      </p>
                      {item.decodablePercent !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${
                          item.decodablePercent >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          item.decodablePercent >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {item.decodablePercent}% decodificable
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 ml-4">
                      {item.options?.map((option, optIdx) => (
                        <div
                          key={optIdx}
                          className="flex items-center gap-2 px-3 py-2 border border-emerald-300 rounded-lg bg-white dark:bg-surface-secondary"
                        >
                          <span className="w-5 h-5 border-2 border-emerald-400 rounded-full" />
                          <span className="text-text-primary font-medium">{option}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.type === 'draw_area' && (
              <div className="space-y-6">
                {section.items.map((item, idx) => (
                  <div key={idx} className="border border-border-default rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-text-primary font-medium">
                        {item.id}. Lee: &quot;<HighlightedText text={item.prompt} wordAnalysis={item.wordAnalysis as WordAnalysis[] | undefined} />&quot;
                      </p>
                      {item.decodablePercent !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${
                          item.decodablePercent >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          item.decodablePercent >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {item.decodablePercent}% decodificable
                        </span>
                      )}
                    </div>
                    <div className="border-2 border-dashed border-emerald-300 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 h-32 flex items-center justify-center">
                      <span className="text-text-muted text-sm">Dibuja aquí / Draw here</span>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-text-muted mb-1">Escribe la oración:</p>
                      <div className="h-6 border-b-2 border-emerald-300 border-dashed" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Answer Key (if included) */}
      {worksheet.answerKey && (
        <div className="mt-8 pt-6 border-t-2 border-dashed border-emerald-300">
          <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-4">
            Answer Key / Clave de Respuestas
          </h3>
          <div className="space-y-4 text-sm">
            {worksheet.answerKey.sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h4 className="font-medium text-text-secondary">{section.title}</h4>
                <p className="text-text-muted">
                  {section.answers.join(' | ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Spanish Worksheet PDF Export (simplified version)
 * TODO: Create full spanish-specific PDF export in separate file
 */
function exportSpanishWorksheetToPDF(worksheet: GeneratedSpanishWorksheet) {
  // For now, create a print-friendly view and trigger print
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${worksheet.titleSpanish}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 { font-size: 24px; margin-bottom: 8px; }
        h2 { font-size: 14px; color: #666; margin-bottom: 16px; }
        h3 { font-size: 16px; margin-top: 24px; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
        .header { border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }
        .instructions { background: #ecfdf5; padding: 12px; border-radius: 8px; margin-bottom: 24px; }
        .word-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .word-item { border: 1px solid #ccc; padding: 12px; text-align: center; border-radius: 4px; font-size: 18px; }
        .sound-box { display: inline-flex; gap: 4px; }
        .box { width: 32px; height: 32px; border: 2px solid #10b981; display: inline-flex; align-items: center; justify-content: center; }
        .fill-line { border-bottom: 1px dashed #ccc; padding: 8px 0; margin: 8px 0; }
        .answer-key { margin-top: 48px; padding-top: 24px; border-top: 2px dashed #10b981; }
        @media print {
          body { padding: 20px; }
          .answer-key { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${worksheet.titleSpanish}</h1>
        <h2>${worksheet.title} | Phase ${worksheet.phaseNumber} - Lesson ${worksheet.lessonData.lesson}</h2>
        ${worksheet.config.studentName ? `<p>Nombre: ${worksheet.config.studentName}</p>` : ''}
        <p>Fecha: ${worksheet.config.date}</p>
      </div>

      <div class="instructions">
        <strong>Instrucciones:</strong> ${worksheet.instructionsSpanish}
      </div>

      ${worksheet.content.sections.map(section => `
        <h3>${section.title}</h3>
        ${section.type === 'word_list' ? `
          <div class="word-grid">
            ${section.items.map(item => `<div class="word-item">${item.prompt}</div>`).join('')}
          </div>
        ` : ''}
        ${section.type === 'sound_boxes' ? `
          ${section.items.map(item => `
            <div style="margin: 12px 0;">
              <span style="display: inline-block; width: 100px;">${item.prompt}:</span>
              <span class="sound-box">
                ${(item.soundBoxes || []).map(() => '<span class="box"></span>').join('')}
              </span>
            </div>
          `).join('')}
        ` : ''}
        ${section.type === 'fill_blank' || section.type === 'syllable_split' ? `
          ${section.items.map(item => `
            <div class="fill-line">${item.id}. ${item.prompt}</div>
          `).join('')}
        ` : ''}
        ${section.type === 'sentences' ? `
          ${section.items.map(item => `
            <div class="fill-line">${item.prompt}</div>
          `).join('')}
        ` : ''}
        ${section.type === 'sentence_choice' ? `
          ${section.items.map(item => `
            <div style="margin: 16px 0; padding: 12px; background: #ecfdf5; border-radius: 8px;">
              <p style="margin-bottom: 12px;">${item.id}. ${item.prompt}</p>
              <div style="display: flex; gap: 16px; margin-left: 16px;">
                ${(item.options || []).map(opt => `
                  <span style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #10b981; border-radius: 8px; background: white;">
                    <span style="width: 16px; height: 16px; border: 2px solid #10b981; border-radius: 50%; display: inline-block;"></span>
                    ${opt}
                  </span>
                `).join('')}
              </div>
            </div>
          `).join('')}
        ` : ''}
        ${section.type === 'draw_area' ? `
          ${section.items.map(item => `
            <div style="margin: 16px 0; border: 1px solid #ccc; border-radius: 8px; padding: 16px;">
              <p style="margin-bottom: 12px; font-weight: 500;">${item.id}. Lee: "${item.prompt}"</p>
              <div style="height: 120px; border: 2px dashed #10b981; border-radius: 8px; background: #f0fdf4; display: flex; align-items: center; justify-content: center;">
                <span style="color: #666;">Dibuja aquí</span>
              </div>
              <div style="margin-top: 12px;">
                <p style="font-size: 12px; color: #666; margin-bottom: 4px;">Escribe la oración:</p>
                <div style="border-bottom: 2px dashed #10b981; height: 24px;"></div>
              </div>
            </div>
          `).join('')}
        ` : ''}
      `).join('')}

      ${worksheet.answerKey ? `
        <div class="answer-key">
          <h2>Clave de Respuestas / Answer Key</h2>
          ${worksheet.answerKey.sections.map(section => `
            <h4>${section.title}</h4>
            <p>${section.answers.join(' | ')}</p>
          `).join('')}
        </div>
      ` : ''}
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}

function exportSpanishAnswerKeyToPDF(worksheet: GeneratedSpanishWorksheet) {
  if (!worksheet.answerKey) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Answer Key - ${worksheet.titleSpanish}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 { font-size: 20px; margin-bottom: 24px; color: #10b981; }
        h3 { font-size: 14px; margin-top: 16px; color: #666; }
        p { margin: 8px 0; }
      </style>
    </head>
    <body>
      <h1>Clave de Respuestas / Answer Key</h1>
      <p><strong>${worksheet.titleSpanish}</strong></p>
      <p>Phase ${worksheet.phaseNumber} - Lesson ${worksheet.lessonData.lesson}</p>
      <hr style="margin: 16px 0;">
      ${worksheet.answerKey.sections.map(section => `
        <h3>${section.title}</h3>
        <p>${section.answers.join(' | ')}</p>
      `).join('')}
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}
