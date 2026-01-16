'use client';

import { useState, useMemo } from 'react';
import { Modal, Input, Select, Textarea, Button } from '@/components/ui';
import type { Curriculum, CurriculumPosition } from '@/lib/supabase/types';

interface AddErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (errorData: NewErrorData) => void;
}

export interface NewErrorData {
  curriculum: Curriculum;
  position: CurriculumPosition | null;
  error_pattern: string;
  underlying_gap: string;
  correction_protocol: string;
  correction_prompts: string[];
  visual_cues: string;
  kinesthetic_cues: string;
}

const curriculumOptions = [
  { value: 'wilson', label: 'Wilson Reading' },
  { value: 'delta_math', label: 'Delta Math' },
  { value: 'camino', label: 'Camino a la Lectura' },
  { value: 'wordgen', label: 'WordGen' },
  { value: 'amira', label: 'Amira Learning' },
];

// Wilson step options (1-6)
const wilsonStepOptions = [
  { value: '', label: 'All Steps (Universal)' },
  ...Array.from({ length: 6 }, (_, i) => ({ value: String(i + 1), label: `Step ${i + 1}` }))
];

// Wilson substep options (varies by step, but commonly .1-.6)
const wilsonSubstepOptions = [
  { value: '', label: 'All Substeps' },
  { value: '1', label: '.1' },
  { value: '2', label: '.2' },
  { value: '3', label: '.3' },
  { value: '4', label: '.4' },
  { value: '5', label: '.5' },
  { value: '6', label: '.6' },
];

// Camino lesson options (1-40)
const caminoLessonOptions = [
  { value: '', label: 'All Lessons (Universal)' },
  ...Array.from({ length: 40 }, (_, i) => ({ value: String(i + 1), label: `Lesson ${i + 1}` }))
];

// Delta Math standard options (common standards)
const deltaMathStandardOptions = [
  { value: '', label: 'All Standards (Universal)' },
  { value: '3.NBT.1', label: '3.NBT.1 - Place Value' },
  { value: '3.NBT.2', label: '3.NBT.2 - Addition/Subtraction' },
  { value: '4.NF.1', label: '4.NF.1 - Equivalent Fractions' },
  { value: '4.NF.2', label: '4.NF.2 - Comparing Fractions' },
  { value: '4.NF.3c', label: '4.NF.3c - Adding Fractions' },
  { value: '5.NBT.3', label: '5.NBT.3 - Decimals' },
  { value: '5.NF.1', label: '5.NF.1 - Adding Fractions (Unlike)' },
  { value: '5.NBT.7', label: '5.NBT.7 - Decimal Operations' },
];

