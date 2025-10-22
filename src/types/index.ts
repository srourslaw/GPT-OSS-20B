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