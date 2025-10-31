import { ChatSession, ChatMessage } from '../types';

/**
 * Generate a title from the first user message
 * Extracts key words and creates a concise, meaningful title
 */
export const generateChatTitle = (firstMessage: string): string => {
  // Remove extra whitespace and newlines
  const cleanMessage = firstMessage.trim().replace(/\s+/g, ' ');

  // If message is very short, use it as is
  if (cleanMessage.length <= 40) {
    return cleanMessage;
  }

  // Try to extract a question or main topic
  const sentences = cleanMessage.split(/[.!?]+/);
  const firstSentence = sentences[0].trim();

  // If first sentence is reasonable length, use it
  if (firstSentence.length <= 60) {
    return firstSentence;
  }

  // Otherwise, truncate intelligently
  const words = firstSentence.split(' ');
  let title = '';

  for (const word of words) {
    if ((title + ' ' + word).length > 50) {
      break;
    }
    title += (title ? ' ' : '') + word;
  }

  return title + '...';
};

/**
 * Create a new chat session
 */
export const createNewSession = (): ChatSession => {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: 'New Chat',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isPinned: false,
  };
};

/**
 * Update session title based on first user message
 */
export const updateSessionTitle = (session: ChatSession): ChatSession => {
  // Only auto-generate if title is still "New Chat" and there's a user message
  if (session.title === 'New Chat' && session.messages.length > 0) {
    const firstUserMessage = session.messages.find(msg => msg.isUser);
    if (firstUserMessage) {
      return {
        ...session,
        title: generateChatTitle(firstUserMessage.text),
      };
    }
  }
  return session;
};

/**
 * Save chat history to localStorage for a specific window
 */
export const saveChatHistory = (windowId: string, sessions: ChatSession[], activeSessionId: string | null) => {
  try {
    const data = {
      sessions: sessions.map(session => ({
        ...session,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        messages: session.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
      })),
      activeSessionId,
    };
    localStorage.setItem(`chat-history-${windowId}`, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};

/**
 * Load chat history from localStorage for a specific window
 */
export const loadChatHistory = (windowId: string): { sessions: ChatSession[], activeSessionId: string | null } => {
  try {
    const saved = localStorage.getItem(`chat-history-${windowId}`);
    if (!saved) {
      return { sessions: [], activeSessionId: null };
    }

    const data = JSON.parse(saved);
    return {
      sessions: data.sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      })),
      activeSessionId: data.activeSessionId,
    };
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return { sessions: [], activeSessionId: null };
  }
};

/**
 * Delete a session by ID
 */
export const deleteSession = (sessions: ChatSession[], sessionId: string): ChatSession[] => {
  return sessions.filter(session => session.id !== sessionId);
};

/**
 * Toggle pin status for a session
 */
export const togglePinSession = (sessions: ChatSession[], sessionId: string): ChatSession[] => {
  return sessions.map(session =>
    session.id === sessionId
      ? { ...session, isPinned: !session.isPinned }
      : session
  );
};

/**
 * Get active session or create a new one if none exists
 */
export const getOrCreateActiveSession = (
  sessions: ChatSession[],
  activeSessionId: string | null
): { session: ChatSession, isNew: boolean } => {
  if (activeSessionId) {
    const session = sessions.find(s => s.id === activeSessionId);
    if (session) {
      return { session, isNew: false };
    }
  }

  // Create new session if none exists or active session not found
  const newSession = createNewSession();
  return { session: newSession, isNew: true };
};
