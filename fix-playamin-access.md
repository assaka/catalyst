# Fix Playamin998 Access Issue - Troubleshooting Guide

## Problem
- playamin998@gmail.com cannot access Hamid store
- Pages keep loading indefinitely
- Unable to see Hamid store in dropdown

## Likely Causes & Solutions

### 1. Authentication Issue (Most Likely)
**Problem**: playamin998@gmail.com is not properly logged in or token is expired
**Solution**: 
```javascript
// 1. Open browser console on admin panel
// 2. Clear old tokens
localStorage.removeItem('store_owner_auth_token');
localStorage.removeItem('selectedStoreId');

// 3. Log out and log back in as playamin998@gmail.com
window.location.href = '/logout';
```

### 2. Team Membership Not Set Up Properly
**Problem**: Database team membership wasn't created correctly
**Solution - Run this SQL in Supabase**:
```sql
-- Check current status
SELECT 
    u.email,
    s.name as store_name,
    st.role,
    st.status,
    st.created_at
FROM store_teams st
JOIN stores s ON s.id = st.store_id
JOIN users u ON u.id = st.user_id
WHERE u.email = 'playamin998@gmail.com';

-- If no results, add the team membership
INSERT INTO store_teams (store_id, user_id, role, status, permissions, is_active)
SELECT 
    s.id,
    u.id,
    'editor',
    'active',
    '{"canManageProducts": true, "canManageOrders": true, "canManageCategories": true, "canViewReports": true, "canManageContent": true, "canManageTeam": false}'::jsonb,
    true
FROM stores s, users u
WHERE s.name = 'Hamid' AND u.email = 'playamin998@gmail.com'
ON CONFLICT (store_id, user_id) DO UPDATE SET 
    role = 'editor',
    status = 'active',
    is_active = true;

-- Verify the setup
SELECT 
    u.email,
    s.name as accessible_store,
    st.role,
    st.status
FROM store_teams st
JOIN stores s ON s.id = st.store_id
JOIN users u ON u.id = st.user_id
WHERE u.email = 'playamin998@gmail.com';
```

### 3. User Account Issue
**Problem**: playamin998@gmail.com account doesn't exist or is inactive
**Solution - Check user account**:
```sql
-- Check if user exists and is active
SELECT id, email, is_active, created_at 
FROM users 
WHERE email = 'playamin998@gmail.com';

-- If user doesn't exist, create account first
-- User should sign up normally through the registration process
```

### 4. Frontend API Error Handling
**Problem**: Frontend not handling API errors properly, causing infinite loading
**Solution - Browser Console Diagnostic**:
```javascript
// Run this in browser console when logged in as playamin998@gmail.com
async function diagnoseAPI() {
    const token = localStorage.getItem('store_owner_auth_token');
    console.log('Token exists:', !!token);
    
    if (!token) {
        console.log('❌ Not logged in - redirecting to login');
        window.location.href = '/auth';
        return;
    }
    
    try {
        // Test stores dropdown API
        const response = await fetch('/api/stores/dropdown', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('API Response Status:', response.status);
        
        if (response.ok) {
            const stores = await response.json();
            console.log('Available stores:', stores);
        } else {
            const error = await response.text();
            console.log('API Error:', error);
        }
    } catch (err) {
        console.log('Network Error:', err);
    }
}

diagnoseAPI();
```

## Step-by-Step Resolution

### Step 1: Verify Database Setup
1. Log into Supabase
2. Run the SQL queries above to check team membership
3. Ensure playamin998@gmail.com has 'editor' role for Hamid store

### Step 2: Clear Authentication
1. As playamin998@gmail.com, open browser console
2. Run: `localStorage.clear()`
3. Log out completely
4. Clear browser cache/cookies

### Step 3: Fresh Login
1. Go to login page
2. Log in as playamin998@gmail.com
3. Check if stores dropdown shows Hamid

### Step 4: Debug API Calls
1. Open browser dev tools → Network tab
2. Look for failed API calls to `/api/stores/dropdown`
3. Check response status and errors

### Step 5: Manual Team Invitation (Alternative)
If database direct setup doesn't work, use the team invitation system:
1. Log in as info@itomoti.com (store owner)
2. Go to Settings → Team tab for Hamid store
3. Send invitation to playamin998@gmail.com as Editor
4. playamin998@gmail.com should accept the invitation

## Expected Result
After fixing, playamin998@gmail.com should:
- ✅ Log in successfully
- ✅ See only "Hamid" store in dropdown
- ✅ Have editor permissions (can edit products, orders, etc.)
- ❌ Cannot manage team or store settings

## Backup Solution
If all else fails, temporarily give playamin998@gmail.com ownership of a test store to verify the system works, then transfer it back and set up proper team membership.