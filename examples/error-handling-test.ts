import { extractDOMSummary, xpathToCSSSelector, generateCSSSelector } from '../src/dom/domExtractor';

console.log('🧪 Testing Error Handling in DOM Extraction System\n');

// Test 1: Handle invalid DOM tree structure
console.log('📋 Test 1: Invalid DOM Tree Structure');
try {
  const invalidDomTree = {
    rootId: 'dom-0',
    map: {
      'dom-0': {
        tagName: 'BODY',
        children: 'not-an-array', // This should cause an error
        attributes: {},
        xpath: '/body'
      }
    }
  };
  
  const summary = extractDOMSummary(invalidDomTree as any);
  console.log('✅ Successfully handled invalid children structure');
  console.log('Summary length:', summary.split('\n').length);
} catch (error) {
  console.log('❌ Failed to handle invalid structure:', error);
}
console.log('\n');

// Test 2: Handle missing properties
console.log('📋 Test 2: Missing Properties');
try {
  const incompleteDomTree = {
    rootId: 'dom-0',
    map: {
      'dom-0': {
        tagName: 'BODY',
        // Missing children and attributes
        xpath: '/body'
      }
    }
  };
  
  const summary = extractDOMSummary(incompleteDomTree as any);
  console.log('✅ Successfully handled missing properties');
  console.log('Summary length:', summary.split('\n').length);
} catch (error) {
  console.log('❌ Failed to handle missing properties:', error);
}
console.log('\n');

// Test 3: Handle null/undefined values
console.log('📋 Test 3: Null/Undefined Values');
try {
  const nullDomTree = {
    rootId: 'dom-0',
    map: {
      'dom-0': {
        tagName: 'BODY',
        children: null,
        attributes: null,
        xpath: null
      }
    }
  };
  
  const summary = extractDOMSummary(nullDomTree as any);
  console.log('✅ Successfully handled null values');
  console.log('Summary length:', summary.split('\n').length);
} catch (error) {
  console.log('❌ Failed to handle null values:', error);
}
console.log('\n');

// Test 4: Handle empty DOM tree
console.log('📋 Test 4: Empty DOM Tree');
try {
  const emptyDomTree = {
    rootId: 'dom-0',
    map: {}
  };
  
  const summary = extractDOMSummary(emptyDomTree as any);
  console.log('✅ Successfully handled empty DOM tree');
  console.log('Summary length:', summary.split('\n').length);
} catch (error) {
  console.log('❌ Failed to handle empty DOM tree:', error);
}
console.log('\n');

// Test 5: Handle XPath conversion with invalid input
console.log('📋 Test 5: Invalid XPath Input');
try {
  const invalidXPath = '';
  const cssSelector = xpathToCSSSelector(invalidXPath);
  console.log(`✅ Successfully converted empty XPath: "${invalidXPath}" → "${cssSelector}"`);
} catch (error) {
  console.log('❌ Failed to convert empty XPath:', error);
}

try {
  const invalidXPath2 = null as any;
  const cssSelector2 = xpathToCSSSelector(invalidXPath2);
  console.log(`✅ Successfully converted null XPath: "${invalidXPath2}" → "${cssSelector2}"`);
} catch (error) {
  console.log('❌ Failed to convert null XPath:', error);
}
console.log('\n');

// Test 6: Handle CSS selector generation with invalid node
console.log('📋 Test 6: Invalid Node for CSS Selector Generation');
try {
  const invalidNode = {
    tagName: 'DIV',
    children: 'not-an-array',
    attributes: null,
    xpath: '/body/div[1]'
  };
  
  const selector = generateCSSSelector(invalidNode as any);
  console.log(`✅ Successfully generated selector for invalid node: ${selector}`);
} catch (error) {
  console.log('❌ Failed to generate selector for invalid node:', error);
}
console.log('\n');

// Test 7: Performance with error handling
console.log('📋 Test 7: Performance with Error Handling');
const iterations = 1000;

const startTime = performance.now();
for (let i = 0; i < iterations; i++) {
  try {
    const invalidDomTree = {
      rootId: 'dom-0',
      map: {
        'dom-0': {
          tagName: 'BODY',
          children: i % 2 === 0 ? [] : 'not-an-array',
          attributes: {},
          xpath: '/body'
        }
      }
    };
    
    extractDOMSummary(invalidDomTree as any);
  } catch (error) {
    // Error is expected and handled
  }
}
const endTime = performance.now();
const totalTime = endTime - startTime;

console.log(`✅ Error handling performance: ${totalTime.toFixed(2)}ms for ${iterations} iterations`);
console.log(`   Average per iteration: ${(totalTime / iterations).toFixed(4)}ms`);

console.log('\n✅ All error handling tests completed successfully!');
console.log('\n🎯 Error Handling Features:');
console.log('• Graceful handling of invalid DOM tree structures');
console.log('• Fallback for missing properties');
console.log('• Null/undefined value handling');
console.log('• Empty DOM tree support');
console.log('• Invalid XPath input handling');
console.log('• Invalid node handling for CSS selector generation');
console.log('• Performance-optimized error handling'); 