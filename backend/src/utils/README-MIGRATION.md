# Helper Files Migration Status

## ✅ Completed (4 files)
All critical helper files causing 500 errors have been converted from Sequelize to Supabase:

1. **cmsHelpers.js** - CMS pages and blocks with translations
2. **cookieConsentHelpers.js** - Cookie consent settings
3. **translationHelpers.js** - Generic translation helpers for all entities
4. **productHelpers.js** - Product translations and queries

## ⚠️ Remaining (2 files - Not Critical)
These files still use Sequelize but are NOT causing the current 500 errors:

- **categoryHelpers.js** - Complex SQL with joins for category translations
- **shippingMethodHelpers.js** - Complex SQL for shipping method translations

### Why they're not critical:
1. Not imported/used by any routes causing the 500 errors
2. Contain complex raw SQL that requires extensive rewriting
3. Can be migrated later when needed

### To migrate these files:
1. Replace `connection.sequelize` with Supabase client
2. Convert raw SQL queries to Supabase query builder or multiple queries + JS mapping
3. Replace Sequelize transactions with Supabase upsert operations
4. Test thoroughly as they contain complex JOIN logic

## Migration Pattern Used:
```javascript
// OLD (Sequelize)
const connection = await ConnectionManager.getConnection(storeId);
const sequelize = connection.sequelize;
const results = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });

// NEW (Supabase)
const tenantDb = await ConnectionManager.getStoreConnection(storeId);
const { data, error } = await tenantDb.from('table').select('*').eq('id', id);
```

