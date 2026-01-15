'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Puzzle,
  FileText,
  Layers,
  Volume2,
  PenTool,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
} from '@/components/ui';

// Types
interface MaterialItem {
  id: string;
  name: string;
  description?: string;
  quantity?: string;
  optional?: boolean;
}

interface MaterialCategory {
  id: string;
  name: string;
  icon: string;
  items: MaterialItem[];
}

interface CurriculumMaterials {
  id: string;
  name: string;
  color: string;
  categories: MaterialCategory[];
}

// Pre-populated materials data
const CURRICULUM_MATERIALS: CurriculumMaterials[] = [
  {
    id: 'wilson',
    name: 'Wilson Reading System',
    color: 'purple',
    categories: [
      {
        id: 'cards',
        name: 'Sound & Word Cards',
        icon: 'cards',
        items: [
          { id: 'sound-cards', name: 'Sound Cards', description: 'Letter-sound correspondence cards (full deck)' },
          { id: 'word-cards', name: 'Word Cards', description: 'High-frequency word cards by substep' },
          { id: 'trick-word-cards', name: 'Trick Word Cards', description: 'Irregular high-frequency words' },
          { id: 'syllable-cards', name: 'Syllable Type Cards', description: '6 syllable type reference cards' },
        ],
      },
      {
        id: 'manipulatives',
        name: 'Manipulatives',
        icon: 'manipulatives',
        items: [
          { id: 'sound-tapping', name: 'Sound Tapping Board', description: 'For phoneme segmentation' },
          { id: 'letter-tiles', name: 'Magnetic Letter Tiles', description: 'Lowercase letter set for word building' },
          { id: 'peeling-off-board', name: 'Peeling Off Board', description: 'For syllable/morpheme work' },
          { id: 'dry-erase-boards', name: 'Dry Erase Boards', description: 'Individual student whiteboards', quantity: '1 per student' },
          { id: 'dry-erase-markers', name: 'Dry Erase Markers', description: 'Fine tip, multiple colors', quantity: '1 set per student' },
        ],
      },
      {
        id: 'texts',
        name: 'Decodable Texts',
        icon: 'texts',
        items: [
          { id: 'wilson-readers', name: 'Wilson Readers', description: 'Controlled readers by substep' },
          { id: 'fluency-readers', name: 'Fluency Readers', description: 'Fluency practice passages' },
        ],
      },
      {
        id: 'workbooks',
        name: 'Workbooks & Sheets',
        icon: 'workbooks',
        items: [
          { id: 'student-workbook', name: 'Student Workbook', description: 'Wilson student reader notebook' },
          { id: 'dictation-paper', name: 'Dictation Paper', description: 'Lined paper for dictation', quantity: 'Stack' },
        ],
      },
      {
        id: 'teacher',
        name: 'Teacher Materials',
        icon: 'teacher',
        items: [
          { id: 'instructor-manual', name: 'Instructor Manual', description: 'Wilson instructor manual' },
          { id: 'lesson-plans', name: 'Lesson Plan Templates', description: 'Daily lesson planning forms' },
          { id: 'progress-charts', name: 'Progress Monitoring Charts', description: 'Student progress tracking forms' },
        ],
      },
    ],
  },
  {
    id: 'camino',
    name: 'CaminoALaLectura / Despegando',
    color: 'pink',
    categories: [
      {
        id: 'cards',
        name: 'Tarjetas de Sonidos',
        icon: 'cards',
        items: [
          { id: 'vowel-cards', name: 'Tarjetas de Vocales', description: 'A, E, I, O, U cards with images' },
          { id: 'consonant-cards', name: 'Tarjetas de Consonantes', description: 'Consonant sound cards by unit' },
          { id: 'syllable-cards', name: 'Tarjetas de Sílabas', description: 'CV and CVC syllable cards' },
          { id: 'word-cards-sp', name: 'Tarjetas de Palabras', description: 'Picture-word matching cards' },
        ],
      },
      {
        id: 'manipulatives',
        name: 'Manipulativos',
        icon: 'manipulatives',
        items: [
          { id: 'elkonin-boxes', name: 'Cajas Elkonin', description: 'Sound boxes for phonemic awareness' },
          { id: 'counters', name: 'Fichas/Counters', description: 'Colored counters for sound mapping', quantity: '10+ per student' },
          { id: 'letter-tiles-sp', name: 'Letras Magnéticas', description: 'Spanish letter tiles including ñ, ll, ch' },
          { id: 'syllable-wheels', name: 'Ruedas de Sílabas', description: 'Rotating syllable combination wheels' },
          { id: 'pizarras', name: 'Pizarras Individuales', description: 'Student whiteboards', quantity: '1 per student' },
        ],
      },
      {
        id: 'texts',
        name: 'Textos Decodificables',
        icon: 'texts',
        items: [
          { id: 'readers-unit1', name: 'Lecturas Unidad 1', description: 'Vocales + m, p, l, s, t, d' },
          { id: 'readers-unit2', name: 'Lecturas Unidad 2', description: 'n, r, c, b, g, f, v, z, j, ñ' },
          { id: 'readers-unit3', name: 'Lecturas Unidad 3', description: 'ch, ll, rr, qu, h + blends' },
          { id: 'readers-unit4', name: 'Lecturas Unidad 4', description: 'Complex syllables' },
          { id: 'readers-unit5', name: 'Lecturas Unidad 5', description: 'Multisyllabic words' },
        ],
      },
      {
        id: 'workbooks',
        name: 'Cuadernos',
        icon: 'workbooks',
        items: [
          { id: 'workbook-sp', name: 'Cuaderno del Estudiante', description: 'EMERGE workbook by unit' },
          { id: 'dictation-sp', name: 'Papel de Dictado', description: 'Lined paper for dictation', quantity: 'Stack' },
          { id: 'tracing-sheets', name: 'Hojas de Trazado', description: 'Letter formation practice sheets' },
        ],
      },
      {
        id: 'visuals',
        name: 'Ayudas Visuales',
        icon: 'visuals',
        items: [
          { id: 'vowel-chart', name: 'Cartel de Vocales', description: 'Classroom vowel poster' },
          { id: 'syllable-chart', name: 'Cartel de Sílabas', description: 'Syllable reference chart' },
          { id: 'word-wall', name: 'Pared de Palabras', description: 'High-frequency word display' },
          { id: 'emerge-values', name: 'Valores EMERGE', description: 'Mindfulness, Empathy, Resilience, Growth, Expression posters' },
        ],
      },
    ],
  },
  {
    id: 'fundations',
    name: 'Fundations',
    color: 'blue',
    categories: [
      {
        id: 'cards',
        name: 'Cards & Posters',
        icon: 'cards',
        items: [
          { id: 'large-sound-cards', name: 'Large Sound Cards', description: 'Teacher demonstration cards' },
          { id: 'student-sound-cards', name: 'Student Sound Cards', description: 'Individual student card sets' },
          { id: 'trick-word-poster', name: 'Trick Word Poster', description: 'High-frequency irregular words' },
          { id: 'vowel-extension', name: 'Vowel Extension Poster', description: 'Long vowel patterns' },
        ],
      },
      {
        id: 'manipulatives',
        name: 'Manipulatives',
        icon: 'manipulatives',
        items: [
          { id: 'echo-boards', name: 'Echo/Writing Boards', description: 'Letter formation practice boards' },
          { id: 'letter-formation', name: 'Letter Formation Grid', description: 'Skyline, plane line, grass line, worm line' },
          { id: 'magnet-boards', name: 'Magnetic Letter Boards', description: 'For word building' },
        ],
      },
      {
        id: 'workbooks',
        name: 'Workbooks',
        icon: 'workbooks',
        items: [
          { id: 'student-notebook', name: 'Student Notebook', description: 'Fundations student composition book' },
          { id: 'fluency-kit', name: 'Fluency Kit', description: 'Fluency phrase cards' },
        ],
      },
    ],
  },
];

