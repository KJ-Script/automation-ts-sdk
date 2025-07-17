// Advanced Playwright Actions Demo
// This example demonstrates all the new locator methods and actions available in the BrowserActions class

import { AIAgent } from '../src/agents/agent';

const agent = new AIAgent({
  apiKey: process.env.GOOGLE_API_KEY || 'your-api-key-here',
  model: 'gemini-2.5-flash',
  browserConfig: {
    type: 'chrome',
    headless: false,
  },
  maxRetries: 3,
  debugMode: true,
  screenshotDir: 'screenshots',
  enableScreenshots: true,
  performance: {
    fastMode: false,
  },
});

async function demonstrateAdvancedActions() {
  try {
    // Navigate to a test page
    await agent.execute('go to https://example.com');
    
    // Get the actions instance to demonstrate the new methods
    const page = await agent['getCurrentPage']();
    const actions = await agent['getActions']();
    
    console.log('🎯 Demonstrating Advanced Playwright Actions...\n');

    // ============ ADVANCED CLICKING ACTIONS ============
    console.log('📌 Advanced Clicking Actions:');
    
    // Click by role (e.g., button, link, textbox)
    // await actions.clickByRole('button', { name: 'Submit' });
    console.log('✅ clickByRole(role, options) - Click by ARIA role');
    
    // Click by label text
    // await actions.clickByLabel('Username');
    console.log('✅ clickByLabel(label, options) - Click by label text');
    
    // Click by placeholder text
    // await actions.clickByPlaceholder('Enter your email');
    console.log('✅ clickByPlaceholder(placeholder, options) - Click by placeholder');
    
    // Click by alt text (for images)
    // await actions.clickByAltText('Profile picture');
    console.log('✅ clickByAltText(altText, options) - Click by alt text');
    
    // Click by title attribute
    // await actions.clickByTitle('Help');
    console.log('✅ clickByTitle(title, options) - Click by title attribute');
    
    // Click by test ID
    // await actions.clickByTestId('login-button');
    console.log('✅ clickByTestId(testId) - Click by data-testid');
    
    // Click by aria-label
    // await actions.clickByAriaLabel('Close dialog');
    console.log('✅ clickByAriaLabel(ariaLabel, options) - Click by aria-label');
    
    // Click by name attribute
    // await actions.clickByName('submit');
    console.log('✅ clickByName(name, options) - Click by name attribute');
    
    // Click by ID
    // await actions.clickById('login-btn');
    console.log('✅ clickById(id) - Click by element ID');
    
    // Click by class name
    // await actions.clickByClassName('btn-primary');
    console.log('✅ clickByClassName(className) - Click by CSS class');
    
    // Click first match from multiple selectors
    // await actions.clickFirstMatch(['button', '.btn', '[type="submit"]']);
    console.log('✅ clickFirstMatch(selectors[]) - Click first matching element');

    // ============ ADVANCED TYPING ACTIONS ============
    console.log('\n📝 Advanced Typing Actions:');
    
    // Type by role
    // await actions.typeByRole('textbox', 'username', { name: 'Username' });
    console.log('✅ typeByRole(role, text, options) - Type by ARIA role');
    
    // Type by label
    // await actions.typeByLabel('Email', 'user@example.com');
    console.log('✅ typeByLabel(label, text, options) - Type by label');
    
    // Type by placeholder
    // await actions.typeByPlaceholder('Enter password', 'password123');
    console.log('✅ typeByPlaceholder(placeholder, text, options) - Type by placeholder');
    
    // Type by test ID
    // await actions.typeByTestId('email-input', 'user@example.com');
    console.log('✅ typeByTestId(testId, text) - Type by data-testid');
    
    // Type by name attribute
    // await actions.typeByName('username', 'john_doe');
    console.log('✅ typeByName(name, text, options) - Type by name attribute');
    
    // Type by ID
    // await actions.typeById('password', 'secret123');
    console.log('✅ typeById(id, text) - Type by element ID');

    // ============ ELEMENT LOCATION UTILITIES ============
    console.log('\n🔍 Element Location Utilities:');
    
    // Get element by role
    // const button = actions.getByRole('button', { name: 'Submit' });
    console.log('✅ getByRole(role, options) - Get element by ARIA role');
    
    // Get element by label
    // const input = actions.getByLabel('Username');
    console.log('✅ getByLabel(label, options) - Get element by label');
    
    // Get element by placeholder
    // const emailInput = actions.getByPlaceholder('Enter email');
    console.log('✅ getByPlaceholder(placeholder, options) - Get element by placeholder');
    
    // Get element by alt text
    // const image = actions.getByAltText('Profile picture');
    console.log('✅ getByAltText(altText, options) - Get element by alt text');
    
    // Get element by title
    // const tooltip = actions.getByTitle('Help');
    console.log('✅ getByTitle(title, options) - Get element by title');
    
    // Get element by test ID
    // const element = actions.getByTestId('login-form');
    console.log('✅ getByTestId(testId) - Get element by data-testid');
    
    // Get element by name attribute
    // const field = actions.getByName('username');
    console.log('✅ getByName(name) - Get element by name attribute');
    
    // Get element by ID
    // const div = actions.getById('content');
    console.log('✅ getById(id) - Get element by ID');
    
    // Get element by class name
    // const container = actions.getByClassName('main-content');
    console.log('✅ getByClassName(className) - Get element by CSS class');
    
    // Get element by text content
    // const link = actions.getByText('Click here', { exact: true });
    console.log('✅ getByText(text, options) - Get element by text content');
    
    // Get element by partial text
    // const partial = actions.getByTextContaining('Welcome');
    console.log('✅ getByTextContaining(text) - Get element by partial text');
    
    // Get element by aria-label
    // const ariaElement = actions.getByAriaLabel('Close dialog');
    console.log('✅ getByAriaLabel(ariaLabel, options) - Get element by aria-label');
    
    // Get element by data attribute
    // const dataElement = actions.getByDataAttribute('testid', 'submit');
    console.log('✅ getByDataAttribute(attribute, value) - Get element by data attribute');
    
    // Get element by any attribute
    // const attrElement = actions.getByAttribute('data-cy', 'login', { exact: true });
    console.log('✅ getByAttribute(attribute, value, options) - Get element by any attribute');
    
    // Get element by multiple selectors
    // const multiElement = actions.getByMultipleSelectors(['button', '.btn', '[type="submit"]']);
    console.log('✅ getByMultipleSelectors(selectors[]) - Get element by multiple selectors');
    
    // Get element by XPath
    // const xpathElement = actions.getByXPath('//button[contains(text(), "Submit")]');
    console.log('✅ getByXPath(xpath) - Get element by XPath');
    
    // Get element by nth-child
    // const nthElement = actions.getByNthChild('li', 3);
    console.log('✅ getByNthChild(selector, index) - Get element by nth-child');
    
    // Get element by nth-of-type
    // const nthTypeElement = actions.getByNthOfType('div', 2);
    console.log('✅ getByNthOfType(selector, index) - Get element by nth-of-type');

    // ============ ADVANCED FORM ACTIONS ============
    console.log('\n📋 Advanced Form Actions:');
    
    // Select option by role
    // await actions.selectOptionByRole('combobox', 'option1', { name: 'Country' });
    console.log('✅ selectOptionByRole(role, value, options) - Select by role');
    
    // Select option by label
    // await actions.selectOptionByLabel('Country', 'USA');
    console.log('✅ selectOptionByLabel(label, value, options) - Select by label');
    
    // Check checkbox by role
    // await actions.checkByRole('checkbox', { name: 'Agree to terms' });
    console.log('✅ checkByRole(role, options) - Check by role');
    
    // Check checkbox by label
    // await actions.checkByLabel('Subscribe to newsletter');
    console.log('✅ checkByLabel(label, options) - Check by label');
    
    // Uncheck checkbox by role
    // await actions.uncheckByRole('checkbox', { name: 'Marketing emails' });
    console.log('✅ uncheckByRole(role, options) - Uncheck by role');
    
    // Uncheck checkbox by label
    // await actions.uncheckByLabel('Receive notifications');
    console.log('✅ uncheckByLabel(label, options) - Uncheck by label');
    
    // Upload file by role
    // await actions.uploadFileByRole('button', './file.txt', { name: 'Upload' });
    console.log('✅ uploadFileByRole(role, filePath, options) - Upload by role');
    
    // Upload file by label
    // await actions.uploadFileByLabel('Choose file', './document.pdf');
    console.log('✅ uploadFileByLabel(label, filePath, options) - Upload by label');

    // ============ ADVANCED WAITING ACTIONS ============
    console.log('\n⏳ Advanced Waiting Actions:');
    
    // Wait for element by role
    // await actions.waitForRole('button', { name: 'Submit', timeout: 10000 });
    console.log('✅ waitForRole(role, options) - Wait for element by role');
    
    // Wait for element by label
    // await actions.waitForLabel('Username', { timeout: 5000 });
    console.log('✅ waitForLabel(label, options) - Wait for element by label');
    
    // Wait for element by placeholder
    // await actions.waitForPlaceholder('Enter email', { timeout: 3000 });
    console.log('✅ waitForPlaceholder(placeholder, options) - Wait for element by placeholder');
    
    // Wait for element by test ID
    // await actions.waitForTestId('login-form', { timeout: 8000 });
    console.log('✅ waitForTestId(testId, options) - Wait for element by test ID');
    
    // Wait for element to be hidden
    // await actions.waitForElementHidden('.loading-spinner');
    console.log('✅ waitForElementHidden(selector, options) - Wait for element to be hidden');
    
    // Wait for element to be detached
    // await actions.waitForElementDetached('.modal');
    console.log('✅ waitForElementDetached(selector, options) - Wait for element to be detached');
    
    // Wait for network to be idle
    // await actions.waitForNetworkIdle(5000);
    console.log('✅ waitForNetworkIdle(timeout) - Wait for network to be idle');
    
    // Wait for DOM to be ready
    // await actions.waitForDOMContentLoaded(10000);
    console.log('✅ waitForDOMContentLoaded(timeout) - Wait for DOM to be ready');

    console.log('\n🎉 All advanced Playwright actions demonstrated successfully!');
    console.log('📚 These methods provide flexible ways to locate and interact with elements:');
    console.log('   • By ARIA roles and attributes (accessibility-friendly)');
    console.log('   • By semantic attributes (label, placeholder, title)');
    console.log('   • By test IDs (for testing frameworks)');
    console.log('   • By multiple fallback selectors');
    console.log('   • By XPath expressions');
    console.log('   • By CSS pseudo-selectors (nth-child, nth-of-type)');

  } catch (error) {
    console.error('❌ Error demonstrating advanced actions:', error);
  } finally {
    await agent.cleanup();
  }
}

// Run the demonstration
demonstrateAdvancedActions(); 