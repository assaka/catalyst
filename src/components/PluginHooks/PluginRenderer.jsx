import React, { useState, useEffect } from 'react';
import { Alert, Skeleton, Box } from '@mui/material';

/**
 * PluginRenderer - Component for rendering plugin content in frontend hooks
 * 
 * This component:
 * - Fetches enabled plugins for specific hooks
 * - Renders plugin content safely
 * - Handles errors gracefully
 * - Provides loading states
 * - Manages plugin configuration
 */
const PluginRenderer = ({ 
  hookName, 
  storeId, 
  context = {}, 
  className = '',
  showErrors = false,
  timeout = 5000 
}) => {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHookPlugins();
  }, [hookName, storeId]);

  /**
   * Fetch plugins enabled for this hook
   */
  const fetchHookPlugins = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/stores/${storeId}/plugins/hooks/${hookName}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch plugins: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setPlugins(data.data.plugins || []);
      } else {
        throw new Error(data.error || 'Failed to load plugins');
      }
    } catch (err) {
      console.error(`Error fetching plugins for hook ${hookName}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box className={`plugin-hook-${hookName} ${className}`}>
        <Skeleton variant="rectangular" height={60} />
      </Box>
    );
  }

  if (error && showErrors) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Plugin loading error: {error}
      </Alert>
    );
  }

  if (!plugins.length) {
    return null; // No plugins to render
  }

  return (
    <div className={`plugin-hook-${hookName} ${className}`}>
      {plugins.map((plugin) => (
        <PluginContent
          key={plugin.id}
          plugin={plugin}
          hookName={hookName}
          storeId={storeId}
          context={context}
          showErrors={showErrors}
          timeout={timeout}
        />
      ))}
    </div>
  );
};

/**
 * Individual plugin content renderer
 */
const PluginContent = ({ 
  plugin, 
  hookName, 
  storeId, 
  context, 
  showErrors, 
  timeout 
}) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    renderPlugin();
  }, [plugin.id]);

  /**
   * Render plugin content via API
   */
  const renderPlugin = async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`/api/stores/${storeId}/plugins/${plugin.slug}/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hookName,
          context: {
            ...context,
            store: { id: storeId, name: context.storeName || 'Store' },
            timestamp: Date.now()
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Plugin render failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setContent(data.content || '');
      } else {
        throw new Error(data.error || 'Plugin execution failed');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Plugin execution timeout');
      } else {
        setError(err.message);
      }
      console.error(`Error rendering plugin ${plugin.slug}:`, err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`plugin-${plugin.slug}-loading`}>
        <Skeleton variant="rectangular" height={40} />
      </div>
    );
  }

  if (error) {
    if (showErrors) {
      return (
        <Alert severity="error" size="small" sx={{ mb: 1 }}>
          Plugin "{plugin.name}": {error}
        </Alert>
      );
    }
    return null; // Hide errors in production
  }

  if (!content) {
    return null; // No content to show
  }

  return (
    <div 
      className={`plugin-${plugin.slug} plugin-category-${plugin.category}`}
      data-plugin-id={plugin.id}
      data-plugin-name={plugin.name}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default PluginRenderer;