# Sequelize to ConnectionManager Migration Guide

## Executive Summary

This document outlines the systematic replacement of Sequelize ORM usage with ConnectionManager across the entire codebase. This migration is part of the master-tenant architecture refactoring where:

- **Master DB** stores platform data (users, stores registry, subscriptions, credits)
- **Tenant DBs** store store-specific data (products, orders, customers, etc.)

## Architecture Overview

### Master Database Models
**Location:** `backend/src/models/master/`

These models live in the master database and should continue using master models or `ConnectionManager.getMasterConnection()`:

- `MasterUser`, `MasterStore`
- `StoreDatabase`, `StoreHostname`
- `CreditBalance`, `CreditTransaction`
- Plus: `User`, `Store` (minimal), `Subscription`, `Credit`, `CreditUsage`, `ServiceCreditCost`
- Plus: `PlatformAdmin`, `CustomDomain`, `Job`, `JobHistory`, `CronJob`, `CronJobExecution`

### Tenant Database Models
**Location:** `backend/src/models/` (all except master/)

These models live in per-store tenant databases and must use `ConnectionManager.getStoreConnection(storeId)`:

- `Product`, `ProductTranslation`, `ProductVariant`, `Category`
- `Order`, `OrderItem`, `Customer`
- `Cart`, `Wishlist`, `CmsPage`, `CmsBlock`
- `Attribute`, `AttributeValue`, `Tax`, `ShippingMethod`
- `IntegrationConfig`, `SupabaseOAuthToken`, `ShopifyOAuthToken`
- ALL other tenant-specific data

## ConnectionManager API

### Master Database Operations

```javascript
const ConnectionManager = require('../services/database/ConnectionManager');

// Get master Sequelize instance
const masterSequelize = ConnectionManager.getMasterConnection();

// Or use master models directly
const { MasterUser, MasterStore } = require('../models/master');
const user = await MasterUser.findByPk(userId);

// Or use master Supabase client (recommended for simple queries)
const { masterDbClient } = require('../database/masterConnection');
const { data: stores } = await masterDbClient
  .from('stores')
  .select('*')
  .eq('user_id', userId);
```

### Tenant Database Operations

```javascript
const ConnectionManager = require('../services/database/ConnectionManager');

// Get tenant Supabase client
const tenantDb = await ConnectionManager.getStoreConnection(storeId);

// Query using Supabase client API
const { data: products, error } = await tenantDb
  .from('products')
  .select('*')
  .eq('store_id', storeId);

if (error) throw error;
```

## Conversion Patterns

### Pattern 1: Simple FindAll

**Before:**
```javascript
const { Product } = require('../models');
const products = await Product.findAll({
  where: { store_id: storeId, status: 'active' }
});
```

**After:**
```javascript
const ConnectionManager = require('../services/database/ConnectionManager');
const tenantDb = await ConnectionManager.getStoreConnection(storeId);

const { data: products, error } = await tenantDb
  .from('products')
  .select('*')
  .eq('store_id', storeId)
  .eq('status', 'active');

if (error) throw error;
```

### Pattern 2: FindOne / FindByPk

**Before:**
```javascript
const { Product } = require('../models');
const product = await Product.findOne({
  where: { id: productId, store_id: storeId }
});
```

**After:**
```javascript
const tenantDb = await ConnectionManager.getStoreConnection(storeId);

const { data: product, error } = await tenantDb
  .from('products')
  .select('*')
  .eq('id', productId)
  .eq('store_id', storeId)
  .single();

if (error) return null; // or throw error
```

### Pattern 3: Create

**Before:**
```javascript
const { Product } = require('../models');
const product = await Product.create({
  name: 'Test Product',
  store_id: storeId
});
```

**After:**
```javascript
const tenantDb = await ConnectionManager.getStoreConnection(storeId);

const { data: product, error } = await tenantDb
  .from('products')
  .insert({
    name: 'Test Product',
    store_id: storeId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
  .select()
  .single();

if (error) throw error;
```

### Pattern 4: Update

**Before:**
```javascript
const { Product } = require('../models');
await Product.update(
  { name: 'Updated Name' },
  { where: { id: productId, store_id: storeId } }
);
```

