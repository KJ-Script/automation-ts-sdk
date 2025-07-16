// ============ DOM TYPES ============

export interface DOMNode {
  id: string;
  tagName: string;
  nodeType: number;
  textContent?: string;
  attributes: Record<string, string>;
  children: DOMNode[];
  parentId?: string;
  isVisible: boolean;
  isInteractive: boolean;
  selector: string;
  xpath: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DOMTree {
  root: DOMNode;
  totalNodes: number;
  interactiveElements: DOMNode[];
  visibleElements: DOMNode[];
  timestamp: string;
  url: string;
  title: string;
}

export interface DOMExtractionOptions {
  includeHidden?: boolean;
  includeNonInteractive?: boolean;
  maxDepth?: number;
  includeBoundingBox?: boolean;
  includeXPath?: boolean;
  filterSelectors?: string[];
}

export interface DOMChangeEvent {
  type: 'added' | 'removed' | 'modified' | 'attribute-changed';
  nodeId: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
}

export interface DOMSnapshot {
  tree: DOMTree;
  changes: DOMChangeEvent[];
  previousSnapshot?: DOMSnapshot;
}

export interface DOMContext {
  url: string;
  title: string;
  interactiveElements: Array<{
    tagName: string;
    textContent?: string;
    selector: string;
    isVisible: boolean;
    attributes: Record<string, string>;
  }>;
  visibleElements: number;
  totalNodes: number;
  lastUpdated: string;
} 