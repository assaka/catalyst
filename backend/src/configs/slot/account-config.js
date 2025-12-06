// Account Page Configuration - Sidebar Layout
// Backend version - CommonJS format

const accountConfig = {
  page_name: 'Account',
  slot_type: 'account_layout',

  slotLayout: {
    account_header: { name: 'Account Header', colSpan: 12, order: 0 },
    account_cms_above: { name: 'CMS Above Content', colSpan: 12, order: 1 },
    account_sidebar: { name: 'Account Sidebar', colSpan: 3, order: 2 },
    account_content: { name: 'Account Content', colSpan: 9, order: 3 },
    account_cms_below: { name: 'CMS Below Content', colSpan: 12, order: 4 },
    account_footer: { name: 'Account Footer', colSpan: 12, order: 5 }
  },

  slots: {
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
      content: '{{t "account.my_account"}}',
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

    account_cms_above: {
      id: 'account_cms_above',
      type: 'cms',
      content: '',
      className: 'mb-6',
      styles: {},
      viewMode: ['overview', 'profile', 'intro'],
      cmsBlockPosition: 'account_cms_above'
    },

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
      content: '',
      className: '',
      styles: {},
      viewMode: ['overview', 'profile']
    },

    navigation_menu: {
      id: 'navigation_menu',
      type: 'component',
      component: 'NavigationMenuSlot',
      content: '',
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
      content: '',
      className: '',
      styles: {},
      viewMode: ['overview']
    },

    recent_orders: {
      id: 'recent_orders',
      type: 'component',
      component: 'RecentOrdersSlot',
      content: '',
      className: '',
      styles: {},
      viewMode: ['overview']
    },

    profile_section: {
      id: 'profile_section',
      type: 'component',
      component: 'ProfileFormSlot',
      content: '',
      className: '',
      styles: {},
      viewMode: ['profile']
    },

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

    intro_hero: {
      id: 'intro_hero',
      type: 'component',
      component: 'AccountIntroHeroSlot',
      content: '',
      className: '',
      styles: {},
      viewMode: ['intro']
    },

    intro_benefits: {
      id: 'intro_benefits',
      type: 'component',
      component: 'AccountBenefitsSlot',
      content: '',
      className: '',
      styles: {},
      viewMode: ['intro']
    },

    intro_cta: {
      id: 'intro_cta',
      type: 'component',
      component: 'AccountCTASlot',
      content: '',
      className: '',
      styles: {},
      viewMode: ['intro']
    }
  },

  metadata: {
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0',
    pageType: 'account'
  },

  views: [
    { id: 'overview', label: 'Account Overview', icon: null },
    { id: 'profile', label: 'Profile View', icon: null },
    { id: 'intro', label: 'Account Intro (Not Logged In)', icon: null }
  ],

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

module.exports = { accountConfig };