// Custom program template
const CUSTOM_TEMPLATE: CurriculumMaterials = {
  id: 'custom',
  name: 'Custom Program',
  color: 'gray',
  categories: [
    {
      id: 'cards',
      name: 'Cards',
      icon: 'cards',
      items: [],
    },
    {
      id: 'manipulatives',
      name: 'Manipulatives',
      icon: 'manipulatives',
      items: [],
    },
    {
      id: 'texts',
      name: 'Texts',
      icon: 'texts',
      items: [],
    },
    {
      id: 'workbooks',
      name: 'Workbooks',
      icon: 'workbooks',
      items: [],
    },
    {
      id: 'other',
      name: 'Other',
      icon: 'other',
      items: [],
    },
  ],
};

// Helper function to get icon component
function getCategoryIcon(iconName: string) {
  switch (iconName) {
    case 'cards':
      return Layers;
    case 'manipulatives':
      return Puzzle;
    case 'texts':
      return BookOpen;
    case 'workbooks':
      return FileText;
    case 'visuals':
      return Volume2;
    case 'teacher':
      return PenTool;
    default:
      return Package;
  }
}

// Color classes helper
function getColorClasses(color: string) {
  switch (color) {
    case 'purple':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
        accent: 'bg-purple-500',
      };
    case 'pink':
      return {
        bg: 'bg-pink-100 dark:bg-pink-900/30',
        text: 'text-pink-600 dark:text-pink-400',
        border: 'border-pink-200 dark:border-pink-800',
        accent: 'bg-pink-500',
      };
    case 'blue':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        accent: 'bg-blue-500',
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-900/30',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-800',
        accent: 'bg-gray-500',
      };
  }
}

