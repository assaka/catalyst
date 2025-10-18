// src/components/plugins/PluginWidgetRenderer.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function PluginWidgetRenderer({ widgetId, config, slotData }) {
  const [Widget, setWidget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWidget();
  }, [widgetId]);

  const loadWidget = async () => {
    try {
      setLoading(true);

      const response = await apiClient.get(`/plugins/widgets/${widgetId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load widget');
      }

      // Compile widget component from code
      const componentCode = response.widget.componentCode;
      const compiledComponent = compileWidgetComponent(componentCode);

      setWidget(() => compiledComponent);
    } catch (err) {
      console.error('Failed to load widget:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const compileWidgetComponent = (code) => {
    // SECURITY NOTE: This is a simplified example
    // In production, use proper sandboxing (iframe, web worker, etc.)
    try {
      // Create a safe scope
      const scope = {
        React,
        useState: React.useState,
        useEffect: React.useEffect,
        // Add other safe globals
      };

      // Compile code
      const func = new Function(...Object.keys(scope), `
        return ${code};
      `);

      return func(...Object.values(scope));
    } catch (error) {
      console.error('Failed to compile widget:', error);
      throw new Error('Invalid widget code');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load plugin widget: {error}</AlertDescription>
      </Alert>
    );
  }

  if (!Widget) {
    return (
      <Alert>
        <AlertDescription>Widget not found</AlertDescription>
      </Alert>
    );
  }

  // Render the plugin widget with error boundary
  return (
    <ErrorBoundary>
      <Widget config={config} slotData={slotData} />
    </ErrorBoundary>
  );
}

// Error boundary for plugin widgets
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertDescription>Widget crashed: {this.state.error?.message}</AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
