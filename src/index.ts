// Main entry point for automation-ts-sdk
// Export all public APIs from here

export { Browser, BrowserType, BrowserConfig } from './browser/Browser';
export { 
  BrowserActions, 
  ClickOptions, 
  TypeOptions, 
  ScrollOptions, 
  WaitOptions, 
  ScreenshotOptions 
} from './browser/actions/BrowserActions';

// Agent exports
export {
  AIAgent,
  Task,
  AgentConfig,
  AgentResponse
} from './agent/AIAgent';

export {
  ConversationalAgent,
  ConversationMessage,
  ConversationContext
} from './agent/ConversationalAgent';
