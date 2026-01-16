'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Users, Search, Upload, AlertCircle, Info } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, CurriculumBadge } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { StudentFormModal, DeleteStudentModal, StudentModal, ImportStudentsModal } from '@/components/students';
import { useAllStudents, type StudentWithGroup } from '@/hooks/use-all-students';
import { useStudentsStore } from '@/stores/students';
import { useGroupsStore } from '@/stores/groups';
import { useAIContextStore } from '@/stores/ai-context';
import { useAuthStore } from '@/stores/auth';
import { db } from '@/lib/local-db';
import { toNumericId } from '@/lib/utils/id';
import type { Student, ProgressMonitoring, Curriculum } from '@/lib/supabase/types';
import { getCurriculumLabel, getTierLabel } from '@/lib/supabase/types';
import type { ValidatedStudent } from '@/lib/import-utils';
import {
  fetchAssignedStudentsWithGroupInfo,
  type StudentWithGroupInfo,
  type StudentGroupInfo,
} from '@/lib/supabase/student-assignments';
import { isMockMode } from '@/lib/supabase/config';

// Extended type for display
interface DisplayStudent extends StudentWithGroup {
  groupInfo?: StudentGroupInfo[];
  otherGroupIndicator?: {
    hasOtherGroups: boolean;
    interventionTypes: string[];
  };
}

