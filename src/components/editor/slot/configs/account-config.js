import { User, UserCircle, LogIn } from 'lucide-react';

// Account Page Configuration - Sidebar Layout
export const accountConfig = {
  page_name: 'Account',
  slot_type: 'account_layout',

  // Slot layout definition
  slotLayout: {
    account_header: { name: 'Account Header', colSpan: 12, order: 0 },
    account_cms_above: { name: 'CMS Above Content', colSpan: 12, order: 1 },
    account_sidebar: { name: 'Account Sidebar', colSpan: 3, order: 2 },
    account_content: { name: 'Account Content', colSpan: 9, order: 3 },
    account_cms_below: { name: 'CMS Below Content', colSpan: 12, order: 4 },
    account_footer: { name: 'Account Footer', colSpan: 12, order: 5 }
  },

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
      content: '{{t "my_account"}}',
      className: 'text-3xl font-bold text-gray-900',
      styles: {},
      viewMode: ['overview', 'profile', 'intro']
    },

    header_subtitle: {
      id: 'header_subtitle',
      type: 'text',
      content: '{{t "manage_account_description"}}',
      className: 'text-gray-600 mt-1',
      styles: {},
      viewMode: ['overview', 'profile']
    },

    // CMS Block Above Content
    account_cms_above: {
      id: 'account_cms_above',
      type: 'cms',
      content: '',
      className: 'mb-6',
      styles: {},
      viewMode: ['overview', 'profile', 'intro'],
      cmsBlockPosition: 'account_cms_above'
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
      content: '{{t "sign_out"}}',
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

    // CMS Block Below Content
    account_cms_below: {
      id: 'account_cms_below',
      type: 'cms',
      content: '',
      className: 'mt-6',
      styles: {},
      viewMode: ['overview', 'profile', 'intro'],
      cmsBlockPosition: 'account_cms_below'
    },

    account_footer: {
      id: 'account_footer',
      type: 'text',
      content: '{{t "need_help_contact_support"}}',
      className: 'text-center text-sm text-gray-600 py-8',
      styles: {},
      viewMode: ['overview', 'profile', 'intro']
    },

    // Account Intro (Not Logged In) - Full width content
    intro_hero: {
      id: 'intro_hero',
      type: 'component',
      component: 'AccountIntroHeroSlot',
      content: `
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-12 mb-8">
          <div class="max-w-3xl mx-auto text-center">
            <svg class="w-20 h-20 mx-auto mb-6 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <h2 class="text-4xl font-bold mb-4">Welcome to Your Account</h2>
            <p class="text-xl mb-8 opacity-90">Sign in to access your orders, track shipments, and manage your preferences</p>
          </div>
        </div>
      `,
      className: '',
      styles: {},
      viewMode: ['intro']
    },

    intro_benefits: {
      id: 'intro_benefits',
      type: 'component',
      component: 'AccountBenefitsSlot',
      content: `
        <div class="grid md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2">Order History</h3>
            <p class="text-gray-600">View and track all your orders in one place</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2">Fast Checkout</h3>
            <p class="text-gray-600">Save addresses and payment methods for quick checkout</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2">Wishlist</h3>
            <p class="text-gray-600">Save your favorite items for later</p>
          </div>
        </div>
      `,
      className: '',
      styles: {},
      viewMode: ['intro']
    },

    intro_cta: {
      id: 'intro_cta',
      type: 'component',
      component: 'AccountCTASlot',
      content: `
        <div class="bg-white rounded-lg shadow p-8 text-center">
          <h3 class="text-2xl font-semibold mb-4">Ready to Get Started?</h3>
          <p class="text-gray-600 mb-6">Create an account or sign in to access all features</p>
          <div class="flex justify-center gap-4">
            <button class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium">
              Sign In
            </button>
            <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg font-medium">
              Create Account
            </button>
          </div>
        </div>
      `,
      className: '',
      styles: {},
      viewMode: ['intro']
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
    { id: 'profile', label: 'Profile View', icon: UserCircle },
    { id: 'intro', label: 'Account Intro (Not Logged In)', icon: LogIn }
  ],

  // CMS blocks for additional content areas
  cmsBlocks: [
    {
      id: 'account_cms_above',
      name: 'Above Content',
      description: 'Full-width content area above the main account content',
      defaultContent: '',
      position: 'account_cms_above'
    },
    {
      id: 'account_cms_below',
      name: 'Below Content',
      description: 'Full-width content area below the main account content',
      defaultContent: '',
      position: 'account_cms_below'
    }
  ]
};

export default accountConfig;
