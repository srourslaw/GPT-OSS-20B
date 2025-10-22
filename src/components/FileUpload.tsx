import React, { useState, useRef } from 'react';
import { Upload, File, AlertCircle, CheckCircle } from 'lucide-react';
import { Document } from '../types';
import { validateFile, formatFileSize } from '../utils/fileHelpers';
import { processDocument } from '../services/documentService';

interface FileUploadProps {
  onDocumentUpload: (document: Document) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDocumentUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const result = await processDocument(file);

      // Check file types
      const isImage = file.type.startsWith('image/') ||
        file.name.endsWith('.png') ||
        file.name.endsWith('.jpg') ||
        file.name.endsWith('.jpeg');

      const isPDF = file.type === 'application/pdf';

      const isWordDoc = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword';

      let imageData: string | undefined;
      let fileBlob: string | undefined;

      // If it's an image, convert to base64 for display
      if (isImage) {
        imageData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // If it's a PDF, create a blob URL for native PDF viewer
      if (isPDF) {
        fileBlob = URL.createObjectURL(file);
      }

      const document: Document = {
        name: file.name,
        type: file.type,
        content: result.content,
        uploadedAt: new Date(),
        imageData,
        isImage,
        fileBlob,
        htmlContent: result.htmlContent,
        isPDF,
        isWordDoc,
        wordArrayBuffer: result.arrayBuffer // Store ArrayBuffer for native Word rendering
      };

      onDocumentUpload(document);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to process file');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv,.json,.png,.jpg,.jpeg"
          onChange={handleChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Processing file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop your document here, or{' '}
              <button
                onClick={onButtonClick}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-500">
              Supports PDF, Word, Excel, CSV, JSON, TXT, and Images (PNG, JPG) up to 50MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-3 flex items-center text-green-600 text-sm">
          <CheckCircle className="h-4 w-4 mr-2" />
          File uploaded successfully!
        </div>
      )}
    </div>
  );
};

export default FileUpload;