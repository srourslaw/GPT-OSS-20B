import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '../utils/fontSizeExtension';
import PageBreak from '../utils/pageBreakExtension';
import SelectionToolbar from './SelectionToolbar';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  FileDown,
  Save,
  FileText,
  ZoomIn,
  ZoomOut,
  Type,
  Scissors,
  Palette,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface DraftEditorProps {
  content: string;
  onChange: (content: string) => void;
  onExportPDF?: () => void;
  onExportWord?: () => void;
  onExportHTML?: () => void;
  isStreaming?: boolean;
  onAIModify?: (instruction: string, selectedText: string) => Promise<string>;
}

interface Section {
  id: string;
  content: string;
  preview: string;
}

// Theme definitions with actual document styling
const documentThemes = {
  classic: {
    name: 'Classic',
    background: '#ffffff',
    text: '#374151',
    h1Style: `
      color: #1f2937;
      border-bottom: 3px solid #e0e7ff;
      padding-bottom: 0.5em;
      margin-bottom: 0.8em;
    `,
    h2Style: `
      color: #4f46e5;
      border-left: 4px solid #818cf8;
      padding-left: 0.5em;
      margin-top: 1.5em;
    `,
    h3Style: `
      color: #6366f1;
    `,
    h4Style: `
      color: #8b5cf6;
    `,
    code: '#8b5cf6',
    codeBg: '#f3f4f6',
    strong: '#1f2937',
    em: '#6b7280',
    link: '#2563eb',
  },
  modernBlue: {
    name: 'Modern Blue',
    background: '#f0f9ff',
    text: '#0c4a6e',
    h1Style: `
      color: #0369a1;
      background: linear-gradient(to right, #bae6fd, transparent);
      padding: 0.6em 0.8em;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(3, 105, 161, 0.1);
    `,
    h2Style: `
      color: #0284c7;
      border-bottom: 2px solid #7dd3fc;
      padding-bottom: 0.4em;
      position: relative;
    `,
    h3Style: `
      color: #0ea5e9;
      font-style: italic;
    `,
    h4Style: `
      color: #38bdf8;
    `,
    code: '#0284c7',
    codeBg: '#e0f2fe',
    strong: '#075985',
    em: '#0369a1',
    link: '#0284c7',
  },
  professionalPurple: {
    name: 'Professional Purple',
    background: '#faf5ff',
    text: '#581c87',
    h1Style: `
      color: #6b21a8;
      border-top: 4px solid #a78bfa;
      border-bottom: 4px solid #a78bfa;
      padding: 0.8em 0;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 700;
    `,
    h2Style: `
      color: #7c3aed;
      background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
      padding: 0.5em 1em;
      border-left: 6px solid #8b5cf6;
      border-radius: 4px;
    `,
    h3Style: `
      color: #8b5cf6;
      border-bottom: 2px dotted #c4b5fd;
      padding-bottom: 0.3em;
    `,
    h4Style: `
      color: #a78bfa;
    `,
    code: '#7c3aed',
    codeBg: '#f3e8ff',
    strong: '#6b21a8',
    em: '#7c3aed',
    link: '#8b5cf6',
  },
  vibrantGradient: {
    name: 'Vibrant Gradient',
    background: 'linear-gradient(to bottom, #fef3c7, #fce7f3, #ddd6fe)',
    text: '#1f2937',
    h1Style: `
      color: #dc2626;
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      padding: 1em;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(220, 38, 38, 0.1);
      text-align: center;
    `,
    h2Style: `
      color: #ea580c;
      border-left: 8px solid #fb923c;
      padding-left: 1em;
      background: linear-gradient(to right, #ffedd5, transparent);
      padding: 0.5em 0.5em 0.5em 1em;
    `,
    h3Style: `
      color: #d97706;
      text-decoration: underline;
      text-decoration-color: #fbbf24;
      text-decoration-thickness: 3px;
      text-underline-offset: 4px;
    `,
    h4Style: `
      color: #ca8a04;
    `,
    code: '#dc2626',
    codeBg: '#fef2f2',
    strong: '#991b1b',
    em: '#ea580c',
    link: '#dc2626',
  },
  minimalist: {
    name: 'Minimalist Gray',
    background: '#fafafa',
    text: '#404040',
    h1Style: `
      color: #171717;
      font-weight: 300;
      font-size: 2.5em;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 0.5em;
      margin-bottom: 1.5em;
    `,
    h2Style: `
      color: #262626;
      font-weight: 400;
      margin-top: 2em;
    `,
    h3Style: `
      color: #404040;
      font-weight: 500;
    `,
    h4Style: `
      color: #525252;
      font-weight: 600;
    `,
    code: '#171717',
    codeBg: '#f5f5f5',
    strong: '#171717',
    em: '#525252',
    link: '#404040',
  },
  warmSunset: {
    name: 'Warm Sunset',
    background: '#fff7ed',
    text: '#7c2d12',
    h1Style: `
      color: #9a3412;
      background: linear-gradient(to right, #fed7aa, #fdba74);
      padding: 0.8em 1.2em;
      border-radius: 50px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(154, 52, 18, 0.15);
    `,
    h2Style: `
      color: #c2410c;
      border-left: 6px solid #fb923c;
      border-bottom: 2px solid #fdba74;
      padding-left: 0.8em;
      padding-bottom: 0.4em;
    `,
    h3Style: `
      color: #ea580c;
      background: linear-gradient(to right, #ffedd5, transparent);
      padding: 0.3em 0.6em;
      border-radius: 4px;
    `,
    h4Style: `
      color: #fb923c;
    `,
    code: '#c2410c',
    codeBg: '#ffedd5',
    strong: '#9a3412',
    em: '#c2410c',
    link: '#ea580c',
  },
  oceanBreeze: {
    name: 'Ocean Breeze',
    background: '#ecfeff',
    text: '#134e4a',
    h1Style: `
      color: #115e59;
      background: linear-gradient(135deg, #99f6e4 0%, #5eead4 100%);
      padding: 1em;
      border-radius: 8px;
      box-shadow: 0 8px 16px rgba(17, 94, 89, 0.1);
      position: relative;
    `,
    h2Style: `
      color: #0f766e;
      border-bottom: 3px solid #2dd4bf;
      padding-bottom: 0.5em;
      background: linear-gradient(to right, #ccfbf1, transparent);
      padding-left: 0.5em;
    `,
    h3Style: `
      color: #14b8a6;
      border-left: 4px solid #5eead4;
      padding-left: 0.5em;
    `,
    h4Style: `
      color: #2dd4bf;
    `,
    code: '#0f766e',
    codeBg: '#ccfbf1',
    strong: '#115e59',
    em: '#0f766e',
    link: '#14b8a6',
  },
};

