import { Task } from './agent';

// ============ CONVERSATIONAL AGENT TYPES ============

export interface ConversationMessage {
  id: string;
  timestamp: Date;
  role: 'user' | 'assistant';
  content: string;
  tasks?: Task[];
  results?: any;
}

export interface ConversationContext {
  currentUrl?: string;
  currentPageTitle?: string;
  lastScreenshot?: string;
} 