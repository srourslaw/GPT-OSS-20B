import React, { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, FileJson, File, Brain, Zap, Database, Info, Settings, MessageSquare, ChevronDown } from 'lucide-react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import DocumentViewer from './components/DocumentViewer';
import ChatInterface from './components/ChatInterface';
import { Document, ChatMessage, AIModel, ChatMode } from './types';
import { AI_MODELS, CONTEXT_PRESETS, ContextPreset, CHAT_MODES } from './utils/constants';
import { sendMessage } from './services/aiService';
import { exportChatAsMarkdown, exportChatAsJSON, exportChatAsText } from './utils/exportHelpers';

function App() {
  const [document, setDocument] = useState<Document | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedContextPreset, setSelectedContextPreset] = useState<ContextPreset>(CONTEXT_PRESETS[1]); // Default to Balanced
  const [showContextSelector, setShowContextSelector] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('general'); // Default to general chat
  const [showChatModeSelector, setShowChatModeSelector] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const chatModeMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextSelector(false);
      }
      if (chatModeMenuRef.current && !chatModeMenuRef.current.contains(event.target as Node)) {
        setShowChatModeSelector(false);
      }
    };

    if (showExportMenu || showContextSelector || showChatModeSelector) {
      window.document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu, showContextSelector, showChatModeSelector]);

  const handleDocumentUpload = (uploadedDocument: Document) => {
    setDocument(uploadedDocument);
    setMessages([]); // Clear chat history when new document is uploaded
    setChatMode('document'); // Automatically switch to document mode
  };

  const handleClearDocument = () => {
    setDocument(null);
    setMessages([]);
  };

  const handleModelChange = (model: AIModel) => {
    setSelectedModel(model);
  };

  const handleExport = (format: 'markdown' | 'json' | 'text') => {
    if (messages.length === 0) {
      alert('No chat messages to export');
      return;
    }

    const documentName = document?.name;

    switch (format) {
      case 'markdown':
        exportChatAsMarkdown(messages, documentName);
        break;
      case 'json':
        exportChatAsJSON(messages, documentName);
        break;
      case 'text':
        exportChatAsText(messages, documentName);
        break;
    }

    setShowExportMenu(false);
  };

  const handleSendMessage = async (message: string) => {
    // In document mode, require a document to be uploaded
    if (chatMode === 'document' && !document) {
      alert('Please upload a document first or switch to General Chat mode');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build conversation history from previous messages (limit to last 10 exchanges for context)
      const recentMessages = messages.slice(-20); // Last 10 Q&A pairs
      const conversationHistory = recentMessages
        .map(msg => {
          const role = msg.isUser ? 'User' : 'Assistant';
          return `${role}: ${msg.text}`;
        })
        .join('\n\n');

      const aiResponse = await sendMessage(
        message,
        document?.content || '', // Pass empty string if no document in general mode
        selectedModel.id,
        conversationHistory || undefined,
        selectedContextPreset.tokens,
        chatMode
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.text,
        isUser: false,
        timestamp: aiResponse.timestamp,
        aiModel: selectedModel.name,
        chartData: aiResponse.chartData
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${error instanceof Error ? error.message : 'Failed to get AI response'}`,
        isUser: false,
        timestamp: new Date(),
        aiModel: selectedModel.name
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header selectedModel={selectedModel} onModelChange={handleModelChange} />

      {/* Enhanced Features Banner */}
      {document && (
        <div className="max-w-[1920px] mx-auto px-6 pt-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Conversation Memory</p>
                    <p className="text-xs text-gray-600">{messages.length} messages in context</p>
                  </div>
                </div>

                {/* Context Size Selector */}
                <div className="flex items-center gap-2 relative" ref={contextMenuRef}>
                  <Database className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Document Context</p>
                    <button
                      onClick={() => setShowContextSelector(!showContextSelector)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-all"
                    >
                      {selectedContextPreset.icon} {selectedContextPreset.name} ({(selectedContextPreset.tokens / 1000).toFixed(0)}K tokens)
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showContextSelector ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {showContextSelector && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-sm font-bold text-gray-900">Select Context Size</h3>
                        <p className="text-xs text-gray-600 mt-1">Choose based on your document size</p>
                      </div>
                      {CONTEXT_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => {
                            setSelectedContextPreset(preset);
                            setShowContextSelector(false);
                          }}
                          className={`w-full text-left p-3 hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                            selectedContextPreset.id === preset.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-2xl">{preset.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-900">{preset.name}</p>
                                <span className="text-xs font-medium text-gray-500">{(preset.tokens / 1000).toFixed(0)}K</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5">{preset.description}</p>
                              <p className="text-xs text-gray-500 mt-1">⏱️ {preset.responseTime}</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {preset.useCases.map((useCase, idx) => (
                                  <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                    {useCase}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                      <div className="p-3 bg-gray-50 border-t border-gray-200">
                        <button
                          onClick={() => setShowGuideModal(true)}
                          className="w-full flex items-center justify-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Info className="h-4 w-4" />
                          View Full Context Guide
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Enhanced Analysis</p>
                    <p className="text-xs text-gray-600">Advanced prompting active</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-600 font-medium">
                  HussAI 20B Maximized Mode 🚀
                </div>
                <button
                  onClick={() => setShowGuideModal(true)}
                  className="p-1 hover:bg-blue-100 rounded transition-colors"
                  title="View Context Guide"
                >
                  <Info className="h-4 w-4 text-blue-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1920px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[500px_1fr] gap-6">
          {/* Left Column - Document Upload and Viewer */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900">Document Upload</h2>
                </div>
                {document && (
                  <button
                    onClick={handleClearDocument}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Clear document"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </button>
                )}
              </div>
              <FileUpload onDocumentUpload={handleDocumentUpload} />
            </div>

            {document && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900">Document Content</h2>
                </div>
                <DocumentViewer document={document} />
              </div>
            )}
          </div>

          {/* Right Column - Chat Interface */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            {/* Chat Mode Selector */}
            <div className="mb-4 pb-3 border-b border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 relative" ref={chatModeMenuRef}>
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Chat Mode</p>
                    <button
                      onClick={() => setShowChatModeSelector(!showChatModeSelector)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 transition-all"
                    >
                      {CHAT_MODES.find(m => m.id === chatMode)?.icon} {CHAT_MODES.find(m => m.id === chatMode)?.name}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showChatModeSelector ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {showChatModeSelector && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
                      <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-sm font-bold text-gray-900">Select Chat Mode</h3>
                        <p className="text-xs text-gray-600 mt-1">Choose how you want to interact</p>
                      </div>
                      {CHAT_MODES.map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => {
                            setChatMode(mode.id);
                            setShowChatModeSelector(false);
                            if (mode.id === 'document' && !document) {
                              // Optionally show a hint that document is needed
                            }
                          }}
                          className={`w-full text-left p-3 hover:bg-purple-50 transition-colors border-b border-gray-100 ${
                            chatMode === mode.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-2xl">{mode.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-900">{mode.name}</p>
                                {mode.id === 'document' && !document && (
                                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                    Needs doc
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5">{mode.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {messages.length > 0 && (
                  <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Memory Active
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
              </div>

              {/* Export Dropdown */}
              {messages.length > 0 && (
                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Export chat"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleExport('markdown')}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <FileText className="h-4 w-4 text-blue-500" />
                          Export as Markdown
                        </button>
                        <button
                          onClick={() => handleExport('json')}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <FileJson className="h-4 w-4 text-green-500" />
                          Export as JSON
                        </button>
                        <button
                          onClick={() => handleExport('text')}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <File className="h-4 w-4 text-gray-500" />
                          Export as Text
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              disabled={chatMode === 'document' && !document}
              chatMode={chatMode}
            />
          </div>
        </div>
      </div>

      {/* Context Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">HussAI 20B Context Window Guide</h2>
                <p className="text-sm text-blue-100 mt-1">Optimize your model's performance</p>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                {/* Quick Reference */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    Your Model Specifications
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Total Context</p>
                      <p className="text-lg font-bold text-gray-900">131K tokens</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Parameters</p>
                      <p className="text-lg font-bold text-gray-900">20.9 Billion</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Your RAM</p>
                      <p className="text-lg font-bold text-green-600">64GB ✅</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Architecture</p>
                      <p className="text-lg font-bold text-gray-900">MoE (32)</p>
                    </div>
                  </div>
                </div>

                {/* Context Presets */}
                <h3 className="text-lg font-bold text-gray-900 mb-3">Available Context Presets</h3>
                <div className="space-y-3 mb-6">
                  {CONTEXT_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{preset.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-gray-900">{preset.name}</h4>
                            <span className="text-sm font-semibold text-blue-600">
                              {(preset.tokens / 1000).toFixed(0)}K tokens
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{preset.description}</p>
                          <p className="text-xs text-gray-500 mb-2">⏱️ {preset.responseTime}</p>
                          <div className="flex flex-wrap gap-1">
                            {preset.useCases.map((useCase, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                              >
                                {useCase}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Insights */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Key Insights
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Your M4 Max + 64GB RAM</strong> can handle any context size without crashing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">→</span>
                      <span><strong>Response time still scales</strong> with context size (model processing, not hardware)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">⭐</span>
                      <span><strong>32K (Balanced)</strong> is recommended for 95% of use cases</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">⚠️</span>
                      <span><strong>"Lost in the Middle"</strong> problem: Larger contexts may miss details in the middle</span>
                    </li>
                  </ul>
                </div>

                {/* Document Size Reference */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Document Size Reference</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-gray-700">PDF Whitepaper</span>
                      <span className="font-semibold text-gray-900">~5K tokens</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-gray-700">Excel (100 rows)</span>
                      <span className="font-semibold text-gray-900">~8K tokens</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-gray-700">Research Paper</span>
                      <span className="font-semibold text-gray-900">~20K tokens</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-gray-700">Book Chapter</span>
                      <span className="font-semibold text-gray-900">~25K tokens</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-gray-700">Technical Manual</span>
                      <span className="font-semibold text-gray-900">~40K tokens</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-gray-700">Full Book</span>
                      <span className="font-semibold text-gray-900">~100K tokens</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-600">
                📄 Full guide available in <code className="bg-gray-200 px-1 rounded">CONTEXT_GUIDE.md</code>
              </p>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;