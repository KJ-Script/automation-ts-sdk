const { MultiTabAgent } = require('./dist/src');

async function testMultiTab() {
  console.log('🧪 Testing Multi-Tab Functionality...');
  
  const agent = new MultiTabAgent({
    apiKey: process.env.GOOGLE_AI_API_KEY || 'test-key',
    browserConfig: {
      type: 'chrome',
      headless: true // Use headless for testing
    },
    maxConcurrentTasks: 2,
    debugMode: true
  });

  try {
    // Test basic functionality
    console.log('✅ MultiTabAgent created successfully');
    
    // Test tab management through browser
    await agent['initializeBrowser']();
    const browser = agent['browser'];
    
    if (browser) {
      console.log('✅ Browser initialized successfully');
      
      // Test tab creation
      const tabId = await browser.createTab();
      console.log(`✅ Tab created: ${tabId}`);
      
      // Test tab navigation
      await browser.navigateTab(tabId, 'https://example.com');
      console.log(`✅ Tab navigated to example.com`);
      
      // Test tab stats
      const stats = browser.getTabStats();
      console.log(`✅ Tab stats: ${JSON.stringify(stats)}`);
      
      // Test tab cleanup
      await browser.closeTab(tabId);
      console.log(`✅ Tab closed: ${tabId}`);
    }
    
    console.log('✅ All basic tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await agent.cleanup();
    console.log('✅ Cleanup completed');
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testMultiTab().catch(console.error);
}

module.exports = { testMultiTab }; 