'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, FileUp, Check, X, AlertTriangle, Download } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  parseCSV,
  detectColumnMapping,
  validateStudentData,
  findDuplicates,
  readFileAsText,
  downloadSampleCSV,
  type CSVRow,
  type ValidationError,
  type ValidatedStudent,
} from '@/lib/import-utils';
import type { Group, Student } from '@/lib/supabase/types';

export interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (students: ValidatedStudent[], groupId: string) => Promise<void>;
  groups: Group[];
  existingStudents: Student[];
  isLoading?: boolean;
}

type ImportStep = 'upload' | 'map' | 'validate' | 'import';

export function ImportStudentsModal({
  isOpen,
  onClose,
  onImport,
  groups,
  existingStudents,
  isLoading = false,
}: ImportStudentsModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCSVData] = useState<{ headers: string[]; rows: CSVRow[] } | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [validatedStudents, setValidatedStudents] = useState<ValidatedStudent[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('upload');
        setFile(null);
        setCSVData(null);
        setColumnMapping({});
        setSelectedGroupId('');
        setValidatedStudents([]);
        setValidationErrors([]);
        setImportSuccess(false);
      }, 300);
    }
  }, [isOpen]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    try {
      setFile(selectedFile);
      const text = await readFileAsText(selectedFile);
      const parsed = parseCSV(text);

      setCSVData({ headers: parsed.headers, rows: parsed.rows });

      // Auto-detect column mapping
      const autoMapping = detectColumnMapping(parsed.headers);
      setColumnMapping(autoMapping);

      setStep('map');
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read CSV file. Please make sure it is a valid CSV.');
    }
  };

  const handleColumnMappingChange = (csvColumn: string, standardField: string) => {
    setColumnMapping((prev) => {
      const newMapping = { ...prev };

      // Remove any existing mapping to this standard field
      Object.keys(newMapping).forEach((key) => {
        if (newMapping[key] === standardField) {
          delete newMapping[key];
        }
      });

      // Add new mapping
      if (standardField !== 'none') {
        newMapping[csvColumn] = standardField;
      }

      return newMapping;
    });
  };

  const handleValidate = () => {
    if (!csvData || !selectedGroupId) return;

    // Validate the data
    const result = validateStudentData(csvData.rows, columnMapping, selectedGroupId);

    // Set group_id for all valid students
    const studentsWithGroup = result.valid.map((student) => ({
      ...student,
      data: {
        ...student.data,
        group_id: selectedGroupId,
      },
    }));

    // Check for duplicates
    const duplicateErrors = findDuplicates(studentsWithGroup, existingStudents);

    setValidatedStudents(studentsWithGroup);
    setValidationErrors([...result.errors, ...duplicateErrors]);
    setStep('validate');
  };

  const handleImport = async () => {
    if (validatedStudents.length === 0 || !selectedGroupId) return;

    try {
      await onImport(validatedStudents, selectedGroupId);
      setImportSuccess(true);

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleBack = () => {
    if (step === 'map') {
      setStep('upload');
      setFile(null);
      setCSVData(null);
    } else if (step === 'validate') {
      setStep('map');
    }
  };

  const groupOptions = groups.map((group) => ({
    value: group.id,
    label: group.name,
  }));

  const fieldOptions = [
    { value: 'none', label: '(Ignore this column)' },
    { value: 'name', label: 'Student Name' },
    { value: 'grade', label: 'Grade' },
    { value: 'notes', label: 'Notes' },
    { value: 'group_name', label: 'Group Name (not used)' },
  ];

  const hasRequiredMappings = Object.values(columnMapping).includes('name');
  const canProceedToValidate = hasRequiredMappings && selectedGroupId;

  // Preview rows (first 10)
  const previewRows = csvData?.rows.slice(0, 10) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Students from CSV"
      size="xl"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {importSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>Successfully imported {validatedStudents.length} students!</span>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            {/* Sample Template Download */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">Need a template?</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Download our sample CSV template to see the correct format.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={downloadSampleCSV}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-all
                ${isDragging
                  ? 'border-movement bg-movement/5'
                  : 'border-text-muted/30 hover:border-movement/50 hover:bg-foundation/50'
                }
              `}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-text-muted" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Drop CSV file here or click to browse
              </h3>
              <p className="text-text-muted mb-4">
                Accepts .csv files only
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="csv-upload"
              />
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={() => document.getElementById('csv-upload')?.click()}
              >
                <FileUp className="w-4 h-4" />
                Select CSV File
              </Button>
            </div>

            {/* File Format Info */}
            <div className="text-sm text-text-muted space-y-1">
              <p className="font-medium">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>First row must contain column headers</li>
                <li>Required column: name (or student_name, student name, etc.)</li>
                <li>Optional columns: grade, notes, group_name</li>
                <li>Supports comma, semicolon, or tab delimiters</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'map' && csvData && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">File loaded:</span> {file?.name} ({csvData.rows.length} rows)
              </p>
            </div>

            {/* Group Selection */}
            <div>
              <Select
                label="Import students to which group?"
                options={groupOptions}
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                required
              />
              <p className="text-xs text-text-muted mt-1">
                All imported students will be added to this group
              </p>
            </div>

            {/* Column Mapping */}
            <div>
              <h3 className="font-medium text-text-primary mb-3">Map CSV Columns</h3>
              <div className="space-y-2">
                {csvData.headers.map((header) => (
                  <div key={header} className="flex items-center gap-3">
                    <div className="flex-1 text-sm font-medium text-text-primary">
                      {header}
                    </div>
                    <div className="w-48">
                      <Select
                        options={fieldOptions}
                        value={columnMapping[header] || 'none'}
                        onChange={(e) => handleColumnMappingChange(header, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {!hasRequiredMappings && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Please map at least one column to "Student Name"</span>
                </div>
              )}
            </div>

            {/* Data Preview */}
            <div>
              <h3 className="font-medium text-text-primary mb-3">
                Preview (first {Math.min(10, csvData.rows.length)} rows)
              </h3>
              <div className="border border-text-muted/20 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface">
                      <tr>
                        {csvData.headers.map((header) => (
                          <th
                            key={header}
                            className="px-3 py-2 text-left font-medium text-text-primary border-b border-text-muted/20"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, index) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? 'bg-foundation' : 'bg-surface/50'}
                        >
                          {csvData.headers.map((header) => (
                            <td
                              key={header}
                              className="px-3 py-2 text-text-primary border-b border-text-muted/10"
                            >
                              {row[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-between pt-4 border-t border-text-muted/10">
              <Button type="button" variant="ghost" onClick={handleBack}>
                Back
              </Button>
              <Button
                type="button"
                onClick={handleValidate}
                disabled={!canProceedToValidate}
                className="gap-2"
              >
                Validate Data
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Validation Results */}
        {step === 'validate' && (
          <div className="space-y-4">
            {/* Validation Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Valid Students</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {validatedStudents.length}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <X className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-900">Errors</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {validationErrors.length}
                </p>
              </div>
            </div>

            {/* Errors List */}
            {validationErrors.length > 0 && (
              <div className="border border-red-200 rounded-lg overflow-hidden">
                <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                  <h3 className="font-medium text-red-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Validation Errors
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    The following rows have errors and will not be imported:
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-red-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-red-900 border-b border-red-200">
                          Row
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-red-900 border-b border-red-200">
                          Field
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-red-900 border-b border-red-200">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationErrors.map((error, index) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-red-50/30'}
                        >
                          <td className="px-3 py-2 text-red-900 border-b border-red-100">
                            {error.row}
                          </td>
                          <td className="px-3 py-2 text-red-900 border-b border-red-100">
                            {error.field}
                          </td>
                          <td className="px-3 py-2 text-red-800 border-b border-red-100">
                            {error.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Valid Students Preview */}
            {validatedStudents.length > 0 && (
              <div className="border border-green-200 rounded-lg overflow-hidden">
                <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                  <h3 className="font-medium text-green-900">
                    Students Ready to Import ({validatedStudents.length})
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-green-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-green-900 border-b border-green-200">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-green-900 border-b border-green-200">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {validatedStudents.slice(0, 20).map((student, index) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-green-50/30'}
                        >
                          <td className="px-3 py-2 text-text-primary border-b border-green-100">
                            {student.data.name}
                          </td>
                          <td className="px-3 py-2 text-text-muted border-b border-green-100">
                            {student.data.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {validatedStudents.length > 20 && (
                    <div className="px-3 py-2 text-sm text-text-muted bg-green-50/30 border-t border-green-100">
                      And {validatedStudents.length - 20} more...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-between pt-4 border-t border-text-muted/10">
              <Button type="button" variant="ghost" onClick={handleBack}>
                Back
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={validatedStudents.length === 0}
                isLoading={isLoading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Import {validatedStudents.length} Students
              </Button>
            </div>
          </div>
        )}

        {/* Cancel Button (bottom of modal for upload step) */}
        {step === 'upload' && (
          <div className="flex justify-end pt-4 border-t border-text-muted/10">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
