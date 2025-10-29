import React, { useEffect, useRef, useState } from 'react';
import { File, Calendar, Type, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, List, FileText } from 'lucide-react';
import { Document, DocumentSection } from '../types';
import { renderAsync } from 'docx-preview';
import SectionSelector from './SectionSelector';
import { countSelectedSections } from '../utils/sectionExtractor';

interface DocumentViewerProps {
  document: Document;
  onDocumentUpdate?: (document: Document) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onDocumentUpdate }) => {
  const wordDocContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [imageZoom, setImageZoom] = useState(100);
  const [wordZoom, setWordZoom] = useState(100);
  const [excelZoom, setExcelZoom] = useState(100);
  const [activeSheet, setActiveSheet] = useState(0);
  const [showSections, setShowSections] = useState(() => {
    return !!(document.sections && document.sections.length > 0);
  });
  const [sectionMode, setSectionMode] = useState<'full' | 'selected'>(document.sectionMode || 'full');

  const hasSections = !!(document.sections && document.sections.length > 0);

  // Sync section mode when document changes
  useEffect(() => {
    setSectionMode(document.sectionMode || 'full');
    setShowSections(hasSections);
  }, [document.name, document.uploadedAt, hasSections]); // Re-run when document changes

  // Zoom handlers - 10% increments for fine control
  const handleImageZoomIn = () => setImageZoom(prev => Math.min(prev + 10, 400));
  const handleImageZoomOut = () => setImageZoom(prev => Math.max(prev - 10, 50));
  const handleImageZoomReset = () => setImageZoom(100);
  const handleImageZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageZoom(Number(e.target.value));
  };

  const handleWordZoomIn = () => setWordZoom(prev => Math.min(prev + 10, 400));
  const handleWordZoomOut = () => setWordZoom(prev => Math.max(prev - 10, 50));
  const handleWordZoomReset = () => setWordZoom(100);
  const handleWordZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWordZoom(Number(e.target.value));
  };

  const handleExcelZoomIn = () => setExcelZoom(prev => Math.min(prev + 10, 400));
  const handleExcelZoomOut = () => setExcelZoom(prev => Math.max(prev - 10, 50));
  const handleExcelZoomReset = () => setExcelZoom(100);
  const handleExcelZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExcelZoom(Number(e.target.value));
  };

  // Section handlers
  const handleSectionsChange = (sections: DocumentSection[]) => {
    if (onDocumentUpdate) {
      onDocumentUpdate({ ...document, sections });
    }
  };

  const toggleSectionMode = () => {
    const newMode = sectionMode === 'full' ? 'selected' : 'full';
    setSectionMode(newMode);
    if (onDocumentUpdate) {
      onDocumentUpdate({ ...document, sectionMode: newMode });
    }
  };

  // Handle section click - scroll to section
  const handleSectionClick = (sectionId: string) => {
    console.log('🔍 handleSectionClick called with ID:', sectionId);
    console.log('  📄 Document type:', {
      isPDF: document.isPDF,
      isWordDoc: document.isWordDoc,
      isExcel: document.isExcel,
      isImage: document.isImage
    });

    // For Word documents, try to find the section heading in the rendered content
    if (document.isWordDoc && wordDocContainerRef.current) {
      console.log('  📝 Word doc - searching for section');
      const headings = wordDocContainerRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
      const section = document.sections?.find(s => s.id === sectionId);
      console.log('  📝 Found section:', section?.title);
      console.log('  📝 Total headings found:', headings.length);
      if (section) {
        for (const heading of Array.from(headings)) {
          if (heading.textContent?.trim().includes(section.title.trim())) {
            console.log('  ✅ Found matching heading, scrolling!');
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Highlight briefly
            heading.classList.add('bg-yellow-200');
            setTimeout(() => heading.classList.remove('bg-yellow-200'), 2000);
            break;
          }
        }
      }
    }

    // For text content with rendered sections (including PDFs in text mode)
    if (!document.isWordDoc && !document.isExcel && contentContainerRef.current) {
      console.log('  📄 Text content - searching for section element');
      const element = contentContainerRef.current.querySelector(`[data-section-id="${sectionId}"]`);
      console.log('  📄 Found element:', element);
      if (element) {
        console.log('  ✅ Found section element, scrolling!');
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Highlight briefly
        element.classList.add('bg-yellow-100', 'border-l-4', 'border-yellow-400', 'pl-2', 'transition-all');
        setTimeout(() => {
          element.classList.remove('bg-yellow-100', 'border-l-4', 'border-yellow-400', 'pl-2');
        }, 2000);
      } else if (document.isPDF) {
        // PDF is in native iframe mode - can't scroll
        console.log('  ⚠️ PDF in native viewer mode - switch to "Sections" mode to enable scrolling');
      }
    }
  };

  // Helper function to convert column index to Excel letter (0 -> A, 1 -> B, etc.)
  const getColumnLetter = (index: number): string => {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode(65 + (index % 26)) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  };

  // Render Word document with docx-preview when component mounts or document changes
  useEffect(() => {
    if (document.isWordDoc && document.wordArrayBuffer && wordDocContainerRef.current) {
      // Clear previous content
      wordDocContainerRef.current.innerHTML = '';

      // Render the Word document with full formatting preservation
      renderAsync(document.wordArrayBuffer, wordDocContainerRef.current, undefined, {
        className: 'docx-preview-container',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: true,
        experimental: true,
        trimXmlDeclaration: true,
        useBase64URL: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
      }).catch((error) => {
        console.error('Error rendering Word document:', error);
        if (wordDocContainerRef.current) {
          wordDocContainerRef.current.innerHTML = '<p class="text-red-600">Failed to render Word document. Please try a different browser or file format.</p>';
        }
      });
    }
  }, [document.isWordDoc, document.wordArrayBuffer]);

  return (
    <div className="w-full">
      {/* Document Controls */}
      <div className="border-b border-gray-200 pb-2 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Type className="h-3 w-3" />
            <span>{document.type.split('/').pop()}</span>
            <span>•</span>
            <Calendar className="h-3 w-3" />
            <span>{document.uploadedAt.toLocaleDateString()}</span>
            <span>•</span>
            <span>{(document.content.length / 1000).toFixed(1)}k chars</span>
          </div>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
        </div>

        {hasSections && (
          <div className="flex items-center justify-between gap-2">
            {/* Section Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded p-0.5">
              <button
                onClick={() => {
                  setSectionMode('full');
                  if (onDocumentUpdate) {
                    onDocumentUpdate({ ...document, sectionMode: 'full' });
                  }
                }}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  sectionMode === 'full'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="h-3 w-3 inline mr-0.5" />
                Full
              </button>
              <button
                onClick={() => {
                  setSectionMode('selected');
                  if (onDocumentUpdate) {
                    onDocumentUpdate({ ...document, sectionMode: 'selected' });
                  }
                }}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  sectionMode === 'selected'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-3 w-3 inline mr-0.5" />
                Sections ({countSelectedSections(document.sections!).selected}/{countSelectedSections(document.sections!).total})
              </button>
            </div>

            {/* Toggle Sections Sidebar */}
            <button
              onClick={() => setShowSections(!showSections)}
              className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              {showSections ? 'Hide' : 'Show'}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area with Sections Sidebar */}
      <div className="flex gap-2">
        {/* Sections Sidebar */}
        {hasSections && showSections && (
          <div className="w-64 flex-shrink-0 border border-gray-200 rounded-lg bg-white overflow-hidden">
            <SectionSelector
              sections={document.sections!}
              onSectionsChange={handleSectionsChange}
              onSectionClick={handleSectionClick}
            />
          </div>
        )}

        {/* Document Content */}
        <div
          ref={contentContainerRef}
          className={`flex-1 document-viewer overflow-y-auto transition-all duration-300 ${
            isMaximized ? 'max-h-[80vh]' : 'max-h-[50vh]'
          }`}
        >
        {/* Show PDF viewer for PDF files */}
        {document.isPDF && document.fileBlob && (
          <>
            {/* Show extracted text with sections if in section mode and has sections */}
            {hasSections && sectionMode === 'selected' ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-4">
                <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-800 font-medium flex items-center gap-1.5">
                    <span className="text-base">📄</span>
                    <span>PDF Text Content (Extracted)</span>
                  </p>
                </div>
                <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                  {document.sections ? (
                    <div>
                      {(() => {
                        const renderSectionContent = (sections: DocumentSection[]): JSX.Element[] => {
                          const elements: JSX.Element[] = [];
                          sections.forEach(section => {
                            elements.push(
                              <div
                                key={section.id}
                                data-section-id={section.id}
                                className="scroll-mt-4 mb-6"
                              >
                                <h3 className="font-bold text-base text-gray-900 mb-2 pb-1 border-b-2 border-blue-300">
                                  {section.title}
                                </h3>
                                <div className="text-sm text-gray-800 pl-2">
                                  {section.content}
                                </div>
                              </div>
                            );
                            if (section.children && section.children.length > 0) {
                              elements.push(...renderSectionContent(section.children));
                            }
                          });
                          return elements;
                        };
                        return renderSectionContent(document.sections);
                      })()}
                    </div>
                  ) : (
                    document.content
                  )}
                </div>
              </div>
            ) : (
              // Show native PDF viewer
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
                  <p className="text-xs text-blue-800 font-medium flex items-center gap-1.5">
                    <span className="text-base">📄</span>
                    <span>PDF Document (Native Viewer)</span>
                  </p>
                </div>
                <iframe
                  src={document.fileBlob}
                  className={`w-full border-0 transition-all duration-300 ${
                    isMaximized ? 'h-[75vh]' : 'h-[45vh]'
                  }`}
                  title={document.name}
                />
              </div>
            )}
          </>
        )}

        {/* Show image preview if it's an image file */}
        {document.isImage && document.imageData && (
          <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            {/* Zoom Controls for Image */}
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <p className="text-xs text-gray-700 font-medium flex items-center gap-1.5">
                <span className="text-base">
                  {document.name.toLowerCase().endsWith('.png') ? '🖼️' :
                   document.name.toLowerCase().endsWith('.jpg') || document.name.toLowerCase().endsWith('.jpeg') ? '📸' : '🖼️'}
                </span>
                <span>{document.name.toLowerCase().endsWith('.png') ? 'PNG' :
                       document.name.toLowerCase().endsWith('.jpg') || document.name.toLowerCase().endsWith('.jpeg') ? 'JPG' : 'Image'} File</span>
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-700 font-semibold min-w-[3rem] text-center">{imageZoom}%</span>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="5"
                  value={imageZoom}
                  onChange={handleImageZoomChange}
                  className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  title={`Zoom: ${imageZoom}%`}
                />
                <div className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1 shadow-sm">
                  <button
                    onClick={handleImageZoomOut}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Zoom out (-10%)"
                    disabled={imageZoom <= 50}
                  >
                    <ZoomOut className="h-4 w-4 text-gray-700" />
                  </button>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <button
                    onClick={handleImageZoomReset}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Reset to 100%"
                  >
                    <RotateCcw className="h-4 w-4 text-gray-700" />
                  </button>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <button
                    onClick={handleImageZoomIn}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Zoom in (+10%)"
                    disabled={imageZoom >= 400}
                  >
                    <ZoomIn className="h-4 w-4 text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-auto bg-gray-50">
              <img
                src={document.imageData}
                alt={document.name}
                className={`h-auto object-contain transition-all duration-300 ${
                  isMaximized ? 'max-h-[70vh]' : 'max-h-[40vh]'
                }`}
                style={{
                  transform: `scale(${imageZoom / 100})`,
                  transformOrigin: 'top left',
                  width: `${100 * (100 / imageZoom)}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Show native Word document viewer with full formatting */}
        {document.isWordDoc && document.wordArrayBuffer && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Zoom Controls for Word */}
            <div className="px-3 py-2 bg-purple-50 border-b border-purple-200 flex items-center justify-between">
              <p className="text-xs text-purple-800 font-medium flex items-center gap-1.5">
                <span className="text-base">📝</span>
                <span>Word Document</span>
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-purple-800 font-semibold min-w-[3rem] text-center">{wordZoom}%</span>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="5"
                  value={wordZoom}
                  onChange={handleWordZoomChange}
                  className="w-32 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  title={`Zoom: ${wordZoom}%`}
                />
                <div className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1 shadow-sm">
                  <button
                    onClick={handleWordZoomOut}
                    className="p-1.5 hover:bg-purple-100 rounded transition-colors"
                    title="Zoom out (-10%)"
                    disabled={wordZoom <= 50}
                  >
                    <ZoomOut className="h-4 w-4 text-purple-700" />
                  </button>
                  <div className="w-px h-4 bg-purple-300"></div>
                  <button
                    onClick={handleWordZoomReset}
                    className="p-1.5 hover:bg-purple-100 rounded transition-colors"
                    title="Reset to 100%"
                  >
                    <RotateCcw className="h-4 w-4 text-purple-700" />
                  </button>
                  <div className="w-px h-4 bg-purple-300"></div>
                  <button
                    onClick={handleWordZoomIn}
                    className="p-1.5 hover:bg-purple-100 rounded transition-colors"
                    title="Zoom in (+10%)"
                    disabled={wordZoom >= 400}
                  >
                    <ZoomIn className="h-4 w-4 text-purple-700" />
                  </button>
                </div>
              </div>
            </div>
            <div
              ref={wordDocContainerRef}
              className={`p-4 bg-white overflow-auto transition-all duration-300 ${
                isMaximized ? 'max-h-[75vh]' : 'max-h-[45vh]'
              }`}
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                transform: `scale(${wordZoom / 100})`,
                transformOrigin: 'top left',
                width: `${100 * (100 / wordZoom)}%`
              }}
            />
          </div>
        )}

        {/* Show native Excel spreadsheet viewer */}
        {document.isExcel && document.excelData && document.excelData.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Zoom Controls for Excel */}
            <div className="px-3 py-2 bg-green-50 border-b border-green-200 flex items-center justify-between">
              <p className="text-xs text-green-800 font-medium flex items-center gap-1.5">
                <span className="text-base">📊</span>
                <span>Excel Spreadsheet{document.excelData.length > 1 ? ` • ${document.excelData.length} sheets` : ''}</span>
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-green-800 font-semibold min-w-[3rem] text-center">{excelZoom}%</span>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="5"
                  value={excelZoom}
                  onChange={handleExcelZoomChange}
                  className="w-32 h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  title={`Zoom: ${excelZoom}%`}
                />
                <div className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1 shadow-sm">
                  <button
                    onClick={handleExcelZoomOut}
                    className="p-1.5 hover:bg-green-100 rounded transition-colors"
                    title="Zoom out (-10%)"
                    disabled={excelZoom <= 50}
                  >
                    <ZoomOut className="h-4 w-4 text-green-700" />
                  </button>
                  <div className="w-px h-4 bg-green-300"></div>
                  <button
                    onClick={handleExcelZoomReset}
                    className="p-1.5 hover:bg-green-100 rounded transition-colors"
                    title="Reset to 100%"
                  >
                    <RotateCcw className="h-4 w-4 text-green-700" />
                  </button>
                  <div className="w-px h-4 bg-green-300"></div>
                  <button
                    onClick={handleExcelZoomIn}
                    className="p-1.5 hover:bg-green-100 rounded transition-colors"
                    title="Zoom in (+10%)"
                    disabled={excelZoom >= 400}
                  >
                    <ZoomIn className="h-4 w-4 text-green-700" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sheet Tabs */}
            {document.excelData.length > 1 && (
              <div className="flex gap-1 px-2 py-2 bg-gray-100 border-b border-gray-300">
                {document.excelData.map((sheet, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSheet(index)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      activeSheet === index
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {sheet.name}
                  </button>
                ))}
              </div>
            )}

            {/* Spreadsheet View */}
            <div
              className={`overflow-auto bg-white transition-all duration-300 ${
                isMaximized ? 'max-h-[75vh]' : 'max-h-[45vh]'
              }`}
              style={{
                transform: `scale(${excelZoom / 100})`,
                transformOrigin: 'top left',
                width: `${100 * (100 / excelZoom)}%`
              }}
            >
              {document.excelData[activeSheet] && document.excelData[activeSheet].data.length > 0 && (
                <table className="border-collapse w-full text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 top-0 bg-gray-100 border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 z-20 w-12"></th>
                      {Array.from({ length: document.excelData[activeSheet].colCount }, (_, colIndex) => (
                        <th
                          key={colIndex}
                          className="sticky top-0 bg-gray-100 border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 z-10 min-w-[120px]"
                        >
                          {getColumnLetter(colIndex)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {document.excelData[activeSheet].data.map((row: any[], rowIndex) => {
                      // Ensure row has the correct number of columns
                      const normalizedRow = Array.from({ length: document.excelData[activeSheet].colCount }, (_, i) =>
                        i < row.length ? row[i] : ''
                      );

                      return (
                        <tr key={rowIndex}>
                          <td className="sticky left-0 bg-gray-100 border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 text-center z-10">
                            {rowIndex + 1}
                          </td>
                          {normalizedRow.map((cell, colIndex) => (
                            <td
                              key={colIndex}
                              className="border border-gray-300 px-2 py-1 text-gray-800 hover:bg-blue-50 transition-colors whitespace-nowrap min-w-[120px]"
                            >
                              {cell !== null && cell !== undefined && cell !== '' ? String(cell) : ''}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Show plain text content for other formats or if native view not available */}
        {!document.isPDF && !document.isWordDoc && !document.isExcel && document.content ? (
          <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed pr-2">
            {hasSections && document.sections ? (
              // Render sections with IDs for scrolling
              <div>
                {(() => {
                  const renderSectionContent = (sections: DocumentSection[]): JSX.Element[] => {
                    const elements: JSX.Element[] = [];
                    sections.forEach(section => {
                      elements.push(
                        <div
                          key={section.id}
                          data-section-id={section.id}
                          className="scroll-mt-4"
                        >
                          <h3 className="font-bold text-base text-gray-900 mb-2 mt-4 border-b pb-1">
                            {section.title}
                          </h3>
                          <div className="text-sm text-gray-800">
                            {section.content}
                          </div>
                        </div>
                      );
                      if (section.children && section.children.length > 0) {
                        elements.push(...renderSectionContent(section.children));
                      }
                    });
                    return elements;
                  };
                  return renderSectionContent(document.sections);
                })()}
              </div>
            ) : (
              // Fallback to plain content if no sections
              document.content
            )}
          </div>
        ) : null}

        {/* Show error message if no content */}
        {!document.content && !document.htmlContent && !document.fileBlob && !document.imageData && (
          <div className="text-center text-gray-500 py-8">
            <File className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No content available</p>
            <p className="text-sm">The document might be empty or failed to process</p>
          </div>
        )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <button
          onClick={() => navigator.clipboard.writeText(document.content)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
        >
          Copy content
        </button>
      </div>
    </div>
  );
};

export default DocumentViewer;