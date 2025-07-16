import { Page } from 'playwright';
import { DOMExtractor, DOMTree } from './DOMExtractor';

export interface DOMChangeEvent {
  type: 'navigation' | 'content' | 'structure';
  oldTree?: DOMTree;
  newTree: DOMTree;
  timestamp: number;
  url: string;
}

export interface DOMTrackerOptions {
  enabled?: boolean;
  changeThreshold?: number;
  pollingInterval?: number;
}

export class DOMTracker {
  private extractor: DOMExtractor;
  private currentTree?: DOMTree;
  private isTracking = false;
  private changeListeners: ((event: DOMChangeEvent) => void)[] = [];
  private pollingInterval?: NodeJS.Timeout;
  private lastChangeTime = 0;

  constructor(
    private page: Page,
    private options: DOMTrackerOptions = {}
  ) {
    this.extractor = new DOMExtractor(page);
    this.options = {
      enabled: true,
      changeThreshold: 1000, // 1 second
      pollingInterval: 500,  // 500ms
      ...options
    };
  }

  async start(): Promise<void> {
    if (this.isTracking || !this.options.enabled) return;

    this.isTracking = true;
    
    // Set up navigation listener
    this.page.on('framenavigated', async (frame) => {
      if (frame === this.page.mainFrame()) {
        await this.handleNavigation();
      }
    });

    // Set up polling for DOM changes
    if (this.options.pollingInterval) {
      this.pollingInterval = setInterval(async () => {
        await this.checkForChanges();
      }, this.options.pollingInterval);
    }

    // Initial DOM extraction
    await this.extractAndUpdate();
  }

  async stop(): Promise<void> {
    this.isTracking = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
  }

  onDOMChange(listener: (event: DOMChangeEvent) => void): void {
    this.changeListeners.push(listener);
  }

  removeDOMChangeListener(listener: (event: DOMChangeEvent) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  async getCurrentTree(): Promise<DOMTree | undefined> {
    return this.currentTree;
  }

  private async handleNavigation(): Promise<void> {
    // Wait for page to load
    await this.page.waitForLoadState('networkidle');
    
    const newTree = await this.extractor.extractDOMTree();
    const event: DOMChangeEvent = {
      type: 'navigation',
      oldTree: this.currentTree,
      newTree,
      timestamp: Date.now(),
      url: newTree.url
    };

    this.currentTree = newTree;
    this.lastChangeTime = Date.now();
    this.notifyListeners(event);
  }

  private async checkForChanges(): Promise<void> {
    if (!this.isTracking || !this.currentTree) return;

    const now = Date.now();
    if (now - this.lastChangeTime < (this.options.changeThreshold || 1000)) {
      return; // Too soon since last change
    }

    const newTree = await this.extractor.extractDOMTree();
    
    if (this.hasSignificantChanges(this.currentTree, newTree)) {
      const event: DOMChangeEvent = {
        type: 'content',
        oldTree: this.currentTree,
        newTree,
        timestamp: now,
        url: newTree.url
      };

      this.currentTree = newTree;
      this.lastChangeTime = now;
      this.notifyListeners(event);
    }
  }

  private async extractAndUpdate(): Promise<void> {
    const newTree = await this.extractor.extractDOMTree();
    this.currentTree = newTree;
    this.lastChangeTime = Date.now();
  }

  private hasSignificantChanges(oldTree: DOMTree, newTree: DOMTree): boolean {
    // Simple comparison - can be enhanced with more sophisticated diffing
    return oldTree.url !== newTree.url ||
           oldTree.title !== newTree.title ||
           JSON.stringify(oldTree.root) !== JSON.stringify(newTree.root);
  }

  private notifyListeners(event: DOMChangeEvent): void {
    for (const listener of this.changeListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in DOM change listener:', error);
      }
    }
  }
}