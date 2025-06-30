import { AutomationBrowser, DomExtractor } from '../src/index';

async function domExtractionExample() {
  console.log('Starting DOM extraction example...\n');

  // Create browser instance
  const browser = new AutomationBrowser({
    type: 'chrome',
    headless: true // Set to false to see the browser in action
  });

  // Create DOM extractor with custom options
  const domExtractor = new DomExtractor({
    includeHidden: false,
    maxDepth: 10,
    excludeTags: ['script', 'style', 'noscript'],
    includeTextNodes: true,
    includeComments: false
  });

  try {
    // Launch browser and navigate to a page
    await browser.launch();
    console.log('Browser launched successfully');

    const page = await browser.goto('https://example.com');
    console.log('Navigated to example.com');

    // Extract full DOM tree
    console.log('\nExtracting full DOM tree...');
    const fullDomTree = await domExtractor.extractFromPage(page);
    
    // Get statistics about the DOM
    const stats = domExtractor.getTreeStats(fullDomTree);

    console.log(`Total nodes: ${stats.totalNodes}`);
    console.log(`Max depth: ${stats.maxDepth}`);
    console.log('Tag counts:', stats.tagCounts);

    // Convert to readable string format (first 50 lines only)
    console.log('\nDOM Tree Structure (first 2000 chars):');
    const treeString = domExtractor.treeToString(fullDomTree);
    console.log(treeString.substring(0, 2000) + '...');

    // Extract specific elements
    console.log('\nExtracting specific section...');
    const bodyTree = await domExtractor.extractFromSelector(page, 'body');
    if (bodyTree) {
      const bodyStats = domExtractor.getTreeStats(bodyTree);
      console.log(`Body section has ${bodyStats.totalNodes} nodes`);
    }

    // Save full DOM as JSON
    console.log('\nFull DOM as JSON (first 1000 chars):');
    const jsonOutput = domExtractor.treeToJson(fullDomTree);
    console.log(jsonOutput.substring(0, 1000) + '...');

    // Example with a more complex website
    console.log('\nTesting with a more complex site...');
    const page2 = await browser.newPage();
    await page2.goto('https://news.ycombinator.com');
    
    const hnDomTree = await domExtractor.extractFromPage(page2);
    const hnStats = domExtractor.getTreeStats(hnDomTree);
    console.log('Hacker News DOM Statistics:');
    console.log(`Total nodes: ${hnStats.totalNodes}`);
    console.log(`Max depth: ${hnStats.maxDepth}`);
    console.log(`Most common tags:`, 
      Object.entries(hnStats.tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
    );

  } catch (error) {
    console.error('Error during DOM extraction:', error);
  } finally {
    // Clean up
    await browser.close();
    console.log('\nBrowser closed successfully');
  }
}

// Run the example
domExtractionExample().catch(console.error); 