import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Eye, MousePointer, Smartphone, Monitor, Tablet, Clock, TrendingUp } from 'lucide-react';

export default function HeatMaps() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HeatMaps</h1>
          <p className="text-muted-foreground">
            Visualize user behavior and interactions on your store
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Clock className="w-4 h-4 mr-1" />
          Coming Soon
        </Badge>
      </div>

      {/* Coming Soon Banner */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-blue-100 p-6 mb-6">
            <Activity className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">HeatMaps Coming Soon!</h2>
          <p className="text-gray-600 text-center max-w-md mb-6">
            We're working on powerful heatmap analytics to help you understand exactly how customers interact with your store.
          </p>
          <Button disabled className="bg-blue-600 hover:bg-blue-700">
            <TrendingUp className="w-4 h-4 mr-2" />
            Get Notified When Available
          </Button>
        </CardContent>
      </Card>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-xs">Soon</Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MousePointer className="w-5 h-5 text-blue-600" />
              <span>Click Tracking</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              See exactly where customers click on your pages. Identify popular buttons, links, and areas that get the most attention.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Button clicks</span>
                <span>Track interactions</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Link clicks</span>
                <span>Optimize placement</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-xs">Soon</Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-green-600" />
              <span>Scroll Heatmaps</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Understand how far down your pages customers scroll. Optimize content placement for maximum visibility.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Scroll depth</span>
                <span>Content visibility</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Attention zones</span>
                <span>Fold optimization</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-xs">Soon</Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-purple-600" />
              <span>Device Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Compare behavior patterns across desktop, tablet, and mobile devices to optimize for each platform.
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <div className="flex flex-col items-center">
                <Monitor className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Desktop</span>
              </div>
              <div className="flex flex-col items-center">
                <Tablet className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Tablet</span>
              </div>
              <div className="flex flex-col items-center">
                <Smartphone className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Mobile</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What's Coming */}
      <Card>
        <CardHeader>
          <CardTitle>What's Coming in HeatMaps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">User Behavior Analysis</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Real-time click tracking
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Mouse movement heatmaps
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Scroll depth analysis
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Form interaction tracking
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Advanced Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Page performance correlation
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Conversion funnel heatmaps
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Customer segment analysis
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Export and reporting tools
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}