import { Page } from 'playwright';

export interface DOMElement {
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  attributes: Record<string, string>;
  children: DOMElement[];
  isVisible: boolean;
  isClickable: boolean;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DOMTree {
  root: DOMElement;
  timestamp: number;
  url: string;
  title: string;
}

export class DOMExtractor {
  constructor(private page: Page) {}

  async extractDOMTree(): Promise<DOMTree> {
    const html = await this.page.content();
    const domTree = await this.page.evaluate(() => {
      function extractElement(element: Element): any {
        const tagName = element.tagName.toLowerCase();
        const id = element.id || undefined;
        const className = element.className || undefined;
        const textContent = element.textContent?.trim() || undefined;
        
        // Extract attributes
        const attributes: Record<string, string> = {};
        Array.from(element.attributes).forEach(attr => {
          attributes[attr.name] = attr.value;
        });

        // Check visibility and clickability
        const style = window.getComputedStyle(element);
        const htmlElement = element as HTMLElement;
        const isVisible = style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         style.opacity !== '0' &&
                         htmlElement.offsetWidth > 0 && 
                         htmlElement.offsetHeight > 0;

        const isClickable = isVisible && (
          tagName === 'button' ||
          tagName === 'a' ||
          tagName === 'input' ||
          (htmlElement as any).onclick !== null ||
          element.getAttribute('role') === 'button' ||
          element.getAttribute('tabindex') !== null
        );

        // Get bounding box
        const rect = element.getBoundingClientRect();
        const boundingBox = rect.width > 0 && rect.height > 0 ? {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        } : undefined;

        // Extract children
        const children: any[] = [];
        Array.from(element.children).forEach(child => {
          children.push(extractElement(child));
        });

        return {
          tagName,
          id,
          className,
          textContent,
          attributes,
          children,
          isVisible,
          isClickable,
          boundingBox
        };
      }

      return extractElement(document.documentElement);
    });

    const url = this.page.url();
    const title = await this.page.title();

    return {
      root: domTree,
      timestamp: Date.now(),
      url,
      title
    };
  }

  async getVisibleElements(): Promise<DOMElement[]> {
    const domTree = await this.extractDOMTree();
    const visibleElements: DOMElement[] = [];

    function traverse(element: DOMElement) {
      if (element.isVisible) {
        visibleElements.push(element);
      }
      for (const child of element.children) {
        traverse(child);
      }
    }

    traverse(domTree.root);
    return visibleElements;
  }

  async getClickableElements(): Promise<DOMElement[]> {
    const domTree = await this.extractDOMTree();
    const clickableElements: DOMElement[] = [];

    function traverse(element: DOMElement) {
      if (element.isClickable) {
        clickableElements.push(element);
      }
      for (const child of element.children) {
        traverse(child);
      }
    }

    traverse(domTree.root);
    return clickableElements;
  }
} 