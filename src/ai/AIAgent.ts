import { GoogleGenerativeAI } from '@google/generative-ai';
import { AutomationBrowser, BrowserType, BrowserConfig } from '../browser/AutomationBrowser';
import { BrowserActions } from '../browser/actions/BrowserActions';
import { DomExtractor } from '../dom/DomExtractor';
import { DataExtractor } from '../dom/DataExtractor';
import { Page } from 'playwright';
import { CLIENT_RENEG_LIMIT } from 'tls';
import * as fs from 'fs';
import * as path from 'path';

export interface Task {
  id: string;
  description: string;
  type: 'navigate' | 'click' | 'clickByText' | 'type' | 'extract' | 'analyze' | 'wait' | 'custom';
  selector?: string;
  text?: string;
  clickText?: string;
  url?: string;
  completed: boolean;
  result?: any;
  screenshots?: {
    after?: string;
  };
}

export interface PerformanceConfig {
  fastMode?: boolean;                    // Enables fast mode with reduced waits and analysis
  clickWaitTime?: number;               // Wait time after clicks (default: 1500ms)
  typeWaitTime?: number;                // Wait time after typing (default: 500ms)
  taskWaitTime?: number;                // Wait time between tasks (default: 1000ms)
  pageLoadTimeout?: number;             // Page load timeout (default: 30000ms)
  actionTimeout?: number;               // Action timeout (default: 10000ms)
  screenshotFrequency?: 'all' | 'key' | 'minimal'; // Screenshot frequency
  domAnalysisFrequency?: 'all' | 'key' | 'minimal'; // DOM analysis frequency
  skipFullPageLoad?: boolean;           // Skip waiting for full page load, just wait for DOM
}

export interface AgentConfig {
  apiKey: string;
  model?: string;
  browserConfig?: Partial<BrowserConfig>;
  maxRetries?: number;
  debugMode?: boolean;
  screenshotDir?: string;
  enableScreenshots?: boolean;
  performance?: PerformanceConfig;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  tasks: Task[];
  finalResult?: any;
  screenshots?: string[];
}

