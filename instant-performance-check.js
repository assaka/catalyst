/**
 * INSTANT Performance Check - Works on Already-Loaded Pages
 * Paste this in Firefox console AFTER the page has loaded
 */

(function() {
  console.clear();
  console.log('📊 PAGE LOAD PERFORMANCE ANALYSIS');
  console.log('===================================\n');

  // Get navigation timing (works on already-loaded pages)
  const navTiming = performance.getEntriesByType('navigation')[0];

  if (navTiming) {
    const loadTime = navTiming.loadEventEnd - navTiming.fetchStart;
    const domReady = navTiming.domContentLoadedEventEnd - navTiming.fetchStart;
    const responseTime = navTiming.responseEnd - navTiming.requestStart;

    console.log(`⏱️  Total Page Load: ${(loadTime/1000).toFixed(2)}s`);
    console.log(`⏱️  DOM Ready: ${(domReady/1000).toFixed(2)}s`);
    console.log(`⏱️  Server Response: ${(responseTime/1000).toFixed(2)}s\n`);

    if (loadTime > 5000) {
      console.log('🔴 VERY SLOW (>5s) - Critical optimization needed!');
    } else if (loadTime > 3000) {
      console.log('🟡 SLOW (>3s) - Needs optimization');
    } else if (loadTime > 2000) {
      console.log('🟢 Acceptable (2-3s) - Room for improvement');
    } else {
      console.log('✅ FAST (<2s) - Good performance!');
    }
    console.log('\n');
  }

  // Get all resources
  const resources = performance.getEntriesByType('resource');
  const apiCalls = resources.filter(r => r.name.includes('/api/'));
  const images = resources.filter(r => r.initiatorType === 'img' || r.name.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i));
  const scripts = resources.filter(r => r.initiatorType === 'script' || r.name.includes('.js'));
  const css = resources.filter(r => r.initiatorType === 'css' || r.name.includes('.css'));

  console.log('📦 RESOURCE BREAKDOWN:');
  console.log(`   API Calls: ${apiCalls.length}`);
  console.log(`   Images: ${images.length}`);
  console.log(`   Scripts: ${scripts.length}`);
  console.log(`   CSS: ${css.length}`);
  console.log(`   Total: ${resources.length}\n`);

  // Find slowest resources
  const sorted = [...resources].sort((a, b) => b.duration - a.duration);
  console.log('🐌 TOP 10 SLOWEST RESOURCES:\n');
  sorted.slice(0, 10).forEach((r, i) => {
    const name = r.name.split('/').pop().split('?')[0].substring(0, 60);
    const type = r.initiatorType || 'other';
    const duration = Math.round(r.duration);
    const size = r.transferSize ? `${(r.transferSize/1024).toFixed(1)}KB` : 'cached';

    console.log(`${i+1}. ${duration}ms - ${size} - ${type} - ${name}`);
  });

  // Calculate total time in API calls
  const totalApiTime = apiCalls.reduce((sum, r) => sum + r.duration, 0);
  console.log(`\n⏱️  Total API Time: ${Math.round(totalApiTime)}ms`);

  // Calculate total size
  const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  console.log(`📦 Total Downloaded: ${(totalSize/1024/1024).toFixed(2)}MB\n`);

  // Check for duplicate API calls
  const apiUrls = apiCalls.map(r => r.name.split('?')[0]);
  const uniqueUrls = [...new Set(apiUrls)];
  const duplicates = apiUrls.filter((url, i) => apiUrls.indexOf(url) !== i);
  const uniqueDuplicates = [...new Set(duplicates)];

  console.log('🔄 API CALL ANALYSIS:');
  console.log(`   Unique endpoints: ${uniqueUrls.length}`);
  console.log(`   Total API calls: ${apiCalls.length}`);
  console.log(`   Duplicate calls: ${duplicates.length}\n`);

  if (uniqueDuplicates.length > 0) {
    console.log('❌ DUPLICATE API CALLS FOUND:\n');
    uniqueDuplicates.forEach(url => {
      const count = apiUrls.filter(u => u === url).length;
      const endpoint = url.replace('https://backend.dainostore.com', '');
      console.log(`   ${count}x ${endpoint}`);
    });
    console.log('\n');
  }

  // List all API calls
  console.log('📡 ALL API CALLS:\n');
  apiCalls.forEach((call, i) => {
    const endpoint = call.name.replace('https://backend.dainostore.com', '').substring(0, 80);
    const duration = Math.round(call.duration);
    const size = call.transferSize ? `${(call.transferSize/1024).toFixed(1)}KB` : 'cached';
    console.log(`   ${i+1}. ${duration}ms - ${size} - ${endpoint}`);
  });

  // Find largest resources
  console.log('\n\n📦 LARGEST RESOURCES:\n');
  const sortedBySize = [...resources].sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0));
  sortedBySize.slice(0, 10).forEach((r, i) => {
    if (r.transferSize > 0) {
      const name = r.name.split('/').pop().split('?')[0].substring(0, 60);
      const size = `${(r.transferSize/1024).toFixed(1)}KB`;
      const type = r.initiatorType || 'other';
      console.log(`${i+1}. ${size} - ${type} - ${name}`);
    }
  });

  // Recommendations
  console.log('\n\n💡 RECOMMENDATIONS:\n');

  if (apiCalls.length > 10) {
    console.log('❌ Too many API calls (>10)');
    console.log('   → Use batch translation endpoints');
    console.log('   → Combine related API calls\n');
  }

  if (duplicates.length > 0) {
    console.log('❌ Duplicate API calls detected');
    console.log('   → Check React Query keys for consistency');
    console.log('   → Lift queries to parent components\n');
  }

  if (totalApiTime > 2000) {
    console.log('⚠️  High total API time (>2s)');
    console.log('   → Enable Redis caching on uncached endpoints');
    console.log('   → Optimize slow queries\n');
  }

  const largestScript = scripts.reduce((max, s) => s.transferSize > (max.transferSize || 0) ? s : max, {});
  if (largestScript.transferSize > 500000) {
    console.log('❌ Large JavaScript bundle (>500KB)');
    console.log(`   → Main bundle: ${(largestScript.transferSize/1024).toFixed(1)}KB`);
    console.log('   → Implement code splitting');
    console.log('   → Use React.lazy() for routes\n');
  }

  const largestImage = images.reduce((max, img) => (img.transferSize || 0) > (max.transferSize || 0) ? img : max, {});
  if (largestImage.transferSize > 500000) {
    console.log('⚠️  Large image detected (>500KB)');
    console.log(`   → Image: ${(largestImage.transferSize/1024).toFixed(1)}KB`);
    console.log('   → Optimize images (WebP, compression)');
    console.log('   → Use responsive images (srcSet)\n');
  }

  console.log('✅ Analysis complete!');
  console.log('\n📖 Full guide: BOTTLENECK_IDENTIFICATION_GUIDE.md');
})();
