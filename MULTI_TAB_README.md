# Multi-Tab Automation SDK

The Multi-Tab Automation SDK extends the existing automation capabilities to support parallel task execution across multiple browser tabs. This enables efficient automation workflows that can perform multiple tasks simultaneously.

## Features

- **Parallel Task Execution**: Execute multiple tasks simultaneously across different browser tabs
- **Tab Management**: Automatic creation, switching, and cleanup of browser tabs
- **Priority-based Scheduling**: Tasks can be prioritized for execution order
- **Concurrency Control**: Limit the number of concurrent tasks to manage system resources
- **Task Timeout**: Individual task timeout management
- **Tab Reuse**: Reuse existing tabs for related tasks
- **Comprehensive Monitoring**: Track task progress, duration, and results
- **Screenshot Support**: Automatic screenshots for each task execution

## Quick Start

### Basic Usage

```typescript
import { MultiTabAgent, ParallelTask } from 'automation-ts-sdk';

// Initialize the agent
const agent = new MultiTabAgent({
  apiKey: 'your-google-ai-api-key',
  browserConfig: {
    type: 'chrome',
    headless: false
  },
  maxConcurrentTasks: 3,
  debugMode: true
});

// Define parallel tasks
const tasks: ParallelTask[] = [
  {
    id: 'task-1',
    instruction: 'Go to Google and search for "automation tools"',
    priority: 3
  },
  {
    id: 'task-2',
    instruction: 'Go to GitHub and search for "web automation"',
    priority: 2
  },
  {
    id: 'task-3',
    instruction: 'Go to Stack Overflow and search for "testing frameworks"',
    priority: 1
  }
];

// Execute tasks in parallel
const result = await agent.executeParallel(tasks);

console.log(`Completed ${result.parallelResults.filter(r => r.success).length}/${tasks.length} tasks`);
```

### Advanced Usage with Tab Management

```typescript
// Create specific tabs for tasks
const tab1 = await browser.createTab('https://www.google.com');
const tab2 = await browser.createTab('https://www.github.com');

const tasks: ParallelTask[] = [
  {
    id: 'google-task',
    instruction: 'Search for "TypeScript automation"',
    tabId: tab1, // Use specific tab
    priority: 3
  },
  {
    id: 'github-task',
    instruction: 'Search for "automation libraries"',
    tabId: tab2, // Use specific tab
    priority: 2
  },
  {
    id: 'new-tab-task',
    instruction: 'Go to Stack Overflow and search for "web scraping"',
    // No tabId - will create new tab automatically
    priority: 1
  }
];
```

## API Reference

### MultiTabAgent

#### Constructor

```typescript
new MultiTabAgent(config: MultiTabAgentConfig)
```

**Configuration Options:**

- `apiKey` (required): Google AI API key
- `model` (optional): AI model to use (default: 'gemini-1.5-flash')
- `browserConfig` (optional): Browser configuration
- `tabManagerConfig` (optional): Tab management settings
- `maxConcurrentTasks` (optional): Maximum concurrent tasks (default: 5)
- `taskTimeout` (optional): Default task timeout in milliseconds (default: 60000)
- `debugMode` (optional): Enable debug logging (default: false)
- `enableScreenshots` (optional): Enable automatic screenshots (default: true)

#### Methods

##### `executeParallel(tasks: ParallelTask[]): Promise<MultiTabAgentResponse>`

Execute multiple tasks in parallel across different tabs.

**Parameters:**
- `tasks`: Array of parallel tasks to execute

**Returns:**
- `MultiTabAgentResponse` with results, tab statistics, and screenshots

##### `cleanup(): Promise<void>`

Clean up resources and close all browser tabs.

##### `getTaskHistory(): Task[]`

Get the history of executed tasks.

##### `getActiveTasksCount(): number`

Get the current number of active tasks.

##### `getTabStats()`

Get current tab statistics.

### ParallelTask Interface

```typescript
interface ParallelTask {
  id: string;                    // Unique task identifier
  instruction: string;           // Natural language instruction for the task
  tabId?: string;               // Specific tab to use (optional)
  priority?: number;            // Task priority (higher = higher priority)
  timeout?: number;             // Task timeout in milliseconds
  retries?: number;             // Number of retry attempts
}
```

### MultiTabAgentResponse Interface

```typescript
interface MultiTabAgentResponse extends AgentResponse {
  parallelResults: ParallelTaskResult[];
  tabStats: {
    totalTabs: number;
    activeTabId: string | null;
    oldestTab: string | null;
    newestTab: string | null;
  };
}
```

### ParallelTaskResult Interface

```typescript
interface ParallelTaskResult {
  taskId: string;               // Task identifier
  tabId: string;                // Tab used for the task
  success: boolean;             // Whether the task succeeded
  result: any;                  // Task execution result
  error?: string;               // Error message if failed
  duration: number;             // Task execution duration in milliseconds
  screenshots: string[];        // Screenshots taken during task execution
}
```