**After:**
```javascript
const tenantDb = await ConnectionManager.getStoreConnection(storeId);

const { error } = await tenantDb
  .from('products')
  .update({
    name: 'Updated Name',
    updated_at: new Date().toISOString()
  })
  .eq('id', productId)
  .eq('store_id', storeId);

if (error) throw error;
```

### Pattern 5: Delete/Destroy

**Before:**
```javascript
const { Product } = require('../models');
await Product.destroy({
  where: { id: productId, store_id: storeId }
});
```

**After:**
```javascript
const tenantDb = await ConnectionManager.getStoreConnection(storeId);

const { error } = await tenantDb
  .from('products')
  .delete()
  .eq('id', productId)
  .eq('store_id', storeId);

if (error) throw error;
```

### Pattern 6: Count

**Before:**
```javascript
const { Product } = require('../models');
const count = await Product.count({
  where: { store_id: storeId }
});
```

**After:**
```javascript
const tenantDb = await ConnectionManager.getStoreConnection(storeId);

const { count, error } = await tenantDb
  .from('products')
  .select('*', { count: 'exact', head: true })
  .eq('store_id', storeId);

if (error) throw error;
```

### Pattern 7: Pagination

**Before:**
```javascript
const { Product } = require('../models');
const products = await Product.findAndCountAll({
  where: { store_id: storeId },
  limit: 10,
  offset: 0,
  order: [['created_at', 'DESC']]
});
```

**After:**
```javascript
const tenantDb = await ConnectionManager.getStoreConnection(storeId);

const limit = 10;
const offset = 0;

const query = tenantDb
  .from('products')
  .select('*', { count: 'exact' })
  .eq('store_id', storeId)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1);

const { data: products, error, count } = await query;

if (error) throw error;

// Return: { rows: products, count }
```

### Pattern 8: Include/Join (Now Separate Queries)

**Before:**
```javascript
const { Order, OrderItem } = require('../models');
const order = await Order.findByPk(orderId, {
  include: [{ model: OrderItem, as: 'items' }]
});
```

**After:**
```javascript
const tenantDb = await ConnectionManager.getStoreConnection(storeId);

// Query order
const { data: order, error: orderError } = await tenantDb
  .from('sales_orders')
  .select('*')
  .eq('id', orderId)
  .single();

if (orderError) throw orderError;

// Query order items separately
const { data: items, error: itemsError } = await tenantDb
  .from('sales_order_items')
  .select('*')
  .eq('order_id', orderId);

if (itemsError) throw itemsError;

// Attach manually
order.OrderItems = items || [];
```

### Pattern 9: Raw SQL Queries (Avoid if possible)

**Before:**
```javascript
const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');

const results = await sequelize.query(
  'SELECT * FROM products WHERE store_id = :storeId',
  {
    replacements: { storeId },
    type: QueryTypes.SELECT
  }
);
```

**After (for tenant data):**
```javascript
const tenantDb = await ConnectionManager.getStoreConnection(storeId);

// Prefer using Supabase client methods
const { data: results, error } = await tenantDb
  .from('products')
  .select('*')
  .eq('store_id', storeId);

if (error) throw error;

// If you MUST use raw SQL (PostgreSQL/MySQL only, NOT Supabase):
// const results = await tenantDb.raw('SELECT * FROM products WHERE store_id = ?', [storeId]);
```

**After (for master data):**
```javascript
const masterSequelize = ConnectionManager.getMasterConnection();
const { QueryTypes } = require('sequelize');

const results = await masterSequelize.query(
  'SELECT * FROM stores WHERE user_id = :userId',
  {
    replacements: { userId },
    type: QueryTypes.SELECT
  }
);
```

### Pattern 10: Transactions

**Before:**
```javascript
const { sequelize } = require('../database/connection');
const { Product } = require('../models');

const transaction = await sequelize.transaction();
try {
  const product = await Product.create({ name: 'Test' }, { transaction });
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

**After:**
```javascript
// Supabase doesn't support manual transactions the same way
// Most operations are atomic by default
// For complex multi-step operations, use RPC functions or error handling

const tenantDb = await ConnectionManager.getStoreConnection(storeId);

