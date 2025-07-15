// Main entry point for automation-ts-sdk
// Export all public APIs from here

export { Browser } from './browser/Browser';
export { BrowserActions } from './browser/actions/BrowserActions';

// Agent exports
export { AIAgent } from './agent/AIAgent';
export { ConversationalAgent } from './agent/ConversationalAgent';

// Types exports
export {
  // Browser types
  BrowserType,
  BrowserConfig,
  
  // Browser action types
  ClickOptions,
  TypeOptions,
  ScrollOptions,
  WaitOptions,
  ScreenshotOptions,
  ScreenshotFullPageOptions,
  TabInfo,
  TabManagementOptions,
  
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
