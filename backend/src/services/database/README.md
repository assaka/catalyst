# Database Abstraction Layer

A complete database abstraction layer that allows the application to work seamlessly with **Supabase**, **PostgreSQL**, and **MySQL** databases.

## Architecture

```
┌─────────────────────────────────────────────┐
│              Routes / Services              │
│   (Database-agnostic - same code for all)   │
└──────────────────┬──────────────────────────┘
                   │ await db.from('table').select()
                   ▼
┌─────────────────────────────────────────────┐
│          ConnectionManager                  │
│   getStoreConnection(storeId)               │
│   - Fetches store DB config from master     │
│   - Returns appropriate adapter             │
└──────────────────┬──────────────────────────┘
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│Supabase  │ │PostgreSQL│ │  MySQL   │
│ Adapter  │ │ Adapter  │ │ Adapter  │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│Supabase  │ │PostgreSQL│ │  MySQL   │
│  Query   │ │  Query   │ │  Query   │
│ Builder  │ │ Builder  │ │ Builder  │
└──────────┘ └──────────┘ └──────────┘
```

## Usage

### In Routes

Routes use the same code regardless of the underlying database:

```javascript
const ConnectionManager = require('../services/database/ConnectionManager');

router.get('/', async (req, res) => {
  const { store_id } = req.query;

  // Get database connection (auto-detects type)
  const db = await ConnectionManager.getStoreConnection(store_id);

  // Use the same interface for all database types
  const { data, error } = await db
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ products: data });
});
```

### Supported Operations

All adapters support the same query builder interface:

#### SELECT Operations
```javascript
// Basic select
await db.from('products').select('*');
await db.from('products').select('id, name, price');

// With filters
await db.from('products').select('*').eq('id', productId);
await db.from('products').select('*').neq('status', 'deleted');
await db.from('products').select('*').gt('price', 100);
await db.from('products').select('*').gte('quantity', 10);
await db.from('products').select('*').lt('price', 500);
await db.from('products').select('*').lte('stock', 5);
await db.from('products').select('*').like('name', '%shirt%');
await db.from('products').select('*').ilike('name', '%SHIRT%'); // Case-insensitive
await db.from('products').select('*').in('category_id', [1, 2, 3]);
await db.from('products').select('*').is('deleted_at', null);

// Complex OR conditions
await db.from('products').select('*').or('status.eq.active,status.eq.pending');

// Ordering
await db.from('products').select('*').order('created_at', { ascending: false });
await db.from('products').select('*').order('price', { ascending: true });

// Pagination
await db.from('products').select('*').range(0, 9); // First 10 items
await db.from('products').select('*').limit(10).offset(20);

// Get count
await db.from('products').select('*', { count: 'exact' });
```

#### INSERT Operations
```javascript
// Insert single record
const { data, error } = await db
  .from('products')
  .insert({ name: 'New Product', price: 99.99 })
  .select()
  .single();

// Insert multiple records
const { data, error } = await db
  .from('products')
  .insert([
    { name: 'Product 1', price: 10 },
    { name: 'Product 2', price: 20 }
  ])
  .select();
```

#### UPDATE Operations
```javascript
const { data, error } = await db
  .from('products')
  .update({ price: 149.99 })
  .eq('id', productId)
  .select()
  .single();
```

#### UPSERT Operations
```javascript
// Insert or update on conflict
const { data, error } = await db
  .from('products')
  .upsert(
    { sku: 'PROD-001', name: 'Product', price: 99.99 },
    { onConflict: 'sku' }
  )
  .select()
  .single();
```

#### DELETE Operations
```javascript
const { data, error } = await db
  .from('products')
  .delete()
  .eq('id', productId)
  .select()
  .single();
```

#### Raw SQL (Advanced)
```javascript
const { data, error } = await db.raw(
  'SELECT * FROM products WHERE price > ? AND category_id = ?',
  [100, categoryId]
);
```

## Database Support

### Supabase
- Uses `@supabase/supabase-js` client
- Native real-time subscriptions
- Row-level security (RLS)
- Built-in authentication integration

### PostgreSQL
- Uses `pg` (node-postgres)
- Connection pooling
- Direct PostgreSQL access
- All standard PostgreSQL features

### MySQL
- Uses `mysql2/promise`
- Connection pooling
- Direct MySQL access
- All standard MySQL features

## Configuration

Store database settings are stored in the master database (`store_databases` table):

```javascript
{
  store_id: 'uuid',
  database_type: 'supabase' | 'postgresql' | 'mysql',
  connection_string_encrypted: 'encrypted credentials',
  is_active: true
}
```

### Credentials Format

#### Supabase
```javascript
{
  projectUrl: 'https://xxx.supabase.co',
  serviceRoleKey: 'service_role_key',
  schema: 'public' // optional
}
```

#### PostgreSQL
```javascript
{
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  username: 'user',
  password: 'pass',
  ssl: true, // optional
  maxConnections: 10 // optional
}
```

