import { Menu, Search, User, ShoppingCart, Globe } from 'lucide-react';

// Header Configuration - Slot-based layout for header and navigation
export const headerConfig = {
  page_name: 'Header',
  slot_type: 'header_layout',

  // Main header slots
  slots: {
    // Main header container
    header_main: {
      id: 'header_main',
      type: 'container',
      content: '',
      className: 'bg-white shadow-md sticky top-0 z-40',
      parentClassName: '',
      styles: {
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: '0',
        zIndex: '40'
      },
      parentId: null,
      position: { col: 1, row: 1 },
      colSpan: { mobile: 12, desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Main Header Container',
        description: 'Top-level header wrapper with sticky positioning',
        editorSidebar: 'HeaderEditorSidebar'
      }
    },

    // Header inner container (max-width wrapper)
    header_inner: {
      id: 'header_inner',
      type: 'container',
      content: '',
      className: 'max-w-7xl mx-auto px-2 md:px-4 lg:px-8',
      parentClassName: '',
      styles: {},
      parentId: 'header_main',
      position: { col: 1, row: 1 },
      colSpan: { mobile: 12, desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Header Inner Container',
        editorSidebar: 'HeaderEditorSidebar'
      }
    },

    // Top row - logo, search, actions
    header_top_row: {
      id: 'header_top_row',
      type: 'container',
      content: '',
      className: 'flex items-center justify-between h-16',
      parentClassName: 'w-full',
      styles: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '4rem'
      },
      parentId: 'header_inner',
      position: { col: 1, row: 1 },
      colSpan: { mobile: 12, desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Header Top Row',
        editorSidebar: 'HeaderEditorSidebar'
      }
    },

    // === LEFT SECTION: LOGO ===
    logo_section: {
      id: 'logo_section',
      type: 'container',
      content: '',
      className: 'flex items-center',
      parentClassName: '',
      styles: {},
      parentId: 'header_top_row',
      position: { col: 1, row: 1 },
      colSpan: { mobile: 6, desktop: 3 },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Logo Section',
        editorSidebar: 'HeaderEditorSidebar'
      }
    },

    store_logo: {
      id: 'store_logo',
      type: 'component',
      component: 'StoreLogo',
      content: `
        <a href="{{store.url}}" class="flex items-center space-x-1 md:space-x-2">
          {{#if store.logo_url}}
            <img src="{{store.logo_url}}" alt="{{store.name}}" class="h-6 md:h-8 w-6 md:w-8 object-contain" />
          {{else}}
            <svg class="h-6 md:h-8 w-6 md:w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          {{/if}}
          <span class="text-base md:text-xl font-bold text-gray-800 truncate">{{store.name}}</span>
        </a>
      `,
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'logo_section',
      position: { col: 1, row: 1 },
      colSpan: { mobile: 12, desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        displayName: 'Store Logo & Name',
        component: 'StoreLogo',
        editorSidebar: 'HeaderEditorSidebar'
      }
    },

    // Logo styling configuration
    logo_styles: {
      id: 'logo_styles',
      type: 'style_config',
      content: '',
      className: '',
      parentClassName: '',
      styles: {
        logoHeight: '2rem',
        logoWidth: '2rem',
        storeName: {
          fontSize: '1.25rem',
          fontWeight: '700',
          color: '#1F2937'
        },
        iconColor: '#2563EB'
      },
      parentId: 'store_logo',
      position: { col: 1, row: 1 },
      colSpan: { mobile: 12, desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Logo Styling',
        labelType: 'styling',
        customizable: ['logoHeight', 'logoWidth', 'storeName', 'iconColor']
      }
    },

    // === CENTER SECTION: SEARCH ===
    search_section: {
      id: 'search_section',
      type: 'container',
      content: '',
      className: 'hidden md:flex flex-1 justify-center px-8',
      parentClassName: '',
      styles: {},
      parentId: 'header_top_row',
      position: { col: 4, row: 1 },
      colSpan: { desktop: 6 },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Search Section (Desktop)',
        description: 'Hidden on mobile, visible on desktop',
        editorSidebar: 'HeaderEditorSidebar'
      }
    },

    search_bar: {
      id: 'search_bar',
      type: 'component',
      component: 'HeaderSearch',
      content: '',
      className: 'w-full',
      parentClassName: '',
      styles: {},
      parentId: 'search_section',
      position: { col: 1, row: 1 },
      colSpan: { desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        displayName: 'Search Bar Component',
        component: 'HeaderSearch'
      }
    },

    // Search bar visibility control
    search_visibility: {
      id: 'search_visibility',
      type: 'style_config',
      content: '',
      className: '',
      parentClassName: '',
      styles: {
        hideOnCart: false,
        hideOnCheckout: false
      },
      parentId: 'search_section',
      position: { col: 1, row: 2 },
      colSpan: { mobile: 12, desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Search Visibility Settings',
        labelType: 'settings',
        customizable: ['hideOnCart', 'hideOnCheckout', 'showPermanentMobile']
      }
    },

    // === RIGHT SECTION: ACTIONS ===
    actions_section: {
      id: 'actions_section',
      type: 'container',
      content: '',
      className: 'flex items-center space-x-1 md:space-x-2',
      parentClassName: '',
      styles: {},
      parentId: 'header_top_row',
      position: { col: 10, row: 1 },
      colSpan: { mobile: 6, desktop: 3 },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Actions Section (Cart, User, Menu)',
        editorSidebar: 'HeaderEditorSidebar'
      }
    },

    // Mobile actions (search button, user, wishlist)
    mobile_actions: {
      id: 'mobile_actions',
      type: 'container',
      content: '',
      className: 'flex items-center space-x-1 md:hidden',
      parentClassName: '',
      styles: {},
      parentId: 'actions_section',
      position: { col: 1, row: 1 },
      colSpan: { mobile: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Mobile Actions Container',
        note: 'Shows in editor for both views but only on mobile in storefront via md:hidden'
      }
    },

    mobile_search_toggle: {
      id: 'mobile_search_toggle',
      type: 'component',
      component: 'MobileSearchToggle',
      content: `
        <button class="p-2 hover:bg-gray-100 rounded-full" data-action="toggle-mobile-search">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </button>
      `,
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'mobile_actions',
      position: { col: 1, row: 1 },
      colSpan: { mobile: 4 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        displayName: 'Mobile Search Toggle Button',
        component: 'MobileSearchToggle'
      }
    },

    mobile_user_menu: {
      id: 'mobile_user_menu',
      type: 'component',
      component: 'MobileUserMenu',
      content: `
        <button class="p-2 hover:bg-gray-100 rounded-full" data-action="toggle-user-menu">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </button>
      `,
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'mobile_actions',
      position: { col: 2, row: 1 },
      colSpan: { mobile: 4 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        displayName: 'Mobile User Menu Button',
        component: 'MobileUserMenu'
      }
    },

    mobile_wishlist: {
      id: 'mobile_wishlist',
      type: 'component',
      component: 'WishlistDropdown',
      content: '',
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'mobile_actions',
      position: { col: 3, row: 1 },
      colSpan: { mobile: 4 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        displayName: 'Mobile Wishlist',
        component: 'WishlistDropdown'
      }
    },

    // Desktop actions (language, country, user, wishlist)
    desktop_actions: {
      id: 'desktop_actions',
      type: 'container',
      content: '',
      className: 'hidden md:flex items-center space-x-3',
      parentClassName: '',
      styles: {},
      parentId: 'actions_section',
      position: { col: 1, row: 1 },
      colSpan: { desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Desktop Actions Container'
      }
    },

    language_selector: {
      id: 'language_selector',
      type: 'component',
      component: 'LanguageSelector',
      content: `
        {{#if languages.length}}
          <select class="border-none bg-transparent text-sm" data-action="change-language">
            {{#each languages}}
              <option value="{{this.code}}" {{#if this.active}}selected{{/if}}>
                {{this.flag}} {{this.name}}
              </option>
            {{/each}}
          </select>
        {{/if}}
      `,
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'desktop_actions',
      position: { col: 1, row: 1 },
      colSpan: { desktop: 3 },
      viewMode: ['default'],
      renderCondition: (context) => context?.settings?.show_language_selector === true,
      metadata: {
        hierarchical: false,
        displayName: 'Language Selector',
        component: 'LanguageSelector'
      }
    },

    country_selector: {
      id: 'country_selector',
      type: 'component',
      component: 'CountrySelect',
      content: '',
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'desktop_actions',
      position: { col: 2, row: 1 },
      colSpan: { desktop: 3 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        displayName: 'Country Selector',
        component: 'CountrySelect'
      }
    },

    user_account_menu: {
      id: 'user_account_menu',
      type: 'component',
      component: 'UserAccountMenu',
      content: `
        {{#if user}}
          <button class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white" data-action="toggle-user-dropdown">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span>{{user.name}}</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        {{else}}
          <button class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white" data-action="navigate-login">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span>{{t "sign_in"}}</span>
          </button>
        {{/if}}
      `,
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'desktop_actions',
      position: { col: 3, row: 1 },
      colSpan: { desktop: 3 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        displayName: 'User Account Menu',
        component: 'UserAccountMenu'
      }
    },

    // User menu button styling
    user_menu_styles: {
      id: 'user_menu_styles',
      type: 'style_config',
      content: '',
      className: '',
      parentClassName: '',
      styles: {
        backgroundColor: '#2563EB',
        hoverBackgroundColor: '#1D4ED8',
        textColor: '#ffffff',
        borderRadius: '0.5rem',
        padding: '0.5rem 1rem'
      },
      parentId: 'user_account_menu',
      position: { col: 1, row: 1 },
      colSpan: { mobile: 12, desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'User Menu Button Styling',
        labelType: 'styling',
        customizable: ['backgroundColor', 'hoverBackgroundColor', 'textColor', 'borderRadius', 'padding']
      }
    },

    desktop_wishlist: {
      id: 'desktop_wishlist',
      type: 'component',
      component: 'WishlistDropdown',
      content: '',
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'desktop_actions',
      position: { col: 4, row: 1 },
      colSpan: { desktop: 3 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        displayName: 'Desktop Wishlist',
        component: 'WishlistDropdown'
      }
    },

    // Cart icon (both mobile and desktop)
    cart_icon: {
      id: 'cart_icon',
      type: 'component',
      component: 'MiniCart',
      content: '',
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'actions_section',
      position: { col: 2, row: 1 },
      colSpan: { mobile: 12, desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        displayName: 'Shopping Cart Icon',
        component: 'MiniCart'
      }
    },

    // Cart visibility settings
    cart_visibility: {
      id: 'cart_visibility',
      type: 'style_config',
      content: '',
      className: '',
      parentClassName: '',
      styles: {
        hideOnCart: false,
        hideOnCheckout: false
      },
      parentId: 'cart_icon',
      position: { col: 1, row: 1 },
      colSpan: { mobile: 12, desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Cart Visibility Settings',
        labelType: 'settings',
        customizable: ['hideOnCart', 'hideOnCheckout']
      }
    },

    // Mobile menu toggle button
    mobile_menu_toggle: {
      id: 'mobile_menu_toggle',
      type: 'component',
      component: 'MobileMenuToggle',
      content: `
        <button class="p-2 hover:bg-gray-100 rounded-full" data-action="toggle-mobile-menu">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      `,
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'actions_section',
      position: { col: 3, row: 1 },
      colSpan: { mobile: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        displayName: 'Mobile Menu Toggle',
        component: 'MobileMenuToggle',
        note: 'Visibility controlled by viewMode filter, not CSS media queries'
      }
    },

    // === MOBILE SEARCH BAR (COLLAPSIBLE) ===
    mobile_search_bar: {
      id: 'mobile_search_bar',
      type: 'container',
      content: '',
      className: 'md:hidden border-t border-gray-200 bg-white px-2 py-3',
      parentClassName: '',
      styles: {},
      parentId: 'header_inner',
      position: { col: 1, row: 2 },
      colSpan: { mobile: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Mobile Search Bar (Collapsible)',
        description: 'Shown when search toggle is clicked (always visible in editor)'
      }
    },

    mobile_search_component: {
      id: 'mobile_search_component',
      type: 'component',
      component: 'HeaderSearch',
      content: '',
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'mobile_search_bar',
      position: { col: 1, row: 1 },
      colSpan: { mobile: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        displayName: 'Mobile Search Component',
        component: 'HeaderSearch'
      }
    },

    // === MOBILE MENU (COLLAPSIBLE) ===
    mobile_menu: {
      id: 'mobile_menu',
      type: 'container',
      content: '',
      className: 'md:hidden border-t border-gray-200',
      parentClassName: '',
      styles: {
        backgroundColor: '#ffffff'
      },
      parentId: 'header_inner',
      position: { col: 1, row: 3 },
      colSpan: { mobile: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Mobile Menu (Collapsible)',
        description: 'Shown when hamburger menu is clicked (always visible in editor)',
        editorSidebar: 'HeaderEditorSidebar'
      }
    },

    mobile_menu_inner: {
      id: 'mobile_menu_inner',
      type: 'container',
      content: '',
      className: 'py-3 space-y-2',
      parentClassName: '',
      styles: {},
      parentId: 'mobile_menu',
      position: { col: 1, row: 1 },
      colSpan: { mobile: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Mobile Menu Inner Container',
        editorSidebar: 'HeaderEditorSidebar'
      }
    },

    mobile_navigation: {
      id: 'mobile_navigation',
      type: 'component',
      component: 'MobileNavigation',
      content: `
        {{#each categories}}
          <div class="mobile-nav-item">
            <a href="{{this.url}}" class="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-md">
              {{this.name}}
            </a>
            {{#if this.children}}
              <div class="pl-4">
                {{#each this.children}}
                  <a href="{{this.url}}" class="block py-2 px-3 text-gray-600 hover:bg-gray-100 rounded-md text-sm">
                    {{this.name}}
                  </a>
                {{/each}}
              </div>
            {{/if}}
          </div>
        {{/each}}
      `,
      className: '',
      parentClassName: '',
      styles: {
        color: '#374151',
        hoverColor: '#111827',
        hoverBackgroundColor: '#f3f4f6'
      },
      parentId: 'mobile_menu_inner',
      position: { col: 1, row: 1 },
      colSpan: { mobile: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        displayName: 'Mobile Navigation Menu',
        component: 'MobileNavigation',
        editorSidebar: 'HeaderEditorSidebar'
      }
    },

    mobile_menu_language: {
      id: 'mobile_menu_language',
      type: 'component',
      component: 'LanguageSelector',
      content: '',
      className: 'pt-3 mt-3 border-t border-gray-200',
      parentClassName: '',
      styles: {},
      parentId: 'mobile_menu_inner',
      position: { col: 1, row: 2 },
      colSpan: { mobile: 12 },
      viewMode: ['default'],
      renderCondition: (context) => context?.settings?.show_language_selector === true,
      metadata: {
        hierarchical: false,
        displayName: 'Mobile Menu Language Selector',
        component: 'LanguageSelector'
      }
    },

    mobile_menu_country: {
      id: 'mobile_menu_country',
      type: 'component',
      component: 'CountrySelect',
      content: '',
      className: 'pt-3 mt-3 border-t border-gray-200',
      parentClassName: '',
      styles: {},
      parentId: 'mobile_menu_inner',
      position: { col: 1, row: 3 },
      colSpan: { mobile: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        displayName: 'Mobile Menu Country Selector',
        component: 'CountrySelect'
      }
    },

    // === NAVIGATION BAR (DESKTOP) ===
    navigation_bar: {
      id: 'navigation_bar',
      type: 'container',
      content: '',
      className: 'hidden md:block bg-gray-50 border-b border-gray-200',
      parentClassName: '',
      styles: {
        backgroundColor: '#F9FAFB',
        borderBottom: '1px solid #E5E7EB'
      },
      parentId: null,
      position: { col: 1, row: 2 },
      colSpan: { desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Navigation Bar (Desktop)',
        description: 'Main navigation menu below header (hidden on mobile)',
        editorSidebar: 'HeaderEditorSidebar'
      }
    },

    navigation_inner: {
      id: 'navigation_inner',
      type: 'container',
      content: '',
      className: 'max-w-7xl mx-auto px-2 md:px-4 lg:px-8',
      parentClassName: '',
      styles: {},
      parentId: 'navigation_bar',
      position: { col: 1, row: 1 },
      colSpan: { desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Navigation Inner Container',
        editorSidebar: 'HeaderEditorSidebar'
      }
    },

    navigation_content: {
      id: 'navigation_content',
      type: 'container',
      content: '',
      className: 'flex justify-center py-3',
      parentClassName: '',
      styles: {},
      parentId: 'navigation_inner',
      position: { col: 1, row: 1 },
      colSpan: { desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Navigation Content Wrapper',
        editorSidebar: 'HeaderEditorSidebar'
      }
    },

    category_navigation: {
      id: 'category_navigation',
      type: 'component',
      component: 'CategoryNav',
      content: '',
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'navigation_content',
      position: { col: 1, row: 1 },
      colSpan: { desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        displayName: 'Category Navigation',
        component: 'CategoryNav',
        description: 'Main category navigation menu',
        editorSidebar: 'HeaderEditorSidebar'
      }
    },

    // Navigation styling configuration
    navigation_styles: {
      id: 'navigation_styles',
      type: 'style_config',
      content: '',
      className: '',
      parentClassName: '',
      styles: {
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB',
        linkColor: '#374151',
        linkHoverColor: '#2563EB',
        linkFontSize: '0.875rem',
        linkFontWeight: '500',
        padding: '0.75rem 0'
      },
      parentId: 'navigation_bar',
      position: { col: 1, row: 2 },
      colSpan: { mobile: 12, desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Navigation Bar Styling',
        labelType: 'styling',
        customizable: ['backgroundColor', 'borderColor', 'linkColor', 'linkHoverColor', 'linkFontSize', 'linkFontWeight', 'padding']
      }
    },

    // Navigation visibility settings
    navigation_visibility: {
      id: 'navigation_visibility',
      type: 'style_config',
      content: '',
      className: '',
      parentClassName: '',
      styles: {
        hideOnMobile: false,
        expandAllMenuItems: false,
        showOnHover: true
      },
      parentId: 'navigation_bar',
      position: { col: 1, row: 3 },
      colSpan: { mobile: 12, desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Navigation Visibility Settings',
        labelType: 'settings',
        customizable: ['hideOnMobile', 'expandAllMenuItems', 'showOnHover']
      }
    },

    // === CMS BLOCKS ===
    header_top_cms: {
      id: 'header_top_cms',
      type: 'component',
      component: 'CmsBlockRenderer',
      content: '',
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'header_main',
      position: { col: 1, row: 0 },
      colSpan: { mobile: 12, desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        cmsPosition: 'header_top',
        displayName: 'CMS Block - Above Header',
        component: 'CmsBlockRenderer',
        props: {
          position: 'header_top'
        }
      }
    },

    header_bottom_cms: {
      id: 'header_bottom_cms',
      type: 'component',
      component: 'CmsBlockRenderer',
      content: '',
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'navigation_bar',
      position: { col: 1, row: 2 },
      colSpan: { mobile: 12, desktop: 12 },
      viewMode: ['default'],
      metadata: {
        hierarchical: false,
        cmsPosition: 'header_bottom',
        displayName: 'CMS Block - Below Navigation',
        component: 'CmsBlockRenderer',
        props: {
          position: 'header_bottom'
        }
      }
    }
  },

  // View configuration
  views: [
    { id: 'default', label: 'Header Layout', icon: Menu }
  ],

  // CMS blocks for additional content areas
  cmsBlocks: [
    'header_top',
    'header_middle',
    'header_bottom',
    'navigation_before',
    'navigation_after'
  ],

  // Microslot definitions
  microslots: {
    store_logo: {
      type: 'logo',
      editable: true,
      dataBinding: 'store.logo_url',
      fallback: 'Default Logo Icon'
    },
    store_name: {
      type: 'text',
      editable: true,
      dataBinding: 'store.name',
      fallback: 'Store Name'
    },
    search_bar: {
      type: 'search',
      editable: true,
      placeholder: 'Search products...'
    },
    user_name: {
      type: 'text',
      editable: true,
      dataBinding: 'user.name',
      fallback: 'Sign In'
    },
    cart_count: {
      type: 'badge',
      editable: true,
      dataBinding: 'cart.item_count',
      fallback: '0'
    }
  }
};

export default headerConfig;
