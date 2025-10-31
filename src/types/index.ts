export interface DocumentSection {
  id: string;
  title: string;
  level: number; // Heading level (1, 2, 3, etc.)
  content: string;
  startPage?: number; // For PDFs
  endPage?: number;
  pageNumber?: number; // Page number from TOC
  selected: boolean; // Whether this section is selected
  children?: DocumentSection[]; // Nested sections
}

export interface Document {
  name: string;
  type: string;
  content: string;
  uploadedAt: Date;
  imageData?: string; // Base64 image data for screenshots/images
  isImage?: boolean; // Flag to indicate if this is an image file
  fileBlob?: string; // Blob URL for native viewing (PDFs, etc.)
  htmlContent?: string; // Formatted HTML content for Word docs
  isPDF?: boolean; // Flag to indicate if this is a PDF file
  isWordDoc?: boolean; // Flag to indicate if this is a Word document
  wordArrayBuffer?: ArrayBuffer; // ArrayBuffer for native Word doc rendering with docx-preview
  isExcel?: boolean; // Flag to indicate if this is an Excel file
  excelData?: ExcelSheet[]; // Structured Excel data for native spreadsheet viewing
  sections?: DocumentSection[]; // Extracted document sections
  sectionMode?: 'full' | 'selected'; // Whether to use full document or selected sections
}

export interface ExcelSheet {
  name: string;
  data: any[][]; // 2D array of cell values
  rowCount: number;
  colCount: number;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie';
  title?: string;
  data: any[];
  xKey?: string;
  yKeys?: string[];
  colors?: string[];
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  aiModel?: string;
  chartData?: ChartData[];
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export interface AIResponse {
  text: string;
  model: string;
  timestamp: Date;
  chartData?: ChartData[];
}

export type ChatMode = 'general' | 'document';

export interface ChatModeOption {
  id: ChatMode;
  name: string;
  description: string;
  icon: string;
}

// Chat History Types
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
}

export interface ChatHistory {
  sessions: ChatSession[];
  activeSessionId: string | null;
}

// Canvas Types
export type WindowType = 'chat' | 'document' | 'notes' | 'web' | 'draft' | 'library';

export interface CanvasWindow {
  id: string;
  type: WindowType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  data?: any; // Window-specific data (chat messages, document content, etc.)
}

export interface CanvasLayout {
  windows: CanvasWindow[];
  nextZIndex: number;
}

// Document Library Types
export interface LibraryDocument {
  id: string;
  document: Document;
  isExpanded: boolean;
  selectedSectionIds: string[]; // IDs of selected sections
}

export interface DocumentLibrary {
  documents: LibraryDocument[];
}