'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { FileText, Download, Eye, Users, User, Printer } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Select,
  Textarea,
} from '@/components/ui';
import { getLetterContent } from '@/lib/letters/templates';
import type { LetterType, LetterData } from '@/lib/letters';
import { useSettingsStore } from '@/stores/settings';
import { useGroupsStore } from '@/stores/groups';
import { useStudentsStore } from '@/stores/students';
import { getCurriculumLabel } from '@/lib/supabase/types';
import type { Curriculum, Group, Student, ProgressMonitoring } from '@/lib/supabase/types';
import { Input } from '@/components/ui';
import * as supabaseService from '@/lib/supabase/services';

const LETTER_TYPE_OPTIONS = [
  { value: 'assignment', label: 'Notice of Assignment' },
  { value: 'exit', label: 'Notice of Exit' },
  { value: 'intensification', label: 'Notice of Intensification' },
  { value: 'progress_report', label: 'Family Progress Report' },
];

type Mode = 'single' | 'batch' | 'all';

export default function LettersPage() {
  const [mode, setMode] = useState<Mode>('single');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [letterType, setLetterType] = useState<LetterType>('assignment');
  const [comments, setComments] = useState('');
  const [letterDate, setLetterDate] = useState(new Date().toISOString().split('T')[0]);
  const [signatureName, setSignatureName] = useState('');
  const [pmData, setPmData] = useState<ProgressMonitoring[]>([]);
  const [pmLoading, setPmLoading] = useState(false);

  // Stores
  const { profile, schoolSettings } = useSettingsStore();
  const groups = useGroupsStore(s => s.groups);
  const fetchGroups = useGroupsStore(s => s.fetchGroups);
  const allStudents = useStudentsStore(s => s.allStudents);
  const fetchAllStudents = useStudentsStore(s => s.fetchAllStudents);

  // Load groups + students on mount
  useEffect(() => {
    fetchGroups();
    fetchAllStudents();
  }, [fetchGroups, fetchAllStudents]);

  // Default signature name from profile
  useEffect(() => {
    if (profile.displayName && !signatureName) {
      setSignatureName(profile.displayName);
    }
  }, [profile.displayName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch PM data when group or mode changes
  useEffect(() => {
    if (mode === 'single' && selectedStudentId) {
      setPmLoading(true);
      supabaseService.fetchProgressByStudentId(selectedStudentId)
        .then(setPmData)
        .catch(() => setPmData([]))
        .finally(() => setPmLoading(false));
    } else if (mode === 'batch' && selectedGroupId) {
      setPmLoading(true);
      supabaseService.fetchProgressByGroupId(selectedGroupId)
        .then(setPmData)
        .catch(() => setPmData([]))
        .finally(() => setPmLoading(false));
    } else if (mode === 'all') {
      // Fetch PM data for all groups
      setPmLoading(true);
      Promise.all(groups.map(g => supabaseService.fetchProgressByGroupId(g.id)))
        .then(results => setPmData(results.flat()))
        .catch(() => setPmData([]))
        .finally(() => setPmLoading(false));
    }
  }, [mode, selectedStudentId, selectedGroupId, groups]);

  // --- Single mode ---
  const selectedStudent = useMemo(
    () => allStudents.find((s) => s.id === selectedStudentId) ?? null,
    [allStudents, selectedStudentId]
  );

  const studentGroup = useMemo(
    () => (selectedStudent ? groups.find((g) => g.id === selectedStudent.group_id) ?? null : null),
    [selectedStudent, groups]
  );

  const studentPmScores = useMemo(() => {
    if (!selectedStudent?.id) return [];
    return pmData
      .filter((p) => p.student_id === selectedStudent.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedStudent, pmData]);

  // --- Batch mode ---
  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );

  const groupStudents = useMemo(
    () => (selectedGroupId ? allStudents.filter((s) => s.group_id === selectedGroupId) : []),
    [allStudents, selectedGroupId]
  );

  // Build LetterData for a single student
  const buildLetterData = useCallback((
    student: Student,
    group: Group,
    studentPm: ProgressMonitoring[]
  ): LetterData => {
    const scores = studentPm
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({ date: p.date, score: p.score }));
    const latestScore = scores.length > 0 ? scores[scores.length - 1].score : undefined;
    const firstScore = scores.length > 0 ? scores[0].score : undefined;
    const goal = studentPm.length > 0 ? (studentPm[0].goal ?? undefined) : undefined;

    let trend: 'improving' | 'stable' | 'declining' | undefined;
    if (scores.length >= 2) {
      const half = Math.floor(scores.length / 2);
      const firstHalf = scores.slice(0, half);
      const secondHalf = scores.slice(half);
      const avgFirst = firstHalf.reduce((s, p) => s + p.score, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((s, p) => s + p.score, 0) / secondHalf.length;
      if (avgSecond > avgFirst + 2) trend = 'improving';
      else if (avgSecond < avgFirst - 2) trend = 'declining';
      else trend = 'stable';
    }

    return {
      type: letterType,
      studentName: student.name,
      studentGrade: group.grade,
      schoolName: schoolSettings.schoolName,
      curriculum: group.curriculum,
      curriculumLabel: getCurriculumLabel(group.curriculum as Curriculum),
      tier: group.tier,
      interventionistName: signatureName || profile.displayName,
      interventionistContact: profile.email,
      date: new Date(letterDate + 'T12:00:00').toLocaleDateString(),
      schedule: group.schedule?.days
        ? group.schedule.days.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') +
          (group.schedule.time ? ` at ${group.schedule.time}` : '')
        : undefined,
      startScore: firstScore,
      endScore: latestScore,
      growth: firstScore != null && latestScore != null ? latestScore - firstScore : undefined,
      currentScore: latestScore,
      goal,
      pmScores: scores.length > 0 ? scores : undefined,
      trend,
      comments: comments || undefined,
    };
  }, [letterType, schoolSettings, profile, comments, signatureName, letterDate]);

  // Single letter data
  const letterData: LetterData | null = useMemo(() => {
    if (mode !== 'single' || !selectedStudent || !studentGroup) return null;
    return buildLetterData(selectedStudent, studentGroup, studentPmScores);
  }, [mode, selectedStudent, studentGroup, studentPmScores, buildLetterData]);

  // Batch letter data (by group)
  const batchLetterData: LetterData[] = useMemo(() => {
    if (mode !== 'batch' || !selectedGroup || groupStudents.length === 0) return [];
    return groupStudents.map((student) => {
      const studentPm = pmData.filter((p) => p.student_id === student.id);
      return buildLetterData(student, selectedGroup, studentPm);
    });
  }, [mode, selectedGroup, groupStudents, pmData, buildLetterData]);

  // All-students letter data
  const allLetterData: LetterData[] = useMemo(() => {
    if (mode !== 'all' || allStudents.length === 0) return [];
    return allStudents
      .map((student) => {
        const group = groups.find((g) => g.id === student.group_id);
        if (!group) return null;
        const studentPm = pmData.filter((p) => p.student_id === student.id);
        return buildLetterData(student, group, studentPm);
      })
      .filter(Boolean) as LetterData[];
  }, [mode, allStudents, groups, pmData, buildLetterData]);

  // Preview content (single mode only)
  const previewContent = useMemo(() => {
    if (!letterData) return null;
    try {
      return getLetterContent(letterData);
    } catch {
      return null;
    }
  }, [letterData]);

  const handleDownloadSingle = async () => {
    if (letterData) {
      const { generateLetterPDF } = await import('@/lib/letters/pdf-generator');
      generateLetterPDF(letterData);
    }
  };

  const handleDownloadBatch = async () => {
    if (batchLetterData.length > 0) {
      const { generateBatchLetterPDF } = await import('@/lib/letters/pdf-generator');
      generateBatchLetterPDF(batchLetterData, selectedGroup?.name);
    }
  };

  const handleDownloadAll = async () => {
    if (allLetterData.length > 0) {
      const { generateBatchLetterPDF } = await import('@/lib/letters/pdf-generator');
      generateBatchLetterPDF(allLetterData, 'all-students');
    }
  };

  // Active data for the current mode
  const activeBatchData = mode === 'batch' ? batchLetterData : mode === 'all' ? allLetterData : [];
  const activeBatchStudents = mode === 'batch' ? groupStudents : mode === 'all' ? allStudents : [];

  const studentOptions = [
    { value: '', label: 'Select a student...' },
    ...allStudents.map((s) => ({ value: s.id, label: s.name })),
  ];

  const groupOptions = [
    { value: '', label: 'Select a group...' },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Family Letters</h1>
            <p className="text-text-muted mt-1">
              Generate bilingual letters for families in English and Spanish
            </p>
          </div>
          <FileText className="w-8 h-8 text-movement" />
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Letter Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setMode('single')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'single'
                    ? 'bg-movement text-white'
                    : 'bg-surface text-text-muted hover:text-text-primary border border-border'
                }`}
              >
                <User className="w-4 h-4" />
                Single Student
              </button>
              <button
                onClick={() => setMode('batch')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'batch'
                    ? 'bg-movement text-white'
                    : 'bg-surface text-text-muted hover:text-text-primary border border-border'
                }`}
              >
                <Users className="w-4 h-4" />
                Batch by Group
              </button>
              <button
                onClick={() => setMode('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'all'
                    ? 'bg-movement text-white'
                    : 'bg-surface text-text-muted hover:text-text-primary border border-border'
                }`}
              >
                <Printer className="w-4 h-4" />
                All Students
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mode === 'single' ? (
                <Select
                  label="Student"
                  options={studentOptions}
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                />
              ) : mode === 'batch' ? (
                <Select
                  label="Group"
                  options={groupOptions}
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                />
              ) : (
                <div className="flex items-end">
                  <p className="text-sm text-text-muted pb-2">
                    Letters will be generated for all {allStudents.length} students across {groups.length} groups.
                  </p>
                </div>
              )}

              <Select
                label="Letter Type"
                options={LETTER_TYPE_OPTIONS}
                value={letterType}
                onChange={(e) => setLetterType(e.target.value as LetterType)}
              />
            </div>

            {/* Customization: date + signature */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Letter Date"
                type="date"
                value={letterDate}
                onChange={(e) => setLetterDate(e.target.value)}
              />
              <Input
                label="Signature Name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder={profile.displayName || 'Your name'}
              />
            </div>

            {/* Show detected group info (single) */}
            {mode === 'single' && studentGroup && (
              <div className="p-3 bg-foundation rounded-lg text-sm">
                <span className="text-text-muted">Detected group: </span>
                <span className="font-medium text-text-primary">{studentGroup.name}</span>
                <span className="text-text-muted"> - </span>
                <span className="text-text-primary">
                  {getCurriculumLabel(studentGroup.curriculum as Curriculum)}, Tier {studentGroup.tier}, Grade {studentGroup.grade}
                </span>
              </div>
            )}

            {/* Show batch info */}
            {mode === 'batch' && selectedGroup && (
              <div className="p-3 bg-foundation rounded-lg text-sm">
                <span className="text-text-muted">Group: </span>
                <span className="font-medium text-text-primary">{selectedGroup.name}</span>
                <span className="text-text-muted"> - </span>
                <span className="text-text-primary">
                  {getCurriculumLabel(selectedGroup.curriculum as Curriculum)}, Tier {selectedGroup.tier}, Grade {selectedGroup.grade}
                </span>
                <span className="text-text-muted ml-2">
                  ({groupStudents.length} student{groupStudents.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Student list for batch/all modes */}
            {(mode === 'batch' ? groupStudents.length > 0 : mode === 'all' && allStudents.length > 0) && (
              <div className="border border-border rounded-lg divide-y divide-border max-h-[200px] overflow-y-auto">
                {activeBatchStudents.map((s) => {
                  const group = groups.find((g) => g.id === s.group_id);
                  return (
                    <div key={s.id} className="px-4 py-2 text-sm text-text-primary flex justify-between">
                      <span>{s.name}</span>
                      {mode === 'all' && group && (
                        <span className="text-text-muted text-xs">{group.name}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Comments for progress report */}
            {letterType === 'progress_report' && (
              <Textarea
                label="Interventionist Comments (optional — applied to all letters)"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any additional observations or notes for the family..."
                rows={3}
              />
            )}

            <div className="flex justify-end">
              {mode === 'single' ? (
                <Button
                  onClick={handleDownloadSingle}
                  disabled={!letterData}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              ) : (
                <Button
                  onClick={mode === 'batch' ? handleDownloadBatch : handleDownloadAll}
                  disabled={activeBatchData.length === 0 || pmLoading}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download All ({activeBatchData.length} letters)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview (single mode) */}
        {mode === 'single' && previewContent && letterData && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-movement" />
                <CardTitle>Letter Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg p-6 bg-white dark:bg-gray-900 space-y-6">
                {/* English section */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-lg font-bold text-pink-500">{letterData.schoolName}</h2>
                    <p className="text-sm text-text-muted">{letterData.date}</p>
                  </div>
                  <h3 className="font-bold text-text-primary">{previewContent.titleEn}</h3>
                  {previewContent.paragraphsEn.map((p, i) => (
                    <p key={`en-${i}`} className="text-sm text-text-primary leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t-2 border-pink-300 my-6" />

                {/* Spanish section */}
                <div className="space-y-4">
                  <p className="text-center text-sm font-bold text-pink-500">
                    --- Traduccion al Espanol ---
                  </p>
                  <h3 className="font-bold text-text-primary">{previewContent.titleEs}</h3>
                  {previewContent.paragraphsEs.map((p, i) => (
                    <p key={`es-${i}`} className="text-sm text-text-primary leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>

                {/* Signature */}
                <div className="pt-6 space-y-2">
                  <p className="text-sm text-text-primary">Sincerely / Atentamente,</p>
                  <p className="text-sm font-bold text-text-primary">{letterData.interventionistName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Batch preview summary */}
        {(mode === 'batch' || mode === 'all') && activeBatchData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-movement" />
                <CardTitle>Batch Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted mb-3">
                {activeBatchData.length} letter{activeBatchData.length !== 1 ? 's' : ''} will be generated — one per page in a single PDF.
              </p>
              <div className="border border-border rounded-lg divide-y divide-border max-h-[300px] overflow-y-auto">
                {activeBatchData.map((ld, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{ld.studentName}</p>
                      <p className="text-xs text-text-muted">
                        Grade {ld.studentGrade} - {ld.curriculumLabel}
                        {ld.currentScore != null && ` - Current score: ${ld.currentScore}`}
                      </p>
                    </div>
                    <span className="text-xs text-text-muted capitalize">
                      {ld.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty states */}
        {mode === 'single' && !selectedStudentId && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-text-muted/30 mb-4" />
              <p className="text-text-muted">
                Select a student and letter type to preview and download a bilingual family letter.
              </p>
            </CardContent>
          </Card>
        )}

        {mode === 'single' && selectedStudentId && !studentGroup && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-text-muted">
                No group found for this student. Please assign the student to a group first.
              </p>
            </CardContent>
          </Card>
        )}

        {mode === 'batch' && !selectedGroupId && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-text-muted/30 mb-4" />
              <p className="text-text-muted">
                Select a group and letter type to generate letters for all students in that group.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
