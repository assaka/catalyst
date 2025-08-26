import React, { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  Settings,
  Maximize2,
  Home,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react';

const BrowserPreview = ({ 
  url = 'http://localhost:3000',
  className = '' 
}) => {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [inputUrl, setInputUrl] = useState(url);
  const [viewport, setViewport] = useState('desktop'); // desktop, tablet, mobile
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const iframeRef = useRef(null);

  useEffect(() => {
    setCurrentUrl(url);
    setInputUrl(url);
  }, [url]);

  const handleNavigate = () => {
    if (inputUrl !== currentUrl) {
      setIsLoading(true);
      setCurrentUrl(inputUrl);
      
      // Simulate loading delay
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
    
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleGoBack = () => {
    // In a real implementation, this would use browser history
    setCanGoBack(false);
    setCanGoForward(true);
  };

  const handleGoForward = () => {
    // In a real implementation, this would use browser history
    setCanGoForward(false);
    setCanGoBack(true);
  };

  const handleHome = () => {
    setInputUrl('http://localhost:3000');
    setCurrentUrl('http://localhost:3000');
  };

  const getViewportStyles = () => {
    switch (viewport) {
      case 'mobile':
        return {
          width: '375px',
          height: '667px',
          margin: '0 auto'
        };
      case 'tablet':
        return {
          width: '768px',
          height: '1024px',
          margin: '0 auto'
        };
      default:
        return {
          width: '100%',
          height: '100%'
        };
    }
  };

  const getViewportIcon = () => {
    switch (viewport) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className={`h-full flex flex-col bg-background ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Browser Header */}
      <div className="border-b">
        {/* Browser Controls */}
        <div className="flex items-center px-4 py-2 bg-muted/30">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              disabled={!canGoBack}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoForward}
              disabled={!canGoForward}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHome}
            >
              <Home className="w-4 h-4" />
            </Button>
          </div>

          {/* Address Bar */}
          <div className="flex-1 mx-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
                  className="pr-10"
                  placeholder="Enter URL..."
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <Button variant="outline" size="sm" onClick={handleNavigate}>
                Go
              </Button>
            </div>
          </div>

          {/* Viewport Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewport === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewport('desktop')}
                className="rounded-r-none"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={viewport === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewport('tablet')}
                className="rounded-none"
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                variant={viewport === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewport('mobile')}
                className="rounded-l-none"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Viewport Info */}
        <div className="px-4 py-1 bg-muted/50 text-xs text-muted-foreground border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {getViewportIcon()}
                <span className="capitalize">{viewport}</span>
                {viewport !== 'desktop' && (
                  <Badge variant="outline" className="text-xs">
                    {viewport === 'mobile' ? '375x667' : '768x1024'}
                  </Badge>
                )}
              </div>
              
              {currentUrl !== url && (
                <Badge variant="outline" className="text-xs">
                  Modified
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-xs h-6">
                <ExternalLink className="w-3 h-3 mr-1" />
                Open in new tab
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Browser Content */}
      <div className="flex-1 bg-muted/20 p-4 overflow-auto">
        <div style={getViewportStyles()}>
          {/* Mock Browser Content */}
          <Card className="h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Loading preview...</p>
                </div>
              </div>
            ) : (
              <div className="h-full">
                {/* Mock Storefront Content */}
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
                        <span className="text-primary-foreground font-bold">S</span>
                      </div>
                      <h1 className="text-2xl font-bold">Storefront</h1>
                    </div>
                    
                    <nav className="flex space-x-4">
                      <a href="#" className="text-sm hover:underline">Home</a>
                      <a href="#" className="text-sm hover:underline">Products</a>
                      <a href="#" className="text-sm hover:underline">About</a>
                      <a href="#" className="text-sm hover:underline">Cart (0)</a>
                    </nav>
                  </div>

                  {/* Hero Section */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg">
                    <h2 className="text-3xl font-bold mb-4">Welcome to our Store</h2>
                    <p className="text-lg mb-6">Discover amazing products at great prices</p>
                    <Button variant="secondary">Shop Now</Button>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="p-4">
                        <div className="aspect-square bg-muted rounded mb-4"></div>
                        <h3 className="font-semibold mb-2">Product {i}</h3>
                        <p className="text-muted-foreground text-sm mb-2">
                          Great product description that explains the benefits.
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">${(i * 25).toFixed(2)}</span>
                          <Button size="sm">Add to Cart</Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                    <div className="text-center p-6">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-green-600">✓</span>
                      </div>
                      <h4 className="font-semibold mb-2">Free Shipping</h4>
                      <p className="text-sm text-muted-foreground">
                        On orders over $50
                      </p>
                    </div>
                    
                    <div className="text-center p-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-blue-600">⚡</span>
                      </div>
                      <h4 className="font-semibold mb-2">Fast Delivery</h4>
                      <p className="text-sm text-muted-foreground">
                        2-day shipping available
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Status Info */}
      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Preview Mode: {viewport}</span>
          <span>URL: {currentUrl}</span>
        </div>
      </div>
    </div>
  );
};

export default BrowserPreview;