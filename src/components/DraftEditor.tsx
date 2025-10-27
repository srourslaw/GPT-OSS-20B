import React, { useState, useEffect, useRef } from 'react';
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
  Scissors
} from 'lucide-react';

interface DraftEditorProps {
  content: string;
  onChange: (content: string) => void;
  onExportPDF?: () => void;
  onExportWord?: () => void;
  isStreaming?: boolean;
  onAIModify?: (instruction: string, selectedText: string) => Promise<string>;
}

interface Section {
  id: string;
  content: string;
  preview: string;
}

const DraftEditor: React.FC<DraftEditorProps> = ({
  content,
  onChange,
  onExportPDF,
  onExportWord,
  isStreaming = false,
  onAIModify
}) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [zoom, setZoom] = useState(100); // Zoom percentage
  const [fontSize, setFontSize] = useState(12); // Base font size in px (default 12px)
  const [fontFamily, setFontFamily] = useState('Arial'); // Default font family
  const [selectedText, setSelectedText] = useState('');
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement }>({});

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

      // Move cursor to the end of the modified text
      editor.commands.setTextSelection(newTo);

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
      className={`p-2.5 rounded-lg transition-all duration-200 ${
        active
          ? 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 shadow-md'
          : 'hover:bg-gray-100 text-gray-700 hover:shadow-sm'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 mx-2" />;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Toolbar */}
      <div className="bg-white/90 backdrop-blur-sm border-b-2 border-indigo-100 p-3 flex items-center gap-1 flex-wrap shadow-lg">
        {/* Font Family Selector */}
        <select
          value={fontFamily}
          onChange={(e) => {
            const font = e.target.value;
            setFontFamily(font);
            editor?.chain().focus().setFontFamily(font).run();
          }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white hover:bg-gray-50 transition-colors"
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
          className="px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
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
          className="px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Thumbnails Toggle */}
        {sections.length > 0 && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setShowThumbnails(!showThumbnails);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg ${
              showThumbnails
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
            }`}
            title={showThumbnails ? 'Hide thumbnails' : 'Show thumbnails'}
          >
            <FileText className="h-4 w-4" />
            {showThumbnails ? 'Hide' : 'Show'} Sections
          </button>
        )}

        {/* Export Buttons */}
        {onExportPDF && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onExportPDF();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            title="Export as PDF"
          >
            <FileDown className="h-4 w-4" />
            PDF
          </button>
        )}
        {onExportWord && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onExportWord();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            title="Export as Word Document"
          >
            <Save className="h-4 w-4" />
            Word
          </button>
        )}
      </div>

      {/* Main Content Area with Thumbnails and Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnails Sidebar */}
        {showThumbnails && sections.length > 0 && (
          <div className="w-56 bg-gradient-to-b from-gray-50 to-gray-100 border-r-2 border-indigo-100 overflow-y-auto p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gradient-to-r from-indigo-200 to-purple-200">
              <h3 className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                Sections
              </h3>
              <span className="text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">{sections.length}</span>
            </div>
            <div className="space-y-3">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left shadow-md hover:shadow-lg ${
                    activeSectionId === section.id
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm ${
                      activeSectionId === section.id
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                        : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium line-clamp-3 break-words ${
                        activeSectionId === section.id ? 'text-indigo-900' : 'text-gray-600'
                      }`}>
                        {section.preview}
                      </div>
                    </div>
                  </div>
                  {/* Mini preview of content */}
                  <div className="mt-2 h-16 bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-inner">
                    <div
                      className="text-[6px] leading-tight p-1 overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                      style={{ zoom: 0.3, transformOrigin: 'top left' }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Editor Content - A4 Page like Microsoft Word */}
        <div className="flex-1 overflow-auto bg-gray-200 p-8" ref={editorContainerRef}>
          <div
            className="mx-auto bg-white shadow-xl editor-page draft-editor-container"
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
              boxSizing: 'border-box'
            }}
          >
            <EditorContent editor={editor} />
            {isStreaming && (
              <div className="mt-4">
                <span className="inline-block w-2 h-5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse"></span>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Thumbnails Button (when hidden) */}
        {!showThumbnails && (
          <button
            onClick={() => setShowThumbnails(true)}
            className="fixed left-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-2 border-white rounded-r-2xl p-3 shadow-2xl transition-all z-10 hover:scale-110"
            title="Show thumbnails"
          >
            <FileText className="h-5 w-5" />
          </button>
        )}
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
    </div>
  );
};

export default DraftEditor;
