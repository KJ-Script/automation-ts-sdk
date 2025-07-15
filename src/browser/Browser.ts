import { Browser as PlaywrightBrowser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';
import { BrowserType, BrowserConfig, TabManagerConfig } from '../types/browser';
import { TabManager } from './TabManager';

export class Browser {
  private browser: PlaywrightBrowser | null = null;
  private context: BrowserContext | null = null;
  private tabManager: TabManager | null = null;
  private config: BrowserConfig;

  constructor(config: BrowserConfig) {
    this.config = {
      viewport: { width: 1280, height: 720 },
      timeout: 30000,
      slowMo: 1000,
      ...config
    };
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

    // Initialize tab manager
    this.tabManager = new TabManager(this.context);
  }

  /**
   * Create a new page in the browser (backward compatibility)
   */
  async newPage(): Promise<Page> {
    if (!this.context) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return await this.context.newPage();
  }

  /**
   * Navigate to a URL (backward compatibility)
   */
  async goto(url: string): Promise<Page> {
    const page = await this.newPage();
    await page.goto(url);
    return page;
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.tabManager) {
      await this.tabManager.closeAllTabs();
      this.tabManager = null;
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

  // ============ MULTI-TAB FUNCTIONALITY ============

  /**
   * Get the tab manager
   */
  getTabManager(): TabManager | null {
    return this.tabManager;
  }

  /**
   * Create a new tab
   */
  async createTab(url?: string): Promise<string> {
    if (!this.tabManager) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return await this.tabManager.createTab(url);
  }

  /**
   * Navigate a tab to a URL
   */
  async navigateTab(tabId: string, url: string): Promise<void> {
    if (!this.tabManager) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    await this.tabManager.navigateTab(tabId, url);
  }

  /**
   * Switch to a specific tab
   */
  async switchToTab(tabId: string): Promise<void> {
    if (!this.tabManager) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    await this.tabManager.switchToTab(tabId);
  }

  /**
   * Close a specific tab
   */
  async closeTab(tabId: string): Promise<void> {
    if (!this.tabManager) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    await this.tabManager.closeTab(tabId);
  }

  /**
   * Get a tab by ID
   */
  getTab(tabId: string) {
    if (!this.tabManager) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return this.tabManager.getTab(tabId);
  }

  /**
   * Get the active tab
   */
  getActiveTab() {
    if (!this.tabManager) {
      return null;
    }
    return this.tabManager.getActiveTab();
  }

  /**
   * Get all tabs
   */
  getAllTabs() {
    if (!this.tabManager) {
      return [];
    }
    return this.tabManager.getAllTabs();
  }

  /**
   * Get tab count
   */
  getTabCount(): number {
    if (!this.tabManager) {
      return 0;
    }
    return this.tabManager.getTabCount();
  }

  /**
   * Get a tab's page object
   */
  getTabPage(tabId: string): Page {
    if (!this.tabManager) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return this.tabManager.getTabPage(tabId);
  }

  /**
   * Execute a function on a specific tab
   */
  async executeOnTab<T>(tabId: string, fn: (page: Page) => Promise<T>): Promise<T> {
    if (!this.tabManager) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return await this.tabManager.executeOnTab(tabId, fn);
  }

  /**
   * Execute a function on all tabs
   */
  async executeOnAllTabs<T>(fn: (page: Page, tabId: string) => Promise<T>): Promise<Map<string, T>> {
    if (!this.tabManager) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return await this.tabManager.executeOnAllTabs(fn);
  }

  /**
   * Get tab statistics
   */
  getTabStats() {
    if (!this.tabManager) {
      return {
        totalTabs: 0,
        activeTabId: null,
        oldestTab: null,
        newestTab: null
      };
    }
    return this.tabManager.getStats();
  }
} 