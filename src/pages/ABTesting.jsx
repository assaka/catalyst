import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FlaskConical, Target, BarChart3, Users, Zap, Clock, TrendingUp, Split } from 'lucide-react';

export default function ABTesting() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">A/B Testing</h1>
          <p className="text-muted-foreground">
            Test different versions of your store to optimize conversions
          </p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          <Clock className="w-4 h-4 mr-1" />
          Coming Soon
        </Badge>
      </div>

      {/* Coming Soon Banner */}
      <Card className="border-2 border-dashed border-orange-200 bg-orange-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-orange-100 p-6 mb-6">
            <FlaskConical className="w-12 h-12 text-orange-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">A/B Testing Coming Soon!</h2>
          <p className="text-gray-600 text-center max-w-md mb-6">
            Data-driven optimization is on its way. Test different page versions, buttons, content, and layouts to maximize your conversions.
          </p>
          <Button disabled className="bg-orange-600 hover:bg-orange-700">
            <Target className="w-4 h-4 mr-2" />
            Start Testing When Available
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
              <Split className="w-5 h-5 text-orange-600" />
              <span>Split Testing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Create multiple versions of your pages and automatically split traffic to determine which performs better.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Version A</span>
                <span>50% traffic</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Version B</span>
                <span>50% traffic</span>
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
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Conversion Tracking</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Monitor key metrics like conversion rates, revenue per visitor, and engagement to identify winning variations.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Conversion rate</span>
                <span>Track performance</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Revenue impact</span>
                <span>Measure success</span>
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
              <Users className="w-5 h-5 text-green-600" />
              <span>Audience Targeting</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Run targeted tests for specific customer segments, devices, locations, or traffic sources.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>New visitors</span>
                <span>Returning customers</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Mobile users</span>
                <span>Desktop users</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Types */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <span>Test Types Available</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-sm">Page Layout Tests</h4>
                <p className="text-xs text-gray-600">Test different page structures, navigation styles, and content layouts</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-sm">Button & CTA Tests</h4>
                <p className="text-xs text-gray-600">Optimize button colors, text, sizes, and placement for better clicks</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-sm">Product Page Tests</h4>
                <p className="text-xs text-gray-600">Test product descriptions, images, pricing displays, and checkout flows</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold text-sm">Content Tests</h4>
                <p className="text-xs text-gray-600">Compare headlines, copy, offers, and promotional messaging</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Key Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-sm">Conversion Rate</span>
                <Badge variant="secondary">Primary KPI</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-sm">Revenue per Visitor</span>
                <Badge variant="secondary">Revenue Impact</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-sm">Click-through Rate</span>
                <Badge variant="secondary">Engagement</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-sm">Time on Page</span>
                <Badge variant="secondary">User Behavior</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistical Significance */}
      <Card>
        <CardHeader>
          <CardTitle>Statistical Significance & Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">95% Confidence</h4>
              <p className="text-sm text-gray-600">
                Ensure statistical significance before making decisions
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Sample Size</h4>
              <p className="text-sm text-gray-600">
                Automatic calculation of required visitors for valid results
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="font-semibold mb-2">Test Duration</h4>
              <p className="text-sm text-gray-600">
                Run tests for optimal duration to account for weekly patterns
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}