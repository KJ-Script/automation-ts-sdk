import { Page, Locator } from 'playwright';
import { 
  ClickOptions, 
  TypeOptions, 
  ScrollOptions, 
  WaitOptions, 
  ScreenshotOptions, 
  ScreenshotFullPageOptions
} from '../../types/browser-actions';

export class BrowserActions {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ============ CLICKING ACTIONS ============

  /**
   * Click on an element by selector
   */
  async click(selector: string, options: ClickOptions = {}): Promise<void> {
    const element = this.page.locator(selector);
    await element.click({
      timeout: options.timeout || 30000,
      force: options.force || false,
      delay: options.delay || 0,
      button: options.button || 'left',
      clickCount: options.clickCount || 1,
      position: options.position
    });
  }

  /**
   * Click on the first element matching the selector (useful when multiple elements match)
   */
  async clickFirst(selector: string, options: ClickOptions = {}): Promise<void> {
    const element = this.page.locator(selector).first();
    await element.click({
      timeout: options.timeout || 30000,
      force: options.force || false,
      delay: options.delay || 0,
      button: options.button || 'left',
      clickCount: options.clickCount || 1,
      position: options.position
    });
  }

  /**
   * Click on an element by text
   */
  async clickByText(text: string, options: ClickOptions = {}): Promise<void> {
    const element = this.page.getByText(text);
    await element.click({
      timeout: options.timeout || 30000,
      force: options.force || false,
    });
  }

  /**
   * Double click on an element
   */
  async doubleClick(selector: string, options: ClickOptions = {}): Promise<void> {
    await this.click(selector, { ...options, clickCount: 2 });
  }

  /**
   * Right click on an element
   */
  async rightClick(selector: string, options: ClickOptions = {}): Promise<void> {
    await this.click(selector, { ...options, button: 'right' });
  }

  /**
   * Click at specific coordinates
   */
  async clickAt(x: number, y: number, options: ClickOptions = {}): Promise<void> {
    await this.page.mouse.click(x, y, {
      delay: options.delay || 0,
      button: options.button || 'left',
      clickCount: options.clickCount || 1
    });
  }

  // ============ TYPING ACTIONS ============

  /**
   * Type text into an element
   */
  async type(selector: string, text: string, options: TypeOptions = {}): Promise<void> {
    const element = this.page.locator(selector);
    
    if (options.clear) {
      await element.clear();
    }
    
    await element.fill(text);
    
    if (options.delay) {
      await element.type(text, { delay: options.delay });
    }
  }

  /**
   * Clear text from an input field
   */
  async clear(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.clear();
  }

