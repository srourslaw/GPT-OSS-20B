import React, { useState } from 'react';
import { MessageSquare, Plus, Clock, Pin, Trash2, ChevronLeft, ChevronRight, Search, MoreVertical } from 'lucide-react';
import { ChatSession } from '../types';

interface ChatHistoryProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onPinSession?: (sessionId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onPinSession,
  isOpen,
  onToggle
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

  // Format timestamp to friendly text
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const timestamp = new Date(date);
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? 's' : ''} ago`;
  };

  // Filter sessions by search query
  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group sessions by time period
  const groupSessionsByTime = (sessions: ChatSession[]) => {
    const groups: { [key: string]: ChatSession[] } = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      'Older': []
    };

    const now = new Date();

    sessions.forEach(session => {
      const timestamp = new Date(session.updatedAt);
      const diffDays = Math.floor((now.getTime() - timestamp.getTime()) / 86400000);

      if (diffDays === 0) {
        groups['Today'].push(session);
      } else if (diffDays === 1) {
        groups['Yesterday'].push(session);
      } else if (diffDays < 7) {
        groups['Previous 7 Days'].push(session);
      } else if (diffDays < 30) {
        groups['Previous 30 Days'].push(session);
      } else {
        groups['Older'].push(session);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  };

  const groupedSessions = groupSessionsByTime(filteredSessions);

  // Sort sessions: pinned first, then by updatedAt
  const sortSessions = (sessions: ChatSession[]) => {
    return [...sessions].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  };

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button
        onClick={onToggle}
        className="absolute top-2 left-2 z-10 p-2 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all hover:bg-gray-50"
        title={isOpen ? 'Close History' : 'Open History'}
      >
        {isOpen ? (
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-700" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`absolute top-0 left-0 h-full bg-white border-r border-gray-200 shadow-xl transition-all duration-300 ease-in-out z-30 ${
          isOpen ? 'w-80' : 'w-0'
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900">Chat History</h2>
              </div>
              <button
                onClick={onNewSession}
                className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-105 shadow-md"
                title="New Chat"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2">
            {Object.keys(groupedSessions).length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-2">No chats yet</p>
                <p className="text-xs text-gray-400">Start a new conversation!</p>
              </div>
            ) : (
              Object.entries(groupedSessions).map(([group, groupSessions]) => (
                <div key={group} className="mb-4">
                  {/* Group Header */}
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {group}
                  </div>

                  {/* Group Sessions */}
                  <div className="space-y-1">
                    {sortSessions(groupSessions).map((session) => (
                      <div
                        key={session.id}
                        onMouseEnter={() => setHoveredSessionId(session.id)}
                        onMouseLeave={() => setHoveredSessionId(null)}
                        className="relative group"
                      >
                        <div
                          onClick={() => onSessionSelect(session.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                            activeSessionId === session.id
                              ? 'bg-gradient-to-r from-blue-100 to-purple-100 border border-purple-300 shadow-sm'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {session.isPinned && (
                                  <Pin className="h-3 w-3 text-purple-600 flex-shrink-0" />
                                )}
                                <p
                                  className={`text-sm font-medium truncate ${
                                    activeSessionId === session.id ? 'text-purple-900' : 'text-gray-900'
                                  }`}
                                  title={session.title}
                                >
                                  {session.title}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimestamp(session.updatedAt)}</span>
                                <span className="text-gray-400">•</span>
                                <span>{session.messages.length} msg{session.messages.length !== 1 ? 's' : ''}</span>
                              </div>
                            </div>

                            {/* Actions - Show on hover */}
                            {hoveredSessionId === session.id && (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {onPinSession && (
                                  <button
                                    onClick={() => onPinSession(session.id)}
                                    className="p-1 hover:bg-white rounded transition-colors"
                                    title={session.isPinned ? 'Unpin' : 'Pin'}
                                  >
                                    <Pin className={`h-3.5 w-3.5 ${session.isPinned ? 'text-purple-600' : 'text-gray-400'}`} />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (window.confirm('Delete this chat?')) {
                                      onDeleteSession(session.id);
                                    }
                                  }}
                                  className="p-1 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              {sessions.length} total chat{sessions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default ChatHistory;
