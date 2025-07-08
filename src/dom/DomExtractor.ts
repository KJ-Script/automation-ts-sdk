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
  usePlaywrightBuiltins?: boolean;    // Whether to use Playwright's built-in DOM methods where possible
}

// Enhanced DOM extractor that leverages Playwright's built-in capabilities
export class DomExtractor {
  private options: Required<DomExtractionOptions>;

  constructor(options: DomExtractionOptions = {}) {
    this.options = {
      includeHidden: false,
      maxDepth: 50,
      excludeTags: ['script', 'style'],
      includeTextNodes: true,
      includeComments: false,
      usePlaywrightBuiltins: true,     // Default to using Playwright's built-in methods
      ...options
    };
  }

  /**
   * Extract the DOM tree from a Playwright page using enhanced DOM APIs
   */
  async extractFromPage(page: Page): Promise<DomNode> {
    if (this.options.usePlaywrightBuiltins) {
      return this.extractUsingPlaywrightMethods(page);
    } else {
      return this.extractUsingCustomTraversal(page);
    }
  }

  /**
   * Enhanced extraction using Playwright's built-in DOM methods
   */
  private async extractUsingPlaywrightMethods(page: Page): Promise<DomNode> {
    const extractionOptions = {
      includeHidden: this.options.includeHidden,
      maxDepth: this.options.maxDepth,
      excludeTags: this.options.excludeTags.slice(),
      includeTextNodes: this.options.includeTextNodes,
      includeComments: this.options.includeComments
    };

    // Use Playwright's evaluate with more standard DOM APIs
    const domTree = await page.evaluate((options) => {
      // Enhanced tree walker using standard DOM APIs
      function createTreeWalker(root: Element) {
        return document.createTreeWalker(
          root,
          NodeFilter.SHOW_ELEMENT | 
          (options.includeTextNodes ? NodeFilter.SHOW_TEXT : 0) |
          (options.includeComments ? NodeFilter.SHOW_COMMENT : 0),
          {
            acceptNode(node: Node): number {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                
                // Check excluded tags
                if (options.excludeTags.includes(element.tagName.toLowerCase())) {
                  return NodeFilter.FILTER_REJECT;
                }
                
                // Check hidden elements
                if (!options.includeHidden && element instanceof HTMLElement) {
                  const style = window.getComputedStyle(element);
                  if (style.display === 'none' || style.visibility === 'hidden') {
                    return NodeFilter.FILTER_REJECT;
                  }
                }
              }
              
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );
      }

      function extractNodeStandard(element: Element, depth: number = 0): any {
        if (depth > options.maxDepth) {
          return null;
        }

        // Extract attributes using standard DOM API
        const attributes: any = {};
        if (element.attributes) {
          Array.from(element.attributes).forEach(attr => {
            attributes[attr.name] = attr.value;
          });
        }

        const children: any[] = [];
        
        // Use childNodes for direct traversal
        Array.from(element.childNodes).forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const childElement = child as Element;
            
            // Check exclusions
            if (options.excludeTags.includes(childElement.tagName.toLowerCase())) {
              return;
            }
            
            // Check hidden elements
            if (!options.includeHidden && childElement instanceof HTMLElement) {
              const style = window.getComputedStyle(childElement);
              if (style.display === 'none' || style.visibility === 'hidden') {
                return;
              }
            }
            
            const childNode = extractNodeStandard(childElement, depth + 1);
            if (childNode) {
              children.push(childNode);
            }
          } else if (child.nodeType === Node.TEXT_NODE && options.includeTextNodes) {
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
          } else if (child.nodeType === Node.COMMENT_NODE && options.includeComments) {
            children.push({
              tagName: '#comment',
              attributes: {},
              textContent: child.textContent,
              children: [],
              depth: depth + 1
            });
          }
        });

        return {
          tagName: element.tagName.toLowerCase(),
          attributes,
          textContent: options.includeTextNodes ? element.textContent?.trim() : undefined,
          children,
          depth
        };
      }

      // Start from document.documentElement (the <html> element)
      return extractNodeStandard(document.documentElement);
    }, extractionOptions);

    return domTree;
  }

  /**
   * Original extraction method using custom traversal
   */
  private async extractUsingCustomTraversal(page: Page): Promise<DomNode> {
    const extractionOptions = {
      includeHidden: this.options.includeHidden,
      maxDepth: this.options.maxDepth,
      excludeTags: this.options.excludeTags.slice(),
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
   * Extract DOM tree from a specific CSS selector using Playwright's built-in selector methods
   */
  async extractFromSelector(page: Page, selector: string): Promise<DomNode | null> {
    // Use Playwright's built-in selector method
    const element = await page.$(selector);
    if (!element) {
      return null;
    }

    const extractionOptions = {
      includeHidden: this.options.includeHidden,
      maxDepth: this.options.maxDepth,
      excludeTags: this.options.excludeTags.slice(),
      includeTextNodes: this.options.includeTextNodes,
      includeComments: this.options.includeComments,
      usePlaywrightBuiltins: this.options.usePlaywrightBuiltins
    };

    if (this.options.usePlaywrightBuiltins) {
      // Use element.evaluate() for scoped extraction
      const domTree = await element.evaluate((el, options) => {
        function extractNodeFromElement(element: Element, depth: number = 0): any {
          if (depth > options.maxDepth) {
            return null;
          }

          const attributes: any = {};
          Array.from(element.attributes).forEach(attr => {
            attributes[attr.name] = attr.value;
          });

          const children: any[] = [];
          Array.from(element.childNodes).forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
              const childElement = child as Element;
              const childNode = extractNodeFromElement(childElement, depth + 1);
              if (childNode) {
                children.push(childNode);
              }
            } else if (child.nodeType === Node.TEXT_NODE && options.includeTextNodes) {
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
          });

          return {
            tagName: element.tagName.toLowerCase(),
            attributes,
            textContent: options.includeTextNodes ? element.textContent?.trim() : undefined,
            children,
            depth
          };
        }

        return extractNodeFromElement(el);
      }, extractionOptions);

      return domTree;
    } else {
      // Fallback to original method
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
  }

  /**
   * Extract using Playwright's HTML content method and parse it
   */
  async extractFromHtml(page: Page): Promise<DomNode> {
    const htmlContent = await page.content();
    
    // Parse the HTML content in the browser context to create a tree
    const domTree = await page.evaluate((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      function extractFromParsedDoc(element: Element, depth: number = 0): any {
        const attributes: any = {};
        Array.from(element.attributes).forEach(attr => {
          attributes[attr.name] = attr.value;
        });

        const children: any[] = [];
        Array.from(element.children).forEach(child => {
          const childNode = extractFromParsedDoc(child, depth + 1);
          if (childNode) {
            children.push(childNode);
          }
        });

        return {
          tagName: element.tagName.toLowerCase(),
          attributes,
          textContent: element.textContent?.trim(),
          children,
          depth
        };
      }

      return extractFromParsedDoc(doc.documentElement);
    }, htmlContent);

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