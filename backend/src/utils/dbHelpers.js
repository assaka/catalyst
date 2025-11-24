/**
 * Database Helper Functions for Master-Tenant Architecture
 *
 * These helpers provide convenient access to master and tenant databases
 * following the ConnectionManager pattern.
 */

const ConnectionManager = require('../services/database/ConnectionManager');
const { masterDbClient } = require('../database/masterConnection');

/**
 * Get store from master DB
 *
 * @param {string} storeId - Store UUID
 * @returns {Promise<Object>} Store object
 * @throws {Error} If store not found
 */
async function getMasterStore(storeId) {
  const { data: store, error } = await masterDbClient
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();

  if (error || !store) {
    throw new Error(`Store not found: ${storeId}`);
  }

  return store;
}

/**
 * Get store from master DB (returns null if not found)
 *
 * @param {string} storeId - Store UUID
 * @returns {Promise<Object|null>} Store object or null
 */
async function getMasterStoreSafe(storeId) {
  const { data: store, error } = await masterDbClient
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching store:', error);
    return null;
  }

  return store;
}

/**
 * Update store in master DB
 *
 * @param {string} storeId - Store UUID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated store object
 */
async function updateMasterStore(storeId, updateData) {
  const { data: store, error } = await masterDbClient
    .from('stores')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', storeId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update store: ${error.message}`);
  }

  return store;
}

/**
 * Get user from master DB
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} User object
 * @throws {Error} If user not found
 */
async function getMasterUser(userId) {
  const { data: user, error } = await masterDbClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error(`User not found: ${userId}`);
  }

  return user;
}

/**
 * Get user from master DB (returns null if not found)
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Object|null>} User object or null
 */
async function getMasterUserSafe(userId) {
  const { data: user, error } = await masterDbClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return user;
}

/**
 * Get products from tenant DB
 *
 * @param {string} storeId - Store UUID
 * @param {Object} filters - Filter options {status, category_id, search, limit, offset}
 * @returns {Promise<Array>} Products array
 */
async function getTenantProducts(storeId, filters = {}) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  let query = tenantDb
    .from('products')
    .select('*')
    .eq('store_id', storeId);

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.category_id) {
    query = query.contains('category_ids', [filters.category_id]);
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
  }

  // Pagination
  if (filters.limit) {
    const offset = filters.offset || 0;
    query = query.range(offset, offset + filters.limit - 1);
  }

  // Sorting
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  return data || [];
}

/**
 * Get single product from tenant DB
 *
 * @param {string} storeId - Store UUID
 * @param {string} productId - Product UUID
 * @returns {Promise<Object|null>} Product object or null
 */
async function getTenantProduct(storeId, productId) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  const { data: product, error } = await tenantDb
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return product;
}

/**
 * Get orders from tenant DB
 *
 * @param {string} storeId - Store UUID
 * @param {Object} filters - Filter options {status, customer_id, limit, offset}
 * @returns {Promise<Array>} Orders array
 */
async function getTenantOrders(storeId, filters = {}) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  let query = tenantDb
    .from('sales_orders')
    .select('*')
    .eq('store_id', storeId);

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }

  // Pagination
  if (filters.limit) {
    const offset = filters.offset || 0;
    query = query.range(offset, offset + filters.limit - 1);
  }

  // Sorting
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return data || [];
}

/**
 * Get single order from tenant DB
 *
 * @param {string} storeId - Store UUID
 * @param {string} orderId - Order UUID
 * @returns {Promise<Object|null>} Order object or null
 */
async function getTenantOrder(storeId, orderId) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  const { data: order, error } = await tenantDb
    .from('sales_orders')
    .select('*')
    .eq('id', orderId)
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return order;
}

/**
 * Get customers from tenant DB
 *
 * @param {string} storeId - Store UUID
 * @param {Object} filters - Filter options {email, limit, offset}
 * @returns {Promise<Array>} Customers array
 */
async function getTenantCustomers(storeId, filters = {}) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  let query = tenantDb
    .from('customers')
    .select('*')
    .eq('store_id', storeId);

  // Apply filters
  if (filters.email) {
    query = query.ilike('email', `%${filters.email}%`);
  }

  // Pagination
  if (filters.limit) {
    const offset = filters.offset || 0;
    query = query.range(offset, offset + filters.limit - 1);
  }

  // Sorting
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch customers: ${error.message}`);
  }

  return data || [];
}

/**
 * Get single customer from tenant DB
 *
 * @param {string} storeId - Store UUID
 * @param {string} customerId - Customer UUID
 * @returns {Promise<Object|null>} Customer object or null
 */
async function getTenantCustomer(storeId, customerId) {
  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  const { data: customer, error } = await tenantDb
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching customer:', error);
    return null;
  }

  return customer;
}

/**
 * Get subscription from master DB
 *
 * @param {string} storeId - Store UUID
 * @returns {Promise<Object|null>} Subscription object or null
 */
async function getMasterSubscription(storeId) {
  const { data: subscription, error } = await masterDbClient
    .from('subscriptions')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return subscription;
}

/**
 * Get credit balance from master DB (users.credits is single source of truth)
 *
 * @param {string} storeId - Store UUID
 * @returns {Promise<number>} Credit balance
 */
async function getMasterCreditBalance(storeId) {
  // Get store to find user_id
  const { data: store, error: storeError } = await masterDbClient
    .from('stores')
    .select('user_id')
    .eq('id', storeId)
    .maybeSingle();

  if (storeError || !store) {
    console.error('Error fetching store:', storeError);
    return 0;
  }

  // Get user credits (single source of truth)
  const { data: user, error: userError } = await masterDbClient
    .from('users')
    .select('credits')
    .eq('id', store.user_id)
    .maybeSingle();

  if (userError) {
    console.error('Error fetching user credits:', userError);
    return 0;
  }

  return parseFloat(user?.credits || 0);
}

/**
 * Check if user has access to store (master DB)
 *
 * @param {string} userId - User UUID
 * @param {string} storeId - Store UUID
 * @returns {Promise<boolean>} True if user has access
 */
async function checkUserStoreAccess(userId, storeId) {
  const { data: store, error } = await masterDbClient
    .from('stores')
    .select('user_id')
    .eq('id', storeId)
    .single();

  if (error || !store) {
    return false;
  }

  // Check if user owns the store
  if (store.user_id === userId) {
    return true;
  }

  // Check if user is a team member
  const { data: teamMember } = await masterDbClient
    .from('store_teams')
    .select('id')
    .eq('store_id', storeId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  return !!teamMember;
}

module.exports = {
  // Master DB functions
  getMasterStore,
  getMasterStoreSafe,
  updateMasterStore,
  getMasterUser,
  getMasterUserSafe,
  getMasterSubscription,
  getMasterCreditBalance,
  checkUserStoreAccess,

  // Tenant DB functions
  getTenantProducts,
  getTenantProduct,
  getTenantOrders,
  getTenantOrder,
  getTenantCustomers,
  getTenantCustomer
};
