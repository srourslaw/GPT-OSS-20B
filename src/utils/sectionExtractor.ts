import { DocumentSection } from '../types';
import mammoth from 'mammoth';

/**
 * Fill in content for TOC-extracted sections by matching titles in the full text
 */
const fillSectionContent = (sections: DocumentSection[], fullText: string): void => {
  const lines = fullText.split('\n');

  for (const section of sections) {
    // Find the section title in the full text
    let sectionStartIndex = -1;
    let sectionEndIndex = lines.length;

    // Search for the section title (case-insensitive, allow some flexibility)
    const searchTitle = section.title.toLowerCase().trim();

    // Try multiple matching strategies
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();

      // Strategy 1: Exact match
      if (line === searchTitle) {
        sectionStartIndex = i + 1;
        break;
      }

      // Strategy 2: Line contains the full search title
      if (line.includes(searchTitle) && searchTitle.length > 5) {
        sectionStartIndex = i + 1;
        break;
      }

      // Strategy 3: Search title contains the line (for short lines)
      if (searchTitle.includes(line) && line.length > 5) {
        const matchRatio = line.length / searchTitle.length;
        if (matchRatio > 0.5) {
          sectionStartIndex = i + 1;
          break;
        }
      }

      // Strategy 4: Fuzzy match - check if significant words match
      if (searchTitle.length > 10 && line.length > 10) {
        const searchWords = searchTitle.split(/\s+/).filter(w => w.length > 3);
        const lineWords = line.split(/\s+/).filter(w => w.length > 3);
        const matchingWords = searchWords.filter(sw => lineWords.some(lw => lw.includes(sw) || sw.includes(lw)));

        // If more than 60% of significant words match
        if (matchingWords.length >= searchWords.length * 0.6 && searchWords.length >= 2) {
          sectionStartIndex = i + 1;
          break;
        }
      }

      // Strategy 5: All-words match (even for short titles) - most aggressive
      const searchWords = searchTitle.split(/\s+/).filter(w => w.length > 2);
      const lineWords = line.split(/\s+/).filter(w => w.length > 2);

      if (searchWords.length >= 2) {
        // Check if all search words are present in the line
        const allWordsMatch = searchWords.every(sw =>
          lineWords.some(lw => lw === sw || lw.includes(sw) || sw.includes(lw))
        );

        if (allWordsMatch && line.length < 100) { // Avoid matching long paragraphs
          sectionStartIndex = i + 1;
          break;
        }
      }
    }

    if (sectionStartIndex === -1) {
      console.log(`⚠️ Could not find content for section: "${section.title}"`);
      console.log(`   Searched for: "${searchTitle}"`);
      console.log(`   First 5 lines to check:`, lines.slice(0, 5).map(l => `"${l}"`));
      section.content = `[Content for "${section.title}" could not be extracted]`;
      continue;
    }

    console.log(`✅ Found section "${section.title}" starting at line ${sectionStartIndex}`);

    // Find where this section ends (either at the next section title or end of document)
    // Look for the next section in the list
    const currentIndex = sections.indexOf(section);
    if (currentIndex < sections.length - 1) {
      const nextSection = sections[currentIndex + 1];
      const nextSearchTitle = nextSection.title.toLowerCase().trim();

      for (let i = sectionStartIndex; i < lines.length; i++) {
        const line = lines[i].toLowerCase().trim();

        // Use same multi-strategy matching for finding section end
        let isMatch = false;

        // Strategy 1: Exact match
        if (line === nextSearchTitle) {
          isMatch = true;
        }

        // Strategy 2: Line contains the full search title
        if (!isMatch && line.includes(nextSearchTitle) && nextSearchTitle.length > 5) {
          isMatch = true;
        }

        // Strategy 3: Search title contains the line
        if (!isMatch && nextSearchTitle.includes(line) && line.length > 5) {
          const matchRatio = line.length / nextSearchTitle.length;
          if (matchRatio > 0.5) {
            isMatch = true;
          }
        }

        // Strategy 4: Fuzzy match
        if (!isMatch && nextSearchTitle.length > 10 && line.length > 10) {
          const searchWords = nextSearchTitle.split(/\s+/).filter(w => w.length > 3);
          const lineWords = line.split(/\s+/).filter(w => w.length > 3);
          const matchingWords = searchWords.filter(sw => lineWords.some(lw => lw.includes(sw) || sw.includes(lw)));

          if (matchingWords.length >= searchWords.length * 0.6 && searchWords.length >= 2) {
            isMatch = true;
          }
        }

        // Strategy 5: All-words match - most aggressive
        if (!isMatch) {
          const searchWords = nextSearchTitle.split(/\s+/).filter(w => w.length > 2);
          const lineWords = line.split(/\s+/).filter(w => w.length > 2);

          if (searchWords.length >= 2) {
            const allWordsMatch = searchWords.every(sw =>
              lineWords.some(lw => lw === sw || lw.includes(sw) || sw.includes(lw))
            );

            if (allWordsMatch && line.length < 100) {
              isMatch = true;
            }
          }
        }

        if (isMatch) {
          sectionEndIndex = i;
          break;
        }
      }
    }

    // Extract the content
    const sectionLines = lines.slice(sectionStartIndex, sectionEndIndex);
    section.content = sectionLines
      .filter(line => line.trim().length > 0) // Remove empty lines
      .join('\n')
      .trim();

    console.log(`✅ Extracted ${section.content.length} chars for section: "${section.title}"`);
  }
};

