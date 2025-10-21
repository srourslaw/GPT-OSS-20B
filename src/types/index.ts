export interface Document {
  name: string;
  type: string;
  content: string;
  uploadedAt: Date;
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