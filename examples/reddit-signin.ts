import { AutomationBrowser, BrowserActions } from '../src/index';

// Helper function to generate random username and password
function generateRandomCredentials() {
  const adjectives = ['Cool', 'Smart', 'Fast', 'Bright', 'Happy', 'Lucky', 'Bold', 'Swift'];
  const nouns = ['Tiger', 'Eagle', 'Wolf', 'Dragon', 'Phoenix', 'Lion', 'Shark', 'Bear'];
  const numbers = Math.floor(Math.random() * 9999);
  
  const username = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${numbers}`;
  const password = `TempPass${Math.floor(Math.random() * 999999)}!`;
  
  return { username, password };
}

async function redditSignInAutomation() {
  console.log('🔑 Reddit Sign-In Automation Demo\n');

  const browser = new AutomationBrowser({
    type: 'chrome',
    headless: false, // Set to true for background execution
    viewport: { width: 1400, height: 900 }
  });

  let actions: BrowserActions | undefined;

  try {
    // Step 1: Launch browser and navigate to Reddit
    await browser.launch();
    console.log('✅ Browser launched');

    console.log('🌐 Navigating to Reddit...');
    const page = await browser.goto('https://www.reddit.com');
    actions = new BrowserActions(page);

    // Wait for page to load with more generous timeout
    try {
      // Use domcontentloaded instead of networkidle for faster, more reliable loading
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      console.log('✅ Reddit homepage loaded');
    } catch (error) {
      console.log('⚠️ Page load timeout, but continuing anyway...');
    }
    
    // Give Reddit a moment to render
    await actions.wait(2000);

    // Take initial screenshot
    await actions.screenshot({ path: 'reddit-homepage.png' });
    console.log('📸 Homepage screenshot taken');

    // Step 2: Look for sign-in button
    console.log('\n🔍 Looking for sign-in button...');
    
    // Reddit has multiple possible selectors for login button
    const loginSelectors = [
      'a[href*="login"]',           // Direct login link
      'button[data-testid*="login"]', // Test ID based button
      'button:has-text("Log In")',   // Button with "Log In" text
      'a:has-text("Log In")',        // Link with "Log In" text
      '[data-click-id="login"]',     // Data click ID
      'button[data-click-id="login"]' // Button with data click ID
    ];

    let loginFound = false;
    let usedSelector = '';

    // Try each selector until we find one that works
    for (const selector of loginSelectors) {
      try {
        await actions.waitForElement(selector, { timeout: 3000 });
        if (await actions.isVisible(selector)) {
          usedSelector = selector;
          loginFound = true;
          console.log(`✅ Found sign-in button with selector: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ Selector ${selector} not found, trying next...`);
      }
    }

    if (!loginFound) {
      console.log('❌ Could not find sign-in button, trying alternative approach...');
      
      // Alternative: Look for any element containing "login" or "sign in" text
      try {
        const loginElements = await actions.executeScript(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements
            .filter(el => el.textContent && 
              (el.textContent.toLowerCase().includes('log in') || 
               el.textContent.toLowerCase().includes('sign in')))
            .map(el => ({
              tagName: el.tagName,
              text: el.textContent,
              id: el.id,
              className: el.className
            }));
        });
        
        console.log('🔍 Found elements with login text:', loginElements);
        
        if (loginElements.length > 0) {
          // Try to click on the first login-related element
          usedSelector = 'a[href*="login"], button:has-text("Log In"), a:has-text("Log In")';
          loginFound = true;
        }
      } catch (error) {
        console.log('❌ Alternative approach failed');
      }
    }

    if (!loginFound) {
      throw new Error('Could not find any sign-in button on Reddit');
    }

    // Step 3: Click the sign-in button
    console.log('\n🖱️ Clicking sign-in button...');
    await actions.click(usedSelector);
    console.log('✅ Sign-in button clicked');

    // Wait for login page to load
    await actions.wait(3000);
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    } catch (error) {
      console.log('⚠️ Login page load timeout, continuing...');
    }
    console.log('✅ Login page loaded');

    // Take screenshot of login page
    await actions.screenshot({ path: 'reddit-login-page.png' });
    console.log('📸 Login page screenshot taken');

    // Step 4: Generate random credentials
    const credentials = generateRandomCredentials();
    console.log(`\n👤 Generated credentials:`);
    console.log(`   Username: ${credentials.username}`);
    console.log(`   Password: ${credentials.password}`);

    // Step 5: Fill in username and password
    console.log('\n⌨️ Filling in login form...');

    // Try different selectors for username field
    const usernameSelectors = [
      'input[name="username"]',
      'input[id*="username"]',
      'input[placeholder*="username"]',
      'input[type="text"]:first-of-type',
      'input[data-testid*="username"]'
    ];

    let usernameFieldFound = false;
    for (const selector of usernameSelectors) {
      try {
        await actions.waitForElement(selector, { timeout: 3000 });
        if (await actions.isVisible(selector)) {
          await actions.type(selector, credentials.username, { clear: true });
          console.log('✅ Username entered');
          usernameFieldFound = true;
          break;
        }
      } catch (error) {
        console.log(`⚠️ Username selector ${selector} not found, trying next...`);
      }
    }

    if (!usernameFieldFound) {
      console.log('❌ Could not find username field');
    }

    // Try different selectors for password field
    const passwordSelectors = [
      'input[name="password"]',
      'input[id*="password"]',
      'input[type="password"]',
      'input[placeholder*="password"]',
      'input[data-testid*="password"]'
    ];

    let passwordFieldFound = false;
    for (const selector of passwordSelectors) {
      try {
        await actions.waitForElement(selector, { timeout: 3000 });
        if (await actions.isVisible(selector)) {
          await actions.type(selector, credentials.password, { clear: true });
          console.log('✅ Password entered');
          passwordFieldFound = true;
          break;
        }
      } catch (error) {
        console.log(`⚠️ Password selector ${selector} not found, trying next...`);
      }
    }

    if (!passwordFieldFound) {
      console.log('❌ Could not find password field');
    }

    // Step 6: Click the sign-in button on the login form
    console.log('\n🔐 Attempting to sign in...');
    
    // Wait a moment for form validation
    await actions.wait(1000);

    // Try different selectors for the login submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Log In")',
      'button:has-text("Sign In")',
      'input[type="submit"]',
      'button[data-testid*="login"]',
      'button[data-testid*="submit"]'
    ];

    let submitButtonFound = false;
    for (const selector of submitSelectors) {
      try {
        await actions.waitForElement(selector, { timeout: 3000 });
        if (await actions.isVisible(selector) && await actions.isEnabled(selector)) {
          await actions.click(selector);
          console.log('✅ Sign-in button clicked');
          submitButtonFound = true;
          break;
        }
      } catch (error) {
        console.log(`⚠️ Submit selector ${selector} not found or not clickable, trying next...`);
      }
    }

    if (!submitButtonFound) {
      console.log('❌ Could not find or click sign-in submit button');
      // Try pressing Enter as alternative
      console.log('🔄 Trying to press Enter instead...');
      await actions.press('Enter');
    }

    // Step 7: Wait for response and handle result
    console.log('\n⏳ Waiting for sign-in response...');
    await actions.wait(3000);

    // Take screenshot of result
    await actions.screenshot({ path: 'reddit-signin-result.png' });
    console.log('📸 Sign-in result screenshot taken');

    // Check if we got any error messages
    const errorSelectors = [
      '[data-testid*="error"]',
      '.error',
      '[class*="error"]',
      '[class*="Error"]',
      'div:has-text("incorrect")',
      'div:has-text("invalid")',
      'div:has-text("error")'
    ];

    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        if (await actions.isVisible(selector)) {
          const errorText = await actions.getText(selector);
          console.log(`⚠️ Error message found: "${errorText}"`);
          errorFound = true;
          break;
        }
      } catch (error) {
        // Error element not found, continue
      }
    }

    if (!errorFound) {
      console.log('ℹ️ No obvious error messages detected');
    }

    // Check current URL to see if we're still on login page
    const currentUrl = await actions.executeScript(() => window.location.href);
    console.log(`📍 Current URL: ${currentUrl}`);

    if (currentUrl.includes('login')) {
      console.log('ℹ️ Still on login page - credentials were likely rejected (expected for random credentials)');
    } else {
      console.log('✅ Navigated away from login page - sign-in might have been successful');
    }

    console.log('\n🎉 Reddit sign-in automation completed!');
    console.log('📝 Note: Random credentials were used, so actual login failure is expected');
    console.log('💡 Check the screenshots to see the automation in action');

  } catch (error) {
    console.error('❌ Reddit sign-in automation failed:', error);
    
    // Take error screenshot if actions is available
    if (actions) {
      try {
        await actions.screenshot({ path: 'reddit-error.png' });
        console.log('📸 Error screenshot taken');
      } catch (screenshotError) {
        console.log('Could not take error screenshot');
      }
    }
  } finally {
    // Clean up
    console.log('\n⏳ Cleaning up in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
    console.log('🧹 Browser closed');
  }
}

// Run the automation
redditSignInAutomation().catch(console.error); 