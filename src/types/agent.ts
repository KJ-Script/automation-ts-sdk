import { BrowserConfig } from './browser';

// ============ AGENT TYPES ============

export interface Task {
  id: string;
  description: string;
  type: 'navigate' | 'click' | 'clickByText' | 'type' | 'extract' | 'analyze' | 'wait' | 'screenshot' | 'custom' | 'createTab' | 'switchTab' | 'closeTab' | 'openInNewTab';
  selector?: string;
  text?: string;
  clickText?: string;
  url?: string;
  parameters?: Record<string, any>;
  reasoning?: string;
  completed: boolean;
  result?: any;
  screenshot?: string;
  tabIndex?: number;
}

export interface AgentConfig {
  apiKey: string;
  model?: string;
  browserConfig?: Partial<BrowserConfig>;
  maxRetries?: number;
  debugMode?: boolean;
  screenshotDir?: string;
  enableScreenshots?: boolean;
  maxTabs?: number;
  sessionName?: string;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  tasks: Task[];
  finalResult?: any;
  screenshots?: string[];
} 