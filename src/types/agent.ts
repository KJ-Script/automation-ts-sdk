import { BrowserConfig } from '../types';

export interface Task {
  id: string;
  description: string;
  type: 
    // Basic actions
    | 'navigate' | 'click' | 'clickByText' | 'type' | 'extract' | 'analyze' | 'wait' | 'custom'
    // Advanced clicking actions
    | 'clickByRole' | 'clickByLabel' | 'clickByPlaceholder' | 'clickByAltText' | 'clickByTitle' 
    | 'clickByTestId' | 'clickByAriaLabel' | 'clickByName' | 'clickById' | 'clickByClassName' | 'clickFirstMatch'
    // Advanced typing actions
    | 'typeByRole' | 'typeByLabel' | 'typeByPlaceholder' | 'typeByTestId' | 'typeByName' | 'typeById'
    // Form actions
    | 'selectOption' | 'selectOptionByRole' | 'selectOptionByLabel'
    | 'check' | 'checkByRole' | 'checkByLabel'
    | 'uncheck' | 'uncheckByRole' | 'uncheckByLabel'
    | 'uploadFile' | 'uploadFileByRole' | 'uploadFileByLabel'
    // Waiting actions
    | 'waitForElement' | 'waitForRole' | 'waitForLabel' | 'waitForPlaceholder' | 'waitForTestId' 
    | 'waitForText' | 'waitForNetworkIdle' | 'waitForDOMContentLoaded'
    // Other actions
    | 'scrollToElement' | 'scrollToTop' | 'scrollToBottom' | 'hover' | 'press' | 'pressSequence'
    | 'clear' | 'focus' | 'blur' | 'refresh' | 'goBack' | 'goForward';
  
  // Basic properties
  selector?: string;
  text?: string;
  clickText?: string;
  url?: string;
  
  // Advanced clicking properties
  role?: string;
  roleName?: string;
  label?: string;
  placeholder?: string;
  altText?: string;
  title?: string;
  testId?: string;
  ariaLabel?: string;
  name?: string;
  elementId?: string; // Renamed to avoid conflict with task id
  className?: string;
  selectors?: string[];
  exact?: boolean;
  
  // Advanced typing properties (reuse above properties)
  
  // Form properties
  value?: string | string[];
  filePath?: string | string[];
  
  // Waiting properties
  waitTime?: number;
  
  // Other properties
  key?: string;
  keys?: string[];
  
  // Common properties
  completed: boolean;
  result?: any;
  screenshots?: {
    before?: string;
    after?: string;
  };
}

export interface PerformanceConfig {
  fastMode?: boolean;                    // Enables fast mode with reduced waits and analysis
  clickWaitTime?: number;               // Wait time after clicks (default: 1500ms)
  typeWaitTime?: number;                // Wait time after typing (default: 500ms)
  taskWaitTime?: number;                // Wait time between tasks (default: 1000ms)
  pageLoadTimeout?: number;             // Page load timeout (default: 30000ms)
  actionTimeout?: number;               // Action timeout (default: 10000ms)
  screenshotFrequency?: 'all' | 'key' | 'minimal'; // Screenshot frequency
  domAnalysisFrequency?: 'all' | 'key' | 'minimal'; // DOM analysis frequency
}

export interface AgentConfig {
  apiKey: string;
  model?: string;
  browserConfig?: Partial<BrowserConfig>;
  maxRetries?: number;
  debugMode?: boolean;
  screenshotDir?: string;
  enableScreenshots?: boolean;
  performance?: PerformanceConfig;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  tasks: Task[];
  finalResult?: any;
  screenshots?: string[];
}

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
  domSummary?: string;
  extractedData?: any;
  lastScreenshot?: string;
} 