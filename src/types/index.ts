export interface Document {
  name: string;
  type: string;
  content: string;
  uploadedAt: Date;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  aiModel?: string;
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
}