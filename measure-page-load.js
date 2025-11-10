/**
 * Paste this in Firefox console to measure REAL page load time
 */

// Wait for page to fully load
window.addEventListener('load', () => {
  setTimeout(() => {
    const perfData = performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
    const networkTime = perfData.responseEnd - perfData.fetchStart;

    console.log('📊 PAGE LOAD PERFORMANCE');
    console.log('========================\n');
    console.log(`Total Page Load: ${(pageLoadTime/1000).toFixed(2)}s`);
    console.log(`DOM Ready: ${(domReadyTime/1000).toFixed(2)}s`);
    console.log(`Network Time: ${(networkTime/1000).toFixed(2)}s\n`);

    // Get all resources
    const resources = performance.getEntriesByType('resource');
    const apiCalls = resources.filter(r => r.name.includes('/api/'));
    const images = resources.filter(r => r.initiatorType === 'img');
    const scripts = resources.filter(r => r.initiatorType === 'script');

    console.log(`API Calls: ${apiCalls.length}`);
    console.log(`Images: ${images.length}`);
    console.log(`Scripts: ${scripts.length}`);
    console.log(`Total Resources: ${resources.length}\n`);

    // Find slowest resources
    const sorted = resources.sort((a, b) => b.duration - a.duration);
    console.log('🐌 Top 5 Slowest Resources:');
    sorted.slice(0, 5).forEach((r, i) => {
      const name = r.name.split('/').pop().substring(0, 50);
      console.log(`${i+1}. ${Math.round(r.duration)}ms - ${name}`);
    });

    // Calculate total time in API calls
    const totalApiTime = apiCalls.reduce((sum, r) => sum + r.duration, 0);
    console.log(`\nTotal API Time: ${Math.round(totalApiTime)}ms`);

    // Check for duplicates
    const apiUrls = apiCalls.map(r => r.name.split('?')[0]);
    const duplicates = apiUrls.filter((url, i) => apiUrls.indexOf(url) !== i);
    console.log(`Duplicate API Calls: ${new Set(duplicates).size}`);

    if (duplicates.length > 0) {
      console.log('\n❌ DUPLICATES FOUND:');
      new Set(duplicates).forEach(url => {
        const count = apiUrls.filter(u => u === url).length;
        console.log(`  ${count}x ${url.split('/').slice(-2).join('/')}`);
      });
    }

    // Summary
    console.log('\n💡 ANALYSIS:');
    if (pageLoadTime > 5000) {
      console.log('❌ Page load >5s - VERY SLOW');
    } else if (pageLoadTime > 3000) {
      console.log('⚠️  Page load >3s - SLOW');
    } else if (pageLoadTime > 2000) {
      console.log('⚠️  Page load >2s - Could be better');
    } else {
      console.log('✅ Page load <2s - Good!');
    }

    if (apiCalls.length > 10) {
      console.log('❌ Too many API calls (>10)');
    } else if (apiCalls.length > 5) {
      console.log('⚠️  High API call count (>5)');
    } else {
      console.log('✅ Good API call count');
    }

    if (duplicates.length > 0) {
      console.log('❌ Duplicate API calls detected');
    }

  }, 1000);
});

console.log('⏳ Waiting for page to load...');
console.log('📊 Metrics will appear after page fully loads');
