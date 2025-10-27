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
        <code className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900 rounded-md font-mono text-sm font-semibold border border-purple-200 shadow-sm" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mt-6 mb-4 pb-3 border-b-2 border-indigo-200">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-bold text-indigo-700 mt-5 mb-3">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{children}</h3>
    ),
    ul: ({ children }: any) => (
      <ul className="space-y-2 my-3 ml-6 list-disc">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="space-y-2 my-3 ml-6 list-decimal">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="text-gray-700 leading-relaxed pl-2">
        {children}
      </li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-gradient-to-b from-indigo-500 to-purple-600 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 pl-5 py-3 my-4 rounded-r-lg shadow-sm text-gray-800 font-medium">
        {children}
      </blockquote>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4 rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-300 border-2 border-indigo-200 rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">{children}</thead>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-3 text-left text-sm font-bold text-white border-b-2 border-white/20">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-3 text-sm text-gray-800 border-b border-gray-200 bg-white hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-colors">
        {children}
      </td>
    ),
    a: ({ children, href }: any) => (
      <a
        href={href}
        className="text-indigo-600 hover:text-purple-700 underline decoration-2 underline-offset-2 hover:decoration-purple-500 font-semibold transition-all hover:bg-indigo-50 px-1 rounded"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    p: ({ children }: any) => (
      <p className="text-gray-800 leading-relaxed my-3 text-[15px]">{children}</p>
    ),
    strong: ({ children }: any) => (
      <strong className="font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-indigo-700 font-medium">{children}</em>
    ),
    hr: () => (
      <hr className="my-6 border-0 h-1 rounded bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200" />
    ),
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[700px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl border border-gray-200 shadow-inner">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 py-12 animate-fadeIn">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center shadow-2xl animate-pulse">
                <Bot className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">Ready to assist you</h3>
              {chatMode === 'general' ? (
                <p className="text-sm text-gray-600 font-medium">Ask me anything - from coding help to creative ideas!</p>
              ) : disabled ? (
                <p className="text-sm text-gray-600 font-medium">Upload a document to start document Q&A</p>
              ) : (
                <p className="text-sm text-gray-600 font-medium">Ask any question about your document</p>
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
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {message.isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {message.isUser ? (
                      <p className="text-sm font-medium text-gray-800 leading-relaxed whitespace-pre-wrap" dir="auto">
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
      <form onSubmit={handleSubmit} className="mt-6">
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
            className="flex-1 px-5 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:border-gray-400 text-sm font-medium bg-white"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || disabled || isLoading}
            className="px-6 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold"
          >
            <Send className="h-5 w-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;