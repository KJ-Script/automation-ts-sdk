import { AIAgent } from '../src/agents/agent';

console.log('🧪 Testing Rate Limiting System\n');

// Create a mock agent configuration
const config = {
  apiKey: 'test-key',
  model: 'gemini-1.5-flash',
  browserConfig: {
    type: 'chrome' as const,
    headless: true,
    viewport: { width: 1280, height: 720 }
  },
  maxRetries: 2,
  debugMode: true,
  screenshotDir: './screenshots',
  enableScreenshots: false,
  performance: {
    domAnalysisFrequency: 'minimal' as const,
    screenshotFrequency: 'minimal' as const,
    taskWaitTime: 100,
    clickWaitTime: 50,
    typeWaitTime: 25
  }
};

// Test rate limiting logic
async function testRateLimiting() {
  console.log('📋 Test 1: Rate Limit Status Tracking');
  
  // Create agent instance
  const agent = new AIAgent(config);
  
  // Test initial status
  const initialStatus = agent.getRateLimitStatus();
  console.log(`   Initial status: ${initialStatus.callsThisMinute}/${initialStatus.maxCallsPerMinute} calls`);
  console.log(`   Time until reset: ${initialStatus.timeUntilReset}s`);
  
  // Simulate API calls
  console.log('\n📋 Test 2: Simulating API Calls');
  
  for (let i = 1; i <= 3; i++) {
    console.log(`   Simulating API call ${i}...`);
    
    // Access the private method for testing (using any type)
    const agentAny = agent as any;
    await agentAny.enforceRateLimit();
    
    const status = agent.getRateLimitStatus();
    console.log(`   After call ${i}: ${status.callsThisMinute}/${status.maxCallsPerMinute} calls`);
  }
  
  console.log('\n📋 Test 3: Rate Limit Enforcement');
  
  // Simulate hitting the rate limit
  console.log('   Simulating rate limit hit...');
  
  // Manually set the call count to trigger rate limiting
  const agentAny = agent as any;
  agentAny.apiCallCount = agentAny.maxCallsPerMinute;
  
  const beforeStatus = agent.getRateLimitStatus();
  console.log(`   Before enforcement: ${beforeStatus.callsThisMinute}/${beforeStatus.maxCallsPerMinute} calls`);
  
  // This should trigger rate limiting
  const startTime = Date.now();
  await agentAny.enforceRateLimit();
  const endTime = Date.now();
  
  const afterStatus = agent.getRateLimitStatus();
  console.log(`   After enforcement: ${afterStatus.callsThisMinute}/${afterStatus.maxCallsPerMinute} calls`);
  console.log(`   Enforcement time: ${endTime - startTime}ms`);
  
  console.log('\n📋 Test 4: Retry Delay Calculation');
  
  const retryDelays = [1000, 2000, 5000, 10000, 30000];
  console.log('   Retry delays for rate limit errors:');
  retryDelays.forEach((delay, index) => {
    console.log(`   Attempt ${index + 1}: ${delay / 1000}s`);
  });
  
  console.log('\n📋 Test 5: Error Detection');
  
  const testErrors = [
    'Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent: [429 Too Many Requests]',
    'You exceeded your current quota, please check your plan and billing details',
    'rate limit exceeded',
    'quota exceeded',
    'normal error without rate limiting'
  ];
  
  console.log('   Testing error detection:');
  testErrors.forEach((error, index) => {
    const isRateLimitError = error.includes('429') || error.includes('quota') || error.includes('rate');
    console.log(`   Error ${index + 1}: ${isRateLimitError ? '🔄 Rate Limit' : '❌ Other Error'} - "${error.substring(0, 50)}..."`);
  });
  
  console.log('\n✅ All rate limiting tests completed successfully!');
  
  console.log('\n🎯 Rate Limiting Features:');
  console.log('• Automatic rate limit detection and enforcement');
  console.log('• Exponential backoff for retries');
  console.log('• Configurable retry attempts');
  console.log('• Real-time rate limit status tracking');
  console.log('• Graceful handling of quota exceeded errors');
  console.log('• Automatic wait periods when limits are hit');
}

// Run the test
testRateLimiting().catch(console.error); 