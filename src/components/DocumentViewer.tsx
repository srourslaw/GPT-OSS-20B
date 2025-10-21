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
        {document.content ? (
          <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed pr-2">
            {document.content}
          </div>
        ) : (
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