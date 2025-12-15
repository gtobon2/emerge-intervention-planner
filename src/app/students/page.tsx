'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Users, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StudentFormModal, DeleteStudentModal, StudentModal } from '@/components/students';
import { useAllStudents, type StudentWithGroup } from '@/hooks/use-all-students';
import { useStudentsStore } from '@/stores/students';
import { useProgressStore } from '@/stores/progress';
import type { Student, ProgressMonitoring } from '@/lib/supabase/types';
import { getCurriculumLabel, getTierLabel } from '@/lib/supabase/types';
import { MOCK_PROGRESS } from '@/lib/mock-data';

export default function StudentsPage() {
  const { students, isLoading, error, clearError, refetch } = useAllStudents();
  const createStudent = useStudentsStore((state) => state.createStudent);
  const updateStudent = useStudentsStore((state) => state.updateStudent);
  const deleteStudent = useStudentsStore((state) => state.deleteStudent);
  const studentsLoading = useStudentsStore((state) => state.isLoading);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithGroup | null>(null);
  const [progressData, setProgressData] = useState<ProgressMonitoring[]>([]);

  const [formModalState, setFormModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    student?: StudentWithGroup;
  }>({
    isOpen: false,
    mode: 'create',
  });

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    student: StudentWithGroup | null;
  }>({
    isOpen: false,
    student: null,
  });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter students by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter((student) =>
      student.name.toLowerCase().includes(query) ||
      student.group?.name.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

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

  // Load progress data when student is selected
  useEffect(() => {
    if (selectedStudent) {
      // In a real app, fetch from API. For now, use mock data
      const studentProgress = MOCK_PROGRESS.filter(
        (pm) => pm.student_id === selectedStudent.id
      );
      setProgressData(studentProgress);
    }
  }, [selectedStudent]);

  const handleAddStudent = () => {
    setFormModalState({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleEditStudent = (student: StudentWithGroup) => {
    setFormModalState({
      isOpen: true,
      mode: 'edit',
      student,
    });
  };

  const handleDeleteStudent = (student: StudentWithGroup) => {
    setDeleteModalState({
      isOpen: true,
      student,
    });
  };

  const handleViewStudent = (student: StudentWithGroup) => {
    setSelectedStudent(student);
    setDetailModalOpen(true);
  };

  const handleSaveStudent = async (data: { name: string; notes: string | null }) => {
    if (formModalState.mode === 'create') {
      // When creating, we need to ask which group to assign to
      // For now, we'll create without a group and user can edit later
      // In a more complete implementation, the form modal would include group selection
      const result = await createStudent({
        name: data.name,
        notes: data.notes,
        group_id: '', // This should be selected in the form
      });
      if (result) {
        setSuccessMessage('Student added successfully');
        refetch();
      }
    } else if (formModalState.student) {
      await updateStudent(formModalState.student.id, data);
      setSuccessMessage('Student updated successfully');
      refetch();
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteModalState.student) {
      await deleteStudent(deleteModalState.student.id);
      setSuccessMessage('Student deleted successfully');
      setDeleteModalState({ isOpen: false, student: null });
      refetch();
    }
  };

  if (isLoading) {
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
            <h1 className="text-2xl font-bold text-text-primary">All Students</h1>
            <p className="text-text-muted mt-1">
              Manage students across all intervention groups
            </p>
          </div>
          <Button onClick={handleAddStudent} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Student
          </Button>
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

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                type="text"
                placeholder="Search students by name or group..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>
                  Students ({filteredStudents.length}
                  {searchQuery && ` of ${students.length}`})
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  {searchQuery ? 'No students found' : 'No students yet'}
                </h3>
                <p className="text-text-muted mb-6">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : 'Get started by adding students to your intervention groups.'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleAddStudent} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Student
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleViewStudent(student)}
                    className="bg-foundation rounded-lg border border-text-muted/10 hover:border-pink-500/30 hover:bg-pink-50/50 transition-all cursor-pointer p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-text-primary">
                            {student.name}
                          </h4>
                        </div>

                        {student.group ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-text-muted">
                              {student.group.name}
                            </span>
                            <Badge variant="tier" tier={student.group.tier}>
                              {getTierLabel(student.group.tier)}
                            </Badge>
                            <Badge>
                              Grade {student.group.grade}
                            </Badge>
                            <Badge variant="curriculum" curriculum={student.group.curriculum}>
                              {getCurriculumLabel(student.group.curriculum)}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-sm text-text-muted italic">
                            Not assigned to a group
                          </span>
                        )}

                        {student.notes && (
                          <p className="text-sm text-text-muted mt-2 line-clamp-2">
                            {student.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
        student={formModalState.student as Student}
        isLoading={studentsLoading}
      />

      <DeleteStudentModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, student: null })}
        onConfirm={handleConfirmDelete}
        student={deleteModalState.student as Student}
        isLoading={studentsLoading}
      />

      <StudentModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        progressData={progressData}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
      />
    </AppLayout>
  );
}
