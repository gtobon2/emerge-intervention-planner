'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, UserPlus, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStudentsStore } from '@/stores/students';
import { addStudentToGroupWithSync } from '@/lib/supabase/services';
import { checkInterventionConflict } from '@/lib/supabase/student-assignments';
import { useAuthStore } from '@/stores/auth';
import type { Student, Curriculum } from '@/lib/supabase/types';

export interface AddExistingStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groupId: string;
  groupCurriculum: Curriculum;
  existingStudentIds: string[];
}

export function AddExistingStudentModal({
  isOpen,
  onClose,
  onSuccess,
  groupId,
  groupCurriculum,
  existingStudentIds,
}: AddExistingStudentModalProps) {
  const { allStudents, fetchAllStudents, isLoading } = useStudentsStore();
  const { user } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Fetch all students when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllStudents();
      setSearchQuery('');
      setSelectedStudentId(null);
      setError(null);
      setConflictWarning(null);
    }
  }, [isOpen, fetchAllStudents]);

  // Filter students: exclude those already in this group
  const availableStudents = useMemo(() => {
    const existingSet = new Set(existingStudentIds);
    return allStudents.filter(s => !existingSet.has(s.id));
  }, [allStudents, existingStudentIds]);

  // Search filter
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return availableStudents;
    const query = searchQuery.toLowerCase();
    return availableStudents.filter(s => 
      s.name.toLowerCase().includes(query)
    );
  }, [availableStudents, searchQuery]);

  // Check for intervention conflict when student is selected
  useEffect(() => {
    async function checkConflict() {
      if (!selectedStudentId) {
        setConflictWarning(null);
        return;
      }
      
      try {
        const conflict = await checkInterventionConflict(
          selectedStudentId,
          groupCurriculum,
          groupId
        );
        
        if (conflict.hasConflict) {
          setConflictWarning(
            `Warning: This student is already in "${conflict.conflictingGroupName}" ` +
            `(${groupCurriculum}). Adding them here will move them from that group.`
          );
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        console.warn('Conflict check failed:', err);
      }
    }
    
    checkConflict();
  }, [selectedStudentId, groupCurriculum, groupId]);

  const handleAdd = async () => {
    if (!selectedStudentId) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await addStudentToGroupWithSync(
        selectedStudentId,
        groupId,
        user?.id || null
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add student');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Existing Student"
      size="md"
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Conflict warning */}
        {conflictWarning && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{conflictWarning}</span>
          </div>
        )}

        {/* Student list */}
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y">
          {isLoading ? (
            <div className="p-4 text-center text-text-muted">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-4 text-center text-text-muted">
              {searchQuery ? 'No students match your search' : 'No students available to add'}
            </div>
          ) : (
            filteredStudents.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => setSelectedStudentId(student.id)}
                className={`
                  w-full p-3 text-left hover:bg-gray-50 transition-colors
                  ${selectedStudentId === student.id ? 'bg-movement/10 border-l-4 border-movement' : ''}
                `}
              >
                <div className="font-medium text-text-primary">{student.name}</div>
                {student.grade_level && (
                  <div className="text-sm text-text-muted">Grade {student.grade_level}</div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedStudentId || isSaving}
            isLoading={isSaving}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add to Group
          </Button>
        </div>
      </div>
    </Modal>
  );
}
