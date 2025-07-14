import { BrowserConfig } from './browser';

// ============ AGENT TYPES ============

export interface Task {
  id: string;
  description: string;
  type: 'navigate' | 'click' | 'clickByText' | 'type' | 'extract' | 'analyze' | 'wait' | 'custom';
  selector?: string;
  text?: string;
  clickText?: string;
  url?: string;
  completed: boolean;
  result?: any;
  screenshot?: string;
}

export interface AgentConfig {
  apiKey: string;
  model?: string;
  browserConfig?: Partial<BrowserConfig>;
  maxRetries?: number;
  debugMode?: boolean;
  screenshotDir?: string;
  enableScreenshots?: boolean;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  tasks: Task[];
  finalResult?: any;
  screenshots?: string[];
} 