/**
 * Extract sections from Table of Contents if present
 */
const extractSectionsFromTOC = (text: string): DocumentSection[] | null => {
  console.log('🔍 TOC Detection: Starting...');
  const lines = text.split('\n');
  console.log('🔍 TOC Detection: Total lines:', lines.length);
  console.log('🔍 TOC Detection: First 30 lines:', lines.slice(0, 30));
  const sections: DocumentSection[] = [];

  // Find TOC section
  let tocStartIndex = -1;
  let tocEndIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();

    // Look for TOC start
    if (tocStartIndex === -1 && (
      lowerLine === 'table of contents' ||
      lowerLine === 'contents' ||
      lowerLine === 'table des matières' || // French
      lowerLine === 'índice' || // Spanish/Portuguese
      lowerLine === 'index'
    )) {
      console.log('🔍 TOC Detection: Found TOC header at line', i, ':', line);
      tocStartIndex = i + 1; // Start after the TOC title
      continue;
    }

    // If we found TOC start, look for the end
    if (tocStartIndex !== -1 && tocEndIndex === -1) {
      // TOC usually ends when we hit a section that doesn't look like a TOC entry
      // OR when we see common document start patterns
      const isDocumentStart = /^(confidentiality|introduction|executive|overview|background|summary|preface|foreword|abstract)/i.test(line);
      const isTOCEntry = /^[A-Z].*?[\.\s]+\d+\s*$/.test(line) || // "Section Name .... 5"
                         /^[A-Z].*?\.{2,}\s*\d+\s*$/.test(line) || // "Section Name......5"
                         /^[\d\.]+\s+[A-Z]/.test(line); // "1.2 Section Name"

      // If we've seen at least 3 TOC entries and this doesn't look like one, end TOC
      if (sections.length >= 3 && !isTOCEntry) {
        tocEndIndex = i;
        break;
      }

      // Also end TOC after 100 lines to avoid parsing entire document
      if (i - tocStartIndex > 100) {
        tocEndIndex = i;
        break;
      }
    }
  }

  // If we didn't find a clear TOC, return null
  if (tocStartIndex === -1 || tocStartIndex >= lines.length - 2) {
    console.log('🔍 TOC Detection: No TOC found. tocStartIndex:', tocStartIndex, 'lines.length:', lines.length);
    return null;
  }

  console.log('🔍 TOC Detection: TOC found! tocStartIndex:', tocStartIndex);

  // If we didn't find an explicit end, use next 50 lines as TOC
  if (tocEndIndex === -1) {
    tocEndIndex = Math.min(tocStartIndex + 50, lines.length);
  }

  console.log('🔍 TOC Detection: Parsing TOC from line', tocStartIndex, 'to', tocEndIndex);

  // Parse TOC entries
  let sectionId = 0;
  for (let i = tocStartIndex; i < tocEndIndex; i++) {
    const line = lines[i].trim();

    if (!line || line.length < 3) continue;

    // Skip lines that are clearly not TOC entries
    // Skip lines that end with common prepositions or articles (likely sentence fragments)
    const lowerLine = line.toLowerCase();
    const fragmentEndings = ['our', 'for', 'the', 'and', 'with', 'that', 'this', 'are', 'has', 'have', 'its', 'from', 'into', 'upon', 'about', 'after', 'before', 'under', 'over'];
    const endsWithFragment = fragmentEndings.some(ending => {
      const pattern = new RegExp(`\\s${ending}$`, 'i');
      return pattern.test(lowerLine);
    });
    if (endsWithFragment) continue;

    // Skip lines that don't start with a capital letter or number
    if (!/^[A-Z0-9•]/.test(line)) continue;

    // TOC entry patterns - REQUIRE page number for valid TOC entry
    // 1. "Section Name ..... 5"
    // 2. "Section Name     5"
    // 3. "1.2 Section Name .... 5"
    // 4. "Section Name 5"

    // Try to extract section title and page number
    let title = '';
    let pageNum = -1;
    let level = 1;

    // Remove page number from end (digits possibly preceded by dots/spaces)
    const pageMatch = line.match(/^(.+?)[\s\.]{2,}(\d+)\s*$/);
    if (!pageMatch) {
      // No proper TOC pattern found, skip this line
      continue;
    }

    title = pageMatch[1].trim();
    pageNum = parseInt(pageMatch[2]);

    // Validate page number is reasonable (1-1000)
    if (pageNum < 1 || pageNum > 1000) continue;

    // Remove leading dots
    title = title.replace(/^\.+/, '').trim();

    // Determine indentation level (more spaces = deeper level)
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
    if (leadingSpaces >= 4) level = 3;
    else if (leadingSpaces >= 2) level = 2;
    else level = 1;

    // Remove numbering from title (1.2, 1.2.3, etc.)
    title = title.replace(/^\d+(\.\d+)*\.?\s+/, '').trim();
    // Remove bullet points
    title = title.replace(/^[•\-]\s+/, '').trim();

    // Skip if title is too short or looks invalid
    if (title.length < 3 || !/[A-Za-z]/.test(title)) continue;

    // Skip if title is too long (likely a sentence, not a section title)
    if (title.length > 80) continue;

    // Skip common TOC header repeats
    if (title.toLowerCase() === 'table of contents' ||
        title.toLowerCase() === 'contents' ||
        title.toLowerCase() === 'page') continue;

    // Additional validation: section titles shouldn't end with prepositions or articles
    const titleWords = title.split(/\s+/);
    const lastWord = titleWords[titleWords.length - 1]?.toLowerCase();
    if (fragmentEndings.includes(lastWord)) continue;

    sections.push({
      id: `section-${++sectionId}`,
      title,
      level,
      content: '', // Will be filled later if needed
      selected: true,
      pageNumber: pageNum > 0 ? pageNum : undefined
    });
  }

  console.log('🔍 TOC Detection: Parsed', sections.length, 'sections from TOC');

  // Fill in content for each section by matching titles in the full text
  if (sections.length > 0) {
    fillSectionContent(sections, text);
  }

  return sections.length > 0 ? sections : null;
};

