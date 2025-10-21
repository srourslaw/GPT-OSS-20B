import React from 'react';
import { File, Calendar, Type } from 'lucide-react';
import { Document } from '../types';
import { formatFileSize } from '../utils/fileHelpers';

interface DocumentViewerProps {
  document: Document;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document }) => {
  return (
    <div className="w-full">
      {/* Document Metadata */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <File className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">{document.name}</h3>
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
      <div className="document-viewer max-h-[400px] overflow-y-auto">
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
              className="w-full h-[500px] border-0"
              title={document.name}
            />
          </div>
        )}

        {/* Show image preview if it's an image file */}
        {document.isImage && document.imageData && (
          <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src={document.imageData}
              alt={document.name}
              className="w-full h-auto max-h-[300px] object-contain bg-gray-50"
            />
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                📷 Image Preview • OCR text extracted below
              </p>
            </div>
          </div>
        )}

        {/* Show formatted HTML for Word documents */}
        {document.isWordDoc && document.htmlContent && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-purple-50 border-b border-purple-200">
              <p className="text-xs text-purple-800 font-medium">
                📝 Formatted Document View • Text extracted for AI analysis
              </p>
            </div>
            <div
              className="prose prose-sm max-w-none p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: document.htmlContent }}
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