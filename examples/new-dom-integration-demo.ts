import { AIAgent } from '../src/agents/agent';
import { extractDOMTree, extractDOMSummary, xpathToCSSSelector, generateCSSSelector, DOMNode } from '../src/dom/domExtractor';
import { BrowserConfig } from '../src/types';

// Configuration for the demo
const config = {
  apiKey: process.env.GOOGLE_API_KEY || 'your-api-key-here',
  model: 'gemini-1.5-flash',
  browserConfig: {
    type: 'chrome' as const,
    headless: false,
    viewport: { width: 1280, height: 720 }
  },
  maxRetries: 3,
  debugMode: true,
  screenshotDir: './screenshots',
  enableScreenshots: true,
  performance: {
    domAnalysisFrequency: 'all' as const,
    screenshotFrequency: 'key' as const,
    taskWaitTime: 1000,
    clickWaitTime: 500,
    typeWaitTime: 300
  }
};

async function demoNewDOMIntegration() {
  console.log('🚀 New DOM Integration Demo\n');
  
  // Create AI Agent
  const agent = new AIAgent(config);
  
  try {
    // Initialize browser
    await agent.execute('Navigate to https://example.com');
    
    // Get current page context with new DOM extraction
    const pageContext = await agent['getPageContextWithScreenshots']();
    
    console.log('📊 DOM Analysis Results:');
    console.log(`📍 URL: ${pageContext.url}`);
    console.log(`📝 Title: ${pageContext.title}`);
    console.log(`🏗️ Elements found: ${pageContext.domSummary.split('\n').length}`);
    console.log(`📸 Screenshot: ${pageContext.screenshot ? '✅ Taken' : '❌ Skipped'}`);
    
    // Show sample DOM summary
    console.log('\n📋 Sample DOM Summary (first 10 lines):');
    const summaryLines = pageContext.domSummary.split('\n').slice(0, 10);
    summaryLines.forEach((line: string) => console.log(`   ${line}`));
    
    // Demonstrate XPath to CSS selector conversion
    console.log('\n🔄 XPath to CSS Selector Conversion Examples:');
    
    // Find some elements in the DOM tree
    const domTree = pageContext.domTree;
    let elementCount = 0;
    
    for (const [id, node] of Object.entries(domTree.map)) {
      if (elementCount >= 5) break; // Show first 5 elements
      
      if ((node as DOMNode).type !== 'TEXT_NODE') {
        const xpath = (node as DOMNode).xpath;
        const cssSelector = xpathToCSSSelector(xpath);
        const smartSelector = generateCSSSelector(node as DOMNode);
        
        console.log(`\n   Element: ${(node as DOMNode).tagName}`);
        console.log(`   XPath: ${xpath}`);
        console.log(`   CSS Selector (converted): ${cssSelector}`);
        console.log(`   Smart Selector: ${smartSelector}`);
        
        elementCount++;
      }
    }
    
    // Demonstrate element interaction with converted selectors
    console.log('\n🎯 Element Interaction Demo:');
    
    // Find a clickable element (like a link or button)
    let clickableElement: DOMNode | null = null;
    for (const [id, node] of Object.entries(domTree.map)) {
      const domNode = node as DOMNode;
      if (domNode.type !== 'TEXT_NODE' && 
          (domNode.tagName === 'A' || domNode.tagName === 'BUTTON' || 
           domNode.attributes.href || domNode.attributes.onclick)) {
        clickableElement = domNode;
        break;
      }
    }
    
    if (clickableElement) {
      const xpath = clickableElement.xpath;
      const cssSelector = xpathToCSSSelector(xpath);
      const smartSelector = generateCSSSelector(clickableElement);
      
      console.log(`\n   Found clickable element: ${clickableElement.tagName}`);
      console.log(`   XPath: ${xpath}`);
      console.log(`   CSS Selector: ${cssSelector}`);
      console.log(`   Smart Selector: ${smartSelector}`);
      console.log(`   Attributes:`, clickableElement.attributes);
      
      // Demonstrate clicking using the converted selector
      console.log(`\n   🖱️ Attempting to click using smart selector: ${smartSelector}`);
      
      try {
        const actions = await agent['getActions']();
        await actions.click(smartSelector);
        console.log(`   ✅ Successfully clicked element using smart selector`);
      } catch (error) {
        console.log(`   ❌ Failed to click element: ${error}`);
        
        // Try with converted XPath selector as fallback
        try {
          console.log(`   🔄 Trying with converted XPath selector: ${cssSelector}`);
          const actions = await agent['getActions']();
          await actions.click(cssSelector);
          console.log(`   ✅ Successfully clicked element using converted XPath selector`);
        } catch (fallbackError) {
          console.log(`   ❌ Failed to click element with fallback: ${fallbackError}`);
        }
      }
    } else {
      console.log(`\n   No clickable elements found in the DOM tree`);
    }
    
    // Demonstrate form interaction if available
    console.log('\n📝 Form Interaction Demo:');
    
    let inputElement: DOMNode | null = null;
    for (const [id, node] of Object.entries(domTree.map)) {
      const domNode = node as DOMNode;
      if (domNode.type !== 'TEXT_NODE' && 
          domNode.tagName === 'INPUT' && 
          domNode.attributes.type !== 'hidden') {
        inputElement = domNode;
        break;
      }
    }
    
    if (inputElement) {
      const xpath = inputElement.xpath;
      const cssSelector = xpathToCSSSelector(xpath);
      const smartSelector = generateCSSSelector(inputElement);
      
      console.log(`\n   Found input element: ${inputElement.tagName}`);
      console.log(`   XPath: ${xpath}`);
      console.log(`   CSS Selector: ${cssSelector}`);
      console.log(`   Smart Selector: ${smartSelector}`);
      console.log(`   Type: ${inputElement.attributes.type}`);
      console.log(`   Placeholder: ${inputElement.attributes.placeholder || 'None'}`);
      
      // Demonstrate typing using the converted selector
      console.log(`\n   ⌨️ Attempting to type using smart selector: ${smartSelector}`);
      
      try {
        const actions = await agent['getActions']();
        await actions.type(smartSelector, 'Hello from new DOM system!', { clear: true });
        console.log(`   ✅ Successfully typed into element using smart selector`);
      } catch (error) {
        console.log(`   ❌ Failed to type into element: ${error}`);
        
        // Try with converted XPath selector as fallback
        try {
          console.log(`   🔄 Trying with converted XPath selector: ${cssSelector}`);
          const actions = await agent['getActions']();
          await actions.type(cssSelector, 'Hello from new DOM system!', { clear: true });
          console.log(`   ✅ Successfully typed into element using converted XPath selector`);
        } catch (fallbackError) {
          console.log(`   ❌ Failed to type into element with fallback: ${fallbackError}`);
        }
      }
    } else {
      console.log(`\n   No input elements found in the DOM tree`);
    }
    
    // Performance comparison
    console.log('\n⚡ Performance Comparison:');
    
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
      if (clickableElement) {
        generateCSSSelector(clickableElement);
      }
    }
    const endCSS = performance.now();
    const cssTime = endCSS - startCSS;
    
    console.log(`   XPath to CSS conversion (${iterations} iterations): ${xpathTime.toFixed(2)}ms`);
    console.log(`   CSS selector generation (${iterations} iterations): ${cssTime.toFixed(2)}ms`);
    console.log(`   Average per operation: ${(xpathTime / iterations).toFixed(4)}ms / ${(cssTime / iterations).toFixed(4)}ms`);
    
    console.log('\n✅ Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Cleanup
    await agent.cleanup();
  }
}

// Run the demo
if (require.main === module) {
  demoNewDOMIntegration().catch(console.error);
}

export { demoNewDOMIntegration }; 