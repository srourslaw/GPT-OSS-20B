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

export const SUPPORTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc'
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_CONTEXT_LENGTH = parseInt(import.meta.env.VITE_MAX_CONTEXT_LENGTH) || 4000;
export const REQUEST_TIMEOUT = parseInt(import.meta.env.VITE_REQUEST_TIMEOUT) || 30000;