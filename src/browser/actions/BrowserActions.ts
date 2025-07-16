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

  // ============ TAB MANAGEMENT ACTIONS ============

  /**
   * Get the browser context to access tab management
   */
  private getContext() {
    return this.page.context();
  }

  /**
   * Create a new tab and return its page
   */
  async createNewTab(): Promise<Page> {
    const context = this.getContext();
    return await context.newPage();
  }

  /**
   * Close the current tab
   */
  async closeTab(): Promise<void> {
    await this.page.close();
  }

  /**
   * Get all pages (tabs) in the current context
   */
  async getAllTabs(): Promise<Page[]> {
    const context = this.getContext();
    return context.pages();
  }

  /**
   * Switch to a specific tab by index
   */
  async switchToTab(index: number): Promise<void> {
    const pages = await this.getAllTabs();
    if (index >= 0 && index < pages.length) {
      // Update the current page reference
      (this as any).page = pages[index];
      await pages[index].bringToFront();
    } else {
      throw new Error(`Tab index ${index} is out of range. Available tabs: ${pages.length}`);
    }
  }

  /**
   * Switch to a specific tab by page
   */
  async switchToPage(page: Page): Promise<void> {
    await page.bringToFront();
    // Update the current page reference
    (this as any).page = page;
  }

  /**
   * Get the current tab index
   */
  async getCurrentTabIndex(): Promise<number> {
    const pages = await this.getAllTabs();
    return pages.findIndex(page => page === this.page);
  }

  /**
   * Get tab count
   */
  async getTabCount(): Promise<number> {
    const pages = await this.getAllTabs();
    return pages.length;
  }

  /**
   * Navigate to URL in a new tab
   */
  async openInNewTab(url: string): Promise<Page> {
    const newPage = await this.createNewTab();
    await newPage.goto(url);
    return newPage;
  }

  // ============ DOM EXTRACTION AND TRACKING ============

  /**
   * Get the complete HTML content of the page
   */
  async getPageHTML(): Promise<string> {
    return await this.page.content();
  }

  /**
   * Get the HTML content of a specific element
   */
  async getElementHTML(selector: string): Promise<string> {
    const element = this.page.locator(selector);
    return await element.innerHTML();
  }

  /**
   * Get the outer HTML content of a specific element
   */
  async getElementOuterHTML(selector: string): Promise<string> {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      return element ? element.outerHTML : '';
    }, selector);
  }

  /**
   * Build a complete DOM tree from the current page
   */
  async buildDOMTree(options: {
    includeHidden?: boolean;
    includeNonInteractive?: boolean;
    maxDepth?: number;
    includeBoundingBox?: boolean;
    includeXPath?: boolean;
    filterSelectors?: string[];
  } = {}): Promise<any> {
    const {
      includeHidden = false,
      includeNonInteractive = true,
      maxDepth = 5,
      includeBoundingBox = true,
      includeXPath = true,
      filterSelectors = []
    } = options;

    const script = `
      (() => {
        const options = ${JSON.stringify(options)};
        
        function isInteractive(element) {
          const tag = element.tagName.toLowerCase();
          const role = element.getAttribute('role');
          const type = element.getAttribute('type');
          
          // Interactive tags
          if (['button', 'a', 'input', 'select', 'textarea', 'label'].includes(tag)) return true;
          
          // Interactive roles
          if (['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio', 'textbox'].includes(role)) return true;
          
          // Interactive input types
          if (type && ['button', 'submit', 'reset', 'checkbox', 'radio', 'text', 'email', 'password', 'search'].includes(type)) return true;
          
          // Elements with click handlers
          if (element.onclick || element.getAttribute('onclick')) return true;
          
          // Elements with cursor pointer
          const style = window.getComputedStyle(element);
          if (style.cursor === 'pointer') return true;
          
          return false;
        }
        
        function isVisible(element) {
          const style = window.getComputedStyle(element);
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' && 
                 style.opacity !== '0' &&
                 element.offsetWidth > 0 && 
                 element.offsetHeight > 0;
        }
        
        function getBoundingBox(element) {
          const rect = element.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          };
        }
        
        function getXPath(element) {
          if (element.id) {
            return '//*[@id="' + element.id + '"]';
          }
          
          if (element === document.body) {
            return '/html/body';
          }
          
          let path = '';
          while (element.parentNode) {
            let siblings = element.parentNode.childNodes;
            let index = 0;
            
            for (let i = 0; i < siblings.length; i++) {
              let sibling = siblings[i];
              if (sibling === element) {
                break;
              }
              if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                index++;
              }
            }
            
            let tagName = element.tagName.toLowerCase();
            let pathIndex = (index > 0 ? '[' + (index + 1) + ']' : '');
            path = '/' + tagName + pathIndex + path;
            
            element = element.parentNode;
            
            if (element === document.body) {
              path = '/html/body' + path;
              break;
            }
          }
          
          return path;
        }
        
        function generateSelector(element) {
          if (element.id) {
            return '#' + element.id;
          }
          
          let selector = element.tagName.toLowerCase();
          
          if (element.className) {
            const classes = element.className.split(' ').filter(c => c.trim());
            if (classes.length > 0) {
              selector += '.' + classes.join('.');
            }
          }
          
          return selector;
        }
        
        function buildNode(element, depth = 0, parentId = null) {
          if (depth > options.maxDepth) return null;
          
          const nodeId = 'node_' + Math.random().toString(36).substr(2, 9);
          
          // Check visibility and interactivity
          const visible = isVisible(element);
          const interactive = isInteractive(element);
          
          // Skip hidden elements if not included
          if (!visible && !options.includeHidden) return null;
          
          // Skip non-interactive elements if not included
          if (!interactive && !options.includeNonInteractive) return null;
          
          // Apply filter selectors
          if (options.filterSelectors.length > 0) {
            const matchesFilter = options.filterSelectors.some(filter => {
              try {
                return element.matches(filter);
              } catch (e) {
                return false;
              }
            });
            if (!matchesFilter) return null;
          }
          
          const node = {
            id: nodeId,
            tagName: element.tagName.toLowerCase(),
            nodeType: element.nodeType,
            textContent: element.textContent?.trim() || undefined,
            attributes: {},
            children: [],
            parentId: parentId,
            isVisible: visible,
            isInteractive: interactive,
            selector: generateSelector(element),
            xpath: options.includeXPath ? getXPath(element) : '',
            boundingBox: options.includeBoundingBox ? getBoundingBox(element) : undefined
          };
          
          // Extract attributes
          for (let attr of element.attributes) {
            node.attributes[attr.name] = attr.value;
          }
          
          // Process children
          for (let child of element.children) {
            const childNode = buildNode(child, depth + 1, nodeId);
            if (childNode) {
              node.children.push(childNode);
            }
          }
          
          return node;
        }
        
        const root = buildNode(document.body);
        const allNodes = [];
        const interactiveElements = [];
        const visibleElements = [];
        
        function collectNodes(node) {
          if (!node) return;
          allNodes.push(node);
          if (node.isInteractive) interactiveElements.push(node);
          if (node.isVisible) visibleElements.push(node);
          node.children.forEach(collectNodes);
        }
        
        collectNodes(root);
        
        return {
          root: root,
          totalNodes: allNodes.length,
          interactiveElements: interactiveElements,
          visibleElements: visibleElements,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          title: document.title
        };
      })();
    `;

    return await this.page.evaluate(script);
  }

  /**
   * Get all interactive elements from the page
   */
  async getInteractiveElements(): Promise<any[]> {
    const tree = await this.buildDOMTree({
      includeHidden: false,
      includeNonInteractive: false,
      maxDepth: 3
    });
    return tree.interactiveElements;
  }

  /**
   * Get all visible elements from the page
   */
  async getVisibleElements(): Promise<any[]> {
    const tree = await this.buildDOMTree({
      includeHidden: false,
      includeNonInteractive: true,
      maxDepth: 3
    });
    return tree.visibleElements;
  }

  /**
   * Get DOM context for AI decision making
   */
  async getDOMContext(): Promise<any> {
    const tree = await this.buildDOMTree({
      includeHidden: false,
      includeNonInteractive: false,
      maxDepth: 3
    });

    return {
      url: tree.url,
      title: tree.title,
      interactiveElements: tree.interactiveElements.map((el: any) => ({
        tagName: el.tagName,
        textContent: el.textContent,
        selector: el.selector,
        isVisible: el.isVisible,
        attributes: el.attributes
      })).slice(0, 30), // Limit to first 30 for AI context
      visibleElements: tree.visibleElements.length,
      totalNodes: tree.totalNodes,
      lastUpdated: tree.timestamp
    };
  }

  /**
   * Find elements by text content
   */
  async findElementsByText(text: string, exact: boolean = false): Promise<any[]> {
    const script = `
      (() => {
        const searchText = ${JSON.stringify(text)};
        const exactMatch = ${exact};
        
        function findElementsByText(node, results = []) {
          if (!node) return results;
          
          const textContent = node.textContent?.trim() || '';
          
          if (exactMatch) {
            if (textContent === searchText) {
              results.push({
                tagName: node.tagName.toLowerCase(),
                textContent: textContent,
                selector: node.id ? '#' + node.id : node.tagName.toLowerCase(),
                isVisible: window.getComputedStyle(node).display !== 'none'
              });
            }
          } else {
            if (textContent.toLowerCase().includes(searchText.toLowerCase())) {
              results.push({
                tagName: node.tagName.toLowerCase(),
                textContent: textContent,
                selector: node.id ? '#' + node.id : node.tagName.toLowerCase(),
                isVisible: window.getComputedStyle(node).display !== 'none'
              });
            }
          }
          
          for (let child of node.children) {
            findElementsByText(child, results);
          }
          
          return results;
        }
        
        return findElementsByText(document.body);
      })();
    `;

    return await this.page.evaluate(script);
  }

  /**
   * Start DOM change tracking
   */
  async startDOMTracking(): Promise<void> {
    await this.page.evaluate(() => {
      if ((window as any).__domTrackerObserver) {
        (window as any).__domTrackerObserver.disconnect();
      }

      const changes: any[] = [];
      
      (window as any).__domTrackerObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          const timestamp = new Date().toISOString();
          
          switch (mutation.type) {
            case 'childList':
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                  const element = node as Element;
                  changes.push({
                    type: 'added',
                    nodeId: element.id || `node_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp,
                    selector: element.id ? '#' + element.id : element.tagName.toLowerCase()
                  });
                }
              });
              
              mutation.removedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                  const element = node as Element;
                  changes.push({
                    type: 'removed',
                    nodeId: element.id || 'unknown',
                    timestamp,
                    selector: element.id ? '#' + element.id : element.tagName.toLowerCase()
                  });
                }
              });
              break;
              
            case 'attributes':
              const target = mutation.target as Element;
              
              changes.push({
                type: 'attribute-changed',
                nodeId: target.id || 'unknown',
                attributeName: mutation.attributeName,
                oldValue: mutation.oldValue,
                newValue: target.getAttribute(mutation.attributeName ?? ""),
                timestamp
              });
              break;
          }
        }); 
        
        (window as any).__domChanges = changes;
      });
      
      (window as any).__domTrackerObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true
      });
    });
  }

  /**
   * Stop DOM change tracking
   */
  async stopDOMTracking(): Promise<void> {
    await this.page.evaluate(() => {
      if ((window as any).__domTrackerObserver) {
        (window as any).__domTrackerObserver.disconnect();
        (window as any).__domTrackerObserver = null;
      }
    });
  }

  /**
   * Get accumulated DOM changes
   */
  async getDOMChanges(): Promise<any[]> {
    const changes = await this.page.evaluate(() => {
      const storedChanges = (window as any).__domChanges || [];
      (window as any).__domChanges = [];
      return storedChanges;
    });
    
    return changes;
  }

  /**
   * Check if DOM has changed
   */
  async hasDOMChanged(): Promise<boolean> {
    const changes = await this.getDOMChanges();
    return changes.length > 0;
  }
} 