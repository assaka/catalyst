import { User, UserCircle } from 'lucide-react';

// Account Page Configuration - Sidebar Layout
export const accountConfig = {
  page_name: 'Account',
  slot_type: 'account_layout',

  // Slot configuration with sidebar layout
  slots: {
    // Page header
    account_header: {
      id: 'account_header',
      type: 'container',
      content: '',
      className: 'mb-8',
      styles: {},
      viewMode: ['overview', 'profile']
    },

    header_title: {
      id: 'header_title',
      type: 'text',
      content: 'My Account',
      className: 'text-3xl font-bold text-gray-900',
      styles: {},
      viewMode: ['overview', 'profile']
    },

    header_subtitle: {
      id: 'header_subtitle',
      type: 'text',
      content: 'Manage your account, orders, and preferences',
      className: 'text-gray-600 mt-1',
      styles: {},
      viewMode: ['overview', 'profile']
    },

    // Sidebar navigation (left column - 25% width)
    account_sidebar: {
      id: 'account_sidebar',
      type: 'container',
      content: '',
      className: 'bg-white rounded-lg shadow p-6',
      styles: {},
      viewMode: ['overview', 'profile']
    },

    user_profile: {
      id: 'user_profile',
      type: 'component',
      component: 'UserProfileSlot',
      content: `
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900">John Doe</h3>
          <p class="text-sm text-gray-500">john@example.com</p>
        </div>
      `,
      className: '',
      styles: {},
      viewMode: ['overview', 'profile']
    },

    navigation_menu: {
      id: 'navigation_menu',
      type: 'component',
      component: 'NavigationMenuSlot',
      content: `
        <nav class="space-y-2">
          <button class="w-full text-left px-3 py-2 rounded-lg bg-blue-100 text-blue-700">Overview</button>
          <button class="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Orders</button>
          <button class="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Addresses</button>
          <button class="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Wishlist</button>
        </nav>
      `,
      className: '',
      styles: {},
      viewMode: ['overview', 'profile']
    },

    logout_button: {
      id: 'logout_button',
      type: 'button',
      content: 'Sign Out',
      className: 'w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg mt-6 pt-6 border-t',
      styles: {},
      viewMode: ['overview', 'profile']
    },

    // Main content area (right column - 75% width)
    account_content: {
      id: 'account_content',
      type: 'container',
      content: '',
      className: '',
      styles: {},
      viewMode: ['overview', 'profile']
    },

    overview_stats: {
      id: 'overview_stats',
      type: 'component',
      component: 'AccountStatsSlot',
      content: `
        <div class="grid md:grid-cols-3 gap-6 mb-6">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-600">Total Orders</h3>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            </div>
            <div class="text-2xl font-bold">0</div>
            <p class="text-xs text-gray-500">All time</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-600">Saved Addresses</h3>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              </svg>
            </div>
            <div class="text-2xl font-bold">0</div>
            <p class="text-xs text-gray-500">Delivery locations</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-600">Wishlist Items</h3>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </div>
            <div class="text-2xl font-bold">0</div>
            <p class="text-xs text-gray-500">Saved for later</p>
          </div>
        </div>
      `,
      className: '',
      styles: {},
      viewMode: ['overview']
    },

    recent_orders: {
      id: 'recent_orders',
      type: 'component',
      component: 'RecentOrdersSlot',
      content: `
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-4">Recent Orders</h3>
          <div class="text-center py-8">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
            <p class="text-lg font-medium text-gray-900 mb-2">No orders yet</p>
            <p class="text-gray-600">Your order history will appear here once you make a purchase.</p>
          </div>
        </div>
      `,
      className: '',
      styles: {},
      viewMode: ['overview']
    },

    profile_section: {
      id: 'profile_section',
      type: 'component',
      component: 'ProfileFormSlot',
      content: `
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-4">Profile Information</h3>
          <form class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" value="John" class="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" value="Doe" class="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value="john@example.com" class="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" class="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
              Save Changes
            </button>
          </form>
        </div>
      `,
      className: '',
      styles: {},
      viewMode: ['profile']
    },

    account_footer: {
      id: 'account_footer',
      type: 'text',
      content: 'Need help? Contact our <a href="#" class="text-blue-600 hover:underline">customer support</a>',
      className: 'text-center text-sm text-gray-600 py-8',
      styles: {},
      viewMode: ['overview', 'profile']
    }
  },

  // Configuration metadata
  metadata: {
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0',
    pageType: 'account'
  },

  // View configuration
  views: [
    { id: 'overview', label: 'Account Overview', icon: User },
    { id: 'profile', label: 'Profile View', icon: UserCircle }
  ],

  // CMS blocks for additional content areas
  cmsBlocks: [
    'account_header',
    'account_sidebar',
    'account_footer',
    'account_banner',
    'account_promotions'
  ]
};

export default accountConfig;