type ThemeKey = keyof typeof documentThemes;

const DraftEditor: React.FC<DraftEditorProps> = ({
  content,
  onChange,
  onExportPDF,
  onExportWord,
  onExportHTML,
  isStreaming = false,
  onAIModify
}) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [zoom, setZoom] = useState(100); // Zoom percentage
  const [fontSize, setFontSize] = useState(12); // Base font size in px (default 12px)
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('classic');
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [fontFamily, setFontFamily] = useState('Arial'); // Default font family
  const [selectedText, setSelectedText] = useState('');
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const [themeButtonPosition, setThemeButtonPosition] = useState<{ top: number; right: number } | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement }>({});
  const themeButtonRef = useRef<HTMLButtonElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize.configure({
        types: ['textStyle'],
      }),
      PageBreak,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
    editable: !isStreaming,
  });

  // Automatically parse content into pages based on height
  useEffect(() => {
    if (!editor || !content) {
      setSections([]);
      return;
    }

    // Standard page height in pixels (11 inches at 96 DPI = ~1056px, accounting for margins)
    const PAGE_HEIGHT = 1100;

    // Get the editor DOM element
    const editorElement = editor.view.dom;

    if (!editorElement) {
      setSections([{
        id: 'page-1',
        content: content,
        preview: 'Page 1'
      }]);
      return;
    }

    // Calculate how many pages based on content height
    const contentHeight = editorElement.scrollHeight;
    const pageCount = Math.max(1, Math.ceil(contentHeight / PAGE_HEIGHT));

    // Create page sections
    const parsedSections: Section[] = Array.from({ length: pageCount }, (_, index) => ({
      id: `page-${index + 1}`,
      content: content,
      preview: `Page ${index + 1}`
    }));

    setSections(parsedSections);
    if (parsedSections.length > 0 && !activeSectionId) {
      setActiveSectionId(parsedSections[0].id);
    }
  }, [content, editor]);

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Disable/enable editor based on streaming state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isStreaming);
    }
  }, [isStreaming, editor]);

  // Track text selection for AI modification
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');

      if (text && text.trim().length > 0) {
        setSelectedText(text);

        // Get the position of the selection to position the toolbar
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);

        // Calculate center position of selection
        const centerX = (start.left + end.left) / 2;
        const topY = Math.min(start.top, end.top);

        setToolbarPosition({
          top: topY,
          left: centerX
        });
      } else {
        setSelectedText('');
        setToolbarPosition(null);
      }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor]);

  // Handle AI text modification
  const handleAIModify = async (instruction: string, selectedText: string) => {
    if (!editor || !onAIModify) return;

    try {
      // Capture the current selection and formatting
      const { from, to, $from } = editor.state.selection;

      // Check if this is a formatting action
      const isFormattingAction = instruction.includes('FORMATTING_ACTION');

      // Get the marks (formatting) from the selected text
      const marks = $from.marks();

      // Get the parent node to check if we're in a special block (heading, list, etc.)
      const parentNode = $from.parent;
      const nodeType = parentNode.type.name;
      const nodeAttrs = parentNode.attrs;

      // Get the AI's modified version
      const modifiedText = await onAIModify(instruction, selectedText);

      // Delete the selected text
      editor.chain().focus().deleteRange({ from, to }).run();

      // Get the new cursor position after deletion
      const newPos = editor.state.selection.from;

      if (isFormattingAction) {
        // For formatting actions, convert line breaks into proper paragraphs
        const lines = modifiedText.split('\n').filter(line => line.trim() !== '');

        // Build content with proper structure
        const content: any[] = [];

        lines.forEach((line) => {
          const trimmedLine = line.trim();

          // Check if it's a numbered list item (starts with number followed by . or ))
          const numberMatch = trimmedLine.match(/^(\d+)[\.\)]\s+(.+)$/);

          if (numberMatch) {
            // It's a numbered list item
            content.push({
              type: 'paragraph',
              content: [{ type: 'text', text: trimmedLine }]
            });
          } else if (trimmedLine) {
            // Regular paragraph
            content.push({
              type: 'paragraph',
              content: [{ type: 'text', text: trimmedLine }]
            });
          }
        });

        // Insert the structured content
        editor.chain().focus().insertContent(content).run();
      } else {
        // For non-formatting actions, preserve original formatting
        // Insert the modified text
        editor.chain().focus().insertContent(modifiedText).run();

        // Select the newly inserted text to apply formatting
        const newTo = editor.state.selection.from;
        editor.chain()
          .focus()
          .setTextSelection({ from: newPos, to: newTo })
          .run();

        // Reapply all the original marks (bold, italic, underline, etc.)
        marks.forEach((mark) => {
          editor.chain().focus().setMark(mark.type.name, mark.attrs).run();
        });

        // If the original text was in a heading, list, or other block type, maintain that
        if (nodeType === 'heading' && nodeAttrs?.level) {
          editor.chain().focus().setNode('heading', { level: nodeAttrs.level }).run();
        }
      }

      // Move cursor to the end
      const finalPos = editor.state.selection.from;
      editor.commands.setTextSelection(finalPos);

      // Close the toolbar
      setSelectedText('');
      setToolbarPosition(null);
    } catch (error) {
      console.error('Error modifying text:', error);
    }
  };

  // Scroll to section (handles both manual sections and automatic pages)
  const scrollToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);

    // Check if it's a virtual page (e.g., "page-1", "page-2")
    const pageMatch = sectionId.match(/^page-(\d+)$/);
    if (pageMatch && editorContainerRef.current && editor) {
      const pageNumber = parseInt(pageMatch[1], 10);
      const PAGE_HEIGHT = 1100;
      const targetScrollTop = (pageNumber - 1) * PAGE_HEIGHT;

      editorContainerRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
      return;
    }

    // Otherwise, try to find the element by ref (for manual sections)
    const element = sectionRefs.current[sectionId];
    if (element && editorContainerRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200)); // Max 200%
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50)); // Min 50%
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  // Font size controls
  const handleIncreaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 1, 20)); // Max 20px
  };

  const handleDecreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 1, 10)); // Min 10px
  };

  const handleResetFontSize = () => {
    setFontSize(12); // Reset to default 12px
  };

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    title,
    children
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent selection loss
        if (!disabled) {
          onClick(); // Execute the command
        }
      }}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-all duration-200 ${
        active
          ? 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 shadow-md'
          : 'hover:bg-gray-100 text-gray-700 hover:shadow-sm'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 mx-1" />;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white/90 backdrop-blur-sm border-b-2 border-indigo-100 p-2 flex items-center gap-1 shadow-lg relative z-10">
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-0.5 flex-nowrap">
        {/* Font Family Selector */}
        <select
          value={fontFamily}
          onChange={(e) => {
            const font = e.target.value;
            setFontFamily(font);
            editor?.chain().focus().setFontFamily(font).run();
          }}
          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white hover:bg-gray-50 transition-colors"
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Tahoma">Tahoma</option>
          <option value="Trebuchet MS">Trebuchet MS</option>
          <option value="Comic Sans MS">Comic Sans MS</option>
          <option value="Impact">Impact</option>
          <option value="Palatino">Palatino</option>
        </select>

        <Divider />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Page Break */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setPageBreak().run()}
          title="Insert Page Break"
        >
          <Scissors className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Text Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Zoom Controls */}
        <ToolbarButton
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </ToolbarButton>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleResetZoom();
          }}
          className="px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          title="Reset Zoom"
        >
          {zoom}%
        </button>
        <ToolbarButton
          onClick={handleZoomIn}
          disabled={zoom >= 200}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Font Size Controls */}
        <ToolbarButton
          onClick={handleDecreaseFontSize}
          disabled={fontSize <= 10}
          title="Decrease Font Size"
        >
          <Type className="h-3 w-3" />
        </ToolbarButton>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleResetFontSize();
          }}
          className="px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          title="Reset Font Size (12px)"
        >
          {fontSize}px
        </button>
        <ToolbarButton
          onClick={handleIncreaseFontSize}
          disabled={fontSize >= 20}
          title="Increase Font Size"
        >
          <Type className="h-5 w-5" />
        </ToolbarButton>

        </div>
        </div>

        {/* Right side fixed buttons (non-scrollable) */}
        <div className="flex items-center gap-1 shrink-0">
        {/* Theme Selector */}
        <div className="relative">
          <button
            ref={themeButtonRef}
            onMouseDown={(e) => {
              e.preventDefault();
              if (themeButtonRef.current) {
                const rect = themeButtonRef.current.getBoundingClientRect();
                setThemeButtonPosition({
                  top: rect.bottom + 8,
                  right: window.innerWidth - rect.right
                });
              }
              setShowThemeDropdown(!showThemeDropdown);
            }}
            className="px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
            title="Change Document Theme"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden md:inline">{documentThemes[selectedTheme].name}</span>
          </button>
        </div>


        {/* Export Buttons */}
        {onExportPDF && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onExportPDF();
            }}
            className="px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            title="Export as PDF"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden md:inline">PDF</span>
          </button>
        )}
        {onExportWord && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onExportWord();
            }}
            className="px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            title="Export as Word Document"
          >
            <Save className="h-4 w-4" />
            <span className="hidden md:inline">Word</span>
          </button>
        )}
        {onExportHTML && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onExportHTML();
            }}
            className="px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            title="Export as HTML"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden md:inline">HTML</span>
          </button>
        )}
        </div>
      </div>

      {/* Main Content Area with Thumbnails and Editor */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Show Thumbnails Button - appears when hidden */}
        {!showThumbnails && sections.length > 0 && (
          <button
            onClick={() => setShowThumbnails(true)}
            className="absolute left-2 top-4 z-20 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-md p-1.5 border border-gray-300 shadow-sm hover:shadow transition-all"
            title="Show page thumbnails"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Thumbnails Sidebar */}
        {showThumbnails && sections.length > 0 && (
          <div className="w-40 bg-gradient-to-b from-gray-50 to-gray-100 border-r-2 border-indigo-100 overflow-y-auto p-3 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-gradient-to-r from-indigo-200 to-purple-200">
              <h3 className="text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Pages
              </h3>
              <button
                onClick={() => setShowThumbnails(false)}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full p-1 transition-all"
                title="Hide thumbnails"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className="relative group"
                >
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full rounded-lg border-2 transition-all text-left shadow-md hover:shadow-lg overflow-hidden ${
                      activeSectionId === section.id
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg ring-2 ring-indigo-300'
                        : 'border-gray-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    {/* Page number badge */}
                    <div className={`absolute top-1 left-1 z-10 w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shadow-sm ${
                      activeSectionId === section.id
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                        : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Mini page preview - Portrait style like a real page */}
                    <div className="h-44 w-full rounded-lg overflow-hidden bg-white">
                      <div
                        className="text-[3px] leading-tight p-2 overflow-hidden h-full"
                        style={{
                          background: 'white',
                          border: '1px solid #e5e7eb'
                        }}
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    </div>
                  </button>

                  {/* Close button on hover - top right corner */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowThumbnails(false);
                    }}
                    className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-all z-20"
                    title="Hide thumbnails"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editor Content - A4 Page like Microsoft Word */}
        <div className="flex-1 overflow-auto bg-gray-200 p-8" ref={editorContainerRef}>
          <div
            className="mx-auto shadow-xl editor-page draft-editor-container"
            style={{
              width: '210mm', // A4 width (8.27 inches)
              minHeight: '297mm', // A4 height (11.69 inches)
              padding: '25.4mm 31.75mm', // 1 inch top/bottom, 1.25 inches left/right (Word default margins)
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.3s ease',
              marginBottom: zoom < 100 ? '0' : `${(zoom - 100) * 5}px`,
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
              boxSizing: 'border-box',
              background: documentThemes[selectedTheme].background
            }}
          >
            <style>{`
              .draft-editor-container .ProseMirror {
                color: ${documentThemes[selectedTheme].text};
              }
              .draft-editor-container .ProseMirror h1 {
                ${documentThemes[selectedTheme].h1Style}
              }
              .draft-editor-container .ProseMirror h2 {
                ${documentThemes[selectedTheme].h2Style}
              }
              .draft-editor-container .ProseMirror h3 {
                ${documentThemes[selectedTheme].h3Style}
              }
              .draft-editor-container .ProseMirror h4 {
                ${documentThemes[selectedTheme].h4Style}
              }
              .draft-editor-container .ProseMirror strong {
                color: ${documentThemes[selectedTheme].strong};
              }
              .draft-editor-container .ProseMirror em {
                color: ${documentThemes[selectedTheme].em};
              }
              .draft-editor-container .ProseMirror code {
                color: ${documentThemes[selectedTheme].code};
                background: ${documentThemes[selectedTheme].codeBg};
              }
              .draft-editor-container .ProseMirror a {
                color: ${documentThemes[selectedTheme].link};
              }
              .draft-editor-container .ProseMirror p {
                color: ${documentThemes[selectedTheme].text};
              }
              .draft-editor-container .ProseMirror li {
                color: ${documentThemes[selectedTheme].text};
              }
              .draft-editor-container .ProseMirror blockquote {
                border-left: 4px solid ${documentThemes[selectedTheme].link};
                padding-left: 1em;
                margin: 1em 0;
                font-style: italic;
                opacity: 0.9;
              }
              .draft-editor-container .ProseMirror hr {
                border: none;
                height: 2px;
                background: ${documentThemes[selectedTheme].link};
                opacity: 0.3;
                margin: 2em 0;
              }
            `}</style>
            <EditorContent editor={editor} />
            {isStreaming && (
              <div className="mt-4">
                <span className="inline-block w-2 h-5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse"></span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Selection Toolbar for AI Modifications */}
      {onAIModify && (
        <SelectionToolbar
          selectedText={selectedText}
          position={toolbarPosition}
          onModify={handleAIModify}
          onClose={() => {
            setSelectedText('');
            setToolbarPosition(null);
          }}
        />
      )}

      {/* Theme Dropdown Portal - Rendered at document root to avoid z-index issues */}
      {showThemeDropdown && themeButtonPosition && createPortal(
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px]"
          style={{
            top: `${themeButtonPosition.top}px`,
            right: `${themeButtonPosition.right}px`,
            zIndex: 99999
          }}
        >
          {Object.entries(documentThemes).map(([key, theme]) => (
            <button
              key={key}
              onMouseDown={(e) => {
                e.preventDefault();
                setSelectedTheme(key as ThemeKey);
                setShowThemeDropdown(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${
                selectedTheme === key ? 'bg-purple-50 font-semibold' : ''
              }`}
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-gray-300"
                style={{ background: theme.background }}
              />
              <span>{theme.name}</span>
              {selectedTheme === key && (
                <span className="ml-auto text-purple-600">✓</span>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default DraftEditor;
