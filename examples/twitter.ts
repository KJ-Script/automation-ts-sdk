// this example is to sign in to twitter and post a tweet
import { AIAgent } from '../src/agents/agent';
const user = 'ketiyohannes';
const password = 'theHolyBible@Heaven';

const agent = new AIAgent({
  apiKey: process.env.GOOGLE_API_KEY || 'AIzaSyBaQJO-gmZOeAvSRXFvcx3rr8eBuQT1458',
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



try {
  const response = await agent.execute(`go to instagram and sign in as ${user} with password ${password}`);
  console.log(response);
} catch (error) {
  console.error(error);
} finally {
  await agent.cleanup();
}