import React from 'react';
import { Container, Box } from '@mui/material';
import PluginRenderer from '../components/PluginHooks/PluginRenderer';
import { PLUGIN_HOOKS } from '../components/PluginHooks/hooks';

const HomePage = () => {
  const storeId = localStorage.getItem('selectedStoreId') || 'demo-store';
  
  // Context data that will be passed to plugins
  const pageContext = {
    pageType: 'homepage',
    storeName: 'Demo Store',
    user: null, // Would be populated if user is logged in
    featuredProducts: [], // Would come from API
    collections: [] // Would come from API
  };

  return (
    <>
      {/* Global Header Plugins */}
      <PluginRenderer
        hookName={PLUGIN_HOOKS.GLOBAL_HEADER}
        storeId={storeId}
        context={pageContext}
        className="global-header-plugins"
      />

      {/* Homepage Header Plugins */}
      <PluginRenderer
        hookName={PLUGIN_HOOKS.HOMEPAGE_HEADER}
        storeId={storeId}
        context={pageContext}
        className="homepage-header-plugins"
        showErrors={true} // Show errors in development
      />

      {/* Homepage Hero Plugins */}
      <PluginRenderer
        hookName={PLUGIN_HOOKS.HOMEPAGE_HERO}
        storeId={storeId}
        context={pageContext}
        className="homepage-hero-plugins"
      />

      <Container maxWidth="lg">
        {/* Main Homepage Content */}
        <Box sx={{ py: 4 }}>
          <h1>Welcome to Our Store</h1>
          
          {/* Homepage Content Plugins */}
          <PluginRenderer
            hookName={PLUGIN_HOOKS.HOMEPAGE_CONTENT}
            storeId={storeId}
            context={pageContext}
            className="homepage-content-plugins"
          />

          {/* Your existing homepage content */}
          <Box sx={{ my: 4 }}>
            <p>This is the main homepage content.</p>
            <p>Plugins can add content above, below, or around this content.</p>
          </Box>
        </Box>
      </Container>

      {/* Homepage Footer Plugins */}
      <PluginRenderer
        hookName={PLUGIN_HOOKS.HOMEPAGE_FOOTER}
        storeId={storeId}
        context={pageContext}
        className="homepage-footer-plugins"
      />

      {/* Global Footer Plugins */}
      <PluginRenderer
        hookName={PLUGIN_HOOKS.GLOBAL_FOOTER}
        storeId={storeId}
        context={pageContext}
        className="global-footer-plugins"
      />
    </>
  );
};

export default HomePage;