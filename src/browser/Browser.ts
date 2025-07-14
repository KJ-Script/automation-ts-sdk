import { Browser as PlaywrightBrowser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';
import { BrowserType, BrowserConfig } from '../types/browser';
import { BrowserConfigSchema } from '../schemas/browser';

export class Browser {
  private browser: PlaywrightBrowser | null = null;
  private context: BrowserContext | null = null;
  private config: BrowserConfig;

  constructor(config: BrowserConfig) {
    // Validate configuration with Zod
    const validatedConfig = BrowserConfigSchema.parse(config);
    
    this.config = {
      viewport: { width: 1280, height: 720 },
      timeout: 30000,
      slowMo: 1000,
      ...validatedConfig
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
   * Close the browser
   */
  async close(): Promise<void> {
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
} 