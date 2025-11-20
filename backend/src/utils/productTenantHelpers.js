/**
 * Product Tenant Helpers for Multi-Tenant Database Architecture
 *
 * These helpers fetch product data from tenant-specific databases using ConnectionManager
 */

const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * Get products from tenant database with pagination
 *
 * @param {string} storeId - Store UUID
 * @param {Object} filters - Filter options {category_id, status, search, slug, sku, id}
 * @param {Object} pagination - Pagination options {limit, offset}
 * @returns {Promise<Object>} Products with count
 */
async function getProducts(storeId, filters = {}, pagination = {}) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);
  const { limit = 100, offset = 0 } = pagination;

  // Build query with count option
  let query = tenantDb.from('products').select('*', { count: 'exact' });

  // Apply filters
  if (filters.category_id) {
    // category_ids is stored as JSON array
    query = query.contains('category_ids', [filters.category_id]);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.slug) {
    query = query.eq('slug', filters.slug);
  }
  if (filters.sku) {
    query = query.eq('sku', filters.sku);
  }
  if (filters.id) {
    query = query.eq('id', filters.id);
  }
  if (filters.search) {
    // Search in SKU only for now
    query = query.ilike('sku', `%${filters.search}%`);
  }

  // Get paginated data with count
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: products, error, count } = await query;

  if (error) throw error;

  return {
    rows: products || [],
    count: count || 0
  };
}

/**
 * Get product by ID from tenant database
 *
 * @param {string} storeId - Store UUID
 * @param {string} productId - Product UUID
 * @returns {Promise<Object|null>} Product or null
 */
async function getProductById(storeId, productId) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  const { data: product, error } = await tenantDb
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) return null;

  return product;
}

/**
 * Create product in tenant database
 *
 * @param {string} storeId - Store UUID
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product
 */
async function createProduct(storeId, productData) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  const { data: product, error } = await tenantDb
    .from('products')
    .insert({
      ...productData,
      store_id: storeId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  return product;
}

/**
 * Update product in tenant database
 *
 * @param {string} storeId - Store UUID
 * @param {string} productId - Product UUID
 * @param {Object} productData - Product data to update
 * @returns {Promise<Object>} Updated product
 */
async function updateProduct(storeId, productId, productData) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  const updateFields = {
    ...productData,
    updated_at: new Date().toISOString()
  };

  const { error } = await tenantDb
    .from('products')
    .update(updateFields)
    .eq('id', productId);

  if (error) throw error;

  // Return updated product
  return await getProductById(storeId, productId);
}

/**
 * Delete product from tenant database
 *
 * @param {string} storeId - Store UUID
 * @param {string} productId - Product UUID
 * @returns {Promise<void>}
 */
async function deleteProduct(storeId, productId) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Delete translations first
  await tenantDb
    .from('product_translations')
    .delete()
    .eq('product_id', productId);

  // Delete the product
  const { error } = await tenantDb
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) throw error;
}

/**
 * Get all products for a store from tenant database (for bulk operations)
 *
 * @param {string} storeId - Store UUID
 * @returns {Promise<Array>} Products
 */
async function getAllProducts(storeId) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  const { data: products, error } = await tenantDb
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return products || [];
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts
};
