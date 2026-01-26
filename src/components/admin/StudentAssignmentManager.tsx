'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  UserPlus,
  UserMinus,
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FolderPlus,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Modal,
  Badge,
} from '@/components/ui';
import {
  fetchAllStudentsWithAssignments,
  createStudentAssignment,
  deleteStudentAssignment,
} from '@/lib/supabase/student-assignments';
import { fetchInterventionists, type Profile } from '@/lib/supabase/profiles';
import {
  fetchGroupsByOwner,
  addStudentToGroup,
} from '@/lib/supabase/services';
import {
  GRADE_LEVELS,
  type GradeLevel,
  type StudentWithAssignments,
  type StudentAssignment,
  type Group,
} from '@/lib/supabase/types';
import { isMockMode } from '@/lib/supabase/config';

interface StudentAssignmentManagerProps {
  currentUserId?: string;
}

export function StudentAssignmentManager({ currentUserId }: StudentAssignmentManagerProps) {
  // State
  const [students, setStudents] = useState<StudentWithAssignments[]>([]);
  const [interventionists, setInterventionists] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedInterventionist, setSelectedInterventionist] = useState<string>('all');

  // Assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [targetInterventionistId, setTargetInterventionistId] = useState<string>('');

  // Group selection modal (shown after assignment)
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [interventionistGroups, setInterventionistGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [recentlyAssignedStudentId, setRecentlyAssignedStudentId] = useState<string | null>(null);
  const [recentlyAssignedInterventionistId, setRecentlyAssignedInterventionistId] = useState<string | null>(null);

  // Expanded rows for showing assignments
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  // Fetch data
  const fetchData = useCallback(async () => {
    if (isMockMode()) {
      // Mock data for development
      setStudents([
        {
          id: '1',
          group_id: 'g1',
          name: 'Alice Johnson',
          notes: null,
          grade_level: '3',
          created_at: new Date().toISOString(),
          assignments: [],
          interventionists: [],
        },
        {
          id: '2',
          group_id: 'g1',
          name: 'Bob Smith',
          notes: null,
          grade_level: '4',
          created_at: new Date().toISOString(),
          assignments: [
            {
              id: 'a1',
              student_id: '2',
              interventionist_id: 'int-1',
              assigned_by: 'admin-1',
              assigned_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            },
          ],
          interventionists: [{ id: 'int-1', full_name: 'Sarah Martinez' }],
        },
        {
          id: '3',
          group_id: 'g2',
          name: 'Charlie Brown',
          notes: null,
          grade_level: '5',
          created_at: new Date().toISOString(),
          assignments: [],
          interventionists: [],
        },
      ]);
      setInterventionists([
        {
          id: 'int-1',
          full_name: 'Sarah Martinez',
          email: 'sarah@emerge.edu',
          role: 'interventionist',
          grade_level: null,
          created_at: new Date().toISOString(),
          created_by: null,
        },
        {
          id: 'int-2',
          full_name: 'Mike Thompson',
          email: 'mike@emerge.edu',
          role: 'interventionist',
          grade_level: null,
          created_at: new Date().toISOString(),
          created_by: null,
        },
      ]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [studentsData, interventionistsData] = await Promise.all([
        fetchAllStudentsWithAssignments(),
        fetchInterventionists(),
      ]);
      setStudents(studentsData);
      setInterventionists(interventionistsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-hide messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!student.name.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Grade filter
      if (selectedGrade !== 'all' && student.grade_level !== selectedGrade) {
        return false;
      }

      // Interventionist filter
      if (selectedInterventionist !== 'all') {
        if (selectedInterventionist === 'unassigned') {
          if (student.assignments.length > 0) return false;
        } else {
          if (!student.assignments.some((a: StudentAssignment) => a.interventionist_id === selectedInterventionist)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [students, searchQuery, selectedGrade, selectedInterventionist]);

  // Handlers
  const toggleExpanded = (studentId: string) => {
    setExpandedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleOpenAssignModal = (studentId: string) => {
    setSelectedStudentId(studentId);
    setTargetInterventionistId('');
    setShowAssignModal(true);
  };

  const handleAssignStudent = async () => {
    if (!selectedStudentId || !targetInterventionistId) return;

    if (isMockMode()) {
      // Mock assignment
      const interventionist = interventionists.find(i => i.id === targetInterventionistId);
      setStudents(prev =>
        prev.map(s =>
          s.id === selectedStudentId
            ? {
                ...s,
                assignments: [
                  ...s.assignments,
                  {
                    id: `mock-${Date.now()}`,
                    student_id: selectedStudentId,
                    interventionist_id: targetInterventionistId,
                    assigned_by: currentUserId || null,
                    assigned_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                  },
                ],
                interventionists: [
                  ...(s.interventionists || []),
                  interventionist ? { id: interventionist.id, full_name: interventionist.full_name } : null,
                ].filter(Boolean) as { id: string; full_name: string }[],
              }
            : s
        )
      );
      setSuccessMessage('Student assigned successfully');
      setShowAssignModal(false);
      return;
    }

    setIsSaving(true);
    try {
      await createStudentAssignment({
        student_id: selectedStudentId,
        interventionist_id: targetInterventionistId,
        assigned_by: currentUserId || null,
      });
      
      // After successful assignment, check if interventionist has groups
      try {
        const groups = await fetchGroupsByOwner(targetInterventionistId);
        if (groups.length > 0) {
          // Store info for group modal
          setRecentlyAssignedStudentId(selectedStudentId);
          setRecentlyAssignedInterventionistId(targetInterventionistId);
          setInterventionistGroups(groups);
          setSelectedGroupId('');
          setShowAssignModal(false);
          setShowGroupModal(true);
          setSuccessMessage('Student assigned! Would you like to add them to a group?');
        } else {
          setSuccessMessage('Student assigned successfully');
          setShowAssignModal(false);
        }
      } catch {
        // If fetching groups fails, just complete the assignment
        setSuccessMessage('Student assigned successfully');
        setShowAssignModal(false);
      }
      
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Error assigning student:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign student');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding student to a group after assignment
  const handleAddToGroup = async () => {
    if (!recentlyAssignedStudentId || !selectedGroupId) return;

    setIsSaving(true);
    try {
      await addStudentToGroup(
        recentlyAssignedStudentId,
        selectedGroupId,
        currentUserId || null,
        { syncAssignment: false } // Already assigned
      );
      setSuccessMessage('Student added to group successfully!');
      setShowGroupModal(false);
      setRecentlyAssignedStudentId(null);
      setRecentlyAssignedInterventionistId(null);
      setInterventionistGroups([]);
      await fetchData();
    } catch (err) {
      console.error('Error adding student to group:', err);
      setError(err instanceof Error ? err.message : 'Failed to add student to group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipGroupAssignment = () => {
    setShowGroupModal(false);
    setRecentlyAssignedStudentId(null);
    setRecentlyAssignedInterventionistId(null);
    setInterventionistGroups([]);
  };

  const handleUnassignStudent = async (studentId: string, assignmentId: string) => {
    if (isMockMode()) {
      setStudents(prev =>
        prev.map(s =>
          s.id === studentId
            ? {
                ...s,
                assignments: s.assignments.filter(a => a.id !== assignmentId),
              }
            : s
        )
      );
      setSuccessMessage('Student unassigned successfully');
      return;
    }

    setIsSaving(true);
    try {
      await deleteStudentAssignment(assignmentId);
      setSuccessMessage('Student unassigned successfully');
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Error unassigning student:', err);
      setError(err instanceof Error ? err.message : 'Failed to unassign student');
    } finally {
      setIsSaving(false);
    }
  };

  // Get selected student for modal
  const selectedStudent = selectedStudentId
    ? students.find(s => s.id === selectedStudentId)
    : null;

  // Get available interventionists (not already assigned to this student)
  const availableInterventionists = useMemo(() => {
    if (!selectedStudent) return interventionists;
    const assignedIds = new Set(selectedStudent.assignments.map((a: StudentAssignment) => a.interventionist_id));
    return interventionists.filter(i => !assignedIds.has(i.id));
  }, [selectedStudent, interventionists]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-movement" />
        <span className="ml-2 text-text-muted">Loading student assignments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Student-to-Interventionist Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
            <Select
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
              options={[
                { value: 'all', label: 'All Grades' },
                ...GRADE_LEVELS.map(g => ({ value: g, label: `Grade ${g}` })),
              ]}
            />
            <Select
              value={selectedInterventionist}
              onChange={e => setSelectedInterventionist(e.target.value)}
              options={[
                { value: 'all', label: 'All Interventionists' },
                { value: 'unassigned', label: 'Unassigned Only' },
                ...interventionists.map(i => ({ value: i.id, label: i.full_name })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredStudents.length === 0 ? (
            <p className="text-text-muted text-center py-8">No students found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-text-muted w-8"></th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Grade</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Interventionists</th>
                    <th className="text-right py-3 px-4 font-medium text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <>
                      <tr key={student.id} className="border-b border-border/50 hover:bg-foundation">
                        <td className="py-3 px-4">
                          {student.assignments.length > 0 && (
                            <button
                              onClick={() => toggleExpanded(student.id)}
                              className="text-text-muted hover:text-text-primary"
                            >
                              {expandedStudents.has(student.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-text-primary">{student.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          {student.grade_level ? (
                            <Badge>Grade {student.grade_level}</Badge>
                          ) : (
                            <span className="text-text-muted">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {student.assignments.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {student.interventionists?.map((i: { id: string; full_name: string }) => (
                                <Badge key={i.id}>
                                  {i.full_name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-text-muted text-sm">Not assigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenAssignModal(student.id)}
                            className="gap-1"
                          >
                            <UserPlus className="w-4 h-4" />
                            Assign
                          </Button>
                        </td>
                      </tr>
                      {/* Expanded row showing assignments */}
                      {expandedStudents.has(student.id) && student.assignments.length > 0 && (
                        <tr key={`${student.id}-expanded`} className="bg-foundation/50">
                          <td colSpan={5} className="py-2 px-8">
                            <div className="space-y-2">
                              <span className="text-sm font-medium text-text-muted">
                                Current Assignments:
                              </span>
                              {student.assignments.map((assignment: StudentAssignment) => {
                                const interventionist = student.interventionists?.find(
                                  (i: { id: string; full_name: string }) => i.id === assignment.interventionist_id
                                );
                                return (
                                  <div
                                    key={assignment.id}
                                    className="flex items-center justify-between bg-surface p-2 rounded"
                                  >
                                    <div>
                                      <span className="font-medium">
                                        {interventionist?.full_name || 'Unknown'}
                                      </span>
                                      <span className="text-sm text-text-muted ml-2">
                                        Assigned{' '}
                                        {new Date(assignment.assigned_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleUnassignStudent(student.id, assignment.id)
                                      }
                                      className="text-red-500 hover:text-red-600"
                                      disabled={isSaving}
                                    >
                                      <UserMinus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Assign Student: ${selectedStudent?.name || ''}`}
        size="md"
      >
        <div className="space-y-4">
          {availableInterventionists.length === 0 ? (
            <div className="text-center py-4">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-text-muted">
                This student is already assigned to all available interventionists.
              </p>
            </div>
          ) : (
            <>
              <Select
                label="Select Interventionist"
                value={targetInterventionistId}
                onChange={e => setTargetInterventionistId(e.target.value)}
                options={[
                  { value: '', label: 'Select an interventionist...' },
                  ...availableInterventionists.map(i => ({
                    value: i.id,
                    label: i.full_name,
                  })),
                ]}
              />
              <p className="text-sm text-text-muted">
                The selected interventionist will be able to see and work with this student.
              </p>
            </>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            {availableInterventionists.length > 0 && (
              <Button
                onClick={handleAssignStudent}
                isLoading={isSaving}
                disabled={!targetInterventionistId}
              >
                Assign Student
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Group Selection Modal (shown after assignment) */}
      <Modal
        isOpen={showGroupModal}
        onClose={handleSkipGroupAssignment}
        title="Add Student to Group"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <FolderPlus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Student assigned successfully!
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Would you like to add this student to one of the interventionist&apos;s groups?
                This will allow them to participate in group sessions.
              </p>
            </div>
          </div>

          {interventionistGroups.length > 0 && (
            <Select
              label="Select Group (Optional)"
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              options={[
                { value: '', label: 'Select a group...' },
                ...interventionistGroups.map(g => ({
                  value: g.id,
                  label: `${g.name} (${g.curriculum}, Tier ${g.tier})`,
                })),
              ]}
            />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={handleSkipGroupAssignment}>
              Skip for Now
            </Button>
            <Button
              onClick={handleAddToGroup}
              isLoading={isSaving}
              disabled={!selectedGroupId}
              className="gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              Add to Group
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
