import { cleanText } from '../utils/fileHelpers';
// @ts-ignore - pdf-parse doesn't have types
import * as pdfParse from 'pdf-parse';

export const processPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const pdfData = await pdfParse(uint8Array);

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }

    return cleanText(pdfData.text);
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error('Failed to extract text from PDF file');
  }
};

export const processWordDoc = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // For .docx files (modern Word format)
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer });

      if (!result.value || result.value.trim().length === 0) {
        throw new Error('No text content found in Word document');
      }

      return cleanText(result.value);
    } else {
      // For .doc files (legacy format), we'll need a different approach
      // For now, show an informative error
      throw new Error('Legacy .doc format not supported. Please save as .docx format.');
    }
  } catch (error) {
    console.error('Word document processing error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process Word document');
  }
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