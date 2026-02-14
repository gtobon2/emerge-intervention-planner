'use client';

import { useEffect, useState, useMemo } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
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
import { generateLetterPDF, getLetterContent } from '@/lib/letters';
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

export default function LettersPage() {
  const [students, setStudents] = useState<LocalStudent[]>([]);
  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const [pmData, setPmData] = useState<LocalProgressMonitoring[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
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

  // Find the selected student and their group
  const selectedStudent = useMemo(
    () => students.find((s) => String(s.id) === selectedStudentId) ?? null,
    [students, selectedStudentId]
  );

  const studentGroup = useMemo(
    () => (selectedStudent ? groups.find((g) => g.id === selectedStudent.group_id) ?? null : null),
    [selectedStudent, groups]
  );

  // Gather PM scores for this student
  const studentPmScores = useMemo(() => {
    if (!selectedStudent?.id) return [];
    return pmData
      .filter((p) => p.student_id === selectedStudent.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedStudent, pmData]);

  // Build LetterData
  const letterData: LetterData | null = useMemo(() => {
    if (!selectedStudent || !studentGroup) return null;

    const scores = studentPmScores.map((p) => ({ date: p.date, score: p.score }));
    const latestScore = scores.length > 0 ? scores[scores.length - 1].score : undefined;
    const firstScore = scores.length > 0 ? scores[0].score : undefined;
    const goal = studentPmScores.length > 0 ? (studentPmScores[0].goal ?? undefined) : undefined;

    // Calculate trend
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
      studentName: selectedStudent.name,
      studentGrade: studentGroup.grade,
      schoolName: schoolSettings.schoolName,
      curriculum: studentGroup.curriculum,
      curriculumLabel: getCurriculumLabel(studentGroup.curriculum as Curriculum),
      tier: studentGroup.tier,
      interventionistName: profile.displayName,
      interventionistContact: profile.email,
      date: new Date().toLocaleDateString(),
      schedule: studentGroup.schedule?.days
        ? studentGroup.schedule.days.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') +
          (studentGroup.schedule.time ? ` at ${studentGroup.schedule.time}` : '')
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
  }, [selectedStudent, studentGroup, studentPmScores, letterType, schoolSettings, profile, comments]);

  // Generate preview content
  const previewContent = useMemo(() => {
    if (!letterData) return null;
    try {
      return getLetterContent(letterData);
    } catch {
      return null;
    }
  }, [letterData]);

  const handleDownloadPDF = () => {
    if (letterData) {
      generateLetterPDF(letterData);
    }
  };

  const studentOptions = [
    { value: '', label: 'Select a student...' },
    ...students.map((s) => ({ value: String(s.id), label: s.name })),
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Student"
                options={studentOptions}
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={isLoading}
              />

              <Select
                label="Letter Type"
                options={LETTER_TYPE_OPTIONS}
                value={letterType}
                onChange={(e) => setLetterType(e.target.value as LetterType)}
              />
            </div>

            {/* Show detected group info */}
            {studentGroup && (
              <div className="p-3 bg-foundation rounded-lg text-sm">
                <span className="text-text-muted">Detected group: </span>
                <span className="font-medium text-text-primary">{studentGroup.name}</span>
                <span className="text-text-muted"> - </span>
                <span className="text-text-primary">
                  {getCurriculumLabel(studentGroup.curriculum as Curriculum)}, Tier {studentGroup.tier}, Grade {studentGroup.grade}
                </span>
              </div>
            )}

            {/* Comments for progress report */}
            {letterType === 'progress_report' && (
              <Textarea
                label="Interventionist Comments (optional)"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any additional observations or notes for the family..."
                rows={3}
              />
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleDownloadPDF}
                disabled={!letterData}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {previewContent && letterData && (
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

        {/* Empty state */}
        {!selectedStudentId && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-text-muted/30 mb-4" />
              <p className="text-text-muted">
                Select a student and letter type to preview and download a bilingual family letter.
              </p>
            </CardContent>
          </Card>
        )}

        {selectedStudentId && !studentGroup && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-text-muted">
                No group found for this student. Please assign the student to a group first.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
