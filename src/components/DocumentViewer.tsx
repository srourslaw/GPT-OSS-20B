import React, { useEffect, useRef, useState } from 'react';
import { File, Calendar, Type, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Document } from '../types';
import { renderAsync } from 'docx-preview';

interface DocumentViewerProps {
  document: Document;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document }) => {
  const wordDocContainerRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [imageZoom, setImageZoom] = useState(100);
  const [wordZoom, setWordZoom] = useState(100);

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

        <div className="mt-2 text-sm text-gray-600">
          Content length: {document.content.length.toLocaleString()} characters
        </div>
      </div>

      {/* Document Content */}
      <div
        className={`document-viewer overflow-y-auto transition-all duration-300 ${
          isMaximized ? 'max-h-[80vh]' : 'max-h-[50vh]'
        }`}
      >
        {/* Show PDF viewer for PDF files */}
        {document.isPDF && document.fileBlob && (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
              <p className="text-xs text-blue-800 font-medium">
                📄 Native PDF Viewer • Text extracted for AI analysis
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
              <p className="text-xs text-gray-600">
                📷 Image Preview • OCR text extracted below
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
              <p className="text-xs text-purple-800 font-medium">
                📝 Native Word Document View • Full formatting preserved including colors and highlights
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

        {/* Show plain text content for other formats or if native view not available */}
        {!document.isPDF && !document.isWordDoc && document.content ? (
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