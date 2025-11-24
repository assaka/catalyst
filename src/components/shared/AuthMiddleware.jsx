import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl, createStoreUrl, getStoreSlugFromUrl } from "@/utils";
import { createAdminUrl, createPublicUrl, getStoreSlugFromPublicUrl } from "@/utils/urlUtils";
import { setRoleBasedAuthData } from "@/utils/auth";
import { Auth as AuthService, User } from "@/api/entities";
import apiClient from "@/api/client";
import StoreOwnerAuthLayout from "@/components/admin/StoreOwnerAuthLayout";
import CustomerAuthLayout from "@/components/storefront/CustomerAuthLayout";
import { useTranslation } from "@/contexts/TranslationContext";

// Helper function for debugging authentication status
window.debugAuth = () => {
  console.log('=== AUTH DEBUG INFO ===');
  console.log('API Client isLoggedOut:', apiClient.isLoggedOut);
  console.log('API Client token:', apiClient.getToken() ? 'Token exists' : 'No token');
  console.log('Stored tokens:', {
    storeOwner: localStorage.getItem('store_owner_auth_token') ? 'Exists' : 'Missing',
    customer: localStorage.getItem('customer_auth_token') ? 'Exists' : 'Missing'
  });
  console.log('User data:', {
    storeOwner: localStorage.getItem('store_owner_user_data') ? JSON.parse(localStorage.getItem('store_owner_user_data')) : null,
    customer: localStorage.getItem('customer_user_data') ? JSON.parse(localStorage.getItem('customer_user_data')) : null
  });
  console.log('Logout flag:', localStorage.getItem('user_logged_out'));
  console.log('Current URL:', window.location.href);
  console.log('All localStorage keys:', Object.keys(localStorage));
};

// Helper function to clear logout state and retry authentication
window.clearLogoutState = () => {
  console.log('🔧 Clearing logout state...');
  console.log('Before:', {
    isLoggedOut: apiClient.isLoggedOut,
    logoutFlag: localStorage.getItem('user_logged_out')
  });
  
  localStorage.removeItem('user_logged_out');
  apiClient.isLoggedOut = false;
  
  console.log('After:', {
    isLoggedOut: apiClient.isLoggedOut,
    logoutFlag: localStorage.getItem('user_logged_out')
  });
  
  console.log('✅ Logout state cleared. Reload the page to retry authentication.');
  window.location.reload();
};

// Helper function to simulate a login (for testing)
window.simulateStoreOwnerLogin = (email = 'test@example.com') => {
  console.log('🔧 Simulating store owner login...');
  const mockToken = 'mock_store_owner_token_' + Date.now();
  const mockUser = {
    id: 1,
    email: email,
    role: 'store_owner',
    first_name: 'Test',
    last_name: 'Owner'
  };
  
  localStorage.setItem('store_owner_auth_token', mockToken);
  localStorage.setItem('store_owner_user_data', JSON.stringify(mockUser));
  localStorage.removeItem('user_logged_out');
  
  console.log('✅ Mock store owner login created. Reload the page.');
  window.location.reload();
};

// Helper function to check localStorage user data
window.checkUserData = () => {
  console.log('=== USER DATA CHECK ===');
  const storeOwnerUserData = localStorage.getItem('store_owner_user_data');
  const customerUserData = localStorage.getItem('customer_user_data'); 
  
  console.log('Raw store owner data:', storeOwnerUserData);
  console.log('Raw customer data:', customerUserData);
  
  if (storeOwnerUserData) {
    try {
      const parsed = JSON.parse(storeOwnerUserData);
      console.log('Parsed store owner data:', parsed);
    } catch (e) {
      console.error('Error parsing store owner data:', e);
    }
  }
  
  if (customerUserData) {
    try {
      const parsed = JSON.parse(customerUserData);
      console.log('Parsed customer data:', parsed);
    } catch (e) {
      console.error('Error parsing customer data:', e);
    }
  }
};

// Helper function to decode JWT token and compare with localStorage data
window.checkTokenData = () => {
  console.log('=== TOKEN DATA CHECK ===');
  const token = localStorage.getItem('store_owner_auth_token');
  const userData = localStorage.getItem('store_owner_user_data');
  
  if (token) {
    try {
      // Decode JWT payload (basic decode, not verification)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const tokenData = JSON.parse(jsonPayload);
      console.log('Token payload:', tokenData);
      
      if (userData) {
        const userDataParsed = JSON.parse(userData);
        console.log('localStorage userData:', userDataParsed);
        
        console.log('Data comparison:', {
          tokenId: tokenData.id,
          userDataId: userDataParsed.id,
          tokenRole: tokenData.role,
          userDataRole: userDataParsed.role,
          tokenAccountType: tokenData.account_type,
          userDataAccountType: userDataParsed.account_type,
          idsMatch: tokenData.id === userDataParsed.id,
          rolesMatch: tokenData.role === userDataParsed.role,
          accountTypesMatch: tokenData.account_type === userDataParsed.account_type
        });
      }
    } catch (e) {
      console.error('Error decoding token:', e);
    }
  } else {
    console.log('No token found');
  }
};

