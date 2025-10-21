import React from 'react';
import { ChevronDown } from 'lucide-react';
import { AIModel } from '../types';
import { AI_MODELS } from '../utils/constants';

interface HeaderProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

const Header: React.FC<HeaderProps> = ({ selectedModel, onModelChange }) => {
  return (
    <header className="bg-white shadow-md border-b border-gray-200 backdrop-blur-sm">
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

          <div className="relative">
            <label htmlFor="model-select" className="block text-sm font-semibold text-gray-700 mb-2">
              AI Model
            </label>
            <div className="relative">
              <select
                id="model-select"
                value={selectedModel.id}
                onChange={(e) => {
                  const model = AI_MODELS.find(m => m.id === e.target.value);
                  if (model) onModelChange(model);
                }}
                className="appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-gray-400 transition-colors cursor-pointer shadow-sm"
              >
                {AI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-500 mt-1.5 font-medium">{selectedModel.description}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;