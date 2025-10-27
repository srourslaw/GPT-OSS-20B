import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from './constants';

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size exceeds 50MB limit' };
  }

  // Check file type by MIME type or file extension
  const isValidType = Object.keys(SUPPORTED_FILE_TYPES).includes(file.type) ||
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.xls') ||
    file.name.endsWith('.csv') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.png') ||
    file.name.endsWith('.jpg') ||
    file.name.endsWith('.jpeg');

  if (!isValidType) {
    return { isValid: false, error: 'Unsupported file type. Please upload PDF, Word, Excel, CSV, JSON, TXT, or Image files (PNG, JPG).' };
  }

  return { isValid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const cleanText = (text: string): string => {
  return text
    .replace(/[^\S\n]+/g, ' ') // Replace multiple spaces/tabs (but NOT newlines) with single space
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with double newline
    .replace(/ +\n/g, '\n') // Remove trailing spaces before newlines
    .replace(/\n +/g, '\n') // Remove leading spaces after newlines
    .trim();
};