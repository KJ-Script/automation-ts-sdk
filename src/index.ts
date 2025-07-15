// Main entry point for automation-ts-sdk
// Export all public APIs from here

export { Browser } from './browser/Browser';
export { BrowserActions } from './browser/actions/BrowserActions';
export { TabManager } from './browser/TabManager';

// Agent exports
export { AIAgent } from './agent/AIAgent';
export { ConversationalAgent } from './agent/ConversationalAgent';
export { MultiTabAgent } from './agent/MultiTabAgent';

// Types exports
export {
  // Browser types
  BrowserType,
  BrowserConfig,
  TabInfo,
  TabManagerConfig,
  ParallelTask,
  ParallelTaskResult,
  
  // Browser action types
  ClickOptions,
  TypeOptions,
  ScrollOptions,
  WaitOptions,
  ScreenshotOptions,
  ScreenshotFullPageOptions,
  
  // Agent types
  Task,
  AgentConfig,
  AgentResponse,
  
  // Conversational agent types
  ConversationMessage,
  ConversationContext
} from './types';

// Zod schemas exports (for AI response validation only)
export {
  AITaskResponseSchema,
  GoalAchievementSchema,
  CustomActionSchema,
  ActionDeterminationSchema
} from './schemas';
