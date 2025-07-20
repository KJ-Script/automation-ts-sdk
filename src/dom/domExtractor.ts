import { Page } from 'playwright';

export interface DOMNode {
  tagName?: string;
  children: string[];
  attributes: Record<string, string>;
  xpath: string;
  type?: 'TEXT_NODE';
  text?: string;
}

export interface DOMTree {
  rootId: string;
  map: Record<string, DOMNode>;
}

/**
 * Extract DOM tree using the injected script from dom.js
 */
export async function extractDOMTree(page: Page): Promise<DOMTree> {
  // Read the DOM script
  const domScript = `
    // Simple DOM analysis script for browser injection
    (function() {
        const DOM_MAP = new Map();
        const counter = { current: 0 };
      
        function isAcceptedElement(node) {
          if (!node || !node.tagName) return false;
          const accepted = new Set([
            "body", "div", "main", "article", "section", "nav", "header", "footer", "input", "button", "a", "form", "p", "span", "h1", "h2", "h3", "h4", "h5", "h6"
          ]);
          const denied = new Set([
            "svg", "script", "style", "link", "meta", "noscript", "template"
          ]);
          const tag = node.tagName.toLowerCase();
          if (accepted.has(tag)) return true;
          return !denied.has(tag);
        }
      
        function getXpath(node) {
          const segments = [];
          let currentNode = node;
          while (currentNode && currentNode.nodeType == Node.ELEMENT_NODE) {
            let index = 0;
            let sibling = currentNode.previousSibling;
            while (sibling) {
              if (sibling.nodeType == Node.ELEMENT_NODE && sibling.nodeName === currentNode.nodeName) {
                index++;
              }
              sibling = sibling.previousSibling;
            }
            const tagName = currentNode.tagName.toLowerCase();
            const xpathIndex = index > 0 ? \`[\${index + 1}]\` : '';
            segments.unshift(\`\${tagName}\${xpathIndex}\`);
            currentNode = currentNode.parentNode;
          }
          return '/' + segments.join('/');
        }
      
        function buildDomTree(node) {
          if (!node) return null;
          
          if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.TEXT_NODE) {
            return null;
          }
      
          if (node.nodeType === Node.TEXT_NODE) {
            const textContent = node.textContent?.trim();
            if (!textContent) return null;
            const parent = node.parentElement;
            if (!parent || parent.tagName.toLowerCase() == 'script') return null;
      
            const id = \`dom-\${counter.current++}\`;
            DOM_MAP.set(id, {
              type: 'TEXT_NODE',
              text: textContent,
              xpath: getXpath(node.parentElement)
            });
            return id;
          }
      
          if (node.nodeType == Node.ELEMENT_NODE && !isAcceptedElement(node)) {
            return null;
          }
      
          const nodeData = {
            tagName: node.tagName,
            children: [],
            attributes: {},
            xpath: getXpath(node)
          };
      
          // Get attributes
          const attributeNames = node.getAttributeNames?.() || [];
          for (const attr of attributeNames) {
            nodeData.attributes[attr] = node.getAttribute(attr);
          }
      
          // Process children
          for (const child of node.childNodes) {
            const childData = buildDomTree(child);
            if (childData) {
              nodeData.children.push(childData);
            }
          }
      
          // Skip empty anchor tags
          if (nodeData.tagName === 'a' && nodeData.children.length === 0 && !nodeData.attributes.href) {
            return null;
          }
      
          const id = \`dom-\${counter.current++}\`;
          DOM_MAP.set(id, nodeData);
          return id;
        }
      
        // Start from body
        const rootId = buildDomTree(document.body);
        return { rootId, map: Object.fromEntries(DOM_MAP) };
      })();
  `;

  // Execute the script in the browser
  const result = await page.evaluate(domScript);
  
  // Validate and normalize the result
  if (!result || typeof result !== 'object') {
    throw new Error('DOM extraction script returned invalid result');
  }
  
  const domTree = result as any;
  
  // Ensure the structure is correct
  if (!domTree.rootId || !domTree.map || typeof domTree.map !== 'object') {
    throw new Error('DOM extraction script returned invalid structure');
  }
  
  // Normalize the map to ensure all nodes have the correct structure
  const normalizedMap: Record<string, DOMNode> = {};
  
  for (const [id, node] of Object.entries(domTree.map)) {
    if (node && typeof node === 'object') {
      const normalizedNode = node as any;
      
      // Ensure children is always an array
      if (!Array.isArray(normalizedNode.children)) {
        normalizedNode.children = [];
      }
      
      // Ensure attributes is always an object
      if (!normalizedNode.attributes || typeof normalizedNode.attributes !== 'object') {
        normalizedNode.attributes = {};
      }
      
      // Ensure xpath is always a string
      if (typeof normalizedNode.xpath !== 'string') {
        normalizedNode.xpath = '';
      }
      
      normalizedMap[id] = normalizedNode as DOMNode;
    }
  }
  
  return {
    rootId: domTree.rootId,
    map: normalizedMap
  } as DOMTree;
}

/**
 * Convert XPath to CSS selector
 */
export function xpathToCSSSelector(xpath: string): string {
  if (!xpath || xpath === '/') return 'body';
  
  // Remove leading slash
  const path = xpath.startsWith('/') ? xpath.slice(1) : xpath;
  const segments = path.split('/');
  
  const cssSegments = segments.map(segment => {
    // Handle element with index (e.g., "div[2]")
    const match = segment.match(/^([a-zA-Z][a-zA-Z0-9]*)(?:\[(\d+)\])?$/);
    if (!match) return segment;
    
    const [, tagName, index] = match;
    
    if (index) {
      // For indexed elements, use nth-of-type
      return `${tagName}:nth-of-type(${index})`;
    }
    
    return tagName;
  });
  
  return cssSegments.join(' > ');
}

