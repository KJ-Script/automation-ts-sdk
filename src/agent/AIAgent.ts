import { GoogleGenerativeAI } from '@google/generative-ai';
import { Browser, BrowserType, BrowserConfig } from '../browser/Browser';
import { BrowserActions } from '../browser/actions/BrowserActions';
import { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { PROMPTS, formatPrompt } from '../prompts';

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
  screenshot?: string;
}

export interface AgentConfig {
  apiKey: string;
  model?: string;
  browserConfig?: Partial<BrowserConfig>;
  maxRetries?: number;
  debugMode?: boolean;
  screenshotDir?: string;
  enableScreenshots?: boolean;
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
  private browser: Browser | null = null;
  private currentPage: Page | null = null;
  private actions: BrowserActions | null = null;
  private config: {
    apiKey: string;
    model: string;
    browserConfig: BrowserConfig;
    maxRetries: number;
    debugMode: boolean;
    screenshotDir: string;
    enableScreenshots: boolean;
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

    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gemini-1.5-flash',
      browserConfig,
      maxRetries: config.maxRetries || 3,
      debugMode: config.debugMode || false,
      screenshotDir: config.screenshotDir || './screenshots',
      enableScreenshots: config.enableScreenshots ?? true
    };
    
    this.model = this.genAI.getGenerativeModel({ model: this.config.model });
    
