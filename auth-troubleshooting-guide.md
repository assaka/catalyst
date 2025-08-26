# Authentication Troubleshooting Guide for FileTreeNavigator

## Issue Summary
The FileTreeNavigator is not showing root src files because it's failing to authenticate with the backend API due to path detection issues and possible token storage problems.

## Fix Applied
✅ **Updated API client path detection** (line 81 in `src/api/client.js`):
```javascript
currentPath.startsWith('/editor/') ||
```
This ensures `/editor/ai-context` is recognized as an admin context and uses the store owner token.

## Token Storage Keys Used
The authentication system uses these localStorage keys:

| Role | Token Key | User Data Key |
|------|-----------|---------------|
| Store Owner/Admin | `store_owner_auth_token` | `store_owner_user_data` |
| Customer | `customer_auth_token` | `customer_user_data` |

## How to Verify the Fix

### Step 1: Check Authentication State
Open `/editor/ai-context` in your browser and run in console:

```javascript
// Quick token check
const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
const logoutFlag = localStorage.getItem('user_logged_out');
console.log('Store Owner Token:', storeOwnerToken ? 'Present' : 'Missing');
console.log('Logged Out Flag:', logoutFlag);
```

### Step 2: Test Path Detection
```javascript
// Test the fixed path detection
const currentPath = window.location.pathname.toLowerCase();
const isAdminContext = currentPath.startsWith('/editor/');
console.log('Current Path:', currentPath);
console.log('Admin Context Detected:', isAdminContext); // Should be TRUE
```

### Step 3: Test API Call
```javascript
// Test the actual FileTreeNavigator API call
fetch('/api/proxy-source-files/list?path=src', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('store_owner_auth_token')}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('API Success:', data.success);
  console.log('Files Found:', data.files?.length || 0);
  console.log('Root src files:', data.files?.filter(f => f.path.startsWith('src/') && !f.path.startsWith('backend/')).length || 0);
});
```

### Step 4: Full Comprehensive Check
Copy and paste the entire contents of `debug-comprehensive-auth.js` into the browser console for complete analysis.

## Common Issues & Fixes

### Issue: No Store Owner Token
**Problem**: `store_owner_auth_token` is missing from localStorage
**Fix**: Log in as a store owner user

### Issue: Logout Flag Set
**Problem**: `user_logged_out` is set to 'true' 
**Fix**: `localStorage.removeItem('user_logged_out')`

### Issue: Expired Token
**Problem**: JWT token is expired
**Fix**: Log in again to get fresh token

### Issue: Token-User Data Mismatch
**Problem**: Token contains different user ID than stored user data
**Fix**: Clear auth data and log in again:
```javascript
localStorage.removeItem('store_owner_auth_token');
localStorage.removeItem('store_owner_user_data');
// Then log in again
```

## Expected Behavior After Fix
1. ✅ `/editor/ai-context` path is detected as admin context
2. ✅ API client uses `store_owner_auth_token` for authentication
3. ✅ FileTreeNavigator API call succeeds (200 status)
4. ✅ API returns root src files instead of backend/src files
5. ✅ File tree displays frontend components (App.jsx, components/, pages/)

## Verification Commands
Run these in browser console on `/editor/ai-context`:

```javascript
// 1. Check if path detection works
console.log('Path detection works:', window.location.pathname.startsWith('/editor/'));

// 2. Check if API client returns token
console.log('API client token:', window.apiClient?.getToken() ? 'Available' : 'Missing');

// 3. Test manual API call
fetch('/api/proxy-source-files/list?path=src', {
  headers: { 'Authorization': `Bearer ${window.apiClient.getToken()}` }
}).then(r => console.log('API status:', r.status));
```

If all these return positive results, the FileTreeNavigator should now display root src files correctly.