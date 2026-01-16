'use client';

import { useEffect, useState, useMemo } from 'react';
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
} from 'lucide-react';
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
import { useGroupsStore } from '@/stores/groups';
import { useStudentsStore } from '@/stores/students';
import { useSessionsStore } from '@/stores/sessions';
import { useSettings } from '@/hooks/use-settings';
import { exportToFile, clearAllData } from '@/lib/local-db/backup';
import type { Group, Student, SessionWithGroup } from '@/lib/supabase/types';

// ============================================
// TYPES
// ============================================

type AdminTab = 'overview' | 'users' | 'students' | 'data' | 'settings';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'interventionist' | 'teacher';
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
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

  // Local state for users (simulated - would be from Supabase in production)
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@school.edu',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  ]);

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
  });
  const [studentForm, setStudentForm] = useState({
    name: '',
    notes: '',
    group_id: '',
  });

  // Settings state
  const [localSessionDuration, setLocalSessionDuration] = useState(sessionDefaults.defaultDuration.toString());

  // Fetch data on mount
  useEffect(() => {
    fetchGroups();
    fetchAllStudents();
    fetchAllSessions();
  }, [fetchGroups, fetchAllStudents, fetchAllSessions]);

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
    setUserForm({ name: '', email: '', role: 'interventionist' });
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({ name: user.name, email: user.email, role: user.role });
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      setErrorMessage('Name and email are required');
      return;
    }

    if (editingUser) {
      setUsers(prev =>
        prev.map(u =>
          u.id === editingUser.id
            ? { ...u, ...userForm, updatedAt: new Date().toISOString(), updatedBy: 'admin' }
            : u
        )
      );
      setSuccessMessage('User updated successfully');
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        ...userForm,
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
      };
      setUsers(prev => [...prev, newUser]);
      setSuccessMessage('User added successfully');
    }

    setShowUserModal(false);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteUserModal(true);
  };

  const handleConfirmDeleteUser = () => {
    if (userToDelete) {
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setSuccessMessage('User deleted successfully');
      setShowDeleteUserModal(false);
      setUserToDelete(null);
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
      <nav className="-mb-px flex space-x-8">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'students', label: 'Students', icon: GraduationCap },
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
        <Button onClick={handleAddUser} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {filteredUsers.length === 0 ? (
            <p className="text-text-muted text-center py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Role</th>
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
          />
          <Input
            label="Email"
            type="email"
            value={userForm.email}
            onChange={e => setUserForm({ ...userForm, email: e.target.value })}
            placeholder="Enter email address"
          />
          <Select
            label="Role"
            value={userForm.role}
            onChange={e => setUserForm({ ...userForm, role: e.target.value as User['role'] })}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'interventionist', label: 'Interventionist' },
              { value: 'teacher', label: 'Teacher' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowUserModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
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
        message={`Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete User"
        variant="danger"
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
