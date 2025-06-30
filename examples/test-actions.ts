import { AutomationBrowser, BrowserActions } from '../src/index';

async function testBrowserActions() {
  console.log('🚀 Testing Browser Actions...\n');

  const browser = new AutomationBrowser({
    type: 'chrome',
    headless: false, // Set to true to run in background
    viewport: { width: 1280, height: 720 }
  });

  try {
    // Launch browser and navigate to a test page
    await browser.launch();
    console.log('✅ Browser launched');

    const page = await browser.goto('https://example.com');
    console.log('✅ Navigated to example.com');

    // Create BrowserActions instance
    const actions = new BrowserActions(page);

    // ========== BASIC ACTIONS TESTING ==========
    console.log('\n📸 Taking initial screenshot...');
    await actions.screenshot({ path: 'screenshots/initial.png', fullPage: true });
    console.log('✅ Screenshot saved');

    console.log('\n⏳ Waiting for page to load completely...');
    await actions.waitForLoad();
    console.log('✅ Page loaded');

    // ========== INFORMATION GATHERING ==========
    console.log('\n📊 Gathering page information...');
    
    const title = await actions.getText('h1');
    console.log(`📝 Page title: ${title}`);

    const linkCount = await actions.getElementCount('a');
    console.log(`🔗 Found ${linkCount} links on page`);

    const isLinkVisible = await actions.isVisible('a');
    console.log(`👁️ Link visible: ${isLinkVisible}`);

    // ========== SCROLLING ACTIONS ==========
    console.log('\n📜 Testing scrolling actions...');
    
    await actions.scrollToBottom({ behavior: 'smooth' });
    await actions.wait(1000);
    console.log('✅ Scrolled to bottom');

    await actions.scrollToTop({ behavior: 'smooth' });
    await actions.wait(1000);
    console.log('✅ Scrolled to top');

    await actions.scrollBy(0, 200);
    console.log('✅ Scrolled by 200px');

    // ========== CLICKING ACTIONS ==========
    console.log('\n🖱️ Testing click actions...');
    
    const link = 'a[href*="iana.org"]';
    if (await actions.isVisible(link)) {
      await actions.hover(link);
      console.log('✅ Hovered over link');
      
      await actions.wait(500);
      await actions.click(link);
      console.log('✅ Clicked on link');
      
      // Wait for navigation
      await actions.waitForLoad();
      console.log('✅ Navigated successfully');
      
      // Go back
      await actions.goBack();
      await actions.waitForLoad();
      console.log('✅ Went back to previous page');
    }

    // ========== TESTING WITH A FORM SITE ==========
    console.log('\n📝 Testing form interactions...');
    
    // Navigate to a form testing site
    await page.goto('https://httpbin.org/forms/post');
    await actions.waitForLoad();
    console.log('✅ Navigated to form test page');

    // Test typing actions
    const customerNameField = 'input[name="custname"]';
    if (await actions.isVisible(customerNameField)) {
      await actions.focus(customerNameField);
      await actions.type(customerNameField, 'Test User', { clear: true });
      console.log('✅ Typed in customer name field');

      const customerNameValue = await actions.getValue(customerNameField);
      console.log(`📝 Customer name value: ${customerNameValue}`);
    }

    // Test textarea
    const commentField = 'textarea[name="comments"]';
    if (await actions.isVisible(commentField)) {
      await actions.type(commentField, 'This is a test comment from automation!', { clear: true });
      console.log('✅ Typed in comment field');
    }

    // Test dropdown selection
    const sizeDropdown = 'select[name="custemail"]';
    if (await actions.isVisible(sizeDropdown)) {
      // Note: httpbin form doesn't have proper select, but showing how it would work
      console.log('📋 Dropdown field found (structure may vary)');
    }

    // Test radio buttons
    const radioButtons = 'input[type="radio"]';
    const radioCount = await actions.getElementCount(radioButtons);
    if (radioCount > 0) {
      await actions.click('input[type="radio"]:first-of-type');
      console.log('✅ Selected first radio button');
    }

    // Test checkboxes
    const checkboxes = 'input[type="checkbox"]';
    const checkboxCount = await actions.getElementCount(checkboxes);
    if (checkboxCount > 0) {
      await actions.check('input[type="checkbox"]:first-of-type');
      console.log('✅ Checked first checkbox');
      
      const isChecked = await actions.isChecked('input[type="checkbox"]:first-of-type');
      console.log(`☑️ Checkbox checked: ${isChecked}`);
    }

    // ========== KEYBOARD ACTIONS ==========
    console.log('\n⌨️ Testing keyboard actions...');
    
    await actions.press('Tab');
    console.log('✅ Pressed Tab key');

    await actions.pressSequence(['Control+a', 'Delete']);
    console.log('✅ Pressed key sequence (Ctrl+A, Delete)');

    // ========== ADVANCED ACTIONS ==========
    console.log('\n🔧 Testing advanced actions...');
    
    // Execute custom JavaScript
    const pageTitle = await actions.executeScript(() => document.title);
    console.log(`📄 Page title via JS: ${pageTitle}`);

    const windowSize = await actions.executeScript(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }));
    console.log(`📐 Window size: ${windowSize.width}x${windowSize.height}`);

    // ========== SCREENSHOT TESTING ==========
    console.log('\n📸 Taking final screenshots...');
    
    await actions.screenshot({ path: 'screenshots/form-page.png' });
    console.log('✅ Full page screenshot saved');

    // Take element screenshot if form exists
    const formElement = 'form';
    if (await actions.isVisible(formElement)) {
      await actions.screenshotElement(formElement, { path: 'screenshots/form-element.png' });
      console.log('✅ Form element screenshot saved');
    }

    // ========== NAVIGATION TESTING ==========
    console.log('\n🧭 Testing navigation actions...');
    
    await actions.refresh();
    await actions.waitForLoad();
    console.log('✅ Page refreshed');

    console.log('\n🎉 All browser actions tested successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up
    await browser.close();
    console.log('\n🧹 Browser closed');
  }
}

// Create screenshots directory if it doesn't exist
import * as fs from 'fs';
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run the test
testBrowserActions().catch(console.error); 