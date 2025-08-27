// Browser console debugging commands for overlay system
console.log('🔍 Browser Console Debug Commands for Overlay System');
console.log('='.repeat(70));

console.log('\n📋 Copy and paste these commands in your browser console at /ai-context-window');

console.log('\n1. Check if iframe is loaded and accessible:');
console.log('   const iframe = document.getElementById("browser-preview-iframe");');
console.log('   console.log("Iframe:", iframe);');
console.log('   console.log("Iframe doc:", iframe?.contentDocument);');
console.log('   console.log("Iframe ready state:", iframe?.contentDocument?.readyState);');

console.log('\n2. Check if overlay data is loaded:');
console.log('   // This checks the React state inside BrowserPreview component');
console.log('   console.log("Check React DevTools for overlayData state");');
console.log('   // OR manually trigger the overlay fetch:');
console.log('   window.apiClient.get("hybrid-patches/modified-code/src%2Fpages%2FCart.jsx")');
console.log('     .then(r => console.log("Overlay API response:", r))');
console.log('     .catch(e => console.log("Overlay API error:", e));');

console.log('\n3. Check if overlay script was injected into iframe:');
console.log('   const iframe = document.getElementById("browser-preview-iframe");');
console.log('   const iframeDoc = iframe?.contentDocument;');
console.log('   if (iframeDoc) {');
console.log('     const overlayScripts = iframeDoc.querySelectorAll(\'[data-overlay-preview="true"]\');');
console.log('     console.log("Overlay scripts in iframe:", overlayScripts.length);');
console.log('     overlayScripts.forEach((script, i) => {');
console.log('       console.log(`Script ${i}:`, script.textContent?.substring(0, 100) + "...");');
console.log('     });');
console.log('   }');

console.log('\n4. Check if overlay indicator appears in iframe:');
console.log('   const iframe = document.getElementById("browser-preview-iframe");');
console.log('   const iframeDoc = iframe?.contentDocument;');
console.log('   if (iframeDoc) {');
console.log('     const indicator = iframeDoc.querySelector(\'div[data-overlay-preview="true"]\');');
console.log('     console.log("Overlay indicator:", indicator);');
console.log('     console.log("Indicator text:", indicator?.textContent);');
console.log('   }');

console.log('\n5. Check current text content in iframe:');
console.log('   const iframe = document.getElementById("browser-preview-iframe");');
console.log('   const iframeDoc = iframe?.contentDocument;');
console.log('   if (iframeDoc) {');
console.log('     const allText = Array.from(iframeDoc.querySelectorAll("*"))');
console.log('       .filter(el => el.textContent && el.textContent.trim().includes("Cart"))');
console.log('       .map(el => ({');
console.log('         tag: el.tagName,');
console.log('         text: el.textContent.trim(),');
console.log('         hasOverlayAttr: el.hasAttribute("data-overlay-preview")');
console.log('       }));');
console.log('     console.log("Cart-related elements:", allText);');
console.log('   }');

console.log('\n6. Manual overlay application test:');
console.log('   // Force trigger overlay application');
console.log('   const iframe = document.getElementById("browser-preview-iframe");');
console.log('   const iframeDoc = iframe?.contentDocument;');
console.log('   if (iframeDoc) {');
console.log('     // Find elements with "My Cart" and change to "Your Cart"');
console.log('     const cartElements = Array.from(iframeDoc.querySelectorAll("*"))');
console.log('       .filter(el => el.textContent && el.textContent.includes("My Cart"));');
console.log('     console.log("Found elements with \\"My Cart\\":", cartElements.length);');
console.log('     cartElements.forEach(el => {');
console.log('       console.log("Before:", el.textContent);');
console.log('       el.textContent = el.textContent.replace("My Cart", "Your Cart");');
console.log('       console.log("After:", el.textContent);');
console.log('     });');
console.log('   }');

console.log('\n7. Check overlay toggle state:');
console.log('   // Check if the overlay toggle UI is working');
console.log('   const overlaySelect = document.querySelector(\'select[value="current"]\');');
console.log('   console.log("Overlay mode selector:", overlaySelect);');
console.log('   console.log("Current value:", overlaySelect?.value);');

console.log('\n🎯 Debugging Strategy:');
console.log('   1. Run commands 1-2 first to verify iframe and API are working');
console.log('   2. Run command 3-4 to see if script injection is working'); 
console.log('   3. Run command 5 to see current iframe content');
console.log('   4. Run command 6 to manually test if DOM updates work');
console.log('   5. If manual test works, the issue is in the auto-injection logic');
console.log('   6. If manual test fails, there may be iframe security restrictions');

console.log('\n⚡ Quick Test - run this single line:');
console.log('   window.location.pathname === "/ai-context-window" && console.log("✅ Correct page") || console.log("❌ Wrong page");');

console.log('\n✅ Next: Run these commands in your browser console while viewing Cart.jsx');