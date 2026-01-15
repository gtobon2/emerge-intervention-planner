/**
 * CaminoLessonBuilder - Main drag-and-drop lesson plan builder for Spanish reading intervention
 *
 * Allows interventionists to:
 * 1. Select a unit and lesson
 * 2. Drag elements from the Element Bank into lesson sections
 * 3. Get AI-powered activity suggestions
 * 4. Save the lesson plan
 *
 * Adapted for CaminoALaLectura / Despegando curriculum.
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { Sparkles, Loader2, Calendar, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CaminoElementBank } from './CaminoElementBank';
import { CaminoLessonSection, caminoAcceptedTypesMap } from './CaminoLessonSection';
import {
  CaminoDraggableElement,
  CaminoDraggableElementData,
  CaminoDraggableElementPlaceholder,
  CaminoElementType,
} from './CaminoDraggableElement';
import {
  CAMINO_UNITS,
  CAMINO_LESSON_SECTIONS,
  getLessonCode,
  createEmptyCaminoLessonPlan,
  calculateCaminoLessonDuration,
  generateElementId,
} from '@/lib/curriculum/camino/camino-lesson-elements';
import type {
  CaminoLessonPlan,
  CaminoLessonPlanSection,
  CaminoLessonComponentType,
} from '@/lib/curriculum/camino/camino-lesson-elements';
import { getElementsByUnit } from '@/lib/curriculum/camino/camino-data';

interface CaminoLessonBuilderProps {
  initialUnit?: number;
  initialLesson?: number;
  sessionId?: number;
  isGroupSession?: boolean;
  onSave?: (plan: CaminoLessonPlan) => void;
  onClose?: () => void;
}

export function CaminoLessonBuilder({
  initialUnit = 1,
  initialLesson = 1,
  sessionId,
  isGroupSession = true,
  onSave,
  onClose,
}: CaminoLessonBuilderProps) {
  const [selectedUnit, setSelectedUnit] = useState(initialUnit);
  const [selectedLesson, setSelectedLesson] = useState(initialLesson);
  const [lessonPlan, setLessonPlan] = useState<CaminoLessonPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [activeElement, setActiveElement] = useState<CaminoDraggableElementData | null>(null);
  const [loadingAISection, setLoadingAISection] = useState<CaminoLessonComponentType | null>(null);

  // Get current unit info
  const currentUnit = CAMINO_UNITS.find((u) => u.unit === selectedUnit);

  // Get elements for selected unit
  const unitElements = useMemo(() => {
    return getElementsByUnit(selectedUnit);
  }, [selectedUnit]);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // Load/initialize lesson plan when unit or lesson changes
  useEffect(() => {
    setIsLoading(true);

    const lessonCode = getLessonCode(selectedUnit, selectedLesson);
    const lessonName = currentUnit
      ? `${currentUnit.name} - Lección ${selectedLesson}`
      : `Lección ${selectedLesson}`;

    const newPlan = createEmptyCaminoLessonPlan(
      selectedUnit,
      selectedLesson,
      lessonName,
      isGroupSession
    );

    if (sessionId) {
      newPlan.sessionId = sessionId;
    }

    setLessonPlan(newPlan);
    setIsLoading(false);
  }, [selectedUnit, selectedLesson, sessionId, isGroupSession, currentUnit]);

  // Get set of used element IDs
  const usedElementIds = useMemo(() => {
    if (!lessonPlan) return new Set<string>();
    const ids = new Set<string>();
    lessonPlan.sections.forEach((section) => {
      section.elements.forEach((el) => ids.add(el.sourceId));
    });
    return ids;
  }, [lessonPlan]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveElement(event.active.data.current as CaminoDraggableElementData);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveElement(null);

    const { active, over } = event;
    if (!over || !lessonPlan) return;

    const draggedElement = active.data.current as CaminoDraggableElementData;
    const targetSection = over.id as CaminoLessonComponentType;
    const targetAccepts = over.data.current?.accepts as CaminoElementType[] | undefined;

    // Check if the target section accepts this element type
    if (!targetAccepts || !targetAccepts.includes(draggedElement.type)) {
      return;
    }

    // Check if already in this section
    const section = lessonPlan.sections.find((s) => s.component === targetSection);
    if (section?.elements.some((el) => el.sourceId === draggedElement.sourceId)) {
      return;
    }

    // Add element to section
    setLessonPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.component === targetSection
            ? {
                ...s,
                elements: [
                  ...s.elements,
                  {
                    id: generateElementId(),
                    type: draggedElement.type,
                    value: draggedElement.value,
                    sourceId: draggedElement.sourceId,
                  },
                ],
              }
            : s
        ),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Remove element from section
  const handleRemoveElement = useCallback(
    (sectionComponent: CaminoLessonComponentType, elementId: string) => {
      setLessonPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.component === sectionComponent
              ? {
                  ...s,
                  elements: s.elements.filter((el) => el.id !== elementId),
                }
              : s
          ),
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  // Update section duration
  const handleUpdateDuration = useCallback(
    (sectionComponent: CaminoLessonComponentType, duration: number) => {
      setLessonPlan((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          sections: prev.sections.map((s) =>
            s.component === sectionComponent ? { ...s, duration } : s
          ),
          updatedAt: new Date().toISOString(),
        };
        updated.totalDuration = calculateCaminoLessonDuration(updated);
        return updated;
      });
    },
    []
  );

  // Add activity to section
  const handleAddActivity = useCallback(
    (sectionComponent: CaminoLessonComponentType, activity: string) => {
      setLessonPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.component === sectionComponent
              ? { ...s, activities: [...s.activities, activity] }
              : s
          ),
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  // Remove activity from section
  const handleRemoveActivity = useCallback(
    (sectionComponent: CaminoLessonComponentType, index: number) => {
      setLessonPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.component === sectionComponent
              ? { ...s, activities: s.activities.filter((_, i) => i !== index) }
              : s
          ),
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  // Update section notes
  const handleUpdateNotes = useCallback(
    (sectionComponent: CaminoLessonComponentType, notes: string) => {
      setLessonPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.component === sectionComponent ? { ...s, notes } : s
          ),
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  // Quick add element from bank to appropriate section
  const handleQuickAdd = useCallback(
    (element: CaminoDraggableElementData) => {
      if (!lessonPlan) return;

      // Find first matching section that accepts this type
      const targetSection = lessonPlan.sections.find((s) => {
        const acceptedTypes = caminoAcceptedTypesMap[s.component];
        return acceptedTypes?.includes(element.type);
      });

      if (targetSection) {
        setLessonPlan((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: prev.sections.map((s) =>
              s.component === targetSection.component
                ? {
                    ...s,
                    elements: [
                      ...s.elements,
                      {
                        id: generateElementId(),
                        type: element.type,
                        value: element.value,
                        sourceId: element.sourceId,
                      },
                    ],
                  }
                : s
            ),
            updatedAt: new Date().toISOString(),
          };
        });
      }
    },
    [lessonPlan]
  );

  // Request AI suggestions for a section
  const handleRequestAISuggestions = useCallback(
    async (section: CaminoLessonPlanSection) => {
      if (!lessonPlan) return;

      setLoadingAISection(section.component);
      try {
        const response = await fetch('/api/ai/suggest-camino-activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unit: selectedUnit,
            lesson: selectedLesson,
            component: section.component,
            componentName: section.componentName,
            elements: section.elements,
            currentActivities: section.activities,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.suggestions && Array.isArray(data.suggestions)) {
            setLessonPlan((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                sections: prev.sections.map((s) =>
                  s.component === section.component
                    ? { ...s, activities: [...s.activities, ...data.suggestions] }
                    : s
                ),
                updatedAt: new Date().toISOString(),
              };
            });
          }
        }
      } catch (error) {
        console.error('Error getting AI suggestions:', error);
      } finally {
        setLoadingAISection(null);
      }
    },
    [lessonPlan, selectedUnit, selectedLesson]
  );

  // Save lesson plan
  const handleSave = async () => {
    if (!lessonPlan) return;

    setIsSaving(true);
    try {
      const planToSave = {
        ...lessonPlan,
        updatedAt: new Date().toISOString(),
      };

      if (onSave) {
        onSave(planToSave);
      }
    } catch (error) {
      console.error('Error saving lesson plan:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-generate entire lesson with AI
  const handleAutoGenerateWithAI = async () => {
    if (!lessonPlan) return;

    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/generate-camino-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit: selectedUnit,
          lesson: selectedLesson,
          lessonName: lessonPlan.lessonName,
          isGroupSession,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.lessonPlan) {
          setLessonPlan((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              sections: data.lessonPlan.sections,
              totalDuration: data.lessonPlan.totalDuration,
              updatedAt: new Date().toISOString(),
            };
          });
        }
      } else {
        console.error('Failed to generate AI lesson:', await response.text());
      }
    } catch (error) {
      console.error('Error generating AI lesson:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Group sections by block for display
  const sectionsByBlock = useMemo(() => {
    if (!lessonPlan) return {};

    const blocks: Record<string, CaminoLessonPlanSection[]> = {
      warmup: [],
      phonics: [],
      reading: [],
      writing: [],
    };

    lessonPlan.sections.forEach((section) => {
      const config = CAMINO_LESSON_SECTIONS.find((s) => s.type === section.component);
      if (config) {
        blocks[config.block].push(section);
      }
    });

    return blocks;
  }, [lessonPlan]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Camino Lesson Builder</h2>
          </div>

          {/* Unit Selector */}
          <select
            value={selectedUnit}
            onChange={(e) => {
              setSelectedUnit(Number(e.target.value));
              setSelectedLesson(1);
            }}
            className="px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CAMINO_UNITS.map((unit) => (
              <option key={unit.unit} value={unit.unit}>
                Unidad {unit.unit}: {unit.name}
              </option>
            ))}
          </select>

          {/* Lesson Selector */}
          <select
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {currentUnit &&
              Array.from({ length: currentUnit.lessons }, (_, i) => i + 1).map((lessonNum) => (
                <option key={lessonNum} value={lessonNum}>
                  Lección {lessonNum}
                </option>
              ))}
          </select>

          {/* Session Type Toggle */}
          <div className="flex items-center gap-2 border-l pl-4">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isGroupSession ? 'Grupo' : '1:1'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lessonPlan && (
            <span className="text-sm text-muted-foreground">
              Total: {lessonPlan.totalDuration} min
            </span>
          )}
          <button
            onClick={handleAutoGenerateWithAI}
            disabled={isGeneratingAI || !lessonPlan}
            className="px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-md hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Auto-Plan con IA</span>
              </>
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !lessonPlan}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Guardando...' : 'Guardar Plan'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Element Bank Sidebar */}
          <div className="w-80 border-r bg-muted/10 flex-shrink-0 overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b bg-muted/30">
              <h3 className="text-sm font-medium">Banco de Elementos</h3>
              <p className="text-xs text-muted-foreground">Element Bank</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <CaminoElementBank
                sounds={unitElements.sounds}
                syllables={unitElements.syllables}
                words={unitElements.words}
                hfWords={unitElements.hfWords}
                sentences={unitElements.sentences}
                usedElementIds={usedElementIds}
                onQuickAdd={handleQuickAdd}
              />
            </div>
          </div>

          {/* Lesson Plan Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                </div>
              </div>
            ) : lessonPlan ? (
              <div className="space-y-6 max-w-3xl mx-auto">
                {/* Lesson Title */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold">{lessonPlan.lessonName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Arrastra elementos del banco a cada sección de la lección
                  </p>
                  <p className="text-xs text-muted-foreground opacity-70">
                    Drag elements from the bank into each lesson section
                  </p>
                </div>

                {/* Block 1: Calentamiento / Warm-up */}
                {sectionsByBlock.warmup && sectionsByBlock.warmup.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm">
                        1
                      </div>
                      <h4 className="font-semibold text-amber-700 dark:text-amber-300">
                        Calentamiento / Warm-up
                      </h4>
                    </div>
                    {sectionsByBlock.warmup.map((section) => (
                      <CaminoLessonSection
                        key={section.component}
                        section={section}
                        onRemoveElement={(elementId) =>
                          handleRemoveElement(section.component, elementId)
                        }
                        onUpdateDuration={(duration) =>
                          handleUpdateDuration(section.component, duration)
                        }
                        onAddActivity={(activity) =>
                          handleAddActivity(section.component, activity)
                        }
                        onRemoveActivity={(index) =>
                          handleRemoveActivity(section.component, index)
                        }
                        onUpdateNotes={(notes) =>
                          handleUpdateNotes(section.component, notes)
                        }
                        onRequestAISuggestions={() =>
                          handleRequestAISuggestions(section)
                        }
                        isLoadingAI={loadingAISection === section.component}
                      />
                    ))}
                  </div>
                )}

                {/* Block 2: Fonética / Phonics */}
                {sectionsByBlock.phonics && sectionsByBlock.phonics.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                        2
                      </div>
                      <h4 className="font-semibold text-purple-700 dark:text-purple-300">
                        Fonética / Phonics
                      </h4>
                    </div>
                    {sectionsByBlock.phonics.map((section) => (
                      <CaminoLessonSection
                        key={section.component}
                        section={section}
                        onRemoveElement={(elementId) =>
                          handleRemoveElement(section.component, elementId)
                        }
                        onUpdateDuration={(duration) =>
                          handleUpdateDuration(section.component, duration)
                        }
                        onAddActivity={(activity) =>
                          handleAddActivity(section.component, activity)
                        }
                        onRemoveActivity={(index) =>
                          handleRemoveActivity(section.component, index)
                        }
                        onUpdateNotes={(notes) =>
                          handleUpdateNotes(section.component, notes)
                        }
                        onRequestAISuggestions={() =>
                          handleRequestAISuggestions(section)
                        }
                        isLoadingAI={loadingAISection === section.component}
                      />
                    ))}
                  </div>
                )}

                {/* Block 3: Lectura / Reading */}
                {sectionsByBlock.reading && sectionsByBlock.reading.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                        3
                      </div>
                      <h4 className="font-semibold text-blue-700 dark:text-blue-300">
                        Lectura / Reading
                      </h4>
                    </div>
                    {sectionsByBlock.reading.map((section) => (
                      <CaminoLessonSection
                        key={section.component}
                        section={section}
                        onRemoveElement={(elementId) =>
                          handleRemoveElement(section.component, elementId)
                        }
                        onUpdateDuration={(duration) =>
                          handleUpdateDuration(section.component, duration)
                        }
                        onAddActivity={(activity) =>
                          handleAddActivity(section.component, activity)
                        }
                        onRemoveActivity={(index) =>
                          handleRemoveActivity(section.component, index)
                        }
                        onUpdateNotes={(notes) =>
                          handleUpdateNotes(section.component, notes)
                        }
                        onRequestAISuggestions={() =>
                          handleRequestAISuggestions(section)
                        }
                        isLoadingAI={loadingAISection === section.component}
                      />
                    ))}
                  </div>
                )}

                {/* Block 4: Escritura / Writing */}
                {sectionsByBlock.writing && sectionsByBlock.writing.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
                        4
                      </div>
                      <h4 className="font-semibold text-green-700 dark:text-green-300">
                        Escritura / Writing
                      </h4>
                    </div>
                    {sectionsByBlock.writing.map((section) => (
                      <CaminoLessonSection
                        key={section.component}
                        section={section}
                        onRemoveElement={(elementId) =>
                          handleRemoveElement(section.component, elementId)
                        }
                        onUpdateDuration={(duration) =>
                          handleUpdateDuration(section.component, duration)
                        }
                        onAddActivity={(activity) =>
                          handleAddActivity(section.component, activity)
                        }
                        onRemoveActivity={(index) =>
                          handleRemoveActivity(section.component, index)
                        }
                        onUpdateNotes={(notes) =>
                          handleUpdateNotes(section.component, notes)
                        }
                        onRequestAISuggestions={() =>
                          handleRequestAISuggestions(section)
                        }
                        isLoadingAI={loadingAISection === section.component}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                  Selecciona una unidad y lección para comenzar
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeElement && (
            <CaminoDraggableElementPlaceholder
              type={activeElement.type}
              value={activeElement.value}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
