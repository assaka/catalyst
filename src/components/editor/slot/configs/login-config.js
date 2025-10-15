import { LogIn, UserPlus } from 'lucide-react';

// Login Page Configuration - 2 Column Layout
export const loginConfig = {
  page_name: 'Login',
  slot_type: 'login_layout',

  // Slot layout definition
  slotLayout: {
    page_header: { name: 'Page Header', colSpan: 12, order: 0 },
    login_column: { name: 'Login Column', colSpan: 6, order: 1 },
    register_column: { name: 'Register Column', colSpan: 6, order: 2 },
    login_footer: { name: 'Login Footer', colSpan: 12, order: 3 }
  },

  // Slot configuration with hierarchical 2-column layout
  slots: {
    // Main container
    main_layout: {
      id: 'main_layout',
      type: 'grid',
      content: '',
      className: 'grid grid-cols-12 gap-8 max-w-7xl mx-auto px-4 py-8',
      styles: {},
      parentId: null,
      layout: 'grid',
      gridCols: 12,
      colSpan: 12,
      metadata: { hierarchical: true }
    },

    // Page header/banner
    page_header: {
      id: 'page_header',
      type: 'text',
      content: '{{t "common.welcome_back"}}',
      className: 'text-3xl font-bold text-center text-gray-900',
      styles: { paddingTop: '2rem', paddingBottom: '2rem', gridColumn: '1 / -1' },
      parentId: 'main_layout',
      position: { col: 1, row: 1 },
      colSpan: 12,
      metadata: { hierarchical: true }
    },

    // Login column - left side
    login_column: {
      id: 'login_column',
      type: 'container',
      content: '',
      className: 'bg-white',
      styles: { padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
      parentId: 'main_layout',
      position: { col: 1, row: 2 },
      colSpan: 'col-span-12 md:col-span-6',
      metadata: { hierarchical: true }
    },

    login_title: {
      id: 'login_title',
      type: 'text',
      content: '{{t "common.already_registered_login"}}',
      className: 'text-2xl font-bold text-gray-900',
      styles: { marginBottom: '10px' },
      parentId: 'login_column',
      position: { col: 1, row: 1 },
      colSpan: 12,
      metadata: { hierarchical: true }
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
      parentId: 'login_column',
      position: { col: 1, row: 2 },
      colSpan: 12,
      metadata: { hierarchical: true }
    },

    // Register column - right side
    register_column: {
      id: 'register_column',
      type: 'container',
      content: '',
      className: 'bg-white',
      styles: { padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
      parentId: 'main_layout',
      position: { col: 2, row: 2 },
      colSpan: 'col-span-12 md:col-span-6',
      metadata: { hierarchical: true }
    },

    register_title: {
      id: 'register_title',
      type: 'text',
      content: '{{t "common.create_account"}}',
      className: 'text-2xl font-bold text-gray-900',
      styles: { marginBottom: '20px' },
      parentId: 'register_column',
      position: { col: 1, row: 1 },
      colSpan: 12,
      metadata: { hierarchical: true }
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
      parentId: 'register_column',
      position: { col: 1, row: 2 },
      colSpan: 12,
      metadata: { hierarchical: true }
    },

    // Footer section
    login_footer: {
      id: 'login_footer',
      type: 'text',
      content: '{{t "common.terms_agreement"}}',
      className: 'text-center text-sm text-gray-600',
      parentClassName: 'text-center',
      styles: { paddingTop: '20px', paddingBottom: '20px', gridColumn: '1 / -1' },
      parentId: 'main_layout',
      position: { col: 1, row: 3 },
      colSpan: 12,
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
