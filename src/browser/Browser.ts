import { Browser as PlaywrightBrowser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

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
  sessionDir?: string; // Directory to store session data
  sessionName?: string; // Name of the session to save/load
}

export interface SessionData {
  cookies: any[];
  localStorage: Record<string, Record<string, string>>;
  sessionStorage: Record<string, Record<string, string>>;
  timestamp: number;
}

export class Browser {
  private browser: PlaywrightBrowser | null = null;
  private context: BrowserContext | null = null;
  private config: BrowserConfig;
  private sessionDir: string;
  private sessionName: string;

  constructor(config: BrowserConfig) {
    this.config = {
      headless: false,
      viewport: { width: 1280, height: 720 },
      timeout: 30000,
      slowMo: 1000,
      sessionDir: './sessions',
      sessionName: 'default',
      ...config
    };
    this.sessionDir = this.config.sessionDir!;
    this.sessionName = this.config.sessionName!;
  }

  /**
   * Get the session file path
   */
  private getSessionPath(): string {
    return path.join(this.sessionDir, `${this.sessionName}.json`);
  }

  /**
   * Ensure session directory exists
   */
  private ensureSessionDir(): void {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  /**
   * Save current browser session (cookies, localStorage, sessionStorage)
   */
  async saveSession(): Promise<void> {
    if (!this.context) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    this.ensureSessionDir();
    const sessionPath = this.getSessionPath();

    // Get all pages to collect storage data
    const pages = this.context.pages();
    const localStorageData: Record<string, Record<string, string>> = {};
    const sessionStorageData: Record<string, Record<string, string>> = {};

    // Collect storage data from all pages
    for (const page of pages) {
      const url = page.url();
      if (url && url !== 'about:blank') {
        try {
          const [local, session] = await Promise.all([
            page.evaluate(() => {
              const data: Record<string, string> = {};
              for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                if (key) {
                  data[key] = window.localStorage.getItem(key) || '';
                }
              }
              return data;
            }),
            page.evaluate(() => {
              const data: Record<string, string> = {};
              for (let i = 0; i < window.sessionStorage.length; i++) {
                const key = window.sessionStorage.key(i);
                if (key) {
                  data[key] = window.sessionStorage.getItem(key) || '';
                }
              }
              return data;
            })
          ]);
          
          localStorageData[url] = local;
          sessionStorageData[url] = session;
        } catch (error) {
          console.warn(`Failed to collect storage data from ${url}:`, error);
        }
      }
    }

    // Get cookies
    const cookies = await this.context.cookies();

    const sessionData: SessionData = {
      cookies,
      localStorage: localStorageData,
      sessionStorage: sessionStorageData,
      timestamp: Date.now()
    };

    fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
    console.log(`Session saved to: ${sessionPath}`);
  }

  /**
   * Load browser session from file
   */
  async loadSession(): Promise<boolean> {
    const sessionPath = this.getSessionPath();
    
    if (!fs.existsSync(sessionPath)) {
      console.log(`No session file found at: ${sessionPath}`);
      return false;
    }

    try {
      const sessionData: SessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
      
      if (!this.context) {
        throw new Error('Browser not launched. Call launch() first.');
      }

      // Restore cookies
      if (sessionData.cookies && sessionData.cookies.length > 0) {
        await this.context.addCookies(sessionData.cookies);
        console.log(`Restored ${sessionData.cookies.length} cookies`);
      }

      // Create a page to restore storage data
      const page = await this.context.newPage();
      
      // Restore localStorage and sessionStorage for each URL
      for (const [url, localData] of Object.entries(sessionData.localStorage)) {
        try {
          await page.goto(url);
          await page.evaluate((data) => {
            for (const [key, value] of Object.entries(data)) {
              window.localStorage.setItem(key, value);
            }
          }, localData);
        } catch (error) {
          console.warn(`Failed to restore localStorage for ${url}:`, error);
        }
      }

      for (const [url, sessionStorageData] of Object.entries(sessionData.sessionStorage)) {
        try {
          await page.goto(url);
          await page.evaluate((data) => {
            for (const [key, value] of Object.entries(data)) {
              window.sessionStorage.setItem(key, value);
            }
          }, sessionStorageData);
        } catch (error) {
          console.warn(`Failed to restore sessionStorage for ${url}:`, error);
        }
      }

      await page.close();
      console.log(`Session loaded from: ${sessionPath}`);
      return true;
    } catch (error) {
      console.error('Failed to load session:', error);
      return false;
    }
  }

  /**
   * Check if a session exists
   */
  hasSession(): boolean {
    return fs.existsSync(this.getSessionPath());
  }

  /**
   * Delete the current session
   */
  deleteSession(): void {
    const sessionPath = this.getSessionPath();
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
      console.log(`Session deleted: ${sessionPath}`);
    }
  }

  /**
   * Launch the browser with the specified configuration
   */
  async launch(): Promise<void> {
    const launchOptions = {
      headless: this.config.headless,
      timeout: this.config.timeout
    };

    switch (this.config.type) {
      case 'chrome':
        this.browser = await chromium.launch(launchOptions);
        break;
      case 'firefox':
        this.browser = await firefox.launch(launchOptions);
        break;
      case 'safari':
        this.browser = await webkit.launch(launchOptions);
        break;
      default:
        throw new Error(`Unsupported browser type: ${this.config.type}`);
    }

    // Create a new browser context
    this.context = await this.browser.newContext({
      viewport: this.config.viewport,
      userAgent: this.config.userAgent
    });

    // Try to load existing session
    await this.loadSession();
  }

  /**
   * Create a new page in the browser
   */
  async newPage(): Promise<Page> {
    if (!this.context) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return await this.context.newPage();
  }

  /**
   * Navigate to a URL
   */
  async goto(url: string): Promise<Page> {
    const page = await this.newPage();
    await page.goto(url);
    return page;
  }

  /**
   * Close the browser and optionally save session
   */
  async close(saveSession: boolean = true): Promise<void> {
    if (saveSession && this.context) {
      await this.saveSession();
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get the current browser instance
   */
  getBrowser(): PlaywrightBrowser | null {
    return this.browser;
  }

  /**
   * Get the current browser context
   */
  getContext(): BrowserContext | null {
    return this.context;
  }

  /**
   * Check if browser is launched
   */
  isLaunched(): boolean {
    return this.browser !== null && this.context !== null;
  }

  /**
   * Get session information
   */
  getSessionInfo(): { name: string; path: string; exists: boolean } {
    return {
      name: this.sessionName,
      path: this.getSessionPath(),
      exists: this.hasSession()
    };
  }
} 