## Tab Management

### TabManager

The `TabManager` class handles all tab-related operations:

```typescript
import { TabManager } from 'automation-ts-sdk';

// Get tab manager from browser
const tabManager = browser.getTabManager();

// Create a new tab
const tabId = await tabManager.createTab('https://example.com');

// Navigate to URL
await tabManager.navigateTab(tabId, 'https://google.com');

// Switch to tab
await tabManager.switchToTab(tabId);

// Close tab
await tabManager.closeTab(tabId);

// Get tab information
const tab = tabManager.getTab(tabId);
console.log(`Tab ${tabId}: ${tab.url} - ${tab.title}`);

// Get all tabs
const allTabs = tabManager.getAllTabs();

// Execute function on specific tab
const result = await tabManager.executeOnTab(tabId, async (page) => {
  return await page.title();
});
```

### TabManagerConfig

```typescript
interface TabManagerConfig {
  maxTabs?: number;              // Maximum number of tabs (default: 10)
  defaultTimeout?: number;        // Default navigation timeout (default: 30000)
  autoCloseInactiveTabs?: boolean; // Auto-close inactive tabs (default: false)
  inactiveTabTimeout?: number;    // Inactive tab timeout in milliseconds (default: 300000)
}
```

## Best Practices

### 1. Task Design

- **Keep tasks focused**: Each task should have a single, clear objective
- **Use descriptive IDs**: Make task IDs meaningful for easier debugging
- **Set appropriate priorities**: Use priority to control execution order
- **Include timeouts**: Set reasonable timeouts for each task

### 2. Resource Management

- **Limit concurrency**: Don't set `maxConcurrentTasks` too high to avoid overwhelming the system
- **Monitor memory usage**: Close unused tabs to free up resources
- **Use task timeouts**: Prevent tasks from hanging indefinitely

### 3. Error Handling

```typescript
const result = await agent.executeParallel(tasks);

// Check for failed tasks
const failedTasks = result.parallelResults.filter(r => !r.success);
if (failedTasks.length > 0) {
  console.log('Failed tasks:', failedTasks.map(t => ({ id: t.taskId, error: t.error })));
}

// Retry failed tasks if needed
const retryTasks = failedTasks.map(failed => ({
  ...tasks.find(t => t.id === failed.taskId)!,
  retries: (tasks.find(t => t.id === failed.taskId)?.retries || 0) + 1
}));
```

### 4. Tab Reuse

```typescript
// Phase 1: Initial tasks
const initialTasks = [
  { id: 'research-1', instruction: 'Go to Google and search for "automation"', priority: 3 },
  { id: 'research-2', instruction: 'Go to GitHub and search for "testing"', priority: 3 }
];

const phase1Results = await agent.executeParallel(initialTasks);

// Phase 2: Use existing tabs for follow-up tasks
const followUpTasks = [
  {
    id: 'analyze-1',
    instruction: 'Extract the top 5 search results',
    tabId: phase1Results.parallelResults[0].tabId, // Reuse Google tab
    priority: 2
  },
  {
    id: 'analyze-2',
    instruction: 'Extract repository information',
    tabId: phase1Results.parallelResults[1].tabId, // Reuse GitHub tab
    priority: 2
  }
];
```

### 5. Monitoring and Debugging

```typescript
// Enable debug mode for detailed logging
const agent = new MultiTabAgent({
  // ... other config
  debugMode: true
});

// Monitor active tasks
setInterval(() => {
  const activeCount = agent.getActiveTasksCount();
  const tabStats = agent.getTabStats();
  console.log(`Active tasks: ${activeCount}, Total tabs: ${tabStats.totalTabs}`);
}, 5000);
```

## Examples

See the `examples/multi-tab-example.ts` file for comprehensive examples including:

- Basic parallel task execution
- Advanced tab management
- Coordinated multi-phase workflows
- Error handling and retry logic

## Performance Considerations

1. **Concurrency Limits**: Start with 2-3 concurrent tasks and adjust based on system performance
2. **Memory Usage**: Each tab consumes memory; monitor and close unused tabs
3. **Network Bandwidth**: Multiple tabs can generate significant network traffic
4. **AI API Limits**: Consider rate limits when using AI-powered task planning

## Troubleshooting

### Common Issues

1. **Task Timeouts**: Increase `taskTimeout` or check for slow-loading pages
2. **Memory Issues**: Reduce `maxConcurrentTasks` or enable `autoCloseInactiveTabs`
3. **Tab Creation Failures**: Check `maxTabs` limit and available system resources
4. **AI Planning Errors**: Verify API key and model availability

### Debug Mode

Enable debug mode to get detailed logging:

```typescript
const agent = new MultiTabAgent({
  // ... other config
  debugMode: true
});
```

This will log task creation, execution, completion, and error details. 