export function customTaskPrompt(task: any, pageContext: any): string {
  return `
You are controlling a browser. Here's the current situation:

Task: ${task.description}
Current page: ${pageContext.url}
Page title: ${pageContext.title}

Available elements (DOM Structure):
${pageContext.domSummary}

${pageContext.screenshot ? 
  `VISUAL CONTEXT: I have provided a screenshot of the current page state.

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
❌ {"action": "click", "selector": "* :contains(\"Login\")"}` : ''}

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
} 