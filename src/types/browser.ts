// ============ BROWSER TYPES ============

export type BrowserType = 'chrome' | 'firefox' | 'safari';

export interface SessionConfig {
  enabled: boolean;
  sessionDir?: string;
  sessionName?: string;
  persistCookies?: boolean;
  persistLocalStorage?: boolean;
  persistSessionStorage?: boolean;
}

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
  session?: SessionConfig;
} 