// Helper function to check store ownership and permissions
window.checkStoreOwnership = async () => {
  console.log('=== STORE OWNERSHIP CHECK ===');
  const { Store, User } = await import('@/api/entities');
  
  try {
    // Get current user
    const user = await User.me();
    console.log('\n👤 Current User:', {
      id: user.id,
      email: user.email,
      role: user.role,
      account_type: user.account_type
    });
    
    // Get user's stores
    const stores = await Store.getUserStores();
    console.log('\n🏪 Your Stores:', stores.length);
    
    if (stores.length > 0) {
      stores.forEach(store => {
        console.log(`\nStore: ${store.name}`);
        console.log(`  ID: ${store.id}`);
        console.log(`  Owner ID: ${store.user_id || 'Not specified'}`);
        console.log(`  Created At: ${store.createdAt}`);

        // Check all possible owner fields
        const ownerFields = {
          user_id: store.user_id,
          created_by: store.created_by,
          userId: store.userId
        };

        console.log('  Owner Fields:', ownerFields);
        console.log(`  Is Owner Match: ${store.user_id === user.id ? '✅ YES' : '❌ NO'}`);

        // Check all store properties
        console.log('  All Store Properties:', Object.keys(store));
      });
      
      // Check localStorage selected store
      const selectedStoreId = localStorage.getItem('selectedStoreId');
      console.log('\n📍 Selected Store ID:', selectedStoreId);
      
      if (selectedStoreId) {
        const selectedStore = stores.find(s => s.id === selectedStoreId);
        if (selectedStore) {
          console.log('✅ Selected store found in your stores');
        } else {
          console.log('❌ Selected store NOT in your stores list!');
        }
      }
    } else {
      console.log('❌ No stores found for your user');
    }
    
    // Test store creation
    console.log('\n🧪 Testing Store Creation...');
    try {
      const testStore = {
        name: 'Test Store ' + Date.now(),
        description: 'Test store for permission check',
        code: 'TEST' + Date.now()
      };
      
      const newStore = await Store.create(testStore);
      console.log('✅ Store creation successful:', newStore.id);
      
      // Clean up
      if (newStore && newStore.id) {
        await Store.delete(newStore.id);
        console.log('✅ Test store deleted');
      }
    } catch (error) {
      console.log('❌ Store creation failed:', error.message, error.status);
    }
    
  } catch (error) {
    console.error('Error in ownership check:', error);
  }
};

// Helper function to switch to a store you actually own
window.switchToOwnedStore = async () => {
  console.log('=== SWITCHING TO OWNED STORE ===');
  const { Store, User } = await import('@/api/entities');
  
  try {
    const user = await User.me();
    const stores = await Store.getUserStores();

    // Find stores where user_id matches
    const ownedStores = stores.filter(s => s.user_id === user.id);

    console.log(`Found ${ownedStores.length} stores you own:`);
    ownedStores.forEach(s => {
      console.log(`- ${s.name} (${s.id})`);
    });
    
    if (ownedStores.length > 0) {
      const firstOwned = ownedStores[0];
      console.log(`\nSwitching to: ${firstOwned.name}`);
      
      // Update localStorage
      localStorage.setItem('selectedStoreId', firstOwned.id);
      console.log('✅ Store switched successfully!');
      console.log('🔄 Please reload the page to apply changes');
      
      return firstOwned;
    } else {
      console.log('❌ No stores found where you are the owner');
    }
  } catch (error) {
    console.error('Error switching store:', error);
  }
};

// Helper function to fix store ownership
window.fixStoreOwnership = async () => {
  console.log('=== FIXING STORE OWNERSHIP ===');
  const { Store, User } = await import('@/api/entities');
  
  try {
    const user = await User.me();
    const stores = await Store.getUserStores();
    
    if (stores.length === 0) {
      console.log('❌ No stores found');
      return;
    }
    
    const store = stores[0];
    console.log(`\n🏪 Attempting to fix ownership for store: ${store.name}`);
    console.log(`Store ID: ${store.id}`);
    console.log(`Your User ID: ${user.id}`);

    // Try to update the store's user_id
    try {
      console.log(`Current user_id: ${store.user_id}`);
      console.log(`Your user ID: ${user.id}`);

      if (store.user_id === user.id) {
        console.log('✅ Already owns this store!');
        return;
      }

      const updateData = {
        user_id: user.id
      };

      console.log('Attempting to claim ownership by updating user_id...');

      const updated = await Store.update(store.id, updateData);
      console.log('✅ Store ownership claimed successfully:', updated);

      // Verify the update
      const verifyStores = await Store.getUserStores();
      const verifyStore = verifyStores.find(s => s.id === store.id);
      console.log('\nVerification:', {
        user_id: verifyStore?.user_id
      });
      
    } catch (error) {
      console.log('❌ Store update failed:', error.message, error.status);
      
      if (error.status === 403) {
        console.log('\n💡 IMPORTANT: The backend is preventing store ownership updates.');
        console.log('This needs to be fixed in the backend by:');
        console.log('1. Adding user_id/owner_id field to stores table');
        console.log('2. Updating the authorization logic to check ownership');
        console.log('3. Or manually updating the database to link your user to the store');
      }
    }
    
  } catch (error) {
    console.error('Error fixing ownership:', error);
  }
};

