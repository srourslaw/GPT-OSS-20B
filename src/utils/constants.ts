export const AI_MODELS = [
  {
    id: 'gemini',
    name: 'Gemini AI',
    description: 'Google\'s advanced AI model'
  },
  {
    id: 'gpt-oss-20b',
    name: 'GPT-OSS-20B (Ollama)',
    description: 'Local GPT-OSS-20B model running via Ollama'
  }
];

export interface ContextPreset {
  id: string;
  name: string;
  tokens: number;
  description: string;
  responseTime: string;
  useCases: string[];
  icon: string;
}

export const CONTEXT_PRESETS: ContextPreset[] = [
  {
    id: 'quick',
    name: 'Quick Use',
    tokens: 16000,
    description: 'Fast responses for interactive chat',
    responseTime: '5-15 seconds',
    useCases: ['PDF whitepapers', 'Excel sheets (200 rows)', 'Quick Q&A'],
    icon: '🚀'
  },
  {
    id: 'balanced',
    name: 'Balanced',
    tokens: 32000,
    description: 'Recommended for most use cases',
    responseTime: '10-30 seconds',
    useCases: ['Large documents', 'Research papers', 'Technical docs'],
    icon: '⭐'
  },
  {
    id: 'large',
    name: 'Large Documents',
    tokens: 64000,
    description: 'For books and comprehensive research',
    responseTime: '30-60 seconds',
    useCases: ['Book chapters', 'Massive datasets', 'Deep analysis'],
    icon: '📚'
  },
  {
    id: 'maximum',
    name: 'Maximum Power',
    tokens: 100000,
    description: 'Entire books and extreme analysis',
    responseTime: '60-120+ seconds',
    useCases: ['Full books', 'Complete codebases', 'Maximum capacity'],
    icon: '🔥'
  }
];

export const SUPPORTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'text/plain': '.txt',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
  'text/csv': '.csv',
  'application/json': '.json'
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const REQUEST_TIMEOUT = parseInt(import.meta.env.VITE_REQUEST_TIMEOUT) || 120000;

export const CHAT_MODES = [
  {
    id: 'general' as const,
    name: 'General Chat',
    description: 'Open conversation without document context',
    icon: '💬'
  },
  {
    id: 'document' as const,
    name: 'Document Q&A',
    description: 'Analyze and ask questions about uploaded documents',
    icon: '📄'
  }
];