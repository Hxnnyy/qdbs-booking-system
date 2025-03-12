
/**
 * Utility functions for file management
 */

import * as XLSX from 'xlsx';

/**
 * Generates a filename with a timestamp for exports
 * @param prefix The prefix for the filename
 * @param extension The file extension (without the dot)
 * @returns A string with the format prefix_YYYYMMDD_HHMMSS.extension
 */
export const generateTimestampedFilename = (prefix: string, extension: string): string => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
  return `${prefix}_${timestamp}.${extension}`;
};

/**
 * Exports data to an Excel file
 * @param data The data to export
 * @param sheetName The name of the sheet in the Excel file
 * @param filename The name of the file to download
 */
export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  sheetName: string = 'Sheet1',
  filename?: string
): void => {
  // Create a new workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generate the Excel file
  const outputFilename = filename || generateTimestampedFilename('export', 'xlsx');
  
  // Save the file
  XLSX.writeFile(wb, outputFilename);
};
