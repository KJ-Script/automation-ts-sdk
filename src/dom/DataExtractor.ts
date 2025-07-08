import { Page } from 'playwright';
import { BrowserActions } from '../browser/actions/BrowserActions';

export interface ExtractionRule {
  key: string;
  selector: string;
  attribute?: string; // Extract attribute value instead of text
  multiple?: boolean; // Extract array of elements
  transform?: (value: string) => any; // Transform the extracted value
}

export interface ExtractionOptions {
  timeout?: number;
  waitForElement?: boolean;
  includeMetadata?: boolean;
}

export interface ExtractedData {
  [key: string]: any;
  _metadata?: {
    url: string;
    title: string;
    timestamp: string;
    extractionRules: ExtractionRule[];
  };
}

export class DataExtractor {
  private actions: BrowserActions;
  private page: Page;

  constructor(page: Page) {
    this.page = page;
    this.actions = new BrowserActions(page);
  }

  /**
   * Extract data from the page using defined extraction rules
   */
  async extractData(rules: ExtractionRule[], options: ExtractionOptions = {}): Promise<ExtractedData> {
    const timeout = options.timeout || 30000;
    const waitForElement = options.waitForElement !== false;
    const includeMetadata = options.includeMetadata !== false;

    const extractedData: ExtractedData = {};

    // Wait for page to be ready
    if (waitForElement) {
      try {
        await this.page.waitForLoadState('domcontentloaded', { timeout });
      } catch (error) {
        console.warn('Page load timeout, continuing with extraction...');
      }
    }

    // Process each extraction rule
    for (const rule of rules) {
      try {
        let value: any;

        if (rule.multiple) {
          // Extract multiple elements
          value = await this.extractMultiple(rule, timeout);
        } else {
          // Extract single element
          value = await this.extractSingle(rule, timeout);
        }

        // Apply transformation if provided
        if (rule.transform && value !== null) {
          if (Array.isArray(value)) {
            value = value.map(v => rule.transform!(v));
          } else {
            value = rule.transform(value);
          }
        }

        extractedData[rule.key] = value;

      } catch (error) {
        console.warn(`Failed to extract data for rule "${rule.key}":`, error);
        extractedData[rule.key] = null;
      }
    }

    // Add metadata if requested
    if (includeMetadata) {
      extractedData._metadata = await this.buildMetadata(rules);
    }

    return extractedData;
  }

