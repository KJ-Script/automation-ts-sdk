// Main entry point for automation-ts-sdk
// Export all public APIs from here

export { AutomationBrowser, BrowserType, BrowserConfig } from './browser/AutomationBrowser';
export { DomExtractor, DomNode, DomExtractionOptions } from './dom/DomExtractor';
export { 
  BrowserActions, 
  ClickOptions, 
  TypeOptions, 
  ScrollOptions, 
  WaitOptions, 
  ScreenshotOptions 
} from './browser/actions/BrowserActions';
export {
  DataExtractor,
  ExtractionRule,
  ExtractionOptions,
  ExtractedData
} from './dom/DataExtractor';

// AI Agent exports
export {
  AIAgent,
  Task,
  AgentConfig,
  AgentResponse
} from './ai/AIAgent';

export {
  ConversationalAgent,
  ConversationMessage,
  ConversationContext
} from './ai/ConversationalAgent'; 