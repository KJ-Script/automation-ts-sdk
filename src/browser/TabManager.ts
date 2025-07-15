import { BrowserContext, Page } from 'playwright';
import { TabInfo, TabManagerConfig } from '../types/browser';

export class TabManager {
  private context: BrowserContext | null = null;
  private tabs: Map<string, TabInfo> = new Map();
  private activeTabId: string | null = null;
  private config: TabManagerConfig;
  private tabCounter: number = 0;

  constructor(context: BrowserContext, config: TabManagerConfig = {}) {
    this.context = context;
    this.config = {
      maxTabs: config.maxTabs || 10,
      defaultTimeout: config.defaultTimeout || 30000,
      autoCloseInactiveTabs: config.autoCloseInactiveTabs || false,
      inactiveTabTimeout: config.inactiveTabTimeout || 300000, // 5 minutes
      ...config
    };
  }

  /**
   * Create a new tab
   */
  async createTab(url?: string): Promise<string> {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    if (this.tabs.size >= this.config.maxTabs!) {
      throw new Error(`Maximum number of tabs (${this.config.maxTabs}) reached`);
    }

    const page = await this.context.newPage();
    const tabId = `tab_${++this.tabCounter}_${Date.now()}`;
    
    const tabInfo: TabInfo = {
      id: tabId,
      page,
      url: url || '',
      title: '',
      isActive: false,
      createdAt: new Date(),
      lastAccessed: new Date()
    };

    this.tabs.set(tabId, tabInfo);
    
    if (url) {
      await this.navigateTab(tabId, url);
    }

    this.setActiveTab(tabId);
    return tabId;
  }

  /**
   * Navigate a tab to a URL
   */
  async navigateTab(tabId: string, url: string): Promise<void> {
    const tab = this.getTab(tabId);
    await tab.page.goto(url, { timeout: this.config.defaultTimeout });
    tab.url = url;
    tab.lastAccessed = new Date();
    await this.updateTabInfo(tabId);
  }

  /**
   * Switch to a specific tab
   */
  async switchToTab(tabId: string): Promise<void> {
    const tab = this.getTab(tabId);
    await tab.page.bringToFront();
    this.setActiveTab(tabId);
  }

  /**
   * Close a specific tab
   */
  async closeTab(tabId: string): Promise<void> {
    const tab = this.getTab(tabId);
    await tab.page.close();
    this.tabs.delete(tabId);
    
    if (this.activeTabId === tabId) {
      this.activeTabId = this.tabs.size > 0 ? Array.from(this.tabs.keys())[0] : null;
    }
  }

  /**
   * Close all tabs
   */
  async closeAllTabs(): Promise<void> {
    const closePromises = Array.from(this.tabs.values()).map(tab => tab.page.close());
    await Promise.all(closePromises);
    this.tabs.clear();
    this.activeTabId = null;
  }

  /**
   * Get a tab by ID
   */
  getTab(tabId: string): TabInfo {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      throw new Error(`Tab with ID ${tabId} not found`);
    }
    return tab;
  }

  /**
   * Get the active tab
   */
  getActiveTab(): TabInfo | null {
    return this.activeTabId ? this.getTab(this.activeTabId) : null;
  }

  /**
   * Get all tabs
   */
  getAllTabs(): TabInfo[] {
    return Array.from(this.tabs.values());
  }

  /**
   * Get tab count
   */
  getTabCount(): number {
    return this.tabs.size;
  }

  /**
   * Check if a tab exists
   */
  hasTab(tabId: string): boolean {
    return this.tabs.has(tabId);
  }

  /**
   * Get available tab IDs
   */
  getAvailableTabIds(): string[] {
    return Array.from(this.tabs.keys());
  }

  /**
   * Update tab information (title, URL, etc.)
   */
  private async updateTabInfo(tabId: string): Promise<void> {
    const tab = this.getTab(tabId);
    try {
      tab.title = await tab.page.title();
      tab.url = tab.page.url();
    } catch (error) {
      // Page might be closed or navigating
      console.warn(`Failed to update tab info for ${tabId}:`, error);
    }
  }

  /**
   * Set active tab
   */
  private setActiveTab(tabId: string): void {
    // Mark all tabs as inactive
    this.tabs.forEach(tab => {
      tab.isActive = false;
    });

    // Mark the new tab as active
    const tab = this.getTab(tabId);
    tab.isActive = true;
    tab.lastAccessed = new Date();
    this.activeTabId = tabId;
  }

  /**
   * Get a tab's page object
   */
  getTabPage(tabId: string): Page {
    return this.getTab(tabId).page;
  }

  /**
   * Clean up inactive tabs (if auto-close is enabled)
   */
  async cleanupInactiveTabs(): Promise<void> {
    if (!this.config.autoCloseInactiveTabs) {
      return;
    }

    const now = new Date();
    const tabsToClose: string[] = [];

    for (const [tabId, tab] of this.tabs.entries()) {
      const timeSinceLastAccess = now.getTime() - tab.lastAccessed.getTime();
      if (timeSinceLastAccess > this.config.inactiveTabTimeout!) {
        tabsToClose.push(tabId);
      }
    }

    for (const tabId of tabsToClose) {
      await this.closeTab(tabId);
    }

    if (tabsToClose.length > 0) {
      console.log(`Closed ${tabsToClose.length} inactive tabs`);
    }
  }

  /**
   * Execute a function on a specific tab
   */
  async executeOnTab<T>(tabId: string, fn: (page: Page) => Promise<T>): Promise<T> {
    const tab = this.getTab(tabId);
    tab.lastAccessed = new Date();
    return await fn(tab.page);
  }

  /**
   * Execute a function on all tabs
   */
  async executeOnAllTabs<T>(fn: (page: Page, tabId: string) => Promise<T>): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    const promises = Array.from(this.tabs.entries()).map(async ([tabId, tab]) => {
      try {
        const result = await fn(tab.page, tabId);
        results.set(tabId, result);
      } catch (error) {
        console.error(`Error executing on tab ${tabId}:`, error);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Get tab statistics
   */
  getStats(): {
    totalTabs: number;
    activeTabId: string | null;
    oldestTab: string | null;
    newestTab: string | null;
  } {
    const tabIds = Array.from(this.tabs.keys());
    const oldestTab = tabIds.length > 0 ? 
      tabIds.reduce((oldest, current) => 
        this.tabs.get(current)!.createdAt < this.tabs.get(oldest)!.createdAt ? current : oldest
      ) : null;
    
    const newestTab = tabIds.length > 0 ? 
      tabIds.reduce((newest, current) => 
        this.tabs.get(current)!.createdAt > this.tabs.get(newest)!.createdAt ? current : newest
      ) : null;

    return {
      totalTabs: this.tabs.size,
      activeTabId: this.activeTabId,
      oldestTab,
      newestTab
    };
  }
} 