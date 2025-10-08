import { LogIn, UserPlus } from 'lucide-react';

// Login Page Configuration with hierarchical support
export const loginConfig = {
  page_name: 'Login',
  slot_type: 'login_layout',

  // Slot configuration with content, styling and metadata
  slots: {
    // Main layout container
    main_layout: {
      id: 'main_layout',
      type: 'grid',
      content: '',
      className: 'min-h-screen bg-gray-50 grid grid-cols-1 lg:grid-cols-2 gap-8',
      styles: {},
      parentId: null,
      layout: 'grid',
      gridCols: 2,
      colSpan: {
        login: 12,
        register: 12
      },
      viewMode: ['login', 'register'],
      metadata: { hierarchical: true }
    },

    // Login header
    login_header: {
      id: 'login_header',
      type: 'text',
      content: 'Sign In to Your Account',
      className: 'text-2xl font-bold text-center text-gray-900 mb-6',
      styles: {},
      parentId: 'main_layout',
      position: { col: 1, row: 1 },
      colSpan: {
        login: 6,
        register: 6
      },
      viewMode: ['login', 'register'],
      metadata: { hierarchical: true }
    },

    // Login form container
    login_form_container: {
      id: 'login_form_container',
      type: 'container',
      content: '',
      className: 'p-8 bg-white rounded-lg shadow-md',
      styles: {},
      parentId: 'main_layout',
      position: { col: 1, row: 2 },
      colSpan: {
        login: 6,
        register: 6
      },
      viewMode: ['login', 'register'],
      metadata: { hierarchical: true }
    },

    // Login form
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
      parentId: 'login_form_container',
      position: { col: 1, row: 1 },
      viewMode: ['login', 'register'],
      metadata: { hierarchical: true }
    },

    // Register header
    register_header: {
      id: 'register_header',
      type: 'text',
      content: 'Create New Account',
      className: 'text-2xl font-bold text-center text-gray-900 mb-6',
      styles: {},
      parentId: 'main_layout',
      position: { col: 2, row: 1 },
      colSpan: {
        login: 6,
        register: 6
      },
      viewMode: ['login', 'register'],
      metadata: { hierarchical: true }
    },

    // Register form container
    register_form_container: {
      id: 'register_form_container',
      type: 'container',
      content: '',
      className: 'p-8 bg-white rounded-lg shadow-md',
      styles: {},
      parentId: 'main_layout',
      position: { col: 2, row: 2 },
      colSpan: {
        login: 6,
        register: 6
      },
      viewMode: ['login', 'register'],
      metadata: { hierarchical: true }
    },

    // Register form
    register_form: {
      id: 'register_form',
      type: 'component',
      component: 'RegisterFormSlot',
      content: `
        <form class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" required class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Enter your first name" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" required class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Enter your last name" />
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
            <input type="password" required class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Confirm your password" />
          </div>
          <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-md">
            Create My Account
          </button>
        </form>
      `,
      className: '',
      styles: {},
      parentId: 'register_form_container',
      position: { col: 1, row: 1 },
      viewMode: ['login', 'register'],
      metadata: { hierarchical: true }
    },

    // Social login section
    social_login: {
      id: 'social_login',
      type: 'container',
      content: `
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          <div class="mt-6 grid grid-cols-2 gap-3">
            <button class="w-full border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50">
              Google
            </button>
            <button class="w-full border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50">
              Facebook
            </button>
          </div>
        </div>
      `,
      className: '',
      styles: {},
      parentId: 'main_layout',
      position: { col: 1, row: 3 },
      colSpan: {
        login: 12,
        register: 12
      },
      viewMode: ['login', 'register'],
      metadata: { hierarchical: true }
    },

    // Footer
    login_footer: {
      id: 'login_footer',
      type: 'text',
      content: 'By signing in, you agree to our Terms of Service and Privacy Policy',
      className: 'text-center text-sm text-gray-600 mt-8',
      styles: {},
      parentId: 'main_layout',
      position: { col: 1, row: 4 },
      colSpan: {
        login: 12,
        register: 12
      },
      viewMode: ['login', 'register'],
      metadata: { hierarchical: true }
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
