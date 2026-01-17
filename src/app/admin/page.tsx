'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Shield,
  Users,
  GraduationCap,
  CalendarCheck,
  Activity,
  Plus,
  Search,
  Download,
  Trash2,
  Settings as SettingsIcon,
  RefreshCw,
  Edit2,
  UserPlus,
  Clock,
  Loader2,
  Link2,
  Layers,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  Button,
  Input,
  Select,
  Modal,
  ConfirmModal,
  Switch,
} from '@/components/ui';
import { StudentAssignmentManager, GroupManagementTab } from '@/components/admin';
import { useGroupsStore } from '@/stores/groups';
import { useStudentsStore } from '@/stores/students';
import { useSessionsStore } from '@/stores/sessions';
import { useSettings } from '@/hooks/use-settings';
import { useAuthStore } from '@/stores/auth';
import { exportToFile, clearAllData } from '@/lib/local-db/backup';
import { isMockMode } from '@/lib/supabase/config';
import type { Group, Student, SessionWithGroup, GradeLevel, GRADE_LEVELS } from '@/lib/supabase/types';
import type { Profile, UserRole } from '@/lib/supabase/profiles';

// ============================================
// TYPES
// ============================================

type AdminTab = 'overview' | 'users' | 'students' | 'assignments' | 'groups' | 'data' | 'settings';

// Grade level options
const GRADE_LEVEL_OPTIONS: GradeLevel[] = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8'];

