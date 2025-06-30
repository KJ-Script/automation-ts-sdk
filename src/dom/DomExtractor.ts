// Import the Page type from the playwright library - this represents a browser page
import { Page } from 'playwright';

// Define the structure for a DOM node in our tree representation
export interface DomNode {
  tagName: string;                    // The HTML tag name (e.g., 'div', 'span', '#text')
  attributes: Record<string, string>; // Object containing all HTML attributes as key-value pairs
  textContent?: string;               // Optional text content of the element (undefined if no text)
  children: DomNode[];                // Array of child DOM nodes (recursive structure)
  depth: number;                      // How deep this node is in the DOM tree (0 = root)
}

// Define configuration options for DOM extraction behavior
export interface DomExtractionOptions {
  includeHidden?: boolean;            // Whether to include elements that are hidden via CSS
  maxDepth?: number;                  // Maximum depth to traverse in the DOM tree
  excludeTags?: string[];             // Array of HTML tag names to skip during extraction
  includeTextNodes?: boolean;         // Whether to include text nodes as separate nodes
  includeComments?: boolean;          // Whether to include HTML comment nodes
}

// Main class for extracting and processing DOM trees from web pages
export class DomExtractor {
  // Private property to store the configuration options with all properties required
  private options: Required<DomExtractionOptions>;

  // Constructor that initializes the extractor with default or custom options
  constructor(options: DomExtractionOptions = {}) {
    // Set default values and merge with any provided options
    this.options = {
      includeHidden: false,           // Default: skip hidden elements
      maxDepth: 50,                   // Default: traverse up to 50 levels deep
      excludeTags: ['script', 'style'], // Default: skip script and style tags
      includeTextNodes: true,         // Default: include text nodes
      includeComments: false,         // Default: skip comment nodes
      ...options                      // Spread operator merges provided options over defaults
    };
  }

  /**
   * Extract the DOM tree from a Playwright page
   * This method runs JavaScript in the browser context to traverse the DOM
   */
  async extractFromPage(page: Page): Promise<DomNode> {
    // Create a simple plain object to avoid serialization issues
    const extractionOptions = {
      includeHidden: this.options.includeHidden,
      maxDepth: this.options.maxDepth,
      excludeTags: this.options.excludeTags.slice(), // Create a copy of the array
      includeTextNodes: this.options.includeTextNodes,
      includeComments: this.options.includeComments
    };

    const domTree = await page.evaluate((options) => {
      function extractNode(element: any, depth: number = 0): any {
        if (depth > options.maxDepth) {
          return null;
        }

        if (options.excludeTags.includes(element.tagName.toLowerCase())) {
          return null;
        }

        if (!options.includeHidden && element instanceof HTMLElement) {
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return null;
          }
        }

        const attributes: any = {};
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          attributes[attr.name] = attr.value;
        }

        const children: any[] = [];
        
        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];
          
          if (child.nodeType === 1) { // ELEMENT_NODE
            const childNode = extractNode(child, depth + 1);
            if (childNode) {
              children.push(childNode);
            }
          } else if (child.nodeType === 3 && options.includeTextNodes) { // TEXT_NODE
            const textContent = child.textContent?.trim();
            if (textContent) {
              children.push({
                tagName: '#text',
                attributes: {},
                textContent,
                children: [],
                depth: depth + 1
              });
            }
          } else if (child.nodeType === 8 && options.includeComments) { // COMMENT_NODE
            children.push({
              tagName: '#comment',
              attributes: {},
              textContent: child.textContent,
              children: [],
              depth: depth + 1
            });
          }
        }

        return {
          tagName: element.tagName.toLowerCase(),
          attributes,
          textContent: options.includeTextNodes ? element.textContent?.trim() : undefined,
          children,
          depth
        };
      }

      return extractNode(document.documentElement);
    }, extractionOptions);

    return domTree;
  }

  /**
   * Extract DOM tree from a specific CSS selector
   * This method finds an element matching the selector and extracts its subtree
   */
  async extractFromSelector(page: Page, selector: string): Promise<DomNode | null> {
    const element = await page.$(selector);
    if (!element) {
      return null;
    }

    // Create a simple plain object to avoid serialization issues
    const extractionOptions = {
      includeHidden: this.options.includeHidden,
      maxDepth: this.options.maxDepth,
      excludeTags: this.options.excludeTags.slice(),
      includeTextNodes: this.options.includeTextNodes,
      includeComments: this.options.includeComments
    };

    const domTree = await element.evaluate((el, options) => {
      function extractNode(element: any, depth: number = 0): any {
        if (depth > options.maxDepth) {
          return null;
        }

        const attributes: any = {};
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          attributes[attr.name] = attr.value;
        }

        const children: any[] = [];
        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];
          
          if (child.nodeType === 1) { // ELEMENT_NODE
            const childNode = extractNode(child, depth + 1);
            if (childNode) {
              children.push(childNode);
            }
          } else if (child.nodeType === 3 && options.includeTextNodes) { // TEXT_NODE
            const textContent = child.textContent?.trim();
            if (textContent) {
              children.push({
                tagName: '#text',
                attributes: {},
                textContent,
                children: [],
                depth: depth + 1
              });
            }
          }
        }

        return {
          tagName: element.tagName.toLowerCase(),
          attributes,
          textContent: options.includeTextNodes ? element.textContent?.trim() : undefined,
          children,
          depth
        };
      }

      return extractNode(el);
    }, extractionOptions);

    return domTree;
  }

  /**
   * Convert DOM tree to a readable string format
   */
  treeToString(node: DomNode, indent: string = ''): string {
    let result = `${indent}<${node.tagName}`;
    
    // Add attributes
    for (const [key, value] of Object.entries(node.attributes)) {
      result += ` ${key}="${value}"`;
    }
    result += '>\n';

    // Add text content if it's a text node
    if (node.tagName === '#text' && node.textContent) {
      return `${indent}"${node.textContent}"\n`;
    }

    // Add children
    for (const child of node.children) {
      result += this.treeToString(child, indent + '  ');
    }

    result += `${indent}</${node.tagName}>\n`;
    return result;
  }

  /**
   * Convert DOM tree to JSON string
   */
  treeToJson(node: DomNode, pretty: boolean = true): string {
    return JSON.stringify(node, null, pretty ? 2 : 0);
  }

  /**
   * Get statistics about the DOM tree
   */
  getTreeStats(node: DomNode): {
    totalNodes: number;
    maxDepth: number;
    tagCounts: Record<string, number>;
  } {
    const stats = {
      totalNodes: 0,
      maxDepth: 0,
      tagCounts: {} as Record<string, number>
    };

    function traverse(n: DomNode) {
      stats.totalNodes++;
      stats.maxDepth = Math.max(stats.maxDepth, n.depth);
      stats.tagCounts[n.tagName] = (stats.tagCounts[n.tagName] || 0) + 1;

      for (const child of n.children) {
        traverse(child);
      }
    }

    traverse(node);
    return stats;
  }
} 