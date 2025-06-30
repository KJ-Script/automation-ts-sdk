# Data Extraction - Convert DOM to Structured JSON

## 🎯 Overview

The `DataExtractor` class allows you to extract specific values from web pages and return them as structured JSON data. This is perfect for:

- **Web Scraping** - Extract product information, articles, listings
- **Data Mining** - Collect structured data from multiple sites
- **Content Analysis** - Extract headlines, links, metadata
- **Form Analysis** - Understand form structures
- **Social Media** - Extract Open Graph and Twitter Card metadata

## 🚀 Quick Start

```bash
npm run extract  # Run the comprehensive data extraction demo
```

## 📊 Basic Usage

```typescript
import { AutomationBrowser, DataExtractor, ExtractionRule } from '../src/index';

const browser = new AutomationBrowser({ type: 'chrome', headless: true });
await browser.launch();

const page = await browser.goto('https://example.com');
const extractor = new DataExtractor(page);

// Extract common data automatically
const data = await extractor.extractCommonData();
console.log(extractor.toJSON(data));

await browser.close();
```

## 🔧 Custom Extraction Rules

### Basic Rule Structure

```typescript
interface ExtractionRule {
  key: string;           // Key name in resulting JSON
  selector: string;      // CSS selector
  attribute?: string;    // Extract attribute instead of text
  multiple?: boolean;    // Extract array of elements
  transform?: (value: string) => any; // Transform the value
}
```

### Examples

```typescript
const rules: ExtractionRule[] = [
  // Extract text content
  { key: 'title', selector: 'h1' },
  
  // Extract attribute values
  { key: 'links', selector: 'a', attribute: 'href', multiple: true },
  
  // Extract and transform data
  {
    key: 'prices',
    selector: '.price',
    multiple: true,
    transform: (value: string) => {
      const match = value.match(/\$(\d+)/);
      return match ? parseFloat(match[1]) : 0;
    }
  }
];

const data = await extractor.extractData(rules);
```

## 📋 Pre-built Extraction Methods

### 1. Common Web Page Data

```typescript
const commonData = await extractor.extractCommonData();
```

Extracts:
- Page title
- Headings (h1-h6)
- All links
- All images
- Meta description/keywords
- Paragraphs

### 2. Form Analysis

```typescript
const formData = await extractor.extractFormData('form');
```

Extracts:
- Form action and method
- Input field names and types
- Textarea fields
- Select fields
- Labels and buttons

### 3. Social Media Metadata

```typescript
const socialData = await extractor.extractSocialData();
```

Extracts:
- Open Graph tags (og:title, og:description, etc.)
- Twitter Card metadata
- SEO metadata

### 4. Table Data

```typescript
const tableData = await extractor.extractTableData('table');
```

Extracts:
- Table headers
- Row and cell data
- Structured table data with headers as keys

## 🎨 Real-World Examples

### E-commerce Product Scraping

```typescript
const productRules: ExtractionRule[] = [
  { key: 'name', selector: '.product-title' },
  { key: 'price', selector: '.price', transform: (v) => parseFloat(v.replace(/[^0-9.]/g, '')) },
  { key: 'images', selector: '.product-image img', attribute: 'src', multiple: true },
  { key: 'description', selector: '.product-description' },
  { key: 'inStock', selector: '.stock-status', transform: (v) => v.includes('In Stock') }
];

const productData = await extractor.extractData(productRules);
```

### News Article Extraction

```typescript
const articleRules: ExtractionRule[] = [
  { key: 'headline', selector: 'h1' },
  { key: 'author', selector: '.author' },
  { key: 'publishDate', selector: '.publish-date' },
  { key: 'content', selector: '.article-content p', multiple: true },
  { key: 'tags', selector: '.tag', multiple: true }
];

const articleData = await extractor.extractData(articleRules);
```

### Hacker News Scraping

```typescript
const hackerNewsRules: ExtractionRule[] = [
  { key: 'titles', selector: '.storylink', multiple: true },
  { key: 'urls', selector: '.storylink', attribute: 'href', multiple: true },
  {
    key: 'points',
    selector: '.score',
    multiple: true,
    transform: (v) => parseInt(v.match(/(\d+)/)?.[1] || '0', 10)
  },
  { key: 'authors', selector: '.hnuser', multiple: true }
];

const hnData = await extractor.extractData(hackerNewsRules);
```

## 🔄 Batch Processing

Process multiple websites efficiently:

```typescript
const sites = [
  { name: 'Site1', url: 'https://example1.com' },
  { name: 'Site2', url: 'https://example2.com' }
];

const batchResults = [];

for (const site of sites) {
  try {
    const page = await browser.goto(site.url);
    const extractor = new DataExtractor(page);
    const data = await extractor.extractCommonData();
    data.siteName = site.name;
    batchResults.push(data);
  } catch (error) {
    batchResults.push({ siteName: site.name, error: error.message });
  }
}

// Save batch results
const fs = await import('fs');
fs.writeFileSync('batch-results.json', JSON.stringify(batchResults, null, 2));
```

## 📁 Output Formats

### JSON String

```typescript
const jsonString = extractor.toJSON(data, true); // Pretty formatted
console.log(jsonString);
```

### Save to File

```typescript
await extractor.saveToFile(data, 'extracted-data.json');
```

### Example Output

```json
{
  "title": "Example Page",
  "h1": "Welcome",
  "links": [
    "https://example.com/page1",
    "https://example.com/page2"
  ],
  "prices": [29.99, 39.99, 19.99],
  "_metadata": {
    "url": "https://example.com",
    "title": "Example Page",
    "timestamp": "2025-06-30T20:08:24.880Z",
    "extractionRules": [...]
  }
}
```

## ⚙️ Advanced Options

### Extraction Options

```typescript
interface ExtractionOptions {
  timeout?: number;          // Wait timeout (default: 30000ms)
  waitForElement?: boolean;  // Wait for elements (default: true)
  includeMetadata?: boolean; // Include extraction metadata (default: true)
}

const data = await extractor.extractData(rules, {
  timeout: 10000,
  waitForElement: true,
  includeMetadata: true
});
```

### Transform Functions

```typescript
const rules: ExtractionRule[] = [
  {
    key: 'cleanedText',
    selector: '.content',
    transform: (value: string) => value.trim().replace(/\s+/g, ' ')
  },
  {
    key: 'numbers',
    selector: '.number',
    multiple: true,
    transform: (value: string) => parseInt(value, 10) || 0
  },
  {
    key: 'urls',
    selector: 'a',
    attribute: 'href',
    multiple: true,
    transform: (value: string) => value.startsWith('http') ? value : null
  }
];
```

## 🚨 Error Handling

The DataExtractor gracefully handles errors:

- Missing elements return `null`
- Failed transformations return original value
- Timeouts continue with available data
- Batch processing continues on individual failures

```typescript
try {
  const data = await extractor.extractData(rules);
  console.log('Success:', data);
} catch (error) {
  console.error('Extraction failed:', error);
}
```

## 🎯 Best Practices

1. **Use Specific Selectors** - Avoid overly broad selectors
2. **Handle Missing Data** - Always check for null values
3. **Transform Data** - Clean and validate extracted values
4. **Set Appropriate Timeouts** - Adjust for slow-loading sites
5. **Batch Process** - Extract from multiple sites efficiently
6. **Include Metadata** - Keep track of extraction source and time
7. **Save Results** - Persist data to JSON files for analysis

## 📊 Generated Files

The demo creates these JSON files:
- `extracted-common-data.json` - Common page elements
- `hacker-news-data.json` - Hacker News story data
- `batch-extraction-results.json` - Multi-site batch results

## 🔗 Integration with Other Tools

### With DOM Extractor

```typescript
// First get DOM structure
const domTree = await domExtractor.extractFromPage(page);

// Then extract specific data
const specificData = await dataExtractor.extractData(rules);

// Combine both approaches
const completeData = {
  domStructure: domTree,
  extractedData: specificData
};
```

### With Browser Actions

```typescript
// Navigate and interact before extracting
await actions.click('.load-more');
await actions.waitForElement('.new-content');

// Then extract updated data
const data = await extractor.extractData(rules);
```

## 🎉 Use Cases

- **Price Monitoring** - Track product prices across sites
- **Content Aggregation** - Collect articles from multiple sources
- **Lead Generation** - Extract contact information
- **Market Research** - Analyze competitor websites
- **SEO Analysis** - Extract meta tags and content structure
- **Social Media Monitoring** - Track mentions and hashtags
- **Job Board Scraping** - Collect job postings
- **Real Estate Listings** - Extract property information

---

**Happy Data Extracting!** 🚀

The DataExtractor makes it easy to convert any website into structured JSON data for analysis, storage, and further processing. 