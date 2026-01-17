'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, TrendingUp, TrendingDown, Minus, Users, Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StudentWithGroup } from '@/hooks/use-all-students';
import type { ProgressMonitoring, SessionAttendance, AttendanceStatus } from '@/lib/supabase/types';
import { formatCurriculumPosition, getCurriculumLabel, getTierLabel } from '@/lib/supabase/types';
import { useAttendanceStore } from '@/stores/attendance';

export interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentWithGroup | null;
  progressData?: ProgressMonitoring[];
  onEdit: (student: StudentWithGroup) => void;
  onDelete: (student: StudentWithGroup) => void;
}

// Get attendance status icon and color
function getAttendanceIcon(status: AttendanceStatus) {
  switch (status) {
    case 'present':
      return { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Present' };
    case 'absent':
      return { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Absent' };
    case 'tardy':
      return { icon: Clock, color: 'text-amber-600 bg-amber-100', label: 'Tardy' };
    case 'excused':
      return { icon: AlertCircle, color: 'text-blue-600 bg-blue-100', label: 'Excused' };
    default:
      return { icon: AlertCircle, color: 'text-gray-600 bg-gray-100', label: 'Unknown' };
  }
}

export function StudentModal({
  isOpen,
  onClose,
  student,
  progressData = [],
  onEdit,
  onDelete,
}: StudentModalProps) {
  // Attendance store
  const {
    studentAttendanceHistory,
    studentStats,
    fetchAttendanceForStudent,
    fetchStudentStats,
    isLoading: attendanceLoading,
  } = useAttendanceStore();

  // Fetch attendance data when student changes
  useEffect(() => {
    if (student && isOpen) {
      fetchAttendanceForStudent(student.id);
      fetchStudentStats(student.id);
    }
  }, [student?.id, isOpen, fetchAttendanceForStudent, fetchStudentStats]);

  if (!student) return null;

  // Calculate PM score trend
  const calculateTrend = () => {
    if (!progressData || progressData.length < 2) return null;

    const sorted = [...progressData].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const recent = sorted.slice(-3);
    if (recent.length < 2) return null;

    const firstScore = recent[0].score;
    const lastScore = recent[recent.length - 1].score;
    const change = lastScore - firstScore;
    const changePercent = ((change / firstScore) * 100).toFixed(1);

    if (change > 0) {
      return { type: 'improving', change, changePercent };
    } else if (change < 0) {
      return { type: 'declining', change, changePercent };
    } else {
      return { type: 'flat', change: 0, changePercent: '0.0' };
    }
  };

  const trend = calculateTrend();
  const latestScore = progressData.length > 0
    ? [...progressData].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
    : null;

  const handleEdit = () => {
    onEdit(student);
    onClose();
  };

  const handleDelete = () => {
    onDelete(student);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Student Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {student.name}
            </h2>
            {student.notes && (
              <p className="text-text-muted whitespace-pre-wrap">
                {student.notes}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="gap-1"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Group Information */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-text-muted" />
              <h3 className="font-semibold text-text-primary">Group Assignment</h3>
            </div>
            {student.group ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-medium text-text-primary">
                    {student.group.name}
                  </span>
                  <Badge variant="tier" tier={student.group.tier}>
                    {getTierLabel(student.group.tier)}
                  </Badge>
                  <Badge>
                    Grade {student.group.grade}
                  </Badge>
                </div>
                <div className="text-sm text-text-muted">
                  <div><strong>Curriculum:</strong> {getCurriculumLabel(student.group.curriculum)}</div>
                  <div><strong>Current Position:</strong> {formatCurriculumPosition(student.group.curriculum, student.group.current_position)}</div>
                </div>
              </div>
            ) : (
              <p className="text-text-muted">Not assigned to a group</p>
            )}
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-text-muted" />
              <h3 className="font-semibold text-text-primary">Session Attendance</h3>
            </div>

            {attendanceLoading ? (
              <div className="text-center py-4">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent text-text-muted" />
                <p className="text-sm text-text-muted mt-2">Loading attendance...</p>
              </div>
            ) : studentStats ? (
              <div className="space-y-4">
                {/* Attendance Rate */}
                <div className="bg-surface p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-muted">Attendance Rate</span>
                    <span className={`text-2xl font-bold ${
                      studentStats.attendanceRate >= 90 ? 'text-green-600' :
                      studentStats.attendanceRate >= 80 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {studentStats.attendanceRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        studentStats.attendanceRate >= 90 ? 'bg-green-600' :
                        studentStats.attendanceRate >= 80 ? 'bg-amber-600' :
                        'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(studentStats.attendanceRate, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Attendance Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">Present</span>
                    </div>
                    <div className="text-xl font-bold text-green-600 mt-1">{studentStats.present}</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700">Absent</span>
                    </div>
                    <div className="text-xl font-bold text-red-600 mt-1">{studentStats.absent}</div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-700">Tardy</span>
                    </div>
                    <div className="text-xl font-bold text-amber-600 mt-1">{studentStats.tardy}</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">Excused</span>
                    </div>
                    <div className="text-xl font-bold text-blue-600 mt-1">{studentStats.excused}</div>
                  </div>
                </div>

                <div className="text-sm text-text-muted">
                  <strong>{studentStats.total}</strong> intervention session{studentStats.total !== 1 ? 's' : ''} tracked
                </div>

                {/* Recent Attendance History */}
                {studentAttendanceHistory.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-text-primary mb-2">Recent Sessions</div>
                    <div className="space-y-2">
                      {[...studentAttendanceHistory]
                        .sort((a, b) => new Date(b.marked_at).getTime() - new Date(a.marked_at).getTime())
                        .slice(0, 5)
                        .map((attendance) => {
                          const statusInfo = getAttendanceIcon(attendance.status);
                          const StatusIcon = statusInfo.icon;
                          return (
                            <div
                              key={attendance.id}
                              className="flex items-center justify-between py-2 border-b border-text-muted/10 last:border-0"
                            >
                              <span className="text-sm text-text-muted">
                                {new Date(attendance.marked_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-text-muted text-center py-4">
                No attendance data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Progress Monitoring Summary */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              {trend?.type === 'improving' && <TrendingUp className="w-5 h-5 text-green-600" />}
              {trend?.type === 'declining' && <TrendingDown className="w-5 h-5 text-red-600" />}
              {trend?.type === 'flat' && <Minus className="w-5 h-5 text-text-muted" />}
              Progress Monitoring Summary
            </h3>

            {progressData.length > 0 ? (
              <div className="space-y-4">
                {/* Latest Score */}
                {latestScore && (
                  <div className="bg-surface p-4 rounded-lg">
                    <div className="text-sm text-text-muted mb-1">Latest Score</div>
                    <div className="text-3xl font-bold text-text-primary">
                      {latestScore.score}
                    </div>
                    <div className="text-sm text-text-muted">
                      {new Date(latestScore.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    {latestScore.measure_type && (
                      <div className="text-sm text-text-muted mt-1">
                        {latestScore.measure_type}
                      </div>
                    )}
                  </div>
                )}

                {/* Trend Information */}
                {trend && (
                  <div className="bg-surface p-4 rounded-lg">
                    <div className="text-sm text-text-muted mb-1">Recent Trend</div>
                    <div className="flex items-center gap-2">
                      <div className={`text-2xl font-bold ${
                        trend.type === 'improving' ? 'text-green-600' :
                        trend.type === 'declining' ? 'text-red-600' :
                        'text-text-muted'
                      }`}>
                        {trend.type === 'improving' && '+'}
                        {trend.change}
                      </div>
                      <div className={`text-sm ${
                        trend.type === 'improving' ? 'text-green-600' :
                        trend.type === 'declining' ? 'text-red-600' :
                        'text-text-muted'
                      }`}>
                        ({trend.changePercent}%)
                      </div>
                    </div>
                    <div className="text-sm text-text-muted mt-1">
                      Based on last 3 data points
                    </div>
                  </div>
                )}

                {/* Data Points Count */}
                <div className="text-sm text-text-muted">
                  <strong>{progressData.length}</strong> data point{progressData.length !== 1 ? 's' : ''} recorded
                </div>

                {/* Recent History */}
                <div>
                  <div className="text-sm font-medium text-text-primary mb-2">Recent History</div>
                  <div className="space-y-2">
                    {[...progressData]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((pm) => (
                        <div
                          key={pm.id}
                          className="flex items-center justify-between py-2 border-b border-text-muted/10 last:border-0"
                        >
                          <span className="text-sm text-text-muted">
                            {new Date(pm.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="text-sm font-medium text-text-primary">
                            {pm.score}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-text-muted text-center py-8">
                No progress monitoring data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-text-muted/10">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
