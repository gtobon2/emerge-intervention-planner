'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Users, UserPlus } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { StudentList } from '@/components/students/student-list';
import { StudentFormModal } from '@/components/students/student-form-modal';
import { DeleteStudentModal } from '@/components/students/delete-student-modal';
import { AddExistingStudentModal } from '@/components/students/add-existing-student-modal';
import { useGroupsStore } from '@/stores/groups';
import { useStudents } from '@/hooks/use-students';
import { useAIContextStore } from '@/stores/ai-context';
import type { Student } from '@/lib/supabase/types';

export default function StudentsManagementPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const { selectedGroup, fetchGroupById, isLoading: groupLoading } = useGroupsStore();
  const {
    students,
    isLoading: studentsLoading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    clearError,
  } = useStudents(groupId);
  const { setContext, clearContext } = useAIContextStore();

  const [formModalState, setFormModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    student?: Student;
  }>({
    isOpen: false,
    mode: 'create',
  });

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    student: Student | null;
  }>({
    isOpen: false,
    student: null,
  });

  const [addExistingModalOpen, setAddExistingModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
    }
  }, [groupId, fetchGroupById]);

  // Set AI context when group and students load
  useEffect(() => {
    if (selectedGroup && students.length > 0) {
      // Build students context
      const studentsContext = students.map(student => ({
        id: student.id.toString(),
        name: student.name,
        groupName: selectedGroup.name,
        curriculum: selectedGroup.curriculum,
        tier: `Tier ${selectedGroup.tier}`,
        notes: student.notes,
      }));

      // Build group context
      const groupContext = {
        name: selectedGroup.name,
        curriculum: selectedGroup.curriculum,
        tier: `Tier ${selectedGroup.tier}`,
        grade: `${selectedGroup.grade}`,
      };

      setContext({
        students: studentsContext,
        group: groupContext,
        currentPage: `students-management:${selectedGroup.name}`,
      });
    }

    // Clear context when navigating away
    return () => {
      clearContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, students]); // setContext and clearContext are stable Zustand actions

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Auto-hide error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleAddStudent = () => {
    setFormModalState({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleEditStudent = (student: Student) => {
    setFormModalState({
      isOpen: true,
      mode: 'edit',
      student,
    });
  };

  const handleDeleteStudent = (student: Student) => {
    setDeleteModalState({
      isOpen: true,
      student,
    });
  };

  const handleSaveStudent = async (data: { name: string; notes: string | null }) => {
    if (formModalState.mode === 'create') {
      const result = await addStudent(data);
      if (result) {
        setSuccessMessage('Student added successfully');
      }
    } else if (formModalState.student) {
      const result = await updateStudent(formModalState.student.id, data);
      if (result) {
        setSuccessMessage('Student updated successfully');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteModalState.student) {
      const result = await deleteStudent(deleteModalState.student.id);
      if (result) {
        setSuccessMessage('Student removed successfully');
        setDeleteModalState({ isOpen: false, student: null });
      }
    }
  };

  if (groupLoading || !selectedGroup) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-surface rounded" />
          <div className="h-64 bg-surface rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href={`/groups/${groupId}`}>
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Group
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              Manage Students - {selectedGroup.name}
            </h1>
            <p className="text-text-muted mt-1">
              Add and manage students in this intervention group
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={() => setAddExistingModalOpen(true)} 
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Existing
            </Button>
            <Button onClick={handleAddStudent} className="gap-2">
              <Plus className="w-4 h-4" />
              New Student
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Students ({students.length})</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-foundation rounded-lg animate-pulse" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  No students yet
                </h3>
                <p className="text-text-muted mb-6">
                  Get started by adding students to this intervention group.
                </p>
                <Button onClick={handleAddStudent} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add First Student
                </Button>
              </div>
            ) : (
              <StudentList
                students={students}
                onEdit={handleEditStudent}
                onDelete={handleDeleteStudent}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <StudentFormModal
        isOpen={formModalState.isOpen}
        onClose={() => setFormModalState({ isOpen: false, mode: 'create' })}
        onSave={handleSaveStudent}
        mode={formModalState.mode}
        student={formModalState.student}
        isLoading={studentsLoading}
      />

      <DeleteStudentModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, student: null })}
        onConfirm={handleConfirmDelete}
        student={deleteModalState.student}
        isLoading={studentsLoading}
      />

      <AddExistingStudentModal
        isOpen={addExistingModalOpen}
        onClose={() => setAddExistingModalOpen(false)}
        onSuccess={() => {
          setSuccessMessage('Student added to group successfully');
          // Refresh students list
          fetchGroupById(groupId);
        }}
        groupId={groupId}
        groupCurriculum={selectedGroup.curriculum}
        existingStudentIds={students.map(s => s.id)}
      />
    </AppLayout>
  );
}
