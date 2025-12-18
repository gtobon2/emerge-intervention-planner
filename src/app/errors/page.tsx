'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle,
  BookOpen,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  Modal,
  Textarea,
  CurriculumBadge,
} from '@/components/ui';
import type { ErrorBankEntry, Curriculum } from '@/lib/supabase/types';

const curriculumOptions = [
  { value: 'all', label: 'All Curricula' },
  { value: 'wilson', label: 'Wilson Reading' },
  { value: 'delta_math', label: 'Delta Math' },
  { value: 'camino', label: 'Camino a la Lectura' },
  { value: 'wordgen', label: 'WordGen' },
  { value: 'amira', label: 'Amira Learning' },
];

const curriculumSelectOptions = [
  { value: '', label: 'Select curriculum...' },
  { value: 'wilson', label: 'Wilson Reading' },
  { value: 'delta_math', label: 'Delta Math' },
  { value: 'camino', label: 'Camino a la Lectura' },
  { value: 'wordgen', label: 'WordGen' },
  { value: 'amira', label: 'Amira Learning' },
];

export default function ErrorBankPage() {
  const [errors, setErrors] = useState<ErrorBankEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [curriculumFilter, setCurriculumFilter] = useState<Curriculum | 'all'>('all');
  const [customOnly, setCustomOnly] = useState(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingError, setEditingError] = useState<ErrorBankEntry | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    curriculum: '' as Curriculum | '',
    error_pattern: '',
    underlying_gap: '',
    correction_protocol: '',
    correction_prompts: '',
    visual_cues: '',
    kinesthetic_cues: '',
  });

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/error-bank');
      if (response.ok) {
        const data = await response.json();
        setErrors(data);
      }
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter errors
  const filteredErrors = errors.filter((error) => {
    if (curriculumFilter !== 'all' && error.curriculum !== curriculumFilter) {
      return false;
    }
    if (customOnly && !error.is_custom) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        error.error_pattern.toLowerCase().includes(query) ||
        error.correction_protocol.toLowerCase().includes(query) ||
        (error.underlying_gap?.toLowerCase().includes(query) ?? false)
      );
    }
    return true;
  });

  const resetForm = () => {
    setFormData({
      curriculum: '',
      error_pattern: '',
      underlying_gap: '',
      correction_protocol: '',
      correction_prompts: '',
      visual_cues: '',
      kinesthetic_cues: '',
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (error: ErrorBankEntry) => {
    setEditingError(error);
    setFormData({
      curriculum: error.curriculum,
      error_pattern: error.error_pattern,
      underlying_gap: error.underlying_gap || '',
      correction_protocol: error.correction_protocol,
      correction_prompts: error.correction_prompts?.join('\n') || '',
      visual_cues: error.visual_cues || '',
      kinesthetic_cues: error.kinesthetic_cues || '',
    });
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.curriculum || !formData.error_pattern || !formData.correction_protocol) {
      return;
    }

    const body = {
      curriculum: formData.curriculum,
      error_pattern: formData.error_pattern,
      underlying_gap: formData.underlying_gap || null,
      correction_protocol: formData.correction_protocol,
      correction_prompts: formData.correction_prompts
        ? formData.correction_prompts.split('\n').filter(Boolean)
        : null,
      visual_cues: formData.visual_cues || null,
      kinesthetic_cues: formData.kinesthetic_cues || null,
      is_custom: true,
    };

    try {
      const url = editingError
        ? `/api/error-bank/${editingError.id}`
        : '/api/error-bank';
      const method = editingError ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchErrors();
        setShowAddModal(false);
        resetForm();
        setEditingError(null);
      }
    } catch (error) {
      console.error('Failed to save error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this error pattern?')) {
      return;
    }

    try {
      const response = await fetch(`/api/error-bank/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchErrors();
      }
    } catch (error) {
      console.error('Failed to delete error:', error);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Error Bank</h1>
            <p className="text-text-muted">
              Manage common error patterns and correction protocols
            </p>
          </div>
          <Button className="gap-2" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4" />
            Add Error Pattern
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-surface rounded-xl">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Search error patterns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            options={curriculumOptions}
            value={curriculumFilter}
            onChange={(e) => setCurriculumFilter(e.target.value as Curriculum | 'all')}
            className="w-48"
          />
          <label className="flex items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={customOnly}
              onChange={(e) => setCustomOnly(e.target.checked)}
              className="rounded border-border bg-foundation"
            />
            Custom only
          </label>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-text-muted">Total Patterns</p>
            <p className="text-2xl font-bold text-text-primary">{errors.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-text-muted">Custom Patterns</p>
            <p className="text-2xl font-bold text-movement">
              {errors.filter(e => e.is_custom).length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-text-muted">Most Used</p>
            <p className="text-2xl font-bold text-text-primary">
              {Math.max(...errors.map(e => e.occurrence_count), 0)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-text-muted">Avg Effectiveness</p>
            <p className="text-2xl font-bold text-green-500">
              {errors.length > 0
                ? Math.round(
                    (errors.reduce((sum, e) => sum + (e.occurrence_count > 0 ? e.effectiveness_count / e.occurrence_count : 0), 0) / errors.length) * 100
                  )
                : 0}%
            </p>
          </Card>
        </div>

        {/* Error List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-surface rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredErrors.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-50" />
            <p className="text-text-muted mb-4">
              {searchQuery || curriculumFilter !== 'all' || customOnly
                ? 'No error patterns match your filters'
                : 'No error patterns yet'}
            </p>
            <Button onClick={handleOpenAdd}>Add First Error Pattern</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredErrors.map((error) => (
              <Card key={error.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CurriculumBadge curriculum={error.curriculum} />
                      {error.is_custom && (
                        <span className="px-2 py-0.5 bg-movement/20 text-movement text-xs rounded-full">
                          Custom
                        </span>
                      )}
                      <span className="text-xs text-text-muted">
                        Used {error.occurrence_count}x
                      </span>
                      {error.occurrence_count > 0 && (
                        <span className="flex items-center gap-1 text-xs text-green-500">
                          <CheckCircle className="w-3 h-3" />
                          {Math.round((error.effectiveness_count / error.occurrence_count) * 100)}% effective
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      {error.error_pattern}
                    </h3>

                    {error.underlying_gap && (
                      <p className="text-sm text-text-muted mb-2">
                        <span className="font-medium">Underlying Gap:</span> {error.underlying_gap}
                      </p>
                    )}

                    <div className="p-3 bg-foundation rounded-lg mt-3">
                      <p className="text-sm font-medium text-text-primary mb-1">
                        Correction Protocol:
                      </p>
                      <p className="text-sm text-text-muted">{error.correction_protocol}</p>
                    </div>

                    {error.correction_prompts && error.correction_prompts.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-text-muted mb-1">Prompts:</p>
                        <ul className="text-sm text-text-primary space-y-1">
                          {error.correction_prompts.map((prompt, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-movement">•</span>
                              {prompt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(error.visual_cues || error.kinesthetic_cues) && (
                      <div className="flex gap-4 mt-3 text-sm">
                        {error.visual_cues && (
                          <div>
                            <span className="text-text-muted">Visual:</span>{' '}
                            <span className="text-text-primary">{error.visual_cues}</span>
                          </div>
                        )}
                        {error.kinesthetic_cues && (
                          <div>
                            <span className="text-text-muted">Kinesthetic:</span>{' '}
                            <span className="text-text-primary">{error.kinesthetic_cues}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(error)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    {error.is_custom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(error.id)}
                        className="text-tier3"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
          setEditingError(null);
        }}
        title={editingError ? 'Edit Error Pattern' : 'Add Error Pattern'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Curriculum *
            </label>
            <Select
              options={curriculumSelectOptions}
              value={formData.curriculum}
              onChange={(e) => setFormData({ ...formData, curriculum: e.target.value as Curriculum })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Error Pattern *
            </label>
            <Input
              placeholder="e.g., 'Confuses b and d'"
              value={formData.error_pattern}
              onChange={(e) => setFormData({ ...formData, error_pattern: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Underlying Gap
            </label>
            <Input
              placeholder="e.g., 'Visual discrimination'"
              value={formData.underlying_gap}
              onChange={(e) => setFormData({ ...formData, underlying_gap: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Correction Protocol *
            </label>
            <Textarea
              placeholder="Describe the correction procedure..."
              value={formData.correction_protocol}
              onChange={(e) => setFormData({ ...formData, correction_protocol: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Correction Prompts (one per line)
            </label>
            <Textarea
              placeholder="Enter prompts, one per line..."
              value={formData.correction_prompts}
              onChange={(e) => setFormData({ ...formData, correction_prompts: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Visual Cues
              </label>
              <Input
                placeholder="e.g., 'Letter cards'"
                value={formData.visual_cues}
                onChange={(e) => setFormData({ ...formData, visual_cues: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Kinesthetic Cues
              </label>
              <Input
                placeholder="e.g., 'Sky writing'"
                value={formData.kinesthetic_cues}
                onChange={(e) => setFormData({ ...formData, kinesthetic_cues: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
                setEditingError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.curriculum || !formData.error_pattern || !formData.correction_protocol}
            >
              {editingError ? 'Save Changes' : 'Add Pattern'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
