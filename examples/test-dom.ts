import { AutomationBrowser, DomExtractor } from '../src/index';

async function testDomExtraction() {
  console.log('🧪 Testing DOM extraction fix...\n');

  const browser = new AutomationBrowser({
    type: 'chrome',
    headless: true
  });

  const domExtractor = new DomExtractor({
    maxDepth: 5,
    excludeTags: ['script', 'style'],
    includeTextNodes: true
  });

  try {
    await browser.launch();
    console.log('✅ Browser launched');

    const page = await browser.goto('https://www.ycombinator.com/');
    console.log('✅ Page loaded');

    console.log('🔍 Extracting DOM...');
    const domTree = await domExtractor.extractFromPage(page);
    console.log('✅ DOM extraction successful!');

    const stats = domExtractor.getTreeStats(domTree);
    console.log(`📊 Found ${stats.totalNodes} nodes with max depth ${stats.maxDepth}`);
    console.log('📋 Tag counts:', stats.tagCounts);

    console.log('\n🌳 DOM Tree (first 500 chars):');
    const treeString = domExtractor.treeToString(domTree);
    console.log(treeString.substring(0, 500) + '...\n');

    // Test selector extraction
    console.log('🎯 Testing selector extraction...');
    const bodyTree = await domExtractor.extractFromSelector(page, 'body');
    if (bodyTree) {
      const bodyStats = domExtractor.getTreeStats(bodyTree);
      console.log(`📊 Body has ${bodyStats.totalNodes} nodes`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
    console.log('🧹 Browser closed');
  }
}

testDomExtraction().catch(console.error); 