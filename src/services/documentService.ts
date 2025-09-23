import { cleanText } from '../utils/fileHelpers';

export const processPDF = async (file: File): Promise<string> => {
  // For now, provide a fallback message for PDFs
  // Browser-based PDF processing requires additional setup
  return `PDF file "${file.name}" uploaded successfully.

Note: PDF text extraction is not fully implemented in the browser version.
For testing, please use a .txt file with sample content, or deploy this to a server environment for full PDF processing.

This is a placeholder content to demonstrate the AI chat functionality with your uploaded PDF file.`;
};

export const processWordDoc = async (file: File): Promise<string> => {
  // For now, provide a fallback message for Word docs
  // Browser-based Word processing requires additional setup
  return `Word document "${file.name}" uploaded successfully.

Note: Word document text extraction is not fully implemented in the browser version.
For testing, please use a .txt file with sample content, or deploy this to a server environment for full document processing.

This is a placeholder content to demonstrate the AI chat functionality with your uploaded Word document.`;
};

export const processDocument = async (file: File): Promise<string> => {
  let content = '';

  if (file.type === 'application/pdf') {
    content = await processPDF(file);
  } else if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword'
  ) {
    content = await processWordDoc(file);
  } else {
    // For plain text files or unsupported formats, try to read as text
    content = await file.text();
  }

  return cleanText(content);
};