/**
 * Generate a more specific CSS selector for an element
 */
export function generateCSSSelector(node: DOMNode): string {
  // Ensure attributes exists
  const attributes = node.attributes || {};
  
  // If element has an ID, use it
  if (attributes.id) {
    return `#${attributes.id}`;
  }
  
  // If element has a unique class, use it
  if (attributes.class) {
    const classes = attributes.class.split(' ').filter(c => c.length > 0);
    if (classes.length > 0) {
      return `.${classes.join('.')}`;
    }
  }
  
  // If element has name attribute, use it
  if (attributes.name) {
    return `${node.tagName?.toLowerCase() || 'element'}[name="${attributes.name}"]`;
  }
  
  // If element has type attribute, use it
  if (attributes.type) {
    return `${node.tagName?.toLowerCase() || 'element'}[type="${attributes.type}"]`;
  }
  
  // If element has data-testid, use it
  if (attributes['data-testid']) {
    return `[data-testid="${attributes['data-testid']}"]`;
  }
  
  // If element has aria-label, use it
  if (attributes['aria-label']) {
    return `[aria-label="${attributes['aria-label']}"]`;
  }
  
  // Convert XPath to CSS selector as fallback
  return xpathToCSSSelector(node.xpath || '');
}

/**
 * Extract DOM summary for AI processing
 */
export function extractDOMSummary(domTree: DOMTree): string {
  const elements: string[] = [];
  let elementIndex = 0;
  
  function processNode(nodeId: string, depth: number = 0): void {
    const node = domTree.map[nodeId];
    if (!node) return;
    
    elementIndex++;
    let elementStr = `${elementIndex}. ${'  '.repeat(depth)}`;
    
    if (node.type === 'TEXT_NODE') {
      elementStr += `TEXT: "${node.text}"`;
      elementStr += ` → XPATH: ${node.xpath}`;
      elementStr += ` → SELECTOR: ${xpathToCSSSelector(node.xpath)}`;
    } else {
      elementStr += `<${node.tagName?.toLowerCase()}`;
      
      // Ensure attributes exists
      const attributes = node.attributes || {};
      
      // Add important attributes
      if (attributes.id) elementStr += ` id="${attributes.id}"`;
      if (attributes.class) elementStr += ` class="${attributes.class}"`;
      if (attributes.href) elementStr += ` href="${attributes.href}"`;
      if (attributes.type) elementStr += ` type="${attributes.type}"`;
      if (attributes.name) elementStr += ` name="${attributes.name}"`;
      if (attributes.placeholder) elementStr += ` placeholder="${attributes.placeholder}"`;
      if (attributes.value) elementStr += ` value="${attributes.value}"`;
      if (attributes.title) elementStr += ` title="${attributes.title}"`;
      if (attributes.alt) elementStr += ` alt="${attributes.alt}"`;
      if (attributes.role) elementStr += ` role="${attributes.role}"`;
      if (attributes['data-testid']) elementStr += ` data-testid="${attributes['data-testid']}"`;
      if (attributes['aria-label']) elementStr += ` aria-label="${attributes['aria-label']}"`;
      
      elementStr += '>';
      
      // Add text content if available
      if (node.text) {
        elementStr += ` TEXT: "${node.text}"`;
      }
      
      elementStr += ` → XPATH: ${node.xpath || ''}`;
      elementStr += ` → SELECTOR: ${generateCSSSelector(node)}`;
    }
    
    elements.push(elementStr);
    
    // Process children - ensure children is an array
    const children = Array.isArray(node.children) ? node.children : [];
    for (const childId of children) {
      processNode(childId, depth + 1);
    }
  }
  
  // Start from root
  processNode(domTree.rootId);
  
  return elements.join('\n');
}

/**
 * Find element by XPath in the DOM tree
 */
export function findElementByXPath(domTree: DOMTree, xpath: string): DOMNode | null {
  for (const [id, node] of Object.entries(domTree.map)) {
    if (node.xpath === xpath) {
      return node;
    }
  }
  return null;
}

/**
 * Find element by CSS selector in the DOM tree
 */
export function findElementBySelector(domTree: DOMTree, selector: string): DOMNode | null {
  // Simple selector matching - can be enhanced for complex selectors
  for (const [id, node] of Object.entries(domTree.map)) {
    if (node.type === 'TEXT_NODE') continue;
    
    // Ensure attributes exists
    const attributes = node.attributes || {};
    
    // Check ID selector
    if (selector.startsWith('#') && attributes.id === selector.slice(1)) {
      return node;
    }
    
    // Check class selector
    if (selector.startsWith('.') && attributes.class) {
      const classes = attributes.class.split(' ');
      const targetClass = selector.slice(1);
      if (classes.includes(targetClass)) {
        return node;
      }
    }
    
    // Check tag selector
    if (node.tagName?.toLowerCase() === selector.toLowerCase()) {
      return node;
    }
    
    // Check attribute selector
    const attrMatch = selector.match(/\[([^\]]+)\]/);
    if (attrMatch) {
      const attr = attrMatch[1];
      const [attrName, attrValue] = attr.split('=');
      if (attrValue && attributes[attrName] === attrValue.replace(/"/g, '')) {
        return node;
      }
    }
  }
  return null;
} 