/**
 * Extract sections from text based on common heading patterns
 * Enhanced with comprehensive pattern detection
 */
export const extractSectionsFromText = (text: string): DocumentSection[] => {
  // First, try to extract from Table of Contents
  const tocSections = extractSectionsFromTOC(text);
  if (tocSections && tocSections.length > 0) {
    console.log('✅ Sections extracted from Table of Contents:', tocSections.length);
    return tocSections;
  }

  console.log('ℹ️ No Table of Contents found, using pattern matching...');

  const sections: DocumentSection[] = [];
  const lines = text.split('\n');

  let currentSection: DocumentSection | null = null;
  let sectionContent: string[] = [];
  let sectionId = 0;

  // Calculate average line length to help detect headings
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const avgLineLength = nonEmptyLines.reduce((sum, l) => sum + l.trim().length, 0) / nonEmptyLines.length;

  const detectHeadingLevel = (line: string, nextLine?: string, prevLine?: string): number | null => {
    const trimmed = line.trim();

    // Skip very short lines (likely not headings)
    if (trimmed.length < 3) return null;

    // Skip lines that are too long (likely paragraphs, not headings)
    if (trimmed.length > 100) return null;

    // 1. Markdown headings: # Heading, ## Heading, etc.
    const mdMatch = trimmed.match(/^(#{1,6})\s+/);
    if (mdMatch) return mdMatch[1].length;

    // 2. ALL CAPS HEADINGS (minimum 3 chars, maximum 80 chars)
    if (/^[A-Z][A-Z\s&\-']{2,79}$/.test(trimmed) && trimmed.length <= 80) {
      return 1;
    }

    // 3. Multi-level numbered headings: 1.1, 1.2.3, etc.
    if (/^\d+(\.\d+)*\.?\s+[A-Z]/.test(trimmed)) {
      const dots = (trimmed.match(/\./g) || []).length;
      return Math.min(dots + 1, 6);
    }

    // 4. Simple numbered headings: 1. Heading, 1 Heading
    if (/^\d+\.?\s+[A-Z].{2,}$/.test(trimmed)) {
      return 2;
    }

    // 5. Chapter/Section/Part/Article keywords
    if (/^(Chapter|Section|Part|Article|Appendix)\s+[\dA-Z]+/i.test(trimmed)) {
      return 1;
    }

    // 6. Roman numerals: I., II., III., IV., etc.
    if (/^[IVXLCDM]+\.\s+[A-Z]/.test(trimmed)) {
      return 2;
    }

    // 7. Letter headings: A., B., C. or (a), (b), (c)
    if (/^[A-Z]\.\s+[A-Z].{2,}$/.test(trimmed) || /^\([a-z]\)\s+[A-Z].{2,}$/i.test(trimmed)) {
      return 3;
    }

    // 8. Title Case (Most Words Capitalized) - short lines only
    const words = trimmed.split(/\s+/);
    const capitalizedWords = words.filter(w => /^[A-Z]/.test(w));
    if (
      trimmed.length < avgLineLength * 0.7 && // Shorter than average
      words.length >= 2 &&
      words.length <= 12 && // Reasonable heading length
      capitalizedWords.length >= words.length * 0.6 && // Most words capitalized
      !trimmed.endsWith('.') && // Doesn't end with period
      !trimmed.endsWith(',') // Doesn't end with comma
    ) {
      return 2;
    }

    // 9. Lines ending with colon (often headings)
    if (
      /^[A-Z].{3,50}:$/.test(trimmed) && // Starts with capital, ends with colon
      trimmed.length < avgLineLength * 0.6 // Shorter than average
    ) {
      return 2;
    }

    // 10. Common heading keywords
    const headingKeywords = [
      'introduction', 'background', 'overview', 'summary', 'conclusion',
      'objective', 'purpose', 'scope', 'methodology', 'approach',
      'requirements', 'specifications', 'deliverables', 'timeline',
      'budget', 'costs', 'pricing', 'terms', 'conditions',
      'references', 'appendix', 'glossary', 'definitions'
    ];
    const lowerTrimmed = trimmed.toLowerCase();
    if (
      headingKeywords.some(keyword => lowerTrimmed === keyword) ||
      headingKeywords.some(keyword => lowerTrimmed.startsWith(keyword + ' '))
    ) {
      return 2;
    }

    // 11. Short lines (likely headings) followed by longer text
    if (
      trimmed.length < avgLineLength * 0.5 && // Much shorter than average
      trimmed.length >= 10 && // But not too short
      nextLine && nextLine.trim().length > trimmed.length * 1.5 && // Next line is longer
      /^[A-Z]/.test(trimmed) // Starts with capital
    ) {
      return 2;
    }

    // 12. Underlined headings (lines followed by ===== or -----)
    if (nextLine && /^[=\-_]{3,}$/.test(nextLine.trim())) {
      return nextLine.trim()[0] === '=' ? 1 : 2;
    }

    // 13. Bold markers in text (sometimes PDFs extract **text** or __text__)
    if (/^\*\*[^*]+\*\*$/.test(trimmed) || /^__[^_]+__$/.test(trimmed)) {
      return 2;
    }

    return null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    // Skip underline markers
    if (/^[=\-_]{3,}$/.test(line)) continue;

    const nextLine = i < lines.length - 1 ? lines[i + 1] : undefined;
    const prevLine = i > 0 ? lines[i - 1] : undefined;

    const level = detectHeadingLevel(line, nextLine, prevLine);

    if (level !== null) {
      // Save previous section
      if (currentSection) {
        currentSection.content = sectionContent.join('\n').trim();
        sections.push(currentSection);
      }

      // Clean the heading text
      let title = line
        .replace(/^#{1,6}\s+/, '')           // Remove markdown #
        .replace(/^\d+(\.\d+)*\.?\s+/, '')   // Remove numbers (including multi-level)
        .replace(/^[IVXLCDM]+\.\s+/, '')     // Remove roman numerals
        .replace(/^[A-Z]\.\s+/, '')          // Remove letter numbering
        .replace(/^\([a-z]\)\s+/i, '')       // Remove (a), (b) style
        .replace(/\*\*/g, '')                // Remove bold markers
        .replace(/__/g, '')                  // Remove underline markers
        .replace(/:$/, '')                   // Remove trailing colon
        .trim();

      // Start new section
      currentSection = {
        id: `section-${++sectionId}`,
        title: title || line,
        level,
        content: '',
        selected: true, // All sections selected by default
      };
      sectionContent = [];
    } else if (currentSection) {
      // Add to current section content
      sectionContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = sectionContent.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
};

/**
 * Extract sections from Word document
 */
export const extractSectionsFromWordDoc = async (arrayBuffer: ArrayBuffer): Promise<DocumentSection[]> => {
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;

    // Parse HTML to extract headings and content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const sections: DocumentSection[] = [];
    let sectionId = 0;
    let currentSection: DocumentSection | null = null;
    let contentElements: HTMLElement[] = [];

    const elements = Array.from(doc.body.children) as HTMLElement[];

    for (const element of elements) {
      const tagName = element.tagName.toLowerCase();

      // Check if it's a heading
      if (tagName.match(/^h[1-6]$/)) {
        // Save previous section
        if (currentSection) {
          currentSection.content = contentElements
            .map(el => el.textContent?.trim())
            .filter(Boolean)
            .join('\n\n');
          sections.push(currentSection);
        }

        // Start new section
        const level = parseInt(tagName.charAt(1));
        currentSection = {
          id: `section-${++sectionId}`,
          title: element.textContent?.trim() || `Section ${sectionId}`,
          level,
          content: '',
          selected: true,
        };
        contentElements = [];
      } else if (currentSection) {
        // Add to current section
        contentElements.push(element);
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = contentElements
        .map(el => el.textContent?.trim())
        .filter(Boolean)
        .join('\n\n');
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : [];
  } catch (error) {
    console.error('Error extracting sections from Word document:', error);
    return [];
  }
};

/**
 * Build hierarchical section structure from flat list
 */
export const buildSectionHierarchy = (sections: DocumentSection[]): DocumentSection[] => {
  if (sections.length === 0) return [];

  const root: DocumentSection[] = [];
  const stack: DocumentSection[] = [];

  for (const section of sections) {
    // Remove any children from previous processing
    section.children = [];

    // Find the right parent for this section
    while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Top level section
      root.push(section);
    } else {
      // Add as child to the last item in stack
      const parent = stack[stack.length - 1];
      if (!parent.children) parent.children = [];
      parent.children.push(section);
    }

    stack.push(section);
  }

  return root;
};

/**
 * Get selected sections content
 */
export const getSelectedSectionsContent = (sections: DocumentSection[]): string => {
  const collectContent = (sectionList: DocumentSection[]): string => {
    let content = '';

    for (const section of sectionList) {
      if (section.selected) {
        content += `\n\n## ${section.title}\n\n${section.content}`;
      }

      if (section.children && section.children.length > 0) {
        content += collectContent(section.children);
      }
    }

    return content;
  };

  return collectContent(sections).trim();
};

/**
 * Count selected sections
 */
export const countSelectedSections = (sections: DocumentSection[]): { selected: number; total: number } => {
  let selected = 0;
  let total = 0;

  const count = (sectionList: DocumentSection[]) => {
    for (const section of sectionList) {
      total++;
      if (section.selected) selected++;
      if (section.children) count(section.children);
    }
  };

  count(sections);
  return { selected, total };
};
