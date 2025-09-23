import React, { useState } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import DocumentViewer from './components/DocumentViewer';
import ChatInterface from './components/ChatInterface';
import { Document, ChatMessage, AIModel } from './types';
import { AI_MODELS } from './utils/constants';
import { sendMessage } from './services/aiService';

function App() {
  const [document, setDocument] = useState<Document | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleDocumentUpload = (uploadedDocument: Document) => {
    setDocument(uploadedDocument);
    setMessages([]); // Clear chat history when new document is uploaded
  };

  const handleModelChange = (model: AIModel) => {
    setSelectedModel(model);
  };

  const handleSendMessage = async (message: string) => {
    if (!document) {
      alert('Please upload a document first');
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
      const aiResponse = await sendMessage(message, document.content, selectedModel.id);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.text,
        isUser: false,
        timestamp: aiResponse.timestamp,
        aiModel: selectedModel.name
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
    <div className="min-h-screen bg-gray-100">
      <Header selectedModel={selectedModel} onModelChange={handleModelChange} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Document Upload and Viewer */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Document Upload</h2>
              <FileUpload onDocumentUpload={handleDocumentUpload} />
            </div>

            {document && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Document Content</h2>
                <DocumentViewer document={document} />
              </div>
            )}
          </div>

          {/* Right Column - Chat Interface */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Chat with AI</h2>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              disabled={!document}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;