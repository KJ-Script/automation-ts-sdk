# Reddit Sign-In Automation Example

## 🎯 Overview

This example demonstrates how to automate the Reddit sign-in process using our browser automation SDK. It showcases:

1. **Navigation** - Going to Reddit.com
2. **Element Discovery** - Finding the sign-in button with multiple selector strategies
3. **Form Interaction** - Filling username and password fields
4. **Error Handling** - Robust handling of different UI variations
5. **Screenshots** - Capturing the automation process

## 🚀 Quick Start

Run the Reddit automation example:

```bash
npm run reddit
```

## 📋 What the Automation Does

### Step 1: Navigation
- Launches Chrome browser (visible by default)
- Navigates to https://www.reddit.com
- Takes a screenshot of the homepage

### Step 2: Find Sign-In Button
The script uses multiple strategies to find the login button:
- `a[href*="login"]` - Direct login link
- `button[data-testid*="login"]` - Test ID based button
- `button:has-text("Log In")` - Button with "Log In" text
- `a:has-text("Log In")` - Link with "Log In" text
- And more fallback selectors...

### Step 3: Generate Random Credentials
Creates random username and password:
- **Username**: Random combination like "CoolTiger1234"
- **Password**: Random secure password like "TempPass123456!"

### Step 4: Fill Login Form
Tries multiple selectors for form fields:
- Username: `input[name="username"]`, `input[id*="username"]`, etc.
- Password: `input[type="password"]`, `input[name="password"]`, etc.

### Step 5: Submit Form
Attempts to click the sign-in button with various selectors:
- `button[type="submit"]`
- `button:has-text("Log In")`
- `button:has-text("Sign In")`
- Falls back to pressing Enter if button not found

### Step 6: Handle Response
- Takes screenshot of the result
- Checks for error messages
- Analyzes the current URL to determine success/failure

## 📸 Generated Screenshots

The automation creates these screenshots:
- `reddit-homepage.png` - Reddit homepage
- `reddit-login-page.png` - Login form page
- `reddit-signin-result.png` - Result after sign-in attempt
- `reddit-error.png` - Error screenshot (if automation fails)

## 🔧 Configuration

### Running in Background (Headless)
```typescript
const browser = new AutomationBrowser({
  type: 'chrome',
  headless: true, // Set to true for background execution
  viewport: { width: 1400, height: 900 }
});
```

### Different Browser Types
```typescript
// Use Firefox instead of Chrome
const browser = new AutomationBrowser({
  type: 'firefox',
  headless: false
});

// Use Safari (macOS only)
const browser = new AutomationBrowser({
  type: 'safari',
  headless: false
});
```

## 🛡️ Robust Design Features

### Multiple Selector Strategies
The example demonstrates how to handle websites that might change their UI:

```typescript
const loginSelectors = [
  'a[href*="login"]',           // Direct login link
  'button[data-testid*="login"]', // Test ID based button
  'button:has-text("Log In")',   // Button with "Log In" text
  'a:has-text("Log In")',        // Link with "Log In" text
  '[data-click-id="login"]',     // Data click ID
  'button[data-click-id="login"]' // Button with data click ID
];

for (const selector of loginSelectors) {
  try {
    await actions.waitForElement(selector, { timeout: 3000 });
    if (await actions.isVisible(selector)) {
      // Found it! Use this selector
      break;
    }
  } catch (error) {
    // Try next selector
  }
}
```

### Error Recovery
- Graceful fallbacks when elements aren't found
- Alternative text-based element discovery
- Screenshot capture on errors for debugging

### Expected Behavior
⚠️ **Note**: Since random credentials are used, the login will fail with an error message. This is expected behavior for testing purposes.

## 🔍 Debugging Tips

1. **Check Screenshots**: Look at the generated PNG files to see what the automation captured
2. **Enable Headful Mode**: Set `headless: false` to watch the automation in real-time
3. **Console Logs**: The script provides detailed console output for each step
4. **Error Screenshots**: Check `reddit-error.png` if the automation fails

## 🎯 Real-World Usage

To adapt this for real credentials:

```typescript
// Replace the random generation with real credentials
const credentials = {
  username: 'your_actual_username',
  password: 'your_actual_password'
};
```

## 🚀 Advanced Features Demonstrated

- **Dynamic Element Discovery**: Finding elements with multiple strategies
- **Robust Error Handling**: Graceful failures and recovery
- **Screenshot Documentation**: Visual proof of automation steps
- **Form Interaction**: Username, password, and button clicking
- **URL Analysis**: Checking navigation success
- **Timeout Management**: Proper waiting for elements

## 🔄 Extending the Example

You can extend this example to:
- Handle 2FA authentication
- Navigate to specific subreddits after login
- Post comments or submissions
- Extract user data
- Handle Reddit's rate limiting

---

**Happy Automating!** 🚀

This example showcases the power and flexibility of the browser automation SDK for handling complex, real-world scenarios. 