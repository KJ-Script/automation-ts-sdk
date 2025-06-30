import { AutomationBrowser } from '../src/browser/AutomationBrowser';

async function example() {
  // Example 1: Chrome browser in headful mode
  const chromeHeadful = new AutomationBrowser({
    type: 'chrome',
    headless: false,
    viewport: { width: 1920, height: 1080 }
  });

  await chromeHeadful.launch();
  const page1 = await chromeHeadful.goto('https://example.com');
  console.log('Chrome headful page title:', await page1.title());
  await chromeHeadful.close();

  // Example 2: Firefox browser in headless mode
  const firefoxHeadless = new AutomationBrowser({
    type: 'firefox',
    headless: true
  });

  await firefoxHeadless.launch();
  const page2 = await firefoxHeadless.goto('https://google.com');
  console.log('Firefox headless page title:', await page2.title());
  await firefoxHeadless.close();

  // Example 3: Safari browser with custom user agent
  const safariCustom = new AutomationBrowser({
    type: 'safari',
    headless: false,
    userAgent: 'Custom User Agent String',
    timeout: 60000
  });

  await safariCustom.launch();
  const page3 = await safariCustom.newPage();
  await page3.goto('https://httpbin.org/user-agent');
  console.log('Safari custom user agent:', await page3.textContent('body'));
  await safariCustom.close();
}

// Run the example
example().catch(console.error); 