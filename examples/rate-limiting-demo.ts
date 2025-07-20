import { AIAgent } from '../src/agents/agent';

// Configuration for the demo
const config = {
  apiKey: process.env.GOOGLE_API_KEY || 'your-api-key-here',
  model: 'gemini-1.5-flash',
  browserConfig: {
    type: 'chrome' as const,
    headless: true, // Use headless for demo
    viewport: { width: 1280, height: 720 }
  },
  maxRetries: 3,
  debugMode: true,
  screenshotDir: './screenshots',
  enableScreenshots: false, // Disable screenshots for demo
  performance: {
    domAnalysisFrequency: 'minimal' as const,
    screenshotFrequency: 'minimal' as const,
    taskWaitTime: 500,
    clickWaitTime: 200,
    typeWaitTime: 100
  }
};

async function demoRateLimiting() {
  console.log('🚀 Rate Limiting and Retry System Demo\n');
  
  // Create AI Agent
  const agent = new AIAgent(config);
  
  try {
    // Initialize browser
    await agent.execute('Navigate to https://example.com');
    
    console.log('📊 Initial Rate Limit Status:');
    const initialStatus = agent.getRateLimitStatus();
    console.log(`   Calls this minute: ${initialStatus.callsThisMinute}`);
    console.log(`   Max calls per minute: ${initialStatus.maxCallsPerMinute}`);
    console.log(`   Time until reset: ${initialStatus.timeUntilReset}s\n`);
    
    // Simulate multiple API calls to demonstrate rate limiting
    console.log('🔄 Simulating multiple API calls...\n');
    
    const testPromises = [];
    for (let i = 1; i <= 5; i++) {
      testPromises.push(
        (async () => {
          console.log(`📞 Making API call ${i}...`);
          const startTime = Date.now();
          
          try {
            // This will trigger rate limiting after a few calls
            await agent.execute(`Take a screenshot and analyze the page content for call ${i}`);
            
            const endTime = Date.now();
            console.log(`✅ API call ${i} completed in ${endTime - startTime}ms`);
            
            // Show rate limit status after each call
            const status = agent.getRateLimitStatus();
            console.log(`   Rate limit status: ${status.callsThisMinute}/${status.maxCallsPerMinute} calls`);
            
          } catch (error) {
            const endTime = Date.now();
            console.log(`❌ API call ${i} failed after ${endTime - startTime}ms: ${error}`);
          }
        })()
      );
      
      // Add small delay between calls
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Wait for all calls to complete
    await Promise.all(testPromises);
    
    console.log('\n📊 Final Rate Limit Status:');
    const finalStatus = agent.getRateLimitStatus();
    console.log(`   Calls this minute: ${finalStatus.callsThisMinute}`);
    console.log(`   Max calls per minute: ${finalStatus.maxCallsPerMinute}`);
    console.log(`   Time until reset: ${finalStatus.timeUntilReset}s`);
    
    console.log('\n✅ Rate limiting demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Cleanup
    await agent.cleanup();
  }
}

// Run the demo
if (require.main === module) {
  demoRateLimiting().catch(console.error);
}

export { demoRateLimiting }; 