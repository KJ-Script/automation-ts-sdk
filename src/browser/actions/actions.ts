import { Page, Locator } from 'playwright';
import { 
  ClickOptions, 
  TypeOptions, 
  ScrollOptions, 
  WaitOptions, 
  ScreenshotOptions, 
  ScreenshotFullPageOptions 
} from '../../types';

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

  // ============ ADVANCED LOCATOR ACTIONS ============

  /**
   * Click on an element by role (e.g., 'button', 'link', 'textbox')
   */
  async clickByRole(role: string, options: { name?: string; exact?: boolean } & ClickOptions = {}): Promise<void> {
    const element = this.page.getByRole(role as any, { 
      name: options.name, 
      exact: options.exact 
    });
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
   * Click on an element by label text
   */
  async clickByLabel(label: string, options: { exact?: boolean } & ClickOptions = {}): Promise<void> {
    const element = this.page.getByLabel(label, { exact: options.exact });
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
   * Click on an element by placeholder text
   */
  async clickByPlaceholder(placeholder: string, options: { exact?: boolean } & ClickOptions = {}): Promise<void> {
    const element = this.page.getByPlaceholder(placeholder, { exact: options.exact });
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
   * Click on an element by alt text (for images)
   */
  async clickByAltText(altText: string, options: { exact?: boolean } & ClickOptions = {}): Promise<void> {
    const element = this.page.getByAltText(altText, { exact: options.exact });
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
   * Click on an element by title attribute
   */
  async clickByTitle(title: string, options: { exact?: boolean } & ClickOptions = {}): Promise<void> {
    const element = this.page.getByTitle(title, { exact: options.exact });
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
   * Click on an element by test ID (data-testid attribute)
   */
  async clickByTestId(testId: string, options: ClickOptions = {}): Promise<void> {
    const element = this.page.getByTestId(testId);
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
   * Click on an element by aria-label
   */
  async clickByAriaLabel(ariaLabel: string, options: { exact?: boolean } & ClickOptions = {}): Promise<void> {
    const element = this.page.getByRole('generic', { name: ariaLabel, exact: options.exact });
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
   * Click on an element by name attribute
   */
  async clickByName(name: string, options: { exact?: boolean } & ClickOptions = {}): Promise<void> {
    const element = this.page.locator(`[name="${name}"]`);
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
   * Click on an element by ID
   */
  async clickById(id: string, options: ClickOptions = {}): Promise<void> {
    const element = this.page.locator(`#${id}`);
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
   * Click on an element by class name
   */
  async clickByClassName(className: string, options: ClickOptions = {}): Promise<void> {
    const element = this.page.locator(`.${className}`);
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
   * Click on the first element that matches any of the provided selectors
   */
  async clickFirstMatch(selectors: string[], options: ClickOptions = {}): Promise<void> {
    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector).first();
        await element.click({
          timeout: options.timeout || 30000,
          force: options.force || false,
          delay: options.delay || 0,
          button: options.button || 'left',
          clickCount: options.clickCount || 1,
          position: options.position
        });
        return; // Successfully clicked, exit
      } catch (error) {
        // Continue to next selector if this one fails
        continue;
      }
    }
    throw new Error(`No elements found matching any of the selectors: ${selectors.join(', ')}`);
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

  // ============ ADVANCED TYPING ACTIONS ============

  /**
   * Type text into an element by role
   */
  async typeByRole(role: string, text: string, options: { name?: string; exact?: boolean } & TypeOptions = {}): Promise<void> {
    const element = this.page.getByRole(role as any, { 
      name: options.name, 
      exact: options.exact 
    });
    
    if (options.clear) {
      await element.clear();
    }
    
    await element.fill(text);
    
    if (options.delay) {
      await element.type(text, { delay: options.delay });
    }
  }

  /**
   * Type text into an element by label
   */
  async typeByLabel(label: string, text: string, options: { exact?: boolean } & TypeOptions = {}): Promise<void> {
    const element = this.page.getByLabel(label, { exact: options.exact });
    
    if (options.clear) {
      await element.clear();
    }
    
    await element.fill(text);
    
    if (options.delay) {
      await element.type(text, { delay: options.delay });
    }
  }

  /**
   * Type text into an element by placeholder
   */
  async typeByPlaceholder(placeholder: string, text: string, options: { exact?: boolean } & TypeOptions = {}): Promise<void> {
    const element = this.page.getByPlaceholder(placeholder, { exact: options.exact });
    
    if (options.clear) {
      await element.clear();
    }
    
    await element.fill(text);
    
    if (options.delay) {
      await element.type(text, { delay: options.delay });
    }
  }

  /**
   * Type text into an element by test ID
   */
  async typeByTestId(testId: string, text: string, options: TypeOptions = {}): Promise<void> {
    const element = this.page.getByTestId(testId);
    
    if (options.clear) {
      await element.clear();
    }
    
    await element.fill(text);
    
    if (options.delay) {
      await element.type(text, { delay: options.delay });
    }
  }

  /**
   * Type text into an element by name attribute
   */
  async typeByName(name: string, text: string, options: { exact?: boolean } & TypeOptions = {}): Promise<void> {
    const element = this.page.locator(`[name="${name}"]`);
    
    if (options.clear) {
      await element.clear();
    }
    
    await element.fill(text);
    
    if (options.delay) {
      await element.type(text, { delay: options.delay });
    }
  }

  /**
   * Type text into an element by ID
   */
  async typeById(id: string, text: string, options: TypeOptions = {}): Promise<void> {
    const element = this.page.locator(`#${id}`);
    
    if (options.clear) {
      await element.clear();
    }
    
    await element.fill(text);
    
    if (options.delay) {
      await element.type(text, { delay: options.delay });
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

  // ============ ADVANCED FORM ACTIONS ============

  /**
   * Select option from dropdown by role
   */
  async selectOptionByRole(role: string, value: string | string[], options: { name?: string; exact?: boolean } = {}): Promise<void> {
    const element = this.page.getByRole(role as any, { 
      name: options.name, 
      exact: options.exact 
    });
    await element.selectOption(value);
  }

  /**
   * Select option from dropdown by label
   */
  async selectOptionByLabel(label: string, value: string | string[], options: { exact?: boolean } = {}): Promise<void> {
    const element = this.page.getByLabel(label, { exact: options.exact });
    await element.selectOption(value);
  }

  /**
   * Check a checkbox by role
   */
  async checkByRole(role: string, options: { name?: string; exact?: boolean } = {}): Promise<void> {
    const element = this.page.getByRole(role as any, { 
      name: options.name, 
      exact: options.exact 
    });
    await element.check();
  }

  /**
   * Check a checkbox by label
   */
  async checkByLabel(label: string, options: { exact?: boolean } = {}): Promise<void> {
    const element = this.page.getByLabel(label, { exact: options.exact });
    await element.check();
  }

  /**
   * Uncheck a checkbox by role
   */
  async uncheckByRole(role: string, options: { name?: string; exact?: boolean } = {}): Promise<void> {
    const element = this.page.getByRole(role as any, { 
      name: options.name, 
      exact: options.exact 
    });
    await element.uncheck();
  }

  /**
   * Uncheck a checkbox by label
   */
  async uncheckByLabel(label: string, options: { exact?: boolean } = {}): Promise<void> {
    const element = this.page.getByLabel(label, { exact: options.exact });
    await element.uncheck();
  }

  /**
   * Upload file by role
   */
  async uploadFileByRole(role: string, filePath: string | string[], options: { name?: string; exact?: boolean } = {}): Promise<void> {
    const element = this.page.getByRole(role as any, { 
      name: options.name, 
      exact: options.exact 
    });
    await element.setInputFiles(filePath);
  }

  /**
   * Upload file by label
   */
  async uploadFileByLabel(label: string, filePath: string | string[], options: { exact?: boolean } = {}): Promise<void> {
    const element = this.page.getByLabel(label, { exact: options.exact });
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

  // ============ ADVANCED WAITING ACTIONS ============

  /**
   * Wait for element by role
   */
  async waitForRole(role: string, options: { name?: string; exact?: boolean; timeout?: number; state?: 'attached' | 'detached' | 'visible' | 'hidden' } = {}): Promise<void> {
    const element = this.page.getByRole(role as any, { 
      name: options.name, 
      exact: options.exact 
    });
    await element.waitFor({ 
      timeout: options.timeout || 30000,
      state: options.state || 'visible'
    });
  }

  /**
   * Wait for element by label
   */
  async waitForLabel(label: string, options: { exact?: boolean; timeout?: number; state?: 'attached' | 'detached' | 'visible' | 'hidden' } = {}): Promise<void> {
    const element = this.page.getByLabel(label, { exact: options.exact });
    await element.waitFor({ 
      timeout: options.timeout || 30000,
      state: options.state || 'visible'
    });
  }

  /**
   * Wait for element by placeholder
   */
  async waitForPlaceholder(placeholder: string, options: { exact?: boolean; timeout?: number; state?: 'attached' | 'detached' | 'visible' | 'hidden' } = {}): Promise<void> {
    const element = this.page.getByPlaceholder(placeholder, { exact: options.exact });
    await element.waitFor({ 
      timeout: options.timeout || 30000,
      state: options.state || 'visible'
    });
  }

  /**
   * Wait for element by test ID
   */
  async waitForTestId(testId: string, options: { timeout?: number; state?: 'attached' | 'detached' | 'visible' | 'hidden' } = {}): Promise<void> {
    const element = this.page.getByTestId(testId);
    await element.waitFor({ 
      timeout: options.timeout || 30000,
      state: options.state || 'visible'
    });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForElementHidden(selector: string, options: WaitOptions = {}): Promise<void> {
    await this.page.waitForSelector(selector, {
      timeout: options.timeout || 30000,
      state: 'hidden'
    });
  }

  /**
   * Wait for element to be detached from DOM
   */
  async waitForElementDetached(selector: string, options: WaitOptions = {}): Promise<void> {
    await this.page.waitForSelector(selector, {
      timeout: options.timeout || 30000,
      state: 'detached'
    });
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle(timeout: number = 30000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Wait for DOM to be ready
   */
  async waitForDOMContentLoaded(timeout: number = 30000): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded', { timeout });
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
   * Get the first element matching the text
   */
  async getFirstElementByText(text: string): Promise<Locator> {
    return this.page.getByText(text).first();
  }

  /**
   * Get the first element matching the selector
   */
  async getFirstElement(selector: string): Promise<Locator> {
    return this.page.locator(selector).first();
  }

  // ============ ELEMENT LOCATION UTILITIES ============

  /**
   * Get element by role
   */
  getByRole(role: string, options: { name?: string; exact?: boolean } = {}): Locator {
    return this.page.getByRole(role as any, { 
      name: options.name, 
      exact: options.exact 
    });
  }

  /**
   * Get element by label
   */
  getByLabel(label: string, options: { exact?: boolean } = {}): Locator {
    return this.page.getByLabel(label, { exact: options.exact });
  }

  /**
   * Get element by placeholder
   */
  getByPlaceholder(placeholder: string, options: { exact?: boolean } = {}): Locator {
    return this.page.getByPlaceholder(placeholder, { exact: options.exact });
  }

  /**
   * Get element by alt text
   */
  getByAltText(altText: string, options: { exact?: boolean } = {}): Locator {
    return this.page.getByAltText(altText, { exact: options.exact });
  }

  /**
   * Get element by title
   */
  getByTitle(title: string, options: { exact?: boolean } = {}): Locator {
    return this.page.getByTitle(title, { exact: options.exact });
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by name attribute
   */
  getByName(name: string): Locator {
    return this.page.locator(`[name="${name}"]`);
  }

  /**
   * Get element by ID
   */
  getById(id: string): Locator {
    return this.page.locator(`#${id}`);
  }

  /**
   * Get element by class name
   */
  getByClassName(className: string): Locator {
    return this.page.locator(`.${className}`);
  }

  /**
   * Get element by text content
   */
  getByText(text: string, options: { exact?: boolean } = {}): Locator {
    return this.page.getByText(text, { exact: options.exact });
  }

  /**
   * Get element by partial text content
   */
  getByTextContaining(text: string): Locator {
    return this.page.getByText(text, { exact: false });
  }

  /**
   * Get element by aria-label
   */
  getByAriaLabel(ariaLabel: string, options: { exact?: boolean } = {}): Locator {
    return this.page.getByRole('generic', { name: ariaLabel, exact: options.exact });
  }

  /**
   * Get element by data attribute
   */
  getByDataAttribute(attribute: string, value: string): Locator {
    return this.page.locator(`[data-${attribute}="${value}"]`);
  }

  /**
   * Get element by any attribute
   */
  getByAttribute(attribute: string, value: string, options: { exact?: boolean } = {}): Locator {
    if (options.exact) {
      return this.page.locator(`[${attribute}="${value}"]`);
    } else {
      return this.page.locator(`[${attribute}*="${value}"]`);
    }
  }

  /**
   * Get element by multiple selectors (returns first match)
   */
  getByMultipleSelectors(selectors: string[]): Locator {
    const selectorString = selectors.join(', ');
    return this.page.locator(selectorString).first();
  }

  /**
   * Get element by XPath
   */
  getByXPath(xpath: string): Locator {
    return this.page.locator(`xpath=${xpath}`);
  }

  /**
   * Get element by CSS selector with nth-child
   */
  getByNthChild(selector: string, index: number): Locator {
    return this.page.locator(`${selector}:nth-child(${index})`);
  }

  /**
   * Get element by CSS selector with nth-of-type
   */
  getByNthOfType(selector: string, index: number): Locator {
    return this.page.locator(`${selector}:nth-of-type(${index})`);
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
}

 