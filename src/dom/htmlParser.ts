import { JSDOM } from 'jsdom';
import { ParseOptions } from '../types';

/**
 * Parse HTML directly to a summary string for AI processing (optimized)
 * This function skips the intermediate DOM tree creation for better performance
 */
export function parseHTMLToSummary(html: string, options: ParseOptions = {}): string {
  const {
    maxDepth = 4,
    excludeTags = ['script', 'style'],
    includeTextNodes = true,
    maxElements = 80
  } = options;

  // Use jsdom for server-side HTML parsing
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  const elements: string[] = [];
  let elementIndex = 0;
  
  function traverse(element: Element, depth: number = 0) {
    if (depth > maxDepth || elementIndex >= maxElements) return;
    
    const tagName = element.tagName.toLowerCase();
    
    // Skip excluded tags
    if (excludeTags.includes(tagName)) {
      // Still traverse children of excluded elements
      for (const child of element.children) {
        traverse(child, depth + 1);
      }
      return;
    }
    
    elementIndex++;
    let elementStr = `${elementIndex}. ${'  '.repeat(depth)}<${tagName}`;
    
    // Add important attributes for selector generation
    if (element.id) elementStr += ` id="${element.id}"`;
    if (element.className) elementStr += ` class="${element.className}"`;
    if (element.getAttribute('href')) elementStr += ` href="${element.getAttribute('href')}"`;
    if (tagName === 'input' && element.getAttribute('type')) elementStr += ` type="${element.getAttribute('type')}"`;
    if (element.getAttribute('name')) elementStr += ` name="${element.getAttribute('name')}"`;
    if (element.getAttribute('placeholder')) elementStr += ` placeholder="${element.getAttribute('placeholder')}"`;
    if (element.getAttribute('value')) elementStr += ` value="${element.getAttribute('value')}"`;
    if (element.getAttribute('title')) elementStr += ` title="${element.getAttribute('title')}"`;
    if (element.getAttribute('alt')) elementStr += ` alt="${element.getAttribute('alt')}"`;
    if (element.getAttribute('role')) elementStr += ` role="${element.getAttribute('role')}"`;
    if (element.getAttribute('data-testid')) elementStr += ` data-testid="${element.getAttribute('data-testid')}"`;
    if (element.getAttribute('aria-label')) elementStr += ` aria-label="${element.getAttribute('aria-label')}"`;
    
    elementStr += '>';
    
    // Add text content if meaningful and not too long
    if (includeTextNodes) {
      const textContent = element.textContent?.trim();
      if (textContent && textContent.length > 0 && textContent.length < 100) {
        elementStr += ` TEXT: "${textContent}"`;
      }
    }
    
    // Generate suggested selector for this element
    let suggestedSelector = '';
    if (element.id) {
      suggestedSelector = `#${element.id}`;
    } else if (element.className) {
      const classes = element.className.split(' ').filter((c: string) => c.length > 0);
      suggestedSelector = `.${classes.join('.')}`;
    } else if (element.getAttribute('name')) {
      suggestedSelector = `${tagName}[name="${element.getAttribute('name')}"]`;
    } else if (element.getAttribute('type')) {
      suggestedSelector = `${tagName}[type="${element.getAttribute('type')}"]`;
    } else if (element.getAttribute('data-testid')) {
      suggestedSelector = `[data-testid="${element.getAttribute('data-testid')}"]`;
    } else {
      suggestedSelector = tagName;
    }
    
    elementStr += ` → SELECTOR: ${suggestedSelector}`;
    
    elements.push(elementStr);
    
    // Traverse children
    for (const child of element.children) {
      traverse(child, depth + 1);
    }
  }
  
  traverse(document.documentElement);
  return elements.join('\n');
}



 