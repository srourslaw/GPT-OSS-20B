import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Copy, Check, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ChatMessage, ChatMode } from '../types';
import ChartRenderer from './ChartRenderer';
import 'highlight.js/styles/github.css';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled: boolean;
  chatMode: ChatMode;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  disabled,
  chatMode
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only scroll to bottom when a new message is added, not on initial load
    if (messages.length > prevMessagesLengthRef.current && prevMessagesLengthRef.current > 0) {
      scrollToBottom();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading && !disabled) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyCodeToClipboard = (code: string, codeId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(codeId);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Note: We use dir="auto" to let the browser automatically detect text direction
  // This works better for mixed content (English + Arabic in same message)

  // Custom components for ReactMarkdown with enhanced styling
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

      return !inline ? (
        <div className="relative group my-4">
          <div className="absolute right-2 top-2 z-10">
            <button
              onClick={() => copyCodeToClipboard(codeString, codeId)}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5"
              title="Copy code"
            >
              {copiedCodeId === codeId ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <code className={className} {...props}>
            {children}
          </code>
        </div>
      ) : (
        <code className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-mono text-sm" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4 pb-2 border-b-2 border-gradient-to-r from-purple-500 to-blue-500">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-bold text-gray-800 mt-5 mb-3 flex items-center gap-2">
        <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"></span>
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{children}</h3>
    ),
    ul: ({ children }: any) => (
      <ul className="space-y-2 my-3">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="space-y-2 my-3 list-decimal list-inside">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="text-gray-700 leading-relaxed flex items-start gap-2">
        <span className="text-purple-500 mt-1.5">•</span>
        <span className="flex-1">{children}</span>
      </li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 my-4 italic text-gray-700">
        {children}
      </blockquote>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-gray-300 border border-gray-300 rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-gradient-to-r from-purple-50 to-blue-50">{children}</thead>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-300">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">
        {children}
      </td>
    ),
    a: ({ children, href }: any) => (
      <a
        href={href}
        className="text-blue-600 hover:text-blue-800 underline font-medium"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    p: ({ children }: any) => (
      <p className="text-gray-700 leading-relaxed my-2">{children}</p>
    ),
    strong: ({ children }: any) => (
      <strong className="font-bold text-gray-900">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-gray-800">{children}</em>
    ),
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[700px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <Bot className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to assist you</h3>
              {chatMode === 'general' ? (
                <p className="text-sm text-gray-600">Ask me anything - from coding help to creative ideas!</p>
              ) : disabled ? (
                <p className="text-sm text-gray-600">Upload a document to start document Q&A</p>
              ) : (
                <p className="text-sm text-gray-600">Ask any question about your document</p>
              )}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`chat-message ${message.isUser ? 'user' : 'ai'} group relative`}
              >
                <div className="flex items-start space-x-3">
                  {!message.isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {message.isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {message.isUser ? (
                      <p className="text-sm whitespace-pre-wrap" dir="auto">
                        {message.text}
                      </p>
                    ) : (
                      <>
                        <div className="prose prose-lg max-w-none markdown-content" dir="auto">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={components}
                          >
                            {message.text}
                          </ReactMarkdown>
                        </div>
                        {message.chartData && message.chartData.length > 0 && (
                          <div className="space-y-4 mt-4">
                            {message.chartData.map((chart, index) => (
                              <ChartRenderer key={index} chartData={chart} />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className="text-xs opacity-70 font-medium">
                        {message.timestamp.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                        {message.aiModel && (
                          <span className="ml-1.5 px-2 py-0.5 bg-black/10 rounded-full">
                            {message.aiModel}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => copyToClipboard(message.text, message.id)}
                        className="opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-white/20 rounded-md flex items-center gap-1"
                        title="Copy message"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span className="text-xs">Copied!</span>
                          </>
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="chat-message ai">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex space-x-1.5 pt-2">
                  <div className="w-2 h-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-2 h-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              chatMode === 'general'
                ? "Ask me anything..."
                : disabled
                ? "Upload a document to start chatting..."
                : "Ask a question about your document..."
            }
            disabled={disabled || isLoading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all shadow-sm hover:border-gray-400 text-sm"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || disabled || isLoading}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;