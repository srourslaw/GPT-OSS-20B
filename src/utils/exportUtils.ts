import html2pdf from 'html2pdf.js';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Export HTML content to PDF
 */
export const exportToPDF = (htmlContent: string, filename: string = 'draft.pdf') => {
  // Create a temporary container for the content
  const element = document.createElement('div');
  element.innerHTML = htmlContent;

  // Apply comprehensive styling to match the editor
  element.style.padding = '40px';
  element.style.backgroundColor = 'white';
  element.style.maxWidth = '800px';
  element.style.margin = '0 auto';
  element.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  element.style.fontSize = '16px';
  element.style.lineHeight = '1.8';
  element.style.color = '#374151';

  // Add CSS to preserve formatting
  const style = document.createElement('style');
  style.textContent = `
    h1 { font-size: 2em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; color: #1f2937; line-height: 1.3; }
    h2 { font-size: 1.6em; font-weight: bold; margin-top: 1.2em; margin-bottom: 0.4em; color: #4f46e5; }
    h3 { font-size: 1.3em; font-weight: 600; margin-top: 1em; margin-bottom: 0.3em; color: #6366f1; }
    h4 { font-size: 1.1em; font-weight: 600; margin-top: 0.8em; margin-bottom: 0.3em; color: #8b5cf6; }
    p { margin-bottom: 1em; line-height: 1.8; color: #374151; }
    strong, b { font-weight: bold; color: #1f2937; }
    em, i { font-style: italic; color: #6b7280; }
    u { text-decoration: underline; }
    s, strike, del { text-decoration: line-through; }
    code { font-family: 'Courier New', monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 3px; color: #8b5cf6; font-size: 0.9em; }
    pre { background: #f8f9fa; padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid #e5e7eb; margin: 1em 0; }
    pre code { background: transparent; padding: 0; }
    ul, ol { margin: 1em 0; padding-left: 2em; }
    li { margin-bottom: 0.5em; line-height: 1.8; color: #4b5563; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 1em; margin: 1em 0; background: linear-gradient(to right, #eff6ff 0%, #dbeafe 100%); padding: 0.75em 1em; border-radius: 0 8px 8px 0; color: #1e40af; font-style: italic; }
    a { color: #2563eb; text-decoration: underline; }
    hr { border: none; height: 2px; background: linear-gradient(to right, #e0e7ff, #c7d2fe, #e0e7ff); margin: 2em 0; border-radius: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; border: 1px solid #e5e7eb; }
    th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; }
    tr:hover { background: #f9fafb; }
    [style*="text-align: center"] { text-align: center !important; }
    [style*="text-align: right"] { text-align: right !important; }
    [style*="text-align: justify"] { text-align: justify !important; }
  `;
  element.prepend(style);

  const options = {
    margin: 15,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      allowTaint: true
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Generate PDF
  html2pdf().set(options).from(element).save().then(() => {
    console.log('PDF exported successfully');
  }).catch((error: Error) => {
    console.error('Error exporting PDF:', error);
    alert('Failed to export PDF. Please try again.');
  });
};

/**
 * Convert HTML to plain text with basic formatting
 */
const htmlToPlainText = (html: string): string => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

/**
 * Parse HTML and convert to docx paragraphs
 */
const parseHTMLToDocx = (htmlContent: string): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  const temp = document.createElement('div');
  temp.innerHTML = htmlContent;

  // Enhanced processNode with proper formatting inheritance
  const processNode = (node: Node, inheritedFormat: any = {}): TextRun[] => {
    const runs: TextRun[] = [];

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        runs.push(new TextRun({
          text,
          ...inheritedFormat
        }));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      // Build formatting object by inheriting and adding new formats
      const format: any = { ...inheritedFormat };

      // Check for formatting tags
      if (tagName === 'strong' || tagName === 'b') format.bold = true;
      if (tagName === 'em' || tagName === 'i') format.italics = true;
      if (tagName === 'u') format.underline = {};
      if (tagName === 's' || tagName === 'strike' || tagName === 'del') format.strike = true;

      // Handle code with special formatting
      if (tagName === 'code') {
        format.font = 'Courier New';
        format.color = '8b5cf6';
        format.shading = {
          fill: 'f3f4f6',
          type: 'solid',
          color: 'auto'
        };
      }

      // Check for inline color styles
      const style = element.style;
      if (style.color) {
        const color = style.color.replace('#', '');
        if (color.length === 6) format.color = color;
      }

      // Process child nodes with inherited formatting
      if (element.childNodes.length > 0) {
        element.childNodes.forEach((child) => {
          const childRuns = processNode(child, format);
          runs.push(...childRuns);
        });
      } else {
        const text = element.textContent || '';
        if (text.trim()) {
          runs.push(new TextRun({
            text,
            ...format
          }));
        }
      }
    }

    return runs;
  };

  const processElement = (element: Element) => {
    const tagName = element.tagName.toLowerCase();
    const text = element.textContent || '';

    if (!text.trim() && tagName !== 'br' && tagName !== 'hr') return;

    let heading: typeof HeadingLevel[keyof typeof HeadingLevel] | undefined = undefined;
    let alignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT;

    // Check text alignment from style
    const style = (element as HTMLElement).style;
    if (style.textAlign === 'center') alignment = AlignmentType.CENTER;
    else if (style.textAlign === 'right') alignment = AlignmentType.RIGHT;
    else if (style.textAlign === 'justify') alignment = AlignmentType.JUSTIFIED;

    // Handle different elements
    if (tagName === 'h1') {
      heading = HeadingLevel.HEADING_1;
      const runs = processNode(element);
      if (runs.length > 0) {
        paragraphs.push(new Paragraph({
          children: runs,
          heading,
          alignment,
          spacing: { before: 360, after: 240 }
        }));
      }
      return;
    } else if (tagName === 'h2') {
      heading = HeadingLevel.HEADING_2;
      const runs = processNode(element);
      if (runs.length > 0) {
        paragraphs.push(new Paragraph({
          children: runs,
          heading,
          alignment,
          spacing: { before: 288, after: 192 }
        }));
      }
      return;
    } else if (tagName === 'h3') {
      heading = HeadingLevel.HEADING_3;
      const runs = processNode(element);
      if (runs.length > 0) {
        paragraphs.push(new Paragraph({
          children: runs,
          heading,
          alignment,
          spacing: { before: 240, after: 144 }
        }));
      }
      return;
    } else if (tagName === 'h4') {
      heading = HeadingLevel.HEADING_4;
      const runs = processNode(element);
      if (runs.length > 0) {
        paragraphs.push(new Paragraph({
          children: runs,
          heading,
          alignment,
          spacing: { before: 192, after: 120 }
        }));
      }
      return;
    } else if (tagName === 'p') {
      const runs = processNode(element);
      if (runs.length > 0) {
        paragraphs.push(new Paragraph({
          children: runs,
          alignment,
          spacing: { after: 240, line: 360 }
        }));
      }
      return;
    } else if (tagName === 'br') {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
      return;
    } else if (tagName === 'hr') {
      // Add a horizontal line as a border bottom paragraph
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: '' })],
        border: {
          bottom: {
            color: 'c7d2fe',
            space: 1,
            style: 'single',
            size: 12
          }
        },
        spacing: { before: 240, after: 240 }
      }));
      return;
    } else if (tagName === 'ul' || tagName === 'ol') {
      const isNumbered = tagName === 'ol';
      element.querySelectorAll('li').forEach((li, index) => {
        const runs = processNode(li);
        if (runs.length > 0) {
          const prefix = isNumbered ? `${index + 1}. ` : '• ';
          runs.unshift(new TextRun({ text: prefix }));
          paragraphs.push(new Paragraph({
            children: runs,
            spacing: { after: 120, line: 360 },
            indent: { left: 720 }
          }));
        }
      });
      return;
    } else if (tagName === 'blockquote') {
      const runs = processNode(element);
      if (runs.length > 0) {
        paragraphs.push(new Paragraph({
          children: runs,
          indent: { left: 720 },
          spacing: { after: 240, line: 360 },
          border: {
            left: {
              color: '3b82f6',
              space: 1,
              style: 'single',
              size: 24
            }
          },
          shading: {
            fill: 'eff6ff',
            type: 'solid',
            color: 'auto'
          }
        }));
      }
      return;
    } else if (tagName === 'pre') {
      // Handle code blocks
      const code = element.querySelector('code');
      const codeText = code ? code.textContent || '' : element.textContent || '';
      if (codeText.trim()) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: codeText,
            font: 'Courier New',
            size: 20
          })],
          shading: {
            fill: 'f8f9fa',
            type: 'solid',
            color: 'auto'
          },
          spacing: { after: 240, line: 300 },
          indent: { left: 360, right: 360 }
        }));
      }
      return;
    }
  };

  // Process all top-level elements
  temp.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, ul, ol, blockquote, br').forEach((element) => {
    processElement(element);
  });

  // If no paragraphs were created, create one with the plain text
  if (paragraphs.length === 0) {
    const plainText = htmlToPlainText(htmlContent);
    if (plainText.trim()) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: plainText })],
      }));
    }
  }

  return paragraphs;
};

