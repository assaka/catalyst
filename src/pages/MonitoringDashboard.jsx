import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Clock,
  Wrench
} from 'lucide-react';

export default function MonitoringDashboard() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">System Monitoring</h1>
        <p className="text-muted-foreground">Real-time application health and performance dashboard</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Activity className="w-16 h-16 text-muted-foreground/30" />
              <Wrench className="w-8 h-8 text-blue-500 absolute -bottom-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-2xl">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-lg text-muted-foreground">
              The System Monitoring Dashboard is currently under development.
            </p>
            <p className="text-sm text-muted-foreground">
              We're working hard to bring you comprehensive monitoring capabilities including:
            </p>
          </div>

          {/* Feature List */}
          <div className="grid gap-3 text-left max-w-md mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Real-time API performance tracking</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Error detection and alerting</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">System health indicators</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Performance analytics</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Schema validation monitoring</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
              <Clock className="w-3 h-3 mr-1" />
              In Development
            </Badge>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              This feature will be available in a future update. Thank you for your patience!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}