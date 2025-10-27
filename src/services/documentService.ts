import { cleanText } from '../utils/fileHelpers';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import Tesseract from 'tesseract.js';

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

        // Properly extract text with line breaks preserved
        let pageText = '';
        let lastY = -1;

        for (const item of textContent.items) {
          const text = (item as any).str;
          if (!text) continue;

          // Get the y-position (vertical position on page)
          const transform = (item as any).transform;
          const currentY = transform ? transform[5] : -1;

          // If y-position changed significantly, we're on a new line
          if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
            pageText += '\n';
          } else if (pageText && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
            // Add space between items on same line
            pageText += ' ';
          }

          pageText += text;
          lastY = currentY;
        }

        fullText += pageText + '\n\n'; // Double newline between pages
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

export const processWordDoc = async (file: File): Promise<{ content: string; htmlContent?: string; arrayBuffer?: ArrayBuffer }> => {
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

      // Extract both HTML and raw text with enhanced style preservation
      console.log('Extracting HTML and text from DOCX...');

      // Configure Mammoth with custom style mappings to preserve formatting
      const options = {
        arrayBuffer,
        styleMap: [
          // Preserve paragraph styles with colors and backgrounds
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "p[style-name='Heading 5'] => h5:fresh",
          "p[style-name='Heading 6'] => h6:fresh",

          // Preserve character formatting
          "r[style-name='Strong'] => strong:fresh",
          "r[style-name='Emphasis'] => em:fresh",

          // Preserve highlights and colors by converting to inline styles
          "p => p:fresh",
          "r => span:fresh"
        ],
        convertImage: mammoth.images.imgElement((image: any) => {
          return image.read("base64").then((imageBuffer: string) => {
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer
            };
          });
        }),
        // Include default styles to preserve more formatting
        includeDefaultStyleMap: true,
        // Preserve empty paragraphs
        ignoreEmptyParagraphs: false
      };

      const htmlResult = await mammoth.convertToHtml(options);
      const textResult = await mammoth.extractRawText({ arrayBuffer });

      console.log('Extraction complete');
      console.log('HTML length:', htmlResult.value?.length || 0);
      console.log('Text length:', textResult.value?.length || 0);

      if (textResult.messages && textResult.messages.length > 0) {
        console.log('Mammoth messages:', textResult.messages);
      }

      if (!textResult.value || textResult.value.trim().length === 0) {
        throw new Error('No text content found in Word document - might be empty or image-based');
      }

      const cleanedText = cleanText(textResult.value);
      console.log('Cleaned text length:', cleanedText.length);

      return {
        content: cleanedText,
        htmlContent: htmlResult.value,
        arrayBuffer: arrayBuffer // Return the raw ArrayBuffer for native rendering
      };
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
    const fallbackMessage = `Word document "${file.name}" uploaded successfully.

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

    return { content: fallbackMessage };
  }
};

export const processExcel = async (file: File): Promise<{ content: string; excelData: any[] }> => {
  console.log('Processing Excel:', file.name);

  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    let content = `Excel File: ${file.name}\n\n`;
    const excelData: any[] = [];

    // Process each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON format for better structure
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      // Calculate maximum column count across all rows
      const maxColCount = jsonData.reduce((max, row: any) => {
        const rowLength = Array.isArray(row) ? row.length : 0;
        return Math.max(max, rowLength);
      }, 0);

      // Store structured data for native viewing
      excelData.push({
        name: sheetName,
        data: jsonData,
        rowCount: jsonData.length,
        colCount: maxColCount
      });

      content += `Sheet ${index + 1}: ${sheetName}\n`;
      content += `Rows: ${jsonData.length}\n\n`;

      // Format as table for text content
      if (jsonData.length > 0) {
        // Get headers (first row)
        const headers = jsonData[0] as any[];
        content += headers.join(' | ') + '\n';
        content += headers.map(() => '---').join(' | ') + '\n';

        // Add data rows (limit to first 100 rows for performance)
        const maxRows = Math.min(jsonData.length, 100);
        for (let i = 1; i < maxRows; i++) {
          const row = jsonData[i] as any[];
          content += row.join(' | ') + '\n';
        }

        if (jsonData.length > 100) {
          content += `\n[${jsonData.length - 100} more rows...]\n`;
        }
      }
      content += '\n';
    });

    return { content, excelData };
  } catch (error) {
    console.error('Excel processing error:', error);
    throw new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const processCSV = async (file: File): Promise<string> => {
  console.log('Processing CSV:', file.name);

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          let content = `CSV File: ${file.name}\n`;
          content += `Rows: ${results.data.length}\n\n`;

          if (results.data.length > 0) {
            // Get headers (first row)
            const headers = results.data[0] as any[];
            content += headers.join(' | ') + '\n';
            content += headers.map(() => '---').join(' | ') + '\n';

            // Add data rows (limit to first 100 rows)
            const maxRows = Math.min(results.data.length, 100);
            for (let i = 1; i < maxRows; i++) {
              const row = results.data[i] as any[];
              content += row.join(' | ') + '\n';
            }

            if (results.data.length > 100) {
              content += `\n[${results.data.length - 100} more rows...]\n`;
            }
          }

          resolve(content);
        } catch (error) {
          reject(new Error(`Failed to format CSV: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
};

