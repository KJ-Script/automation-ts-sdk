import { AutomationBrowser, DataExtractor, ExtractionRule } from '../src/index';

async function dataExtractionDemo() {
  console.log('📊 Data Extraction Demo - Extract Values as JSON\n');

  const browser = new AutomationBrowser({
    type: 'chrome',
    headless: false, // Set to true for background execution
    viewport: { width: 1400, height: 900 }
  });

  try {
    await browser.launch();
    console.log('✅ Browser launched');

    // Demo 1: Extract Common Data from Example.com
    console.log('\n🔍 Demo 1: Extracting Common Data from Example.com');
    const page1 = await browser.goto('https://example.com');
    const extractor1 = new DataExtractor(page1);

    // Extract common web page elements
    const commonData = await extractor1.extractCommonData();
    console.log('📄 Common Data Extracted:');
    console.log(extractor1.toJSON(commonData));

    // Save to file
    await extractor1.saveToFile(commonData, 'extracted-common-data.json');
    console.log('💾 Data saved to: extracted-common-data.json');

    // Demo 2: Custom Extraction Rules for Hacker News
    console.log('\n🔍 Demo 2: Custom Rules for Hacker News');
    const page2 = await browser.goto('https://news.ycombinator.com');
    const extractor2 = new DataExtractor(page2);

    // Define custom extraction rules for Hacker News
    const hackerNewsRules: ExtractionRule[] = [
      {
        key: 'storyTitles',
        selector: '.storylink',
        multiple: true
      },
      {
        key: 'storyLinks',
        selector: '.storylink',
        attribute: 'href',
        multiple: true
      },
      {
        key: 'points',
        selector: '.score',
        multiple: true,
        transform: (value: string) => {
          const match = value.match(/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        }
      },
      {
        key: 'authors',
        selector: '.hnuser',
        multiple: true
      },
      {
        key: 'commentCounts',
        selector: 'a[href*="item?id="]:last-child',
        multiple: true,
        transform: (value: string) => {
          const match = value.match(/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        }
      }
    ];

    const hackerNewsData = await extractor2.extractData(hackerNewsRules);
    console.log('📊 Hacker News Data Sample:');
    
    // Show first 3 stories in a structured way
    const structuredHN = {
      topStories: hackerNewsData.storyTitles?.slice(0, 3).map((title: string, index: number) => ({
        title,
        link: hackerNewsData.storyLinks?.[index],
        points: hackerNewsData.points?.[index] || 0,
        author: hackerNewsData.authors?.[index],
        comments: hackerNewsData.commentCounts?.[index] || 0
      })),
      totalStories: hackerNewsData.storyTitles?.length || 0,
      extractedAt: new Date().toISOString()
    };

    console.log(JSON.stringify(structuredHN, null, 2));
    await extractor2.saveToFile(hackerNewsData, 'hacker-news-data.json');
    console.log('💾 Hacker News data saved to: hacker-news-data.json');

    // Demo 3: Social Media Metadata Extraction
    console.log('\n🔍 Demo 3: Social Media Metadata');
    const page3 = await browser.goto('https://github.com');
    const extractor3 = new DataExtractor(page3);

    const socialData = await extractor3.extractSocialData();
    console.log('📱 Social Media Metadata:');
    console.log(extractor3.toJSON(socialData));

    // Demo 4: Form Data Extraction
    console.log('\n🔍 Demo 4: Form Analysis');
    const page4 = await browser.goto('https://httpbin.org/forms/post');
    const extractor4 = new DataExtractor(page4);

    const formData = await extractor4.extractFormData();
    console.log('📝 Form Structure Analysis:');
    console.log(extractor4.toJSON(formData));

    // Demo 5: E-commerce Product Data (if available)
    console.log('\n🔍 Demo 5: Custom Product Data Extraction');
    const page5 = await browser.goto('https://example.com');
    const extractor5 = new DataExtractor(page5);

    // Example of extracting product-like data (generic example)
    const productRules: ExtractionRule[] = [
      {
        key: 'pageTitle',
        selector: 'h1'
      },
      {
        key: 'description',
        selector: 'p',
        multiple: true
      },
      {
        key: 'allLinks',
        selector: 'a',
        attribute: 'href',
        multiple: true,
        transform: (value: string) => {
          // Clean up links - remove empty and invalid ones
          return value && value.startsWith('http') ? value : null;
        }
      },
      {
        key: 'metaInfo',
        selector: 'meta[name="description"]',
        attribute: 'content'
      }
    ];

    const productData = await extractor5.extractData(productRules, {
      includeMetadata: true,
      timeout: 10000
    });

    console.log('🛒 Product-like Data:');
    console.log(extractor5.toJSON(productData));

    // Demo 6: Batch Processing Multiple URLs
    console.log('\n🔍 Demo 6: Batch Processing Multiple Sites');
    
    const sites = [
      { name: 'Example', url: 'https://example.com' },
      { name: 'HttpBin', url: 'https://httpbin.org' }
    ];

    const batchResults: any[] = [];

    for (const site of sites) {
      try {
        console.log(`📡 Processing ${site.name}...`);
        const page = await browser.goto(site.url);
        const extractor = new DataExtractor(page);
        
        const quickRules: ExtractionRule[] = [
          { key: 'title', selector: 'title' },
          { key: 'h1', selector: 'h1' },
          { key: 'linkCount', selector: 'a', multiple: true, transform: () => 1 },
          { key: 'imageCount', selector: 'img', multiple: true, transform: () => 1 }
        ];

        const siteData = await extractor.extractData(quickRules, { 
          timeout: 5000,
          includeMetadata: true 
        });

        // Add site name to the data
        siteData.siteName = site.name;
        siteData.totalLinks = Array.isArray(siteData.linkCount) ? siteData.linkCount.length : 0;
        siteData.totalImages = Array.isArray(siteData.imageCount) ? siteData.imageCount.length : 0;
        
        // Remove the counting arrays
        delete siteData.linkCount;
        delete siteData.imageCount;

        batchResults.push(siteData);
        
             } catch (error) {
         console.warn(`⚠️ Failed to process ${site.name}:`, error);
         batchResults.push({
           siteName: site.name,
           error: error instanceof Error ? error.message : String(error),
           url: site.url
         });
       }
    }

    console.log('📦 Batch Processing Results:');
    console.log(JSON.stringify(batchResults, null, 2));

    // Save batch results
    const fs = await import('fs');
    fs.writeFileSync('batch-extraction-results.json', JSON.stringify(batchResults, null, 2));
    console.log('💾 Batch results saved to: batch-extraction-results.json');

    console.log('\n🎉 Data Extraction Demo Completed!');
    console.log('📁 Generated Files:');
    console.log('   - extracted-common-data.json');
    console.log('   - hacker-news-data.json');
    console.log('   - batch-extraction-results.json');
    console.log('\n💡 Pro Tips:');
    console.log('   - Use transformation functions to clean and convert data');
    console.log('   - Set appropriate timeouts for slow-loading sites');
    console.log('   - Include metadata for debugging and tracking');
    console.log('   - Batch process multiple sites for efficiency');

  } catch (error) {
    console.error('❌ Data extraction demo failed:', error);
  } finally {
    console.log('\n⏳ Cleaning up in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();
    console.log('🧹 Browser closed');
  }
}

// Run the demo
dataExtractionDemo().catch(console.error); 