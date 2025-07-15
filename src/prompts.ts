export const PROMPTS = {
  PLAN_NEXT_TASK: `
You are a browser automation AI. You need to decide the NEXT SINGLE TASK to achieve this goal:

ORIGINAL GOAL: "{originalInstruction}"

CURRENT SITUATION:
{currentPageContext}

TASKS COMPLETED SO FAR:
{completedTasks}

{screenshotContext}

Based on the current page state, what should be the NEXT SINGLE TASK to progress toward the goal?

Respond with a JSON object for ONE task:
{
  "id": "task_{taskNumber}",
  "description": "Clear description of what to do next",
  "type": "navigate|click|clickByText|type|wait|extract|custom",
  "selector": "valid_css_selector_if_using_click_type",
  "clickText": "exact_text_if_using_clickByText_type",
  "text": "text_to_type_if_needed",
  "url": "url_if_navigate_needed",
  "reasoning": "Why this task makes sense given the visual context"
}

Task types:
- navigate: Go to a URL
- click: Click an element by CSS selector
- clickByText: Click an element by its visible text (PREFERRED for buttons/links)
- type: Type text into an input
- wait: Wait for elements or time
- extract: Extract data from page
- custom: Complex action requiring page analysis
- createTab: Create a new tab (optionally with URL)
- switchTab: Switch to a specific tab by index
- closeTab: Close the current tab
- openInNewTab: Open a URL in a new tab

IMPORTANT: When choosing elements to interact with, prefer elements that are clearly visible and have descriptive text. Use the interactive elements list to find the best targets.

TAB MANAGEMENT: Use tab operations when you need to:
- Work on multiple websites simultaneously
- Keep a reference page open while working on another
- Open links in new tabs to avoid losing current work
- Switch between different contexts or workflows

Only return the JSON object, no other text.
`,

  GOAL_ACHIEVED: `
You are evaluating if a browser automation goal has been achieved.

ORIGINAL GOAL: "{originalInstruction}"

CURRENT PAGE STATE:
{currentPageContext}

COMPLETED TASKS:
{completedTasks}

{screenshotContext}

Based on the original goal and current page state, has the goal been achieved?

Respond with a JSON object:
{
  "achieved": true/false,
  "reasoning": "Explanation of why the goal is or isn't achieved",
  "confidence": 0.0-1.0
}

Only return the JSON object, no other text.
`,

  CUSTOM_TASK: `
You are controlling a browser. Here's the current situation:

Task: {taskDescription}
Current page: {currentUrl}
Page title: {pageTitle}

{screenshotContext}

What specific action should I take? Respond with a JSON object:
{
  "action": "click|clickByText|type|navigate|extract",
  "selector": "valid_css_selector_if_using_click",
  "clickText": "exact_text_if_using_clickByText",
  "text": "text_to_type_if_needed", 
  "url": "url_if_navigate",
  "reasoning": "why_this_action_makes_sense"
}
`,

  DETERMINE_ACTION_NEEDED: `
You are an AI assistant that can control a browser. Determine if this user message requires browser automation action or if it's just a conversational question.

User message: "{message}"

Current context:
- Current page: {currentUrl}
- Page title: {pageTitle}

Return only "ACTION" if browser automation is needed, or "CONVERSATION" if it's just a question or chat.

Examples:
- "Go to Google" -> ACTION
- "Click the login button" -> ACTION  
- "Extract data from this page" -> ACTION
- "What did you find on the last page?" -> CONVERSATION
- "How are you?" -> CONVERSATION
- "What can you do?" -> CONVERSATION
`,

  CONVERSATIONAL_RESPONSE: `
You are a helpful AI assistant that just performed browser automation. Generate a natural, conversational response about what you did.

User asked: "{userMessage}"

What you did:
- Completed {completedTasks}/{totalTasks} tasks
- Tasks: {taskDescriptions}
- Current page: {currentUrl}
- Page title: {pageTitle}

Previous conversation:
{conversationContext}

Generate a friendly, informative response about what you accomplished. Be conversational and helpful.
Don't just list what you did - explain it naturally like you're talking to a friend.
`,

  CONTEXTUAL_RESPONSE: `
You are a helpful AI assistant that can control browsers and automate web interactions. 
You're having a conversation with a user.

User message: "{message}"

Current context:
- Current page: {currentUrl}
- Page title: {pageTitle}

Previous conversation:
{conversationContext}

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
`,

  ANALYZE_CURRENT_PAGE: `
Analyze this web page and provide insights:

URL: {currentUrl}
Title: {pageTitle}

Provide a helpful analysis of what's on this page, what actions are possible, and any interesting insights.
`,

  GET_SUGGESTIONS: `
Based on the current context, suggest 3-5 helpful actions the user could take:

Current page: {currentUrl}
Page title: {pageTitle}

Return a JSON array of suggestion strings. Each suggestion should be a natural language instruction.
Example: ["Click the login button", "Extract data from the table", "Navigate to the homepage"]
`,

  SCREENSHOT_INTERACTION_CONTEXT: `
VISUAL CONTEXT: I have provided a screenshot of the current page state.

CRITICAL INSTRUCTION FOR ELEMENT INTERACTION:
1. First, analyze the SCREENSHOT to visually identify what you want to click/type
2. Choose the BEST interaction method:

OPTION A - Click by Text (PREFERRED for buttons/links with visible text):
- Use type: "clickByText" 
- Set clickText: "exact text visible on the element"
- This is MORE RELIABLE than CSS selectors

OPTION B - Click by CSS Selector:
- Use type: "click"
- Generate a VALID CSS SELECTOR based on common web patterns
- Use standard CSS selectors like: #id, .class, tag[attribute="value"], tag:nth-child(n)

Examples of VALID approaches:
- {"type": "clickByText", "clickText": "Next"}
- {"type": "clickByText", "clickText": "Sign In"}
- {"type": "click", "selector": "button#submit-btn"}
- {"type": "click", "selector": "input[type=\"email\"]"}
- {"type": "click", "selector": ".login-form button"}`,

  CUSTOM_TASK_SCREENSHOT_CONTEXT: `
VISUAL CONTEXT: I have provided screenshots of the current page state.

Choose the BEST interaction method:

OPTION A - Click by Text (PREFERRED for buttons/links with visible text):
- Use action: "clickByText"
- Set clickText: "exact text visible on the element"

OPTION B - Click by CSS Selector:
- Use action: "click"
- Generate a VALID CSS SELECTOR based on common web patterns

Examples:
- {"action": "clickByText", "clickText": "Next"}
- {"action": "clickByText", "clickText": "Sign In"}
- {"action": "click", "selector": "button#submit-btn"}
- {"action": "click", "selector": "input[type=\"email\"]"}`
};

export function formatPrompt(template: string, variables: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
} 