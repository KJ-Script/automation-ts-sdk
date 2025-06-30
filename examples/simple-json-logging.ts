import { AutomationBrowser, DataExtractor } from '../src/index';

async function simpleJsonLogging() {
  console.log('📊 Simple JSON Logging Example\n');

  const browser = new AutomationBrowser({
    type: 'chrome',
    headless: true
  });

  try {
    await browser.launch();
    console.log('✅ Browser launched');

    // Navigate to a page
    const page = await browser.goto('https://github.com');
    const extractor = new DataExtractor(page);

    // Extract data and automatically log the JSON
    console.log('🔍 Extracting data...\n');
    
    const data = await extractor.extractCommonData();
    
    // Log the JSON output (this is what you want!)
    console.log('📄 EXTRACTED JSON:');
    console.log(JSON.stringify(data, null, 2));

    // Alternative: Use the built-in toJSON method
    console.log('\n📄 USING toJSON METHOD:');
    console.log(extractor.toJSON(data));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
    console.log('\n🧹 Browser closed');
  }
}

// Run the example
simpleJsonLogging().catch(console.error);
