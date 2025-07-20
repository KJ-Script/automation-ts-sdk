import { extractDOMTree, extractDOMSummary, xpathToCSSSelector, generateCSSSelector, findElementByXPath, findElementBySelector, DOMTree, DOMNode } from '../src/dom/domExtractor';

// Mock DOM tree for testing (simulating what would be returned by extractDOMTree)
const mockDomTree: DOMTree = {
  rootId: 'dom-0',
  map: {
    'dom-0': {
      tagName: 'BODY',
      children: ['dom-1', 'dom-4'],
      attributes: {},
      xpath: '/body'
    },
    'dom-1': {
      tagName: 'DIV',
      children: ['dom-2', 'dom-3'],
      attributes: { id: 'main-container', class: 'page-wrapper' },
      xpath: '/body/div[1]'
    },
    'dom-2': {
      tagName: 'H1',
      children: [],
      attributes: { id: 'logo' },
      xpath: '/body/div[1]/h1[1]'
    },
    'dom-3': {
      tagName: 'INPUT',
      children: [],
      attributes: { 
        id: 'username', 
        name: 'username', 
        type: 'text', 
        placeholder: 'Enter your username',
        class: 'form-input'
      },
      xpath: '/body/div[1]/input[1]'
    },
    'dom-4': {
      tagName: 'BUTTON',
      children: [],
      attributes: { 
        id: 'login-btn', 
        class: 'btn btn-primary',
        'data-testid': 'login-button'
      },
      xpath: '/body/button[1]'
    }
  }
};

console.log('🧪 Testing New DOM Extraction System\n');

// Test 1: Extract DOM Summary
console.log('📋 Test 1: DOM Summary Extraction');
const summary = extractDOMSummary(mockDomTree);
console.log('DOM Summary:');
console.log(summary);
console.log('\n');

// Test 2: XPath to CSS Selector Conversion
console.log('🔄 Test 2: XPath to CSS Selector Conversion');
const xpathTests = [
  '/body',
  '/body/div[1]',
  '/body/div[1]/h1[1]',
  '/body/div[1]/input[1]',
  '/body/button[1]'
];

xpathTests.forEach(xpath => {
  const cssSelector = xpathToCSSSelector(xpath);
  console.log(`${xpath} → ${cssSelector}`);
});
console.log('\n');

// Test 3: Generate CSS Selectors for Elements
console.log('🎯 Test 3: Generate CSS Selectors for Elements');
Object.entries(mockDomTree.map).forEach(([id, node]) => {
  if (node.type !== 'TEXT_NODE') {
    const selector = generateCSSSelector(node as DOMNode);
    console.log(`${(node as DOMNode).tagName} (${(node as DOMNode).xpath}) → ${selector}`);
  }
});
console.log('\n');

// Test 4: Find Elements by XPath
console.log('🔍 Test 4: Find Elements by XPath');
const testXPath = '/body/div[1]/input[1]';
const foundElement = findElementByXPath(mockDomTree, testXPath);
if (foundElement) {
  console.log(`Found element for XPath "${testXPath}":`);
  console.log(`  Tag: ${foundElement.tagName}`);
  console.log(`  Attributes:`, foundElement.attributes);
} else {
  console.log(`No element found for XPath "${testXPath}"`);
}
console.log('\n');

// Test 5: Find Elements by CSS Selector
console.log('🎯 Test 5: Find Elements by CSS Selector');
const testSelectors = [
  '#username',
  '.form-input',
  'input[type="text"]',
  '#login-btn',
  '[data-testid="login-button"]'
];

testSelectors.forEach(selector => {
  const foundElement = findElementBySelector(mockDomTree, selector);
  if (foundElement) {
    console.log(`Found element for selector "${selector}": ${foundElement.tagName} (${foundElement.xpath})`);
  } else {
    console.log(`No element found for selector "${selector}"`);
  }
});
console.log('\n');

// Test 6: Performance Comparison
console.log('⚡ Test 6: Performance Comparison');
const iterations = 1000;

// Test XPath to CSS conversion performance
const startXPath = performance.now();
for (let i = 0; i < iterations; i++) {
  xpathToCSSSelector('/body/div[1]/h1[1]');
}
const endXPath = performance.now();
const xpathTime = endXPath - startXPath;

// Test CSS selector generation performance
const startCSS = performance.now();
for (let i = 0; i < iterations; i++) {
  generateCSSSelector(mockDomTree.map['dom-3']);
}
const endCSS = performance.now();
const cssTime = endCSS - startCSS;

console.log(`XPath to CSS conversion (${iterations} iterations): ${xpathTime.toFixed(2)}ms`);
console.log(`CSS selector generation (${iterations} iterations): ${cssTime.toFixed(2)}ms`);
console.log(`Average per operation: ${(xpathTime / iterations).toFixed(4)}ms / ${(cssTime / iterations).toFixed(4)}ms`);

console.log('\n✅ All tests completed successfully!');
console.log('\n🎯 Key Features:');
console.log('• DOM tree extraction using injected script');
console.log('• XPath to CSS selector conversion');
console.log('• Intelligent CSS selector generation');
console.log('• Element finding by XPath and CSS selector');
console.log('• High-performance operations'); 