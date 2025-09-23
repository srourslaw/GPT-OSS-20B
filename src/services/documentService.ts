import { cleanText } from '../utils/fileHelpers';

const readFileAsArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (result instanceof ArrayBuffer) {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };

    reader.onerror = () => {
      reject(new Error('FileReader error: ' + reader.error?.message || 'Unknown error'));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const processPDF = async (file: File): Promise<string> => {
  console.log('Processing PDF:', file.name, 'Size:', file.size, 'Type:', file.type);

  try {
    // Validate file first
    if (file.size === 0) {
      throw new Error('File appears to be empty');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('File too large (over 50MB)');
    }

    // Import PDF.js dynamically for browser compatibility
    console.log('Importing PDF.js...');
    const pdfjsLib = await import('pdfjs-dist');
    console.log('PDF.js imported successfully');

    // Set up the worker (required for PDF.js in browser)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    console.log('PDF.js worker configured');

    console.log('Reading file as array buffer...');
    // Use FileReader instead of file.arrayBuffer() to avoid WebKit issues
    const arrayBuffer = await readFileAsArrayBuffer(file);
    console.log('Array buffer size:', arrayBuffer.byteLength);

    if (arrayBuffer.byteLength === 0) {
      throw new Error('File read as empty buffer');
    }

    console.log('Loading PDF document...');
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      password: '', // Try with empty password first
      verbosity: 0 // Reduce PDF.js logging
    }).promise;
    console.log('PDF loaded successfully. Pages:', pdf.numPages);

    let fullText = '';

    // Extract text from each page (limit to first 10 pages for performance)
    const maxPages = Math.min(pdf.numPages, 10);
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        console.log(`Processing page ${pageNum}/${maxPages}...`);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
        console.log(`Page ${pageNum} text length:`, pageText.length);
      } catch (pageError) {
        console.warn(`Failed to process page ${pageNum}:`, pageError);
        // Continue with other pages
      }
    }

    if (pdf.numPages > 10) {
      fullText += `\n[Note: Document has ${pdf.numPages} pages, showing first 10 pages only]`;
    }

    console.log('Full extracted text length:', fullText.trim().length);

    if (!fullText.trim()) {
      throw new Error('No text content found in PDF - might be image-based or encrypted');
    }

    const cleanedText = cleanText(fullText);
    console.log('Cleaned text length:', cleanedText.length);
    return cleanedText;
  } catch (error) {
    console.error('PDF processing error details:', error);

    // Provide specific error messages based on error type
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF structure')) {
        errorMessage = 'The file appears to be corrupted or not a valid PDF';
      } else if (error.message.includes('password')) {
        errorMessage = 'The PDF is password protected';
      } else if (error.message.includes('WebKit') || error.message.includes('NotReadableError')) {
        errorMessage = 'File reading failed - try a different browser or smaller file';
      } else {
        errorMessage = error.message;
      }
    }

    // Fallback message if PDF processing fails
    return `PDF file "${file.name}" uploaded successfully.

Note: Text extraction failed. Error: ${errorMessage}

This might be due to:
- Image-based PDF (scanned document without text layer)
- Password protection or encryption
- Corrupted or invalid PDF file
- File too large or complex
- Browser compatibility issues

You can still ask questions about the document based on its filename, or try:
- Converting to a .txt file
- Using a different PDF file
- Trying a different browser`;
  }
};

export const processWordDoc = async (file: File): Promise<string> => {
  console.log('Processing Word document:', file.name, 'Size:', file.size, 'Type:', file.type);

  try {
    // Validate file first
    if (file.size === 0) {
      throw new Error('File appears to be empty');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('File too large (over 50MB)');
    }

    console.log('Reading file as array buffer...');
    // Use FileReader instead of file.arrayBuffer() to avoid WebKit issues
    const arrayBuffer = await readFileAsArrayBuffer(file);
    console.log('Array buffer size:', arrayBuffer.byteLength);

    if (arrayBuffer.byteLength === 0) {
      throw new Error('File read as empty buffer');
    }

    // For .docx files (modern Word format)
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('Processing as DOCX file...');
      // Import mammoth dynamically for browser compatibility
      console.log('Importing mammoth...');
      const mammoth = await import('mammoth');
      console.log('Mammoth imported successfully');

      console.log('Extracting text from DOCX...');
      const result = await mammoth.extractRawText({ arrayBuffer });
      console.log('Extraction result:', result);
      console.log('Extracted text length:', result.value?.length || 0);

      if (result.messages && result.messages.length > 0) {
        console.log('Mammoth messages:', result.messages);
      }

      if (!result.value || result.value.trim().length === 0) {
        throw new Error('No text content found in Word document - might be empty or image-based');
      }

      const cleanedText = cleanText(result.value);
      console.log('Cleaned text length:', cleanedText.length);
      return cleanedText;
    } else if (file.type === 'application/msword') {
      // For .doc files (legacy format)
      console.log('Legacy .doc format detected');
      throw new Error('Legacy .doc format not supported. Please save as .docx format.');
    } else {
      throw new Error(`Unsupported file type: ${file.type}. Please use .docx format.`);
    }
  } catch (error) {
    console.error('Word document processing error details:', error);

    // Provide specific error messages based on error type
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      if (error.message.includes('Legacy .doc format')) {
        errorMessage = 'Legacy .doc format not supported. Please convert to .docx';
      } else if (error.message.includes('WebKit') || error.message.includes('NotReadableError')) {
        errorMessage = 'File reading failed - try a different browser or smaller file';
      } else if (error.message.includes('empty')) {
        errorMessage = 'The document appears to be empty';
      } else {
        errorMessage = error.message;
      }
    }

    // Fallback message if Word processing fails
    return `Word document "${file.name}" uploaded successfully.

Note: Text extraction failed. Error: ${errorMessage}

This might be due to:
- Legacy .doc format (please convert to .docx)
- Password protection or encryption
- Empty or image-only document
- Corrupted file
- Browser compatibility issues

You can still ask questions about the document based on its filename, or try:
- Converting to .docx format
- Saving as a .txt file
- Using a different browser`;
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