export function AddErrorModal({ isOpen, onClose, onSave }: AddErrorModalProps) {
  const [formData, setFormData] = useState<NewErrorData>({
    curriculum: 'wilson',
    position: null,
    error_pattern: '',
    underlying_gap: '',
    correction_protocol: '',
    correction_prompts: [],
    visual_cues: '',
    kinesthetic_cues: '',
  });
  const [promptsText, setPromptsText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Position form state
  const [wilsonStep, setWilsonStep] = useState('');
  const [wilsonSubstep, setWilsonSubstep] = useState('');
  const [caminoLesson, setCaminoLesson] = useState('');
  const [deltaStandard, setDeltaStandard] = useState('');
  const [useRange, setUseRange] = useState(false);
  const [rangeEnd, setRangeEnd] = useState('');

  // Build position from form fields
  const buildPosition = (): CurriculumPosition | null => {
    switch (formData.curriculum) {
      case 'wilson':
        if (!wilsonStep) return null;
        if (useRange && rangeEnd) {
          return { step: parseInt(wilsonStep), substep: wilsonStep, stepRange: [parseInt(wilsonStep), parseInt(rangeEnd)] as [number, number] };
        }
        return {
          step: parseInt(wilsonStep),
          substep: wilsonSubstep ? `${wilsonStep}.${wilsonSubstep}` : wilsonStep
        };
      case 'camino':
      case 'despegando':
        if (!caminoLesson) return null;
        if (useRange && rangeEnd) {
          return { lesson: parseInt(caminoLesson), lessonRange: [parseInt(caminoLesson), parseInt(rangeEnd)] as [number, number] };
        }
        return { lesson: parseInt(caminoLesson) };
      case 'delta_math':
        if (!deltaStandard) return null;
        return { standard: deltaStandard };
      default:
        return null;
    }
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    // Validation
    if (!formData.curriculum) {
      newErrors.curriculum = 'Curriculum is required';
    }
    if (!formData.error_pattern.trim()) {
      newErrors.error_pattern = 'Error pattern is required';
    }
    if (!formData.correction_protocol.trim()) {
      newErrors.correction_protocol = 'Correction protocol is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Parse prompts from textarea (one per line)
    const prompts = promptsText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // Build position from form fields
    const position = buildPosition();

    onSave({
      ...formData,
      position,
      correction_prompts: prompts,
    });

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      curriculum: 'wilson',
      position: null,
      error_pattern: '',
      underlying_gap: '',
      correction_protocol: '',
      correction_prompts: [],
      visual_cues: '',
      kinesthetic_cues: '',
    });
    setPromptsText('');
    setErrors({});
    setWilsonStep('');
    setWilsonSubstep('');
    setCaminoLesson('');
    setDeltaStandard('');
    setUseRange(false);
    setRangeEnd('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Reset position fields when curriculum changes
  const handleCurriculumChange = (curriculum: Curriculum) => {
    setFormData({ ...formData, curriculum });
    setWilsonStep('');
    setWilsonSubstep('');
    setCaminoLesson('');
    setDeltaStandard('');
    setUseRange(false);
    setRangeEnd('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Custom Error Pattern" size="lg">
      <div className="space-y-4">
        {/* Curriculum */}
        <Select
          label="Curriculum"
          options={curriculumOptions}
          value={formData.curriculum}
          onChange={(e) => handleCurriculumChange(e.target.value as Curriculum)}
          error={errors.curriculum}
        />

        {/* Position Editor - Wilson */}
        {formData.curriculum === 'wilson' && (
          <div className="p-4 bg-purple-50 rounded-lg space-y-3">
            <label className="block text-sm font-medium text-purple-800">
              Position (Step/Substep)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label=""
                options={wilsonStepOptions}
                value={wilsonStep}
                onChange={(e) => {
                  setWilsonStep(e.target.value);
                  if (!e.target.value) setWilsonSubstep('');
                }}
              />
              {wilsonStep && (
                <Select
                  label=""
                  options={wilsonSubstepOptions}
                  value={wilsonSubstep}
                  onChange={(e) => setWilsonSubstep(e.target.value)}
                />
              )}
            </div>
            {wilsonStep && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="wilsonRange"
                  checked={useRange}
                  onChange={(e) => setUseRange(e.target.checked)}
                  className="rounded border-purple-300"
                />
                <label htmlFor="wilsonRange" className="text-sm text-purple-700">
                  Apply to range of steps
                </label>
                {useRange && (
                  <Select
                    label=""
                    options={wilsonStepOptions.filter(opt => opt.value !== '' && parseInt(opt.value) > parseInt(wilsonStep))}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                  />
                )}
              </div>
            )}
            <p className="text-xs text-purple-600">
              Leave blank to apply to all steps (universal error)
            </p>
          </div>
        )}

        {/* Position Editor - Camino */}
        {(formData.curriculum === 'camino' || formData.curriculum === 'despegando') && (
          <div className="p-4 bg-orange-50 rounded-lg space-y-3">
            <label className="block text-sm font-medium text-orange-800">
              Position (Lesson)
            </label>
            <Select
              label=""
              options={caminoLessonOptions}
              value={caminoLesson}
              onChange={(e) => setCaminoLesson(e.target.value)}
            />
            {caminoLesson && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="caminoRange"
                  checked={useRange}
                  onChange={(e) => setUseRange(e.target.checked)}
                  className="rounded border-orange-300"
                />
                <label htmlFor="caminoRange" className="text-sm text-orange-700">
                  Apply to range of lessons
                </label>
                {useRange && (
                  <Select
                    label=""
                    options={caminoLessonOptions.filter(opt => opt.value !== '' && parseInt(opt.value) > parseInt(caminoLesson))}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                  />
                )}
              </div>
            )}
            <p className="text-xs text-orange-600">
              Leave blank to apply to all lessons (universal error)
            </p>
          </div>
        )}

        {/* Position Editor - Delta Math */}
        {formData.curriculum === 'delta_math' && (
          <div className="p-4 bg-blue-50 rounded-lg space-y-3">
            <label className="block text-sm font-medium text-blue-800">
              Position (Standard)
            </label>
            <Select
              label=""
              options={deltaMathStandardOptions}
              value={deltaStandard}
              onChange={(e) => setDeltaStandard(e.target.value)}
            />
            <p className="text-xs text-blue-600">
              Leave blank to apply to all standards (universal error)
            </p>
          </div>
        )}

        {/* Error Pattern */}
        <Input
          label="Error Pattern"
          placeholder="e.g., Reverses b and d"
          value={formData.error_pattern}
          onChange={(e) => setFormData({ ...formData, error_pattern: e.target.value })}
          error={errors.error_pattern}
        />

        {/* Underlying Gap */}
        <Textarea
          label="Underlying Gap"
          placeholder="e.g., Visual discrimination difficulty with mirror-image letters"
          value={formData.underlying_gap}
          onChange={(e) => setFormData({ ...formData, underlying_gap: e.target.value })}
          helperText="Optional: Describe the root cause of this error"
        />

        {/* Correction Protocol */}
        <Textarea
          label="Correction Protocol"
          placeholder="e.g., Use 'bed' trick: make fists with thumbs up..."
          value={formData.correction_protocol}
          onChange={(e) => setFormData({ ...formData, correction_protocol: e.target.value })}
          error={errors.correction_protocol}
        />

        {/* Correction Prompts */}
        <Textarea
          label="Correction Prompts"
          placeholder="Enter one prompt per line&#10;Make your hands into a bed. Which side is b?&#10;B has its belly in front. D has its diaper in back."
          value={promptsText}
          onChange={(e) => setPromptsText(e.target.value)}
          helperText="Optional: Enter one prompt per line"
          className="min-h-[100px]"
        />

        {/* Visual Cues */}
        <Textarea
          label="Visual Cues"
          placeholder="e.g., Bed hand trick, directional arrows on letter cards"
          value={formData.visual_cues}
          onChange={(e) => setFormData({ ...formData, visual_cues: e.target.value })}
          helperText="Optional: Visual supports to use with this correction"
        />

        {/* Kinesthetic Cues */}
        <Textarea
          label="Kinesthetic Cues"
          placeholder="e.g., Trace letter in sand/salt while saying sound"
          value={formData.kinesthetic_cues}
          onChange={(e) => setFormData({ ...formData, kinesthetic_cues: e.target.value })}
          helperText="Optional: Physical/tactile supports to use"
        />

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-text-muted/10">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save Error Pattern
          </Button>
        </div>
      </div>
    </Modal>
  );
}
