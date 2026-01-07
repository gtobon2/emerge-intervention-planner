'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, BookOpen, Volume2, FileText, Sparkles, Download, Upload, Database } from 'lucide-react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/local-db';
import { WILSON_STEPS } from '@/lib/curriculum/wilson';
import {
  type WilsonLessonElements,
  type WilsonSoundCard,
  type WilsonWord,
  type WilsonNonsenseWord,
  type WilsonHighFrequencyWord,
  type WilsonSentence,
  type SoundType,
  type SyllableType,
  createEmptyLessonElements,
  generateElementId,
} from '@/lib/curriculum/wilson-lesson-elements';
import { loadWilsonData, getWilsonDataStats, clearWilsonData } from '@/lib/curriculum/wilson-data-loader';

type TabType = 'sounds' | 'words' | 'nonsense' | 'hf-words' | 'sentences';

export default function WilsonDataPage() {
  const [selectedSubstep, setSelectedSubstep] = useState<string>('1.1');
  const [lessonElements, setLessonElements] = useState<WilsonLessonElements | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('sounds');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [dataStats, setDataStats] = useState<{ substepCount: number; totalWords: number; totalSentences: number; totalStories: number } | null>(null);

  // Get all substeps from Wilson data
  const allSubsteps = WILSON_STEPS.flatMap((step) =>
    step.substeps.map((substep) => ({
      key: substep.substep,
      name: substep.name,
      step: step.step,
      stepName: step.name,
    }))
  );

  // Load data stats on mount
  useEffect(() => {
    const loadStats = async () => {
      const stats = await getWilsonDataStats();
      setDataStats(stats);
    };
    loadStats();
  }, []);

  // Load data for selected substep
  useEffect(() => {
    const loadData = async () => {
      const existing = await db.wilsonLessonElements
        .where('substep')
        .equals(selectedSubstep)
        .first();

      if (existing) {
        setLessonElements(existing);
      } else {
        // Create empty structure
        const substepInfo = allSubsteps.find((s) => s.key === selectedSubstep);
        if (substepInfo) {
          setLessonElements(
            createEmptyLessonElements(
              selectedSubstep,
              substepInfo.step,
              substepInfo.name
            )
          );
        }
      }
    };
    loadData();
  }, [selectedSubstep]);

  // Handle import
  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await loadWilsonData();
      if (result.success) {
        setSaveMessage(`Imported ${result.count} substeps successfully!`);
        // Refresh stats
        const stats = await getWilsonDataStats();
        setDataStats(stats);
        // Reload current substep data
        const existing = await db.wilsonLessonElements
          .where('substep')
          .equals(selectedSubstep)
          .first();
        if (existing) {
          setLessonElements(existing);
        }
      } else {
        setSaveMessage(`Import failed: ${result.message}`);
      }
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      console.error('Import error:', error);
      setSaveMessage('Import failed: Unknown error');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle clear all data
  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all Wilson data? This cannot be undone.')) {
      return;
    }
    try {
      await clearWilsonData();
      setSaveMessage('All Wilson data cleared');
      setDataStats({ substepCount: 0, totalWords: 0, totalSentences: 0, totalStories: 0 });
      // Reset current view to empty
      const substepInfo = allSubsteps.find((s) => s.key === selectedSubstep);
      if (substepInfo) {
        setLessonElements(
          createEmptyLessonElements(
            selectedSubstep,
            substepInfo.step,
            substepInfo.name
          )
        );
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Clear error:', error);
      setSaveMessage('Failed to clear data');
    }
  };

  // Save data
  const handleSave = async () => {
    if (!lessonElements) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const now = new Date().toISOString();
      const updated = { ...lessonElements, updatedAt: now };

      if (lessonElements.id) {
        await db.wilsonLessonElements.update(lessonElements.id, updated);
      } else {
        const id = await db.wilsonLessonElements.add(updated);
        setLessonElements({ ...updated, id });
      }

      setSaveMessage('Saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveMessage('Error saving data');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // Sound Cards Management
  // ============================================

  const addSoundCard = () => {
    if (!lessonElements) return;
    const newSound: WilsonSoundCard = {
      id: generateElementId(),
      sound: '',
      keyword: '',
      type: 'consonant',
      phoneme: '',
      isNew: true,
    };
    setLessonElements({
      ...lessonElements,
      soundCards: [...lessonElements.soundCards, newSound],
    });
  };

  const updateSoundCard = (id: string, updates: Partial<WilsonSoundCard>) => {
    if (!lessonElements) return;
    setLessonElements({
      ...lessonElements,
      soundCards: lessonElements.soundCards.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    });
  };

  const removeSoundCard = (id: string) => {
    if (!lessonElements) return;
    setLessonElements({
      ...lessonElements,
      soundCards: lessonElements.soundCards.filter((s) => s.id !== id),
    });
  };

  // ============================================
  // Real Words Management
  // ============================================

  const addWord = () => {
    if (!lessonElements) return;
    const newWord: WilsonWord = {
      id: generateElementId(),
      word: '',
      forDecoding: true,
      forSpelling: true,
      syllableType: 'closed',
      syllableCount: 1,
      isControlled: true,
    };
    setLessonElements({
      ...lessonElements,
      realWords: [...lessonElements.realWords, newWord],
    });
  };

  const updateWord = (id: string, updates: Partial<WilsonWord>) => {
    if (!lessonElements) return;
    setLessonElements({
      ...lessonElements,
      realWords: lessonElements.realWords.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    });
  };

  const removeWord = (id: string) => {
    if (!lessonElements) return;
    setLessonElements({
      ...lessonElements,
      realWords: lessonElements.realWords.filter((w) => w.id !== id),
    });
  };

  // Bulk add words
  const bulkAddWords = (text: string) => {
    if (!lessonElements) return;
    const words = text
      .split(/[\n,]/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0);

    const newWords: WilsonWord[] = words.map((word) => ({
      id: generateElementId(),
      word,
      forDecoding: true,
      forSpelling: true,
      syllableType: 'closed' as SyllableType,
      syllableCount: 1,
      isControlled: true,
    }));

    setLessonElements({
      ...lessonElements,
      realWords: [...lessonElements.realWords, ...newWords],
    });
  };

  // ============================================
  // Nonsense Words Management
  // ============================================

  const addNonsenseWord = () => {
    if (!lessonElements) return;
    const newWord: WilsonNonsenseWord = {
      id: generateElementId(),
      word: '',
      pattern: 'CVC',
    };
    setLessonElements({
      ...lessonElements,
      nonsenseWords: [...lessonElements.nonsenseWords, newWord],
    });
  };

  const bulkAddNonsenseWords = (text: string) => {
    if (!lessonElements) return;
    const words = text
      .split(/[\n,]/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0);

    const newWords: WilsonNonsenseWord[] = words.map((word) => ({
      id: generateElementId(),
      word,
      pattern: 'CVC',
    }));

    setLessonElements({
      ...lessonElements,
      nonsenseWords: [...lessonElements.nonsenseWords, ...newWords],
    });
  };

  const removeNonsenseWord = (id: string) => {
    if (!lessonElements) return;
    setLessonElements({
      ...lessonElements,
      nonsenseWords: lessonElements.nonsenseWords.filter((w) => w.id !== id),
    });
  };

  // ============================================
  // High Frequency Words Management
  // ============================================

  const addHFWord = () => {
    if (!lessonElements) return;
    const newWord: WilsonHighFrequencyWord = {
      id: generateElementId(),
      word: '',
      isNew: true,
      isDecodable: false,
    };
    setLessonElements({
      ...lessonElements,
      highFrequencyWords: [...lessonElements.highFrequencyWords, newWord],
    });
  };

  const bulkAddHFWords = (text: string) => {
    if (!lessonElements) return;
    const words = text
      .split(/[\n,]/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0);

    const newWords: WilsonHighFrequencyWord[] = words.map((word) => ({
      id: generateElementId(),
      word,
      isNew: true,
      isDecodable: false,
    }));

    setLessonElements({
      ...lessonElements,
      highFrequencyWords: [...lessonElements.highFrequencyWords, ...newWords],
    });
  };

  const removeHFWord = (id: string) => {
    if (!lessonElements) return;
    setLessonElements({
      ...lessonElements,
      highFrequencyWords: lessonElements.highFrequencyWords.filter((w) => w.id !== id),
    });
  };

  // ============================================
  // Sentences Management
  // ============================================

  const addSentence = () => {
    if (!lessonElements) return;
    const newSentence: WilsonSentence = {
      id: generateElementId(),
      text: '',
      forReading: true,
      forDictation: true,
      wordCount: 0,
      decodablePercentage: 100,
    };
    setLessonElements({
      ...lessonElements,
      sentences: [...lessonElements.sentences, newSentence],
    });
  };

  const updateSentence = (id: string, updates: Partial<WilsonSentence>) => {
    if (!lessonElements) return;
    setLessonElements({
      ...lessonElements,
      sentences: lessonElements.sentences.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    });
  };

  const removeSentence = (id: string) => {
    if (!lessonElements) return;
    setLessonElements({
      ...lessonElements,
      sentences: lessonElements.sentences.filter((s) => s.id !== id),
    });
  };

  if (!lessonElements) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-movement" />
        </div>
      </AppLayout>
    );
  }

  const currentSubstep = allSubsteps.find((s) => s.key === selectedSubstep);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="p-2 hover:bg-foundation rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Wilson Lesson Data
              </h1>
              <p className="text-text-muted">
                Enter word lists, sounds, and sentences by substep
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveMessage && (
              <span
                className={`text-sm ${
                  saveMessage.includes('Error') ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {saveMessage}
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              isLoading={isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Data Import Section */}
        <Card className="border-dashed border-2 border-movement/30 bg-movement/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-movement" />
                <div>
                  <h3 className="font-medium text-text-primary">Wilson Curriculum Database</h3>
                  <p className="text-sm text-text-muted">
                    {dataStats && dataStats.substepCount > 0
                      ? `${dataStats.substepCount} substeps loaded with ${dataStats.totalWords.toLocaleString()} words, ${dataStats.totalSentences.toLocaleString()} sentences, ${dataStats.totalStories} stories`
                      : 'No data loaded yet. Import the Wilson curriculum data to get started.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {dataStats && dataStats.substepCount > 0 && (
                  <Button
                    onClick={handleClearData}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  isLoading={isImporting}
                  className="gap-2 bg-movement hover:bg-movement/90"
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? 'Importing...' : dataStats && dataStats.substepCount > 0 ? 'Re-import Data' : 'Import Wilson Data'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Substep Selector */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <label className="font-medium text-text-primary">Substep:</label>
              <select
                value={selectedSubstep}
                onChange={(e) => setSelectedSubstep(e.target.value)}
                className="flex-1 max-w-md px-3 py-2 border border-text-muted/20 rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-movement"
              >
                {WILSON_STEPS.map((step) => (
                  <optgroup key={step.step} label={`Step ${step.step}: ${step.name}`}>
                    {step.substeps.map((substep) => (
                      <option key={substep.substep} value={substep.substep}>
                        {substep.substep}: {substep.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {currentSubstep && (
              <p className="mt-2 text-sm text-text-muted">
                Step {currentSubstep.step}: {currentSubstep.stepName}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-text-muted/20">
          {[
            { id: 'sounds', label: 'Sounds', icon: Volume2, count: lessonElements.soundCards.length },
            { id: 'words', label: 'Real Words', icon: BookOpen, count: lessonElements.realWords.length },
            { id: 'nonsense', label: 'Nonsense Words', icon: Sparkles, count: lessonElements.nonsenseWords.length },
            { id: 'hf-words', label: 'HF Words', icon: FileText, count: lessonElements.highFrequencyWords.length },
            { id: 'sentences', label: 'Sentences', icon: FileText, count: lessonElements.sentences.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-movement text-movement'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-foundation">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <Card>
          <CardContent className="py-6">
            {/* Sounds Tab */}
            {activeTab === 'sounds' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-text-primary">Sound Cards</h3>
                  <Button onClick={addSoundCard} variant="secondary" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Sound
                  </Button>
                </div>

                {lessonElements.soundCards.length === 0 ? (
                  <p className="text-center text-text-muted py-8">
                    No sound cards added yet. Click &quot;Add Sound&quot; to begin.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lessonElements.soundCards.map((sound) => (
                      <div
                        key={sound.id}
                        className="p-4 bg-foundation rounded-lg border border-text-muted/10"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Input
                            value={sound.sound}
                            onChange={(e) =>
                              updateSoundCard(sound.id, { sound: e.target.value })
                            }
                            placeholder="Sound (e.g., ch)"
                            className="w-24 text-center font-bold text-lg"
                          />
                          <button
                            onClick={() => removeSoundCard(sound.id)}
                            className="p-1 text-text-muted hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <Input
                            value={sound.keyword}
                            onChange={(e) =>
                              updateSoundCard(sound.id, { keyword: e.target.value })
                            }
                            placeholder="Keyword (e.g., cherry)"
                          />
                          <select
                            value={sound.type}
                            onChange={(e) =>
                              updateSoundCard(sound.id, {
                                type: e.target.value as SoundType,
                              })
                            }
                            className="w-full px-3 py-2 border border-text-muted/20 rounded-lg bg-surface text-text-primary text-sm"
                          >
                            <option value="consonant">Consonant</option>
                            <option value="vowel">Vowel</option>
                            <option value="digraph">Digraph</option>
                            <option value="blend">Blend</option>
                            <option value="r-controlled">R-Controlled</option>
                            <option value="vowel-team">Vowel Team</option>
                          </select>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={sound.isNew}
                              onChange={(e) =>
                                updateSoundCard(sound.id, { isNew: e.target.checked })
                              }
                              className="rounded"
                            />
                            New at this substep
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Real Words Tab */}
            {activeTab === 'words' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-text-primary">Real Words</h3>
                  <div className="flex gap-2">
                    <Button onClick={addWord} variant="secondary" size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Word
                    </Button>
                  </div>
                </div>

                {/* Bulk Add */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    Paste multiple words (one per line or comma-separated):
                  </p>
                  <div className="flex gap-2">
                    <textarea
                      id="bulk-words"
                      placeholder="sat, pet, hit, lot&#10;cup, jam, hem"
                      className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={() => {
                        const textarea = document.getElementById('bulk-words') as HTMLTextAreaElement;
                        if (textarea.value) {
                          bulkAddWords(textarea.value);
                          textarea.value = '';
                        }
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      Add All
                    </Button>
                  </div>
                </div>

                {lessonElements.realWords.length === 0 ? (
                  <p className="text-center text-text-muted py-8">
                    No words added yet. Use bulk add above or click &quot;Add Word&quot;.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {lessonElements.realWords.map((word) => (
                      <div
                        key={word.id}
                        className="flex items-center gap-2 px-3 py-2 bg-foundation rounded-lg border border-text-muted/10"
                      >
                        <span className="font-medium">{word.word || '(empty)'}</span>
                        <button
                          onClick={() => removeWord(word.id)}
                          className="p-1 text-text-muted hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Nonsense Words Tab */}
            {activeTab === 'nonsense' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-text-primary">Nonsense Words</h3>
                  <Button onClick={addNonsenseWord} variant="secondary" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Word
                  </Button>
                </div>

                {/* Bulk Add */}
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800 mb-2">
                    Paste multiple nonsense words:
                  </p>
                  <div className="flex gap-2">
                    <textarea
                      id="bulk-nonsense"
                      placeholder="vap, kem, zit&#10;wod, jup, hib"
                      className="flex-1 px-3 py-2 border border-purple-200 rounded-lg text-sm resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={() => {
                        const textarea = document.getElementById('bulk-nonsense') as HTMLTextAreaElement;
                        if (textarea.value) {
                          bulkAddNonsenseWords(textarea.value);
                          textarea.value = '';
                        }
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      Add All
                    </Button>
                  </div>
                </div>

                {lessonElements.nonsenseWords.length === 0 ? (
                  <p className="text-center text-text-muted py-8">
                    No nonsense words added yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {lessonElements.nonsenseWords.map((word) => (
                      <div
                        key={word.id}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200"
                      >
                        <span className="font-medium text-purple-800">
                          {word.word || '(empty)'}
                        </span>
                        <button
                          onClick={() => removeNonsenseWord(word.id)}
                          className="p-1 text-purple-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* HF Words Tab */}
            {activeTab === 'hf-words' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-text-primary">High Frequency Words</h3>
                  <Button onClick={addHFWord} variant="secondary" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Word
                  </Button>
                </div>

                {/* Bulk Add */}
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-800 mb-2">
                    Paste high frequency words:
                  </p>
                  <div className="flex gap-2">
                    <textarea
                      id="bulk-hf"
                      placeholder="the, said, have&#10;was, they, what"
                      className="flex-1 px-3 py-2 border border-amber-200 rounded-lg text-sm resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={() => {
                        const textarea = document.getElementById('bulk-hf') as HTMLTextAreaElement;
                        if (textarea.value) {
                          bulkAddHFWords(textarea.value);
                          textarea.value = '';
                        }
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      Add All
                    </Button>
                  </div>
                </div>

                {lessonElements.highFrequencyWords.length === 0 ? (
                  <p className="text-center text-text-muted py-8">
                    No high frequency words added yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {lessonElements.highFrequencyWords.map((word) => (
                      <div
                        key={word.id}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200"
                      >
                        <span className="font-medium text-amber-800">
                          {word.word || '(empty)'}
                        </span>
                        <button
                          onClick={() => removeHFWord(word.id)}
                          className="p-1 text-amber-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sentences Tab */}
            {activeTab === 'sentences' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-text-primary">Sentences</h3>
                  <Button onClick={addSentence} variant="secondary" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Sentence
                  </Button>
                </div>

                {lessonElements.sentences.length === 0 ? (
                  <p className="text-center text-text-muted py-8">
                    No sentences added yet. Click &quot;Add Sentence&quot; to begin.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lessonElements.sentences.map((sentence) => (
                      <div
                        key={sentence.id}
                        className="p-4 bg-foundation rounded-lg border border-text-muted/10"
                      >
                        <div className="flex items-start gap-3">
                          <textarea
                            value={sentence.text}
                            onChange={(e) => {
                              const text = e.target.value;
                              const wordCount = text.trim().split(/\s+/).filter(w => w).length;
                              updateSentence(sentence.id, { text, wordCount });
                            }}
                            placeholder="Enter sentence..."
                            className="flex-1 px-3 py-2 border border-text-muted/20 rounded-lg resize-none text-text-primary"
                            rows={2}
                          />
                          <button
                            onClick={() => removeSentence(sentence.id)}
                            className="p-2 text-text-muted hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-text-muted">
                            {sentence.wordCount} words
                          </span>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={sentence.forReading}
                              onChange={(e) =>
                                updateSentence(sentence.id, { forReading: e.target.checked })
                              }
                              className="rounded"
                            />
                            For Reading
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={sentence.forDictation}
                              onChange={(e) =>
                                updateSentence(sentence.id, { forDictation: e.target.checked })
                              }
                              className="rounded"
                            />
                            For Dictation
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">
                Substep {selectedSubstep} Data Summary:
              </span>
              <div className="flex gap-4">
                <span>{lessonElements.soundCards.length} sounds</span>
                <span>{lessonElements.realWords.length} words</span>
                <span>{lessonElements.nonsenseWords.length} nonsense</span>
                <span>{lessonElements.highFrequencyWords.length} HF words</span>
                <span>{lessonElements.sentences.length} sentences</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
