/**
 * Dynamic Plugin Admin Page Loader
 * Loads and renders admin pages from plugin_admin_pages table
 * 100% database-driven - no hardcoded components!
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '@/api/client';

const DynamicPluginAdminPage = () => {
  const { pluginSlug, pageKey } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [PageComponent, setPageComponent] = useState(null);

  useEffect(() => {
    loadPluginAdminPage();
  }, [pluginSlug, pageKey]);

  const loadPluginAdminPage = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📄 Loading plugin admin page:', { pluginSlug, pageKey });

      // Get plugin ID from slug - try multiple API response formats
      const pluginResponse = await apiClient.get(`plugins/registry`);

      console.log('Plugin API response:', pluginResponse);
      console.log('Response data:', pluginResponse.data);

      // Try different response structures
      const plugins = pluginResponse.data?.data || pluginResponse.data || [];
      console.log('Plugins array:', plugins);
      console.log('Looking for slug:', pluginSlug);

      const plugin = Array.isArray(plugins)
        ? plugins.find(p => p.slug === pluginSlug)
        : null;

      if (!plugin) {
        console.error('❌ Plugin not found in response');
        if (Array.isArray(plugins)) {
          console.error('Available plugins:');
          plugins.forEach((p, i) => {
            console.error(`  ${i + 1}. Name: "${p.name}", Slug: "${p.slug}", ID: ${p.id}`);
          });
          console.error(`\nSearching for: "${pluginSlug}"`);
          console.error('Slug matches:', plugins.map(p => p.slug === pluginSlug));
        } else {
          console.error('Plugins is not an array:', plugins);
        }
        throw new Error(`Plugin not found: ${pluginSlug}`);
      }

      console.log('✅ Found plugin:', plugin.name, plugin.id);

      // Get admin page from plugin_admin_pages table
      const pagesResponse = await apiClient.get(`plugins/registry/${plugin.id}`);
      const adminPages = pagesResponse.data?.adminPages || [];

      console.log('📋 Admin pages for plugin:', adminPages.length);

      const adminPage = adminPages.find(p => p.page_key === pageKey);

      if (!adminPage) {
        throw new Error(`Admin page not found: ${pageKey}`);
      }

      console.log('✅ Found admin page:', adminPage.page_name);
      console.log('📝 Component code length:', adminPage.component_code?.length);

      // Create React component from database code
      const componentCode = adminPage.component_code;

      // Use Function constructor to create the component
      // The code should export default a React component
      const createComponent = new Function(
        'React',
        'useState',
        'useEffect',
        'apiClient',
        `
        ${componentCode}
        return (typeof exports !== 'undefined' && exports.default) || arguments[arguments.length - 1];
        `
      );

      const Component = createComponent(React, useState, useEffect, apiClient);

      setPageComponent(() => Component);
      setLoading(false);

    } catch (err) {
      console.error('❌ Failed to load plugin admin page:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plugin admin page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <a href="/admin/plugins" className="text-blue-600 hover:underline">
            ← Back to Plugins
          </a>
        </div>
      </div>
    );
  }

  if (!PageComponent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">No component loaded</p>
      </div>
    );
  }

  // Render the dynamic component
  return <PageComponent />;
};

export default DynamicPluginAdminPage;
