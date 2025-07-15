# Session Persistence

The automation SDK now supports session persistence, allowing you to save and restore browser sessions including cookies, localStorage, and sessionStorage data. This is particularly useful for maintaining login states across browser restarts.

## Features

- **Cookie Persistence**: Save and restore all cookies from websites
- **LocalStorage Persistence**: Maintain localStorage data across sessions
- **SessionStorage Persistence**: Preserve sessionStorage data
- **Multiple Sessions**: Create and manage multiple named sessions
- **Automatic Saving**: Sessions are automatically saved when the browser closes
- **Session Management**: List, delete, and inspect sessions

## Configuration

### Basic Session Configuration

```typescript
import { AIAgent, SessionConfig } from 'automation-ts-sdk';

const sessionConfig: SessionConfig = {
  enabled: true,                    // Enable session management
  sessionDir: './sessions',         // Directory to store session files
  sessionName: 'my-session',        // Default session name
  persistCookies: true,             // Save cookies
  persistLocalStorage: true,        // Save localStorage
  persistSessionStorage: true       // Save sessionStorage
};

const agent = new AIAgent({
  apiKey: 'your-api-key',
  browserConfig: {
    type: 'chrome',
    headless: false,
    session: sessionConfig
  },
  sessionName: 'my-session',        // Session name for this agent instance
  debugMode: true
});
```

### Session Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | false | Enable session management |
| `sessionDir` | string | './sessions' | Directory to store session files |
| `sessionName` | string | undefined | Default session name |
| `persistCookies` | boolean | true | Save and restore cookies |
| `persistLocalStorage` | boolean | true | Save and restore localStorage |
| `persistSessionStorage` | boolean | true | Save and restore sessionStorage |

## Usage Examples

### Basic Session Management

```typescript
// Create agent with session management
const agent = new AIAgent({
  apiKey: 'your-api-key',
  browserConfig: {
    type: 'chrome',
    session: {
      enabled: true,
      sessionDir: './sessions',
      persistCookies: true,
      persistLocalStorage: true,
      persistSessionStorage: true
    }
  },
  sessionName: 'github-session'
});

// Navigate and perform login
await agent.execute('Navigate to https://github.com');
await agent.execute('Click the Sign in button');
await agent.execute('Type my username in the username field');
await agent.execute('Type my password in the password field');
await agent.execute('Click the Sign in button');

// Save the session (automatically done on cleanup, but can be done manually)
await agent.saveSession('github-session');

// Later, restore the session
await agent.loadSession('github-session');
await agent.execute('Navigate to https://github.com');
// You should now be logged in!
```

### Multiple Sessions

```typescript
// Create separate sessions for different sites
const sites = [
  { name: 'github', url: 'https://github.com' },
  { name: 'stackoverflow', url: 'https://stackoverflow.com' },
  { name: 'twitter', url: 'https://twitter.com' }
];

for (const site of sites) {
  // Check if session exists
  if (agent.sessionExists(site.name)) {
    console.log(`Loading existing session for ${site.name}`);
    await agent.loadSession(site.name);
  } else {
    console.log(`Creating new session for ${site.name}`);
  }
  
  // Navigate and perform actions
  await agent.execute(`Navigate to ${site.url}`);
  // ... perform login or other actions
  
  // Save the session
  await agent.saveSession(site.name);
}
```

### Session Management Methods

```typescript
// List all available sessions
const sessions = agent.listSessions();
console.log('Available sessions:', sessions);

// Check if a session exists
if (agent.sessionExists('my-session')) {
  console.log('Session exists!');
}

// Get session information
const sessionInfo = agent.getSessionInfo('my-session');
console.log('Session created:', sessionInfo?.timestamp);
console.log('Cookies saved:', sessionInfo?.cookies.length);
console.log('LocalStorage items:', Object.keys(sessionInfo?.localStorage || {}).length);

// Delete a session
const deleted = agent.deleteSession('old-session');
console.log('Session deleted:', deleted);

// Get current session name
const currentSession = agent.getCurrentSessionName();
console.log('Current session:', currentSession);

// Check if session management is enabled
const enabled = agent.isSessionManagementEnabled();
console.log('Session management enabled:', enabled);
```

