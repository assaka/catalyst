// Debug overlay text replacement logic
console.log('🔍 Debugging Overlay Text Replacement Logic');
console.log('='.repeat(60));

// Simulate the text extraction and replacement logic
console.log('\n1. Testing Text Extraction from Overlay Code:');

// This simulates what would be in overlayResult.current
const mockOverlayCode = `
function Cart() {
  return (
    <div className="cart-container">
      <h1>Your Cart</h1>
      <p>Welcome to Your Cart page</p>
    </div>
  );
}
`;

console.log('Mock overlay code (overlayResult.current):');
console.log(mockOverlayCode.substring(0, 200) + '...');

// Extract text content like the overlay system does
const textMatches = mockOverlayCode.match(/>([^<>{]+)</g) || [];
const extractedTexts = textMatches.map(match => match.replace(/[<>]/g, '').trim()).filter(text => text.length > 0);

console.log('\n2. Extracted Texts from Overlay:');
extractedTexts.forEach((text, index) => {
  console.log(`   ${index + 1}. "${text}"`);
});

console.log('\n3. Testing Text Replacement Logic:');

// Simulate what would be in the original DOM
const mockCurrentTexts = ['My Cart', 'Welcome to My Cart page'];

extractedTexts.forEach(newText => {
  console.log(`\n   Testing replacement for: "${newText}"`);
  
  mockCurrentTexts.forEach(currentText => {
    console.log(`   Comparing with DOM text: "${currentText}"`);
    
    // Test the Cart-specific condition from BrowserPreview.jsx:393-400
    if (newText.toLowerCase().includes('cart') && currentText.toLowerCase().includes('cart')) {
      console.log(`   ✅ CART MATCH: "${currentText}" -> "${newText}"`);
      console.log(`      Condition: newText includes 'cart': ${newText.toLowerCase().includes('cart')}`);
      console.log(`      Condition: currentText includes 'cart': ${currentText.toLowerCase().includes('cart')}`);
    } 
    // Test exact match conditions
    else if (currentText === newText || 
             currentText.toLowerCase() === newText.toLowerCase() ||
             currentText.includes(newText) || newText.includes(currentText)) {
      console.log(`   ✅ EXACT MATCH: "${currentText}" -> "${newText}"`);
    } else {
      console.log(`   ❌ NO MATCH: "${currentText}" vs "${newText}"`);
    }
  });
});

console.log('\n4. Expected Behavior:');
console.log('   - "My Cart" should become "Your Cart"');
console.log('   - "Welcome to My Cart page" should become "Welcome to Your Cart page"');

console.log('\n5. Potential Issues:');
console.log('   Issue A: Text extraction not working correctly');
console.log('   Issue B: DOM element selection not finding the right elements');
console.log('   Issue C: Iframe context issues preventing DOM updates');
console.log('   Issue D: Race condition - script runs before iframe is fully loaded');

console.log('\n✅ Run this test to see if the logic should work correctly');