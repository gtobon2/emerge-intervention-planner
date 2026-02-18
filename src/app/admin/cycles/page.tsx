'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  BarChart3,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  useCyclesStore,
  formatCycleDateRange,
  getCycleProgress,
  getCycleStatusColorClass,
  getWeekOfCycle,
} from '@/stores/cycles';
import type {
  InterventionCycle,
  InterventionCycleInsert,
  CycleStatus,
} from '@/lib/supabase/types';
import { getCycleStatusLabel } from '@/lib/supabase/types';

interface CycleFormData {
  name: string;
  start_date: string;
  end_date: string;
  weeks_count: number;
  grade_band: string;
  status: CycleStatus;
  notes: string;
}

const defaultFormData: CycleFormData = {
  name: '',
  start_date: '',
  end_date: '',
  weeks_count: 6,
  grade_band: '',
  status: 'planning',
  notes: '',
};

const statusOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const gradeBandOptions = [
  { value: '', label: 'All Grades' },
  { value: 'K-2', label: 'K-2' },
  { value: '3-5', label: '3-5' },
  { value: '6-8', label: '6-8' },
];

export default function CyclesPage() {
  const {
    cycles,
    currentCycle,
    isLoading,
    fetchAllCycles,
    fetchCurrentCycle,
    createCycle,
    updateCycle,
    deleteCycle,
  } = useCyclesStore();

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState<InterventionCycle | null>(null);
  const [formData, setFormData] = useState<CycleFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch cycles on mount
  useEffect(() => {
    fetchAllCycles();
    fetchCurrentCycle();
  }, [fetchAllCycles, fetchCurrentCycle]);

  // Calculate weeks based on dates
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const weeks = Math.round(diffDays / 7);
      if (weeks > 0 && weeks !== formData.weeks_count) {
        setFormData((prev) => ({ ...prev, weeks_count: weeks }));
      }
    }
  }, [formData.start_date, formData.end_date, formData.weeks_count]);

  // Handle edit click
  const handleEditCycle = (cycle: InterventionCycle) => {
    setEditingCycle(cycle);
    setFormData({
      name: cycle.name,
      start_date: cycle.start_date,
      end_date: cycle.end_date,
      weeks_count: cycle.weeks_count,
      grade_band: cycle.grade_band || '',
      status: cycle.status,
      notes: cycle.notes || '',
    });
    setShowEditModal(true);
  };

  // Handle create
  const handleCreateCycle = async () => {
    if (!formData.name.trim() || !formData.start_date || !formData.end_date) return;

    setIsSubmitting(true);
    try {
      const cycleData: InterventionCycleInsert = {
        name: formData.name.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        weeks_count: formData.weeks_count,
        grade_band: formData.grade_band || null,
        status: formData.status,
        notes: formData.notes.trim() || null,
        created_by: null,
      };

      await createCycle(cycleData);
      setShowAddModal(false);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Failed to create cycle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update
  const handleUpdateCycle = async () => {
    if (!editingCycle || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateCycle(editingCycle.id, {
        name: formData.name.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        weeks_count: formData.weeks_count,
        grade_band: formData.grade_band || null,
        status: formData.status,
        notes: formData.notes.trim() || null,
      });
      setShowEditModal(false);
      setEditingCycle(null);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Failed to update cycle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDeleteCycle = async (cycleId: string) => {
    if (!confirm('Are you sure you want to delete this cycle? This may affect groups using this cycle.')) return;

    try {
      await deleteCycle(cycleId);
      setShowEditModal(false);
      setEditingCycle(null);
    } catch (error) {
      console.error('Failed to delete cycle:', error);
    }
  };

  // Generate next cycle name
  const generateNextCycleName = () => {
    const cycleNumbers = cycles
      .map((c) => {
        const match = c.name.match(/Cycle (\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((n) => n > 0);

    const nextNumber = cycleNumbers.length > 0 ? Math.max(...cycleNumbers) + 1 : 1;
    return `Cycle ${nextNumber}`;
  };

  const today = new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link
                href="/admin"
                className="text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="font-semibold text-base sm:text-lg">Intervention Cycles</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  Manage intervention cycle periods
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setFormData({
                  ...defaultFormData,
                  name: generateNextCycleName(),
                });
                setShowAddModal(true);
              }}
              className="gap-2 min-h-[44px] shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Cycle</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Current Cycle Banner */}
        {currentCycle && (
          <Card className="mb-4 sm:mb-6 border-movement/30 bg-movement/5">
            <CardContent className="py-3 sm:py-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-full bg-movement/20">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-movement" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg">{currentCycle.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {formatCycleDateRange(currentCycle)} ({currentCycle.weeks_count} weeks)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-8 sm:ml-0">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-movement">
                      Week {getWeekOfCycle(currentCycle, today)}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500">of {currentCycle.weeks_count}</div>
                  </div>
                  <div className="w-24 sm:w-32">
                    <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{getCycleProgress(currentCycle)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-movement rounded-full transition-all"
                        style={{ width: `${getCycleProgress(currentCycle)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cycles List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg" />
              ))}
            </div>
          ) : cycles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-1">No cycles yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Create your first intervention cycle to get started
                </p>
                <Button
                  variant="primary"
                  onClick={() => {
                    setFormData({
                      ...defaultFormData,
                      name: 'Cycle 1',
                    });
                    setShowAddModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create First Cycle
                </Button>
              </CardContent>
            </Card>
          ) : (
            cycles.map((cycle) => {
              const progress = getCycleProgress(cycle);
              const isActive = cycle.status === 'active';
              const isCurrent = currentCycle?.id === cycle.id;

              return (
                <Card
                  key={cycle.id}
                  className={`
                    transition-all hover:shadow-md
                    ${isCurrent ? 'ring-2 ring-movement ring-offset-2' : ''}
                  `}
                >
                  <CardContent className="py-3 sm:py-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-base sm:text-lg">{cycle.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCycleStatusColorClass(cycle.status)}`}>
                            {getCycleStatusLabel(cycle.status)}
                          </span>
                          {cycle.grade_band && (
                            <Badge variant="default">{cycle.grade_band}</Badge>
                          )}
                          {isCurrent && (
                            <span className="text-xs text-movement font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {formatCycleDateRange(cycle)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {cycle.weeks_count} weeks
                          </span>
                          {isActive && (
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              Week {getWeekOfCycle(cycle, today)} of {cycle.weeks_count}
                            </span>
                          )}
                        </div>
                        {cycle.notes && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-2">{cycle.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {isActive && (
                          <div className="w-20 sm:w-24">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-movement rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="text-[10px] sm:text-xs text-gray-500 text-center mt-1">
                              {progress}%
                            </div>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCycle(cycle)}
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Add Cycle Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Cycle"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Cycle Name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Cycle 3"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Number of Weeks"
              type="number"
              min="1"
              max="20"
              value={formData.weeks_count}
              onChange={(e) => setFormData((prev) => ({ ...prev, weeks_count: parseInt(e.target.value) || 6 }))}
            />
            <Select
              label="Grade Band (optional)"
              options={gradeBandOptions}
              value={formData.grade_band}
              onChange={(e) => setFormData((prev) => ({ ...prev, grade_band: e.target.value }))}
            />
          </div>

          <Select
            label="Status"
            options={statusOptions}
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as CycleStatus }))}
          />

          <Input
            label="Notes (optional)"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional details..."
          />

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setShowAddModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCycle}
              disabled={isSubmitting || !formData.name.trim() || !formData.start_date || !formData.end_date}
            >
              {isSubmitting ? 'Creating...' : 'Create Cycle'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Cycle Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCycle(null);
        }}
        title="Edit Cycle"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Cycle Name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Number of Weeks"
              type="number"
              min="1"
              max="20"
              value={formData.weeks_count}
              onChange={(e) => setFormData((prev) => ({ ...prev, weeks_count: parseInt(e.target.value) || 6 }))}
            />
            <Select
              label="Grade Band"
              options={gradeBandOptions}
              value={formData.grade_band}
              onChange={(e) => setFormData((prev) => ({ ...prev, grade_band: e.target.value }))}
            />
          </div>

          <Select
            label="Status"
            options={statusOptions}
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as CycleStatus }))}
          />

          <Input
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          />

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => editingCycle && handleDeleteCycle(editingCycle.id)}
              disabled={isSubmitting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px]"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCycle(null);
                }}
                disabled={isSubmitting}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateCycle}
                disabled={isSubmitting || !formData.name.trim()}
                className="min-h-[44px]"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
