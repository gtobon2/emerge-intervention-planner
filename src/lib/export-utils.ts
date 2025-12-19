/**
 * Export utilities for generating CSV files from report data
 */

/**
 * Converts an array of objects to CSV format
 * @param data Array of objects to convert
 * @param headers Optional custom headers (uses object keys if not provided)
 * @returns CSV string
 */
export function convertToCSV(
  data: Record<string, any>[],
  headers?: Record<string, string>
): string {
  if (data.length === 0) {
    return '';
  }

  // Get headers from first object or use provided headers
  const keys = Object.keys(data[0]);
  const headerRow = headers
    ? keys.map((key) => headers[key] || key)
    : keys;

  // Create CSV header row
  const csvRows = [headerRow.join(',')];

  // Add data rows
  for (const row of data) {
    const values = keys.map((key) => {
      const value = row[key];

      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }

      // Handle arrays/objects by stringifying
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }

      // Escape strings containing commas, quotes, or newlines
      const stringValue = String(value);
      if (
        stringValue.includes(',') ||
        stringValue.includes('"') ||
        stringValue.includes('\n')
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    });

    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Triggers a download of CSV data
 * @param csvData CSV string data
 * @param filename Name for the downloaded file
 */
export function downloadCSV(csvData: string, filename: string): void {
  // Add .csv extension if not present
  const fullFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  // Create blob with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fullFilename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Formats a date for display in reports
 */
export function formatReportDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a date for CSV export (sortable format)
 */
export function formatCSVDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Generates a filename with timestamp
 */
export function generateTimestampedFilename(baseName: string): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '');
  return `${baseName}_${timestamp}`;
}