export default function StudentsPage() {
  const { students: allStudentsWithGroups, isLoading: allStudentsLoading, error: allStudentsError, clearError, refetch } = useAllStudents();
  const createStudent = useStudentsStore((state) => state.createStudent);
  const updateStudent = useStudentsStore((state) => state.updateStudent);
  const deleteStudent = useStudentsStore((state) => state.deleteStudent);
  const studentsLoading = useStudentsStore((state) => state.isLoading);

  const groups = useGroupsStore((state) => state.groups);
  const fetchGroups = useGroupsStore((state) => state.fetchGroups);
  const { setContext, clearContext } = useAIContextStore();
  const { user, userRole, userProfile } = useAuthStore();

  // Role-based students data for interventionists
  const [assignedStudents, setAssignedStudents] = useState<StudentWithGroupInfo[]>([]);
  const [assignedStudentsLoading, setAssignedStudentsLoading] = useState(false);
  const [assignedStudentsError, setAssignedStudentsError] = useState<string | null>(null);

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
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Fetch role-based students for interventionists
  const fetchAssignedStudentsData = useCallback(async () => {
    if (!user || userRole !== 'interventionist' || isMockMode()) return;

    setAssignedStudentsLoading(true);
    setAssignedStudentsError(null);
    try {
      const students = await fetchAssignedStudentsWithGroupInfo(user.id);
      setAssignedStudents(students);
    } catch (err) {
      console.error('Error fetching assigned students:', err);
      setAssignedStudentsError(err instanceof Error ? err.message : 'Failed to load assigned students');
    } finally {
      setAssignedStudentsLoading(false);
    }
  }, [user, userRole]);

  useEffect(() => {
    if (userRole === 'interventionist') {
      fetchAssignedStudentsData();
    }
  }, [userRole, fetchAssignedStudentsData]);

  // Determine which students to show based on role
  const displayStudents = useMemo((): DisplayStudent[] => {
    // Admin sees all students
    if (userRole === 'admin') {
      return allStudentsWithGroups.map(s => ({ ...s }));
    }

    // Teacher sees students in their grade level
    if (userRole === 'teacher' && userProfile?.grade_level) {
      return allStudentsWithGroups
        .filter(s => s.grade_level === userProfile.grade_level)
        .map(s => ({ ...s }));
    }

    // Interventionist sees only assigned students with group info
    if (userRole === 'interventionist') {
      return assignedStudents.map(student => {
        // Find matching group from groups store
        const group = groups.find(g => g.id === student.group_id) || null;

        // Determine if student is in other groups (not owned by current user)
        const otherGroups = (student.groupInfo || []).filter(gi => !gi.isOwnGroup);
        const otherGroupIndicator = {
          hasOtherGroups: otherGroups.length > 0,
          interventionTypes: otherGroups.map(g => getCurriculumLabel(g.curriculum)),
        };

        return {
          ...student,
          group,
          groupInfo: student.groupInfo,
          otherGroupIndicator,
        };
      });
    }

    // New users with no role or no assignments see empty
    return [];
  }, [userRole, userProfile, allStudentsWithGroups, assignedStudents, groups]);

  const isLoading = userRole === 'admin' ? allStudentsLoading : assignedStudentsLoading;
  const error = userRole === 'admin' ? allStudentsError : assignedStudentsError;

  // Set AI context when students load
  useEffect(() => {
    if (displayStudents.length > 0) {
      const studentsContext = displayStudents.map(student => ({
        id: student.id.toString(),
        name: student.name,
        groupName: student.group?.name,
        curriculum: student.group?.curriculum,
        tier: student.group?.tier ? `Tier ${student.group.tier}` : undefined,
        notes: student.notes,
      }));

      setContext({
        students: studentsContext,
        group: null,
        currentPage: 'students',
      });
    }

    return () => {
      clearContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayStudents]);

  // Filter students by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return displayStudents;

    const query = searchQuery.toLowerCase();
    return displayStudents.filter((student) =>
      student.name.toLowerCase().includes(query) ||
      student.group?.name?.toLowerCase().includes(query)
    );
  }, [displayStudents, searchQuery]);

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
      const timer = setTimeout(() => clearError?.(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Load progress monitoring data from IndexedDB when student is selected
  useEffect(() => {
    async function loadProgressData() {
      if (!selectedStudent) return;

      try {
        const numericStudentId = toNumericId(selectedStudent.id);
        if (numericStudentId === null) return;

        const pmRecords = await db.progressMonitoring
          .where('student_id')
          .equals(numericStudentId)
          .toArray();

        const studentProgress: ProgressMonitoring[] = pmRecords.map(pm => ({
          id: String(pm.id),
          student_id: pm.student_id ? String(pm.student_id) : null,
          group_id: String(pm.group_id),
          date: pm.date,
          measure_type: pm.measure_type,
          score: pm.score,
          benchmark: pm.benchmark,
          goal: pm.goal,
          notes: pm.notes,
          created_at: pm.created_at,
        }));

        setProgressData(studentProgress);
      } catch (err) {
        console.error('Error loading progress data:', err);
        setProgressData([]);
      }
    }

    loadProgressData();
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
      const result = await createStudent({
        name: data.name,
        notes: data.notes,
        group_id: '',
      });
      if (result) {
        setSuccessMessage('Student added successfully');
        refetch();
        if (userRole === 'interventionist') {
          fetchAssignedStudentsData();
        }
      }
    } else if (formModalState.student) {
      await updateStudent(formModalState.student.id, data);
      setSuccessMessage('Student updated successfully');
      refetch();
      if (userRole === 'interventionist') {
        fetchAssignedStudentsData();
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteModalState.student) {
      await deleteStudent(deleteModalState.student.id);
      setSuccessMessage('Student deleted successfully');
      setDeleteModalState({ isOpen: false, student: null });
      refetch();
      if (userRole === 'interventionist') {
        fetchAssignedStudentsData();
      }
    }
  };

  const handleImportStudents = async (validatedStudents: ValidatedStudent[], groupId: string) => {
    let successCount = 0;
    let errorCount = 0;

    for (const validatedStudent of validatedStudents) {
      const result = await createStudent(validatedStudent.data);
      if (result) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    if (successCount > 0) {
      setSuccessMessage(`Successfully imported ${successCount} student${successCount !== 1 ? 's' : ''}`);
      refetch();
      if (userRole === 'interventionist') {
        fetchAssignedStudentsData();
      }
    }

    if (errorCount > 0) {
      console.error(`Failed to import ${errorCount} students`);
    }
  };

  // Show empty state for users with no assignments
  const showNoAssignmentsState = userRole === 'interventionist' && !isLoading && displayStudents.length === 0 && !error;
  const showNoRoleState = !userRole && !isLoading;

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
            <h1 className="text-2xl font-bold text-text-primary">
              {userRole === 'admin' ? 'All Students' : 'My Students'}
            </h1>
            <p className="text-text-muted mt-1">
              {userRole === 'admin'
                ? 'Manage students across all intervention groups'
                : userRole === 'interventionist'
                ? 'Students assigned to you by your administrator'
                : userRole === 'teacher'
                ? `Students in Grade ${userProfile?.grade_level || ''}`
                : 'Manage your students'}
            </p>
          </div>
          {userRole === 'admin' && (
            <div className="flex gap-2">
              <Button onClick={() => setImportModalOpen(true)} variant="secondary" className="gap-2">
                <Upload className="w-4 h-4" />
                Import Students
              </Button>
              <Button onClick={handleAddStudent} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Student
              </Button>
            </div>
          )}
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

        {/* No Role State */}
        {showNoRoleState && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                <h3 className="text-lg font-medium text-text-primary mb-2">Account Not Configured</h3>
                <p className="text-text-muted max-w-md mx-auto">
                  Your account hasn&apos;t been assigned a role yet. Please contact your administrator.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Assignments State for Interventionists */}
        {showNoAssignmentsState && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-50" />
                <h3 className="text-lg font-medium text-text-primary mb-2">No Students Assigned</h3>
                <p className="text-text-muted max-w-md mx-auto">
                  You don&apos;t have any students assigned to you yet. Please contact your administrator to get students assigned.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content - only show if user has students to view */}
        {!showNoAssignmentsState && !showNoRoleState && (
          <>
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
                      {searchQuery && ` of ${displayStudents.length}`})
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
                        : userRole === 'admin'
                        ? 'Get started by adding students to your intervention groups.'
                        : 'Ask your administrator to assign students to you.'}
                    </p>
                    {!searchQuery && userRole === 'admin' && (
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
                              {/* Show indicator if student is in another user's group */}
                              {student.otherGroupIndicator?.hasOtherGroups && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full">
                                  <Info className="w-3 h-3 text-blue-600" />
                                  <span className="text-xs text-blue-700">
                                    Also in: {student.otherGroupIndicator.interventionTypes.join(', ')}
                                  </span>
                                </div>
                              )}
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
                                <CurriculumBadge curriculum={student.group.curriculum} />
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
          </>
        )}
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

      <ImportStudentsModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportStudents}
        groups={groups}
        existingStudents={displayStudents}
        isLoading={studentsLoading}
      />
    </AppLayout>
  );
}
