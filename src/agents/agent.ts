import { GoogleGenerativeAI } from '@google/generative-ai';
import { AutomationBrowser } from '../browser/browser';
import { BrowserActions } from '../browser/actions/actions';
import { parseHTMLToSummary } from '../dom/htmlParser';
import { taskPlanningPrompt } from './prompts/taskPlanningPrompt';
import { goalAchievementPrompt } from './prompts/goalAchievementPrompt';
import { customTaskPrompt } from './prompts/customTaskPrompt';
import { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { 
  Task, 
  PerformanceConfig, 
  AgentConfig, 
  AgentResponse, 
  BrowserConfig, 
  BrowserType
} from '../types';

export class AIAgent {
  private genAI: GoogleGenerativeAI; //model provider
  private model: any;
  private browser: AutomationBrowser | null = null;
  private currentPage: Page | null = null;
  private actions: BrowserActions | null = null;

  protected dataExtractor: any | null = null; // DataExtractor is no longer used
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

    // Set up performance defaults
    const performanceDefaults: PerformanceConfig = {
      fastMode: false,
      clickWaitTime: 1500,
      typeWaitTime: 500,
      taskWaitTime: 1000,
      pageLoadTimeout: 30000,
      actionTimeout: 10000,
      screenshotFrequency: 'all',
      domAnalysisFrequency: 'all'
    };

    const performance = { ...performanceDefaults, ...config.performance };

    // Apply fast mode overrides
    if (performance.fastMode) {
      performance.clickWaitTime = Math.min(performance.clickWaitTime!, 600);
      performance.typeWaitTime = Math.min(performance.typeWaitTime!, 200);
      performance.taskWaitTime = Math.min(performance.taskWaitTime!, 300);
      performance.pageLoadTimeout = Math.min(performance.pageLoadTimeout!, 15000);
      performance.actionTimeout = Math.min(performance.actionTimeout!, 5000);
      // Keep screenshots enabled in fast mode for visual analysis - just reduce frequency
      performance.screenshotFrequency = performance.screenshotFrequency === 'all' ? 'key' : performance.screenshotFrequency;
      performance.domAnalysisFrequency = performance.domAnalysisFrequency === 'all' ? 'key' : performance.domAnalysisFrequency;
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
    
    try {
      // Get current page, creating one if needed
      const page = await this.getCurrentPage();
      
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
      
      await page.screenshot({ 
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
   * Plan the next task based on current context and history
   */
  private async planNextTask(
    originalInstruction: string, 
    currentPageContext: any, 
    taskHistory: Task[]
  ): Promise<Task> {
    const completedTasks = taskHistory.filter(t => t.completed);
    const failedTasks = taskHistory.filter(t => !t.completed);
    
    let contextPrompt = '';
    if (currentPageContext) {
      contextPrompt = `
Current Page Context:
- URL: ${currentPageContext.url}
- Title: ${currentPageContext.title}
- DOM Summary: ${currentPageContext.domSummary}
`;
    }

    const taskPrompt = taskPlanningPrompt(originalInstruction, contextPrompt, taskHistory);

    try {
      const result = await this.model.generateContent(taskPrompt);
      const response = result.response.text();
      const taskJson = response.trim().replace(/```json\n?|\n?```/g, '');
      const taskData = JSON.parse(taskJson);
      
      const task: Task = {
        id: `task-${Date.now()}`,
        description: taskData.description,
        type: taskData.action as any,
        selector: taskData.selector,
        clickText: taskData.clickText,
        text: taskData.text,
        url: taskData.url,
        completed: false,
        result: null
      };

      this.log(`📋 Planned task: ${task.description}`);
      this.log(`🤔 Reasoning: ${taskData.reasoning}`);
      
      return task;
    } catch (error) {
      this.log(`❌ Failed to plan task: ${error}`);
      // Fallback task
      return {
        id: `task-${Date.now()}`,
        description: "Error in task planning - taking screenshot for analysis",
        type: "custom",
        completed: false,
        result: null
      };
    }
  }

  /**
   * Check if the goal has been achieved
   */
  private async isGoalAchieved(
    originalInstruction: string, 
    taskHistory: Task[], 
    currentPageContext: any
  ): Promise<boolean> {
    const completedTasks = taskHistory.filter(t => t.completed);
    const failedTasks = taskHistory.filter(t => !t.completed);
    
    if (completedTasks.length === 0) {
      return false; // Haven't completed any tasks yet
    }

    let contextPrompt = '';
    if (currentPageContext) {
      contextPrompt = `
Current Page Context:
- URL: ${currentPageContext.url}
- Title: ${currentPageContext.title}
- DOM Summary: ${currentPageContext.domSummary}
`;
    }

    const goalPrompt = goalAchievementPrompt(originalInstruction, contextPrompt, completedTasks, failedTasks);

    try {
      const result = await this.model.generateContent(goalPrompt);
      const response = result.response.text();
      const goalJson = response.trim().replace(/```json\n?|\n?```/g, '');
      const goalData = JSON.parse(goalJson);
      
      this.log(`🎯 Goal achievement check: ${goalData.achieved ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
      this.log(`💭 Reasoning: ${goalData.reasoning}`);
      this.log(`🎲 Confidence: ${goalData.confidence}`);
      
      return goalData.achieved;
    } catch (error) {
      this.log(`❌ Failed to check goal achievement: ${error}`);
      return false; // Default to not achieved if we can't determine
    }
  }

  /**
   * Execute a specific task
   */
  private async executeTask(task: Task): Promise<any> {
    this.log(`🚀 Executing task: ${task.description}`);
    
    try {
      let result;
      
      switch (task.type) {
        case 'click':
          if (!task.selector || typeof task.selector !== 'string') {
            this.log(`❌ Missing or invalid selector for click action`);
            result = { error: 'Missing or invalid selector for click action' };
            break;
          }
          this.log(`🖱️ Clicking ${task.selector}`);
          const actions1 = await this.getActions();
          await actions1.click(task.selector);
          await actions1.wait(this.config.performance.clickWaitTime!);
          result = { action: 'click', selector: task.selector };
          break;
          
        case 'clickByText':
          if (!task.clickText || typeof task.clickText !== 'string') {
            this.log(`❌ Missing or invalid clickText for clickByText action`);
            result = { error: 'Missing or invalid clickText for clickByText action' };
            break;
          }
          this.log(`🖱️ Clicking by text "${task.clickText}"`);
          const actions2 = await this.getActions();
          await actions2.clickByText(task.clickText);
          await actions2.wait(this.config.performance.clickWaitTime!);
          result = { action: 'clickByText', clickText: task.clickText };
          break;
          
        case 'type':
          if (!task.selector || typeof task.selector !== 'string') {
            this.log(`❌ Missing or invalid selector for type action`);
            result = { error: 'Missing or invalid selector for type action' };
            break;
          }
          if (!task.text || typeof task.text !== 'string') {
            this.log(`❌ Missing or invalid text for type action`);
            result = { error: 'Missing or invalid text for type action' };
            break;
          }
          this.log(`⌨️ Typing "${task.text}" into ${task.selector}`);
          const actions3 = await this.getActions();
          await actions3.type(task.selector, task.text, { clear: true });
          await actions3.wait(this.config.performance.typeWaitTime!);
          result = { action: 'type', selector: task.selector, text: task.text };
          break;
          
        case 'navigate':
          if (!task.url || typeof task.url !== 'string') {
            this.log(`❌ Missing or invalid URL for navigate action`);
            result = { error: 'Missing or invalid URL for navigate action' };
            break;
          }
          this.log(`🌐 Navigating to ${task.url}`);
          const page = await this.getCurrentPage();
          await page.goto(task.url);
          const actions4 = await this.getActions();
          await actions4.waitForLoad();
          result = { action: 'navigate', url: task.url };
          break;
          
        case 'custom':
          this.log(`🤖 Custom task: ${task.description}`);
          // Custom tasks are handled separately
          result = { action: 'custom', description: task.description };
          break;
          
        default:
          this.log(`❓ Unknown action: ${task.type}`);
          result = { type: 'unknown', description: task.description };
      }
      
      task.completed = true;
      task.result = result;
      this.log(`✅ Task completed successfully`);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`❌ Task failed: ${errorMessage}`);
      task.completed = false;
      task.result = { error: errorMessage };
      return { error: errorMessage };
    }
  }

  /**
   * Handle custom tasks that require AI decision making
   */
  private async handleCustomTask(task: Task): Promise<any> {
    this.log(`🤖 Custom task: Getting current page context with screenshots for AI decision...`);
    
    // Get current page context with screenshots
    const pageContext = await this.getPageContextWithScreenshots();
    
    const textPrompt = customTaskPrompt(task, pageContext);

    try {
      // Create multimodal prompt with screenshot
      const screenshots = pageContext.screenshot ? [pageContext.screenshot] : [];
      const multimodalPrompt = await this.createMultimodalPrompt(textPrompt, screenshots);
      
      this.log(`📸 Using ${screenshots.length} screenshot for custom task decision`);
      
      const result = await this.model.generateContent(multimodalPrompt);
      const response = result.response.text();
      const actionJson = response.trim().replace(/```json\n?|\n?```/g, '');
      const action = JSON.parse(actionJson);

      this.log(`🤖 AI Decision for custom task: ${action.reasoning}`);

      // Execute the AI's decision
      switch (action.action) {
        case 'click':
          this.log(`🖱️ Custom action: Clicking ${action.selector}`);
          const actions1 = await this.getActions();
          await actions1.click(action.selector);
          await actions1.wait(this.config.performance.clickWaitTime!);
          return { action: 'click', selector: action.selector };

        case 'clickByText':
          this.log(`🖱️ Custom action: Clicking by text "${action.clickText}"`);
          const actions2 = await this.getActions();
          await actions2.clickByText(action.clickText);
          await actions2.wait(this.config.performance.clickWaitTime!);
          return { action: 'clickByText', clickText: action.clickText };

        case 'type':
          this.log(`⌨️ Custom action: Typing "${action.text}" into ${action.selector}`);
          const actions3 = await this.getActions();
          await actions3.type(action.selector, action.text, { clear: true });
          await actions3.wait(this.config.performance.typeWaitTime!);
          return { action: 'type', selector: action.selector, text: action.text };

        case 'navigate':
          this.log(`🌐 Custom action: Navigating to ${action.url}`);
          const page = await this.getCurrentPage();
          await page.goto(action.url);
          const actions4 = await this.getActions();
          await actions4.waitForLoad();
          return { action: 'navigate', url: action.url };

        case 'extract':
          this.log(`📊 Custom action: Extracting data from page`);
          const data = {}; 
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
   * Analyze current page state with DOM extraction and screenshots
   */
  private async analyzeCurrentPageState(context: string): Promise<any> {
    this.log(`🔍 Analyzing current page state: ${context}`);
    
    // Extract complete DOM structure first
    const page = await this.getCurrentPage();
    const html = await page.content();
    const domSummary = parseHTMLToSummary(html);
    const extractedData = {}; // DataExtractor is no longer used
    
    // Take screenshot AFTER DOM extraction (performance configurable)
    const screenshot = this.shouldTakeScreenshot('after_dom') ? 
      await this.takeScreenshot(`after-${context}`) : null;
    
    const pageContext = {
      url: await page.url(),
      title: await page.title(),
      extractedData,
      domSummary,
      analysisContext: context,
      screenshot: screenshot
    };

    this.log(`📊 [${context.toUpperCase()}] DOM Analysis Results:`);
    this.log(`   📍 URL: ${pageContext.url}`);
    this.log(`   📝 Title: ${pageContext.title}`);
    this.log(`   🏗️ Elements found: ${domSummary.split('\n').length}`);
    this.log(`   📸 Screenshot: ${screenshot ? '✅ Taken' : '❌ Skipped'}`);
    this.log(`   ✅ DOM state captured for AI decision making`);

    return pageContext;
  }

  /**
   * Analyze final results and provide summary
   */
  private analyzeFinalResults(instruction: string, tasks: Task[], results: any[]): any {
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
   * Determine if DOM analysis should be performed based on performance settings
   */
  private shouldAnalyzeDom(context: 'after_action' | 'after_navigation' | 'key_moment' | 'always'): boolean {
    const frequency = this.config.performance.domAnalysisFrequency!;
    
    switch (frequency) {
      case 'all':
        return true;
      case 'key':
        return context === 'after_navigation' || context === 'key_moment';
      case 'minimal':
        return context === 'key_moment';
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
          let taskResult;
          
          if (nextTask.type === 'custom') {
            // Get current page context with screenshots for custom tasks
            const pageContext = await this.getPageContextWithScreenshots();
            taskResult = await this.handleCustomTask(nextTask);
          } else {
            // Execute standard task
            taskResult = await this.executeTask(nextTask);
          }
          
          this.taskHistory.push(nextTask);
          
          // Step 3: Check if goal is achieved
          if (nextTask.type === 'custom' && nextTask.description.includes('Goal achieved')) {
            goalAchieved = true;
            this.log(`🎯 Goal achieved after ${taskCount} tasks`);
            break;
          }
          
          // Step 4: Analyze current page state for next iteration
          if (this.shouldAnalyzeDom('after_action')) {
            currentPageContext = await this.analyzeCurrentPageState('after task execution');
          }
          
          // Step 5: Check if goal is achieved based on current context
          if (currentPageContext) {
            goalAchieved = await this.isGoalAchieved(instruction, this.taskHistory, currentPageContext);
          }
          
          // Wait between tasks
          const actions = await this.getActions();
          await actions.wait(this.config.performance.taskWaitTime!);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.log(`❌ Task ${taskCount} failed: ${errorMessage}`);
          nextTask.completed = false;
          nextTask.result = { error: errorMessage };
          this.taskHistory.push(nextTask);
          
          // Continue with next task instead of failing completely
          continue;
        }
      }

      // Final analysis and cleanup
      const finalResults = this.analyzeFinalResults(instruction, this.taskHistory, this.taskHistory.map(t => t.result));

      this.log(`🏁 Execution completed. Success: ${finalResults.success}`);
      
      return {
        success: finalResults.success,
        message: finalResults.success ? 'Task completed successfully' : 'Task completed with errors',
        tasks: this.taskHistory,
        finalResult: finalResults,
        screenshots: this.allScreenshots
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`❌ Execution failed: ${errorMessage}`);
      
      return {
        success: false,
        message: `Execution failed: ${errorMessage}`,
        tasks: this.taskHistory,
        finalResult: { error: errorMessage },
        screenshots: this.allScreenshots
      };
    }
  }

  /**
   * Initialize browser and tools
   */
  private async initializeBrowser(): Promise<void> {
    if (this.browser) return; // Already initialized
    
    this.log('🌐 Initializing browser...');
    this.browser = new AutomationBrowser(this.config.browserConfig);
    await this.browser.launch();
    this.log('✅ Browser initialized successfully');
  }

  /**
   * Get current page, creating one if needed
   */
  protected async getCurrentPage(): Promise<Page> {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    if (!this.currentPage) {
      this.currentPage = await this.browser!.newPage();
      this.actions = new BrowserActions(this.currentPage);
    }

    return this.currentPage;
  }

  /**
   * Get actions, ensuring they are initialized
   */
  private async getActions(): Promise<BrowserActions> {
    await this.getCurrentPage(); // This ensures actions are initialized
    return this.actions!;
  }

  /**
   * Get page context for AI decision making
   */
  private async getPageContext(): Promise<any> {
    const page = await this.getCurrentPage();
    const html = await page.content();
    const domSummary = parseHTMLToSummary(html);
    
    return {
      url: await page.url(),
      title: await page.title(),
      domSummary
    };
  }

  /**
   * Get page context with screenshots for AI decision making
   */
  private async getPageContextWithScreenshots(): Promise<any> {
    const page = await this.getCurrentPage();
    const html = await page.content();
    const domSummary = parseHTMLToSummary(html);
    
    // Take a screenshot for immediate analysis
    const screenshot = await this.takeScreenshot('current-context');
    
    return {
      url: await page.url(),
      title: await page.title(),
      domSummary,
      screenshot: screenshot
    };
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
   * Debug logging
   */
  private log(message: string): void {
    if (this.config.debugMode) {
      console.log(`[AIAgent] ${message}`);
    }
  }
}


