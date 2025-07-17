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