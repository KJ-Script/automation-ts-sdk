import { BrowserConfig, TabManagerConfig } from './browser';

// ============ AGENT TYPES ============

export interface Task {
  id: string;
  description: string;
  type: 'navigate' | 'click' | 'clickByText' | 'type' | 'extract' | 'analyze' | 'wait' | 'screenshot' | 'custom';
  selector?: string;
  text?: string;
  clickText?: string;
  url?: string;
  parameters?: Record<string, any>;
  reasoning?: string;
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

// ============ MULTI-TAB AGENT TYPES ============

export interface ParallelTask {
  id: string;
  instruction: string;
  tabId?: string; // if specified, use this tab; otherwise create new
  priority?: number; // higher number = higher priority
  timeout?: number;
  retries?: number;
}

export interface ParallelTaskResult {
  taskId: string;
  tabId: string;
  success: boolean;
  result: any;
  error?: string;
  duration: number;
  screenshots: string[];
}

// Re-export TabManagerConfig for convenience
export { TabManagerConfig } from './browser'; 