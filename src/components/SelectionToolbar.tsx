import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  Maximize2,
  Minimize2,
  RefreshCw,
  Languages,
  Lightbulb,
  Send,
  X,
  AlignJustify
} from 'lucide-react';

interface SelectionToolbarProps {
  selectedText: string;
  position: { top: number; left: number } | null;
  onModify: (instruction: string, selectedText: string) => void;
  onClose: () => void;
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedText,
  position,
  onModify,
  onClose
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state when selection changes
    setShowCustomInput(false);
    setCustomInstruction('');
    setIsProcessing(false);
  }, [selectedText]);

  const handleQuickAction = async (action: string) => {
    setIsProcessing(true);
    await onModify(action, selectedText);
    setIsProcessing(false);
    // Don't close automatically - let user make more edits
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInstruction.trim()) return;

    setIsProcessing(true);
    await onModify(customInstruction, selectedText);
    setIsProcessing(false);
    setCustomInstruction('');
    setShowCustomInput(false);
  };

  if (!position || !selectedText) return null;

  const quickActions = [
    {
      icon: Sparkles,
      label: 'Improve',
      action: 'Improve and enhance this text while keeping the same meaning',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Minimize2,
      label: 'Simplify',
      action: 'Simplify this text and make it easier to understand',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Maximize2,
      label: 'Expand',
      action: 'Expand this text with more details and examples',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: RefreshCw,
      label: 'Rephrase',
      action: 'Rephrase this text in a different way',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: Lightbulb,
      label: 'Fix Grammar',
      action: 'Fix any grammar, spelling, and punctuation errors in this text',
      gradient: 'from-yellow-500 to-amber-500'
    },
    {
      icon: Languages,
      label: 'Professional',
      action: 'Make this text more professional and formal',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: AlignJustify,
      label: 'Format',
      action: 'FORMATTING_ACTION: Restructure this messy text with proper formatting. Add clear paragraph breaks, convert lists into numbered format (1. 2. 3.), add proper spacing between sections, and organize the content in a clean, readable structure. Use line breaks and proper indentation to make it professional and easy to read.',
      gradient: 'from-teal-500 to-green-500'
    }
  ];

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 animate-fadeIn"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-12px'
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden backdrop-blur-lg bg-opacity-95">
        {/* Header */}
        <div className="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-sm font-semibold">
            <Zap className="w-4 h-4" />
            <span>AI Modify Selection</span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Actions */}
        {!showCustomInput && (
          <div className="p-3">
            <div className="grid grid-cols-3 gap-2 mb-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.action)}
                    disabled={isProcessing}
                    className={`
                      group relative px-3 py-2.5 rounded-lg text-white font-medium text-xs
                      bg-gradient-to-br ${action.gradient}
                      hover:shadow-lg hover:scale-105 active:scale-95
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex flex-col items-center gap-1
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Action Button */}
            <button
              onClick={() => setShowCustomInput(true)}
              disabled={isProcessing}
              className="w-full mt-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gray-700 to-gray-900 text-white font-medium text-sm hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Custom Instruction</span>
            </button>
          </div>
        )}

        {/* Custom Input Form */}
        {showCustomInput && (
          <form onSubmit={handleCustomSubmit} className="p-3">
            <div className="mb-2">
              <input
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="Tell AI what to do with this text..."
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                disabled={isProcessing}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isProcessing || !customInstruction.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Apply</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomInstruction('');
                }}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Processing Indicator */}
        {isProcessing && !showCustomInput && (
          <div className="px-4 py-2 bg-purple-50 border-t border-purple-100 flex items-center gap-2 text-purple-700 text-xs">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>AI is modifying your text...</span>
          </div>
        )}
      </div>

      {/* Arrow pointing to selection */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid white',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }}
      />
    </div>
  );
};

export default SelectionToolbar;
