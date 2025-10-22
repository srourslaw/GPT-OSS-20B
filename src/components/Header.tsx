import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Globe, Code } from 'lucide-react';
import { AIModel } from '../types';
import { AI_MODELS } from '../utils/constants';


interface HeaderProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  onShowAPIGuide: () => void;
}

const Header: React.FC<HeaderProps> = ({ selectedModel, onModelChange, onShowAPIGuide }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getModelIcon = (modelId: string) => {
    if (modelId === 'gpt-oss-20b') {
      return <Sparkles className="h-5 w-5 text-purple-600" />;
    }
    return <Globe className="h-5 w-5 text-blue-600" />;
  };

  const getModelBadge = (modelId: string) => {
    if (modelId === 'gpt-oss-20b') {
      return (
        <span className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-bold rounded-full">
          LOCAL
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
        CLOUD
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HussAI Dashboard
              </h1>
              <p className="text-sm text-gray-600 font-medium">Your Personal AI Assistant • 20.9B Parameters</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Active Model
              </label>

              {/* Custom Dropdown Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-64 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-300 rounded-xl px-4 py-3 text-left hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getModelIcon(selectedModel.id)}
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{selectedModel.name}</p>
                    </div>
                    {getModelBadge(selectedModel.id)}
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange(model);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all border-b border-gray-100 last:border-b-0 ${
                        selectedModel.id === model.id ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-l-purple-600' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getModelIcon(model.id)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-gray-900">{model.name}</p>
                            {getModelBadge(model.id)}
                            {selectedModel.id === model.id && (
                              <span className="ml-auto text-purple-600 text-xs font-bold">✓ ACTIVE</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{model.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Description Below */}
              <p className="text-xs text-gray-500 mt-2 font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {selectedModel.description}
              </p>
            </div>

            {/* API Documentation Button - Only show for HussAI 20B */}
            {selectedModel.id === 'gpt-oss-20b' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Developer Tools
                </label>
                <button
                  onClick={onShowAPIGuide}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <Code className="h-5 w-5" />
                  <span>API Docs</span>
                </button>
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  Integration guide & examples
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;