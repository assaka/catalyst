/**
 * Account and Login Slot Components
 * Unified components for account and login pages
 */

import React from 'react';
import { createSlotComponent, registerSlotComponent } from './SlotComponentRegistry';
import { Auth as AuthService } from '@/api/entities';
import apiClient from '@/api/client';
import { useNavigate, useParams } from 'react-router-dom';
import { createPublicUrl } from '@/utils/urlUtils';

/**
 * UserProfileSlot - User profile display with avatar and info
 */
const UserProfileSlot = createSlotComponent({
  name: 'UserProfileSlot',
  render: ({ slot, context, variableContext }) => {
    const user = variableContext?.user || { full_name: 'John Doe', email: 'john@example.com' };

    return (
      <div className={slot.className} style={slot.styles}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>
    );
  }
});

/**
 * NavigationMenuSlot - Account navigation menu
 */
const NavigationMenuSlot = createSlotComponent({
  name: 'NavigationMenuSlot',
  render: ({ slot, context, variableContext }) => {
    return (
      <div className={slot.className} style={slot.styles}>
        <nav className="space-y-2">
          <button className="w-full text-left px-3 py-2 rounded-lg bg-blue-100 text-blue-700">Overview</button>
          <button className="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Orders</button>
          <button className="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Addresses</button>
          <button className="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Wishlist</button>
        </nav>
      </div>
    );
  }
});

/**
 * AccountStatsSlot - Account statistics display
 */
const AccountStatsSlot = createSlotComponent({
  name: 'AccountStatsSlot',
  render: ({ slot, context, variableContext }) => {
    const orders = variableContext?.orders || [];
    const addresses = variableContext?.addresses || [];
    const wishlistItems = variableContext?.wishlistItems || [];

    return (
      <div className={slot.className} style={slot.styles}>
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            </div>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-gray-500">All time</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Saved Addresses</h3>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              </svg>
            </div>
            <div className="text-2xl font-bold">{addresses.length}</div>
            <p className="text-xs text-gray-500">Delivery locations</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Wishlist Items</h3>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </div>
            <div className="text-2xl font-bold">{wishlistItems.length}</div>
            <p className="text-xs text-gray-500">Saved for later</p>
          </div>
        </div>
      </div>
    );
  }
});

/**
 * RecentOrdersSlot - Recent orders display
 */
