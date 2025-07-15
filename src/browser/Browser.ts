import { Browser as PlaywrightBrowser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';
import { BrowserType, BrowserConfig } from '../types/browser';
import { SessionManager } from './SessionManager';

export class Browser {
  private browser: PlaywrightBrowser | null = null;
  private context: BrowserContext | null = null;
  private config: BrowserConfig;
  private sessionManager: SessionManager | null = null;
  private currentSessionName: string | null = null;

  constructor(config: BrowserConfig) {
    this.config = {
      viewport: { width: 1280, height: 720 },
      timeout: 30000,
      slowMo: 1000,
      ...config
    };

    // Initialize session manager if session config is provided
    if (this.config.session?.enabled) {
      this.sessionManager = new SessionManager(this.config.session);
    }
  }

  /**
   * Launch the browser with the specified configuration
   */
  async launch(sessionName?: string): Promise<void> {
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

    // Load session if session manager is available and session name is provided
    if (this.sessionManager && sessionName) {
      this.currentSessionName = sessionName;
      const sessionLoaded = await this.sessionManager.loadSession(this.context, sessionName);
      if (sessionLoaded) {
        console.log(`Session "${sessionName}" loaded successfully`);
      } else {
        console.log(`No existing session found for "${sessionName}", starting fresh`);
      }
    }
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
   * Save the current session
   */
  async saveSession(sessionName?: string): Promise<void> {
    if (!this.sessionManager || !this.context) {
      throw new Error('Session management not enabled or browser not launched');
    }

    const name = sessionName || this.currentSessionName || 'default';
    await this.sessionManager.saveSession(this.context, name);
    console.log(`Session "${name}" saved successfully`);
  }

  /**
   * Load a session
   */
  async loadSession(sessionName: string): Promise<boolean> {
    if (!this.sessionManager || !this.context) {
      throw new Error('Session management not enabled or browser not launched');
    }

    const loaded = await this.sessionManager.loadSession(this.context, sessionName);
    if (loaded) {
      this.currentSessionName = sessionName;
      console.log(`Session "${sessionName}" loaded successfully`);
    }
    return loaded;
  }

  /**
   * Check if a session exists
   */
  sessionExists(sessionName: string): boolean {
    if (!this.sessionManager) {
      return false;
    }
    return this.sessionManager.sessionExists(sessionName);
  }

  /**
   * List all available sessions
   */
  listSessions(): string[] {
    if (!this.sessionManager) {
      return [];
    }
    return this.sessionManager.listSessions();
  }

  /**
   * Delete a session
   */
  deleteSession(sessionName: string): boolean {
    if (!this.sessionManager) {
      return false;
    }
    return this.sessionManager.deleteSession(sessionName);
  }

  /**
   * Get session info
   */
  getSessionInfo(sessionName: string) {
    if (!this.sessionManager) {
      return null;
    }
    return this.sessionManager.getSessionInfo(sessionName);
  }

  /**
   * Close the browser and save session if enabled
   */
  async close(): Promise<void> {
    // Save session before closing if session management is enabled
    if (this.sessionManager && this.context && this.currentSessionName) {
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
    this.currentSessionName = null;
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
   * Get current session name
   */
  getCurrentSessionName(): string | null {
    return this.currentSessionName;
  }

  /**
   * Check if session management is enabled
   */
  isSessionManagementEnabled(): boolean {
    return this.sessionManager !== null;
  }
} 