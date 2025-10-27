import React, { useState } from 'react';
import { Plus, MessageSquare, FileText, StickyNote, Globe, Layout, Edit3, Search, ExternalLink, RefreshCw, Home, ArrowLeft, ArrowRight, X } from 'lucide-react';
import CanvasWindowComponent from './CanvasWindow';
import ChatInterface from './ChatInterface';
import DocumentViewer from './DocumentViewer';
import FileUpload from './FileUpload';
import DraftEditor from './DraftEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { CanvasWindow, WindowType, Document, ChatMessage, AIModel } from '../types';
import { sendMessage } from '../services/aiService';
import { getSelectedSectionsContent } from '../utils/sectionExtractor';
import { exportToPDF, exportToWord } from '../utils/exportUtils';
import { markdownToHtml } from '../utils/markdownUtils';

interface CanvasBoardProps {
  document: Document | null;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  selectedModel: AIModel;
  selectedContextPreset: { tokens: number };
  canvasWindows: any[];
  onCanvasWindowsChange: (windows: any[]) => void;
  canvasDocument: Document | null;
  onCanvasDocumentChange: (doc: Document | null) => void;
  canvasNotes: string;
  onCanvasNotesChange: (notes: string) => void;
  canvasChatMessages: ChatMessage[];
  onCanvasChatMessagesChange: (messages: ChatMessage[]) => void;
}

