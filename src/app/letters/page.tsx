'use client';

import { useEffect, useState, useMemo } from 'react';
import { FileText, Download, Eye, Users, User } from 'lucide-react';
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
import { db } from '@/lib/local-db';
import type { LocalStudent, LocalGroup, LocalProgressMonitoring } from '@/lib/local-db';
import { generateLetterPDF, generateBatchLetterPDF, getLetterContent } from '@/lib/letters';
import type { LetterType, LetterData } from '@/lib/letters';
import { useSettingsStore } from '@/stores/settings';
import { getCurriculumLabel } from '@/lib/supabase/types';
import type { Curriculum } from '@/lib/supabase/types';

const LETTER_TYPE_OPTIONS = [
  { value: 'assignment', label: 'Notice of Assignment' },
  { value: 'exit', label: 'Notice of Exit' },
  { value: 'intensification', label: 'Notice of Intensification' },
  { value: 'progress_report', label: 'Family Progress Report' },
];

type Mode = 'single' | 'batch';

export default function LettersPage() {
  const [students, setStudents] = useState<LocalStudent[]>([]);
  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const [pmData, setPmData] = useState<LocalProgressMonitoring[]>([]);
  const [mode, setMode] = useState<Mode>('single');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [letterType, setLetterType] = useState<LetterType>('assignment');
  const [comments, setComments] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { profile, schoolSettings } = useSettingsStore();

  // Load data from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const [allStudents, allGroups, allPm] = await Promise.all([
          db.students.toArray(),
          db.groups.toArray(),
          db.progressMonitoring.toArray(),
        ]);
        setStudents(allStudents);
        setGroups(allGroups);
        setPmData(allPm);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // --- Single mode ---
  const selectedStudent = useMemo(
    () => students.find((s) => String(s.id) === selectedStudentId) ?? null,
    [students, selectedStudentId]
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
    () => groups.find((g) => String(g.id) === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );

  const groupStudents = useMemo(
    () => (selectedGroupId ? students.filter((s) => String(s.group_id) === selectedGroupId) : []),
    [students, selectedGroupId]
  );

  // Build LetterData for a single student
  function buildLetterData(
    student: LocalStudent,
    group: LocalGroup,
    studentPm: LocalProgressMonitoring[]
  ): LetterData {
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
      interventionistName: profile.displayName,
      interventionistContact: profile.email,
      date: new Date().toLocaleDateString(),
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
  }

  // Single letter data
  const letterData: LetterData | null = useMemo(() => {
    if (mode !== 'single' || !selectedStudent || !studentGroup) return null;
    return buildLetterData(selectedStudent, studentGroup, studentPmScores);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedStudent, studentGroup, studentPmScores, letterType, schoolSettings, profile, comments]);

  // Batch letter data
  const batchLetterData: LetterData[] = useMemo(() => {
    if (mode !== 'batch' || !selectedGroup || groupStudents.length === 0) return [];
    return groupStudents.map((student) => {
      const studentPm = pmData.filter((p) => p.student_id === student.id);
      return buildLetterData(student, selectedGroup, studentPm);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedGroup, groupStudents, pmData, letterType, schoolSettings, profile, comments]);

  // Preview content (single mode only)
  const previewContent = useMemo(() => {
    if (!letterData) return null;
    try {
      return getLetterContent(letterData);
    } catch {
      return null;
    }
  }, [letterData]);

  const handleDownloadSingle = () => {
    if (letterData) {
      generateLetterPDF(letterData);
    }
  };

  const handleDownloadBatch = () => {
    if (batchLetterData.length > 0) {
      generateBatchLetterPDF(batchLetterData, selectedGroup?.name);
    }
  };

  const studentOptions = [
    { value: '', label: 'Select a student...' },
    ...students.map((s) => ({ value: String(s.id), label: s.name })),
  ];

  const groupOptions = [
    { value: '', label: 'Select a group...' },
    ...groups.map((g) => ({ value: String(g.id ?? ''), label: g.name })),
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
            <div className="flex gap-2">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mode === 'single' ? (
                <Select
                  label="Student"
                  options={studentOptions}
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={isLoading}
                />
              ) : (
                <Select
                  label="Group"
                  options={groupOptions}
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  disabled={isLoading}
                />
              )}

              <Select
                label="Letter Type"
                options={LETTER_TYPE_OPTIONS}
                value={letterType}
                onChange={(e) => setLetterType(e.target.value as LetterType)}
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

            {/* Batch student list */}
            {mode === 'batch' && groupStudents.length > 0 && (
              <div className="border border-border rounded-lg divide-y divide-border max-h-[200px] overflow-y-auto">
                {groupStudents.map((s) => (
                  <div key={s.id} className="px-4 py-2 text-sm text-text-primary">
                    {s.name}
                  </div>
                ))}
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
                  onClick={handleDownloadBatch}
                  disabled={batchLetterData.length === 0}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download All ({batchLetterData.length} letters)
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
        {mode === 'batch' && batchLetterData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-movement" />
                <CardTitle>Batch Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted mb-3">
                {batchLetterData.length} letter{batchLetterData.length !== 1 ? 's' : ''} will be generated — one per page in a single PDF.
              </p>
              <div className="border border-border rounded-lg divide-y divide-border">
                {batchLetterData.map((ld, i) => (
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
        {mode === 'single' && !selectedStudentId && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-text-muted/30 mb-4" />
              <p className="text-text-muted">
                Select a student and letter type to preview and download a bilingual family letter.
              </p>
            </CardContent>
          </Card>
        )}

        {mode === 'single' && selectedStudentId && !studentGroup && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-text-muted">
                No group found for this student. Please assign the student to a group first.
              </p>
            </CardContent>
          </Card>
        )}

        {mode === 'batch' && !selectedGroupId && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-text-muted/30 mb-4" />
              <p className="text-text-muted">
                Select a group and letter type to generate letters for all students at once.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
