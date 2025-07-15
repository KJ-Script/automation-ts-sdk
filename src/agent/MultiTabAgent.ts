import { GoogleGenerativeAI } from '@google/generative-ai';
import { Browser } from '../browser/Browser';
import { BrowserActions } from '../browser/actions/BrowserActions';
import { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { PROMPTS, formatPrompt } from '../prompts';
import { 
  Task, 
  AgentConfig, 
  AgentResponse,
  ParallelTask,
  ParallelTaskResult,
  TabManagerConfig
} from '../types/agent';
import {
  AITaskResponseSchema,
  GoalAchievementSchema,
  CustomActionSchema
} from '../schemas/agent';
import { BrowserConfig } from '../types/browser';

export interface MultiTabAgentConfig extends AgentConfig {
  tabManagerConfig?: TabManagerConfig;
  maxConcurrentTasks?: number;
  taskTimeout?: number;
}

export interface MultiTabAgentResponse extends AgentResponse {
  parallelResults: ParallelTaskResult[];
  tabStats: {
    totalTabs: number;
    activeTabId: string | null;
    oldestTab: string | null;
    newestTab: string | null;
  };
}

export class MultiTabAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private browser: Browser | null = null;
  private config: {
    apiKey: string;
    model: string;
    browserConfig: BrowserConfig;
    tabManagerConfig: TabManagerConfig;
    maxRetries: number;
    debugMode: boolean;
    screenshotDir: string;
    enableScreenshots: boolean;
    maxConcurrentTasks: number;
    taskTimeout: number;
  };
  private taskHistory: Task[] = [];
  private screenshotCounter: number = 0;
  private allScreenshots: string[] = [];
  private activeTasks: Map<string, Promise<ParallelTaskResult>> = new Map();

  constructor(config: MultiTabAgentConfig) {
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
      tabManagerConfig: config.tabManagerConfig || {
        maxTabs: 10,
        defaultTimeout: 30000,
        autoCloseInactiveTabs: false,
        inactiveTabTimeout: 300000
      },
      maxRetries: config.maxRetries || 3,
      debugMode: config.debugMode || false,
      screenshotDir: config.screenshotDir || './screenshots',
      enableScreenshots: config.enableScreenshots ?? true,
      maxConcurrentTasks: config.maxConcurrentTasks || 5,
      taskTimeout: config.taskTimeout || 60000
    };
    
    this.model = this.genAI.getGenerativeModel({ model: this.config.model });
    
    if (this.config.enableScreenshots && !fs.existsSync(this.config.screenshotDir)) {
      fs.mkdirSync(this.config.screenshotDir, { recursive: true });
    }
  }

  /**
   * Execute multiple tasks in parallel across different tabs
   */
  async executeParallel(tasks: ParallelTask[]): Promise<MultiTabAgentResponse> {
    try {
      this.log(`MultiTab Agent received ${tasks.length} parallel tasks`);
      this.taskHistory = [];
      
      await this.initializeBrowser();
      this.log('Browser initialized with multi-tab support');

      // Sort tasks by priority (higher priority first)
      const sortedTasks = [...tasks].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      const results: ParallelTaskResult[] = [];
      const taskPromises: Promise<ParallelTaskResult>[] = [];

      // Process tasks with concurrency limit
      for (const task of sortedTasks) {
        // Wait if we've reached the concurrency limit
        while (this.activeTasks.size >= this.config.maxConcurrentTasks) {
          await this.waitForTaskCompletion();
        }

        // Execute task
        const taskPromise = this.executeSingleTask(task);
        this.activeTasks.set(task.id, taskPromise);
        taskPromises.push(taskPromise);
      }

      // Wait for all tasks to complete
      const taskResults = await Promise.allSettled(taskPromises);
      
      for (let i = 0; i < taskResults.length; i++) {
        const result = taskResults[i];
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Handle rejected tasks
          const task = sortedTasks[i];
          results.push({
            taskId: task.id,
            tabId: task.tabId || 'unknown',
            success: false,
            result: null,
            error: result.reason?.message || 'Task failed',
            duration: 0,
            screenshots: []
          });
        }
      }

      const successfulTasks = results.filter(r => r.success);
      const failedTasks = results.filter(r => !r.success);

      return {
        success: successfulTasks.length > 0,
        message: `Completed ${successfulTasks.length}/${tasks.length} tasks successfully. ${failedTasks.length} failed.`,
        tasks: this.taskHistory,
        finalResult: {
          successfulTasks: successfulTasks.length,
          failedTasks: failedTasks.length,
          totalTasks: tasks.length,
          results
        },
        screenshots: this.allScreenshots,
        parallelResults: results,
        tabStats: this.browser!.getTabStats()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`MultiTab Agent execution failed: ${errorMessage}`);
      return {
        success: false,
        message: `MultiTab Agent execution failed: ${errorMessage}`,
        tasks: this.taskHistory,
        finalResult: null,
        parallelResults: [],
        tabStats: this.browser?.getTabStats() || {
          totalTabs: 0,
          activeTabId: null,
          oldestTab: null,
          newestTab: null
        }
      };
    }
  }

  /**
   * Execute a single task on a specific tab
   */
  private async executeSingleTask(task: ParallelTask): Promise<ParallelTaskResult> {
    const startTime = Date.now();
    let tabId = task.tabId;
    let screenshots: string[] = [];

    try {
      this.log(`Starting task: ${task.id} - ${task.instruction}`);

      // Create new tab if not specified
      if (!tabId) {
        tabId = await this.browser!.createTab();
        this.log(`Created new tab ${tabId} for task ${task.id}`);
      }

      // Execute the task with timeout
      const taskPromise = this.executeTaskOnTab(tabId, task.instruction);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), task.timeout || this.config.taskTimeout);
      });

      const result = await Promise.race([taskPromise, timeoutPromise]);
      screenshots = await this.takeScreenshotsForTab(tabId, task.id);

      const duration = Date.now() - startTime;
      this.log(`Task ${task.id} completed successfully in ${duration}ms`);

      return {
        taskId: task.id,
        tabId,
        success: true,
        result,
        duration,
        screenshots
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Task ${task.id} failed: ${errorMessage}`);

      return {
        taskId: task.id,
        tabId: tabId || 'unknown',
        success: false,
        result: null,
        error: errorMessage,
        duration,
        screenshots
      };
    } finally {
      this.activeTasks.delete(task.id);
    }
  }

  /**
   * Execute a task on a specific tab
   */
  private async executeTaskOnTab(tabId: string, instruction: string): Promise<any> {
    const page = this.browser!.getTabPage(tabId);
    const actions = new BrowserActions(page);
    
    // Get current page context
    const pageContext = await this.getPageContext(page);
    
    // Plan and execute the task
    const task = await this.planTaskForTab(instruction, pageContext);
    return await this.executeTaskOnPage(page, actions, task);
  }

  /**
   * Plan a task for a specific tab
   */
  private async planTaskForTab(instruction: string, pageContext: any): Promise<Task> {
    const textPrompt = formatPrompt(PROMPTS.PLAN_NEXT_TASK, {
      originalInstruction: instruction,
      currentPageContext: pageContext ? `
- Current URL: ${pageContext.url}
- Page Title: ${pageContext.title}
` : '- No page loaded yet (need to start)',
      completedTasks: '- None yet',
      screenshotContext: pageContext?.screenshot ? PROMPTS.SCREENSHOT_INTERACTION_CONTEXT : '',
      taskNumber: 1
    });

    const screenshots: string[] = [];
    if (pageContext?.screenshot) {
      screenshots.push(pageContext.screenshot);
    }

    const multimodalPrompt = await this.createMultimodalPrompt(textPrompt, screenshots);
    const result = await this.model.generateContent(multimodalPrompt);
    const response = result.response.text();
    
    const taskJson = response.trim().replace(/```json\n?|\n?```/g, '');
    const parsedTask = JSON.parse(taskJson);
    
    // Validate AI response with Zod
    const validatedTask = AITaskResponseSchema.parse(parsedTask);
    
    return {
      id: validatedTask.id || `task_${Date.now()}`,
      description: validatedTask.description,
      type: validatedTask.type,
      parameters: validatedTask.parameters || {},
      reasoning: validatedTask.reasoning,
      completed: false
    };
  }

  /**
   * Execute a task on a specific page
   */
  private async executeTaskOnPage(page: Page, actions: BrowserActions, task: Task): Promise<any> {
    const params = task.parameters || {};
    
    switch (task.type) {
      case 'navigate':
        await actions.goto(params.url);
        return { url: params.url };

      case 'click':
        await actions.click(params.selector, params.options);
        return { clicked: params.selector };

      case 'type':
        await actions.type(params.selector, params.text, params.options);
        return { typed: params.text };

      case 'wait':
        await actions.wait(params.milliseconds);
        return { waited: params.milliseconds };

      case 'screenshot':
        const screenshot = await actions.screenshot(params.options);
        return { screenshot: 'taken' };

      case 'custom':
        return await this.handleCustomTask(task);

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Wait for at least one task to complete
   */
  private async waitForTaskCompletion(): Promise<void> {
    if (this.activeTasks.size === 0) return;
    
    await Promise.race(this.activeTasks.values());
  }

  /**
   * Take screenshots for a specific tab
   */
  private async takeScreenshotsForTab(tabId: string, taskId: string): Promise<string[]> {
    if (!this.config.enableScreenshots) return [];

    try {
      const page = this.browser!.getTabPage(tabId);
      this.screenshotCounter++;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `tab-${tabId}-task-${taskId}-${this.screenshotCounter}-${timestamp}.png`;
      const filepath = path.join(this.config.screenshotDir, filename);
      
      await page.screenshot({ path: filepath, fullPage: true });
      
      if (fs.existsSync(filepath)) {
        this.allScreenshots.push(filepath);
        return [filepath];
      }
    } catch (error) {
      this.log(`Failed to take screenshot for tab ${tabId}: ${error}`);
    }
    return [];
  }

  /**
   * Get page context for a specific page
   */
  private async getPageContext(page: Page): Promise<any> {
    try {
      const url = page.url();
      const title = await page.title();
      
      return {
        url,
        title,
        screenshot: null // Will be added if screenshots are enabled
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Create multimodal prompt
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
   * Convert screenshot to base64
   */
  private async screenshotToBase64(filepath: string): Promise<string | null> {
    try {
      const buffer = fs.readFileSync(filepath);
      return buffer.toString('base64');
    } catch (error) {
      this.log(`Failed to convert screenshot to base64: ${error}`);
      return null;
    }
  }

  /**
   * Handle custom tasks
   */
  private async handleCustomTask(task: Task): Promise<any> {
    // Implement custom task handling logic here
    return { custom: task.parameters };
  }

  /**
   * Initialize browser
   */
  private async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = new Browser(this.config.browserConfig);
      await this.browser.launch();
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Wait for all active tasks to complete
    if (this.activeTasks.size > 0) {
      this.log(`Waiting for ${this.activeTasks.size} active tasks to complete...`);
      await Promise.allSettled(this.activeTasks.values());
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get task history
   */
  getTaskHistory(): Task[] {
    return this.taskHistory;
  }

  /**
   * Get active tasks count
   */
  getActiveTasksCount(): number {
    return this.activeTasks.size;
  }

  /**
   * Get tab statistics
   */
  getTabStats() {
    return this.browser?.getTabStats() || {
      totalTabs: 0,
      activeTabId: null,
      oldestTab: null,
      newestTab: null
    };
  }

  /**
   * Log message if debug mode is enabled
   */
  private log(message: string): void {
    if (this.config.debugMode) {
      console.log(`[MultiTabAgent] ${message}`);
    }
  }
} 