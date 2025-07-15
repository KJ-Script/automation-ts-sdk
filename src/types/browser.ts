// ============ BROWSER TYPES ============

export type BrowserType = 'chrome' | 'firefox' | 'safari';

export interface BrowserConfig {
  type: BrowserType;
  headless?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  userAgent?: string;
  timeout?: number;
  slowMo?: number;
}

// ============ MULTI-TAB TYPES ============

export interface TabInfo {
  id: string;
  page: any; // Playwright Page
  url: string;
  title: string;
  isActive: boolean;
  createdAt: Date;
  lastAccessed: Date;
}

export interface TabManagerConfig {
  maxTabs?: number;
  defaultTimeout?: number;
  autoCloseInactiveTabs?: boolean;
  inactiveTabTimeout?: number; // milliseconds
}

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