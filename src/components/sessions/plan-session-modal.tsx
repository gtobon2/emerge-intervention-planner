'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Target, AlertTriangle, Plus, Trash2, BookOpen, CalendarDays, Repeat, CheckCircle2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Group, Curriculum, AnticipatedError, CurriculumPosition } from '@/lib/supabase/types';
import { getCurriculumLabel, isWilsonPosition, isCaminoPosition, isDespegandoPosition, formatCurriculumPosition } from '@/lib/supabase/types';
import { WilsonLessonBuilder, MultiDayWilsonLessonPlan } from '@/components/wilson-planner';
import { CaminoLessonBuilder } from '@/components/camino-planner';
import type { WilsonLessonPlan } from '@/lib/curriculum/wilson-lesson-elements';
import type { CaminoLessonPlan } from '@/lib/curriculum/camino/camino-lesson-elements';
import { getErrorsForPosition, type ErrorBankSeedEntry } from '@/lib/error-banks';

interface PlanSessionModalProps {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
  onSave: (sessionData: SessionPlanData) => void;
}

export interface SessionPlanData {
  date: string;
  time: string;
  curriculum_position: CurriculumPosition;
  planned_otr_target: number;
  planned_practice_items: { item: string; type: 'review' | 'new' | 'cumulative' }[];
  planned_response_formats: string[];
  anticipated_errors: AnticipatedError[];
  notes?: string;
  wilson_lesson_plan?: WilsonLessonPlan;
  camino_lesson_plan?: CaminoLessonPlan;
  // Multi-day series fields
  series_id?: string;
  series_order?: number;
  series_total?: number;
}

const RESPONSE_FORMATS = [
  { value: 'oral', label: 'Oral' },
  { value: 'written', label: 'Written' },
  { value: 'choral', label: 'Choral' },
  { value: 'individual', label: 'Individual' },
  { value: 'partner', label: 'Partner' },
  { value: 'tapping', label: 'Tapping' },
];