## Session File Format

Sessions are stored as JSON files in the configured session directory. Each session file contains:

```json
{
  "cookies": [
    {
      "name": "session_id",
      "value": "abc123",
      "domain": ".example.com",
      "path": "/",
      "expires": 1234567890,
      "httpOnly": true,
      "secure": true,
      "sameSite": "Lax"
    }
  ],
  "localStorage": {
    "user_preference": "dark_mode",
    "auth_token": "xyz789"
  },
  "sessionStorage": {
    "temp_data": "some_value"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sessionName": "my-session"
}
```

## Best Practices

### 1. Use Descriptive Session Names

```typescript
// Good: Descriptive session names
await agent.saveSession('github-work-account');
await agent.saveSession('github-personal-account');
await agent.saveSession('stackoverflow-developer');

// Avoid: Generic names
await agent.saveSession('session1');
await agent.saveSession('test');
```

### 2. Organize Sessions by Purpose

```typescript
// Group sessions by website or purpose
const sessionGroups = {
  social: ['twitter-personal', 'linkedin-work'],
  development: ['github-work', 'stackoverflow', 'npm'],
  shopping: ['amazon', 'ebay']
};
```

### 3. Regular Session Cleanup

```typescript
// Clean up old or unused sessions
const sessions = agent.listSessions();
const oldSessions = sessions.filter(name => {
  const info = agent.getSessionInfo(name);
  const age = Date.now() - new Date(info?.timestamp || 0).getTime();
  return age > 30 * 24 * 60 * 60 * 1000; // 30 days
});

oldSessions.forEach(sessionName => {
  agent.deleteSession(sessionName);
  console.log(`Deleted old session: ${sessionName}`);
});
```

### 4. Error Handling

```typescript
try {
  await agent.loadSession('my-session');
} catch (error) {
  console.log('Failed to load session, starting fresh');
  // Handle the case where session loading fails
}

// Always save session after important operations
try {
  await agent.execute('Perform login');
  await agent.saveSession('my-session');
} catch (error) {
  console.error('Failed to save session:', error);
}
```

## Security Considerations

1. **Session files contain sensitive data**: Cookies and storage data may include authentication tokens, passwords, or other sensitive information.

2. **Secure storage**: Store session files in a secure location with appropriate file permissions.

3. **Regular cleanup**: Delete old sessions that are no longer needed.

4. **Environment isolation**: Use different session directories for different environments (development, staging, production).

## Troubleshooting

### Session Not Loading

```typescript
// Check if session management is enabled
if (!agent.isSessionManagementEnabled()) {
  console.log('Session management is not enabled');
}

// Check if session file exists
if (!agent.sessionExists('my-session')) {
  console.log('Session file does not exist');
}

// Check session file permissions
const sessionInfo = agent.getSessionInfo('my-session');
if (!sessionInfo) {
  console.log('Failed to read session file');
}
```

### Session Data Not Persisting

```typescript
// Ensure session is saved after important operations
await agent.execute('Perform login');
await agent.saveSession('my-session'); // Explicit save

// Check session configuration
const config = agent.browserConfig?.session;
console.log('Session config:', config);
```

### Browser Compatibility

Session persistence works with all supported browsers (Chrome, Firefox, Safari), but some websites may have additional security measures that prevent session restoration.

## API Reference

### AIAgent Session Methods

- `saveSession(sessionName?: string): Promise<void>`
- `loadSession(sessionName: string): Promise<boolean>`
- `sessionExists(sessionName: string): boolean`
- `listSessions(): string[]`
- `deleteSession(sessionName: string): boolean`
- `getSessionInfo(sessionName: string): SessionData | null`
- `getCurrentSessionName(): string | null`
- `isSessionManagementEnabled(): boolean`

### Types

- `SessionConfig`: Configuration for session management
- `SessionData`: Structure of saved session data 