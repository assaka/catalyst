import { LogIn, UserPlus } from 'lucide-react';

// Login Page Configuration - 2 Column Layout
export const loginConfig = {
  page_name: 'Login',
  slot_type: 'login_layout',

  // Slot configuration with simple 2-column layout
  slots: {
    // Page header/banner
    page_header: {
      id: 'page_header',
      type: 'text',
      content: 'Welcome Back',
      className: 'text-3xl font-bold text-center text-gray-900 py-8',
      styles: {},
      viewMode: ['login', 'register']
    },

    // Login column - left side
    login_column: {
      id: 'login_column',
      type: 'container',
      content: '',
      className: 'bg-white p-8 rounded-lg shadow-md',
      styles: {},
      viewMode: ['login', 'register']
    },

    login_title: {
      id: 'login_title',
      type: 'text',
      content: 'Already Registered? Login!',
      className: 'text-2xl font-bold text-gray-900 mb-6',
      styles: {},
      viewMode: ['login', 'register']
    },

    login_form: {
      id: 'login_form',
      type: 'component',
      component: 'LoginFormSlot',
      content: `
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" required class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Enter your email" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Enter your password" />
          </div>
          <div class="flex items-center">
            <input type="checkbox" class="rounded" />
            <label class="ml-2 text-sm">Remember me</label>
          </div>
          <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md">
            Sign In
          </button>
        </form>
      `,
      className: '',
      styles: {},
      viewMode: ['login', 'register']
    },

    // Register column - right side
    register_column: {
      id: 'register_column',
      type: 'container',
      content: '',
      className: 'bg-white p-8 rounded-lg shadow-md',
      styles: {},
      viewMode: ['login', 'register']
    },

    register_title: {
      id: 'register_title',
      type: 'text',
      content: 'Create Account',
      className: 'text-2xl font-bold text-gray-900 mb-6',
      styles: {},
      viewMode: ['login', 'register']
    },

    register_form: {
      id: 'register_form',
      type: 'component',
      component: 'RegisterFormSlot',
      content: `
        <form class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" required class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="First name" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" required class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Last name" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" required class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Enter your email" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Enter your password" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input type="password" required class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Confirm password" />
          </div>
          <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-md">
            Create My Account
          </button>
        </form>
      `,
      className: '',
      styles: {},
      viewMode: ['login', 'register']
    },

    // Footer section
    login_footer: {
      id: 'login_footer',
      type: 'text',
      content: 'By signing in, you agree to our Terms of Service and Privacy Policy',
      className: 'text-center text-sm text-gray-600 py-8',
      styles: {},
      viewMode: ['login', 'register']
    }
  },

  // Configuration metadata
  metadata: {
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0',
    pageType: 'login'
  },

  // View configuration
  views: [
    { id: 'login', label: 'Login View', icon: LogIn },
    { id: 'register', label: 'Register View', icon: UserPlus }
  ],

  // CMS blocks for additional content areas
  cmsBlocks: [
    'login_header',
    'login_footer',
    'social_login',
    'login_banner',
    'register_banner'
  ]
};

export default loginConfig;
