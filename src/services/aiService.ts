import { AIResponse, ChartData } from '../types';
import { geminiClient, gptOSSClient } from './api';
import { REQUEST_TIMEOUT } from '../utils/constants';

// Parse chart data from AI response (supports multiple charts)
export const parseChartData = (text: string): { text: string; chartData?: ChartData[] } => {
  const chartRegex = /```chart\s*([\s\S]*?)```/g;
  const matches = [...text.matchAll(chartRegex)];

  if (matches.length === 0) {
    return { text };
  }

  const charts: ChartData[] = [];
  let cleanText = text;

  for (const match of matches) {
    try {
      const chartJson = match[1].trim();
      const chartData = JSON.parse(chartJson) as ChartData;
      charts.push(chartData);

      // Remove this chart block from the text
      cleanText = cleanText.replace(match[0], '').trim();
    } catch (error) {
      console.error('Failed to parse chart data:', error);
      // Continue parsing other charts even if one fails
    }
  }

  return {
    text: cleanText,
    chartData: charts.length > 0 ? charts : undefined
  };
};

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

export const formatGeneralChatPrompt = (
  userQuestion: string,
  conversationHistory?: string
): string => {
  return `You are an advanced AI assistant powered by HussAI 20B. You excel at:
- Providing helpful, accurate, and thoughtful responses
- Engaging in natural conversation on any topic
- Explaining complex concepts clearly
- Creative problem-solving and brainstorming
- Technical assistance and coding help
- Creating visualizations and charts when helpful
${conversationHistory ? `\nCONVERSATION HISTORY:\n${conversationHistory}\n` : ''}

CURRENT QUESTION: ${userQuestion}

RESPONSE GUIDELINES:
- Provide clear, concise, and helpful answers
- Use examples when appropriate
- If you create visualizations, use the chart format below
- Be conversational and engaging
- Admit when you're uncertain about something

CHART FORMATTING (when creating visualizations):
When creating charts or visualizations, wrap each chart JSON in triple backticks with the word "chart":

\`\`\`chart
{
  "type": "line",
  "title": "Chart Title",
  "data": [{"name": "A", "value": 10}],
  "xKey": "name",
  "yKeys": ["value"]
}
\`\`\`

Supported chart types: line, bar, pie`;
};

export const formatPrompt = (
  userQuestion: string,
  documentContent: string,
  conversationHistory?: string,
  maxContextLength: number = 32000
): string => {
  // Truncate document content if it's too long
  const truncatedContent = documentContent.length > maxContextLength
    ? documentContent.substring(0, maxContextLength) + '...'
    : documentContent;

  return `You are an advanced AI data analyst and document processing expert powered by HussAI 20B. You excel at:
- Deep analysis of structured and unstructured data
- Creating insightful visualizations and charts
- Identifying patterns, trends, and anomalies
- Performing complex calculations and statistical analysis
- Providing actionable insights and recommendations
- Understanding context from previous conversation

DOCUMENT CONTEXT:
${truncatedContent}
${conversationHistory ? `\nCONVERSATION HISTORY:\n${conversationHistory}\n` : ''}

CURRENT QUESTION: ${userQuestion}

ANALYSIS GUIDELINES:
- Provide detailed, accurate answers with specific data points
- Use the conversation history to understand context and provide coherent responses
- For tabular data (Excel/CSV): Analyze rows, columns, patterns, and relationships
- For numerical data: Perform calculations, identify trends, generate statistics
- For JSON data: Navigate nested structures and extract meaningful insights
- For text documents: Summarize key points, extract relevant information
- Always cite specific numbers, dates, or facts from the document
- If data is insufficient, clearly state what's missing

CRITICAL CHART FORMATTING RULES:
When the user asks for charts, graphs, plots, or visualizations, you MUST wrap each chart JSON in triple backticks with the word "chart":

\`\`\`chart
{
  "type": "line",
  "title": "Chart Title",
  "data": [{"name": "A", "value": 10}],
  "xKey": "name",
  "yKeys": ["value"]
}
\`\`\`

MANDATORY FORMAT - Charts will NOT render without the \`\`\`chart wrapper!

Examples of CORRECT formatting:

For a line chart, you MUST write:
\`\`\`chart
{"type": "line", "title": "Sales Trend", "data": [{"month": "Jan", "sales": 100}, {"month": "Feb", "sales": 150}], "xKey": "month", "yKeys": ["sales"]}
\`\`\`

For a bar chart, you MUST write:
\`\`\`chart
{"type": "bar", "title": "Comparison", "data": [{"category": "A", "value1": 50, "value2": 70}], "xKey": "category", "yKeys": ["value1", "value2"]}
\`\`\`

For a pie chart, you MUST write:
\`\`\`chart
{"type": "pie", "title": "Distribution", "data": [{"name": "Category A", "value": 30}, {"name": "Category B", "value": 70}]}
\`\`\`

WRONG (will not render): Just the JSON without \`\`\`chart wrapper
RIGHT (will render): JSON wrapped in \`\`\`chart ... \`\`\`

You can include multiple charts in one response, but each chart MUST have its own \`\`\`chart wrapper.`;
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
        throw new Error('Request timeout - Make sure Ollama is running with HussAI 20B model');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
        throw new Error('Cannot connect to Ollama server. Make sure Ollama is running on http://127.0.0.1:11434');
      }
      throw error;
    }

    throw new Error('Failed to get response from HussAI 20B');
  }
};

export const sendMessage = async (
  message: string,
  documentContext: string,
  model: string,
  conversationHistory?: string,
  maxContextLength: number = 32000,
  chatMode: 'general' | 'document' = 'document'
): Promise<AIResponse> => {
  // Use different prompt based on chat mode
  const prompt = chatMode === 'general'
    ? formatGeneralChatPrompt(message, conversationHistory)
    : formatPrompt(message, documentContext, conversationHistory, maxContextLength);

  let responseText: string;

  try {
    if (model === 'gemini') {
      responseText = await handleGeminiRequest(prompt);
    } else if (model === 'gpt-oss-20b') {
      responseText = await handleGPTOSSRequest(prompt);
    } else {
      throw new Error(`Unsupported AI model: ${model}`);
    }

    // Parse chart data from response
    const { text: cleanText, chartData } = parseChartData(responseText);

    return {
      text: cleanText,
      model: model,
      timestamp: new Date(),
      chartData
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'AI service error');
  }
};