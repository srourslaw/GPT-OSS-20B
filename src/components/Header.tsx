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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GPT-OSS-20B Dashboard</h1>
            <p className="text-sm text-gray-600">Test and compare AI models with document analysis</p>
          </div>

          <div className="relative">
            <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {AI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">{selectedModel.description}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;