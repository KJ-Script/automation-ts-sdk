// ============ BROWSER ACTIONS TYPES ============

export interface ClickOptions {
  timeout?: number;
  force?: boolean;
  delay?: number;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  position?: { x: number; y: number };
}

export interface TypeOptions {
  delay?: number;
  timeout?: number;
  clear?: boolean;
}

export interface ScrollOptions {
  behavior?: 'auto' | 'smooth';
  timeout?: number;
}

export interface WaitOptions {
  timeout?: number;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}

export interface ScreenshotOptions {
  path?: string;
  fullPage?: boolean;
  quality?: number;
  type?: 'png' | 'jpeg';
}

export interface ScreenshotFullPageOptions extends ScreenshotOptions {
  fullPage?: boolean;
} 