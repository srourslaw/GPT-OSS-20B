import { marked } from 'marked';

/**
 * Convert markdown text to HTML with enhanced formatting
 */
export const markdownToHtml = (markdown: string): string => {
  try {
    // Defensive check: ensure markdown is actually a string
    if (typeof markdown !== 'string') {
      console.error('markdownToHtml received non-string input:', typeof markdown, markdown);
      return '<p>Error: Invalid content type</p>';
    }

    // Handle empty or whitespace-only strings
    if (!markdown || markdown.trim() === '') {
      return '';
    }

    // Configure marked options for better rendering
    marked.setOptions({
      breaks: true, // Convert \n to <br>
      gfm: true, // GitHub Flavored Markdown
      headerIds: false, // Don't add IDs to headers
      mangle: false, // Don't escape autolinked email addresses
    });

    // Convert markdown to HTML synchronously
    const html = marked(markdown) as string;

    // Defensive check: ensure the result is a string
    if (typeof html !== 'string') {
      console.error('Marked returned non-string:', typeof html, html);
      return `<p>${markdown}</p>`;
    }

    return html;
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    // Return the original text wrapped in a paragraph if conversion fails
    return `<p>${typeof markdown === 'string' ? markdown : 'Error rendering content'}</p>`;
  }
};
