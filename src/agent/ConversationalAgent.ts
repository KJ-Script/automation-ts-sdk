import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIAgent, AgentConfig, Task, AgentResponse } from './AIAgent';
import { Page } from 'playwright';

export interface ConversationMessage {
  id: string;
  timestamp: Date;
  role: 'user' | 'assistant';
  content: string;
  tasks?: Task[];
  results?: any;
}

export interface ConversationContext {
  currentUrl?: string;
  currentPageTitle?: string;
  lastScreenshot?: string;
}

export class ConversationalAgent extends AIAgent {
  private conversationHistory: ConversationMessage[] = [];
  private context: ConversationContext = {};
  private conversationModel: any;

  constructor(config: AgentConfig) {
    super(config);
    this.conversationModel = new GoogleGenerativeAI(config.apiKey).getGenerativeModel({ 
      model: config.model || 'gemini-1.5-flash'
    });
  }

  async chat(userMessage: string): Promise<{
    response: string;
    agentResponse?: AgentResponse;
    context: ConversationContext;
  }> {
    try {
      const userMsgId = `user_${Date.now()}`;
      this.conversationHistory.push({
        id: userMsgId,
        timestamp: new Date(),
        role: 'user',
        content: userMessage
      });

      await this.updateContext();

      const needsAction = await this.determineIfActionNeeded(userMessage);

      if (needsAction) {
        const agentResponse = await this.execute(userMessage);
        const response = await this.generateConversationalResponse(userMessage, agentResponse);
        
        this.conversationHistory.push({
          id: `assistant_${Date.now()}`,
          timestamp: new Date(),
          role: 'assistant',
          content: response,
          tasks: agentResponse.tasks,
          results: agentResponse.finalResult
        });

        return {
          response,
          agentResponse,
          context: this.context
        };
      } else {
        const response = await this.generateContextualResponse(userMessage);
        
        this.conversationHistory.push({
          id: `assistant_${Date.now()}`,
          timestamp: new Date(),
          role: 'assistant',
          content: response
        });

        return {
          response,
          context: this.context
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorResponse = `I encountered an error: ${errorMessage}. Could you try rephrasing your request?`;
      
      this.conversationHistory.push({
        id: `assistant_error_${Date.now()}`,
        timestamp: new Date(),
        role: 'assistant',
        content: errorResponse
      });

      return {
        response: errorResponse,
        context: this.context
      };
    }
  }

  private async determineIfActionNeeded(message: string): Promise<boolean> {
    const prompt = `
You are an AI assistant that can control a browser. Determine if this user message requires browser automation action or if it's just a conversational question.

User message: "${message}"

Current context:
- Current page: ${this.context.currentUrl || 'No page loaded'}
- Page title: ${this.context.currentPageTitle || 'N/A'}

Return only "ACTION" if browser automation is needed, or "CONVERSATION" if it's just a question or chat.

Examples:
- "Go to Google" -> ACTION
- "Click the login button" -> ACTION  
- "Extract data from this page" -> ACTION
- "What did you find on the last page?" -> CONVERSATION
- "How are you?" -> CONVERSATION
- "What can you do?" -> CONVERSATION
`;

    try {
      const result = await this.conversationModel.generateContent(prompt);
      const response = result.response.text().trim().toUpperCase();
      return response.includes('ACTION');
    } catch (error) {
      return true;
    }
  }

  private async generateConversationalResponse(userMessage: string, agentResponse: AgentResponse): Promise<string> {
    const conversationContext = this.getConversationContext();
    
    const prompt = `
You are a helpful AI assistant that just performed browser automation. Generate a natural, conversational response about what you did.

User asked: "${userMessage}"

What you did:
- Completed ${agentResponse.tasks.filter(t => t.completed).length}/${agentResponse.tasks.length} tasks
- Tasks: ${agentResponse.tasks.map(t => `${t.description} (${t.completed ? 'completed' : 'failed'})`).join(', ')}
- Current page: ${this.context.currentUrl}
- Page title: ${this.context.currentPageTitle}

Previous conversation:
${conversationContext}

Generate a friendly, informative response about what you accomplished. Be conversational and helpful.
Don't just list what you did - explain it naturally like you're talking to a friend.
`;

    try {
      const result = await this.conversationModel.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      return `I ${agentResponse.success ? 'successfully' : 'attempted to'} ${userMessage.toLowerCase()}. ${agentResponse.message}`;
    }
  }

  private async generateContextualResponse(message: string): Promise<string> {
    const conversationContext = this.getConversationContext();
    
    const prompt = `
You are a helpful AI assistant that can control browsers and automate web interactions. 
You're having a conversation with a user.

User message: "${message}"

Current context:
- Current page: ${this.context.currentUrl || 'No page loaded'}
- Page title: ${this.context.currentPageTitle || 'N/A'}

Previous conversation:
${conversationContext}

Your capabilities include:
- Navigating to websites
- Clicking buttons and links  
- Filling out forms
- Extracting data from pages
- Taking screenshots
- Analyzing page content

Respond naturally and helpfully. If they ask what you can do, explain your browser automation capabilities.
If they ask about the current page, use the context information.
Be friendly and conversational.
`;

    try {
      const result = await this.conversationModel.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      return "I'm here to help you automate browser tasks! I can navigate websites, click buttons, fill forms, extract data, and more. What would you like me to do?";
    }
  }

  private async updateContext(): Promise<void> {
    try {
      const page = await this.getCurrentPage();
      if (page) {
        this.context.currentUrl = page.url();
        this.context.currentPageTitle = await page.title();
      }
    } catch (error) {
      // Context update failed, continue without it
    }
  }

  private getConversationContext(): string {
    const lastFewMessages = this.conversationHistory.slice(-6);
    return lastFewMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
  }

  getConversationHistory(): ConversationMessage[] {
    return this.conversationHistory;
  }

  clearConversation(): void {
    this.conversationHistory = [];
    this.context = {};
  }

  getCurrentContext(): ConversationContext {
    return this.context;
  }

  async analyzeCurrentPage(): Promise<string> {
    await this.updateContext();
    
    if (!this.context.currentUrl) {
      return "No page is currently loaded. Navigate to a website first.";
    }

    const prompt = `
Analyze this web page and provide insights:

URL: ${this.context.currentUrl}
Title: ${this.context.currentPageTitle}

Provide a helpful analysis of what's on this page, what actions are possible, and any interesting insights.
`;

    try {
      const result = await this.conversationModel.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      return `I can see the page "${this.context.currentPageTitle}" at ${this.context.currentUrl}, but I couldn't analyze it in detail.`;
    }
  }

  async getSuggestions(): Promise<string[]> {
    const prompt = `
Based on the current context, suggest 3-5 helpful actions the user could take:

Current page: ${this.context.currentUrl || 'No page loaded'}
Page title: ${this.context.currentPageTitle || 'N/A'}

Return a JSON array of suggestion strings. Each suggestion should be a natural language instruction.
Example: ["Click the login button", "Extract data from the table", "Navigate to the homepage"]
`;

    try {
      const result = await this.conversationModel.generateContent(prompt);
      const response = result.response.text().trim().replace(/```json\n?|\n?```/g, '');
      return JSON.parse(response);
    } catch (error) {
      return [
        "Navigate to a website",
        "Extract data from the current page", 
        "Take a screenshot",
        "Analyze the page content"
      ];
    }
  }
}
