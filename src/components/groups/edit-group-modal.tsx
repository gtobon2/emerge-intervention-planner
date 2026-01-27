'use client';

import { useState, useEffect } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCyclesStore, formatCycleDateRange } from '@/stores/cycles';
import { regenerateGroupSessions } from '@/lib/supabase/services';
import type {
  Group,
  GroupUpdate,
  Curriculum,
  Tier,
  WilsonPosition,
  DeltaMathPosition,
  CaminoPosition,
  WordGenPosition,
  AmiraPosition,
  DespegandoPosition,
  CurriculumPosition,
  WeekDay,
  EnhancedGroupSchedule,
  FlexibleGroupSchedule,
  DayTimeSlot,
  InterventionCycle,
} from '@/lib/supabase/types';
import { 
  isEnhancedSchedule, 
  isFlexibleSchedule,
  convertToEnhancedSchedule,
  flexibleToEnhancedSchedule,
  getSessionsPerWeek,
} from '@/lib/supabase/types';

export interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: GroupUpdate) => Promise<void>;
  group: Group | null;
  isLoading?: boolean;
}

const curriculumOptions = [
  { value: 'wilson', label: 'Wilson Reading System' },
  { value: 'delta_math', label: 'Delta Math' },
  { value: 'camino', label: 'Camino a la Lectura' },
  { value: 'wordgen', label: 'WordGen' },
  { value: 'amira', label: 'Amira Learning' },
  { value: 'despegando', label: 'Despegando (Spanish)' },
];

const tierOptions = [
  { value: '2', label: 'Tier 2' },
  { value: '3', label: 'Tier 3' },
];

const dayOptions: { value: WeekDay; label: string; shortLabel: string }[] = [
  { value: 'monday', label: 'Monday', shortLabel: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', shortLabel: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', shortLabel: 'Wed' },
  { value: 'thursday', label: 'Thursday', shortLabel: 'Thu' },
  { value: 'friday', label: 'Friday', shortLabel: 'Fri' },
];