// User type for display (maps Profile to our UI needs)
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gradeLevel?: GradeLevel | null;
  createdAt: string;
  createdBy?: string | null;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Stores
  const { groups, fetchGroups } = useGroupsStore();
  const { allStudents, fetchAllStudents, createStudent, updateStudent, deleteStudent } = useStudentsStore();
  const { allSessions, fetchAllSessions } = useSessionsStore();
  const { sessionDefaults, updateSessionDefaults, saveSettings } = useSettings();
  const { user: currentUser } = useAuthStore();

  // Users state - fetched from Supabase
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);

  // Edit states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Form data
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'interventionist' as User['role'],
    gradeLevel: '' as GradeLevel | '',
  });
  const [studentForm, setStudentForm] = useState({
    name: '',
    notes: '',
    group_id: '',
  });

  // Settings state
  const [localSessionDuration, setLocalSessionDuration] = useState(sessionDefaults.defaultDuration.toString());

  // Fetch users from Supabase API
  const fetchUsers = useCallback(async () => {
    if (isMockMode()) {
      // In mock mode, use demo users
      setUsers([
        { id: '1', name: 'Admin User', email: 'admin@school.edu', role: 'admin', gradeLevel: null, createdAt: new Date().toISOString() },
        { id: '2', name: 'Sarah Martinez', email: 'sarah@emerge.edu', role: 'interventionist', gradeLevel: null, createdAt: new Date().toISOString() },
        { id: '3', name: 'John Smith', email: 'john@emerge.edu', role: 'teacher', gradeLevel: '3', createdAt: new Date().toISOString() },
      ]);
      return;
    }

    setUsersLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      // Map profiles to User format
      const mappedUsers: User[] = (data.users || []).map((profile: Profile) => ({
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role,
        gradeLevel: profile.grade_level,
        createdAt: profile.created_at,
        createdBy: profile.created_by,
      }));

      setUsers(mappedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchGroups();
    fetchAllStudents();
    fetchAllSessions();
    fetchUsers();
  }, [fetchGroups, fetchAllStudents, fetchAllSessions, fetchUsers]);

  // Update local duration when sessionDefaults changes
  useEffect(() => {
    setLocalSessionDuration(sessionDefaults.defaultDuration.toString());
  }, [sessionDefaults.defaultDuration]);

  // Auto-hide messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const stats = useMemo(() => {
    const completedSessions = allSessions.filter(s => s.status === 'completed');
    const activeInterventions = groups.filter(g => {
      const groupSessions = allSessions.filter(s => s.group_id === g.id && s.status === 'planned');
      return groupSessions.length > 0;
    });

    return {
      totalStudents: allStudents.length,
      totalUsers: users.length,
      completedSessions: completedSessions.length,
      activeInterventions: activeInterventions.length,
    };
  }, [allStudents, users, allSessions, groups]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return allStudents;
    const query = searchQuery.toLowerCase();
    return allStudents.filter(s => s.name.toLowerCase().includes(query));
  }, [allStudents, searchQuery]);

  // ============================================
  // HANDLERS
  // ============================================

  // User handlers
  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', role: 'interventionist', gradeLevel: '' });
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({ name: user.name, email: user.email, role: user.role, gradeLevel: user.gradeLevel || '' });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      setErrorMessage('Name and email are required');
      return;
    }

    if (isMockMode()) {
      // Mock mode: update local state
      if (editingUser) {
        setUsers(prev =>
          prev.map(u =>
            u.id === editingUser.id
              ? { ...u, name: userForm.name, email: userForm.email, role: userForm.role, gradeLevel: userForm.gradeLevel || null }
              : u
          )
        );
        setSuccessMessage('User updated successfully');
      } else {
        const newUser: User = {
          id: Date.now().toString(),
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          gradeLevel: userForm.gradeLevel || null,
          createdAt: new Date().toISOString(),
          createdBy: 'admin',
        };
        setUsers(prev => [...prev, newUser]);
        setSuccessMessage('User added successfully');
      }
      setShowUserModal(false);
      return;
    }

    setIsLoading(true);
    try {
      if (editingUser) {
        // Update existing user via PATCH
        const response = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: editingUser.id,
            full_name: userForm.name,
            role: userForm.role,
            grade_level: userForm.role === 'teacher' ? userForm.gradeLevel || null : null,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update user');
        }

        setSuccessMessage('User updated successfully');
      } else {
        // Create new user via POST
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userForm.email,
            full_name: userForm.name,
            role: userForm.role,
            grade_level: userForm.role === 'teacher' ? userForm.gradeLevel || null : null,
            created_by: currentUser?.id || null,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create user');
        }

        setSuccessMessage(data.message || 'User created successfully');
      }

      setShowUserModal(false);
      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteUserModal(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;

    if (isMockMode()) {
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setSuccessMessage('User deleted successfully');
      setShowDeleteUserModal(false);
      setUserToDelete(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users?user_id=${userToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccessMessage('User deleted successfully');
      setShowDeleteUserModal(false);
      setUserToDelete(null);
      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  // Student handlers
  const handleAddStudent = () => {
    setEditingStudent(null);
    setStudentForm({ name: '', notes: '', group_id: groups[0]?.id || '' });
    setShowStudentModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentForm({
      name: student.name,
      notes: student.notes || '',
      group_id: student.group_id,
    });
    setShowStudentModal(true);
  };

  const handleSaveStudent = async () => {
    if (!studentForm.name.trim()) {
      setErrorMessage('Student name is required');
      return;
    }

    setIsLoading(true);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          name: studentForm.name,
          notes: studentForm.notes || null,
          group_id: studentForm.group_id,
        });
        setSuccessMessage('Student updated successfully');
      } else {
        await createStudent({
          name: studentForm.name,
          notes: studentForm.notes || null,
          group_id: studentForm.group_id,
        });
        setSuccessMessage('Student added successfully');
      }
      setShowStudentModal(false);
      fetchAllStudents();
    } catch (err) {
      setErrorMessage('Failed to save student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudentClick = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteStudentModal(true);
  };

  const handleConfirmDeleteStudent = async () => {
    if (studentToDelete) {
      setIsLoading(true);
      try {
        await deleteStudent(studentToDelete.id);
        setSuccessMessage('Student deleted successfully');
        setShowDeleteStudentModal(false);
        setStudentToDelete(null);
        fetchAllStudents();
      } catch (err) {
        setErrorMessage('Failed to delete student');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Data handlers
  const handleExportStudents = () => {
    const csvContent = [
      ['Name', 'Group', 'Notes', 'Created At'],
      ...allStudents.map(s => {
        const group = groups.find(g => g.id === s.group_id);
        return [s.name, group?.name || 'No Group', s.notes || '', s.created_at];
      }),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMessage('Students exported successfully');
  };

  const handleExportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Created At', 'Created By'],
      ...users.map(u => [u.name, u.email, u.role, u.createdAt, u.createdBy || '']),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMessage('Users exported successfully');
  };

  const handleExportSessions = () => {
    const csvContent = [
      ['Date', 'Group', 'Status', 'Position', 'Curriculum'],
      ...allSessions.map(s => [
        s.date,
        s.group?.name || 'Unknown',
        s.status,
        JSON.stringify(s.curriculum_position),
        s.group?.curriculum || '',
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessions-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMessage('Sessions exported successfully');
  };

  const handleExportAllData = async () => {
    try {
      setIsLoading(true);
      await exportToFile();
      setSuccessMessage('All data exported successfully');
    } catch (err) {
      setErrorMessage('Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSessionData = async () => {
    setShowClearDataModal(false);
    setIsLoading(true);
    try {
      await clearAllData();
      setSuccessMessage('All session data cleared');
      fetchGroups();
      fetchAllStudents();
      fetchAllSessions();
    } catch (err) {
      setErrorMessage('Failed to clear data');
    } finally {
      setIsLoading(false);
    }
  };

  // Settings handlers
  const handleSaveSessionDuration = async () => {
    setIsLoading(true);
    try {
      updateSessionDefaults({ defaultDuration: parseInt(localSessionDuration) });
      await saveSettings();
      setSuccessMessage('Settings saved successfully');
    } catch (err) {
      setErrorMessage('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderTabs = () => (
    <div className="border-b border-border mb-6">
      <nav className="-mb-px flex space-x-8 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'students', label: 'Students', icon: GraduationCap },
          { id: 'assignments', label: 'Assignments', icon: Link2 },
          { id: 'groups', label: 'Manage Groups', icon: Layers },
          { id: 'data', label: 'Data', icon: Download },
          { id: 'settings', label: 'Settings', icon: SettingsIcon },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === tab.id
                  ? 'border-movement text-movement'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          icon={<GraduationCap className="w-5 h-5" />}
        />
        <StatCard
          label="Total Users/Staff"
          value={stats.totalUsers}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Sessions Completed"
          value={stats.completedSessions}
          icon={<CalendarCheck className="w-5 h-5" />}
        />
        <StatCard
          label="Active Interventions"
          value={stats.activeInterventions}
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={handleAddUser} variant="secondary" className="gap-2 justify-start">
            <UserPlus className="w-4 h-4" />
            Add New User
          </Button>
          <Button onClick={handleAddStudent} variant="secondary" className="gap-2 justify-start">
            <Plus className="w-4 h-4" />
            Add New Student
          </Button>
          <Button onClick={handleExportAllData} variant="secondary" className="gap-2 justify-start">
            <Download className="w-4 h-4" />
            Backup All Data
          </Button>
        </CardContent>
      </Card>

      {/* School Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-movement" />
                  <h3 className="font-semibold text-text-primary">School Calendar</h3>
                </div>
                <p className="text-sm text-text-muted mb-4">
                  Manage non-student days, holidays, PD days, and schedule modifications.
                </p>
                <Link href="/admin/school-calendar">
                  <Button variant="primary" size="sm" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Manage Calendar
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <RotateCcw className="w-5 h-5 text-movement" />
                  <h3 className="font-semibold text-text-primary">Intervention Cycles</h3>
                </div>
                <p className="text-sm text-text-muted mb-4">
                  Create and manage intervention cycle periods for scheduling.
                </p>
                <Link href="/admin/cycles">
                  <Button variant="primary" size="sm" className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Manage Cycles
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {allSessions.length === 0 ? (
            <p className="text-text-muted text-center py-8">No sessions recorded yet</p>
          ) : (
            <div className="space-y-2">
              {allSessions.slice(0, 5).map(session => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-foundation rounded-lg"
                >
                  <div>
                    <p className="font-medium text-text-primary">{session.group?.name}</p>
                    <p className="text-sm text-text-muted">{session.date}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      session.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : session.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => fetchUsers()} variant="ghost" size="sm" disabled={usersLoading}>
            <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleAddUser} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-movement" />
              <span className="ml-2 text-text-muted">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-text-muted text-center py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Grade Level</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Created</th>
                    <th className="text-right py-3 px-4 font-medium text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-foundation">
                      <td className="py-3 px-4">
                        <span className="font-medium text-text-primary">{user.name}</span>
                      </td>
                      <td className="py-3 px-4 text-text-muted">{user.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'interventionist'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-muted text-sm">
                        {user.role === 'teacher' && user.gradeLevel
                          ? `Grade ${user.gradeLevel}`
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-text-muted text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button onClick={handleAddStudent} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {filteredStudents.length === 0 ? (
            <p className="text-text-muted text-center py-8">No students found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Group</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Notes</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Created</th>
                    <th className="text-right py-3 px-4 font-medium text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => {
                    const group = groups.find(g => g.id === student.group_id);
                    return (
                      <tr
                        key={student.id}
                        className="border-b border-border/50 hover:bg-foundation"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-text-primary">{student.name}</span>
                        </td>
                        <td className="py-3 px-4 text-text-muted">{group?.name || 'Unassigned'}</td>
                        <td className="py-3 px-4 text-text-muted text-sm max-w-xs truncate">
                          {student.notes || '-'}
                        </td>
                        <td className="py-3 px-4 text-text-muted text-sm">
                          {new Date(student.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStudent(student)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStudentClick(student)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderAssignments = () => (
    <StudentAssignmentManager currentUserId={currentUser?.id} />
  );

  const renderData = () => (
    <div className="space-y-6">
      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-text-muted text-sm">
            Export your data to CSV format for external use or backup purposes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={handleExportStudents} variant="secondary" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              Export Students (CSV)
            </Button>
            <Button onClick={handleExportUsers} variant="secondary" className="gap-2">
              <Users className="w-4 h-4" />
              Export Users (CSV)
            </Button>
            <Button onClick={handleExportSessions} variant="secondary" className="gap-2">
              <CalendarCheck className="w-4 h-4" />
              Export Sessions (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Backup & Restore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-text-muted text-sm">
            Create a complete backup of all your data or restore from a previous backup.
          </p>
          <div className="flex gap-4">
            <Button onClick={handleExportAllData} variant="secondary" className="gap-2" isLoading={isLoading}>
              <Download className="w-4 h-4" />
              Backup All Data (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clear Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Clear Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">Warning: This action cannot be undone.</p>
            <p className="text-red-700 text-sm mt-1">
              Clearing session data will permanently delete all groups, students, sessions, and progress data.
            </p>
          </div>
          <Button
            onClick={() => setShowClearDataModal(true)}
            variant="danger"
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Session Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Session Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Session Defaults
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md">
            <Select
              label="Default Session Duration"
              value={localSessionDuration}
              onChange={e => setLocalSessionDuration(e.target.value)}
              options={[
                { value: '15', label: '15 minutes' },
                { value: '20', label: '20 minutes' },
                { value: '30', label: '30 minutes' },
                { value: '45', label: '45 minutes' },
                { value: '60', label: '60 minutes' },
              ]}
              helperText="Default duration for new intervention sessions"
            />
          </div>
          <Button onClick={handleSaveSessionDuration} className="gap-2" isLoading={isLoading}>
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* App Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            App Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-text-muted text-sm">
            For additional settings such as theme, notifications, and display preferences,
            visit the main{' '}
            <a href="/settings" className="text-movement hover:underline">
              Settings page
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Shield className="w-7 h-7 text-movement" />
              Admin Dashboard
            </h1>
            <p className="text-text-muted mt-1">
              Manage users, students, and system settings
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Tabs */}
        {renderTabs()}

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'assignments' && renderAssignments()}
        {activeTab === 'groups' && <GroupManagementTab />}
        {activeTab === 'data' && renderData()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={userForm.name}
            onChange={e => setUserForm({ ...userForm, name: e.target.value })}
            placeholder="Enter user name"
            disabled={isLoading}
          />
          <Input
            label="Email"
            type="email"
            value={userForm.email}
            onChange={e => setUserForm({ ...userForm, email: e.target.value })}
            placeholder="Enter email address"
            disabled={isLoading || !!editingUser} // Can't change email when editing
          />
          <Select
            label="Role"
            value={userForm.role}
            onChange={e => setUserForm({ ...userForm, role: e.target.value as User['role'], gradeLevel: '' })}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'interventionist', label: 'Interventionist' },
              { value: 'teacher', label: 'Teacher' },
            ]}
            disabled={isLoading}
          />
          {userForm.role === 'teacher' && (
            <Select
              label="Grade Level"
              value={userForm.gradeLevel}
              onChange={e => setUserForm({ ...userForm, gradeLevel: e.target.value as GradeLevel | '' })}
              options={[
                { value: '', label: 'Select grade level...' },
                ...GRADE_LEVEL_OPTIONS.map(g => ({ value: g, label: `Grade ${g}` })),
              ]}
              disabled={isLoading}
              helperText="Teachers can only see students in their assigned grade level"
            />
          )}
          {!editingUser && !isMockMode() && (
            <p className="text-sm text-text-muted">
              The user will receive an email to set their password.
            </p>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowUserModal(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} isLoading={isLoading}>
              {editingUser ? 'Update User' : 'Add User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Student Modal */}
      <Modal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={studentForm.name}
            onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
            placeholder="Enter student name"
          />
          <Select
            label="Assign to Group"
            value={studentForm.group_id}
            onChange={e => setStudentForm({ ...studentForm, group_id: e.target.value })}
            options={groups.map(g => ({ value: g.id, label: g.name }))}
            placeholder="Select a group"
          />
          <Input
            label="Notes (optional)"
            value={studentForm.notes}
            onChange={e => setStudentForm({ ...studentForm, notes: e.target.value })}
            placeholder="Any additional notes about this student"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowStudentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStudent} isLoading={isLoading}>
              {editingStudent ? 'Update Student' : 'Add Student'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete User Confirmation */}
      <ConfirmModal
        isOpen={showDeleteUserModal}
        onClose={() => setShowDeleteUserModal(false)}
        onConfirm={handleConfirmDeleteUser}
        title="Delete User?"
        message={`Are you sure you want to delete "${userToDelete?.name}"? This will remove them from the system and they will no longer be able to sign in.`}
        confirmText="Delete User"
        variant="danger"
        isLoading={isLoading}
      />

      {/* Delete Student Confirmation */}
      <ConfirmModal
        isOpen={showDeleteStudentModal}
        onClose={() => setShowDeleteStudentModal(false)}
        onConfirm={handleConfirmDeleteStudent}
        title="Delete Student?"
        message={`Are you sure you want to delete "${studentToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Student"
        variant="danger"
        isLoading={isLoading}
      />

      {/* Clear Data Confirmation */}
      <ConfirmModal
        isOpen={showClearDataModal}
        onClose={() => setShowClearDataModal(false)}
        onConfirm={handleClearSessionData}
        title="Clear All Data?"
        message="This will permanently delete all groups, students, sessions, and progress data. This action cannot be undone. Are you absolutely sure?"
        confirmText="Clear All Data"
        variant="danger"
        isLoading={isLoading}
      />
    </AppLayout>
  );
}
