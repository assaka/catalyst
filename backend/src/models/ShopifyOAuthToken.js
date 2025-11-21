/**
 * ShopifyOAuthToken - Pure service class (NO SEQUELIZE)
 * Tenant data - uses ConnectionManager for database access
 */

const ShopifyOAuthToken = {};

// Static methods - use ConnectionManager for tenant DB access
ShopifyOAuthToken.findByStore = async function(storeId) {
  const ConnectionManager = require('../services/database/ConnectionManager');

  try {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data, error } = await tenantDb
      .from('shopify_oauth_tokens')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching Shopify OAuth token:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('ShopifyOAuthToken.findByStore error:', error);
    throw error;
  }
};

ShopifyOAuthToken.findByShopDomain = async function(shopDomain) {
  throw new Error('findByShopDomain is not supported - requires storeId for tenant isolation');
};

ShopifyOAuthToken.createOrUpdate = async function(storeId, tokenData) {
  const ConnectionManager = require('../services/database/ConnectionManager');
  const { v4: uuidv4 } = require('uuid');

  try {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Check if token exists
    const { data: existing } = await tenantDb
      .from('shopify_oauth_tokens')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { data, error } = await tenantDb
        .from('shopify_oauth_tokens')
        .update({
          ...tokenData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new
      const { data, error } = await tenantDb
        .from('shopify_oauth_tokens')
        .insert({
          id: uuidv4(),
          store_id: storeId,
          ...tokenData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('ShopifyOAuthToken.createOrUpdate error:', error);
    throw error;
  }
};

module.exports = ShopifyOAuthToken;
