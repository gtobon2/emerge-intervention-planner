'use client';

import { useState } from 'react';
import { Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Student } from '@/lib/supabase/types';

export interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function StudentList({ 
  students, 
  onEdit, 
  onDelete,
  canEdit = true,
  canDelete = true,
}: StudentListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (students.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {students.map((student) => {
        const isExpanded = expandedIds.has(student.id);
        const hasNotes = student.notes && student.notes.trim().length > 0;
        const notesPreview = hasNotes
          ? student.notes!.length > 80
            ? student.notes!.slice(0, 80) + '...'
            : student.notes
          : null;

        return (
          <div
            key={student.id}
            className="bg-foundation rounded-lg border border-text-muted/10 hover:border-text-muted/20 transition-colors"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-text-primary mb-1">
                    {student.name}
                  </h4>
                  {hasNotes && !isExpanded && (
                    <p className="text-sm text-text-muted line-clamp-2">
                      {notesPreview}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasNotes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(student.id)}
                      className="gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          More
                        </>
                      )}
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(student)}
                      className="gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(student)}
                      className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              {isExpanded && hasNotes && (
                <div className="mt-3 pt-3 border-t border-text-muted/10">
                  <p className="text-sm text-text-muted whitespace-pre-wrap">
                    {student.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