export function EditGroupModal({
  isOpen,
  onClose,
  onSave,
  group,
  isLoading = false,
}: EditGroupModalProps) {
  const { cycles, fetchAllCycles } = useCyclesStore();

  const [formData, setFormData] = useState({
    name: '',
    curriculum: 'wilson' as Curriculum,
    tier: 2 as Tier,
    grade: 1,
    schedule_duration: 30,
    notes: '',
  });

  // Flexible schedule state (sessions per week instead of manual day selection)
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [preferredTime, setPreferredTime] = useState('');
  const [useManualDays, setUseManualDays] = useState(false);
  const [dayTimeSlots, setDayTimeSlots] = useState<DayTimeSlot[]>(
    dayOptions.map(d => ({ day: d.value, time: '', enabled: false }))
  );

  // Cycle selection state
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Session generation state
  const [regenerateSessions, setRegenerateSessions] = useState(false);
  const [sessionGenResult, setSessionGenResult] = useState<{ removed: number; created: number } | null>(null);

  // Curriculum position fields
  const [wilsonPosition, setWilsonPosition] = useState({ step: 1, substep: '1' });
  const [deltaMathPosition, setDeltaMathPosition] = useState({ standard: '' });
  const [caminoPosition, setCaminoPosition] = useState({ lesson: 1 });
  const [wordgenPosition, setWordgenPosition] = useState({ unit: 1, day: 1 });
  const [amiraPosition, setAmiraPosition] = useState<AmiraPosition>({ level: 'Emergent' });
  const [despegandoPosition, setDespegandoPosition] = useState<DespegandoPosition>({ phase: 1, lesson: 1 });

  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});

  // Fetch cycles when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllCycles();
    }
  }, [isOpen, fetchAllCycles]);

  // Reset form when modal opens/closes or group changes
  useEffect(() => {
    if (isOpen && group) {
      setFormData({
        name: group.name,
        curriculum: group.curriculum,
        tier: group.tier,
        grade: group.grade,
        schedule_duration: group.schedule?.duration || 30,
        notes: '',
      });

      // Handle schedule - check format (flexible, enhanced, or legacy)
      if (group.schedule && isFlexibleSchedule(group.schedule)) {
        // New flexible format
        const flex = group.schedule as FlexibleGroupSchedule;
        setSessionsPerWeek(flex.sessions_per_week);
        setPreferredTime(flex.preferred_time || '');
        setSelectedCycleId(flex.cycle_id || null);
        setUseCustomDates(!!flex.custom_start_date);
        setCustomStartDate(flex.custom_start_date || '');
        setCustomEndDate(flex.custom_end_date || '');
        setUseManualDays(false);
        // Load computed days if available (for manual override)
        if (flex.computed_days) {
          setDayTimeSlots(flex.computed_days);
        }
      } else if (group.schedule && isEnhancedSchedule(group.schedule)) {
        // Legacy enhanced format - convert to sessions per week
        const enhanced = group.schedule as EnhancedGroupSchedule;
        const enabledDays = enhanced.day_times.filter(dt => dt.enabled);
        setSessionsPerWeek(enabledDays.length || 3);
        setPreferredTime(enabledDays.find(dt => dt.time)?.time || '');
        setDayTimeSlots(enhanced.day_times);
        setSelectedCycleId(enhanced.cycle_id || null);
        setUseCustomDates(!!enhanced.custom_start_date);
        setCustomStartDate(enhanced.custom_start_date || '');
        setCustomEndDate(enhanced.custom_end_date || '');
        setUseManualDays(enabledDays.length > 0); // Show manual if they had specific days
      } else {
        // Convert legacy format
        const enhanced = convertToEnhancedSchedule(group.schedule);
        const enabledDays = enhanced.day_times.filter(dt => dt.enabled);
        setSessionsPerWeek(enabledDays.length || 3);
        setPreferredTime(enabledDays.find(dt => dt.time)?.time || '');
        setDayTimeSlots(enhanced.day_times);
        setSelectedCycleId(null);
        setUseCustomDates(false);
        setCustomStartDate('');
        setCustomEndDate('');
        setUseManualDays(false);
      }

      // Set curriculum position based on curriculum type
      if (group.curriculum === 'wilson') {
        const pos = group.current_position as WilsonPosition;
        setWilsonPosition(pos);
      } else if (group.curriculum === 'delta_math') {
        const pos = group.current_position as DeltaMathPosition;
        setDeltaMathPosition({ standard: pos.standard });
      } else if (group.curriculum === 'camino') {
        const pos = group.current_position as CaminoPosition;
        setCaminoPosition(pos);
      } else if (group.curriculum === 'wordgen') {
        const pos = group.current_position as WordGenPosition;
        setWordgenPosition(pos);
      } else if (group.curriculum === 'amira') {
        const pos = group.current_position as AmiraPosition;
        setAmiraPosition(pos);
      }

      setErrors({});
      setRegenerateSessions(false);
      setSessionGenResult(null);
    }
  }, [isOpen, group]);

  const validateForm = () => {
    const newErrors: { [key: string]: string | undefined } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }

    if (formData.grade < 0 || formData.grade > 12) {
      newErrors.grade = 'Grade must be between 0 and 12';
    }

    // Validate curriculum position based on type
    if (formData.curriculum === 'wilson') {
      if (wilsonPosition.step < 1 || wilsonPosition.step > 12) {
        newErrors.wilsonStep = 'Step must be between 1 and 12';
      }
      if (!wilsonPosition.substep.trim()) {
        newErrors.wilsonSubstep = 'Substep is required';
      }
    } else if (formData.curriculum === 'delta_math') {
      if (!deltaMathPosition.standard.trim()) {
        newErrors.deltaMathStandard = 'Standard is required';
      }
    } else if (formData.curriculum === 'camino') {
      if (caminoPosition.lesson < 1) {
        newErrors.caminoLesson = 'Lesson must be at least 1';
      }
    } else if (formData.curriculum === 'wordgen') {
      if (wordgenPosition.unit < 1) {
        newErrors.wordgenUnit = 'Unit must be at least 1';
      }
      if (wordgenPosition.day < 1 || wordgenPosition.day > 5) {
        newErrors.wordgenDay = 'Day must be between 1 and 5';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCurrentPosition = (): CurriculumPosition => {
    switch (formData.curriculum) {
      case 'wilson':
        return wilsonPosition;
      case 'delta_math':
        return deltaMathPosition;
      case 'camino':
        return caminoPosition;
      case 'wordgen':
        return wordgenPosition;
      case 'amira':
        return amiraPosition;
      case 'despegando':
        return despegandoPosition;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!group || !validateForm()) {
      return;
    }

    try {
      // Generate default days based on sessions_per_week if not manually specified
      // Default pattern: spread across week (Mon/Wed/Fri for 3, Mon/Tue/Wed/Thu for 4, etc.)
      const defaultDayPatterns: Record<number, WeekDay[]> = {
        1: ['wednesday'],
        2: ['tuesday', 'thursday'],
        3: ['monday', 'wednesday', 'friday'],
        4: ['monday', 'tuesday', 'thursday', 'friday'],
        5: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      };

      // Use manual days if specified, otherwise generate defaults
      let finalComputedDays: DayTimeSlot[];
      if (useManualDays) {
        finalComputedDays = dayTimeSlots;
      } else {
        // Generate from sessionsPerWeek
        const daysToUse = defaultDayPatterns[sessionsPerWeek] || defaultDayPatterns[3];
        finalComputedDays = dayOptions.map(d => ({
          day: d.value,
          time: preferredTime || '',
          enabled: daysToUse.includes(d.value),
        }));
      }

      // Build flexible schedule (new format)
      const flexibleSchedule: FlexibleGroupSchedule = {
        sessions_per_week: sessionsPerWeek,
        preferred_time: preferredTime || undefined,
        duration: formData.schedule_duration || 30,
        cycle_id: selectedCycleId || undefined,
        custom_start_date: useCustomDates ? customStartDate || undefined : undefined,
        custom_end_date: useCustomDates ? customEndDate || undefined : undefined,
        // Always include computed_days for scheduling to work
        computed_days: finalComputedDays,
      };

      // Convert to enhanced format for backward compatibility with session generation
      const enhancedSchedule = flexibleToEnhancedSchedule(flexibleSchedule);

      const updates: GroupUpdate = {
        name: formData.name.trim(),
        curriculum: formData.curriculum,
        tier: formData.tier,
        grade: formData.grade,
        current_position: getCurrentPosition(),
        schedule: flexibleSchedule as any, // Store flexible format
      };

      await onSave(group.id, updates);

      // Regenerate sessions if requested
      if (regenerateSessions && selectedCycleId) {
        try {
          const result = await regenerateGroupSessions(
            group.id,
            enhancedSchedule, // Use enhanced format for session generation
            { current_position: getCurrentPosition(), grade: formData.grade }
          );
          setSessionGenResult({ removed: result.removed, created: result.created.length });
          // Wait a moment to show the result before closing
          setTimeout(() => {
            onClose();
          }, 1500);
        } catch (err) {
          console.error('Failed to regenerate sessions:', err);
          onClose();
        }
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Failed to update group:', err);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDayToggle = (day: WeekDay) => {
    setDayTimeSlots((prev) =>
      prev.map((slot) =>
        slot.day === day
          ? { ...slot, enabled: !slot.enabled }
          : slot
      )
    );
  };

  const handleDayTimeChange = (day: WeekDay, time: string) => {
    setDayTimeSlots((prev) =>
      prev.map((slot) =>
        slot.day === day
          ? { ...slot, time, enabled: time ? true : slot.enabled }
          : slot
      )
    );
  };

  const handleApplySameTime = () => {
    // Find the first enabled day with a time
    const firstWithTime = dayTimeSlots.find((s) => s.enabled && s.time);
    if (firstWithTime) {
      setDayTimeSlots((prev) =>
        prev.map((slot) =>
          slot.enabled ? { ...slot, time: firstWithTime.time } : slot
        )
      );
    }
  };

  // Get cycle options for dropdown
  const cycleOptions = [
    { value: '', label: 'No cycle selected' },
    ...cycles
      .filter((c) => c.status === 'active' || c.status === 'planning')
      .map((c) => ({
        value: c.id,
        label: `${c.name} (${formatCycleDateRange(c)})`,
      })),
  ];

  if (!group) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Group"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Basic Information
          </h3>

          <Input
            label="Group Name"
            placeholder="e.g., Wilson Group A"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            disabled={isLoading}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Curriculum"
              options={curriculumOptions}
              value={formData.curriculum}
              onChange={(e) => handleChange('curriculum', e.target.value as Curriculum)}
              disabled={isLoading}
              required
            />

            <Select
              label="Tier"
              options={tierOptions}
              value={String(formData.tier)}
              onChange={(e) => handleChange('tier', parseInt(e.target.value) as Tier)}
              disabled={isLoading}
              required
            />

            <Input
              label="Grade"
              type="number"
              min="0"
              max="12"
              placeholder="e.g., 3"
              value={formData.grade}
              onChange={(e) => handleChange('grade', parseInt(e.target.value) || 0)}
              error={errors.grade}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {/* Curriculum Position */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Current Position
          </h3>

          {formData.curriculum === 'wilson' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Step"
                type="number"
                min="1"
                max="12"
                placeholder="e.g., 3"
                value={wilsonPosition.step}
                onChange={(e) =>
                  setWilsonPosition({ ...wilsonPosition, step: parseInt(e.target.value) || 1 })
                }
                error={errors.wilsonStep}
                disabled={isLoading}
                required
              />
              <Input
                label="Substep"
                placeholder="e.g., 2"
                value={wilsonPosition.substep}
                onChange={(e) =>
                  setWilsonPosition({ ...wilsonPosition, substep: e.target.value })
                }
                error={errors.wilsonSubstep}
                disabled={isLoading}
                required
              />
            </div>
          )}

          {formData.curriculum === 'delta_math' && (
            <Input
              label="Standard"
              placeholder="e.g., 4.NF.1"
              value={deltaMathPosition.standard}
              onChange={(e) =>
                setDeltaMathPosition({ ...deltaMathPosition, standard: e.target.value })
              }
              error={errors.deltaMathStandard}
              disabled={isLoading}
              required
            />
          )}

          {formData.curriculum === 'camino' && (
            <Input
              label="Lesson"
              type="number"
              min="1"
              placeholder="e.g., 25"
              value={caminoPosition.lesson}
              onChange={(e) =>
                setCaminoPosition({ lesson: parseInt(e.target.value) || 1 })
              }
              error={errors.caminoLesson}
              disabled={isLoading}
              required
            />
          )}

          {formData.curriculum === 'wordgen' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Unit"
                type="number"
                min="1"
                placeholder="e.g., 3"
                value={wordgenPosition.unit}
                onChange={(e) =>
                  setWordgenPosition({ ...wordgenPosition, unit: parseInt(e.target.value) || 1 })
                }
                error={errors.wordgenUnit}
                disabled={isLoading}
                required
              />
              <Input
                label="Day"
                type="number"
                min="1"
                max="5"
                placeholder="e.g., 2"
                value={wordgenPosition.day}
                onChange={(e) =>
                  setWordgenPosition({ ...wordgenPosition, day: parseInt(e.target.value) || 1 })
                }
                error={errors.wordgenDay}
                disabled={isLoading}
                required
              />
            </div>
          )}

          {formData.curriculum === 'amira' && (
            <Select
              label="Level"
              options={[
                { value: 'Emergent', label: 'Emergent' },
                { value: 'Beginning', label: 'Beginning' },
                { value: 'Transitional', label: 'Transitional' },
                { value: 'Fluent', label: 'Fluent' },
              ]}
              value={amiraPosition.level}
              onChange={(e) =>
                setAmiraPosition({ level: e.target.value as AmiraPosition['level'] })
              }
              disabled={isLoading}
              required
            />
          )}
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Schedule (Optional)
          </h3>

          {/* Cycle Selection */}
          <div className="space-y-3">
            <Select
              label="Intervention Cycle"
              options={cycleOptions}
              value={selectedCycleId || ''}
              onChange={(e) => setSelectedCycleId(e.target.value || null)}
              disabled={isLoading}
            />

            {selectedCycleId && (
              <div className="ml-4 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useCustomDates}
                    onChange={(e) => setUseCustomDates(e.target.checked)}
                    disabled={isLoading}
                    className="rounded border-gray-300"
                  />
                  <span className="text-text-muted">Custom dates (for mid-cycle starts)</span>
                </label>
                {useCustomDates && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Start Date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      disabled={isLoading}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sessions Per Week Selector (New Flexible Schedule) */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Sessions Per Week
            </label>
            <p className="text-xs text-text-muted mb-3">
              The scheduler will pick the best days based on availability.
            </p>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSessionsPerWeek(num)}
                  disabled={isLoading}
                  className={`
                    flex-1 py-3 px-4 rounded-lg font-medium transition-colors
                    ${sessionsPerWeek === num
                      ? 'bg-movement text-white'
                      : 'bg-white border border-gray-200 text-text-muted hover:bg-gray-50'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {num}x
                </button>
              ))}
            </div>
            
            {/* Preview suggested days */}
            <div className="mt-3 p-2 bg-foundation rounded-lg">
              <p className="text-xs text-text-muted">
                Suggested: {' '}
                <span className="font-medium text-text-primary">
                  {sessionsPerWeek === 2 && 'Tue, Thu'}
                  {sessionsPerWeek === 3 && 'Mon, Wed, Fri'}
                  {sessionsPerWeek === 4 && 'Mon, Tue, Thu, Fri'}
                  {sessionsPerWeek === 5 && 'Mon–Fri'}
                </span>
              </p>
            </div>
          </div>

          {/* Preferred Time */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Preferred Time
              <span className="text-text-muted font-normal ml-1">(optional)</span>
            </label>
            <input
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded border border-gray-200 text-sm
                         focus:ring-movement focus:border-movement"
              placeholder="--:--"
            />
          </div>

          {/* Manual Override Option */}
          <div className="pt-2">
            <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={useManualDays}
                onChange={(e) => setUseManualDays(e.target.checked)}
                disabled={isLoading}
                className="rounded border-gray-300"
              />
              Override: manually select specific days
            </label>
            
            {useManualDays && (
              <div className="mt-3 space-y-2">
                {dayOptions.map((day) => {
                  const slot = dayTimeSlots.find((s) => s.day === day.value);
                  const isEnabled = slot?.enabled || false;
                  return (
                    <div
                      key={day.value}
                      className={`
                        flex items-center gap-3 p-2 rounded-lg border transition-colors
                        ${isEnabled ? 'border-movement/30 bg-movement/5' : 'border-gray-200 bg-gray-50'}
                      `}
                    >
                      <button
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        disabled={isLoading}
                        className={`
                          w-20 px-2 py-1.5 rounded text-sm font-medium transition-colors
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${isEnabled
                            ? 'bg-movement text-white'
                            : 'bg-white border border-gray-200 text-text-muted hover:bg-gray-100'
                          }
                        `}
                      >
                        {day.shortLabel}
                      </button>
                      <input
                        type="time"
                        value={slot?.time || ''}
                        onChange={(e) => handleDayTimeChange(day.value, e.target.value)}
                        disabled={isLoading || !isEnabled}
                        className={`
                          flex-1 px-3 py-1.5 rounded border text-sm
                          ${isEnabled
                            ? 'border-movement/30 focus:ring-movement focus:border-movement'
                            : 'border-gray-200 bg-gray-100 text-gray-400'
                          }
                          disabled:cursor-not-allowed
                        `}
                        placeholder={isEnabled ? 'Select time' : '--:--'}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Duration */}
          <Input
            label="Session Duration (minutes)"
            type="number"
            min="10"
            max="120"
            placeholder="e.g., 30"
            value={formData.schedule_duration || ''}
            onChange={(e) => handleChange('schedule_duration', parseInt(e.target.value) || 30)}
            disabled={isLoading}
          />

          {/* Generate Sessions Option */}
          {selectedCycleId && dayTimeSlots.some((d) => d.enabled && d.time) && (
            <div className="mt-4 p-3 bg-movement/5 border border-movement/20 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regenerateSessions}
                  onChange={(e) => setRegenerateSessions(e.target.checked)}
                  disabled={isLoading}
                  className="mt-0.5 rounded border-movement text-movement focus:ring-movement"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <RefreshCw className="w-4 h-4 text-movement" />
                    Generate planned sessions
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    Automatically create planned sessions for the selected cycle based on this schedule.
                    Existing future planned sessions will be replaced.
                  </p>
                </div>
              </label>
              {sessionGenResult && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-700">
                  <Calendar className="w-4 h-4 inline-block mr-1" />
                  Created {sessionGenResult.created} sessions
                  {sessionGenResult.removed > 0 && ` (${sessionGenResult.removed} replaced)`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-text-muted/10">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