export function PlanSessionModal({ group, isOpen, onClose, onSave }: PlanSessionModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(group.schedule?.time || '09:00');
  const [otrTarget, setOtrTarget] = useState(40);
  const [responseFormats, setResponseFormats] = useState<string[]>(['oral', 'written']);
  const [practiceItems, setPracticeItems] = useState<{ item: string; type: 'review' | 'new' | 'cumulative' }[]>([
    { item: '', type: 'review' },
  ]);
  const [anticipatedErrors, setAnticipatedErrors] = useState<AnticipatedError[]>([]);
  const [newErrorPattern, setNewErrorPattern] = useState('');
  const [newErrorCorrection, setNewErrorCorrection] = useState('');
  const [notes, setNotes] = useState('');
  const [showLessonBuilder, setShowLessonBuilder] = useState(false);
  const [showCaminoLessonBuilder, setShowCaminoLessonBuilder] = useState(false);
  const [wilsonLessonPlan, setWilsonLessonPlan] = useState<WilsonLessonPlan | null>(null);
  const [caminoLessonPlan, setCaminoLessonPlan] = useState<CaminoLessonPlan | null>(null);
  const [multiDayPlan, setMultiDayPlan] = useState<MultiDayWilsonLessonPlan | null>(null);

  // Multi-day planning mode
  const [isMultiDayMode, setIsMultiDayMode] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState(3);
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [repeatActivities, setRepeatActivities] = useState(true);

  // Error bank suggestions
  const [suggestedErrors, setSuggestedErrors] = useState<ErrorBankSeedEntry[]>([]);
  const [selectedSuggestedErrors, setSelectedSuggestedErrors] = useState<Set<number>>(new Set());

  const isWilsonCurriculum = group.curriculum === 'wilson';

  // Fetch suggested errors from error bank based on current position
  useEffect(() => {
    if (isOpen && group.current_position) {
      const errors = getErrorsForPosition(group.curriculum, group.current_position);
      setSuggestedErrors(errors);
      // Auto-select all errors by default
      setSelectedSuggestedErrors(new Set(errors.map((_, idx) => idx)));
    }
  }, [isOpen, group.curriculum, group.current_position]);
  const isCaminoCurriculum = group.curriculum === 'camino' || group.curriculum === 'despegando';
  const isMultiDay = isMultiDayMode || (multiDayPlan !== null && multiDayPlan.days > 1);

  // Calculate session dates for multi-day planning
  const scheduledDates = useMemo(() => {
    if (!isMultiDayMode) return [date];

    const dates: string[] = [];
    let currentDate = new Date(date);
    let daysAdded = 0;

    while (daysAdded < numberOfDays) {
      const dayOfWeek = currentDate.getDay();

      // Skip weekends if enabled
      if (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      dates.push(currentDate.toISOString().split('T')[0]);
      daysAdded++;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }, [date, numberOfDays, skipWeekends, isMultiDayMode]);

  if (!isOpen) return null;

  const handleToggleFormat = (format: string) => {
    setResponseFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  const handleAddPracticeItem = () => {
    setPracticeItems((prev) => [...prev, { item: '', type: 'review' }]);
  };

  const handleUpdatePracticeItem = (index: number, field: 'item' | 'type', value: string) => {
    setPracticeItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleRemovePracticeItem = (index: number) => {
    setPracticeItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddError = () => {
    if (newErrorPattern.trim()) {
      setAnticipatedErrors((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          error_pattern: newErrorPattern,
          correction_protocol: newErrorCorrection,
        },
      ]);
      setNewErrorPattern('');
      setNewErrorCorrection('');
    }
  };

  const handleRemoveError = (id: string) => {
    setAnticipatedErrors((prev) => prev.filter((e) => e.id !== id));
  };

  // Toggle suggested error selection
  const toggleSuggestedError = (index: number) => {
    setSelectedSuggestedErrors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Add all selected suggested errors to anticipated errors
  const addSelectedSuggestionsToAnticipated = () => {
    const errorsToAdd = suggestedErrors
      .filter((_, idx) => selectedSuggestedErrors.has(idx))
      .filter((error) => !anticipatedErrors.some((ae) => ae.error_pattern === error.error_pattern))
      .map((error) => ({
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        error_pattern: error.error_pattern,
        correction_protocol: error.correction_protocol,
      }));

    if (errorsToAdd.length > 0) {
      setAnticipatedErrors((prev) => [...prev, ...errorsToAdd]);
    }
  };

  // Helper to add days to a date string
  const addDays = (dateStr: string, days: number): string => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const handleSave = () => {
    // Multi-day Wilson lesson plan (from Wilson Lesson Builder)
    if (multiDayPlan && multiDayPlan.days > 1) {
      const seriesId = crypto.randomUUID();
      const totalDays = multiDayPlan.days;

      multiDayPlan.plans.forEach((plan, index) => {
        const sessionData: SessionPlanData = {
          date: addDays(date, index),
          time,
          curriculum_position: group.current_position,
          planned_otr_target: otrTarget,
          planned_practice_items: practiceItems.filter((p) => p.item.trim()),
          planned_response_formats: responseFormats,
          anticipated_errors: anticipatedErrors,
          notes: notes ? `${notes} (Day ${index + 1}/${totalDays})` : `Day ${index + 1}/${totalDays}`,
          wilson_lesson_plan: plan,
          series_id: seriesId,
          series_order: index + 1,
          series_total: totalDays,
        };
        onSave(sessionData);
      });
    }
    // Generic multi-day mode (any curriculum)
    else if (isMultiDayMode && numberOfDays > 1) {
      const seriesId = crypto.randomUUID();
      const totalDays = scheduledDates.length;

      scheduledDates.forEach((sessionDate, index) => {
        const sessionData: SessionPlanData = {
          date: sessionDate,
          time,
          curriculum_position: group.current_position,
          planned_otr_target: otrTarget,
          planned_practice_items: repeatActivities ? practiceItems.filter((p) => p.item.trim()) : [],
          planned_response_formats: responseFormats,
          anticipated_errors: repeatActivities ? anticipatedErrors : [],
          notes: notes ? `${notes} (Day ${index + 1}/${totalDays})` : `Day ${index + 1}/${totalDays}`,
          wilson_lesson_plan: index === 0 ? (wilsonLessonPlan || undefined) : undefined,
          camino_lesson_plan: index === 0 ? (caminoLessonPlan || undefined) : undefined,
          series_id: seriesId,
          series_order: index + 1,
          series_total: totalDays,
        };
        onSave(sessionData);
      });
    }
    // Single day: create one session
    else {
      const sessionData: SessionPlanData = {
        date,
        time,
        curriculum_position: group.current_position,
        planned_otr_target: otrTarget,
        planned_practice_items: practiceItems.filter((p) => p.item.trim()),
        planned_response_formats: responseFormats,
        anticipated_errors: anticipatedErrors,
        notes: notes || undefined,
        wilson_lesson_plan: wilsonLessonPlan || undefined,
        camino_lesson_plan: caminoLessonPlan || undefined,
      };
      onSave(sessionData);
    }
    onClose();
  };

  const handleLessonPlanSave = (plan: WilsonLessonPlan | MultiDayWilsonLessonPlan) => {
    // Check if it's a multi-day plan
    if ('days' in plan && plan.days > 1) {
      // It's a MultiDayWilsonLessonPlan
      setMultiDayPlan(plan as MultiDayWilsonLessonPlan);
      setWilsonLessonPlan(null);
    } else {
      // It's a single WilsonLessonPlan
      setWilsonLessonPlan(plan as WilsonLessonPlan);
      setMultiDayPlan(null);
    }
    setShowLessonBuilder(false);
  };

  const handleCaminoLessonPlanSave = (plan: CaminoLessonPlan) => {
    setCaminoLessonPlan(plan);
    setShowCaminoLessonBuilder(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Plan Session</h2>
            <p className="text-sm text-gray-500">{group.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Planning Mode Toggle */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Planning Mode:</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsMultiDayMode(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !isMultiDayMode
                    ? 'bg-pink-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                Single Session
              </button>
              <button
                type="button"
                onClick={() => setIsMultiDayMode(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isMultiDayMode
                    ? 'bg-pink-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                <Repeat className="w-4 h-4" />
                Multi-day Planning
              </button>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isMultiDayMode ? 'Start Date' : 'Date'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>

          {/* Multi-day Options */}
          {isMultiDayMode && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-blue-800">
                <CalendarDays className="w-5 h-5" />
                <span className="font-medium">Multi-day Session Planning</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">
                    Number of Sessions
                  </label>
                  <select
                    value={numberOfDays}
                    onChange={(e) => setNumberOfDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {[2, 3, 4, 5, 6, 7, 10, 14].map((n) => (
                      <option key={n} value={n}>
                        {n} sessions
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <label className="flex items-center gap-2 text-sm text-blue-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipWeekends}
                      onChange={(e) => setSkipWeekends(e.target.checked)}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                    Skip weekends
                  </label>
                  <label className="flex items-center gap-2 text-sm text-blue-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={repeatActivities}
                      onChange={(e) => setRepeatActivities(e.target.checked)}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                    Repeat activities for all days
                  </label>
                </div>
              </div>

              {/* Preview scheduled dates */}
              <div className="pt-3 border-t border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">Scheduled Dates:</p>
                <div className="flex flex-wrap gap-2">
                  {scheduledDates.map((d, idx) => (
                    <span
                      key={d}
                      className="px-3 py-1 bg-white rounded-full text-sm text-blue-700 border border-blue-200"
                    >
                      Day {idx + 1}: {new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Wilson Lesson Builder - Only for Wilson curriculum */}
          {isWilsonCurriculum && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-purple-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Wilson Lesson Builder
                  </h3>
                  <p className="text-sm text-purple-700 mt-1">
                    {isMultiDay && multiDayPlan
                      ? `${multiDayPlan.days}-day lesson plan for substep ${multiDayPlan.plans[0]?.substep}`
                      : wilsonLessonPlan
                        ? `Lesson plan created for substep ${wilsonLessonPlan.substep}`
                        : 'Build a detailed lesson plan with drag-and-drop elements'}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowLessonBuilder(true)}
                >
                  {wilsonLessonPlan || multiDayPlan ? 'Edit Lesson Plan' : 'Build Lesson'}
                </Button>
              </div>
              {isMultiDay && multiDayPlan && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <div className="text-sm text-purple-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <strong>{multiDayPlan.days} sessions</strong> will be created
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {multiDayPlan.plans.map((plan, idx) => (
                        <div
                          key={idx}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            idx === 0 ? 'bg-blue-100 text-blue-700' :
                            idx === 1 ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}
                        >
                          Day {idx + 1}: {plan.totalDuration} min
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {wilsonLessonPlan && !isMultiDay && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <div className="text-sm text-purple-800">
                    <strong>{wilsonLessonPlan.sections.filter(s => s.elements.length > 0).length}</strong> sections with elements,{' '}
                    <strong>{wilsonLessonPlan.totalDuration}</strong> min total
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Camino Lesson Builder - For Camino and Despegando curriculum */}
          {isCaminoCurriculum && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-orange-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Camino Lesson Builder
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    {caminoLessonPlan
                      ? `Plan de lección creado - ${caminoLessonPlan.lessonName}`
                      : 'Construye un plan de lección detallado con elementos arrastrables'}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCaminoLessonBuilder(true)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {caminoLessonPlan ? 'Editar Plan' : 'Crear Lección'}
                </Button>
              </div>
              {caminoLessonPlan && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <div className="text-sm text-orange-800">
                    <strong>{caminoLessonPlan.sections.filter(s => s.elements.length > 0).length}</strong> secciones con elementos,{' '}
                    <strong>{caminoLessonPlan.totalDuration}</strong> min total
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OTR Target */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Target className="w-4 h-4 inline mr-1" />
              OTR Target
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={otrTarget}
                onChange={(e) => setOtrTarget(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-2xl font-bold text-pink-500 w-16 text-center">
                {otrTarget}
              </span>
            </div>
          </div>

          {/* Response Formats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Response Formats
            </label>
            <div className="flex flex-wrap gap-2">
              {RESPONSE_FORMATS.map((format) => (
                <button
                  key={format.value}
                  type="button"
                  onClick={() => handleToggleFormat(format.value)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${responseFormats.includes(format.value)
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {format.label}
                </button>
              ))}
            </div>
          </div>

          {/* Practice Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Planned Practice Items
            </label>
            <div className="space-y-2">
              {practiceItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={item.type}
                    onChange={(e) => handleUpdatePracticeItem(index, 'type', e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="review">Review</option>
                    <option value="new">New</option>
                    <option value="cumulative">Cumulative</option>
                  </select>
                  <input
                    type="text"
                    value={item.item}
                    onChange={(e) => handleUpdatePracticeItem(index, 'item', e.target.value)}
                    placeholder="Practice item..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                  {practiceItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePracticeItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddPracticeItem}
                className="flex items-center gap-1 text-sm text-pink-500 hover:text-pink-600"
              >
                <Plus className="w-4 h-4" />
                Add practice item
              </button>
            </div>
          </div>

          {/* Suggested Errors from Error Bank */}
          {suggestedErrors.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Suggested Errors for {formatCurriculumPosition(group.curriculum, group.current_position)}
                  </span>
                </div>
                <span className="text-xs text-blue-600">
                  {selectedSuggestedErrors.size} of {suggestedErrors.length} selected
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {suggestedErrors.map((error, idx) => {
                  const isSelected = selectedSuggestedErrors.has(idx);
                  const isAlreadyAdded = anticipatedErrors.some(ae => ae.error_pattern === error.error_pattern);
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        isAlreadyAdded
                          ? 'bg-green-100 border border-green-200'
                          : isSelected
                          ? 'bg-blue-100 border border-blue-300'
                          : 'bg-white border border-blue-100 hover:bg-blue-50'
                      }`}
                    >
                      {isAlreadyAdded ? (
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                      ) : (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSuggestedError(idx)}
                          className="mt-0.5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isAlreadyAdded ? 'text-green-800' : 'text-blue-900'}`}>
                          {error.error_pattern}
                        </p>
                        <p className={`text-xs ${isAlreadyAdded ? 'text-green-600' : 'text-blue-600'} truncate`}>
                          {error.correction_protocol}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSuggestedErrors(new Set(suggestedErrors.map((_, i) => i)))}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <span className="text-blue-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSuggestedErrors(new Set())}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select None
                  </button>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={addSelectedSuggestionsToAnticipated}
                  disabled={selectedSuggestedErrors.size === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Selected ({selectedSuggestedErrors.size})
                </Button>
              </div>
            </div>
          )}

          {/* Anticipated Errors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-500" />
              Anticipated Errors
              {anticipatedErrors.length > 0 && (
                <span className="ml-2 text-xs text-gray-500">({anticipatedErrors.length} errors)</span>
              )}
            </label>

            {anticipatedErrors.length > 0 && (
              <div className="space-y-2 mb-3">
                {anticipatedErrors.map((error) => (
                  <div
                    key={error.id}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm text-amber-900">{error.error_pattern}</p>
                      <p className="text-xs text-amber-700">{error.correction_protocol}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveError(error.id)}
                      className="p-1 text-amber-600 hover:text-amber-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={newErrorPattern}
                onChange={(e) => setNewErrorPattern(e.target.value)}
                placeholder="Error pattern (e.g., Confuses b/d)"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="text"
                value={newErrorCorrection}
                onChange={(e) => setNewErrorCorrection(e.target.value)}
                placeholder="Correction strategy"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={handleAddError}
                disabled={!newErrorPattern.trim()}
                className="flex items-center gap-1 text-sm text-pink-500 hover:text-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add anticipated error
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Planning Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any preparation notes..."
              className="w-full px-3 py-2 border rounded-lg text-sm h-20 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Calendar className="w-4 h-4 mr-1" />
            {isMultiDayMode
              ? `Schedule ${scheduledDates.length} Sessions`
              : isMultiDay
              ? `Schedule ${multiDayPlan?.days} Sessions`
              : 'Schedule Session'}
          </Button>
        </div>
      </div>

      {/* Wilson Lesson Builder Modal */}
      {showLessonBuilder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowLessonBuilder(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden">
            <WilsonLessonBuilder
              initialSubstep={isWilsonPosition(group.current_position) ? group.current_position.substep : '1.1'}
              onSave={handleLessonPlanSave}
              onClose={() => setShowLessonBuilder(false)}
            />
          </div>
        </div>
      )}

      {/* Camino Lesson Builder Modal */}
      {showCaminoLessonBuilder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowCaminoLessonBuilder(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden">
            <CaminoLessonBuilder
              initialUnit={isCaminoPosition(group.current_position) ? 1 : isDespegandoPosition(group.current_position) ? group.current_position.phase : 1}
              initialLesson={isCaminoPosition(group.current_position) ? group.current_position.lesson : isDespegandoPosition(group.current_position) ? group.current_position.lesson % 10 || 1 : 1}
              onSave={handleCaminoLessonPlanSave}
              onClose={() => setShowCaminoLessonBuilder(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