#### MySQL
```javascript
{
  host: 'localhost',
  port: 3306,
  database: 'mydb',
  username: 'user',
  password: 'pass',
  ssl: true, // optional
  maxConnections: 10 // optional
}
```

## File Structure

```
backend/src/services/database/
├── DatabaseAdapter.js              # Base adapter class (interface)
├── ConnectionManager.js            # Main connection manager
├── adapters/
│   ├── SupabaseAdapter.js         # Supabase implementation
│   ├── SupabaseQueryBuilder.js    # Supabase query builder
│   ├── PostgreSQLAdapter.js       # PostgreSQL implementation
│   ├── PostgreSQLQueryBuilder.js  # PostgreSQL query builder
│   ├── MySQLAdapter.js            # MySQL implementation
│   └── MySQLQueryBuilder.js       # MySQL query builder
└── README.md                       # This file
```

## Response Format

All operations return a consistent response format:

```javascript
{
  data: Array | Object | null,  // Query results
  error: {                       // Error object (null if no error)
    message: string,
    code: string
  } | null,
  count: number                  // Row count (for SELECT with count: 'exact')
}
```

## Error Handling

```javascript
const { data, error } = await db.from('products').select('*');

if (error) {
  console.error('Database error:', error.message);
  return res.status(500).json({ error: error.message });
}

res.json({ products: data });
```

## Testing Connection

```javascript
const connection = await ConnectionManager.getStoreConnection(storeId);
const isConnected = await connection.testConnection();

if (!isConnected) {
  console.error('Failed to connect to database');
}
```

## Closing Connections

```javascript
// Close specific store connection
await ConnectionManager.clearCache(storeId);

// Close all connections (on shutdown)
await ConnectionManager.closeAll();
```

## Best Practices

### 1. Always Use Parameterized Queries
```javascript
// ✅ GOOD - Uses query builder (parameterized)
await db.from('products').eq('id', productId);

// ❌ BAD - String concatenation (SQL injection risk)
await db.raw(`SELECT * FROM products WHERE id = '${productId}'`);
```

### 2. Handle Errors Properly
```javascript
// ✅ GOOD
const { data, error } = await db.from('products').select('*');
if (error) {
  console.error('Error:', error);
  return res.status(500).json({ error: error.message });
}

// ❌ BAD - No error handling
const { data } = await db.from('products').select('*');
```

### 3. Use Appropriate Filters
```javascript
// ✅ GOOD - Specific filters
await db.from('products').eq('store_id', storeId).eq('is_active', true);

// ❌ BAD - Fetching everything then filtering in JavaScript
const all = await db.from('products').select('*');
const filtered = all.filter(p => p.store_id === storeId);
```

### 4. Limit Results
```javascript
// ✅ GOOD - Limit at database level
await db.from('products').select('*').limit(100);

// ❌ BAD - Fetch all then slice
const all = await db.from('products').select('*');
const limited = all.slice(0, 100);
```

## Migration Guide

### Before (Sequelize)
```javascript
const Product = require('../models/Product');

const products = await Product.findAll({
  where: {
    store_id: storeId,
    is_active: true
  },
  order: [['created_at', 'DESC']],
  limit: 10
});
```

### After (Database Abstraction)
```javascript
const db = await ConnectionManager.getStoreConnection(storeId);

const { data: products } = await db
  .from('products')
  .select('*')
  .eq('store_id', storeId)
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(10);
```

## Troubleshooting

### Connection Issues

**Problem:** "Failed to connect to database"
```javascript
// Check store database configuration
const { data: storeDb } = await masterDbClient
  .from('store_databases')
  .select('*')
  .eq('store_id', storeId)
  .single();

console.log('Database type:', storeDb.database_type);
console.log('Is active:', storeDb.is_active);

// Test connection
const connection = await ConnectionManager.getStoreConnection(storeId, false);
const isConnected = await connection.testConnection();
console.log('Connection test:', isConnected);
```

### Query Builder Issues

**Problem:** "Method not found"
- Ensure you're using the correct query builder methods
- Check if the method is supported by all database types
- See the supported operations section above

**Problem:** "Data format mismatch"
- All adapters return `{ data, error, count }` format
- Always destructure the response properly

## Contributing

When adding new database types:

1. Create new adapter in `adapters/YourDatabaseAdapter.js`
2. Extend `DatabaseAdapter` base class
3. Implement required methods: `from()`, `raw()`, `testConnection()`, `close()`
4. Create query builder in `adapters/YourDatabaseQueryBuilder.js`
5. Update `ConnectionManager._createConnection()` switch statement
6. Add configuration documentation here
7. Test all CRUD operations

## Performance Tips

1. **Use connection pooling** - Already configured in ConnectionManager
2. **Cache connections** - ConnectionManager caches by default
3. **Use indexes** - Ensure database tables have proper indexes
4. **Limit data** - Always use `.limit()` and pagination
5. **Select specific columns** - Use `.select('id, name')` instead of `.select('*')`

---

**Version:** 1.0.0
**Last Updated:** 2025-01-20
**Maintained By:** Development Team
