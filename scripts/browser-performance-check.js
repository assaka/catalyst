/**
 * Browser Performance Checker
 *
 * USAGE:
 * 1. Visit your product page
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Wait 5 seconds
 * 6. Check console for results
 */

(function() {
  console.clear();
  console.log('🔍 Performance Analysis Started...\n');
  console.log('⏳ Monitoring for 5 seconds...\n');

  // Track all fetch requests
  const requestLog = [];
  const originalFetch = window.fetch;

  window.fetch = function(...args) {
    const url = args[0];
    const start = performance.now();

    requestLog.push({
      url,
      timestamp: Date.now(),
      start
    });

    return originalFetch.apply(this, args).then(response => {
      const duration = performance.now() - start;
      const lastRequest = requestLog[requestLog.length - 1];
      lastRequest.duration = duration;
      lastRequest.status = response.status;
      lastRequest.size = response.headers.get('content-length');
      lastRequest.cached = response.headers.get('X-Cache');

      // Log immediately if slow
      if (duration > 500) {
        console.log(`⚠️  SLOW REQUEST (${Math.round(duration)}ms): ${url}`);
      }

      return response;
    });
  };

  // Track XHR requests (axios)
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    this._method = method;
    this._start = performance.now();
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function() {
    this.addEventListener('load', function() {
      const duration = performance.now() - this._start;
      requestLog.push({
        url: this._url,
        method: this._method,
        timestamp: Date.now(),
        duration,
        status: this.status,
        type: 'xhr'
      });

      if (duration > 500) {
        console.log(`⚠️  SLOW XHR (${Math.round(duration)}ms): ${this._url}`);
      }
    });

    return originalSend.apply(this, arguments);
  };

  // Analyze after 5 seconds
  setTimeout(() => {
    console.log('\n📊 PERFORMANCE ANALYSIS RESULTS\n');
    console.log('═══════════════════════════════\n');

    // 1. Total requests
    console.log(`📌 Total Requests: ${requestLog.length}`);

    // 2. Find duplicates
    const urlCounts = {};
    requestLog.forEach(req => {
      const baseUrl = req.url.split('?')[0]; // Ignore query params for duplicate detection
      urlCounts[baseUrl] = (urlCounts[baseUrl] || 0) + 1;
    });

    const duplicates = Object.entries(urlCounts).filter(([_, count]) => count > 1);
    console.log(`\n🔄 Duplicate Requests: ${duplicates.length}`);
    if (duplicates.length > 0) {
      console.log('\nDuplicate URLs:');
      duplicates.forEach(([url, count]) => {
        console.log(`  ${count}x - ${url}`);
      });
    } else {
      console.log('  ✅ No duplicates found!');
    }

    // 3. Slow requests
    const slowRequests = requestLog.filter(r => r.duration > 500);
    console.log(`\n🐌 Slow Requests (>500ms): ${slowRequests.length}`);
    if (slowRequests.length > 0) {
      console.log('\nSlowest requests:');
      slowRequests
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .forEach(req => {
          console.log(`  ${Math.round(req.duration)}ms - ${req.url}`);
        });
    } else {
      console.log('  ✅ All requests fast!');
    }

    // 4. Cache status
    const cached = requestLog.filter(r => r.cached === 'HIT').length;
    const cacheable = requestLog.filter(r => r.cached).length;
    const hitRate = cacheable > 0 ? ((cached / cacheable) * 100).toFixed(1) : 0;

    console.log(`\n💾 Cache Performance:`);
    console.log(`  Cache Hits: ${cached}`);
    console.log(`  Cache Misses: ${cacheable - cached}`);
    console.log(`  Hit Rate: ${hitRate}%`);
    if (hitRate < 50) {
      console.log(`  ⚠️  Low cache hit rate (target: >80%)`);
    } else if (hitRate > 80) {
      console.log(`  ✅ Excellent cache hit rate!`);
    }

    // 5. API request breakdown
    const apiRequests = requestLog.filter(r => r.url.includes('/api/'));
    console.log(`\n🌐 API Requests: ${apiRequests.length}`);

    // Group by endpoint
    const endpoints = {};
    apiRequests.forEach(req => {
      const path = req.url.match(/\/api\/([^?]*)/)?.[1] || 'unknown';
      endpoints[path] = (endpoints[path] || []);
      endpoints[path].push(req);
    });

    console.log('\nAPI Endpoints Called:');
    Object.entries(endpoints).forEach(([path, reqs]) => {
      const avgTime = reqs.reduce((sum, r) => sum + (r.duration || 0), 0) / reqs.length;
      console.log(`  ${reqs.length}x ${path} (avg: ${Math.round(avgTime)}ms)`);
    });

    // 6. Total time and waterfall
    const totalApiTime = apiRequests.reduce((sum, r) => sum + (r.duration || 0), 0);
    console.log(`\n⏱️  Total API Time: ${Math.round(totalApiTime)}ms`);

    // 7. Recommendations
    console.log('\n\n💡 RECOMMENDATIONS:\n');

    if (duplicates.length > 0) {
      console.log('❌ DUPLICATE REQUESTS FOUND:');
      console.log('   → Use React Query with consistent keys');
      console.log('   → Check React Query DevTools (red flower icon)\n');
    }

    if (slowRequests.length > 3) {
      console.log('❌ MULTIPLE SLOW REQUESTS:');
      console.log('   → Enable backend query logging');
      console.log('   → Check database indexes');
      console.log('   → Consider batch endpoints\n');
    }

    if (apiRequests.length > 10) {
      console.log('⚠️  HIGH API REQUEST COUNT:');
      console.log('   → Consider using batch translation endpoints');
      console.log('   → Use /api/translations/all/batch');
      console.log('   → Implement prefetching\n');
    }

    if (hitRate < 50) {
      console.log('⚠️  LOW CACHE HIT RATE:');
      console.log('   → Verify Redis is connected: /health/cache');
      console.log('   → Check cache middleware is applied');
      console.log('   → Increase React Query staleTime\n');
    }

    console.log('✅ Analysis complete!');
    console.log('\n📖 See BOTTLENECK_IDENTIFICATION_GUIDE.md for detailed troubleshooting\n');

    // Return detailed data for further inspection
    console.log('💾 Full data available in: window.__perfAnalysis');
    window.__perfAnalysis = {
      requests: requestLog,
      duplicates,
      slowRequests,
      apiRequests,
      endpoints,
      stats: {
        total: requestLog.length,
        duplicateCount: duplicates.length,
        slowCount: slowRequests.length,
        apiCount: apiRequests.length,
        cacheHitRate: hitRate,
        totalApiTime: Math.round(totalApiTime)
      }
    };

  }, 5000);

  console.log('✅ Performance monitoring active!\n');
  console.log('💡 TIP: Navigate to different pages to see all requests\n');

})();