    if (this.config.enableScreenshots && !fs.existsSync(this.config.screenshotDir)) {
      fs.mkdirSync(this.config.screenshotDir, { recursive: true });
    }
  }

  private async takeScreenshot(context: string): Promise<string | null> {
    if (!this.config.enableScreenshots || !this.currentPage) {
      return null;
    }

    try {
      if (!fs.existsSync(this.config.screenshotDir)) {
        fs.mkdirSync(this.config.screenshotDir, { recursive: true });
      }

      this.screenshotCounter++;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshot-${this.screenshotCounter}-${timestamp}-${context.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      const filepath = path.join(this.config.screenshotDir, filename);
      
      await this.currentPage.screenshot({ 
        path: filepath, 
        fullPage: true
      });
      
      if (fs.existsSync(filepath)) {
        this.allScreenshots.push(filepath);
        this.log(`Screenshot saved: ${filename}`);
        return filepath;
      }
    } catch (error) {
      this.log(`Failed to take screenshot: ${error}`);
    }
    return null;
  }

  private async screenshotToBase64(filepath: string): Promise<string | null> {
    try {
      const buffer = fs.readFileSync(filepath);
      return buffer.toString('base64');
    } catch (error) {
      this.log(`Failed to convert screenshot to base64: ${error}`);
      return null;
    }
  }

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

  async execute(instruction: string): Promise<AgentResponse> {
    try {
      this.log(`AI Agent received instruction: "${instruction}"`);
      this.taskHistory = [];
      
      await this.initializeBrowser();
      this.log('Browser initialized');

      let taskCount = 0;
      const maxTasks = 20;
      let goalAchieved = false;
      let currentPageContext = null;
      
      while (!goalAchieved && taskCount < maxTasks) {
        taskCount++;
        
        const nextTask = await this.planNextTask(instruction, currentPageContext, this.taskHistory);
        this.log(`Task ${taskCount}: ${nextTask.description}`);

        try {
          const result = await this.executeTask(nextTask);
          nextTask.completed = true;
          nextTask.result = result;
          this.taskHistory.push(nextTask);
          this.log(`Task completed: ${nextTask.description}`);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.log(`Task failed: ${nextTask.description} - ${errorMessage}`);
          nextTask.result = { error: errorMessage };
          nextTask.completed = false;
          this.taskHistory.push(nextTask);
          
          const failureCount = this.taskHistory.filter(t => !t.completed).length;
          if (failureCount >= 3) {
            this.log(`Too many failures (${failureCount}), stopping execution`);
            break;
          }
        }

        if (this.currentPage && !currentPageContext) {
          currentPageContext = await this.getPageContext();
        }

        if (currentPageContext) {
          goalAchieved = await this.isGoalAchieved(instruction, this.taskHistory, currentPageContext);
        }
      }

      const finalResult = await this.analyzeFinalResults(instruction, this.taskHistory, []);
      const completedTasks = this.taskHistory.filter(t => t.completed);

      return {
        success: goalAchieved || completedTasks.length > 0,
        message: goalAchieved 
          ? `Goal achieved! Completed ${completedTasks.length} tasks`
          : `Completed ${completedTasks.length}/${this.taskHistory.length} tasks`,
        tasks: this.taskHistory,
        finalResult,
        screenshots: this.allScreenshots
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Agent execution failed: ${errorMessage}`);
      return {
        success: false,
        message: `Agent execution failed: ${errorMessage}`,
        tasks: this.taskHistory,
        finalResult: null
      };
    }
  }

  private async planNextTask(
    originalInstruction: string, 
    currentPageContext: any, 
    taskHistory: Task[]
  ): Promise<Task> {
    const completedTasks = taskHistory.map(t => `${t.description} (${t.completed ? 'completed' : 'failed'})`).join('\n');
    
    const currentSituation = currentPageContext ? `
- Current URL: ${currentPageContext.url}
- Page Title: ${currentPageContext.title}
` : '- No page loaded yet (need to start)';

    const screenshotContext = currentPageContext?.screenshot ? PROMPTS.SCREENSHOT_INTERACTION_CONTEXT : '';
    
    const textPrompt = formatPrompt(PROMPTS.PLAN_NEXT_TASK, {
      originalInstruction,
      currentPageContext: currentSituation,
      completedTasks: completedTasks || '- None yet',
      screenshotContext,
      taskNumber: taskHistory.length + 1
    });

    try {
      this.log(`AI is analyzing current page state to decide next action`);
      
      const screenshots: string[] = [];
      if (currentPageContext?.screenshot) {
        screenshots.push(currentPageContext.screenshot);
      }
      
      const multimodalPrompt = await this.createMultimodalPrompt(textPrompt, screenshots);
      
      this.log(`Using ${screenshots.length} screenshots for AI decision making`);
      
      const result = await this.model.generateContent(multimodalPrompt);
      const response = result.response.text();
      
      const taskJson = response.trim().replace(/```json\n?|\n?```/g, '');
      const task = JSON.parse(taskJson);
      
      this.log(`AI Decision: ${task.reasoning || 'Planning next action'}`);
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
      return {
        id: `task_${taskHistory.length + 1}`,
        description: 'Analyze current page and determine next action',
        type: 'custom',
        completed: false
      };
    }
  }

  private async isGoalAchieved(
    originalInstruction: string, 
    taskHistory: Task[], 
    currentPageContext: any
  ): Promise<boolean> {
    if (taskHistory.length === 0) return false;

    const completedTasks = taskHistory.filter(t => t.completed);
    if (completedTasks.length === 0) return false;

    const currentPageState = currentPageContext ? `
- URL: ${currentPageContext.url}
- Page Title: ${currentPageContext.title}
` : '- No page context available';

    const screenshotContext = currentPageContext?.screenshot ? 
      'VISUAL CONTEXT: I have provided a screenshot of the current page state. Please analyze the visual appearance to evaluate if the goal has been achieved.' : '';

    const textPrompt = formatPrompt(PROMPTS.GOAL_ACHIEVED, {
      originalInstruction,
      currentPageContext: currentPageState,
      completedTasks: completedTasks.map(t => `${t.description}`).join('\n'),
      screenshotContext
    });

    try {
      const screenshots: string[] = [];
      if (currentPageContext?.screenshot) {
        screenshots.push(currentPageContext.screenshot);
      }
      
      const multimodalPrompt = await this.createMultimodalPrompt(textPrompt, screenshots);
      
      this.log(`Using ${screenshots.length} screenshots for goal evaluation`);
      
      const result = await this.model.generateContent(multimodalPrompt);
      const response = result.response.text();
      const evaluation = JSON.parse(response.trim().replace(/```json\n?|\n?```/g, ''));
      
      this.log(`Goal Achievement Check: ${evaluation.achieved ? 'ACHIEVED' : 'NOT YET'} (${evaluation.confidence * 100}% confidence)`);
      this.log(`Reasoning: ${evaluation.reasoning}`);
      
      return evaluation.achieved && evaluation.confidence > 0.7;
      
    } catch (error) {
      this.log(`Failed to evaluate goal achievement: ${error}`);
      return false;
    }
  }

  private async executeTask(task: Task): Promise<any> {
    await this.getCurrentPage();
    
    if (!this.currentPage || !this.actions) {
      throw new Error('Browser not initialized');
    }

    switch (task.type) {
      case 'navigate':
        if (!task.url) throw new Error('URL required for navigation');
        
        this.log(`Navigating to: ${task.url}`);
        await this.currentPage.goto(task.url);
        await this.actions.waitForLoad();
        
        return { url: task.url, title: await this.currentPage.title() };

      case 'click':
        if (!task.selector) throw new Error('Selector required for click');
        
        this.log(`Clicking element: ${task.selector}`);
        await this.actions.click(task.selector);
        
        return { clicked: task.selector };

      case 'clickByText':
        if (!task.clickText) throw new Error('Click text required for clickByText');
        
        this.log(`Clicking element by text: "${task.clickText}"`);
        await this.actions.clickByText(task.clickText);
        
        return { clickedByText: task.clickText };

      case 'type':
        if (!task.selector || !task.text) throw new Error('Selector and text required for typing');
        
        this.log(`Typing "${task.text}" into: ${task.selector}`);
        await this.actions.type(task.selector, task.text, { clear: true });
        
        return { typed: task.text, into: task.selector };

      case 'extract':
        this.log(`Extracting basic page data`);
        const basicData = {
          url: await this.currentPage.url(),
          title: await this.currentPage.title(),
          timestamp: new Date().toISOString()
        };
        
        return basicData;

      case 'analyze':
        this.log(`Page analysis requested`);
        return await this.analyzeCurrentPageState('explicit analysis');

      case 'wait':
        this.log(`Waiting for page changes`);
        await this.actions.wait(1000);
        
        return { waited: 1000 };

      case 'custom':
        this.log(`Executing custom AI-driven action`);
        const result = await this.handleCustomTask(task);
        
        return result;

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async analyzeCurrentPageState(context: string): Promise<any> {
    if (!this.currentPage) return null;

    this.log(`Getting page info for: ${context}`);
    
    const page = await this.getCurrentPage();
    const screenshot = await this.takeScreenshot(context);
    
    const pageContext = {
      url: await page.url(),
      title: await page.title(),
      analysisContext: context,
      screenshot
    };

    this.log(`Page analysis completed for: ${pageContext.url}`);

    return pageContext;
  }

  private async handleCustomTask(task: Task): Promise<any> {
    this.log(`Custom task: Getting current page context for AI decision`);
    const pageContext = await this.getPageContextWithScreenshots();
    
    const screenshotContext = pageContext.screenshots?.length > 0 ? PROMPTS.CUSTOM_TASK_SCREENSHOT_CONTEXT : '';
    
    const textPrompt = formatPrompt(PROMPTS.CUSTOM_TASK, {
      taskDescription: task.description,
      currentUrl: pageContext.url,
      pageTitle: pageContext.title,
      screenshotContext
    });

    try {
      const multimodalPrompt = await this.createMultimodalPrompt(textPrompt, pageContext.screenshots || []);
      
      this.log(`Using ${pageContext.screenshots?.length || 0} screenshots for custom task decision`);
      
      const result = await this.model.generateContent(multimodalPrompt);
      const response = result.response.text();
      const actionJson = response.trim().replace(/```json\n?|\n?```/g, '');
      const action = JSON.parse(actionJson);

      this.log(`AI Decision for custom task: ${action.reasoning}`);

      switch (action.action) {
        case 'click':
          this.log(`Custom action: Clicking ${action.selector}`);
          await this.actions!.click(action.selector);
          
          return { action: 'click', selector: action.selector };

        case 'clickByText':
          this.log(`Custom action: Clicking by text "${action.clickText}"`);
          await this.actions!.clickByText(action.clickText);
          
          return { action: 'clickByText', clickText: action.clickText };

        case 'type':
          this.log(`Custom action: Typing "${action.text}" into ${action.selector}`);
          await this.actions!.type(action.selector, action.text, { clear: true });
          
          return { action: 'type', selector: action.selector, text: action.text };

        case 'navigate':
          this.log(`Custom action: Navigating to ${action.url}`);
          await this.currentPage!.goto(action.url);
          await this.actions!.waitForLoad();
          
          return { action: 'navigate', url: action.url };

        case 'extract':
          this.log(`Custom action: Extracting basic page data`);
          const basicData = {
            url: await this.currentPage!.url(),
            title: await this.currentPage!.title(),
            timestamp: new Date().toISOString()
          };
          
          return basicData;

        default:
          this.log(`Unknown custom action: ${action.action}`);
          return { action: 'unknown', reasoning: action.reasoning };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Custom task failed: ${errorMessage}`);
      return { error: errorMessage };
    }
  }

  private async initializeBrowser(): Promise<void> {
    if (this.browser) return;

    this.browser = new Browser(this.config.browserConfig);
    try {
      await this.browser.launch();
      this.log('Browser launched');
    } catch (error) {
      this.log(`Browser launch failed: ${error}`);
      throw error;
    }
  }

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

  private async getPageContext(): Promise<any> {
    const page = await this.getCurrentPage();
    
    return {
      url: await page.url(),
      title: await page.title()
    };
  }

  private async getPageContextWithScreenshots(): Promise<any> {
    const page = await this.getCurrentPage();
    
    const screenshot = await this.takeScreenshot('current-context');
    
    return {
      url: await page.url(),
      title: await page.title(),
      screenshots: screenshot ? [screenshot] : []
    };
  }

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

    this.log(`Final Summary: ${completedTasks.length}/${tasks.length} tasks completed`);
    return summary;
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.log('Browser closed');
    }
  }

  getTaskHistory(): Task[] {
    return this.taskHistory;
  }

  private log(message: string): void {
    if (this.config.debugMode) {
      console.log(`[AIAgent] ${message}`);
    }
  }
}