export const processJSON = async (file: File): Promise<string> => {
  console.log('Processing JSON:', file.name);

  try {
    const text = await file.text();
    const jsonData = JSON.parse(text);

    let content = `JSON File: ${file.name}\n\n`;

    // Pretty print JSON with indentation
    const prettyJson = JSON.stringify(jsonData, null, 2);

    // If JSON is too large, truncate it
    if (prettyJson.length > 10000) {
      content += prettyJson.substring(0, 10000);
      content += `\n\n[JSON truncated - ${prettyJson.length - 10000} more characters...]\n`;
      content += '\nSummary:\n';

      // Add summary info
      if (Array.isArray(jsonData)) {
        content += `- Array with ${jsonData.length} items\n`;
        if (jsonData.length > 0) {
          content += `- First item keys: ${Object.keys(jsonData[0]).join(', ')}\n`;
        }
      } else if (typeof jsonData === 'object') {
        content += `- Object with keys: ${Object.keys(jsonData).join(', ')}\n`;
      }
    } else {
      content += prettyJson;
    }

    return content;
  } catch (error) {
    console.error('JSON processing error:', error);
    throw new Error(`Failed to process JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const processImage = async (file: File): Promise<string> => {
  console.log('Processing image with OCR:', file.name);

  try {
    // Validate file
    if (file.size === 0) {
      throw new Error('File appears to be empty');
    }

    console.log('Starting OCR with Tesseract.js...');

    // Use Tesseract.js to extract text from the image
    const { data: { text, confidence } } = await Tesseract.recognize(
      file,
      'eng', // English language
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    console.log('OCR completed. Confidence:', confidence);
    console.log('Extracted text length:', text.length);

    if (!text || text.trim().length === 0) {
      return `Image file "${file.name}" uploaded successfully.

Note: No text detected in the image.

This image might:
- Contain no text
- Have very small or unclear text
- Be a diagram, chart, or photo without text

You can still describe the image or ask questions about what you expect it to contain.`;
    }

    let content = `Image File: ${file.name}\n`;
    content += `OCR Confidence: ${Math.round(confidence)}%\n\n`;
    content += `Extracted Text:\n${text}\n`;

    return cleanText(content);
  } catch (error) {
    console.error('Image OCR error:', error);

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return `Image file "${file.name}" uploaded successfully.

Note: OCR text extraction failed. Error: ${errorMessage}

You can still ask questions about the image based on its filename or describe what you expect it to contain.`;
  }
};

export const processDocument = async (file: File): Promise<{ content: string; htmlContent?: string; arrayBuffer?: ArrayBuffer; excelData?: any[] }> => {
  let content = '';
  let htmlContent: string | undefined;
  let arrayBuffer: ArrayBuffer | undefined;
  let excelData: any[] | undefined;

  // Check if it's an image file
  const isImage = file.type.startsWith('image/') ||
    file.name.endsWith('.png') ||
    file.name.endsWith('.jpg') ||
    file.name.endsWith('.jpeg');

  if (isImage) {
    content = await processImage(file);
  } else if (file.type === 'application/pdf') {
    content = await processPDF(file);
  } else if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword'
  ) {
    const wordResult = await processWordDoc(file);
    content = wordResult.content;
    htmlContent = wordResult.htmlContent;
    arrayBuffer = wordResult.arrayBuffer;
  } else if (
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel' ||
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.xls')
  ) {
    const excelResult = await processExcel(file);
    content = excelResult.content;
    excelData = excelResult.excelData;
  } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
    content = await processCSV(file);
  } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
    content = await processJSON(file);
  } else {
    // For plain text files or unsupported formats, try to read as text
    content = await file.text();
  }

  return {
    content: cleanText(content),
    htmlContent,
    arrayBuffer,
    excelData
  };
};