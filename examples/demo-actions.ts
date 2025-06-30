import { AutomationBrowser, BrowserActions } from '../src/index';

async function demoActions() {
  console.log('🎯 Browser Actions Demo\n');

  const browser = new AutomationBrowser({
    type: 'chrome',
    headless: false, // Visual demo
    viewport: { width: 1280, height: 720 }
  });

  try {
    await browser.launch();
    console.log('✅ Browser launched');

    // Demo 1: Basic Navigation and Information Gathering
    console.log('\n🔍 Demo 1: Basic Information Gathering');
    const page = await browser.goto('https://example.com');
    const actions = new BrowserActions(page);

    const title = await actions.getText('h1');
    const linkCount = await actions.getElementCount('a');
    console.log(`📄 Page title: "${title}"`);
    console.log(`🔗 Links found: ${linkCount}`);

    // Demo 2: Scrolling and Screenshots
    console.log('\n📸 Demo 2: Scrolling and Screenshots');
    await actions.scrollToBottom({ behavior: 'smooth' });
    await actions.wait(1000);
    await actions.screenshot({ path: 'demo-bottom.png' });
    console.log('📸 Screenshot taken at bottom');

    await actions.scrollToTop({ behavior: 'smooth' });
    await actions.wait(1000);
    console.log('⬆️ Scrolled back to top');

    // Demo 3: Google Search Example
    console.log('\n🔍 Demo 3: Google Search Automation');
    await page.goto('https://www.google.com');
    await actions.waitForLoad();

    // Handle cookie consent if present
    try {
      await actions.waitForElement('[id*="accept"], [id*="consent"], button[jsname]', { timeout: 3000 });
      const acceptButton = '[id*="accept"], [id*="consent"], button[jsname]';
      if (await actions.isVisible(acceptButton)) {
        await actions.click(acceptButton);
        console.log('✅ Handled consent dialog');
      }
    } catch {
      console.log('ℹ️ No consent dialog found');
    }

    // Search for something
    const searchBox = 'input[name="q"], textarea[name="q"]';
    await actions.waitForElement(searchBox);
    await actions.type(searchBox, 'TypeScript automation', { clear: true });
    console.log('⌨️ Typed search query');

    await actions.press('Enter');
    await actions.waitForLoad();
    console.log('🔍 Search executed');

    // Count search results
    await actions.wait(2000); // Wait for results to load
    const resultCount = await actions.getElementCount('h3');
    console.log(`📊 Found approximately ${resultCount} search result headings`);

    // Demo 4: Form Interaction Example
    console.log('\n📝 Demo 4: Form Interactions');
    await page.goto('https://httpbin.org/forms/post');
    await actions.waitForLoad();

    // Fill out form fields
    await actions.type('input[name="custname"]', 'Demo User', { clear: true });
    await actions.type('textarea[name="comments"]', 'This is an automated test!', { clear: true });
    
    // Select radio button
    const radioButtons = await actions.getElementCount('input[type="radio"]');
    if (radioButtons > 0) {
      await actions.click('input[type="radio"][value="medium"]');
      console.log('🔘 Selected radio button');
    }

    console.log('📝 Form filled successfully');

    // Demo 5: Advanced Actions
    console.log('\n🔧 Demo 5: Advanced JavaScript Execution');
    const pageInfo = await actions.executeScript(() => ({
      title: document.title,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }));

    console.log('📊 Page Info via JavaScript:');
    console.log(`   Title: ${pageInfo.title}`);
    console.log(`   Viewport: ${pageInfo.viewport.width}x${pageInfo.viewport.height}`);

    console.log('\n🎉 Demo completed successfully!');
    console.log('💡 Tip: Set headless: true in AutomationBrowser for background execution');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    console.log('\n⏳ Waiting 3 seconds before cleanup...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();
    console.log('🧹 Browser closed');
  }
}

// Run the demo
demoActions().catch(console.error); 