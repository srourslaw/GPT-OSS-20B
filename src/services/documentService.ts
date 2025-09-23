import { cleanText } from '../utils/fileHelpers';

export const processPDF = async (file: File): Promise<string> => {
  try {
    // Import PDF.js dynamically for browser compatibility
    const pdfjsLib = await import('pdfjs-dist');

    // Set up the worker (required for PDF.js in browser)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    if (!fullText.trim()) {
      throw new Error('No text content found in PDF');
    }

    return cleanText(fullText);
  } catch (error) {
    console.error('PDF processing error:', error);

    // Fallback message if PDF processing fails
    return `PDF file "${file.name}" uploaded successfully.

Note: Text extraction failed for this PDF. This might be due to:
- Image-based PDF (scanned document)
- Password protection
- Corrupted file
- Processing limitations

You can still ask questions about the document, but responses will be based on the filename and general PDF handling knowledge.`;
  }
};

export const processWordDoc = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // For .docx files (modern Word format)
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Import mammoth dynamically for browser compatibility
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer });

      if (!result.value || result.value.trim().length === 0) {
        throw new Error('No text content found in Word document');
      }

      return cleanText(result.value);
    } else {
      // For .doc files (legacy format)
      throw new Error('Legacy .doc format not supported. Please save as .docx format.');
    }
  } catch (error) {
    console.error('Word document processing error:', error);

    // Fallback message if Word processing fails
    return `Word document "${file.name}" uploaded successfully.

Note: Text extraction failed for this document. This might be due to:
- Legacy .doc format (please convert to .docx)
- Password protection
- Corrupted file
- Complex formatting

You can still ask questions about the document, but responses will be based on the filename and general document handling knowledge.`;
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