// Helper function to check delivery settings ownership
window.checkDeliveryOwnership = async () => {
  console.log('=== DELIVERY SETTINGS OWNERSHIP CHECK ===');
  const { DeliverySettings, Store } = await import('@/api/entities');
  
  try {
    // Get current user's stores
    const stores = await Store.getUserStores();
    console.log('Your stores:', stores.map(s => ({ id: s.id, name: s.name })));
    
    if (stores.length === 0) {
      console.log('❌ You have no stores');
      return;
    }
    
    // Check delivery settings for each store
    for (const store of stores) {
      console.log(`\nChecking delivery settings for store: ${store.name} (${store.id})`);
      
      try {
        const settings = await DeliverySettings.filter({ store_id: store.id });
        
        if (settings && settings.length > 0) {
          console.log(`✅ Found ${settings.length} delivery settings:`);
          settings.forEach(s => {
            console.log(`  - ID: ${s.id}`);
            console.log(`    Store ID: ${s.store_id}`);
            console.log(`    Matches your store: ${s.store_id === store.id ? 'YES ✅' : 'NO ❌'}`);
          });
        } else {
          console.log('⚠️ No delivery settings found for this store');
          console.log('💡 You need to create new delivery settings');
        }
      } catch (error) {
        console.log(`❌ Error fetching settings: ${error.message}`);
      }
    }
    
    // Check the specific problematic ID
    console.log('\n=== CHECKING PROBLEMATIC DELIVERY SETTINGS ===');
    console.log('ID: dc0d4518-cbd1-4cb7-9238-10ac381f5fac');
    
    try {
      const problematicSettings = await DeliverySettings.findById('dc0d4518-cbd1-4cb7-9238-10ac381f5fac');
      console.log('Settings found:', problematicSettings);
      console.log('Store ID in settings:', problematicSettings?.store_id);
      console.log('Your store IDs:', stores.map(s => s.id));
      console.log('Do you own this?', stores.some(s => s.id === problematicSettings?.store_id) ? 'YES ✅' : 'NO ❌');
    } catch (error) {
      console.log('Error fetching problematic settings:', error.message);
    }
    
  } catch (error) {
    console.error('Error in ownership check:', error);
  }
};

// Helper function to test different API endpoints and methods
window.testApiMethods = async () => {
  console.log('=== COMPREHENSIVE API METHOD TEST ===');
  const entities = await import('@/api/entities');
  
  const tests = [
    {
      name: 'User Profile Update (PUT)',
      test: async () => {
        try {
          const user = await entities.User.me();
          if (user) {
            const result = await entities.User.updateProfile({ first_name: user.first_name });
            return { success: true, method: 'PUT', endpoint: 'users', result };
          }
          return { success: false, error: 'No user data' };
        } catch (error) {
          return { success: false, method: 'PUT', endpoint: 'users', error: error.message, status: error.status };
        }
      }
    },
    {
      name: 'Product Create (POST)',
      test: async () => {
        try {
          const stores = await entities.Store.getUserStores();
          if (stores.length === 0) return { success: false, error: 'No stores' };
          
          const testProduct = {
            name: 'Test Product ' + Date.now(),
            description: 'Test description',
            price: 10,
            stock_quantity: 1,
            store_id: stores[0].id,
            sku: 'TEST-' + Date.now()
          };
          
          const result = await entities.Product.create(testProduct);
          // Clean up - delete the test product
          if (result && result.id) {
            await entities.Product.delete(result.id);
          }
          return { success: true, method: 'POST', endpoint: 'products', result: 'Created and deleted test product' };
        } catch (error) {
          return { success: false, method: 'POST', endpoint: 'products', error: error.message, status: error.status };
        }
      }
    },
    {
      name: 'Category Create (POST)',
      test: async () => {
        try {
          const stores = await entities.Store.getUserStores();
          if (stores.length === 0) return { success: false, error: 'No stores' };
          
          const testCategory = {
            name: 'Test Category ' + Date.now(),
            description: 'Test description',
            store_id: stores[0].id
          };
          
          const result = await entities.Category.create(testCategory);
          // Clean up
          if (result && result.id) {
            await entities.Category.delete(result.id);
          }
          return { success: true, method: 'POST', endpoint: 'categories', result: 'Created and deleted test category' };
        } catch (error) {
          return { success: false, method: 'POST', endpoint: 'categories', error: error.message, status: error.status };
        }
      }
    },
    {
      name: 'Settings Update (PUT)',
      test: async () => {
        try {
          const stores = await entities.Store.getUserStores();
          if (stores.length === 0) return { success: false, error: 'No stores' };
          
          const settings = await entities.Settings.findByStoreId(stores[0].id);
          if (settings && settings.length > 0) {
            const result = await entities.Settings.update(settings[0].id, { 
              store_name: settings[0].store_name || stores[0].name 
            });
            return { success: true, method: 'PUT', endpoint: 'settings', result: 'Updated settings' };
          }
          return { success: false, error: 'No settings found' };
        } catch (error) {
          return { success: false, method: 'PUT', endpoint: 'settings', error: error.message, status: error.status };
        }
      }
    }
  ];
  
  const results = [];
  for (const test of tests) {
    console.log(`\nTesting: ${test.name}`);
    const result = await test.test();
    results.push({ name: test.name, ...result });
    console.log(`Result:`, result);
  }
  
  console.log('\n=== SUMMARY ===');
  const putTests = results.filter(r => r.method === 'PUT');
  const postTests = results.filter(r => r.method === 'POST');
  
  console.log('PUT Results:', putTests.map(t => `${t.name}: ${t.success ? '✅' : '❌'}`));
  console.log('POST Results:', postTests.map(t => `${t.name}: ${t.success ? '✅' : '❌'}`));
  
  const allPutFail = putTests.every(t => !t.success);
  const allPostFail = postTests.every(t => !t.success);
  
  if (allPutFail && allPostFail) {
    console.log('\n🚨 ALL PUT/POST requests are failing - Backend authorization issue!');
  } else {
    console.log('\n🔍 Mixed results - Issue may be endpoint-specific');
  }
  
  return results;
};

