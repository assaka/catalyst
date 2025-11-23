# Tenant Database Tables Reference

## Overview
Each store has its own separate tenant database containing all store-specific operational data. The tenant database has NO knowledge of the master database or other tenants.

---

## Table Distribution

### ✅ Tenant DB Tables (Store-Specific Data)

#### **Core Store Tables**
- `stores` - **FULL store data** (name, slug, description, logo, theme_settings, contact info, address, currency, timezone, settings, etc.)
- `users` - **ALL users** (agency admins, store staff, customers) with all user types

#### **E-commerce Tables** (70+ tables)
- `products`, `product_variants`, `product_images`
- `categories`, `category_products`
- `customers`, `customer_addresses`
- `orders`, `order_items`, `order_history`
- `carts`, `cart_items`
- `inventory`, `inventory_locations`
- `prices`, `price_rules`
- `discounts`, `discount_codes`
- `taxes`, `tax_rules`
- `shipping_methods`, `shipping_zones`, `shipping_rates`
- `payment_methods`, `payment_transactions`
- ...and 50+ more e-commerce tables

#### **CMS Tables**
- `cms_pages`
- `cms_blocks`
- `cms_templates`
- `navigation_menus`
- `media_library`
- `seo_settings`

#### **Plugin Tables** (ALL stay in tenant for Phase 1)
- `plugins`
- `plugin_configurations`
- `plugin_data`
- `plugin_hooks`
- `plugin_events`
- `plugin_widgets`
- `plugin_scripts`
- `plugin_admin_pages`
- `plugin_admin_script`
- `plugin_controllers`
- `plugin_dependencies`
- `plugin_docs`
- `plugin_entities`
- `plugin_registry`
- `plugin_marketplace`
- `plugin_latest_versions`

#### **Cron & Jobs**
- `cron_jobs` - Tenant-managed cron jobs
- `cron_job_executions` - Execution history
- `cron_job_types` - Job type definitions

#### **Credits (Tenant-Level)**
- `credit_balance_cache` - Cached credit balance from master (read-only, auto-synced)
- `credit_spending_log` - Credit usage records (spending history)

#### **Translations & Localization**
- `languages`
- `translations`
- `ui_translations`
- `currency_settings`

#### **Integrations**
- `integration_configs`
- `integration_logs`
- `akeneo_schedules`
- `akeneo_import_statistics` (legacy - Akeneo-specific)
- `import_statistics` (general - for all import sources: Shopify, Akeneo, etc.)
- `marketplace_credentials` (Amazon, eBay, etc.)

#### **Email & Notifications**
- `email_templates`
- `email_logs`
- `notification_settings`

#### **Analytics & Reporting**
- `analytics_events`
- `analytics_sessions`
- `report_configurations`

---

## Important Notes

### 1. **Stores Table in Tenant DB**
The `stores` table in tenant DB contains **FULL store data**, including:
- `id` (same UUID as master DB stores.id)
- `user_id` (owner reference)
- `name`, `slug`, `description`
- `logo_url`, `banner_url`, `theme_color`
- `currency`, `timezone`
- `settings` (JSONB - all store settings)
- `contact_email`, `contact_phone`
- `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`
- `website_url`
- `stripe_account_id`
- `deployment_status`, `published`, `published_at`
- etc.

**This is the complete Store model - unchanged from current structure.**

### 2. **Users Table in Tenant DB**
Contains ALL user types:
- `account_type = 'agency'` - Store owners (synced from master)
- `role = 'admin'` - Store administrators
- `role = 'staff'` - Store staff
- Customer users (for customer accounts)

Full structure includes:
- `id`, `email`, `password`, `first_name`, `last_name`
- `phone`, `avatar_url`
- `is_active`, `email_verified`
- `email_verification_token`, `password_reset_token`, `password_reset_expires`
- `last_login`
- `role`, `account_type`, `credits`
- `created_at`, `updated_at`

**This is the complete User model - unchanged from current structure.**

### 3. **Plugin Tables**
All plugin tables remain in tenant DB for Phase 1. This includes:
- Plugin registry and marketplace (tenant-level)
- Plugin configurations
- Plugin data and execution state
- Plugin hooks, events, widgets, scripts
- All plugin-related tables

**Phase 2 will move plugin marketplace/code to master DB for code protection.**

### 4. **Cron Jobs**
Cron jobs are managed per-tenant:
- Each tenant DB has its own `cron_jobs` table
- Platform cron processor connects to each tenant DB
- Executes jobs in tenant context
- No centralized cron table in tenant DB

### 5. **Credits**
Two-tier system:
- **Master DB**: `credit_balances` (source of truth)
- **Tenant DB**: `credit_balance_cache` (cached for fast reads)
- **Tenant DB**: `credit_spending_log` (spending history)

Credit balance is synced from master to tenant cache periodically.

---

## Tenant DB Isolation Principles

### ✅ What Tenant DB Has Access To:
- **Own store data only** (single store record)
- **Own users** (agency owner + staff + customers)
- **Own products, orders, customers**
- **Own plugin configurations and data**
- **Own cron jobs**
- **Cached credit balance** (read-only from master)

### ❌ What Tenant DB Does NOT Have Access To:
- **Master database** (no connection info)
- **Other tenant databases**
- **Platform infrastructure details**
- **Encrypted tenant DB credentials**
- **Centralized job queue**
- **Platform-level metrics**

### 🔐 Security:
- Tenant DB has ZERO knowledge of master DB existence
- All master ↔ tenant communication happens via backend API
- Backend acts as secure bridge with access to both databases

---

## Query Patterns

### Storefront Queries (Tenant DB Only)
```sql
-- Customer views products
SELECT * FROM products WHERE is_active = true;

-- Customer views store info
SELECT * FROM stores LIMIT 1;

-- Customer places order
INSERT INTO orders (customer_id, total, ...) VALUES (...);
```

### Store Admin Queries (Dual DB via API)
```javascript
// Product management → Tenant DB
const products = await tenantDb.query('SELECT * FROM products');

// Credit balance → Master DB via API
const balance = await fetch('/api/credits/balance');

// Subscription → Master DB via API
const subscription = await fetch('/api/subscriptions/current');
```

---

## Migration Notes

### Current State:
- Single database contains all tables

### Target State (Phase 1):
- **Master DB**: users (agencies only), stores (minimal), subscriptions, credits, monitoring
- **Tenant DB**: ALL operational data (stores full, users all, products, orders, plugins, crons, etc.)

### Migration Path:
1. Create master DB and run migrations
2. Extract agency users → copy to master DB
3. Create minimal store records in master DB
4. Keep ALL existing data in tenant DB (no changes)
5. Set up connection mapping (store_databases table)
6. Update backend to route queries appropriately

---

## References

See existing model files in `backend/src/models/` for complete table structures:
- `Store.js` - Full store model (stays in tenant)
- `User.js` - Full user model (all types in tenant, agencies also in master)
- `Product.js`, `Order.js`, `Customer.js`, etc. - All e-commerce models (stay in tenant)
- `Plugin.js`, `PluginConfiguration.js`, etc. - All plugin models (stay in tenant for now)
- `CronJob.js`, `CronJobExecution.js` - Cron models (stay in tenant)
