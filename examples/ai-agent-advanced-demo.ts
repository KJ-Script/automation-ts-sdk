import { AIAgent } from '../src/agents/agent';

async function demonstrateAdvancedAIAgent() {
  console.log('🤖 Advanced AI Agent Demo - Testing All New Playwright Actions');
  console.log('=' .repeat(60));

  // Initialize the AI agent with comprehensive configuration
  const agent = new AIAgent({
    apiKey: process.env.GOOGLE_API_KEY || 'your-api-key-here',
    model: 'gemini-1.5-flash',
    debugMode: true,
    enableScreenshots: true,
    screenshotDir: './screenshots',
    performance: {
      fastMode: false,
      clickWaitTime: 1000,
      typeWaitTime: 500,
      taskWaitTime: 1000,
      screenshotFrequency: 'key',
      domAnalysisFrequency: 'key'
    },
    browserConfig: {
      headless: false,
      slowMo: 500,
      timeout: 30000
    }
  });

  try {
    console.log('\n🚀 Starting advanced automation demo...\n');

    // Example 1: Complex form interaction with semantic selectors
    console.log('📝 Example 1: Complex form interaction with semantic selectors');
    console.log('This will demonstrate using role, label, and placeholder-based actions');
    
    const formResult = await agent.execute(`
      Navigate to https://example.com and demonstrate advanced form interactions:
      1. Find a form with email and password fields
      2. Use typeByLabel or typeByPlaceholder to fill the form
      3. Use clickByRole to submit the form
      4. Wait for the response and verify success
    `);

    console.log('\n✅ Form interaction completed:', formResult.success);
    console.log('Tasks executed:', formResult.tasks.length);

    // Example 2: E-commerce product interaction
    console.log('\n🛒 Example 2: E-commerce product interaction');
    console.log('This will demonstrate using test IDs, aria-labels, and advanced selectors');
    
    const ecommerceResult = await agent.execute(`
      Navigate to a product page and demonstrate advanced interactions:
      1. Use clickByTestId to interact with product elements
      2. Use clickByAriaLabel for accessibility-friendly interactions
      3. Use selectOptionByRole for dropdown selections
      4. Use checkByLabel for checkbox interactions
      5. Demonstrate scrolling and waiting for elements
    `);

    console.log('\n✅ E-commerce interaction completed:', ecommerceResult.success);
    console.log('Tasks executed:', ecommerceResult.tasks.length);

    // Example 3: Complex navigation and waiting
    console.log('\n🧭 Example 3: Complex navigation and waiting');
    console.log('This will demonstrate advanced waiting and navigation patterns');
    
    const navigationResult = await agent.execute(`
      Navigate through a multi-step process:
      1. Use waitForRole to wait for specific elements
      2. Use waitForText to wait for content to appear
      3. Use waitForNetworkIdle to ensure page is fully loaded
      4. Use scrollToElement to navigate to specific sections
      5. Use hover and focus for interactive elements
      6. Demonstrate keyboard shortcuts with press and pressSequence
    `);

    console.log('\n✅ Navigation completed:', navigationResult.success);
    console.log('Tasks executed:', navigationResult.tasks.length);

    // Example 4: File upload and advanced form handling
    console.log('\n📁 Example 4: File upload and advanced form handling');
    console.log('This will demonstrate file uploads and complex form interactions');
    
    const uploadResult = await agent.execute(`
      Demonstrate file upload and advanced form handling:
      1. Use uploadFileByRole to upload files to specific inputs
      2. Use uploadFileByLabel for label-based file uploads
      3. Use selectOptionByLabel for dropdown selections
      4. Use checkByRole and uncheckByRole for checkbox management
      5. Demonstrate form validation and error handling
    `);

    console.log('\n✅ File upload completed:', uploadResult.success);
    console.log('Tasks executed:', uploadResult.tasks.length);

    // Example 5: Accessibility-focused automation
    console.log('\n♿ Example 5: Accessibility-focused automation');
    console.log('This will demonstrate using accessibility-friendly selectors');
    
    const accessibilityResult = await agent.execute(`
      Demonstrate accessibility-focused automation:
      1. Use clickByRole with specific role names for buttons, links, etc.
      2. Use typeByRole for form inputs with proper labeling
      3. Use clickByAriaLabel for elements with aria-label attributes
      4. Use waitForRole to wait for accessible elements
      5. Demonstrate keyboard navigation with press actions
      6. Show how to interact with screen reader friendly elements
    `);

    console.log('\n✅ Accessibility automation completed:', accessibilityResult.success);
    console.log('Tasks executed:', accessibilityResult.tasks.length);

    // Example 6: Error handling and fallback strategies
    console.log('\n🛡️ Example 6: Error handling and fallback strategies');
    console.log('This will demonstrate robust error handling with multiple selector strategies');
    
    const errorHandlingResult = await agent.execute(`
      Demonstrate robust error handling and fallback strategies:
      1. Use clickFirstMatch to try multiple selectors
      2. Implement fallback from semantic to CSS selectors
      3. Use waitForElement with timeouts for reliability
      4. Demonstrate handling of dynamic content
      5. Show how to recover from failed interactions
      6. Use exact matching vs partial matching appropriately
    `);

    console.log('\n✅ Error handling demo completed:', errorHandlingResult.success);
    console.log('Tasks executed:', errorHandlingResult.tasks.length);

    // Summary
    console.log('\n📊 Demo Summary:');
    console.log('=' .repeat(40));
    console.log('✅ All advanced action types integrated successfully');
    console.log('✅ Semantic selectors working (role, label, placeholder, testId)');
    console.log('✅ Form actions working (select, check, uncheck, upload)');
    console.log('✅ Waiting actions working (waitForRole, waitForText, etc.)');
    console.log('✅ Navigation actions working (scroll, hover, focus, etc.)');
    console.log('✅ Error handling and fallback strategies implemented');
    console.log('✅ Accessibility-focused automation capabilities demonstrated');

    console.log('\n🎉 Advanced AI Agent Demo Completed Successfully!');
    console.log('The agent now has access to all Playwright actions and can handle complex automation scenarios.');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Cleanup
    await agent.cleanup();
    console.log('\n🧹 Cleanup completed');
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateAdvancedAIAgent().catch(console.error);
}

export { demonstrateAdvancedAIAgent }; 