const RecentOrdersSlot = createSlotComponent({
  name: 'RecentOrdersSlot',
  render: ({ slot, context, variableContext }) => {
    const orders = variableContext?.orders || [];

    return (
      <div className={slot.className} style={slot.styles}>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">No orders yet</p>
              <p className="text-gray-600">Your order history will appear here once you make a purchase.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">{order.date}</p>
                    </div>
                    <span className="text-sm font-medium text-green-600">{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
});

/**
 * ProfileFormSlot - Profile edit form
 */
const ProfileFormSlot = createSlotComponent({
  name: 'ProfileFormSlot',
  render: ({ slot, context, variableContext }) => {
    const user = variableContext?.user || { full_name: 'John Doe', email: 'john@example.com' };
    const [firstName, lastName] = user.full_name.split(' ');

    return (
      <div className={slot.className} style={slot.styles}>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" defaultValue={firstName} className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" defaultValue={lastName} className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" defaultValue={user.email} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
              Save Changes
            </button>
          </form>
        </div>
      </div>
    );
  }
});

/**
 * LoginFormSlot - Login form
 * Wrapper component to use React hooks
 */
const LoginFormSlotComponent = ({ slot, context, variableContext }) => {
  const navigate = useNavigate();
  const { storeCode } = useParams();

  // Local state - will be used since loginData from variableContext is empty
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  // Get loginData from variableContext (for debugging)
  const loginData = variableContext?.loginData || {};
  console.log('🔍 LoginFormSlot: loginData from variableContext:', loginData, 'keys:', Object.keys(loginData));

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getCustomerAccountUrl = async () => {
    if (storeCode) {
      return createPublicUrl(storeCode, 'CUSTOMER_DASHBOARD');
    }
    const savedStoreCode = localStorage.getItem('customer_auth_store_code');
    if (savedStoreCode) {
      return createPublicUrl(savedStoreCode, 'CUSTOMER_DASHBOARD');
    }
    return createPublicUrl('default', 'CUSTOMER_DASHBOARD');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 LoginFormSlot: Starting login for:', formData.email);

      const response = await AuthService.login(
        formData.email,
        formData.password,
        formData.rememberMe,
        'customer'
      );

      console.log('🔐 LoginFormSlot: Response received:', response);

      let actualResponse = response;
      if (Array.isArray(response)) {
        actualResponse = response[0];
      }

      const isSuccess = actualResponse?.success ||
                       actualResponse?.status === 'success' ||
                       actualResponse?.token ||
                       (actualResponse && Object.keys(actualResponse).length > 0);

      if (isSuccess) {
        const token = actualResponse.data?.token || actualResponse.token;

        if (token) {
          console.log('✅ LoginFormSlot: Token found, setting up session');
          localStorage.removeItem('user_logged_out');
          localStorage.setItem('customer_auth_token', token);
          apiClient.setToken(token);

          const accountUrl = await getCustomerAccountUrl();
          console.log('✅ LoginFormSlot: Navigating to:', accountUrl);
          navigate(accountUrl);
          return;
        } else {
          console.error('❌ LoginFormSlot: No token in response');
          setError('Login failed: No authentication token received');
        }
      } else {
        console.error('❌ LoginFormSlot: Response not successful');
        setError('Login failed: Invalid response from server');
      }
    } catch (error) {
      console.error('❌ LoginFormSlot: Error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

    return (
      <div className={slot.className} style={slot.styles}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10"
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="rounded"
              disabled={loading}
            />
            <label className="ml-2 text-sm">Remember me</label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    );
};

// Wrap with createSlotComponent
const LoginFormSlot = createSlotComponent({
  name: 'LoginFormSlot',
  render: (props) => <LoginFormSlotComponent {...props} />
});

/**
 * RegisterFormSlot - Registration form
 */
const RegisterFormSlot = createSlotComponent({
  name: 'RegisterFormSlot',
  render: ({ slot, context }) => {
    return (
      <div className={slot.className} style={slot.styles}>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" required className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="First name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" required className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Last name" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" required className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Enter your email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Enter your password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input type="password" required className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Confirm password" />
          </div>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-md">
            Create My Account
          </button>
        </form>
      </div>
    );
  }
});

/**
 * AccountIntroHeroSlot - Hero section for intro view (not logged in)
 */
const AccountIntroHeroSlot = createSlotComponent({
  name: 'AccountIntroHeroSlot',
  render: ({ slot, context }) => {
    return (
      <div className={slot.className} style={slot.styles}>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-12 mb-8">
          <div className="max-w-3xl mx-auto text-center">
            <svg className="w-20 h-20 mx-auto mb-6 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <h2 className="text-4xl font-bold mb-4">Welcome to Your Account</h2>
            <p className="text-xl mb-8 opacity-90">Sign in to access your orders, track shipments, and manage your preferences</p>
          </div>
        </div>
      </div>
    );
  }
});

/**
 * AccountBenefitsSlot - Benefits grid for intro view (not logged in)
 */
const AccountBenefitsSlot = createSlotComponent({
  name: 'AccountBenefitsSlot',
  render: ({ slot, context }) => {
    return (
      <div className={slot.className} style={slot.styles}>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Order History</h3>
            <p className="text-gray-600">View and track all your orders in one place</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Fast Checkout</h3>
            <p className="text-gray-600">Save addresses and payment methods for quick checkout</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Wishlist</h3>
            <p className="text-gray-600">Save your favorite items for later</p>
          </div>
        </div>
      </div>
    );
  }
});

/**
 * AccountCTASlot - Call-to-action for intro view (not logged in)
 */
const AccountCTASlot = createSlotComponent({
  name: 'AccountCTASlot',
  render: ({ slot, context }) => {
    return (
      <div className={slot.className} style={slot.styles}>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-2xl font-semibold mb-4">Ready to Get Started?</h3>
          <p className="text-gray-600 mb-6">Create an account or sign in to access all features</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => window.location.href = '/customer/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium"
            >
              Sign In
            </button>
            <button
              onClick={() => window.location.href = '/customer/login'}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg font-medium"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }
});

// Register all components
registerSlotComponent('UserProfileSlot', UserProfileSlot);
registerSlotComponent('NavigationMenuSlot', NavigationMenuSlot);
registerSlotComponent('AccountStatsSlot', AccountStatsSlot);
registerSlotComponent('RecentOrdersSlot', RecentOrdersSlot);
registerSlotComponent('ProfileFormSlot', ProfileFormSlot);
registerSlotComponent('LoginFormSlot', LoginFormSlot);
registerSlotComponent('RegisterFormSlot', RegisterFormSlot);
registerSlotComponent('AccountIntroHeroSlot', AccountIntroHeroSlot);
registerSlotComponent('AccountBenefitsSlot', AccountBenefitsSlot);
registerSlotComponent('AccountCTASlot', AccountCTASlot);

export {
  UserProfileSlot,
  NavigationMenuSlot,
  AccountStatsSlot,
  RecentOrdersSlot,
  ProfileFormSlot,
  LoginFormSlot,
  RegisterFormSlot,
  AccountIntroHeroSlot,
  AccountBenefitsSlot,
  AccountCTASlot
};
