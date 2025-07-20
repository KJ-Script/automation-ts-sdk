// Simple DOM analysis script for browser injection
(function() {
    const DOM_MAP = new Map();
    const counter = { current: 0 };
  
    function isAcceptedElement(node) {
      if (!node || !node.tagName) return false;
      const accepted = new Set([
        "body", "div", "main", "article", "section", "nav", "header", "footer", "input", "button", "a", "form", "p", "span", "h1", "h2", "h3", "h4", "h5", "h6"
      ]);
      const denied = new Set([
        "svg", "script", "style", "link", "meta", "noscript", "template"
      ]);
      const tag = node.tagName.toLowerCase();
      if (accepted.has(tag)) return true;
      return !denied.has(tag);
    }
  
    function getXpath(node) {
      const segments = [];
      let currentNode = node;
      while (currentNode && currentNode.nodeType == Node.ELEMENT_NODE) {
        let index = 0;
        let sibling = currentNode.previousSibling;
        while (sibling) {
          if (sibling.nodeType == Node.ELEMENT_NODE && sibling.nodeName === currentNode.nodeName) {
            index++;
          }
          sibling = sibling.previousSibling;
        }
        const tagName = currentNode.tagName.toLowerCase();
        const xpathIndex = index > 0 ? `[${index + 1}]` : '';
        segments.unshift(`${tagName}${xpathIndex}`);
        currentNode = currentNode.parentNode;
      }
      return '/' + segments.join('/');
    }
  
    function buildDomTree(node) {
      if (!node) return null;
      
      if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.TEXT_NODE) {
        return null;
      }
  
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent?.trim();
        if (!textContent) return null;
        const parent = node.parentElement;
        if (!parent || parent.tagName.toLowerCase() == 'script') return null;
  
        const id = `dom-${counter.current++}`;
        DOM_MAP.set(id, {
          type: 'TEXT_NODE',
          text: textContent,
          xpath: getXpath(node.parentElement)
        });
        return id;
      }
  
      if (node.nodeType == Node.ELEMENT_NODE && !isAcceptedElement(node)) {
        return null;
      }
  
      const nodeData = {
        tagName: node.tagName,
        children: [],
        attributes: {},
        xpath: getXpath(node)
      };
  
      // Get attributes
      const attributeNames = node.getAttributeNames?.() || [];
      for (const attr of attributeNames) {
        nodeData.attributes[attr] = node.getAttribute(attr);
      }
  
      // Process children
      for (const child of node.childNodes) {
        const childData = buildDomTree(child);
        if (childData) {
          nodeData.children.push(childData);
        }
      }
  
      // Skip empty anchor tags
      if (nodeData.tagName === 'a' && nodeData.children.length === 0 && !nodeData.attributes.href) {
        return null;
      }
  
      const id = `dom-${counter.current++}`;
      DOM_MAP.set(id, nodeData);
      return id;
    }
  
    // Start from body
    const rootId = buildDomTree(document.body);
    return { rootId, map: Object.fromEntries(DOM_MAP) };
  })();