// Local storage key
const STORAGE_KEY = 'emerge-materials-checklist';

interface CheckedItems {
  [curriculumId: string]: {
    [itemId: string]: boolean;
  };
}

interface CustomItems {
  [curriculumId: string]: {
    [categoryId: string]: MaterialItem[];
  };
}

export default function MaterialsPage() {
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('wilson');
  const [checkedItems, setCheckedItems] = useState<CheckedItems>({});
  const [customItems, setCustomItems] = useState<CustomItems>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [addToCategoryId, setAddToCategoryId] = useState<string>('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCheckedItems(data.checkedItems || {});
        setCustomItems(data.customItems || {});
      } catch (e) {
        console.error('Failed to load materials checklist:', e);
      }
    }
    // Expand all categories by default
    const allCategoryIds = CURRICULUM_MATERIALS.flatMap(c => c.categories.map(cat => `${c.id}-${cat.id}`));
    setExpandedCategories(new Set(allCategoryIds));
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ checkedItems, customItems }));
  }, [checkedItems, customItems]);

  const currentCurriculum = CURRICULUM_MATERIALS.find(c => c.id === selectedCurriculum) || CURRICULUM_MATERIALS[0];
  const colorClasses = getColorClasses(currentCurriculum.color);

  // Toggle item checked state
  const toggleItem = (curriculumId: string, itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [curriculumId]: {
        ...prev[curriculumId],
        [itemId]: !prev[curriculumId]?.[itemId],
      },
    }));
  };

  // Toggle category expansion
  const toggleCategory = (curriculumId: string, categoryId: string) => {
    const key = `${curriculumId}-${categoryId}`;
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Calculate progress
  const getProgress = (curriculumId: string, categoryId: string) => {
    const curriculum = CURRICULUM_MATERIALS.find(c => c.id === curriculumId);
    if (!curriculum) return { checked: 0, total: 0 };

    const category = curriculum.categories.find(cat => cat.id === categoryId);
    if (!category) return { checked: 0, total: 0 };

    const items = [...category.items, ...(customItems[curriculumId]?.[categoryId] || [])];
    const checked = items.filter(item => checkedItems[curriculumId]?.[item.id]).length;
    return { checked, total: items.length };
  };

  // Get total progress for curriculum
  const getTotalProgress = (curriculumId: string) => {
    const curriculum = CURRICULUM_MATERIALS.find(c => c.id === curriculumId);
    if (!curriculum) return { checked: 0, total: 0 };

    let checked = 0;
    let total = 0;

    curriculum.categories.forEach(category => {
      const items = [...category.items, ...(customItems[curriculumId]?.[category.id] || [])];
      total += items.length;
      checked += items.filter(item => checkedItems[curriculumId]?.[item.id]).length;
    });

    return { checked, total };
  };

  // Add custom item
  const addCustomItem = () => {
    if (!newItemName.trim() || !addToCategoryId) return;

    const newItem: MaterialItem = {
      id: `custom-${Date.now()}`,
      name: newItemName.trim(),
      description: newItemDescription.trim() || undefined,
    };

    setCustomItems(prev => ({
      ...prev,
      [selectedCurriculum]: {
        ...prev[selectedCurriculum],
        [addToCategoryId]: [...(prev[selectedCurriculum]?.[addToCategoryId] || []), newItem],
      },
    }));

    setNewItemName('');
    setNewItemDescription('');
    setShowAddModal(false);
  };

  // Delete custom item
  const deleteCustomItem = (curriculumId: string, categoryId: string, itemId: string) => {
    setCustomItems(prev => ({
      ...prev,
      [curriculumId]: {
        ...prev[curriculumId],
        [categoryId]: (prev[curriculumId]?.[categoryId] || []).filter(item => item.id !== itemId),
      },
    }));
    // Also remove from checked items
    setCheckedItems(prev => {
      const updated = { ...prev };
      if (updated[curriculumId]) {
        delete updated[curriculumId][itemId];
      }
      return updated;
    });
  };

  // Reset checklist for current curriculum
  const resetChecklist = () => {
    if (confirm(`Reset all checkmarks for ${currentCurriculum.name}? This will uncheck all items.`)) {
      setCheckedItems(prev => ({
        ...prev,
        [selectedCurriculum]: {},
      }));
    }
  };

  const totalProgress = getTotalProgress(selectedCurriculum);
  const progressPercent = totalProgress.total > 0
    ? Math.round((totalProgress.checked / totalProgress.total) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Materials Setup</h1>
            <p className="text-text-muted mt-1">
              Track your intervention bin materials by curriculum
            </p>
          </div>
          <Package className="w-8 h-8 text-movement" />
        </div>

        {/* Curriculum Selector & Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <Select
                label="Curriculum"
                options={CURRICULUM_MATERIALS.map(c => ({ value: c.id, label: c.name }))}
                value={selectedCurriculum}
                onChange={(e) => setSelectedCurriculum(e.target.value)}
                className="w-full sm:w-64"
              />

              <div className="flex items-center gap-4 w-full sm:w-auto">
                {/* Progress bar */}
                <div className="flex-1 sm:w-48">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary">
                      {totalProgress.checked} / {totalProgress.total} items
                    </span>
                    <span className={`text-sm font-bold ${colorClasses.text}`}>
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorClasses.accent} transition-all duration-300`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={resetChecklist}
                  className="gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="space-y-4">
          {currentCurriculum.categories.map((category) => {
            const categoryKey = `${selectedCurriculum}-${category.id}`;
            const isExpanded = expandedCategories.has(categoryKey);
            const progress = getProgress(selectedCurriculum, category.id);
            const allItems = [...category.items, ...(customItems[selectedCurriculum]?.[category.id] || [])];
            const IconComponent = getCategoryIcon(category.icon);

            return (
              <Card key={category.id} className={`border ${colorClasses.border}`}>
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => toggleCategory(selectedCurriculum, category.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${colorClasses.bg} flex items-center justify-center`}>
                        <IconComponent className={`w-5 h-5 ${colorClasses.text}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <p className="text-sm text-text-muted">
                          {progress.checked} of {progress.total} collected
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {progress.checked === progress.total && progress.total > 0 && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-text-muted" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-text-muted" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {allItems.map((item) => {
                        const isChecked = checkedItems[selectedCurriculum]?.[item.id] || false;
                        const isCustom = item.id.startsWith('custom-');

                        return (
                          <div
                            key={item.id}
                            className={`
                              flex items-start gap-3 p-3 rounded-lg
                              transition-colors cursor-pointer
                              ${isChecked
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                              }
                            `}
                            onClick={() => toggleItem(selectedCurriculum, item.id)}
                          >
                            <div className="pt-0.5">
                              {isChecked ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-text-muted" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${isChecked ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                                  {item.name}
                                </span>
                                {item.quantity && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-text-muted">
                                    {item.quantity}
                                  </span>
                                )}
                                {item.optional && (
                                  <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                                    Optional
                                  </span>
                                )}
                                {isCustom && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                                    Custom
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className={`text-sm mt-0.5 ${isChecked ? 'text-text-muted/60' : 'text-text-muted'}`}>
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {isCustom && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCustomItem(selectedCurriculum, category.id, item.id);
                                }}
                                className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Add custom item button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddToCategoryId(category.id);
                          setShowAddModal(true);
                        }}
                        className="
                          w-full flex items-center justify-center gap-2 p-3
                          border-2 border-dashed border-text-muted/30 rounded-lg
                          text-text-muted hover:text-text-primary hover:border-text-muted/50
                          transition-colors
                        "
                      >
                        <Plus className="w-4 h-4" />
                        Add Custom Item
                      </button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Tips Card */}
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Tips for Setup</h3>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              <li>• Store materials in a labeled intervention bin or caddy</li>
              <li>• Keep commonly used items (cards, whiteboards) easily accessible</li>
              <li>• Check your bin at the start of each week for missing items</li>
              <li>• Use the "Add Custom Item" button to track program-specific materials</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Add Custom Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Add Custom Item</h2>
            <div className="space-y-4">
              <Input
                label="Item Name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g., Extra markers"
              />
              <Input
                label="Description (optional)"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="e.g., Keep backup set in drawer"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setNewItemName('');
                  setNewItemDescription('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={addCustomItem}
                disabled={!newItemName.trim()}
                className="flex-1"
              >
                Add Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
