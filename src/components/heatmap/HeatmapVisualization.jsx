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
    this.ctx = canvas.getContext('2d');
    this.options = {
      radius: 20,
      blur: 15,
      maxOpacity: 0.8,
      minOpacity: 0.1,
      gradient: {
        0.0: '#000080',  // Dark blue (cold)
        0.25: '#0000FF', // Blue
        0.5: '#00FF00',  // Green
        0.75: '#FFFF00', // Yellow
        1.0: '#FF0000'   // Red (hot)
      },
      ...options
    };

    this.colorStops = Object.keys(this.options.gradient).map(Number);
    this.setupCanvas();
  }

  setupCanvas() {
    // Set canvas size
    this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.offsetHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set canvas style size
    this.canvas.style.width = this.canvas.offsetWidth + 'px';
    this.canvas.style.height = this.canvas.offsetHeight + 'px';
  }

  render(dataPoints) {
    if (!dataPoints || dataPoints.length === 0) {
      this.clear();
      return;
    }

    this.clear();
    
    // Find max intensity for normalization
    const maxIntensity = Math.max(...dataPoints.map(p => p.total_count));
    
    // Create gradient
    const gradient = this.createGradient();

    dataPoints.forEach(point => {
      const intensity = point.total_count / maxIntensity;
      const opacity = this.options.minOpacity + 
        (intensity * (this.options.maxOpacity - this.options.minOpacity));
      
      this.drawHeatPoint(point.x, point.y, opacity, gradient);
    });
  }

  drawHeatPoint(x, y, intensity, gradient) {
    const radius = this.options.radius;
    
    // Create radial gradient for this point
    const radGradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    radGradient.addColorStop(0, `rgba(255, 0, 0, ${intensity})`);
    radGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    this.ctx.globalCompositeOperation = 'screen';
    this.ctx.fillStyle = radGradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalCompositeOperation = 'source-over';
  }

  createGradient() {
    // Create a temporary canvas for gradient
    const gradCanvas = document.createElement('canvas');
    gradCanvas.width = 256;
    gradCanvas.height = 1;
    const gradCtx = gradCanvas.getContext('2d');
    
    const gradient = gradCtx.createLinearGradient(0, 0, 256, 0);
    
    Object.entries(this.options.gradient).forEach(([stop, color]) => {
      gradient.addColorStop(parseFloat(stop), color);
    });
    
    gradCtx.fillStyle = gradient;
    gradCtx.fillRect(0, 0, 256, 1);
    
    return gradCtx.getImageData(0, 0, 256, 1).data;
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
  className = '' 
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const [pageUrl, setPageUrl] = useState(initialPageUrl);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeStats, setRealTimeStats] = useState(null);
  
  // Filters
  const [interactionType, setInteractionType] = useState('click');
  const [deviceType, setDeviceType] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 1920, height: 1080 });

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
    }
  }, [storeId, pageUrl, interactionType, deviceType, dateRange]);

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
      setHeatmapData(response.data || []);
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
                onClick={loadHeatmapData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportHeatmapData}
                disabled={!heatmapData || heatmapData.length === 0}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-sm mt-2">Try adjusting the date range or interaction type.</p>
            </div>
          )}

          {!loading && !error && !pageUrl && (
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Enter a page URL above to visualize customer behavior</p>
              <p className="text-sm mt-2">The heatmap will show clicks, hovers, and scrolling patterns</p>
            </div>
          )}

          {/* Canvas Container */}
          <div className="relative w-full" style={{ height: '600px' }}>
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full border rounded-lg bg-white"
              style={{ 
                width: '100%', 
                height: '100%',
                imageRendering: 'auto'
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