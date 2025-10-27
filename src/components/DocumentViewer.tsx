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
  console.log('🔵 DocumentViewer MOUNTED/RENDERED for:', document.name);
  console.log('  📊 Document sections:', document.sections);
  console.log('  📊 Sections count:', document.sections?.length || 0);
  console.log('  📊 Section mode:', document.sectionMode);
  console.log('  📊 Upload time:', document.uploadedAt);

  const wordDocContainerRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [imageZoom, setImageZoom] = useState(100);
  const [wordZoom, setWordZoom] = useState(100);
  const [excelZoom, setExcelZoom] = useState(100);
  const [activeSheet, setActiveSheet] = useState(0);
  const [showSections, setShowSections] = useState(() => {
    const initial = !!(document.sections && document.sections.length > 0);
    console.log('  🎬 Initial showSections state:', initial);
    return initial;
  });
  const [sectionMode, setSectionMode] = useState<'full' | 'selected'>(document.sectionMode || 'full');

  const hasSections = !!(document.sections && document.sections.length > 0);
  console.log('  ✅ hasSections computed:', hasSections);

  // Sync section mode when document changes
  useEffect(() => {
    console.log('🔄 useEffect TRIGGERED!');
    console.log('  📄 Document name:', document.name);
    console.log('  📄 Has sections:', hasSections);
    console.log('  📄 Document.sections:', document.sections);
    console.log('  📄 Current showSections state:', showSections);
    console.log('  📄 About to set showSections to:', hasSections);

    setSectionMode(document.sectionMode || 'full');
    setShowSections(hasSections);

    console.log('  ✅ State update commands issued');
  }, [document.name, document.uploadedAt, hasSections]); // Re-run when document changes

  // Component unmount
  useEffect(() => {
    return () => {
      console.log('🔴 DocumentViewer UNMOUNTED for:', document.name);
    };
  }, [document.name]);

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
      {/* Document Metadata with Maximize Button */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <File className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">{document.name}</h3>
          </div>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title={isMaximized ? "Minimize viewer" : "Maximize viewer"}
          >
            {isMaximized ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                Minimize
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                Maximize
              </>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Type className="h-4 w-4" />
            <span>{document.type}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{document.uploadedAt.toLocaleDateString()}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Content length: {document.content.length.toLocaleString()} characters
          </div>

          {/* Section Controls */}
          {(() => {
            console.log('🎛️ TOGGLE BUTTONS CHECK:');
            console.log('  📊 hasSections:', hasSections);
            console.log('  📊 Will render toggle buttons:', hasSections ? 'YES ✅' : 'NO ❌');
            return null;
          })()}
          {hasSections && (
            <div className="flex items-center gap-2">
              {/* Section Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    console.log('🔘 Full Document button clicked');
                    setSectionMode('full');
                    if (onDocumentUpdate) {
                      onDocumentUpdate({ ...document, sectionMode: 'full' });
                      console.log('✅ Document updated to full mode');
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    sectionMode === 'full'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 inline mr-1" />
                  Full Document
                </button>
                <button
                  onClick={() => {
                    console.log('🔘 Sections button clicked');
                    setSectionMode('selected');
                    if (onDocumentUpdate) {
                      onDocumentUpdate({ ...document, sectionMode: 'selected' });
                      console.log('✅ Document updated to selected mode');
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    sectionMode === 'selected'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="h-3.5 w-3.5 inline mr-1" />
                  Sections ({countSelectedSections(document.sections!).selected}/{countSelectedSections(document.sections!).total})
                </button>
              </div>

              {/* Toggle Sections Sidebar */}
              <button
                onClick={() => setShowSections(!showSections)}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {showSections ? 'Hide' : 'Show'} Sections
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area with Sections Sidebar */}
      <div className="flex gap-4">
        {/* Sections Sidebar */}
        {(() => {
          console.log('🎨 RENDER TIME CHECK:');
          console.log('  📊 hasSections:', hasSections);
          console.log('  📊 showSections:', showSections);
          console.log('  📊 Condition (hasSections && showSections):', hasSections && showSections);
          console.log('  📊 Will render sidebar:', hasSections && showSections ? 'YES ✅' : 'NO ❌');
          return null;
        })()}
        {hasSections && showSections && (
          <div className="w-64 flex-shrink-0 border border-gray-200 rounded-lg bg-white overflow-hidden">
            <SectionSelector
              sections={document.sections!}
              onSectionsChange={handleSectionsChange}
            />
          </div>
        )}

        {/* Document Content */}
        <div
          className={`flex-1 document-viewer overflow-y-auto transition-all duration-300 ${
            isMaximized ? 'max-h-[80vh]' : 'max-h-[50vh]'
          }`}
        >
        {/* Show PDF viewer for PDF files */}
        {document.isPDF && document.fileBlob && (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
              <p className="text-xs text-blue-800 font-medium flex items-center gap-1.5">
                <span className="text-base">📄</span>
                <span>PDF Document</span>
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
            {document.content}
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
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => navigator.clipboard.writeText(document.content)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Copy content to clipboard
        </button>
      </div>
    </div>
  );
};

export default DocumentViewer;