  /**
   * Extract data from a single element
   */
  private async extractSingle(rule: ExtractionRule, timeout: number): Promise<string | null> {
    try {
      // Wait for element to exist
      await this.actions.waitForElement(rule.selector, { timeout });

      if (rule.attribute) {
        return await this.actions.getAttribute(rule.selector, rule.attribute);
      } else {
        return await this.actions.getText(rule.selector);
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract data from multiple elements
   */
  private async extractMultiple(rule: ExtractionRule, timeout: number): Promise<(string | null)[]> {
    try {
      const elements = this.page.locator(rule.selector);
      const count = await elements.count();
      const results: (string | null)[] = [];

      for (let i = 0; i < count; i++) {
        try {
          const element = elements.nth(i);
          let value: string | null;

          if (rule.attribute) {
            value = await element.getAttribute(rule.attribute);
          } else {
            value = await element.textContent();
          }

          results.push(value?.trim() || null);
        } catch (error) {
          results.push(null);
        }
      }

      return results;
    } catch (error) {
      return [];
    }
  }

  /**
   * Build metadata object
   */
  private async buildMetadata(rules: ExtractionRule[]) {
    const url = await this.actions.executeScript(() => window.location.href);
    const title = await this.actions.executeScript(() => document.title);

    return {
      url,
      title,
      timestamp: new Date().toISOString(),
      extractionRules: rules.map(rule => ({
        key: rule.key,
        selector: rule.selector,
        attribute: rule.attribute,
        multiple: rule.multiple
      }))
    };
  }

  /**
   * Quick extraction for common web page elements (optimized for speed)
   */
  async extractCommonData(options: ExtractionOptions = {}): Promise<ExtractedData> {
    const commonRules: ExtractionRule[] = [
      { key: 'title', selector: 'title' },
      { key: 'h1', selector: 'h1' },
      { key: 'headings', selector: 'h1, h2, h3, h4, h5, h6', multiple: true },
      { key: 'links', selector: 'a[href]', attribute: 'href', multiple: true },
      { key: 'images', selector: 'img[src]', attribute: 'src', multiple: true },
      { key: 'metaDescription', selector: 'meta[name="description"]', attribute: 'content' },
      { key: 'metaKeywords', selector: 'meta[name="keywords"]', attribute: 'content' },
      { key: 'paragraphs', selector: 'p', multiple: true }
    ];

    // Fast extraction: don't wait for full page loads, just extract what's available
    const fastOptions = {
      ...options,
      waitForElement: false,  // Skip waiting for elements to be ready
      timeout: 2000          // Aggressive timeout
    };

    return await this.extractData(commonRules, fastOptions);
  }

  /**
   * Extract form data from a page
   */
  async extractFormData(formSelector: string = 'form', options: ExtractionOptions = {}): Promise<ExtractedData> {
    const formRules: ExtractionRule[] = [
      { key: 'formAction', selector: `${formSelector}`, attribute: 'action' },
      { key: 'formMethod', selector: `${formSelector}`, attribute: 'method' },
      { key: 'inputFields', selector: `${formSelector} input`, attribute: 'name', multiple: true },
      { key: 'inputTypes', selector: `${formSelector} input`, attribute: 'type', multiple: true },
      { key: 'textareas', selector: `${formSelector} textarea`, attribute: 'name', multiple: true },
      { key: 'selectFields', selector: `${formSelector} select`, attribute: 'name', multiple: true },
      { key: 'labels', selector: `${formSelector} label`, multiple: true },
      { key: 'buttons', selector: `${formSelector} button, ${formSelector} input[type="submit"]`, multiple: true }
    ];

    return await this.extractData(formRules, options);
  }

  /**
   * Extract table data
   */
  async extractTableData(tableSelector: string = 'table', options: ExtractionOptions = {}): Promise<ExtractedData> {
    const tableRules: ExtractionRule[] = [
      { key: 'headers', selector: `${tableSelector} th`, multiple: true },
      { key: 'rows', selector: `${tableSelector} tr`, multiple: true },
      { key: 'cells', selector: `${tableSelector} td`, multiple: true }
    ];

    const basicData = await this.extractData(tableRules, options);

    // Enhanced table extraction with structured data
    try {
      const structuredTable = await this.page.evaluate((selector) => {
        const table = document.querySelector(selector);
        if (!table) return null;

        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
        const rows = Array.from(table.querySelectorAll('tr')).slice(headers.length > 0 ? 1 : 0);
        
        const data = rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent?.trim() || '');
          if (headers.length > 0 && headers.length === cells.length) {
            const rowData: any = {};
            headers.forEach((header, index) => {
              rowData[header] = cells[index];
            });
            return rowData;
          }
          return cells;
        });

        return {
          headers,
          data,
          rowCount: rows.length,
          columnCount: headers.length
        };
      }, tableSelector);

      basicData.structuredTable = structuredTable;
    } catch (error) {
      console.warn('Failed to extract structured table data:', error);
    }

    return basicData;
  }

  /**
   * Extract social media data
   */
  async extractSocialData(options: ExtractionOptions = {}): Promise<ExtractedData> {
    const socialRules: ExtractionRule[] = [
      { key: 'ogTitle', selector: 'meta[property="og:title"]', attribute: 'content' },
      { key: 'ogDescription', selector: 'meta[property="og:description"]', attribute: 'content' },
      { key: 'ogImage', selector: 'meta[property="og:image"]', attribute: 'content' },
      { key: 'ogUrl', selector: 'meta[property="og:url"]', attribute: 'content' },
      { key: 'twitterTitle', selector: 'meta[name="twitter:title"]', attribute: 'content' },
      { key: 'twitterDescription', selector: 'meta[name="twitter:description"]', attribute: 'content' },
      { key: 'twitterImage', selector: 'meta[name="twitter:image"]', attribute: 'content' },
      { key: 'twitterCard', selector: 'meta[name="twitter:card"]', attribute: 'content' }
    ];

    return await this.extractData(socialRules, options);
  }

  /**
   * Convert extracted data to JSON string
   */
  toJSON(data: ExtractedData, pretty: boolean = true): string {
    return JSON.stringify(data, null, pretty ? 2 : 0);
  }

  /**
   * Save extracted data to a JSON file
   */
  async saveToFile(data: ExtractedData, filePath: string): Promise<void> {
    const fs = await import('fs');
    const jsonString = this.toJSON(data);
    fs.writeFileSync(filePath, jsonString, 'utf8');
  }
} 