// Helper function to manually fetch and store user data for current session
window.fixUserData = async () => {
  console.log('🔧 Manually fetching and storing user data...');
  
  try {
    const token = localStorage.getItem('store_owner_auth_token');
    if (!token) {
      console.error('❌ No store owner token found. Please login first.');
      return;
    }
    
    console.log('🔍 Found token, setting in API client...');
    apiClient.setToken(token);
    
    console.log('🔍 Calling User.me()...');
    const { User } = await import('@/api/entities');
    const user = await User.me();
    console.log('🔍 User.me() response:', user);
    
    if (user && user.id) {
      console.log('🔧 Storing user data in localStorage...');
      // Store user data WITHOUT credits (credits fetched live from database)
      const { credits, ...userDataWithoutCredits } = user;
      localStorage.setItem('store_owner_user_data', JSON.stringify(userDataWithoutCredits));
      console.log('✅ User data stored successfully (credits excluded)');
      console.log('🔄 Reload the page to apply changes.');
      window.location.reload();
    } else {
      console.error('❌ No valid user data returned from User.me()');
      console.log('🔍 This might indicate an authentication issue');
    }
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    if (error.status === 401 || error.status === 403) {
      console.log('🔍 Authentication error - token might be invalid');
      console.log('💡 Try logging out and logging back in');
    }
  }
};

// Helper function to test navigation
window.testNavigation = () => {
  console.log('🔧 Testing navigation to dashboard...');
  try {
    const dashboardUrl = '/admin/dashboard';
    console.log('Dashboard URL:', dashboardUrl);
    console.log('Current location:', window.location.href);
    console.log('Attempting navigation...');
    window.location.href = dashboardUrl;
  } catch (error) {
    console.error('Navigation error:', error);
  }
};

// Helper function to manually test the auth flow
window.testAuthFlow = async () => {
  console.log('🔧 Testing complete auth flow...');
  
  // Clear any existing state
  localStorage.removeItem('user_logged_out');
  apiClient.isLoggedOut = false;
  
  // Create mock token and user
  const mockToken = 'test_token_' + Date.now();
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'store_owner',
    first_name: 'Test',
    last_name: 'Owner'
  };
  
  localStorage.setItem('store_owner_auth_token', mockToken);
  localStorage.setItem('store_owner_user_data', JSON.stringify(mockUser));
  apiClient.setToken(mockToken);
  
  console.log('✅ Auth data set');
  console.log('Token in apiClient:', apiClient.getToken() ? 'Set' : 'Not set');
  console.log('User data:', mockUser);
  
  // Test the createAdminUrl function
  try {
    const { createAdminUrl } = await import('@/utils/urlUtils.js');
    const dashboardUrl = createAdminUrl("DASHBOARD");
    console.log('Dashboard URL from createAdminUrl:', dashboardUrl);
    
    // Try navigation
    console.log('Navigating to dashboard...');
    window.location.href = dashboardUrl;
  } catch (error) {
    console.error('Error in testAuthFlow:', error);
  }
};

// Helper function to create a complete authenticated session (NOTE: Creates mock token - backend will reject)
window.createAuthSession = () => {
  console.log('🔧 Creating authenticated session...');
  console.log('⚠️ WARNING: This creates a MOCK token that the backend will reject!');
  
  // Clear logout state completely
  localStorage.removeItem('user_logged_out');
  apiClient.isLoggedOut = false;
  
  // Create realistic auth data
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InRlc3RAYXV0aGVudGljYXRlZC5jb20iLCJyb2xlIjoic3RvcmVfb3duZXIifQ.test_signature';
  const userData = {
    id: 1,
    email: 'test@authenticated.com',
    role: 'store_owner',
    account_type: 'agency',
    first_name: 'Store',
    last_name: 'Owner',
    is_active: true,
    email_verified: true
  };
  
  // Set both in localStorage and apiClient
  localStorage.setItem('store_owner_auth_token', token);
  localStorage.setItem('store_owner_user_data', JSON.stringify(userData));
  apiClient.setToken(token);
  
  console.log('✅ Authenticated session created');
  console.log('Token set:', apiClient.getToken() ? 'Yes' : 'No');
  console.log('localStorage updated:', Object.keys(localStorage));
  
  // Reload to trigger auth check
  console.log('🔄 Reloading page to trigger authentication check...');
  window.location.reload();
};