  /**
   * Press a key or key combination
   */
  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Press multiple keys in sequence
   */
  async pressSequence(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.page.keyboard.press(key);
    }
  }

  // ============ SCROLLING ACTIONS ============

  /**
   * Scroll to an element
   */
  async scrollToElement(selector: string, options: ScrollOptions = {}): Promise<void> {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded({ timeout: options.timeout || 30000 });
  }

  /**
   * Scroll by pixels
   */
  async scrollBy(x: number, y: number, options: ScrollOptions = {}): Promise<void> {
    await this.page.evaluate(({ x, y, behavior }) => {
      window.scrollBy({ left: x, top: y, behavior });
    }, { x, y, behavior: options.behavior || 'auto' });
  }

  /**
   * Scroll to top of page
   */
  async scrollToTop(options: ScrollOptions = {}): Promise<void> {
    await this.page.evaluate((behavior) => {
      window.scrollTo({ top: 0, behavior });
    }, options.behavior || 'auto');
  }

  /**
   * Scroll to bottom of page
   */
  async scrollToBottom(options: ScrollOptions = {}): Promise<void> {
    await this.page.evaluate((behavior) => {
      window.scrollTo({ top: document.body.scrollHeight, behavior });
    }, options.behavior || 'auto');
  }

  // ============ HOVER ACTIONS ============

  /**
   * Hover over an element
   */
  async hover(selector: string, options: { timeout?: number } = {}): Promise<void> {
    const element = this.page.locator(selector);
    await element.hover({ timeout: options.timeout || 30000 });
  }

  // ============ FORM ACTIONS ============

  /**
   * Select option from dropdown by value
   */
  async selectOption(selector: string, value: string | string[]): Promise<void> {
    const element = this.page.locator(selector);
    await element.selectOption(value);
  }

  /**
   * Check a checkbox or radio button
   */
  async check(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.check();
  }

  /**
   * Uncheck a checkbox
   */
  async uncheck(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.uncheck();
  }

  /**
   * Upload a file
   */
  async uploadFile(selector: string, filePath: string | string[]): Promise<void> {
    const element = this.page.locator(selector);
    await element.setInputFiles(filePath);
  }

  // ============ WAITING ACTIONS ============

  /**
   * Wait for an element to be visible
   */
  async waitForElement(selector: string, options: WaitOptions = {}): Promise<void> {
    await this.page.waitForSelector(selector, {
      timeout: options.timeout || 30000,
      state: options.state || 'visible'
    });
  }

  /**
   * Wait for text to appear on page
   */
  async waitForText(text: string, options: WaitOptions = {}): Promise<void> {
    await this.page.waitForFunction(
      (text) => document.body.innerText.includes(text),
      text,
      { timeout: options.timeout || 30000 }
    );
  }

  /**
   * Wait for a specific amount of time
   */
  async wait(milliseconds: number): Promise<void> {
    await this.page.waitForTimeout(milliseconds);
  }

  /**
   * Wait for page to load completely
   */
  async waitForLoad(timeout: number = 60000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  // ============ NAVIGATION ACTIONS ============

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
  }

  /**
   * Go forward in browser history
   */
  async goForward(): Promise<void> {
    await this.page.goForward();
  }

  /**
   * Refresh the page
   */
  async refresh(): Promise<void> {
    await this.page.reload();
  }

  // ============ SCREENSHOT ACTIONS ============

  /**
   * Take a screenshot of the page
   */
  async screenshot(options: ScreenshotOptions = {}): Promise<Buffer> {
    return await this.page.screenshot({
      path: options.path,
      fullPage: options.fullPage || false,
      quality: options.quality,
      type: options.type || 'png'
    });
  }

  /**
   * Take a screenshot of a specific element
   */
  async screenshotElement(selector: string, options: ScreenshotOptions = {}): Promise<Buffer> {
    const element = this.page.locator(selector);
    return await element.screenshot({
      path: options.path,
      quality: options.quality,
      type: options.type || 'png'
    });
  }

  // ============ DRAG AND DROP ACTIONS ============

  /**
   * Drag and drop from source to target
   */
  async dragAndDrop(sourceSelector: string, targetSelector: string): Promise<void> {
    const source = this.page.locator(sourceSelector);
    const target = this.page.locator(targetSelector);
    await source.dragTo(target);
  }

  // ============ INFORMATION GATHERING ============

  /**
   * Get text content of an element
   */
  async getText(selector: string): Promise<string | null> {
    const element = this.page.locator(selector);
    return await element.textContent();
  }

  /**
   * Get attribute value of an element
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    const element = this.page.locator(selector);
    return await element.getAttribute(attribute);
  }

  /**
   * Get value of an input element
   */
  async getValue(selector: string): Promise<string> {
    const element = this.page.locator(selector);
    return await element.inputValue();
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    return await element.isVisible();
  }

  /**
   * Check if element is enabled
   */
  async isEnabled(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    return await element.isEnabled();
  }

  /**
   * Check if checkbox/radio is checked
   */
  async isChecked(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    return await element.isChecked();
  }

  /**
   * Get count of elements matching selector
   */
  async getElementCount(selector: string): Promise<number> {
    const elements = this.page.locator(selector);
    return await elements.count();
  }

  // ============ ADVANCED ACTIONS ============

  /**
   * Execute custom JavaScript on the page
   */
  async executeScript<T = any>(script: string | Function, ...args: any[]): Promise<T> {
    return await this.page.evaluate(script as any, ...args);
  }

  /**
   * Focus on an element
   */
  async focus(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.focus();
  }

  /**
   * Blur (unfocus) an element
   */
  async blur(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.blur();
  }

  async screenshotFullPage(options: ScreenshotOptions = {}): Promise<Buffer> {
    return await this.page.screenshot({
      path: options.path,
      fullPage: true,
      quality: options.quality,
      type: options.type || 'png'
    });
  }

  async createNewTab(): Promise<void> {
    await this.page.evaluate(() => {
      window.open('', '_blank');
    });
  }

  async closeTab(): Promise<void> {
    await this.page.evaluate(() => {
      window.close();
    });
  }

  async switchToTab(index: number): Promise<void> {
    await this.page.evaluate((index) => {
      window.open('', '_blank');
    }, index);
  }

  async getCurrentTab(): Promise<void> {
    await this.page.evaluate(() => {
      return window.open('', '_blank');
    });
  }
} 