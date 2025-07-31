# Store Ownership Migration Guide

## Overview
This migration updates the store ownership model from email-based to user_id-based foreign key relationships. This enables proper workspace/team functionality where multiple users can access the same store.

## Changes Made

### 1. Database Schema
- Added `user_id` column to `stores` table with foreign key to `users.id`
- Maintained `owner_email` for backward compatibility
- Added index on `user_id` for performance

### 2. Model Updates
- **Store Model**: Added `user_id` field with UUID type
- **Model Associations**: 
  - Added `User.hasMany(Store, { foreignKey: 'user_id', as: 'ownedStores' })`
  - Added `Store.belongsTo(User, { foreignKey: 'user_id', as: 'owner' })`
  - Kept email-based associations for backward compatibility

### 3. Authorization Middleware
Created new `middleware/storeAuth.js` with:
- `checkStoreOwnership`: Verifies user owns or has access to a store
- `checkResourceOwnership`: Verifies user owns the store that owns a resource (product, category, etc.)

### 4. Route Updates
- **Products Routes**: Updated POST/PUT to use new ownership middleware
- **Store Routes**: Updated to set `user_id` when creating stores
- Other routes (categories, delivery, etc.) need similar updates

## Running the Migration

### Step 1: Run Database Migration
```bash
cd backend
node scripts/migrate-store-ownership.js
```

This will:
1. Add the `user_id` column if it doesn't exist
2. Migrate existing stores by matching `owner_email` to user emails
3. Show statistics of migrated stores

### Step 2: Deploy Backend Changes
Deploy the updated backend code with the new models and middleware.

### Step 3: Update Frontend (Optional)
The frontend will automatically use the new user_id relationships once the backend is updated.

## API Changes

### Store Creation
Stores created via API will now have both:
```json
{
  "user_id": "uuid-of-creator",
  "owner_email": "creator@email.com"
}
```

### Authorization
The backend now checks ownership using:
1. `user_id` match (preferred)
2. `owner_email` match (fallback)
3. Future: Team/workspace membership

## Future Enhancements

### Workspace/Team Support
The middleware is designed to easily add team support:
```javascript
// In checkStoreOwnership middleware
const isTeamMember = await checkTeamMembership(req.user.id, storeId);
const hasAccess = isOwnerByUserId || isOwnerByEmail || isTeamMember;
```

### Permissions System
Can add granular permissions:
- `store:read` - View store data
- `store:write` - Modify store settings
- `store:delete` - Delete store
- `store:manage_team` - Add/remove team members

## Rollback Plan
If issues occur:
1. The email-based auth still works as fallback
2. To fully rollback: Remove `user_id` column and revert code changes
3. No data loss as `owner_email` is maintained

## Testing
After migration:
1. Create new stores - should have `user_id` set
2. Update existing stores - should work with both email and user_id auth
3. Access store resources (products, etc.) - should check ownership properly