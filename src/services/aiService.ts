import { AIResponse } from '../types';
import { geminiClient, gptOSSClient } from './api';
import { MAX_CONTEXT_LENGTH, REQUEST_TIMEOUT } from '../utils/constants';

interface GeminiRequest {
  contents: {
    parts: { text: string }[];
  }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

interface GPTOSSRequest {
  model: string;
  prompt: string;
  stream: boolean;
}

interface GPTOSSResponse {
  response: string;
  done: boolean;
}

export const formatPrompt = (userQuestion: string, documentContent: string): string => {
  // Truncate document content if it's too long
  const truncatedContent = documentContent.length > MAX_CONTEXT_LENGTH
    ? documentContent.substring(0, MAX_CONTEXT_LENGTH) + '...'
    : documentContent;

  return `Based on the following document content, please answer the user's question.

Document Content:
${truncatedContent}

User Question: ${userQuestion}

Please provide a helpful and accurate answer based on the document content. If the answer cannot be found in the document, please say so.`;
};

export const handleGeminiRequest = async (prompt: string): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const request: GeminiRequest = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    // Use direct fetch for Gemini API as it has a different URL structure
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get response from Gemini AI');
  }
};

export const handleGPTOSSRequest = async (prompt: string): Promise<string> => {
  try {
    const apiUrl = import.meta.env.VITE_GPT_OSS_API_URL;

    if (!apiUrl) {
      throw new Error('GPT-OSS-20B API URL not configured');
    }

    const request: GPTOSSRequest = {
      model: 'gpt-oss:20b',
      prompt: prompt,
      stream: false
    };

    // Use direct fetch for Ollama API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.status} ${response.statusText}`);
    }

    const data: GPTOSSResponse = await response.json();

    if (!data.response) {
      throw new Error('Invalid response from GPT-OSS-20B (Ollama)');
    }

    return data.response;
  } catch (error) {
    console.error('GPT-OSS-20B (Ollama) API Error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - Make sure Ollama is running with GPT-OSS-20B model');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
        throw new Error('Cannot connect to Ollama server. Make sure Ollama is running on http://127.0.0.1:11434');
      }
      throw error;
    }

    throw new Error('Failed to get response from GPT-OSS-20B');
  }
};

export const sendMessage = async (
  message: string,
  documentContext: string,
  model: string
): Promise<AIResponse> => {
  const prompt = formatPrompt(message, documentContext);

  let responseText: string;

  try {
    if (model === 'gemini') {
      responseText = await handleGeminiRequest(prompt);
    } else if (model === 'gpt-oss-20b') {
      responseText = await handleGPTOSSRequest(prompt);
    } else {
      throw new Error(`Unsupported AI model: ${model}`);
    }

    return {
      text: responseText,
      model: model,
      timestamp: new Date()
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'AI service error');
  }
};