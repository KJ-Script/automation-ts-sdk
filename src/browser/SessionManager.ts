import * as fs from 'fs';
import * as path from 'path';
import { BrowserContext } from 'playwright';
import { SessionConfig } from '../types/browser';

export interface SessionData {
  cookies: any[];
  localStorage: Record<string, any>;
  sessionStorage: Record<string, any>;
  timestamp: string;
  sessionName: string;
}

export class SessionManager {
  private sessionConfig: SessionConfig;
  private sessionDir: string;

  constructor(sessionConfig: SessionConfig) {
    this.sessionConfig = sessionConfig;
    this.sessionDir = sessionConfig.sessionDir || './sessions';
    
    // Ensure session directory exists
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  /**
   * Get the session file path for a given session name
   */
  private getSessionFilePath(sessionName: string): string {
    return path.join(this.sessionDir, `${sessionName}.json`);
  }

  /**
   * Save session data to disk
   */
  async saveSession(context: BrowserContext, sessionName: string): Promise<void> {
    if (!this.sessionConfig.enabled) {
      return;
    }

    const sessionData: SessionData = {
      cookies: [],
      localStorage: {},
      sessionStorage: {},
      timestamp: new Date().toISOString(),
      sessionName
    };

    // Save cookies if enabled
    if (this.sessionConfig.persistCookies) {
      sessionData.cookies = await context.cookies();
    }

    // Save localStorage and sessionStorage if enabled
    if (this.sessionConfig.persistLocalStorage || this.sessionConfig.persistSessionStorage) {
      const pages = context.pages();
      if (pages.length > 0) {
        const page = pages[0];
        
        if (this.sessionConfig.persistLocalStorage) {
          sessionData.localStorage = await page.evaluate(() => {
            const data: Record<string, any> = {};
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key) {
                data[key] = localStorage.getItem(key);
              }
            }
            return data;
          });
        }

        if (this.sessionConfig.persistSessionStorage) {
          sessionData.sessionStorage = await page.evaluate(() => {
            const data: Record<string, any> = {};
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              if (key) {
                data[key] = sessionStorage.getItem(key);
              }
            }
            return data;
          });
        }
      }
    }

    // Write session data to file
    const sessionPath = this.getSessionFilePath(sessionName);
    fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
  }

  /**
   * Load session data from disk
   */
  async loadSession(context: BrowserContext, sessionName: string): Promise<boolean> {
    if (!this.sessionConfig.enabled) {
      return false;
    }

    const sessionPath = this.getSessionFilePath(sessionName);
    
    if (!fs.existsSync(sessionPath)) {
      return false;
    }

    try {
      const sessionData: SessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));

      // Load cookies if enabled and available
      if (this.sessionConfig.persistCookies && sessionData.cookies.length > 0) {
        await context.addCookies(sessionData.cookies);
      }

      // Load localStorage and sessionStorage if enabled
      if ((this.sessionConfig.persistLocalStorage || this.sessionConfig.persistSessionStorage) && context.pages().length > 0) {
        const page = context.pages()[0];
        
        if (this.sessionConfig.persistLocalStorage && Object.keys(sessionData.localStorage).length > 0) {
          await page.evaluate((localStorageData) => {
            for (const [key, value] of Object.entries(localStorageData)) {
              localStorage.setItem(key, value);
            }
          }, sessionData.localStorage);
        }

        if (this.sessionConfig.persistSessionStorage && Object.keys(sessionData.sessionStorage).length > 0) {
          await page.evaluate((sessionStorageData) => {
            for (const [key, value] of Object.entries(sessionStorageData)) {
              sessionStorage.setItem(key, value);
            }
          }, sessionData.sessionStorage);
        }
      }

      return true;
    } catch (error) {
      console.error(`Failed to load session ${sessionName}:`, error);
      return false;
    }
  }

  /**
   * Check if a session exists
   */
  sessionExists(sessionName: string): boolean {
    const sessionPath = this.getSessionFilePath(sessionName);
    return fs.existsSync(sessionPath);
  }

  /**
   * List all available sessions
   */
  listSessions(): string[] {
    if (!fs.existsSync(this.sessionDir)) {
      return [];
    }

    return fs.readdirSync(this.sessionDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  }

  /**
   * Delete a session
   */
  deleteSession(sessionName: string): boolean {
    const sessionPath = this.getSessionFilePath(sessionName);
    
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
      return true;
    }
    
    return false;
  }

  /**
   * Get session info
   */
  getSessionInfo(sessionName: string): SessionData | null {
    const sessionPath = this.getSessionFilePath(sessionName);
    
    if (!fs.existsSync(sessionPath)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    } catch (error) {
      console.error(`Failed to read session info for ${sessionName}:`, error);
      return null;
    }
  }
} 