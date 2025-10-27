import React, { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Maximize2, Square, GripHorizontal } from 'lucide-react';
import { CanvasWindow as CanvasWindowType } from '../types';

interface CanvasWindowProps {
  window: CanvasWindowType;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onUpdatePosition: (x: number, y: number) => void;
  onUpdateSize: (width: number, height: number) => void;
  onBringToFront: () => void;
  children: React.ReactNode;
}

const CanvasWindow: React.FC<CanvasWindowProps> = ({
  window: windowData,
  onClose,
  onMinimize,
  onMaximize,
  onUpdatePosition,
  onUpdateSize,
  onBringToFront,
  children
}) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-header')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - windowData.x, y: e.clientY - windowData.y });
      onBringToFront();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, e.clientX - dragStart.x);
      const newY = Math.max(0, e.clientY - dragStart.y);
      onUpdatePosition(newX, newY);
    } else if (isResizing) {
      const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
      const newHeight = Math.max(200, resizeStart.height + (e.clientY - resizeStart.y));
      onUpdateSize(newWidth, newHeight);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      globalThis.window.addEventListener('mousemove', handleMouseMove);
      globalThis.window.addEventListener('mouseup', handleMouseUp);
      return () => {
        globalThis.window.removeEventListener('mousemove', handleMouseMove);
        globalThis.window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  // Handle resize
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: windowData.width,
      height: windowData.height
    });
    onBringToFront();
  };

  if (windowData.isMinimized) {
    return null; // We'll handle minimized windows separately in the taskbar
  }

  const style: React.CSSProperties = windowData.isMaximized
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: windowData.zIndex
      }
    : {
        position: 'absolute',
        left: windowData.x,
        top: windowData.y,
        width: windowData.width,
        height: windowData.height,
        zIndex: windowData.zIndex
      };

  return (
    <div
      ref={windowRef}
      className="canvas-window bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col overflow-hidden"
      style={style}
      onMouseDown={() => onBringToFront()}
    >
      {/* Window Header */}
      <div
        className="window-header bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 flex items-center justify-between cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 opacity-60" />
          <h3 className="text-sm font-semibold">{windowData.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Minimize"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onMaximize}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={windowData.isMaximized ? "Restore" : "Maximize"}
          >
            {windowData.isMaximized ? (
              <Square className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-500 rounded transition-colors"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* Resize Handle */}
      {!windowData.isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400"></div>
        </div>
      )}
    </div>
  );
};

export default CanvasWindow;