// Helper function to clear all authentication data
window.clearAllAuth = () => {
  console.log('🔧 Clearing all authentication data...');
  
  // Clear all possible auth-related keys
  const authKeys = [
    'user_logged_out',
    'store_owner_auth_token',
    'store_owner_user_data', 
    'customer_auth_token',
    'customer_user_data',
    'guest_session_id'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  apiClient.setToken(null);
  apiClient.isLoggedOut = false;
  
  console.log('✅ All authentication data cleared');
  console.log('Remaining localStorage keys:', Object.keys(localStorage));
  window.location.reload();
};

// Helper function to test Google OAuth endpoint directly
window.testGoogleAuth = async () => {
  console.log('🔧 Testing Google OAuth endpoint...');
  
  const googleAuthUrl = `${apiClient.baseURL}/api/auth/google`;
  console.log('🔍 Testing URL:', googleAuthUrl);
  
  try {
    // Test with a simple fetch to see what happens
    const response = await fetch(googleAuthUrl, {
      method: 'GET',
      credentials: 'include',
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response type:', response.type);
    console.log('🔍 Response headers:', [...response.headers.entries()]);
    
    if (response.status === 0) {
      console.log('⚠️ Status 0 - possible CORS or redirect');
    } else if (response.status >= 200 && response.status < 400) {
      console.log('✅ Endpoint appears to be working');
    } else {
      console.log('❌ Endpoint returned error status');
    }
    
    // If there's a location header, it means we got a redirect
    const location = response.headers.get('location');
    if (location) {
      console.log('🔍 Redirect location:', location);
      if (location.includes('accounts.google.com')) {
        console.log('✅ Google OAuth redirect detected - authentication is configured!');
      }
    }
    
  } catch (error) {
    console.error('🔍 Error testing Google auth endpoint:', error);
    console.log('🔍 This might be normal for CORS-protected endpoints');
    
    if (error.message && error.message.includes('notsameorigin')) {
      console.log('ℹ️ CORS error is expected for OAuth endpoints - this means the endpoint exists!');
    }
  }
  
  console.log('🔍 If you want to test the actual redirect, click the Google login button');
};

// Helper function to directly navigate to Google OAuth (bypasses CORS)
window.testDirectGoogleAuth = () => {
  console.log('🔧 Testing direct navigation to Google OAuth...');
  
  const googleAuthUrl = `${apiClient.baseURL}/api/auth/google`;
  console.log('🔍 Navigating directly to:', googleAuthUrl);
  console.log('🔍 This will either:');
  console.log('   - Redirect to Google login (OAuth configured)');
  console.log('   - Show error page (OAuth not configured)');
  console.log('   - Show 404 (endpoint does not exist)');
  
  // Open in new tab so we don't lose our current debug session
  const newWindow = window.open(googleAuthUrl, '_blank');
  
  if (newWindow) {
    console.log('✅ New tab opened - check what happens there');
  } else {
    console.log('❌ Popup blocked - allow popups and try again');
  }
};

// Helper function to test the login flow with actual credentials
window.testLogin = async (email, password) => {
  console.log('🔧 Testing login flow...');
  console.log('🔍 Email:', email);
  console.log('🔍 Role: store_owner');
  
  try {
    // Clear any existing invalid tokens first
    clearAllAuth();
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test the login API directly
    const response = await fetch(`${apiClient.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        role: 'store_owner',
        rememberMe: false
      })
    });
    
    const data = await response.json();
    console.log('🔍 Login API response:', data);
    console.log('🔍 Response status:', response.status);
    
    if (response.ok && (data.token || data.data?.token)) {
      const token = data.token || data.data.token;
      console.log('✅ Login successful, token received');
      
      // Store the token
      localStorage.setItem('store_owner_auth_token', token);
      if (data.user || data.data?.user) {
        localStorage.setItem('store_owner_user_data', JSON.stringify(data.user || data.data.user));
      }
      
      console.log('🔍 Reloading page to test authentication flow...');
      window.location.reload();
    } else {
      console.error('❌ Login failed:', data);
    }
    
  } catch (error) {
    console.error('❌ Login test error:', error);
  }
};

// Helper function to test dashboard access after login
window.testDashboardAccess = async () => {
  console.log('🔧 Testing dashboard access...');
  
  console.log('🔍 Current auth state:');
  debugAuth();
  
  console.log('🔍 Testing User.me() API call...');
  try {
    const { User } = await import('@/api/entities.js');
    const user = await User.me();
    console.log('✅ User.me() successful:', user);
    
    if (user && (user.role === 'store_owner' || user.role === 'admin')) {
      console.log('✅ User has correct role for dashboard access');
      console.log('🔍 Attempting navigation to dashboard...');
      window.location.href = '/dashboard';
    } else {
      console.log('❌ User role incorrect for dashboard:', user?.role);
    }
    
  } catch (error) {
    console.error('❌ User.me() failed:', error);
    console.log('🔍 This is likely why dashboard is redirecting to auth');
    
    if (error.message && error.message.includes('Invalid token')) {
      console.log('🔧 Invalid token - run clearAllAuth() and login again');
    }
  }
};

export default function AuthMiddleware({ role = 'store_owner' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    console.log('🔍 AuthMiddleware useEffect triggered');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));
    
    const token = searchParams.get('token');
    const oauth = searchParams.get('oauth');
    const errorParam = searchParams.get('error');

    if (token && oauth === 'success') {
      console.log('🔍 OAuth success with token, setting up...');
      apiClient.setToken(token);
      checkAuthStatus();
    } else if (errorParam) {
      console.log('🔍 OAuth error detected:', errorParam);
      setError(getErrorMessage(errorParam));
    } else {
      // Check if user is already logged in based on role
      const tokenKey = role === 'customer' ? 'customer_auth_token' : 'store_owner_auth_token';
      const existingToken = localStorage.getItem(tokenKey);
      
      console.log('🔍 Checking existing token:', { 
        role, 
        tokenKey, 
        hasToken: !!existingToken, 
        tokenLength: existingToken ? existingToken.length : 0,
        loggedOut: localStorage.getItem('user_logged_out') 
      });
      
      if (existingToken) {
        // Always clear logout flag when we have a token - important for post-login flow
        if (localStorage.getItem('user_logged_out') === 'true') {
          console.log('🔧 CRITICAL FIX: Clearing logout flag for existing token');
          localStorage.removeItem('user_logged_out');
          apiClient.isLoggedOut = false;
        }
        
        console.log('🔍 Found valid existing token, setting up...');
        apiClient.setToken(existingToken);
        console.log('🔍 Token set in apiClient, calling checkAuthStatus...');
        checkAuthStatus();
      } else {
        console.log('🔍 No valid existing token found');
      }
    }
  }, [searchParams, role]);

  const getErrorMessage = (error) => {
    const errorKeyMap = {
      'oauth_failed': 'auth.error.oauth_failed',
      'token_generation_failed': 'auth.error.token_generation_failed',
      'database_connection_failed': 'auth.error.database_connection_failed'
    };
    return t(errorKeyMap[error] || 'auth.error.general');
  };

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking auth status...');
      console.log('🔍 API client isLoggedOut:', apiClient.isLoggedOut);
      console.log('🔍 Expected role:', role);
      console.log('🔍 Current token:', apiClient.getToken() ? 'Token exists' : 'No token');
      console.log('🔍 Stored tokens:', {
        storeOwner: localStorage.getItem('store_owner_auth_token') ? 'Exists' : 'Missing',
        customer: localStorage.getItem('customer_auth_token') ? 'Exists' : 'Missing'
      });
      
      if (apiClient.isLoggedOut) {
        console.log('🔍 User is marked as logged out, staying on auth page');
        return;
      }
      
      console.log('🔍 Calling User.me() with token:', apiClient.getToken() ? 'Token present' : 'No token');
      const user = await User.me();
      console.log('🔍 User.me() result:', user);
      console.log('🔍 User.me() type:', typeof user);
      console.log('🔍 User.me() keys:', user ? Object.keys(user) : 'null');
      
      if (!user) {
        console.log('🔍 No user data returned, staying on auth page');
        return;
      }
      
      // CRITICAL FIX: Store user data in localStorage
      const currentToken = apiClient.getToken();
      if (currentToken && user) {
        console.log('🔧 CRITICAL FIX: Storing user data in localStorage for role:', user.role);
        setRoleBasedAuthData(user, currentToken);
        console.log('✅ User data stored successfully');
      }
      
      console.log('🔍 User role:', user.role, 'Expected role:', role);
      
      // Redirect based on user role and expected role
      if (role === 'customer') {
        if (user.role === 'store_owner' || user.role === 'admin') {
          console.log('🔍 Store owner/admin on customer auth page, redirecting to admin auth');
          navigate(createAdminUrl("ADMIN_AUTH"));
        } else if (user.role === 'customer') {
          const returnTo = searchParams.get('returnTo');
          if (returnTo) {
            console.log('🔍 Customer has returnTo, redirecting to:', returnTo);
            navigate(returnTo);
          } else {
            const storefrontUrl = await getStorefrontUrl();
            console.log('🔍 Customer redirecting to storefront:', storefrontUrl);
            navigate(storefrontUrl);
          }
        }
      } else {
        if (user.role === 'customer') {
          // Get store slug from current URL or use default
          const currentStoreSlug = getStoreSlugFromPublicUrl(window.location.pathname) || 'default';
          console.log('🔍 Customer on store owner auth page, redirecting to customer auth');
          navigate(createPublicUrl(currentStoreSlug, "CUSTOMER_AUTH"));
        } else if (user.role === 'store_owner' || user.role === 'admin') {
          const dashboardUrl = createAdminUrl("DASHBOARD");
          console.log('🔍 Store owner/admin authenticated, redirecting to dashboard:', dashboardUrl);
          navigate(dashboardUrl);
        }
      }
    } catch (error) {
      console.log('🔍 Auth check error:', error);
      console.log('🔍 Error message:', error.message);
      
      // If token is invalid, clear it automatically
      if (error.message && (error.message.includes('Invalid token') || error.message.includes('Unauthorized'))) {
        console.log('🔧 Invalid token detected, clearing authentication data...');
        
        // Clear tokens for the current role
        const tokenKey = role === 'customer' ? 'customer_auth_token' : 'store_owner_auth_token';
        const userDataKey = role === 'customer' ? 'customer_user_data' : 'store_owner_user_data';
        
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userDataKey);
        apiClient.setToken(null);
        
        console.log('✅ Invalid authentication data cleared');
      }
      
      console.log('🔍 User not authenticated, staying on auth page');
    }
  };

  const getCustomerAccountUrl = async () => {
    // First try to get from localStorage
    const savedStoreCode = localStorage.getItem('customer_auth_store_code');
    if (savedStoreCode) {
      return createPublicUrl(savedStoreCode, 'ACCOUNT');
    }
    
    // Try to get from current URL (new and legacy)
    const currentStoreSlug = getStoreSlugFromPublicUrl(window.location.pathname) || 
                             getStoreSlugFromUrl(window.location.pathname);
    if (currentStoreSlug) {
      return createPublicUrl(currentStoreSlug, 'ACCOUNT');
    }
    
    // Try to fetch the first available store
    try {
      const { Store } = await import('@/api/entities');
      const stores = await Store.findAll();
      if (stores && stores.length > 0) {
        const firstStore = stores[0];
        return createPublicUrl(firstStore.slug, 'ACCOUNT');
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
    
    // Default fallback to new URL structure
    return createPublicUrl('default', 'ACCOUNT');
  };

  const handleAuth = async (formData, isLogin) => {
    console.log('🚀 handleAuth called!', { isLogin, email: formData.email, role });
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        console.log('🔍 Starting login process...', { email: formData.email, role });

        console.log('📞 Calling AuthService.login...');
        const response = await AuthService.login(
          formData.email,
          formData.password,
          formData.rememberMe,
          role
        );
        console.log('✅ AuthService.login returned:', response);
        
        console.log('🔍 Login response:', response);
        console.log('🔍 Response structure:', {
          hasSuccess: 'success' in response,
          success: response.success,
          hasData: 'data' in response,
          hasToken: response.token || response.data?.token,
          keys: Object.keys(response)
        });
        
        // Handle both array and object responses
        let actualResponse = response;
        if (Array.isArray(response)) {
          console.log('🔍 Response is array, taking first element');
          actualResponse = response[0];
          console.log('🔍 Array element structure:', {
            keys: Object.keys(actualResponse || {}),
            hasSuccess: 'success' in (actualResponse || {}),
            successValue: actualResponse?.success,
            actualResponse: actualResponse
          });
        }
        
        // Check multiple possible success indicators
        const isSuccess = actualResponse?.success || 
                         actualResponse?.status === 'success' || 
                         actualResponse?.token || 
                         (actualResponse && Object.keys(actualResponse).length > 0);
        
        console.log('🔍 Success check result:', isSuccess);
        
        if (isSuccess) {
          const token = actualResponse.data?.token || actualResponse.token;
          console.log('🔍 Extracted token:', token ? 'Token found' : 'No token found');
          
          if (token) {
            console.log('🔍 Processing login token:', { role, tokenLength: token.length });
            
            // Clear logged out flag before setting token
            localStorage.removeItem('user_logged_out');
            apiClient.isLoggedOut = false; // Critical: Clear the logged out flag
            console.log('🔍 Cleared user_logged_out flag and apiClient.isLoggedOut');

            // Store token based on role
            const tokenKey = role === 'customer' ? 'customer_auth_token' : 'store_owner_auth_token';
            localStorage.setItem(tokenKey, token);
            console.log('✅ STORED TOKEN in localStorage with key:', tokenKey, 'Token length:', token.length);

            // Verify token was stored
            const verifyToken = localStorage.getItem(tokenKey);
            console.log('🔍 VERIFY: Token retrieved from localStorage:', verifyToken ? 'EXISTS (length: ' + verifyToken.length + ')' : 'NOT FOUND!');

            apiClient.setToken(token);
            console.log('🔍 Set token in apiClient, isLoggedOut:', apiClient.isLoggedOut);
            
            // CRITICAL FIX: Store user data from login response
            const userData = actualResponse.data?.user || actualResponse.user || actualResponse;
            if (userData && userData.id) {
              console.log('🔧 CRITICAL FIX: Storing user data from login response');
              setRoleBasedAuthData(userData, token);
              console.log('✅ User data stored from login response:', userData.role);
            } else {
              console.warn('⚠️ No user data found in login response, will fetch via User.me()');
            }
            
            // For customers, navigate immediately without verification
            if (role === 'customer') {
              console.log('🔍 Customer login successful, navigating to storefront');
              localStorage.removeItem('customer_auth_store_id');
              localStorage.removeItem('customer_auth_store_code');
              
              const returnTo = searchParams.get('returnTo');
              if (returnTo) {
                console.log('🔍 Navigating to returnTo:', returnTo);
                navigate(returnTo);
              } else {
                const accountUrl = await getCustomerAccountUrl();
                console.log('🔍 Navigating to customer account:', accountUrl);
                navigate(accountUrl);
              }
              return;
            }
            
            // For store owners, check if they have active stores and redirect accordingly
            console.log('✅ Store owner login successful, checking for active stores...');
            setTimeout(async () => {
              try {
                // Get user data which includes store_id from JWT token
                const userData = actualResponse.data?.user || actualResponse.user || actualResponse;

                console.log('🔍 User data from login response:', {
                  hasStoreId: !!userData.store_id,
                  store_id: userData.store_id,
                  userKeys: Object.keys(userData),
                  fullUserData: userData
                });

                // Try to get store_id from user data, or decode from JWT token
                let storeId = userData.store_id;

                console.log('🔍 Token received:', token ? token.substring(0, 50) + '...' : 'NO TOKEN');

                if (!storeId && token) {
                  // Decode JWT to get store_id
                  try {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    const tokenData = JSON.parse(jsonPayload);
                    storeId = tokenData.store_id;
                    console.log('🔍 Decoded JWT payload:', {
                      id: tokenData.id,
                      email: tokenData.email,
                      role: tokenData.role,
                      has_store_id: !!tokenData.store_id,
                      store_id: tokenData.store_id,
                      allKeys: Object.keys(tokenData)
                    });
                  } catch (decodeError) {
                    console.error('❌ Error decoding JWT:', decodeError);
                  }
                }

                console.log('🔍 Final storeId to use:', storeId);

                if (storeId) {
                  // Backend found first active store - fetch details and redirect to dashboard
                  console.log('🔍 First active store found:', storeId);

                  try {
                    const storeResponse = await apiClient.get(`/stores/${storeId}`);
                    const store = storeResponse.data || storeResponse;

                    console.log('✅ Setting active store:', store.name, '(slug:', store.slug + ')');
                    localStorage.setItem('selectedStoreId', store.id);
                    localStorage.setItem('selectedStoreSlug', store.slug || store.code);

                    const dashboardUrl = createAdminUrl("DASHBOARD");
                    console.log('🔍 Redirecting to dashboard:', dashboardUrl);
                    navigate(dashboardUrl);
                  } catch (storeError) {
                    console.error('❌ Error fetching store details:', storeError);
                    // Fallback: set store_id without slug and go to dashboard
                    localStorage.setItem('selectedStoreId', storeId);
                    navigate(createAdminUrl("DASHBOARD"));
                  }
                } else {
                  // No active stores found - redirect to onboarding
                  console.log('⚠️ No active stores found, redirecting to onboarding...');
                  const onboardingUrl = createAdminUrl("StoreOnboarding");
                  navigate(onboardingUrl || '/admin/store-onboarding');
                }
              } catch (error) {
                console.error('❌ Error during post-login setup:', error);
                console.error('Error details:', error.message, error.stack);

                // On error, redirect to onboarding (safer fallback)
                console.log('🔍 Error occurred, redirecting to onboarding...');
                const onboardingUrl = createAdminUrl("StoreOnboarding");
                navigate(onboardingUrl || '/admin/store-onboarding');
              }
            }, 100); // Small delay to ensure token is set
          }
        }
      } else {
        // Registration
        if (formData.password !== formData.confirmPassword) {
          setError(t('message.password_mismatch'));
          return;
        }

        const registerData = {
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: role,
          account_type: role === 'customer' ? 'individual' : 'agency'
        };

        // Add store_id for customer registration
        if (role === 'customer') {
          const savedStoreId = localStorage.getItem('customer_auth_store_id');
          registerData.store_id = savedStoreId;
        }
        
        const response = await AuthService.register(registerData);
        
        // Handle both array and object responses for registration
        let actualRegResponse = response;
        if (Array.isArray(response)) {
          console.log('🔍 Registration response is array, taking first element');
          actualRegResponse = response[0];
        }
        
        if (actualRegResponse?.success) {
          const token = actualRegResponse.data?.token || actualRegResponse.token;
          
          if (token) {
            // Clear logged out flag before setting token
            localStorage.removeItem('user_logged_out');
            
            const tokenKey = role === 'customer' ? 'customer_auth_token' : 'store_owner_auth_token';
            localStorage.setItem(tokenKey, token);
            apiClient.setToken(token);
            
            if (role === 'customer') {
              localStorage.removeItem('customer_auth_store_id');
              localStorage.removeItem('customer_auth_store_code');
              const accountUrl = await getCustomerAccountUrl();
              navigate(accountUrl);
            } else {
              setSuccess(t('auth.success.user_created'));
              setTimeout(() => {
                navigate(createAdminUrl("DASHBOARD"));
              }, 1500);
            }
          }
        }
      }
    } catch (error) {
      console.error('🔍 Auth error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      });
      const defaultMessage = isLogin ? t('common.login_failed') : t('customer_auth.error.registration_failed');
      setError(error.message || defaultMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    if (role === 'customer') {
      setError(t('auth.error.google_not_available_customer'));
      return;
    }
    
    console.log('🔍 Google auth initiated');
    console.log('🔍 API Base URL:', apiClient.baseURL);
    console.log('🔍 Full Google auth URL:', `${apiClient.baseURL}/api/auth/google`);
    console.log('🔍 Current URL before redirect:', window.location.href);
    
    setLoading(true);
    setError("");
    
    const googleAuthUrl = `${apiClient.baseURL}/api/auth/google`;
    console.log('🔍 Redirecting to:', googleAuthUrl);
    
    // Test if the URL is accessible
    fetch(googleAuthUrl, { method: 'HEAD', mode: 'no-cors' })
      .then(() => {
        console.log('🔍 Google auth endpoint appears accessible');
      })
      .catch(error => {
        console.log('🔍 Google auth endpoint test failed:', error);
      });
    
    // Add a timeout to check if redirect fails
    const redirectTimeout = setTimeout(() => {
      console.log('🔍 Google auth redirect timeout - checking what happened');
      console.log('🔍 Current URL after timeout:', window.location.href);
      setError(t('auth.error.google_redirect_failed'));
      setLoading(false);
    }, 5000);
    
    // Clear timeout if page unloads (successful redirect)
    window.addEventListener('beforeunload', () => {
      console.log('🔍 Page unloading - Google auth redirect started');
      clearTimeout(redirectTimeout);
    });
    
    try {
      console.log('🔍 Attempting redirect to Google auth...');
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('🔍 Error during redirect:', error);
      setError(t('auth.error.redirect_failed'));
      setLoading(false);
    }
  };

  // Render appropriate layout based on role
  if (role === 'customer') {
    return (
      <CustomerAuthLayout
        loading={loading}
        error={error}
        success={success}
        onAuth={handleAuth}
        onGoogleAuth={handleGoogleAuth}
      />
    );
  } else {
    return (
      <StoreOwnerAuthLayout
        loading={loading}
        error={error}
        success={success}
        onAuth={handleAuth}
        onGoogleAuth={handleGoogleAuth}
      />
    );
  }
}