/**
 * Export HTML content to Word document
 */
export const exportToWord = async (htmlContent: string, filename: string = 'draft.docx') => {
  try {
    // Parse HTML and convert to docx paragraphs
    const paragraphs = parseHTMLToDocx(htmlContent);

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    // Generate blob
    const blob = await Packer.toBlob(doc);

    // Save file
    saveAs(blob, filename);
    console.log('Word document exported successfully');
  } catch (error) {
    console.error('Error exporting Word document:', error);
    alert('Failed to export Word document. Please try again.');
  }
};

/**
 * Export HTML content to a standalone HTML file
 */
export const exportToHTML = (htmlContent: string, filename: string = 'draft.html') => {
  try {
    // Create a complete HTML document with styling
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Draft Output</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 16px;
      line-height: 1.8;
      color: #374151;
      background: #f9fafb;
      padding: 40px 20px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-radius: 8px;
    }

    h1 {
      font-size: 2em;
      font-weight: bold;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      color: #1f2937;
      line-height: 1.3;
      border-bottom: 3px solid #e0e7ff;
      padding-bottom: 0.3em;
    }

    h1:first-child {
      margin-top: 0;
    }

    h2 {
      font-size: 1.6em;
      font-weight: bold;
      margin-top: 1.2em;
      margin-bottom: 0.4em;
      color: #4f46e5;
    }

    h3 {
      font-size: 1.3em;
      font-weight: 600;
      margin-top: 1em;
      margin-bottom: 0.3em;
      color: #6366f1;
    }

    h4 {
      font-size: 1.1em;
      font-weight: 600;
      margin-top: 0.8em;
      margin-bottom: 0.3em;
      color: #8b5cf6;
    }

    p {
      margin-bottom: 1em;
      line-height: 1.8;
      color: #374151;
    }

    strong, b {
      font-weight: bold;
      color: #1f2937;
    }

    em, i {
      font-style: italic;
      color: #6b7280;
    }

    u {
      text-decoration: underline;
    }

    s, strike, del {
      text-decoration: line-through;
    }

    code {
      font-family: 'Courier New', monospace;
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      color: #8b5cf6;
      font-size: 0.9em;
    }

    pre {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      border: 1px solid #e5e7eb;
      margin: 1em 0;
    }

    pre code {
      background: transparent;
      padding: 0;
      font-size: 14px;
      color: #1f2937;
    }

    ul, ol {
      margin: 1em 0;
      padding-left: 2em;
    }

    li {
      margin-bottom: 0.5em;
      line-height: 1.8;
      color: #4b5563;
    }

    blockquote {
      border-left: 4px solid #3b82f6;
      padding-left: 1em;
      margin: 1em 0;
      background: linear-gradient(to right, #eff6ff 0%, #dbeafe 100%);
      padding: 0.75em 1em;
      border-radius: 0 8px 8px 0;
      color: #1e40af;
      font-style: italic;
    }

    a {
      color: #2563eb;
      text-decoration: underline;
    }

    a:hover {
      color: #1d4ed8;
    }

    hr {
      border: none;
      height: 2px;
      background: linear-gradient(to right, #e0e7ff, #c7d2fe, #e0e7ff);
      margin: 2em 0;
      border-radius: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
    }

    tr:hover {
      background: #f9fafb;
    }

    tr:last-child td {
      border-bottom: none;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .container {
        box-shadow: none;
        padding: 40px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${htmlContent}
  </div>
</body>
</html>`;

    // Create blob and download
    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    saveAs(blob, filename);
    console.log('HTML file exported successfully');
  } catch (error) {
    console.error('Error exporting HTML:', error);
    alert('Failed to export HTML. Please try again.');
  }
};
