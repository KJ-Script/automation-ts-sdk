# Browser Automation SDK - Complete Guide

## 🚀 Overview

This TypeScript SDK provides a complete browser automation solution with three main components:

1. **AutomationBrowser** - Launch and manage different browsers
2. **BrowserActions** - Perform actions like clicking, typing, scrolling
3. **DomExtractor** - Extract and analyze DOM structures

## 📦 Installation & Setup

```bash
npm install  # Install dependencies
npm run build  # Build the project
```

## 🌐 AutomationBrowser

Launch different browsers with custom configurations:

```typescript
import { AutomationBrowser } from '../src/index';

const browser = new AutomationBrowser({
  type: 'chrome',        // 'chrome', 'firefox', 'safari'
  headless: false,       // true for background, false for visual
  viewport: { width: 1280, height: 720 },
  timeout: 30000
});

await browser.launch();
const page = await browser.goto('https://example.com');
await browser.close();
```

## 🎯 BrowserActions - Complete Action List

### 🖱️ Clicking Actions
```typescript
const actions = new BrowserActions(page);

await actions.click('button');                    // Click element
await actions.clickFirst('input[type="radio"]');  // Click first of multiple
await actions.doubleClick('div');                 // Double click
await actions.rightClick('element');              // Right click
await actions.clickAt(100, 200);                  // Click coordinates
```

### ⌨️ Typing Actions
```typescript
await actions.type('input', 'Hello World');       // Type text
await actions.type('input', 'text', { clear: true }); // Clear first
await actions.clear('input');                     // Clear field
await actions.press('Enter');                     // Press key
await actions.pressSequence(['Control+a', 'Delete']); // Key sequence
```

### 📜 Scrolling Actions
```typescript
await actions.scrollToElement('footer');          // Scroll to element
await actions.scrollToTop();                      // Scroll to top
await actions.scrollToBottom();                   // Scroll to bottom
await actions.scrollBy(0, 300);                   // Scroll by pixels
```

### 🎯 Hover Actions
```typescript
await actions.hover('button');                    // Hover over element
```

### 📝 Form Actions
```typescript
await actions.selectOption('select', 'value');    // Select dropdown
await actions.check('checkbox');                  // Check checkbox
await actions.uncheck('checkbox');                // Uncheck checkbox
await actions.uploadFile('input[type="file"]', 'path/to/file.jpg');
```

### ⏳ Waiting Actions
```typescript
await actions.waitForElement('div');              // Wait for element
await actions.waitForText('Success');             // Wait for text
await actions.wait(2000);                         // Wait milliseconds
await actions.waitForLoad();                      // Wait for page load
```

### 🧭 Navigation Actions
```typescript
await actions.goBack();                           // Browser back
await actions.goForward();                        // Browser forward
await actions.refresh();                          // Refresh page
```

### 📸 Screenshot Actions
```typescript
await actions.screenshot({ path: 'page.png' });   // Full page screenshot
await actions.screenshotElement('div', { path: 'element.png' }); // Element screenshot
```

### 🔄 Drag & Drop Actions
```typescript
await actions.dragAndDrop('.source', '.target');  // Drag and drop
```

### 📊 Information Gathering
```typescript
const text = await actions.getText('h1');         // Get text content
const value = await actions.getValue('input');    // Get input value
const attr = await actions.getAttribute('img', 'src'); // Get attribute
const count = await actions.getElementCount('div'); // Count elements
const visible = await actions.isVisible('element'); // Check visibility
const enabled = await actions.isEnabled('button'); // Check if enabled
const checked = await actions.isChecked('checkbox'); // Check if checked
```

### 🔧 Advanced Actions
```typescript
// Execute custom JavaScript
const result = await actions.executeScript(() => {
  return document.title;
});

await actions.focus('input');                     // Focus element
await actions.blur('input');                      // Blur element
```

## 🌳 DomExtractor

Extract and analyze DOM structures:

```typescript
import { DomExtractor } from '../src/index';

const domExtractor = new DomExtractor({
  maxDepth: 10,
  excludeTags: ['script', 'style'],
  includeTextNodes: true,
  includeHidden: false
});

// Extract full page DOM
const domTree = await domExtractor.extractFromPage(page);

// Extract specific element
const bodyTree = await domExtractor.extractFromSelector(page, 'body');

// Get statistics
const stats = domExtractor.getTreeStats(domTree);
console.log(`Total nodes: ${stats.totalNodes}`);
console.log(`Max depth: ${stats.maxDepth}`);
console.log('Tag counts:', stats.tagCounts);

// Convert to string format
const treeString = domExtractor.treeToString(domTree);

// Convert to JSON
const jsonTree = domExtractor.treeToJson(domTree);
```

## 🎯 Examples

### Quick Start Example
```typescript
import { AutomationBrowser, BrowserActions } from '../src/index';

async function quickExample() {
  const browser = new AutomationBrowser({ type: 'chrome', headless: true });
  await browser.launch();
  
  const page = await browser.goto('https://example.com');
  const actions = new BrowserActions(page);
  
  const title = await actions.getText('h1');
  console.log('Page title:', title);
  
  await browser.close();
}
```

### Google Search Example
```typescript
async function googleSearch() {
  const browser = new AutomationBrowser({ type: 'chrome', headless: false });
  await browser.launch();
  
  const page = await browser.goto('https://google.com');
  const actions = new BrowserActions(page);
  
  await actions.type('input[name="q"]', 'TypeScript automation');
  await actions.press('Enter');
  await actions.waitForLoad();
  
  const resultCount = await actions.getElementCount('h3');
  console.log(`Found ${resultCount} results`);
  
  await browser.close();
}
```

### Form Automation Example
```typescript
async function formAutomation() {
  const browser = new AutomationBrowser({ type: 'chrome', headless: false });
  await browser.launch();
  
  const page = await browser.goto('https://httpbin.org/forms/post');
  const actions = new BrowserActions(page);
  
  await actions.type('input[name="custname"]', 'John Doe');
  await actions.type('textarea[name="comments"]', 'Automated form submission');
  await actions.click('input[type="radio"][value="medium"]');
  await actions.check('input[type="checkbox"]:first-of-type');
  
  await actions.screenshot({ path: 'form-filled.png' });
  
  await browser.close();
}
```

## 🏃‍♂️ Running Examples

```bash
# Run the interactive demo
npm run demo

# Test DOM extraction
npm run test:dom

# Test all actions
npm run test:actions

# Build the project
npm run build
```

## 🔧 Configuration Options

### Browser Options
- `type`: 'chrome' | 'firefox' | 'safari'
- `headless`: boolean (default: true)
- `viewport`: { width: number, height: number }
- `timeout`: number (default: 30000ms)

### Action Options
- `timeout`: Custom timeout for actions
- `force`: Force actions even if element not ready
- `delay`: Add delay between actions
- `clear`: Clear field before typing

### DOM Extraction Options
- `maxDepth`: Maximum DOM tree depth
- `excludeTags`: Array of tags to skip
- `includeTextNodes`: Include text content
- `includeHidden`: Include hidden elements
- `includeComments`: Include HTML comments

## 🎯 Best Practices

1. **Always use `await`** for all async operations
2. **Handle errors** with try-catch blocks
3. **Close browsers** in finally blocks
4. **Use specific selectors** to avoid conflicts
5. **Add waits** when dealing with dynamic content
6. **Use headless mode** for production/CI environments
7. **Take screenshots** for debugging visual issues

## 🛠️ TypeScript Support

Full TypeScript support with:
- Type definitions for all methods
- IntelliSense support
- Compile-time error checking
- Generic types for custom return values

---

Happy automating! 🚀 