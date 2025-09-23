import { REQUEST_TIMEOUT } from '../utils/constants';

interface APIConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

class APIClient {
  private config: APIConfig;

  constructor(config: APIConfig) {
    this.config = config;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }

      throw new Error('Unknown API error');
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }
}

// Gemini API client
export const geminiClient = new APIClient({
  baseURL: import.meta.env.VITE_GEMINI_API_URL || '',
  timeout: REQUEST_TIMEOUT,
  headers: {},
});

// GPT-OSS-20B API client
export const gptOSSClient = new APIClient({
  baseURL: import.meta.env.VITE_GPT_OSS_API_URL || '',
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_GPT_OSS_API_KEY || ''}`,
  },
});