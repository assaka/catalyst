import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowDown } from 'lucide-react';
import apiClient from '@/api/client';

export default function ScrollDepthOverlay({ storeId, pageUrl, dateRange, viewportSize = { width: 1920, height: 1080 } }) {
  const [scrollData, setScrollData] = useState([]);
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingScreenshot, setLoadingScreenshot] = useState(false);
  const [error, setError] = useState(null);
  const imgRef = useRef(null);
  const [screenshotDimensions, setScreenshotDimensions] = useState(null);

  useEffect(() => {
    if (storeId && pageUrl) {
      loadScrollData();
      loadScreenshot();
    }
  }, [storeId, pageUrl, dateRange]);

  const loadScrollData = async () => {
    if (!storeId || !pageUrl) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page_url: pageUrl,
        bucket_size: 5 // Smaller buckets for smoother gradient
      });

      if (dateRange && dateRange !== 'all') {
        const now = new Date();
        let startDate;

        switch (dateRange) {
          case '1d':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }

        if (startDate) {
          params.append('start_date', startDate.toISOString());
          params.append('end_date', now.toISOString());
        }
      }

      const response = await apiClient.get(`heatmap/scroll-depth/${storeId}?${params}`);
      setScrollData(response.data || []);
    } catch (err) {
      console.error('Error loading scroll depth data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadScreenshot = async () => {
    if (!storeId || !pageUrl) return;

    setLoadingScreenshot(true);

    try {
      console.log('📸 [ScrollDepthOverlay] Requesting screenshot for:', pageUrl);

      const response = await apiClient.post(`heatmap/screenshot/${storeId}`, {
        url: pageUrl,
        viewportWidth: viewportSize.width,
        viewportHeight: viewportSize.height,
        fullPage: true
      });

      console.log('📸 [ScrollDepthOverlay] Screenshot response:', {
        hasResponse: !!response,
        hasScreenshot: !!response?.screenshot,
        responseKeys: response ? Object.keys(response) : []
      });

      if (response?.screenshot) {
        console.log('✅ [ScrollDepthOverlay] Screenshot loaded, length:', response.screenshot.length);
        setScreenshot(response.screenshot);
      } else {
        console.warn('⚠️ [ScrollDepthOverlay] No screenshot in response');
        setError('Screenshot not available in response');
      }
    } catch (err) {
      console.error('❌ [ScrollDepthOverlay] Error loading screenshot:', err);
      setError(err.message);
    } finally {
      setLoadingScreenshot(false);
    }
  };

  const getColorForPercentage = (percentage) => {
    // Color gradient from green (high engagement) to red (low engagement)
    if (percentage >= 80) return 'rgba(34, 197, 94, 0.4)';  // Green
    if (percentage >= 60) return 'rgba(234, 179, 8, 0.4)';   // Yellow
    if (percentage >= 40) return 'rgba(249, 115, 22, 0.4)';  // Orange
    if (percentage >= 20) return 'rgba(239, 68, 68, 0.4)';   // Red
    return 'rgba(127, 29, 29, 0.4)';  // Dark red
  };

  if (!pageUrl) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <ArrowDown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Enter a page URL to see scroll depth visualization</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDown className="w-5 h-5" />
            Scroll Depth Visualization
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadScrollData();
              loadScreenshot();
            }}
            disabled={loading || loadingScreenshot}
          >
            <RefreshCw className={`w-4 h-4 ${loading || loadingScreenshot ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-4 text-red-600">
            <p>Error: {error}</p>
          </div>
        )}

        {loadingScreenshot && (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading page screenshot...</p>
          </div>
        )}

        {!loadingScreenshot && screenshot && (
          <div className="space-y-4">
            {/* Description */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-900 mb-1">How to read this visualization:</p>
              <p className="text-blue-800">
                Colors show what percentage of users scrolled to each section.
                <span className="font-semibold"> Green = High engagement</span>,
                <span className="font-semibold"> Red = Most users left</span>.
              </p>
            </div>

            {/* Screenshot with overlay */}
            <div
              className="relative w-full border rounded-lg bg-gray-100 overflow-y-auto"
              style={{ maxHeight: '800px' }}
            >
              <div className="relative w-full">
                <img
                  ref={imgRef}
                  src={screenshot}
                  alt="Page screenshot"
                  className="w-full h-auto block"
                  style={{ opacity: 0.9 }}
                  onLoad={(e) => {
                    const img = e.target;
                    setScreenshotDimensions({
                      width: img.clientWidth,
                      height: img.clientHeight,
                      naturalHeight: img.naturalHeight
                    });
                  }}
                />

                {/* Scroll depth overlay */}
                {screenshotDimensions && scrollData.length > 0 && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {scrollData.map((item, index) => {
                      // Calculate position and height for this depth section
                      const depthPercent = item.depth_percent / 100;
                      const nextDepthPercent = scrollData[index + 1]?.depth_percent / 100 || 1;

                      const top = depthPercent * screenshotDimensions.height;
                      const height = (nextDepthPercent - depthPercent) * screenshotDimensions.height;

                      return (
                        <div
                          key={index}
                          className="absolute left-0 right-0 border-b border-white/30"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            backgroundColor: getColorForPercentage(item.percentage)
                          }}
                        >
                          {/* Percentage label */}
                          <div className="absolute right-2 top-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold backdrop-blur-sm">
                            {item.depth_percent}%: {item.percentage.toFixed(0)}% of users
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.6)' }}></div>
                <span className="text-gray-700">80-100% reached</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.6)' }}></div>
                <span className="text-gray-700">60-79% reached</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(249, 115, 22, 0.6)' }}></div>
                <span className="text-gray-700">40-59% reached</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.6)' }}></div>
                <span className="text-gray-700">&lt;40% reached</span>
              </div>
            </div>

            {/* Stats summary */}
            {scrollData.length > 0 && (
              <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Top of Page</p>
                  <p className="text-lg font-bold text-green-600">
                    {scrollData[0]?.percentage.toFixed(0)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Mid Page (50%)</p>
                  <p className="text-lg font-bold text-yellow-600">
                    {scrollData.find(d => d.depth_percent >= 45 && d.depth_percent <= 55)?.percentage.toFixed(0) || 'N/A'}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Bottom (90%+)</p>
                  <p className="text-lg font-bold text-red-600">
                    {scrollData.find(d => d.depth_percent >= 90)?.percentage.toFixed(0) || 'N/A'}%
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!loadingScreenshot && !screenshot && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <ArrowDown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 font-medium mb-2">
              {error ? 'Error loading screenshot' : 'Screenshot not available'}
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              variant="outline"
              size="sm"
              onClick={loadScreenshot}
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