export class AIAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private browser: AutomationBrowser | null = null;
  private currentPage: Page | null = null;
  private actions: BrowserActions | null = null;
  protected domExtractor: DomExtractor | null = null;
  protected dataExtractor: DataExtractor | null = null;
  private config: {
    apiKey: string;
    model: string;
    browserConfig: BrowserConfig;
    maxRetries: number;
    debugMode: boolean;
    screenshotDir: string;
    enableScreenshots: boolean;
    performance: PerformanceConfig;
  };
  private taskHistory: Task[] = [];
  private screenshotCounter: number = 0;
  private allScreenshots: string[] = [];

  constructor(config: AgentConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    const browserConfig: BrowserConfig = {
      type: config.browserConfig?.type || 'chrome',
      headless: config.browserConfig?.headless ?? false,
      viewport: config.browserConfig?.viewport || { width: 1400, height: 900 },
      userAgent: config.browserConfig?.userAgent,
      timeout: config.browserConfig?.timeout
    };

    // Set up performance defaults (optimized for speed)
    const performanceDefaults: PerformanceConfig = {
      fastMode: false,
      clickWaitTime: 300,        // Reduced from 1500ms to 300ms
      typeWaitTime: 100,         // Reduced from 500ms to 100ms
      taskWaitTime: 200,         // Reduced from 1000ms to 200ms
      pageLoadTimeout: 15000,    // Reduced from 30000ms to 15000ms
      actionTimeout: 5000,       // Reduced from 10000ms to 5000ms
      screenshotFrequency: 'key', // Reduced from 'all' to 'key'
      domAnalysisFrequency: 'key', // Reduced from 'all' to 'key'
      skipFullPageLoad: true     // Skip expensive full page loads, just wait for DOM
    };

    const performance = { ...performanceDefaults, ...config.performance };

    // Apply fast mode overrides (ultra-optimized)
    if (performance.fastMode) {
      performance.clickWaitTime = Math.min(performance.clickWaitTime!, 150);   // Reduced from 600ms to 150ms
      performance.typeWaitTime = Math.min(performance.typeWaitTime!, 50);      // Reduced from 200ms to 50ms
      performance.taskWaitTime = Math.min(performance.taskWaitTime!, 100);     // Reduced from 300ms to 100ms
      performance.pageLoadTimeout = Math.min(performance.pageLoadTimeout!, 10000); // Reduced from 15000ms to 10000ms
      performance.actionTimeout = Math.min(performance.actionTimeout!, 3000);  // Reduced from 5000ms to 3000ms
      // Reduce frequency even more in fast mode
      performance.screenshotFrequency = 'minimal';
      performance.domAnalysisFrequency = 'minimal';
    }

    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gemini-2.0-flash-exp',
      browserConfig,
      maxRetries: config.maxRetries || 3,
      debugMode: config.debugMode || false,
      screenshotDir: config.screenshotDir || './screenshots',
      enableScreenshots: config.enableScreenshots ?? true,
      performance
    };
    
    this.model = this.genAI.getGenerativeModel({ model: this.config.model });
    
    // Create screenshots directory if it doesn't exist
    if (this.config.enableScreenshots && !fs.existsSync(this.config.screenshotDir)) {
      fs.mkdirSync(this.config.screenshotDir, { recursive: true });
    }
  }

  /**
   * Take a screenshot of the current page
   */
  private async takeScreenshot(context: string): Promise<string | null> {
    if (!this.config.enableScreenshots) {
      this.log(`📸 Screenshots disabled in config`);
      return null;
    }
    
    if (!this.currentPage) {
      this.log(`📸 No current page available for screenshot`);
      return null;
    }

    try {
      // Ensure screenshot directory exists
      if (!fs.existsSync(this.config.screenshotDir)) {
        this.log(`📁 Creating screenshot directory: ${this.config.screenshotDir}`);
        fs.mkdirSync(this.config.screenshotDir, { recursive: true });
      }

      this.screenshotCounter++;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshot-${this.screenshotCounter}-${timestamp}-${context.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      const filepath = path.join(this.config.screenshotDir, filename);
      
      this.log(`📸 Taking screenshot: ${context} -> ${filename}`);
      
      await this.currentPage.screenshot({ 
        path: filepath, 
        fullPage: true
        // Note: quality option is only supported for JPEG format, not PNG
      });
      
      // Verify file was created
      if (fs.existsSync(filepath)) {
        this.allScreenshots.push(filepath);
        this.log(`📸 Screenshot saved successfully: ${filepath}`);
        return filepath;
      } else {
        this.log(`❌ Screenshot file was not created: ${filepath}`);
        return null;
      }
    } catch (error) {
      this.log(`❌ Failed to take screenshot (${context}): ${error}`);
      this.log(`📁 Screenshot directory: ${this.config.screenshotDir}`);
      this.log(`🔧 Check directory permissions and disk space`);
      return null;
    }
  }

  /**
   * Convert screenshot to base64 for AI processing
   */
  private async screenshotToBase64(filepath: string): Promise<string | null> {
    try {
      const buffer = fs.readFileSync(filepath);
      return buffer.toString('base64');
    } catch (error) {
      this.log(`❌ Failed to convert screenshot to base64: ${error}`);
      return null;
    }
  }

  /**
   * Create multimodal prompt with screenshots and DOM
   */
  private async createMultimodalPrompt(textPrompt: string, screenshots: string[] = []): Promise<any[]> {
    const parts: any[] = [{ text: textPrompt }];
    
    if (this.config.enableScreenshots && screenshots.length > 0) {
      for (const screenshotPath of screenshots) {
        const base64 = await this.screenshotToBase64(screenshotPath);
        if (base64) {
          parts.push({
            inlineData: {
              data: base64,
              mimeType: 'image/png'
            }
          });
        }
      }
    }
    
    return parts;
  }

  /**
   * Main method to execute natural language instructions with adaptive planning
   */
  async execute(instruction: string): Promise<AgentResponse> {
    try {
      this.log(`🤖 AI Agent received instruction: "${instruction}"`);
      this.taskHistory = []; // Reset task history
      
      // Initialize browser
      await this.initializeBrowser();
      this.log('✅ Browser initialized');

      let taskCount = 0;
      const maxTasks = 20; // Prevent infinite loops
      let goalAchieved = false;
      
      // Plan the very first task (no DOM analysis needed yet)
      let currentPageContext = null;
      
      while (!goalAchieved && taskCount < maxTasks) {
        taskCount++;
        
        // Step 1: Plan the next task based on current page context
        const nextTask = await this.planNextTask(instruction, currentPageContext, this.taskHistory);
        this.log(`📋 Task ${taskCount}: ${nextTask.description}`);

        // Step 2: Execute the task
        try {
          const result = await this.executeTask(nextTask);
          nextTask.completed = true;
          nextTask.result = result;
          this.taskHistory.push(nextTask);
          this.log(`✅ Task completed: ${nextTask.description}`);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.log(`❌ Task failed: ${nextTask.description} - ${errorMessage}`);
          nextTask.result = { error: errorMessage };
          nextTask.completed = false;
          this.taskHistory.push(nextTask);
          
          // Try to recover or break if too many failures
          const failureCount = this.taskHistory.filter(t => !t.completed).length;
          if (failureCount >= 3) {
            this.log(`❌ Too many failures (${failureCount}), stopping execution`);
            break;
          }
        }

        // Step 3: Smart DOM analysis - only when needed for planning next task
        if (this.currentPage && this.shouldAnalyzeDom('key_moment')) {
          this.log(`🔍 Smart DOM analysis for next task planning...`);
          currentPageContext = await this.analyzeCurrentPageState('task planning');
          this.log(`📄 AI can now see updated page state: ${currentPageContext.title} (${currentPageContext.url})`);
          
          // Save screenshots to the task for history
          if (currentPageContext.screenshots && this.taskHistory.length > 0) {
            const lastTask = this.taskHistory[this.taskHistory.length - 1];
            lastTask.screenshots = currentPageContext.screenshots;
          }
        } else if (this.currentPage && !currentPageContext) {
          // Get minimal context for planning if we don't have it yet
          currentPageContext = await this.getPageContext();
        }

        // Step 4: Check if goal is achieved based on new page state
        if (currentPageContext) {
          goalAchieved = await this.isGoalAchieved(instruction, this.taskHistory, currentPageContext);
        }

        // Minimal delay between tasks (optimized for speed)
        if (this.config.performance.taskWaitTime! > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.performance.taskWaitTime!));
        }
      }

      // Final analysis
      const finalResult = await this.analyzeFinalResults(instruction, this.taskHistory, []);
      const completedTasks = this.taskHistory.filter(t => t.completed);

      return {
        success: goalAchieved || completedTasks.length > 0,
        message: goalAchieved 
          ? `🎉 Goal achieved! Completed ${completedTasks.length} tasks`
          : `Completed ${completedTasks.length}/${this.taskHistory.length} tasks`,
        tasks: this.taskHistory,
        finalResult,
        screenshots: this.allScreenshots
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`❌ Agent execution failed: ${errorMessage}`);
      return {
        success: false,
        message: `Agent execution failed: ${errorMessage}`,
        tasks: this.taskHistory,
        finalResult: null
      };
    }
  }

  /**
   * Plan the next task based on current page state and goal
   */
  private async planNextTask(
    originalInstruction: string, 
    currentPageContext: any, 
    taskHistory: Task[]
  ): Promise<Task> {
    const completedTasks = taskHistory.map(t => `${t.description} (${t.completed ? 'completed' : 'failed'})`).join('\n');
    
    const textPrompt = `
You are a browser automation AI. You need to decide the NEXT SINGLE TASK to achieve this goal:

ORIGINAL GOAL: "${originalInstruction}"

CURRENT SITUATION:
${currentPageContext ? `
- Current URL: ${currentPageContext.url}
- Page Title: ${currentPageContext.title}
- Available Elements (DOM Structure):
${currentPageContext.domSummary}
` : '- No page loaded yet (need to start)'}

TASKS COMPLETED SO FAR:
${completedTasks || '- None yet'}

${currentPageContext?.screenshots?.after ? 
  `VISUAL CONTEXT: I have provided a screenshot of the current page state after DOM extraction. 

CRITICAL INSTRUCTION FOR ELEMENT INTERACTION:
1. First, analyze the SCREENSHOT to visually identify what you want to click/type
2. Then, examine the DOM STRUCTURE above to find the corresponding HTML element
3. Choose the BEST interaction method:

OPTION A - Click by Text (PREFERRED for buttons/links with visible text):
- Use type: "clickByText" 
- Set clickText: "exact text visible on the element"
- This is MORE RELIABLE than CSS selectors

OPTION B - Click by CSS Selector:
- Use type: "click"
- Generate a VALID CSS SELECTOR based on DOM structure (id, class, tag combinations)
- NEVER use pseudo-selectors like :contains() - they are invalid CSS
- Use standard CSS selectors like: #id, .class, tag[attribute="value"], tag:nth-child(n)

Examples of VALID approaches:
✅ PREFERRED: {"type": "clickByText", "clickText": "Next"}
✅ PREFERRED: {"type": "clickByText", "clickText": "Sign In"}
✅ FALLBACK: {"type": "click", "selector": "button#submit-btn"}
✅ FALLBACK: {"type": "click", "selector": "input[type=\"email\"]"}
✅ FALLBACK: {"type": "click", "selector": ".login-form button"}

Examples of INVALID approaches (DO NOT USE):
❌ {"type": "click", "selector": "button:contains(\"Next\")"}
❌ {"type": "click", "selector": "text(\"Submit\")"}
❌ {"type": "click", "selector": "*:contains(\"Login\")"}"` : ''}

Based on the current page state (both DOM structure and visual appearance), what should be the NEXT SINGLE TASK to progress toward the goal?

Respond with a JSON object for ONE task:
{
  "id": "task_${taskHistory.length + 1}",
  "description": "Clear description of what to do next",
  "type": "navigate|click|clickByText|type|wait|extract|custom",
  "selector": "valid_css_selector_if_using_click_type",
  "clickText": "exact_text_if_using_clickByText_type",
  "text": "text_to_type_if_needed",
  "url": "url_if_navigate_needed",
  "reasoning": "Why this task makes sense given the visual context and which DOM element you identified from the screenshot analysis"
}

Task types:
- navigate: Go to a URL
- click: Click an element by CSS selector
- clickByText: Click an element by its visible text (PREFERRED for buttons/links)
- type: Type text into an input
- wait: Wait for elements or time
- extract: Extract data from page
- custom: Complex action requiring page analysis

Only return the JSON object, no other text.
`;

    try {
      this.log(`AI is analyzing current page state (DOM + Visual) to decide next action...`);
      
      // Collect screenshots for multimodal prompt
      const screenshots: string[] = [];
      if (currentPageContext?.screenshots?.after) {
        screenshots.push(currentPageContext.screenshots.after);
      }
      
      // Create multimodal prompt with screenshots
      const multimodalPrompt = await this.createMultimodalPrompt(textPrompt, screenshots);
      
      this.log(`📸 Using ${screenshots.length} screenshots for AI decision making`);
      
      const result = await this.model.generateContent(multimodalPrompt);
      const response = result.response.text();
      
      const taskJson = response.trim().replace(/```json\n?|\n?```/g, '');
      const task = JSON.parse(taskJson);
      
      this.log(`AI Decision Based on DOM + Visual: ${task.reasoning || 'Planning next action'}`);
      this.log(`Next Action: ${task.description}`);
      
      return {
        id: task.id || `task_${taskHistory.length + 1}`,
        description: task.description,
        type: task.type,
        selector: task.selector,
        clickText: task.clickText,
        text: task.text,
        url: task.url,
        completed: false,
        result: null
      };

    } catch (error) {
      this.log(`Failed to plan next task: ${error}`);
      // Fallback task
      return {
        id: `task_${taskHistory.length + 1}`,
        description: 'Analyze current page and determine next action',
        type: 'custom',
        completed: false
      };
    }
  }

  /**
   * Check if the original goal has been achieved
   */
  private async isGoalAchieved(
    originalInstruction: string, 
    taskHistory: Task[], 
    currentPageContext: any
  ): Promise<boolean> {
    if (taskHistory.length === 0) return false;

    const completedTasks = taskHistory.filter(t => t.completed);
    if (completedTasks.length === 0) return false;

    const textPrompt = `
You are evaluating if a browser automation goal has been achieved.

ORIGINAL GOAL: "${originalInstruction}"

CURRENT PAGE STATE:
${currentPageContext ? `
- URL: ${currentPageContext.url}
- Page Title: ${currentPageContext.title}
- Available Elements: ${currentPageContext.domSummary.slice(0, 500)}...
` : '- No page context available'}

COMPLETED TASKS:
${completedTasks.map(t => `✅ ${t.description}`).join('\n')}

${currentPageContext?.screenshots?.after ? 
  'VISUAL CONTEXT: I have provided a screenshot of the current page state after DOM extraction. Please analyze both the DOM structure above AND the visual appearance in the screenshot to evaluate if the goal has been achieved.' : ''}

Based on the original goal and current page state (both DOM structure and visual appearance), has the goal been achieved?

Respond with a JSON object:
{
  "achieved": true/false,
  "reasoning": "Explanation of why the goal is or isn't achieved based on visual and DOM analysis",
  "confidence": 0.0-1.0
}

Only return the JSON object, no other text.
`;

    try {
      // Collect screenshots for multimodal prompt
      const screenshots: string[] = [];
      if (currentPageContext?.screenshots?.after) {
        screenshots.push(currentPageContext.screenshots.after);
      }
      
      // Create multimodal prompt with screenshots
      const multimodalPrompt = await this.createMultimodalPrompt(textPrompt, screenshots);
      
      this.log(`📸 Using ${screenshots.length} screenshots for goal evaluation`);
      
      const result = await this.model.generateContent(multimodalPrompt);
      const response = result.response.text();
      const evaluation = JSON.parse(response.trim().replace(/```json\n?|\n?```/g, ''));
      
      this.log(`🎯 Goal Achievement Check: ${evaluation.achieved ? 'ACHIEVED' : 'NOT YET'} (${evaluation.confidence * 100}% confidence)`);
      this.log(`📝 Reasoning: ${evaluation.reasoning}`);
      
      // Consider goal achieved if confidence is high
      return evaluation.achieved && evaluation.confidence > 0.7;
      
    } catch (error) {
      this.log(`❌ Failed to evaluate goal achievement: ${error}`);
      return false; // Continue if we can't evaluate
    }
  }

  /**
   * Execute a single task with comprehensive DOM analysis after every action
   */
  private async executeTask(task: Task): Promise<any> {
    // FIXED: Ensure page and actions are initialized before checking
    await this.getCurrentPage();
    
    if (!this.currentPage || !this.actions) {
      throw new Error('Browser not initialized');
    }

    switch (task.type) {
      case 'navigate':
        if (!task.url) throw new Error('URL required for navigation');
        
        this.log(`🌐 Navigating to: ${task.url}`);
        await this.currentPage.goto(task.url, { timeout: this.config.performance.pageLoadTimeout });
        
        if (this.config.performance.skipFullPageLoad) {
          // Fast navigation: just wait for DOM, then extract HTML and take screenshot immediately
          this.log(`⚡ Fast mode: Waiting for DOM content only...`);
          await this.currentPage.waitForLoadState('domcontentloaded', { timeout: 5000 });
          this.log(`🚀 DOM ready! Extracting HTML and taking screenshot immediately...`);
        } else {
          // Traditional approach: wait for full page load
          this.log(`⏳ Waiting for full page load...`);
          await this.actions.waitForLoad(this.config.performance.pageLoadTimeout!);
        }
        
        // Skip DOM analysis after navigation - will be done in main loop for better performance
        // Navigation DOM analysis moved to main execution loop
        
        return { url: task.url, title: await this.currentPage.title() };

      case 'click':
        if (!task.selector) throw new Error('Selector required for click');
        
        this.log(`🖱️ Clicking element: ${task.selector}`);
        await this.actions.click(task.selector);
        
        // Wait for potential page changes after click
        this.log(`⏳ Waiting ${this.config.performance.clickWaitTime}ms for potential page changes after click...`);
        await this.actions.wait(this.config.performance.clickWaitTime!);
        
        // Skip DOM analysis after click - will be done in main loop
        // DOM analysis moved to main execution loop for better performance
        
        return { clicked: task.selector };

      case 'clickByText':
        if (!task.clickText) throw new Error('Click text required for clickByText');
        
        this.log(`🖱️ Clicking element by text: "${task.clickText}"`);
        await this.actions.clickByText(task.clickText);
        
        // Wait for potential page changes after click
        this.log(`⏳ Waiting ${this.config.performance.clickWaitTime}ms for potential page changes after text-based click...`);
        await this.actions.wait(this.config.performance.clickWaitTime!);
        
        // Skip DOM analysis after text click - will be done in main loop
        // DOM analysis moved to main execution loop for better performance
        
        return { clickedByText: task.clickText };

      case 'type':
        if (!task.selector || !task.text) throw new Error('Selector and text required for typing');
        
        this.log(`⌨️ Typing "${task.text}" into: ${task.selector}`);
        await this.actions.type(task.selector, task.text, { clear: true });
        
        // Small delay to let any dynamic changes happen
        await this.actions.wait(this.config.performance.typeWaitTime!);
        
        // Skip DOM analysis after typing - will be done in main loop
        // DOM analysis moved to main execution loop for better performance
        
        return { typed: task.text, into: task.selector };

      case 'extract':
        this.log(`📊 Extracting data from current page...`);
        const extractor = new DataExtractor(this.currentPage);
        const data = await extractor.extractCommonData();
        
        // Skip DOM analysis during extraction for performance
        // Data extraction already provides page context
        
        return data;

      case 'analyze':
        this.log(`🔍 Explicit page analysis requested`);
        return await this.analyzeCurrentPageState('explicit analysis');

      case 'wait':
        const waitTime = this.config.performance.clickWaitTime!; // Use click wait time as default
        this.log(`⏳ Waiting ${waitTime}ms for page changes...`);
        await this.actions.wait(waitTime);
        
        // Skip DOM analysis after wait - will be done in main loop
        // DOM analysis moved to main execution loop for better performance
        
        return { waited: waitTime };

      case 'custom':
        this.log(`🤖 Executing custom AI-driven action...`);
        const result = await this.handleCustomTask(task);
        
        // Skip DOM analysis after custom action - will be done in main loop
        // DOM analysis moved to main execution loop for better performance
        
        return result;

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Comprehensive DOM analysis with context logging and screenshots (optimized for speed)
   */
  private async analyzeCurrentPageState(context: string): Promise<any> {
    if (!this.currentPage) return null;

    this.log(`🔍 [${context.toUpperCase()}] Starting fast DOM analysis...`);
    
    const page = await this.getCurrentPage();
    
    // Fast parallel extraction - don't wait for everything to load
    const [domTree, extractedData, afterScreenshot] = await Promise.all([
      // Extract DOM immediately (don't wait for images/resources)
      this.domExtractor!.extractFromPage(page),
      // Extract data immediately 
      this.dataExtractor!.extractCommonData(),
      // Take screenshot immediately after DOM is ready
      this.shouldTakeScreenshot('after_dom') ? 
        this.takeScreenshot(`after-${context}`) : null
    ]);
    
    // Create simplified DOM summary for AI
    const domSummary = this.createDomSummary(domTree);
    
    const pageContext = {
      url: await page.url(),
      title: await page.title(),
      domTree,
      extractedData,
      domSummary,
      analysisContext: context,
      screenshots: {
        after: afterScreenshot
      }
    };

    this.log(`📊 [${context.toUpperCase()}] Fast DOM Analysis Results:`);
    this.log(`   📍 URL: ${pageContext.url}`);
    this.log(`   📝 Title: ${pageContext.title}`);
    this.log(`   🏗️ Elements found: ${domSummary.split('\n').length}`);
    this.log(`   📸 Screenshot: ${afterScreenshot ? 'Ready ✅' : 'Skipped ❌'}`);
    this.log(`   ⚡ Fast analysis completed - no waiting for full page load`);

    return pageContext;
  }

  /**
   * Handle custom tasks that require AI decision making with DOM analysis after each action
   */
  private async handleCustomTask(task: Task): Promise<any> {
    // Get current page context with screenshots
    this.log(`🤖 Custom task: Getting current page context with screenshots for AI decision...`);
    const pageContext = await this.getPageContextWithScreenshots();
    
    const textPrompt = `
You are controlling a browser. Here's the current situation:

Task: ${task.description}
Current page: ${pageContext.url}
Page title: ${pageContext.title}

Available elements (DOM Structure):
${pageContext.domSummary}

${pageContext.screenshots?.length > 0 ? 
  `VISUAL CONTEXT: I have provided screenshots of the current page state.

CRITICAL INSTRUCTION FOR ELEMENT INTERACTION:
1. First, analyze the SCREENSHOT to visually identify what you want to click/type
2. Then, examine the DOM STRUCTURE above to find the corresponding HTML element
3. Choose the BEST interaction method:

OPTION A - Click by Text (PREFERRED for buttons/links with visible text):
- Use action: "clickByText"
- Set clickText: "exact text visible on the element"
- This is MORE RELIABLE than CSS selectors

OPTION B - Click by CSS Selector:
- Use action: "click"
- Generate a VALID CSS SELECTOR based on DOM structure (id, class, tag combinations)
- NEVER use pseudo-selectors like :contains() - they are invalid CSS
- Use standard CSS selectors like: #id, .class, tag[attribute="value"], tag:nth-child(n)

Examples of VALID approaches:
✅ PREFERRED: {"action": "clickByText", "clickText": "Next"}
✅ PREFERRED: {"action": "clickByText", "clickText": "Sign In"}
✅ FALLBACK: {"action": "click", "selector": "button#submit-btn"}
✅ FALLBACK: {"action": "click", "selector": "input[type=\"email\"]"}
✅ FALLBACK: {"action": "click", "selector": ".login-form button"}

Examples of INVALID approaches (DO NOT USE):
❌ {"action": "click", "selector": "button:contains(\"Next\")"}
❌ {"action": "click", "selector": "text(\"Submit\")"}
❌ {"action": "click", "selector": "*:contains(\"Login\")"}"` : ''}

What specific action should I take? Respond with a JSON object:
{
  "action": "click|clickByText|type|navigate|extract",
  "selector": "valid_css_selector_if_using_click",
  "clickText": "exact_text_if_using_clickByText",
  "text": "text_to_type_if_needed", 
  "url": "url_if_navigate",
  "reasoning": "why_this_action_based_on_visual_and_dom_analysis_and_which_dom_element_you_identified"
}
`;

    try {
      // Create multimodal prompt with screenshots
      const multimodalPrompt = await this.createMultimodalPrompt(textPrompt, pageContext.screenshots || []);
      
      this.log(`📸 Using ${pageContext.screenshots?.length || 0} screenshots for custom task decision`);
      
      const result = await this.model.generateContent(multimodalPrompt);
      const response = result.response.text();
      const actionJson = response.trim().replace(/```json\n?|\n?```/g, '');
      const action = JSON.parse(actionJson);

      this.log(`🤖 AI Decision for custom task: ${action.reasoning}`);

      // Execute the AI's decision WITH DOM analysis after each action
      switch (action.action) {
        case 'click':
          this.log(`🖱️ Custom action: Clicking ${action.selector}`);
          await this.actions!.click(action.selector);
          
          // Wait for potential changes
          await this.actions!.wait(this.config.performance.clickWaitTime!);
          
          // Skip DOM analysis after custom click - will be done in main loop
          
          return { action: 'click', selector: action.selector };

        case 'clickByText':
          this.log(`🖱️ Custom action: Clicking by text "${action.clickText}"`);
          await this.actions!.clickByText(action.clickText);
          
          // Wait for potential changes
          await this.actions!.wait(this.config.performance.clickWaitTime!);
          
          // Skip DOM analysis after custom text click - will be done in main loop
          
          return { action: 'clickByText', clickText: action.clickText };

        case 'type':
          this.log(`⌨️ Custom action: Typing "${action.text}" into ${action.selector}`);
          await this.actions!.type(action.selector, action.text, { clear: true });
          
          // Wait for potential dynamic changes
          await this.actions!.wait(this.config.performance.typeWaitTime!);
          
          // Skip DOM analysis after custom type - will be done in main loop
          
          return { action: 'type', selector: action.selector, text: action.text };

        case 'navigate':
          this.log(`🌐 Custom action: Navigating to ${action.url}`);
          await this.currentPage!.goto(action.url);
          
          if (this.config.performance.skipFullPageLoad) {
            // Fast navigation: just wait for DOM content
            this.log(`⚡ Fast custom navigation: DOM only...`);
            await this.currentPage!.waitForLoadState('domcontentloaded', { timeout: 5000 });
          } else {
            await this.actions!.waitForLoad();
          }
          
          // Skip DOM analysis after custom navigation - will be done in main loop
          
          return { action: 'navigate', url: action.url };

        case 'extract':
          this.log(`📊 Custom action: Extracting data from page`);
          const extractor = new DataExtractor(this.currentPage!);
          const data = await extractor.extractCommonData();
          
          // Skip DOM analysis during custom extraction - data extraction provides context
          
          return data;

        default:
          this.log(`❓ Unknown custom action: ${action.action}`);
          return { action: 'unknown', reasoning: action.reasoning };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`❌ Custom task failed: ${errorMessage}`);
      return { error: errorMessage };
    }
  }

  /**
   * Initialize browser and tools
   */
  private async initializeBrowser(): Promise<void> {
    if (this.browser) return; // Already initialized

    this.browser = new AutomationBrowser(this.config.browserConfig);
    try {
      await this.browser.launch();
      this.log('✅ Browser launched');
    } catch (error) {
      this.log(`❌ Browser launch failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get current page for analysis
   */
  protected async getCurrentPage(): Promise<Page> {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    if (!this.currentPage) {
      this.currentPage = await this.browser!.newPage();
      this.actions = new BrowserActions(this.currentPage);
      this.domExtractor = new DomExtractor();
      this.dataExtractor = new DataExtractor(this.currentPage);
    }

    return this.currentPage;
  }

  /**
   * Create an enhanced DOM summary for AI processing with visual context matching
   */
  protected createDomSummary(domTree: any): string {
    const elements: string[] = [];
    let elementIndex = 0;
    
    function traverse(node: any, depth: number = 0) {
      if (depth > 4) return; // Limit depth for readability
      
      if (node.tagName && node.tagName !== '#text') {
        elementIndex++;
        let element = `${elementIndex}. ${'  '.repeat(depth)}<${node.tagName}`;
        
        // Add important attributes for selector generation
        if (node.attributes.id) element += ` id="${node.attributes.id}"`;
        if (node.attributes.class) element += ` class="${node.attributes.class}"`;
        if (node.attributes.href) element += ` href="${node.attributes.href}"`;
        if (node.tagName === 'input' && node.attributes.type) element += ` type="${node.attributes.type}"`;
        if (node.attributes.name) element += ` name="${node.attributes.name}"`;
        if (node.attributes.placeholder) element += ` placeholder="${node.attributes.placeholder}"`;
        if (node.attributes.value) element += ` value="${node.attributes.value}"`;
        if (node.attributes.title) element += ` title="${node.attributes.title}"`;
        if (node.attributes.alt) element += ` alt="${node.attributes.alt}"`;
        if (node.attributes.role) element += ` role="${node.attributes.role}"`;
        if (node.attributes['data-testid']) element += ` data-testid="${node.attributes['data-testid']}"`;
        if (node.attributes['aria-label']) element += ` aria-label="${node.attributes['aria-label']}"`;
        
        element += '>';
        
        // Add text content if meaningful and not too long
        if (node.textContent && node.textContent.trim().length > 0 && node.textContent.trim().length < 100) {
          element += ` TEXT: "${node.textContent.trim()}"`;
        }
        
        // Add suggested selector for this element
        let suggestedSelector = '';
        if (node.attributes.id) {
          suggestedSelector = `#${node.attributes.id}`;
        } else if (node.attributes.class) {
          const classes = node.attributes.class.split(' ').filter((c: string) => c.length > 0);
          suggestedSelector = `.${classes.join('.')}`;
        } else if (node.attributes.name) {
          suggestedSelector = `${node.tagName}[name="${node.attributes.name}"]`;
        } else if (node.attributes.type) {
          suggestedSelector = `${node.tagName}[type="${node.attributes.type}"]`;
        } else if (node.attributes['data-testid']) {
          suggestedSelector = `[data-testid="${node.attributes['data-testid']}"]`;
        } else {
          suggestedSelector = node.tagName;
        }
        
        element += ` → SELECTOR: ${suggestedSelector}`;
        
        elements.push(element);
      }
      
      if (node.children) {
        node.children.forEach((child: any) => traverse(child, depth + 1));
      }
    }
    
    traverse(domTree);
    return elements.slice(0, 80).join('\n'); // Increased limit for better context
  }

  /**
   * Get page context for AI decision making (fast version)
   */
  private async getPageContext(): Promise<any> {
    const page = await this.getCurrentPage();
    
    // Fast context without full DOM extraction
    return {
      url: await page.url(),
      title: await page.title(),
      domSummary: 'Fast context mode - DOM analysis skipped for performance'
    };
  }

  /**
   * Get page context with screenshots for AI decision making (optimized)
   */
  private async getPageContextWithScreenshots(): Promise<any> {
    const page = await this.getCurrentPage();
    
    // Only extract DOM if we really need it (for screenshots)
    let domSummary = 'Fast context mode - DOM analysis skipped for performance';
    if (this.shouldTakeScreenshot('key_moment')) {
      const domTree = await this.domExtractor!.extractFromPage(page);
      domSummary = this.createDomSummary(domTree);
    }
    
    // Take a screenshot for immediate analysis (if needed)
    const screenshot = this.shouldTakeScreenshot('key_moment') ? 
      await this.takeScreenshot('current-context') : null;
    
    return {
      url: await page.url(),
      title: await page.title(),
      domSummary,
      screenshots: screenshot ? [screenshot] : []
    };
  }

  /**
   * Analyze final results and provide summary
   */
  private async analyzeFinalResults(instruction: string, tasks: Task[], results: any[]): Promise<any> {
    const completedTasks = tasks.filter(t => t.completed);
    const failedTasks = tasks.filter(t => !t.completed);

    const summary = {
      instruction,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      taskResults: tasks.map(t => ({
        description: t.description,
        completed: t.completed,
        result: t.result
      })),
      success: failedTasks.length === 0
    };

    this.log(`📊 Final Summary: ${completedTasks.length}/${tasks.length} tasks completed`);
    return summary;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.log('✅ Browser closed');
    }
  }

  /**
   * Get task history
   */
  getTaskHistory(): Task[] {
    return this.taskHistory;
  }

  /**
   * Determine if DOM analysis should be performed based on performance settings
   */
  private shouldAnalyzeDom(context: 'after_action' | 'after_navigation' | 'key_moment' | 'always'): boolean {
    const frequency = this.config.performance.domAnalysisFrequency!;
    
    switch (frequency) {
      case 'all':
        return true;
      case 'key':
        // Only analyze after navigation and before planning the next task
        return context === 'after_navigation' || context === 'key_moment';
      case 'minimal':
        // Only analyze after navigation - skip most other analysis
        return context === 'after_navigation' || context === 'key_moment';
      default:
        return true;
    }
  }

  /**
   * Determine if screenshot should be taken based on performance settings
   */
  private shouldTakeScreenshot(context: 'after_dom' | 'key_moment'): boolean {
    if (!this.config.enableScreenshots) return false;
    
    const frequency = this.config.performance.screenshotFrequency!;
    
    switch (frequency) {
      case 'all':
        return true;
      case 'key':
        // For 'key' frequency, take screenshots after DOM extraction and at key moments
        return context === 'key_moment' || context === 'after_dom';
      case 'minimal':
        return context === 'key_moment';
      default:
        return true;
    }
  }

  /**
   * Debug logging
   */
  private log(message: string): void {
    if (this.config.debugMode) {
      console.log(`[AIAgent] ${message}`);
    }
  }
}
