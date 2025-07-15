const { AIAgent } = require('./dist/src');

async function testSessionPersistence() {
  console.log('Testing Session Persistence...\n');

  const agent = new AIAgent({
    apiKey: process.env.GOOGLE_AI_API_KEY || 'test-key',
    browserConfig: {
      type: 'chrome',
      headless: true,
      session: {
        enabled: true,
        sessionDir: './test-sessions',
        persistCookies: true,
        persistLocalStorage: true,
        persistSessionStorage: true
      }
    },
    sessionName: 'test-session',
    debugMode: true
  });

  try {
    console.log('1. Initial session list:', agent.listSessions());
    
    console.log('2. Session management enabled:', agent.isSessionManagementEnabled());
    
    console.log('3. Creating test session...');
    await agent.execute('Navigate to https://example.com');
    await agent.saveSession('test-session');
    
    console.log('4. Session created. Session list:', agent.listSessions());
    
    console.log('5. Session exists check:', agent.sessionExists('test-session'));
    
    const sessionInfo = agent.getSessionInfo('test-session');
    console.log('6. Session info:', {
      timestamp: sessionInfo?.timestamp,
      cookies: sessionInfo?.cookies?.length || 0,
      localStorage: Object.keys(sessionInfo?.localStorage || {}).length,
      sessionStorage: Object.keys(sessionInfo?.sessionStorage || {}).length
    });
    
    console.log('7. Current session name:', agent.getCurrentSessionName());
    
    console.log('8. Deleting test session...');
    const deleted = agent.deleteSession('test-session');
    console.log('Session deleted:', deleted);
    
    console.log('9. Final session list:', agent.listSessions());
    
    console.log('\n✅ Session persistence test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await agent.cleanup();
  }
}

testSessionPersistence().catch(console.error); 