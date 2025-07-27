# Database Constraint Fix Guide

## Problem
The backend deployment is failing with:
```
❌ Database connection failed: there is no unique constraint matching given keys for referenced table "users"
```

## Root Cause
This error occurs when:
1. A table tries to create a foreign key constraint referencing `users(id)`
2. But the `users` table either doesn't exist, doesn't have a primary key, or has table name casing issues

## Quick Fix Commands

### Step 1: Check Database Status
```bash
cd backend
npm run db:check
```

This will show:
- ✅/❌ If users table exists
- ✅/❌ If users table has primary key
- 🔗 List of foreign key constraints
- 📊 All tables in database

### Step 2: Fix Database Constraints
```bash
cd backend
npm run db:fix
```

This will:
- ✅ Create users table if missing
- ✅ Add primary key constraint if missing  
- ✅ Fix broken foreign key constraints
- ✅ Create consent_logs table properly

### Step 3: Verify Fix
```bash
cd backend
npm run db:check
```

Should now show all ✅ green checkmarks.

## Manual Fix (Alternative)

If the automated fix doesn't work, you can run these SQL commands directly:

```sql
-- 1. Ensure users table exists
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'customer',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Drop problematic constraint if exists
ALTER TABLE consent_logs DROP CONSTRAINT IF EXISTS fk_consent_logs_user;

-- 3. Recreate constraint
ALTER TABLE consent_logs 
ADD CONSTRAINT fk_consent_logs_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
```

## Prevention

To prevent this issue in the future:
1. Always create referenced tables (like `users`) before tables that reference them
2. Ensure tables have proper primary key constraints before creating foreign keys
3. Use the database check script regularly: `npm run db:check`

## Files Created
- `check-database.js` - Diagnostic script
- `fix-database-constraints.js` - Automated fix script
- Package.json scripts: `npm run db:check` and `npm run db:fix`