try {
  // Step 1
  const { data: product, error: productError } = await tenantDb
    .from('products')
    .insert({ name: 'Test', store_id: storeId })
    .select()
    .single();

  if (productError) throw productError;

  // Step 2
  const { error: variantError } = await tenantDb
    .from('product_variants')
    .insert({ product_id: product.id, sku: 'TEST-001' });

  if (variantError) {
    // Rollback manually by deleting product
    await tenantDb.from('products').delete().eq('id', product.id);
    throw variantError;
  }
} catch (error) {
  console.error('Transaction failed:', error);
  throw error;
}
```

## File-by-File Conversion Checklist

### Routes (Priority 1)
- [x] `orders.js` - CONVERTED (with diagnostic endpoint fixes)
- [ ] `payments.js`
- [ ] `cart.js`
- [ ] `configurable-products.js`
- [ ] `customer-activity.js`
- [ ] `heatmap.js`
- [ ] `users.js`
- [ ] `extensions.js`
- [ ] `storefront-bootstrap.js`
- [ ] `plugin-api.js`
- [ ] `migrations.js`
- [ ] `store-plugins.js`
- [ ] `store-provisioning.js`
- [ ] `store-publishing.js`
- [ ] `database-provisioning.js`
- [ ] `store-database.js`
- [ ] `supabase-setup.js`
- [ ] `supabase.js`
- [ ] `shopify.js`
- [ ] `integrations.js`
- [ ] `credits.js`
- [ ] `creditsMasterTenant.js`
- [ ] `job-processor.js`
- [ ] `cron-jobs.js`
- [ ] `background-jobs.js`
- [ ] Others...

### Services (Priority 2)
- [ ] `credit-service.js`
- [ ] `translation-service.js`
- [ ] `supabase-setup.js`
- [ ] `supabase-integration.js`
- [ ] `shopify-integration.js`
- [ ] `shopify-import-service.js`
- [ ] `preview-service.js`
- [ ] `github-integration.js`
- [ ] `ebay-export-service.js`
- [ ] `amazon-export-service.js`
- [ ] `akeneo-*` services
- [ ] `analytics/*` services
- [ ] `storage/StorageManager.js`
- [ ] Others...

### Middleware (Priority 3)
- [ ] `usageTracking.js`
- [ ] `subscriptionEnforcement.js`
- [ ] `tenantResolver.js`
- [ ] `domainResolver.js`
- [ ] `storeAuth.js`
- [ ] `auth.js`
- [ ] Others...

### Utilities (Priority 4)
- [ ] Various utility files

### Database/Migrations (Priority 5 - Handle Carefully)
- [ ] Migration files (most should remain as-is or be deprecated)
- [ ] Seed files

## Important Notes

1. **Always validate store_id**: Every tenant operation MUST include store_id validation
2. **Handle errors properly**: Supabase returns `{ data, error }` - always check for errors
3. **Timestamps**: Supabase doesn't auto-update timestamps - set manually
4. **Associations**: No longer automatic - query separately and attach manually
5. **Testing**: Test each converted file thoroughly
6. **Backwards compatibility**: Some legacy code may need gradual migration

## Testing Strategy

For each converted file:

1. Identify all routes/functions that were modified
2. Test with valid store_id
3. Test error cases (missing store_id, invalid data)
4. Verify data integrity
5. Check performance (ConnectionManager caches connections)

## Performance Considerations

- ConnectionManager caches connections per store_id
- Supabase client is optimized for modern PostgreSQL
- Consider batching queries where possible
- Use `select()` with specific columns instead of `select('*')` for large tables

## Common Pitfalls

1. **Forgetting to await ConnectionManager.getStoreConnection()**
2. **Not checking for errors after Supabase queries**
3. **Forgetting to set updated_at timestamps**
4. **Using master models for tenant data (or vice versa)**
5. **Not including store_id in where clauses for tenant data**

## Files Modified So Far

### Completed
1. `backend/src/routes/orders.js` - Converted diagnostic endpoints from legacy Sequelize to ConnectionManager

## Next Steps

1. Continue converting route files systematically
2. Convert service files
3. Convert middleware files
4. Handle migration files (carefully - many may be deprecated)
5. Update documentation
6. Run comprehensive tests
7. Deploy and monitor

---

**Last Updated:** 2025-11-20
**Status:** In Progress
**Files Converted:** 1 / 100+
