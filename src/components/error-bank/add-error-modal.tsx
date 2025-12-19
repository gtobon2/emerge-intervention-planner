'use client';

import { useState } from 'react';
import { Modal, Input, Select, Textarea, Button } from '@/components/ui';
import type { Curriculum } from '@/lib/supabase/types';

interface AddErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (errorData: NewErrorData) => void;
}

export interface NewErrorData {
  curriculum: Curriculum;
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

export function AddErrorModal({ isOpen, onClose, onSave }: AddErrorModalProps) {
  const [formData, setFormData] = useState<NewErrorData>({
    curriculum: 'wilson',
    error_pattern: '',
    underlying_gap: '',
    correction_protocol: '',
    correction_prompts: [],
    visual_cues: '',
    kinesthetic_cues: '',
  });
  const [promptsText, setPromptsText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    onSave({
      ...formData,
      correction_prompts: prompts,
    });

    // Reset form
    setFormData({
      curriculum: 'wilson',
      error_pattern: '',
      underlying_gap: '',
      correction_protocol: '',
      correction_prompts: [],
      visual_cues: '',
      kinesthetic_cues: '',
    });
    setPromptsText('');
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      curriculum: 'wilson',
      error_pattern: '',
      underlying_gap: '',
      correction_protocol: '',
      correction_prompts: [],
      visual_cues: '',
      kinesthetic_cues: '',
    });
    setPromptsText('');
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Custom Error Pattern" size="lg">
      <div className="space-y-4">
        {/* Curriculum */}
        <Select
          label="Curriculum"
          options={curriculumOptions}
          value={formData.curriculum}
          onChange={(e) => setFormData({ ...formData, curriculum: e.target.value as Curriculum })}
          error={errors.curriculum}
        />

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
