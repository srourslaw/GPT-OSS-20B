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
  element.style.padding = '40px';
  element.style.backgroundColor = 'white';
  element.style.maxWidth = '800px';
  element.style.margin = '0 auto';
  element.style.fontFamily = 'Georgia, serif';
  element.style.fontSize = '14px';
  element.style.lineHeight = '1.6';

  const options = {
    margin: 10,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
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

  const processNode = (node: Node): TextRun[] => {
    const runs: TextRun[] = [];

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        runs.push(new TextRun({ text }));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      const text = element.textContent || '';

      if (!text.trim()) return runs;

      let bold = false;
      let italic = false;
      let underline: any = undefined;
      let strike = false;

      // Check for formatting
      if (tagName === 'strong' || tagName === 'b') bold = true;
      if (tagName === 'em' || tagName === 'i') italic = true;
      if (tagName === 'u') underline = {};
      if (tagName === 's' || tagName === 'strike' || tagName === 'del') strike = true;
      if (tagName === 'code') {
        runs.push(new TextRun({
          text,
          font: 'Courier New',
          color: '000000'
        }));
        return runs;
      }

      // Process child nodes
      if (element.childNodes.length > 0) {
        element.childNodes.forEach((child) => {
          const childRuns = processNode(child);
          runs.push(...childRuns);
        });
      } else {
        runs.push(new TextRun({
          text,
          bold,
          italics: italic,
          underline,
          strike
        }));
      }
    }

    return runs;
  };

  const processElement = (element: Element) => {
    const tagName = element.tagName.toLowerCase();
    const text = element.textContent || '';

    if (!text.trim() && tagName !== 'br') return;

    let heading: typeof HeadingLevel[keyof typeof HeadingLevel] | undefined = undefined;
    let alignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT;

    // Check text alignment
    const style = (element as HTMLElement).style;
    if (style.textAlign === 'center') alignment = AlignmentType.CENTER;
    else if (style.textAlign === 'right') alignment = AlignmentType.RIGHT;
    else if (style.textAlign === 'justify') alignment = AlignmentType.JUSTIFIED;

    // Handle different elements
    if (tagName === 'h1') {
      heading = HeadingLevel.HEADING_1;
    } else if (tagName === 'h2') {
      heading = HeadingLevel.HEADING_2;
    } else if (tagName === 'h3') {
      heading = HeadingLevel.HEADING_3;
    } else if (tagName === 'p' || tagName === 'div') {
      const runs = processNode(element);
      if (runs.length > 0) {
        paragraphs.push(new Paragraph({
          children: runs,
          alignment,
          spacing: { after: 200 }
        }));
      }
      return;
    } else if (tagName === 'br') {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
      return;
    } else if (tagName === 'ul' || tagName === 'ol') {
      element.querySelectorAll('li').forEach((li) => {
        const liText = li.textContent || '';
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: `• ${liText}` })],
          spacing: { after: 100 }
        }));
      });
      return;
    } else if (tagName === 'blockquote') {
      const runs = processNode(element);
      paragraphs.push(new Paragraph({
        children: runs,
        indent: { left: 720 }, // 0.5 inch
        spacing: { after: 200 }
      }));
      return;
    }

    // For headings
    if (heading !== undefined) {
      const runs = processNode(element);
      paragraphs.push(new Paragraph({
        children: runs,
        heading,
        alignment,
        spacing: { before: 240, after: 120 }
      }));
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