const CanvasBoard: React.FC<CanvasBoardProps> = ({
  document: initialDocument,
  messages: initialMessages,
  onSendMessage,
  isLoading: parentIsLoading,
  selectedModel,
  selectedContextPreset,
  canvasWindows: persistedWindows,
  onCanvasWindowsChange,
  canvasDocument: persistedDocument,
  onCanvasDocumentChange,
  canvasNotes: persistedNotes,
  onCanvasNotesChange,
  canvasChatMessages: persistedChatMessages,
  onCanvasChatMessagesChange
}) => {
  const [windows, setWindows] = useState<CanvasWindow[]>(persistedWindows);
  const [nextZIndex, setNextZIndex] = useState(persistedWindows.length > 0 ? Math.max(...persistedWindows.map((w: any) => w.zIndex)) + 1 : 1);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Shared state across canvas windows - use persisted state
  const [canvasDocument, setCanvasDocument] = useState<Document | null>(persistedDocument);
  const [canvasNotes, setCanvasNotes] = useState<string>(persistedNotes);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(persistedChatMessages);
  const [isLoading, setIsLoading] = useState(false);

  // Draft window contents - each draft window has its own content
  const [draftContents, setDraftContents] = useState<{ [windowId: string]: string }>({});

  // Streaming state for draft windows
  const [draftStreaming, setDraftStreaming] = useState<{ [windowId: string]: boolean }>({});
  const [draftTargetContent, setDraftTargetContent] = useState<{ [windowId: string]: string }>({});
  const [draftDisplayContent, setDraftDisplayContent] = useState<{ [windowId: string]: string }>({});

  // Web search state - each web window has its own URL and history
  const [webUrls, setWebUrls] = useState<{ [windowId: string]: string }>({});
  const [webHistory, setWebHistory] = useState<{ [windowId: string]: string[] }>({});
  const [webHistoryIndex, setWebHistoryIndex] = useState<{ [windowId: string]: number }>({});

  // Sync local state with parent
  React.useEffect(() => {
    onCanvasWindowsChange(windows);
  }, [windows]);

  React.useEffect(() => {
    onCanvasDocumentChange(canvasDocument);
  }, [canvasDocument]);

  React.useEffect(() => {
    onCanvasNotesChange(canvasNotes);
  }, [canvasNotes]);

  React.useEffect(() => {
    onCanvasChatMessagesChange(chatMessages);
  }, [chatMessages]);

  // Streaming effect for draft windows
  React.useEffect(() => {
    const streamingWindows = Object.keys(draftStreaming).filter(id => draftStreaming[id]);

    if (streamingWindows.length === 0) return;

    const interval = setInterval(() => {
      let allComplete = true;

      streamingWindows.forEach(windowId => {
        const target = draftTargetContent[windowId] || '';
        const current = draftDisplayContent[windowId] || '';

        if (current.length < target.length) {
          allComplete = false;
          // Add multiple characters at once for faster streaming (10 chars per tick)
          const nextChunk = target.slice(0, current.length + 10);
          setDraftDisplayContent(prev => ({
            ...prev,
            [windowId]: nextChunk
          }));
        } else {
          // Streaming complete for this window
          setDraftStreaming(prev => ({
            ...prev,
            [windowId]: false
          }));
          setDraftContents(prev => ({
            ...prev,
            [windowId]: target
          }));
        }
      });

      if (allComplete) {
        clearInterval(interval);
      }
    }, 20); // Update every 20ms for smooth animation

    return () => clearInterval(interval);
  }, [draftStreaming, draftTargetContent, draftDisplayContent]);

  // Custom components for ReactMarkdown with enhanced styling
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      return !inline ? (
        <code className={className} {...props}>
          {children}
        </code>
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

  // Handle sending messages with context from document and notes
  const handleCanvasSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date()
    };

    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setIsLoading(true);

    // Check if user wants to write to a draft window
    const draftWindows = windows.filter(w => w.type === 'draft');
    const draftKeywords = ['draft', 'write to draft', 'in the draft', 'to draft window', 'output window', 'write in draft', 'add to draft', 'put in draft'];
    const shouldWriteToDraft = draftWindows.length > 0 && draftKeywords.some(keyword => message.toLowerCase().includes(keyword));

    try {
      // Build context from document and notes
      let documentContext = '';

      if (canvasDocument) {
        // Use selected sections if in section mode, otherwise use full content
        if (canvasDocument.sectionMode === 'selected' && canvasDocument.sections && canvasDocument.sections.length > 0) {
          const selectedContent = getSelectedSectionsContent(canvasDocument.sections);
          console.log('🔍 CANVAS: SELECTED CONTENT LENGTH:', selectedContent.length, 'characters');
          console.log('🔍 CANVAS: SELECTED CONTENT PREVIEW:', selectedContent.substring(0, 500));

          // Use selected content even if empty - this ensures AI only sees what's selected
          documentContext += `\n\nDocument Content (Selected Sections):\n${selectedContent || '[No content available for selected sections]'}`;
        } else {
          documentContext += `\n\nDocument Content:\n${canvasDocument.content}`;
          console.log('🔍 CANVAS: USING FULL DOCUMENT:', canvasDocument.content.length, 'characters');
        }
      }

      if (canvasNotes && canvasNotes.trim()) {
        documentContext += `\n\nUser Notes:\n${canvasNotes}`;
      }

      // Build conversation history
      const recentMessages = chatMessages.slice(-20);
      const conversationHistory = recentMessages
        .map(msg => {
          const role = msg.isUser ? 'User' : 'Assistant';
          return `${role}: ${msg.text}`;
        })
        .join('\n\n');

      // Call AI service with enhanced context
      // Use 'document' mode when we have context, otherwise 'general'
      const chatMode = (canvasDocument || canvasNotes) ? 'document' : 'general';

      const aiResponse = await sendMessage(
        message,
        documentContext || '',
        selectedModel.id,
        conversationHistory || undefined,
        selectedContextPreset.tokens,
        chatMode
      );

      // If user wants to write to draft and draft windows exist, write there
      if (shouldWriteToDraft && draftWindows.length > 0) {
        // Write to the most recent draft window with streaming effect
        const targetDraftWindow = draftWindows[draftWindows.length - 1];

        // Get existing content and append new content with a section separator
        // Convert markdown to HTML for proper rendering in TipTap editor
        const existingContent = draftContents[targetDraftWindow.id] || '';
        const separator = existingContent ? '<hr class="my-4" />' : '';

        // Defensive check: ensure aiResponse.text is a string
        const responseText = typeof aiResponse.text === 'string'
          ? aiResponse.text
          : JSON.stringify(aiResponse.text);

        console.log('AI Response text type:', typeof aiResponse.text);
        console.log('AI Response text:', responseText);

        const htmlContent = markdownToHtml(responseText);
        console.log('HTML content:', htmlContent);

        const newContent = existingContent + separator + htmlContent;

        // Start streaming animation
        setDraftTargetContent(prev => ({
          ...prev,
          [targetDraftWindow.id]: newContent
        }));
        setDraftDisplayContent(prev => ({
          ...prev,
          [targetDraftWindow.id]: existingContent
        }));
        setDraftStreaming(prev => ({
          ...prev,
          [targetDraftWindow.id]: true
        }));

        // Add confirmation message to chat
        const confirmMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: `✅ Writing to "${targetDraftWindow.title}" window...`,
          isUser: false,
          timestamp: new Date(),
          aiModel: selectedModel.name
        };
        setChatMessages([...updatedMessages, confirmMessage]);
      } else {
        // Normal chat response
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponse.text,
          isUser: false,
          timestamp: aiResponse.timestamp,
          aiModel: selectedModel.name,
          chartData: aiResponse.chartData
        };

        setChatMessages([...updatedMessages, aiMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${error instanceof Error ? error.message : 'Failed to get AI response'}`,
        isUser: false,
        timestamp: new Date(),
        aiModel: selectedModel.name
      };

      setChatMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle document upload
  const handleDocumentUpload = (doc: Document) => {
    console.log('📤📤📤 CANVASBOARD: New document uploaded!');
    console.log('  📄 Document name:', doc.name);
    console.log('  📄 Upload time:', doc.uploadedAt);
    console.log('  📄 Has sections array?:', !!doc.sections);
    console.log('  📄 Sections count:', doc.sections?.length || 0);
    console.log('  📄 Full sections data:', doc.sections);
    console.log('  📄 Section mode:', doc.sectionMode);
    setCanvasDocument(doc);
    onCanvasDocumentChange(doc); // Persist to parent
    console.log('  ✅ State setters called');
  };

  // Handle notes change
  const handleNotesChange = (notes: string) => {
    setCanvasNotes(notes);
  };

  // Create a new window
  const createWindow = (type: WindowType, title: string, data?: any) => {
    const newWindow: CanvasWindow = {
      id: `window-${Date.now()}`,
      type,
      title,
      x: 50 + (windows.length * 30), // Offset each new window
      y: 50 + (windows.length * 30),
      width: 600,
      height: 500,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex,
      data
    };

    setWindows([...windows, newWindow]);
    setNextZIndex(nextZIndex + 1);
    setShowAddMenu(false);
  };

  // Close a window
  const closeWindow = (id: string) => {
    setWindows(windows.filter(w => w.id !== id));
  };

  // Minimize a window
  const minimizeWindow = (id: string) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, isMinimized: true } : w
    ));
  };

  // Maximize/Restore a window
  const toggleMaximize = (id: string) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
    ));
  };

  // Bring window to front
  const bringToFront = (id: string) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, zIndex: nextZIndex } : w
    ));
    setNextZIndex(nextZIndex + 1);
  };

  // Update window position
  const updatePosition = (id: string, x: number, y: number) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, x, y } : w
    ));
  };

  // Update window size
  const updateSize = (id: string, width: number, height: number) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, width, height } : w
    ));
  };

  // Restore minimized window
  const restoreWindow = (id: string) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, isMinimized: false, zIndex: nextZIndex } : w
    ));
    setNextZIndex(nextZIndex + 1);
  };

  // Render window content based on type
  const renderWindowContent = (window: CanvasWindow) => {
    switch (window.type) {
      case 'chat':
        return (
          <div className="h-full flex flex-col">
            {/* Context indicator */}
            {(canvasDocument || canvasNotes) && (
              <div className="mx-4 mt-4 mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 font-medium">
                  📎 AI has access to:
                  {canvasDocument && <span className="ml-2">📄 Document</span>}
                  {canvasNotes && <span className="ml-2">📝 Notes</span>}
                </p>
              </div>
            )}
            <div className="flex-1 flex flex-col min-h-0 px-4 pb-4">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 p-4 space-y-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500 py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                        <MessageSquare className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to assist you</h3>
                      <p className="text-sm text-gray-600">Ask me anything!</p>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`chat-message ${message.isUser ? 'user' : 'ai'}`}>
                        {message.isUser ? (
                          <p className="text-sm whitespace-pre-wrap" dir="auto">
                            {message.text}
                          </p>
                        ) : (
                          <div className="prose prose-sm max-w-none markdown-content" dir="auto">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              components={markdownComponents}
                            >
                              {message.text}
                            </ReactMarkdown>
                          </div>
                        )}
                        <span className="text-xs opacity-70 mt-2 block">
                          {message.timestamp.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="chat-message ai">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-2 h-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                if (input.value.trim()) {
                  handleCanvasSendMessage(input.value.trim());
                  input.value = '';
                }
              }} className="flex-shrink-0">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    name="message"
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all shadow-sm hover:border-gray-400 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      case 'document':
        return (
          <div className="p-4 h-full overflow-auto flex flex-col gap-4">
            {/* File upload section - always visible */}
            <div>
              <FileUpload onDocumentUpload={handleDocumentUpload} />
            </div>

            {/* Document viewer */}
            {canvasDocument && (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">📄 {canvasDocument.name}</p>
                  <button
                    onClick={() => {
                      setCanvasDocument(null);
                      onCanvasDocumentChange(null);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <DocumentViewer
                    key={canvasDocument.name + canvasDocument.uploadedAt.getTime()}
                    document={canvasDocument}
                    onDocumentUpdate={(updatedDoc) => {
                      setCanvasDocument(updatedDoc);
                      onCanvasDocumentChange(updatedDoc);
                    }}
                  />
                </div>
              </>
            )}

            {!canvasDocument && (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p className="text-sm">Upload a document to view it here</p>
              </div>
            )}
          </div>
        );
      case 'notes':
        return (
          <div className="p-4 h-full flex flex-col">
            <div className="mb-2">
              <p className="text-xs text-gray-600">
                💡 Notes are shared with AI Chat windows
              </p>
            </div>
            <textarea
              className="flex-1 w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Take notes here... AI can read these notes when you chat"
              value={canvasNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
            />
          </div>
        );
      case 'draft':
        const isStreaming = draftStreaming[window.id];
        const displayContent = isStreaming ? draftDisplayContent[window.id] : draftContents[window.id];

        return (
          <DraftEditor
            content={displayContent || '<p>Start writing or ask the AI to add content to the draft...</p>'}
            onChange={(newContent) => {
              setDraftContents(prev => ({
                ...prev,
                [window.id]: newContent
              }));
            }}
            isStreaming={isStreaming}
            onExportPDF={() => {
              const content = draftContents[window.id] || displayContent;
              if (content && content.trim()) {
                exportToPDF(content, 'draft-output.pdf');
              } else {
                alert('No content to export. Please add content to the draft first.');
              }
            }}
            onExportWord={() => {
              const content = draftContents[window.id] || displayContent;
              if (content && content.trim()) {
                exportToWord(content, 'draft-output.docx');
              } else {
                alert('No content to export. Please add content to the draft first.');
              }
            }}
            onAIModify={async (instruction: string, selectedText: string) => {
              try {
                // Create a prompt for the AI to modify the selected text
                const prompt = `${instruction}

Selected text to modify:
"""
${selectedText}
"""

Please provide ONLY the modified text without any explanations or additional commentary. Just return the improved/modified version of the text.`;

                // Send to AI
                const aiResponse = await sendMessage(
                  prompt,
                  '', // No document context needed
                  selectedModel.id,
                  undefined, // No conversation history
                  selectedContextPreset.tokens,
                  'general' // Use general chat mode
                );

                // Return the AI's response (the modified text)
                return aiResponse.text.trim();
              } catch (error) {
                console.error('Error in AI modification:', error);
                throw error;
              }
            }}
          />
        );
      case 'web':
        const currentUrl = webUrls[window.id] || '';
        const history = webHistory[window.id] || [];
        const historyIndex = webHistoryIndex[window.id] || -1;

        const navigateToUrl = (url: string) => {
          let finalUrl = url.trim();

          // If it doesn't look like a URL, treat it as a search query
          if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            if (!finalUrl.includes('.') || finalUrl.includes(' ')) {
              // It's a search query
              finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
            } else {
              // It might be a domain, add https://
              finalUrl = `https://${finalUrl}`;
            }
          }

          // Update URL
          setWebUrls(prev => ({ ...prev, [window.id]: finalUrl }));

          // Add to history
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(finalUrl);
          setWebHistory(prev => ({ ...prev, [window.id]: newHistory }));
          setWebHistoryIndex(prev => ({ ...prev, [window.id]: newHistory.length - 1 }));
        };

        const goBack = () => {
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const url = history[newIndex];
            setWebUrls(prev => ({ ...prev, [window.id]: url }));
            setWebHistoryIndex(prev => ({ ...prev, [window.id]: newIndex }));
          }
        };

        const goForward = () => {
          if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const url = history[newIndex];
            setWebUrls(prev => ({ ...prev, [window.id]: url }));
            setWebHistoryIndex(prev => ({ ...prev, [window.id]: newIndex }));
          }
        };

        const refresh = () => {
          if (currentUrl) {
            setWebUrls(prev => ({ ...prev, [window.id]: currentUrl + '?refresh=' + Date.now() }));
          }
        };

        const goHome = () => {
          navigateToUrl('https://www.wikipedia.org');
        };

        const clearBrowser = () => {
          setWebUrls(prev => ({ ...prev, [window.id]: '' }));
          setWebHistory(prev => ({ ...prev, [window.id]: [] }));
          setWebHistoryIndex(prev => ({ ...prev, [window.id]: -1 }));
        };

        const quickLinks = [
          { name: 'Wikipedia', url: 'https://www.wikipedia.org', icon: '📚' },
          { name: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: '🔍' },
          { name: 'Archive.org', url: 'https://archive.org', icon: '📦' },
          { name: 'Hacker News', url: 'https://news.ycombinator.com', icon: '📰' },
          { name: 'JSFiddle', url: 'https://jsfiddle.net', icon: '⚡' },
          { name: 'W3Schools', url: 'https://www.w3schools.com', icon: '🎓' },
          { name: 'Can I Use', url: 'https://caniuse.com', icon: '✅' },
          { name: 'Regex101', url: 'https://regex101.com', icon: '🔤' },
        ];

        return (
          <div className="h-full flex flex-col">
            {/* Browser Controls */}
            <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              {/* Navigation Bar */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={goBack}
                  disabled={historyIndex <= 0}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Back"
                >
                  <ArrowLeft className="h-4 w-4 text-gray-700" />
                </button>
                <button
                  onClick={goForward}
                  disabled={historyIndex >= history.length - 1}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Forward"
                >
                  <ArrowRight className="h-4 w-4 text-gray-700" />
                </button>
                <button
                  onClick={refresh}
                  disabled={!currentUrl}
                  className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4 text-gray-700" />
                </button>
                <button
                  onClick={goHome}
                  className="p-2 rounded-lg hover:bg-white transition-all"
                  title="Home (Wikipedia)"
                >
                  <Home className="h-4 w-4 text-gray-700" />
                </button>
                <button
                  onClick={clearBrowser}
                  className="p-2 rounded-lg hover:bg-white transition-all hover:bg-red-50"
                  title="Clear & Go to Start Page"
                >
                  <X className="h-4 w-4 text-gray-700" />
                </button>

                {/* URL Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.querySelector('input');
                    if (input) navigateToUrl(input.value);
                  }}
                  className="flex-1 flex items-center gap-2"
                >
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      defaultValue={currentUrl}
                      key={currentUrl} // Force re-render when URL changes
                      placeholder="Enter URL or search query..."
                      className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-sm flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Go
                  </button>
                </form>
              </div>

              {/* Quick Links */}
              {!currentUrl && (
                <div className="flex flex-wrap gap-2">
                  {quickLinks.map(link => (
                    <button
                      key={link.name}
                      onClick={() => navigateToUrl(link.url)}
                      className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-xs font-medium flex items-center gap-2"
                    >
                      <span>{link.icon}</span>
                      <span>{link.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Web Content */}
            <div className="flex-1 bg-white relative">
              {currentUrl ? (
                <>
                  <iframe
                    key={currentUrl}
                    src={currentUrl}
                    className="w-full h-full border-0"
                    title="Web Browser"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
                    onError={() => {
                      console.error('Failed to load:', currentUrl);
                    }}
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 shadow-lg">
                    <p className="font-semibold mb-1">⚠️ Note:</p>
                    <p>Some websites (like Google, Facebook, etc.) block embedding for security. If the page appears blank, try opening it in a new tab using the button below:</p>
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all font-medium"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in New Tab
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Globe className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Web Browser</h3>
                    <p className="text-sm text-gray-600 mb-4">Enter a URL or search query to get started</p>
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-500">Quick start:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {quickLinks.slice(0, 3).map(link => (
                          <button
                            key={link.name}
                            onClick={() => navigateToUrl(link.url)}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-purple-100 transition-all text-xs font-medium"
                          >
                            {link.icon} {link.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
      {/* Canvas Background Pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle, #666 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}></div>

      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <div className="bg-white rounded-lg shadow-lg border border-gray-300 px-3 py-2 flex items-center gap-2">
          <Layout className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">Canvas Mode</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-semibold">Add Window</span>
          </button>

          {showAddMenu && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] z-50">
              <button
                onClick={() => createWindow('chat', 'AI Chat', { messages: [] })}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100"
              >
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Chat</p>
                  <p className="text-xs text-gray-600">Start AI conversation</p>
                </div>
              </button>
              <button
                onClick={() => createWindow('document', 'Document Viewer')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-100"
              >
                <FileText className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Document</p>
                  <p className="text-xs text-gray-600">View uploaded file</p>
                </div>
              </button>
              <button
                onClick={() => createWindow('notes', 'Notes', { notes: '' })}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-yellow-50 transition-colors border-b border-gray-100"
              >
                <StickyNote className="h-5 w-5 text-yellow-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Notes</p>
                  <p className="text-xs text-gray-600">Quick notes</p>
                </div>
              </button>
              <button
                onClick={() => createWindow('draft', 'Draft Output', { content: '' })}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100"
              >
                <Edit3 className="h-5 w-5 text-orange-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Draft</p>
                  <p className="text-xs text-gray-600">AI-generated output</p>
                </div>
              </button>
              <button
                onClick={() => createWindow('web', 'Web Search')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors"
              >
                <Globe className="h-5 w-5 text-purple-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Web Browser</p>
                  <p className="text-xs text-gray-600">Browse the web with built-in navigation</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Minimized Windows Taskbar */}
      {windows.some(w => w.isMinimized) && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-300 px-3 py-2 flex items-center gap-2">
            {windows.filter(w => w.isMinimized).map(window => (
              <button
                key={window.id}
                onClick={() => restoreWindow(window.id)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium text-gray-900 flex items-center gap-2 transition-colors"
              >
                {window.type === 'chat' && <MessageSquare className="h-4 w-4" />}
                {window.type === 'document' && <FileText className="h-4 w-4" />}
                {window.type === 'notes' && <StickyNote className="h-4 w-4" />}
                {window.type === 'web' && <Globe className="h-4 w-4" />}
                {window.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Windows */}
      {windows.map(window => (
        <CanvasWindowComponent
          key={window.id}
          window={window}
          onClose={() => closeWindow(window.id)}
          onMinimize={() => minimizeWindow(window.id)}
          onMaximize={() => toggleMaximize(window.id)}
          onUpdatePosition={(x, y) => updatePosition(window.id, x, y)}
          onUpdateSize={(width, height) => updateSize(window.id, width, height)}
          onBringToFront={() => bringToFront(window.id)}
        >
          {renderWindowContent(window)}
        </CanvasWindowComponent>
      ))}

      {/* Empty State */}
      {windows.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white shadow-lg flex items-center justify-center">
              <Layout className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Canvas Mode</h2>
            <p className="text-gray-600 mb-6">Create multiple windows to organize your workspace</p>
            <button
              onClick={() => setShowAddMenu(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-6 py-3 flex items-center gap-2 mx-auto hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span className="font-semibold">Add Your First Window</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasBoard;
