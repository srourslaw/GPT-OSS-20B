import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  ChevronDown,
  ChevronRight,
  FileText,
  CheckSquare,
  Square,
  Trash2,
  File,
  AlertCircle,
  Eye,
  Copy,
  ChevronsDown,
  ChevronsRight,
  X
} from 'lucide-react';
import { Document, LibraryDocument, DocumentSection } from '../types';
import { validateFile } from '../utils/fileHelpers';
import { processDocument, processPDFWithSections } from '../services/documentService';
import { extractSectionsFromText, extractSectionsFromWordDoc, buildSectionHierarchy } from '../utils/sectionExtractor';

interface DocumentLibraryProps {
  documents: LibraryDocument[];
  onDocumentsChange: (documents: LibraryDocument[]) => void;
}

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ documents, onDocumentsChange }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState(384); // 384px = w-96
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate total selected sections and words
  const calculateStats = () => {
    let totalSections = 0;
    let totalWords = 0;
    let docsWithSelections = 0;

    documents.forEach(libDoc => {
      if (libDoc.selectedSectionIds.length > 0) {
        docsWithSelections++;
        totalSections += libDoc.selectedSectionIds.length;

        // Calculate words from selected sections
        const countWords = (sections: DocumentSection[]): void => {
          sections.forEach(section => {
            if (libDoc.selectedSectionIds.includes(section.id)) {
              // Improved word count - handle empty/null content and extraction failures
              if (section.content && typeof section.content === 'string') {
                const trimmed = section.content.trim();

                // Skip placeholder text from failed extractions
                if (!trimmed.startsWith('[Content for') || !trimmed.includes('could not be extracted]')) {
                  if (trimmed.length > 0) {
                    const words = trimmed.split(/\s+/).filter(word => word.length > 0);
                    totalWords += words.length;
                  }
                }
              }
            }
            if (section.children) {
              countWords(section.children);
            }
          });
        };

        if (libDoc.document.sections) {
          countWords(libDoc.document.sections);
        }
      }
    });

    return { totalSections, totalWords, docsWithSelections };
  };

  const stats = calculateStats();

  // Handle resizing with useCallback to avoid recreating functions
  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newPreviewWidth = containerRect.right - e.clientX;
      // Clamp between 300px and 800px
      const clampedWidth = Math.max(300, Math.min(800, newPreviewWidth));
      setPreviewWidth(clampedWidth);
    }
  }, []);

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Add/remove mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mousemove', handleResizeMouseMove);
      window.addEventListener('mouseup', handleResizeMouseUp);
      return () => {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', handleResizeMouseMove);
        window.removeEventListener('mouseup', handleResizeMouseUp);
      };
    }
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  // Handle multiple file upload
  const handleFiles = async (files: FileList) => {
    setError(null);
    setUploading(true);

    const newDocuments: LibraryDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const validation = validateFile(file);
      if (!validation.isValid) {
        setError(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        const isPDF = file.type === 'application/pdf';
        const isImage = file.type.startsWith('image/') ||
          file.name.endsWith('.png') ||
          file.name.endsWith('.jpg') ||
          file.name.endsWith('.jpeg');
        const isWordDoc = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type === 'application/msword';
        const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls');

        // Use special PDF processing for PDFs to get font-based sections
        let result: any;
        let pdfSections: any[] | undefined;

        if (isPDF) {
          console.log('📄 Using font-based section detection for PDF');
          const pdfResult = await processPDFWithSections(file);
          result = { content: pdfResult.content };
          pdfSections = pdfResult.sections;
        } else {
          result = await processDocument(file);
        }

        let imageData: string | undefined;
        let fileBlob: string | undefined;

        if (isImage) {
          imageData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

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
          wordArrayBuffer: result.arrayBuffer,
          isExcel,
          excelData: result.excelData,
          sectionMode: 'selected' // Library always uses selected mode
        };

        // Extract sections
        try {
          if (isPDF && pdfSections && pdfSections.length > 0) {
            // Use font-based sections for PDF
            console.log(`✅ Using ${pdfSections.length} font-based sections for PDF`);
            document.sections = buildSectionHierarchy(pdfSections);
          } else if (isWordDoc && result.arrayBuffer) {
            const sections = await extractSectionsFromWordDoc(result.arrayBuffer);
            if (sections.length > 0) {
              document.sections = buildSectionHierarchy(sections);
            }
          } else if (!isImage && !isExcel && result.content) {
            const sections = extractSectionsFromText(result.content);
            if (sections.length > 0) {
              document.sections = buildSectionHierarchy(sections);
            }
          }
        } catch (sectionError) {
          console.error('Failed to extract sections:', sectionError);
        }

        newDocuments.push({
          id: `lib-doc-${Date.now()}-${i}`,
          document,
          isExpanded: true, // Expand by default
          selectedSectionIds: [] // No sections selected by default
        });
      } catch (err) {
        setError(`Failed to process ${file.name}`);
      }
    }

    onDocumentsChange([...documents, ...newDocuments]);
    setUploading(false);
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Toggle document expansion
  const toggleExpand = (docId: string) => {
    onDocumentsChange(
      documents.map(doc =>
        doc.id === docId ? { ...doc, isExpanded: !doc.isExpanded } : doc
      )
    );
  };

  // Toggle section selection
  const toggleSection = (docId: string, sectionId: string) => {
    onDocumentsChange(
      documents.map(doc => {
        if (doc.id === docId) {
          const isSelected = doc.selectedSectionIds.includes(sectionId);
          const newSelected = isSelected
            ? doc.selectedSectionIds.filter(id => id !== sectionId)
            : [...doc.selectedSectionIds, sectionId];

          return { ...doc, selectedSectionIds: newSelected };
        }
        return doc;
      })
    );
  };

  // Remove document
  const removeDocument = (docId: string) => {
    onDocumentsChange(documents.filter(doc => doc.id !== docId));
  };

  // Select all sections in a document
  const selectAllSections = (docId: string) => {
    onDocumentsChange(
      documents.map(doc => {
        if (doc.id === docId && doc.document.sections) {
          const allSectionIds: string[] = [];
          const collectIds = (sections: DocumentSection[]) => {
            sections.forEach(section => {
              allSectionIds.push(section.id);
              if (section.children) {
                collectIds(section.children);
              }
            });
          };
          collectIds(doc.document.sections);
          return { ...doc, selectedSectionIds: allSectionIds };
        }
        return doc;
      })
    );
  };

  // Clear all selections
  const clearAllSelections = () => {
    console.log('🔴 Clearing all selections');
    onDocumentsChange(
      documents.map(doc => ({ ...doc, selectedSectionIds: [] }))
    );
  };

  // Select all sections across all documents
  const selectAllSectionsGlobal = () => {
    console.log('✅ Selecting all sections globally');
    onDocumentsChange(
      documents.map(doc => {
        if (doc.document.sections) {
          const allSectionIds: string[] = [];
          const collectIds = (sections: DocumentSection[]) => {
            sections.forEach(section => {
              allSectionIds.push(section.id);
              if (section.children) {
                collectIds(section.children);
              }
            });
          };
          collectIds(doc.document.sections);
          return { ...doc, selectedSectionIds: allSectionIds };
        }
        return doc;
      })
    );
  };

  // Clear all documents from library
  const clearAllDocuments = () => {
    console.log('🗑️ Clearing all documents from library');
    onDocumentsChange([]);
  };

  // Toggle expand/collapse all documents
  const toggleExpandAll = () => {
    const allExpanded = documents.every(doc => doc.isExpanded);
    onDocumentsChange(
      documents.map(doc => ({ ...doc, isExpanded: !allExpanded }))
    );
  };

  // Check if all documents are expanded
  const allExpanded = documents.length > 0 && documents.every(doc => doc.isExpanded);

  // Render section tree with checkboxes
  const renderSectionTree = (
    sections: DocumentSection[],
    docId: string,
    selectedIds: string[],
    level: number = 0
  ): React.ReactNode => {
    return sections.map(section => {
      const isSelected = selectedIds.includes(section.id);

      // Improved word count calculation with better handling
      let wordCount = 0;
      let contentStatus = 'empty';

      if (section.content && typeof section.content === 'string') {
        const trimmed = section.content.trim();

        // Check if this is a placeholder for failed extraction
        if (trimmed.startsWith('[Content for') && trimmed.includes('could not be extracted]')) {
          contentStatus = 'extraction-failed';
        } else if (trimmed.length > 0) {
          // Split by whitespace and filter out empty strings
          const words = trimmed.split(/\s+/).filter(word => word.length > 0);
          wordCount = words.length;
          contentStatus = 'ok';
        }
      }

      return (
        <div key={section.id} style={{ marginLeft: `${level * 16}px` }}>
          <div
            className="flex items-start gap-2 py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer group"
            onClick={() => toggleSection(docId, section.id)}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Square className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                {section.title}
              </p>
              <p className={`text-xs ${contentStatus === 'extraction-failed' ? 'text-orange-600' : 'text-gray-500'}`}>
                {contentStatus === 'extraction-failed' && '⚠️ Content extraction failed'}
                {contentStatus === 'empty' && 'No content detected'}
                {contentStatus === 'ok' && `${wordCount.toLocaleString()} words`}
                {section.pageNumber && ` • Page ${section.pageNumber}`}
              </p>
            </div>
          </div>
          {section.children && section.children.length > 0 && (
            <div className="mt-1">
              {renderSectionTree(section.children, docId, selectedIds, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-2 bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-900">📚 Document Library</h3>
          <div className="flex items-center gap-1.5">
            {stats.totalSections > 0 && (
              <div className="px-2 py-0.5 bg-blue-100 rounded border border-blue-300">
                <span className="text-xs font-medium text-blue-800">
                  <Eye className="h-3 w-3 inline mr-0.5" />
                  {stats.totalSections}
                </span>
              </div>
            )}
            <span className="text-xs text-gray-600">{documents.length} doc{documents.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div
          className={`relative border border-dashed rounded p-2 transition-colors ${
            dragActive
              ? 'border-purple-400 bg-purple-50'
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
            multiple
          />

          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <p className="text-xs text-gray-600">Processing...</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Upload className="h-4 w-4 text-gray-400" />
              <p className="text-xs text-gray-600">
                Drop or{' '}
                <button
                  onClick={onButtonClick}
                  className="text-purple-600 hover:text-purple-700 font-medium underline"
                >
                  browse
                </button>
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-1 flex items-center text-red-600 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
          </div>
        )}
      </div>

      {/* Two Column Layout - Library on Left, Preview on Right */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* Left Column - Library */}
        <div className="flex-1 flex flex-col" style={{ marginRight: `${previewWidth}px` }}>
          <div className="flex-shrink-0 px-3 py-2 bg-purple-50 border-b border-purple-200 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-purple-900">📚 Documents</h4>
            </div>
            {documents.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleExpandAll}
                  className="text-xs text-purple-600 hover:bg-purple-50 font-medium px-2 py-1 rounded border border-purple-200 transition-colors flex items-center gap-1"
                  title={allExpanded ? "Collapse all documents" : "Expand all documents"}
                >
                  {allExpanded ? (
                    <>
                      <ChevronsRight className="h-3 w-3" />
                      Collapse All
                    </>
                  ) : (
                    <>
                      <ChevronsDown className="h-3 w-3" />
                      Expand All
                    </>
                  )}
                </button>
                <button
                  onClick={selectAllSectionsGlobal}
                  className="text-xs text-blue-600 hover:bg-blue-50 font-medium px-2 py-1 rounded border border-blue-200 transition-colors flex items-center gap-1"
                  title="Select all sections in all documents"
                >
                  <CheckSquare className="h-3 w-3" />
                  Select All
                </button>
                <button
                  onClick={clearAllDocuments}
                  className="text-xs text-red-600 hover:bg-red-50 font-medium px-2 py-1 rounded border border-red-200 transition-colors flex items-center gap-1"
                  title="Remove all documents from library"
                >
                  <X className="h-3 w-3" />
                  Clear All
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <File className="h-12 w-12 mb-2 text-gray-300" />
                <p className="text-sm font-medium mb-1">No documents yet</p>
                <p className="text-xs text-center">Upload multiple documents to create your library</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
            {documents.map(libDoc => {
              const hasSelections = libDoc.selectedSectionIds.length > 0;
              const hasSections = libDoc.document.sections && libDoc.document.sections.length > 0;

              return (
                <div
                  key={libDoc.id}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    hasSelections ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Document Header */}
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100">
                    <button
                      onClick={() => toggleExpand(libDoc.id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {libDoc.isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <FileText className="h-4 w-4 text-purple-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {libDoc.document.name}
                      </p>
                      {hasSections && (
                        <p className="text-xs text-gray-600">
                          {libDoc.selectedSectionIds.length} / {libDoc.document.sections!.length} sections selected
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {hasSections && (
                        <button
                          onClick={() => selectAllSections(libDoc.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-100 rounded"
                          title="Select all sections"
                        >
                          Select All
                        </button>
                      )}
                      <button
                        onClick={() => removeDocument(libDoc.id)}
                        className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                        title="Remove document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Document Sections */}
                  {libDoc.isExpanded && (
                    <div className="p-2 bg-white">
                      {hasSections ? (
                        renderSectionTree(
                          libDoc.document.sections!,
                          libDoc.id,
                          libDoc.selectedSectionIds
                        )
                      ) : (
                        <div className="text-xs text-gray-500 p-3 text-center">
                          No sections detected in this document
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className={`absolute top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize z-10 transition-colors ${
            isResizing ? 'bg-blue-500' : ''
          }`}
          style={{ right: `${previewWidth}px` }}
          onMouseDown={handleResizeMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-gray-400 rounded-full"></div>
        </div>

        {/* Right Column - Preview */}
        <div
          className="absolute top-0 bottom-0 right-0 flex flex-col bg-gradient-to-b from-blue-50 to-purple-50 border-l border-gray-300"
          style={{ width: `${previewWidth}px` }}
        >
          <div className="flex-shrink-0 px-3 py-2 bg-blue-100 border-b border-blue-200">
            <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Selected Preview
            </h4>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {stats.totalSections === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
                <Eye className="h-12 w-12 mb-2 text-gray-300" />
                <p className="text-sm font-medium mb-1">No sections selected</p>
                <p className="text-xs text-center">Select sections from documents to preview them here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {documents.map((libDoc) => {
              if (libDoc.selectedSectionIds.length === 0) return null;

              const collectSelectedSections = (sections: DocumentSection[]): Array<{ section: DocumentSection; depth: number }> => {
                const result: Array<{ section: DocumentSection; depth: number }> = [];
                const collect = (sectionList: DocumentSection[], depth: number = 0) => {
                  sectionList.forEach(section => {
                    if (libDoc.selectedSectionIds.includes(section.id)) {
                      result.push({ section, depth });
                    }
                    if (section.children && section.children.length > 0) {
                      collect(section.children, depth + 1);
                    }
                  });
                };
                if (libDoc.document.sections) {
                  collect(libDoc.document.sections);
                }
                return result;
              };

              const selectedSections = collectSelectedSections(libDoc.document.sections || []);

              return (
                <div key={libDoc.id} className="mb-8 last:mb-0">
                  {/* Document Header */}
                  <div className="mb-4 pb-3 border-b-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-bold text-gray-900">{libDoc.document.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 ml-7">
                      {selectedSections.length} section{selectedSections.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>

                  {/* Sections */}
                  <div className="space-y-6">
                    {selectedSections.map(({ section, depth }) => {
                      const wordCount = section.content ? section.content.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

                      return (
                        <div key={section.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200" style={{ marginLeft: `${depth * 16}px` }}>
                          {/* Section Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-gray-900 mb-1">
                                {section.title}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <span>{wordCount.toLocaleString()} words</span>
                                {section.pageNumber && <span>• Page {section.pageNumber}</span>}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${section.title}\n\n${section.content}`);
                              }}
                              className="text-gray-400 hover:text-blue-600 p-1 hover:bg-white rounded transition-colors"
                              title="Copy section to clipboard"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Section Content */}
                          <div className="text-sm text-gray-700 leading-relaxed bg-white rounded p-3 border border-gray-200 max-h-64 overflow-auto">
                            <pre className="whitespace-pre-wrap font-sans">{section.content}</pre>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Footer with stats and actions */}
      {stats.totalSections > 0 && (
        <div className="flex-shrink-0 border-t-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-900">
                ✓ {stats.totalSections} section{stats.totalSections !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-gray-600">
                from {stats.docsWithSelections} document{stats.docsWithSelections !== 1 ? 's' : ''} • ~{stats.totalWords.toLocaleString()} words
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Collect all selected content
                  let allContent = '';
                  documents.forEach(libDoc => {
                    if (libDoc.selectedSectionIds.length > 0) {
                      allContent += `\n\n=== ${libDoc.document.name} ===\n\n`;
                      const collectContent = (sections: DocumentSection[]) => {
                        sections.forEach(section => {
                          if (libDoc.selectedSectionIds.includes(section.id)) {
                            allContent += `\n## ${section.title}\n\n${section.content}\n`;
                          }
                          if (section.children) {
                            collectContent(section.children);
                          }
                        });
                      };
                      if (libDoc.document.sections) {
                        collectContent(libDoc.document.sections);
                      }
                    }
                  });
                  navigator.clipboard.writeText(allContent.trim());
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                Copy All
              </button>
              <button
                onClick={clearAllSelections}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 hover:bg-red-50 rounded border border-red-200"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;
