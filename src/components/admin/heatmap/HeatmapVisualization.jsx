import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/api/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  MousePointer, 
  Scroll, 
  Smartphone, 
  Monitor, 
  Tablet,
  RefreshCw,
  Download,
  Zap,
  BarChart3,
  Filter
} from 'lucide-react';

class HeatmapRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.options = {
      radius: 30,
      blur: 20,
      maxOpacity: 0.9,
      minOpacity: 0,
      gradient: {
        0.0: 'rgba(0, 0, 255, 0)',      // Transparent blue
        0.2: 'rgba(0, 0, 255, 0.5)',    // Blue
        0.4: 'rgba(0, 255, 255, 0.7)',  // Cyan
        0.6: 'rgba(0, 255, 0, 0.8)',    // Green
        0.8: 'rgba(255, 255, 0, 0.9)',  // Yellow
        1.0: 'rgba(255, 0, 0, 1)'       // Red
      },
      ...options
    };

    this.setupCanvas();
    this.gradientTexture = this.createGradientTexture();
  }

  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    this.width = rect.width;
    this.height = rect.height;
  }

  render(dataPoints) {
    if (!dataPoints || dataPoints.length === 0) {
      this.clear();
      return;
    }

    // Ensure canvas is properly sized
    if (!this.width || !this.height || this.width <= 0 || this.height <= 0) {
      console.warn('HeatmapRenderer: Invalid canvas dimensions', { width: this.width, height: this.height });
      this.setupCanvas();
    }

    this.clear();

    // Filter out invalid points and normalize coordinates
    const validPoints = dataPoints.filter(point => {
      const x = parseFloat(point.x);
      const y = parseFloat(point.y);
      const isValid = (
        point.x !== null && point.x !== undefined &&
        point.y !== null && point.y !== undefined &&
        !isNaN(x) && !isNaN(y) &&
        isFinite(x) && isFinite(y) &&
        x >= 0 && y >= 0 &&
        this.width > 0 && this.height > 0 &&
        x <= this.width && y <= this.height
      );

      if (!isValid && process.env.NODE_ENV === 'development') {
        console.debug('HeatmapRenderer: Filtered out invalid point', {
          point,
          x,
          y,
          canvasWidth: this.width,
          canvasHeight: this.height
        });
      }

      return isValid;
    });

    if (validPoints.length === 0) {
      console.warn('HeatmapRenderer: No valid points to render', {
        total: dataPoints.length,
        sample: dataPoints.slice(0, 3)
      });
      this.clear();
      return;
    }

    // Find max intensity for normalization
    const maxIntensity = Math.max(...validPoints.map(p => p.total_count || 1));

    // Create intensity map first
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d', { alpha: true });

    if (!tempCtx) {
      console.error('HeatmapRenderer: Failed to get 2d context');
      return;
    }

    // Draw intensity circles
    validPoints.forEach(point => {
      const x = parseFloat(point.x);
      const y = parseFloat(point.y);

      // Extra validation before canvas operations
      if (!isFinite(x) || !isFinite(y) || x < 0 || y < 0 || x > this.width || y > this.height) {
        return;
      }

      const normalizedIntensity = (point.total_count || 1) / maxIntensity;
      const intensity = this.options.minOpacity +
        (normalizedIntensity * (this.options.maxOpacity - this.options.minOpacity));

      const radius = this.options.radius;

      // Validate radius is finite
      if (!isFinite(radius) || radius <= 0) {
        console.error('HeatmapRenderer: Invalid radius', radius);
        return;
      }

      try {
        // Create radial gradient for smooth falloff
        const gradient = tempCtx.createRadialGradient(
          x, y, 0,
          x, y, radius
        );

        gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${intensity * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        tempCtx.fillStyle = gradient;
        tempCtx.fillRect(
          x - radius,
          y - radius,
          radius * 2,
          radius * 2
        );
      } catch (error) {
        console.error('HeatmapRenderer: Error creating gradient', { x, y, radius, error });
      }
    });

    // Apply color gradient
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3] / 255;

      if (alpha > 0) {
        const color = this.getColorForIntensity(alpha);
        pixels[i] = color.r;
        pixels[i + 1] = color.g;
        pixels[i + 2] = color.b;
        pixels[i + 3] = color.a * 255;
      }
    }

    // Draw colored heatmap
    this.ctx.putImageData(imageData, 0, 0);
  }

  getColorForIntensity(intensity) {
    const stops = Object.keys(this.options.gradient)
      .map(Number)
      .sort((a, b) => a - b);

    // Find the two stops to interpolate between
    let lowerStop = stops[0];
    let upperStop = stops[stops.length - 1];

    for (let i = 0; i < stops.length - 1; i++) {
      if (intensity >= stops[i] && intensity <= stops[i + 1]) {
        lowerStop = stops[i];
        upperStop = stops[i + 1];
        break;
      }
    }

    // Interpolate between colors
    const lowerColor = this.parseColor(this.options.gradient[lowerStop]);
    const upperColor = this.parseColor(this.options.gradient[upperStop]);

    const range = upperStop - lowerStop;
    const rangeIntensity = (intensity - lowerStop) / range;

    return {
      r: Math.round(lowerColor.r + (upperColor.r - lowerColor.r) * rangeIntensity),
      g: Math.round(lowerColor.g + (upperColor.g - lowerColor.g) * rangeIntensity),
      b: Math.round(lowerColor.b + (upperColor.b - lowerColor.b) * rangeIntensity),
      a: lowerColor.a + (upperColor.a - lowerColor.a) * rangeIntensity
    };
  }

  parseColor(colorString) {
    const rgba = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]*)\)/);
    if (rgba) {
      return {
        r: parseInt(rgba[1]),
        g: parseInt(rgba[2]),
        b: parseInt(rgba[3]),
        a: rgba[4] ? parseFloat(rgba[4]) : 1
      };
    }
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  createGradientTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    Object.entries(this.options.gradient).forEach(([stop, color]) => {
      gradient.addColorStop(parseFloat(stop), color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 1);

    return ctx.getImageData(0, 0, 256, 1).data;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize() {
    this.setupCanvas();
  }
}

export default function HeatmapVisualization({
  storeId,
  initialPageUrl = '',
  className = '',
  onPageUrlChange,
  onDateRangeChange
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const [pageUrl, setPageUrl] = useState(initialPageUrl);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeStats, setRealTimeStats] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [loadingScreenshot, setLoadingScreenshot] = useState(false);

  // Filters
  const [interactionType, setInteractionType] = useState('click');
  const [deviceType, setDeviceType] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 1920, height: 1080 });

  // Notify parent of state changes
  useEffect(() => {
    if (onPageUrlChange) {
      onPageUrlChange(pageUrl);
    }
  }, [pageUrl, onPageUrlChange]);

  useEffect(() => {
    if (onDateRangeChange) {
      onDateRangeChange(dateRange);
    }
  }, [dateRange, onDateRangeChange]);

  // Auto refresh interval
  useEffect(() => {
    if (!autoRefresh || !storeId || !pageUrl) return;

    const interval = setInterval(() => {
      loadHeatmapData();
      loadRealTimeStats();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, storeId, pageUrl, interactionType, deviceType, dateRange]);

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    rendererRef.current = new HeatmapRenderer(canvasRef.current, {
      radius: interactionType === 'hover' ? 15 : 25,
      blur: interactionType === 'scroll' ? 30 : 20,
      maxOpacity: 0.8
    });

    const handleResize = () => {
      if (rendererRef.current) {
        rendererRef.current.resize();
        if (heatmapData.length > 0) {
          rendererRef.current.render(heatmapData);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef.current, interactionType]);

  // Render heatmap when data changes
  useEffect(() => {
    if (rendererRef.current && heatmapData) {
      rendererRef.current.render(heatmapData);
    }
  }, [heatmapData]);

  // Load initial data
  useEffect(() => {
    if (storeId && pageUrl) {
      loadHeatmapData();
      loadRealTimeStats();
      loadScreenshot();
    }
  }, [storeId, pageUrl, interactionType, deviceType, dateRange, viewportSize.width, viewportSize.height]);

  const loadHeatmapData = async () => {
    if (!storeId || !pageUrl) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page_url: pageUrl,
        interaction_types: interactionType === 'all' ? 'click,hover,scroll' : interactionType,
        device_types: deviceType === 'all' ? 'desktop,tablet,mobile' : deviceType,
        viewport_width: viewportSize.width,
        viewport_height: viewportSize.height
      });

      // Add date range
      if (dateRange !== 'all') {
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

      const response = await apiClient.get(`heatmap/data/${storeId}?${params}`);

      console.log('Heatmap API response:', {
        dataLength: response.data?.length,
        sampleData: response.data?.slice(0, 3)
      });

      // Get the actual canvas size for coordinate scaling
      const canvas = canvasRef.current;
      const canvasRect = canvas ? canvas.getBoundingClientRect() : { width: viewportSize.width, height: viewportSize.height };
      const scaleX = canvasRect.width / viewportSize.width;
      const scaleY = canvasRect.height / viewportSize.height;

      console.log('Canvas scaling:', {
        canvasSize: { width: canvasRect.width, height: canvasRect.height },
        targetViewport: viewportSize,
        scale: { x: scaleX, y: scaleY }
      });

      // Transform and scale the data to match the actual canvas size
      const transformedData = (response.data || []).map(point => {
        const normalizedX = point.normalized_x ?? point.x_coordinate ?? null;
        const normalizedY = point.normalized_y ?? point.y_coordinate ?? null;

        // Scale coordinates to match canvas size
        const scaledX = normalizedX !== null ? normalizedX * scaleX : null;
        const scaledY = normalizedY !== null ? normalizedY * scaleY : null;

        return {
          ...point,
          x: scaledX !== null && !isNaN(parseFloat(scaledX)) ? parseFloat(scaledX) : null,
          y: scaledY !== null && !isNaN(parseFloat(scaledY)) ? parseFloat(scaledY) : null,
          total_count: 1 // Each point represents one interaction
        };
      });

      console.log('Transformed data:', {
        total: transformedData.length,
        sampleTransformed: transformedData.slice(0, 3),
        nullCoords: transformedData.filter(p => p.x === null || p.y === null).length
      });

      // Group by coordinates and count occurrences
      const groupedData = {};
      transformedData.forEach(point => {
        // Skip points with null coordinates
        if (point.x === null || point.y === null) return;

        const x = Math.round(point.x);
        const y = Math.round(point.y);

        // Skip invalid coordinates
        if (!isFinite(x) || !isFinite(y)) return;

        const key = `${x},${y}`;
        if (!groupedData[key]) {
          groupedData[key] = {
            x: x,
            y: y,
            total_count: 0
          };
        }
        groupedData[key].total_count++;
      });

      const finalData = Object.values(groupedData);
      console.log('Final grouped data:', {
        points: finalData.length,
        sample: finalData.slice(0, 5)
      });

      setHeatmapData(finalData);
    } catch (err) {
      console.error('Error loading heatmap data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeStats = async () => {
    if (!storeId) return;

    try {
      const response = await apiClient.get(`heatmap/realtime/${storeId}?time_window=300000`);
      setRealTimeStats(response.data);
    } catch (err) {
      console.warn('Error loading real-time stats:', err);
    }
  };

  const loadScreenshot = async () => {
    if (!storeId || !pageUrl) return;

    setLoadingScreenshot(true);

    try {
      console.log('📸 Requesting screenshot for:', pageUrl);

      const response = await apiClient.post(`heatmap/screenshot/${storeId}`, {
        url: pageUrl,
        viewportWidth: viewportSize.width,
        viewportHeight: viewportSize.height,
        fullPage: true
      });

      if (response.data?.screenshot) {
        console.log('✅ Screenshot loaded successfully');
        setScreenshot(response.data.screenshot);
      }
    } catch (err) {
      console.error('Error loading screenshot:', err);
      // Don't set error state, just log it - screenshot is optional
      setScreenshot(null);
    } finally {
      setLoadingScreenshot(false);
    }
  };

  const exportHeatmapData = async () => {
    try {
      // Export current view as JSON
      const exportData = {
        store_id: storeId,
        page_url: pageUrl,
        interaction_type: interactionType,
        device_type: deviceType,
        date_range: dateRange,
        viewport: viewportSize,
        data: heatmapData,
        exported_at: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heatmap-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting heatmap data:', err);
    }
  };

  const getInteractionIcon = (type) => {
    switch (type) {
      case 'click': return <MousePointer className="w-4 h-4" />;
      case 'hover': return <Eye className="w-4 h-4" />;
      case 'scroll': return <Scroll className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Customer Behavior Heatmap
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="auto-refresh" className="text-sm">
                  {autoRefresh ? <Zap className="w-4 h-4" /> : 'Auto-refresh'}
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadHeatmapData();
                  loadScreenshot();
                }}
                disabled={loading || loadingScreenshot}
                title="Refresh data and screenshot"
              >
                <RefreshCw className={`w-4 h-4 ${loading || loadingScreenshot ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportHeatmapData}
                disabled={!heatmapData || heatmapData.length === 0}
                title="Export heatmap data"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="page-url">Page URL</Label>
              <Input
                id="page-url"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                placeholder="Enter page URL to analyze"
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="interaction-type">Interaction Type</Label>
              <Select value={interactionType} onValueChange={setInteractionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Interactions</SelectItem>
                  <SelectItem value="click">Clicks</SelectItem>
                  <SelectItem value="hover">Hovers</SelectItem>
                  <SelectItem value="scroll">Scrolling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="device-type">Device Type</Label>
              <Select value={deviceType} onValueChange={setDeviceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="viewport-size">Viewport Size</Label>
              <Select
                value={`${viewportSize.width}x${viewportSize.height}`}
                onValueChange={(value) => {
                  const [width, height] = value.split('x').map(Number);
                  setViewportSize({ width, height });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1920x1080">1920×1080 (Full HD)</SelectItem>
                  <SelectItem value="1366x768">1366×768 (Laptop)</SelectItem>
                  <SelectItem value="1536x864">1536×864 (Laptop)</SelectItem>
                  <SelectItem value="2560x1440">2560×1440 (2K)</SelectItem>
                  <SelectItem value="3840x2160">3840×2160 (4K)</SelectItem>
                  <SelectItem value="768x1024">768×1024 (Tablet)</SelectItem>
                  <SelectItem value="375x667">375×667 (Mobile)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Real-time stats */}
          {realTimeStats && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Live Activity (5 min)</span>
              </div>
              <div className="flex gap-4">
                {realTimeStats.stats?.map((stat, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {getInteractionIcon(stat.interaction_type)}
                    {stat.count} {stat.interaction_type}s
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Heatmap Canvas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Heatmap Visualization</h3>
              <p className="text-sm text-gray-600">
                {pageUrl || 'Enter a page URL to see customer interactions'}
              </p>
            </div>
            {heatmapData.length > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {heatmapData.length} interaction points
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {getInteractionIcon(interactionType)}
                  {interactionType === 'all' ? 'All interactions' : interactionType}
                  •
                  {getDeviceIcon(deviceType)}
                  {deviceType === 'all' ? 'All devices' : deviceType}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8 text-red-600">
              <p>Error loading heatmap: {error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadHeatmapData}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Loading heatmap data...</p>
            </div>
          )}

          {!loading && !error && heatmapData.length === 0 && pageUrl && (
            <div className="text-center py-8 text-gray-500">
              <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No interaction data found for the specified filters.</p>
              <p className="text-sm mt-2">Try adjusting the date range, interaction type, or viewport size.</p>
              <p className="text-xs mt-2 text-gray-400">
                Tip: Make sure the viewport size matches the screen where you tested the page.
              </p>
            </div>
          )}

          {!loading && !error && !pageUrl && (
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Enter a page URL above to visualize customer behavior</p>
              <p className="text-sm mt-2">The heatmap will show clicks, hovers, and scrolling patterns</p>
            </div>
          )}

          {/* Canvas Container - sized to maintain viewport aspect ratio */}
          <div
            className="relative w-full border rounded-lg bg-gray-100 overflow-hidden"
            style={{
              height: '700px' // Larger canvas for better visualization
            }}
          >
            {/* Screenshot background */}
            {loadingScreenshot && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-sm text-gray-600">Capturing page screenshot...</p>
                </div>
              </div>
            )}

            {screenshot && !loadingScreenshot && (
              <img
                src={screenshot}
                alt="Page screenshot"
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  opacity: 0.7, // Make screenshot slightly transparent so heatmap shows well
                  pointerEvents: 'none'
                }}
              />
            )}

            {/* Heatmap overlay canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{
                width: '100%',
                height: '100%',
                imageRendering: 'auto',
                backgroundColor: screenshot ? 'transparent' : 'white'
              }}
            />

            {/* Color Legend */}
            {heatmapData.length > 0 && (
              <div className="absolute bottom-4 right-4 bg-white border rounded-lg p-3 shadow-sm">
                <div className="text-xs font-medium mb-2">Activity Level</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Low</span>
                  <div className="w-20 h-3 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 rounded"></div>
                  <span className="text-xs">High</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}