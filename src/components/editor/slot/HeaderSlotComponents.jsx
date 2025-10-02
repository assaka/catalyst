/**
 * Header Slot Components
 * Register header-specific slot components with the unified registry
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { createSlotComponent, registerSlotComponent } from './SlotComponentRegistry';
import { createPublicUrl } from '@/utils/urlUtils';
import { ShoppingBag, Search, User, Menu, Globe, ChevronDown, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeaderSearch from '@/components/storefront/HeaderSearch';
import MiniCart from '@/components/storefront/MiniCart';
import WishlistDropdown from '@/components/storefront/WishlistDropdown';
import CategoryNav from '@/components/storefront/CategoryNav';
import { CountrySelect } from '@/components/ui/country-select';

/**
 * StoreLogo Component
 */
const StoreLogo = createSlotComponent({
  name: 'StoreLogo',
  render: ({ slot, context, headerContext, className, styles }) => {
    const { store } = headerContext || {};
    const storeUrl = store ? createPublicUrl(store.slug, 'STOREFRONT') : '/';

    // Use same rendering for both editor and storefront
    const content = (
      <>
        {store?.logo_url ? (
          <img src={store.logo_url} alt={store.name} className="h-8 w-8 object-contain" />
        ) : (
          <ShoppingBag className="h-8 w-8 text-blue-600" />
        )}
        <span className="text-xl font-bold text-gray-800" style={{ color: styles?.color, fontSize: styles?.fontSize, fontWeight: styles?.fontWeight }}>
          {store?.name || 'Demo Store'}
        </span>
      </>
    );

    if (context === 'editor') {
      return (
        <div className={className || "flex items-center space-x-2"} style={styles}>
          {content}
        </div>
      );
    }

    // Storefront rendering with link
    return (
      <Link to={storeUrl} className={className || "flex items-center space-x-2"} style={styles}>
        {content}
      </Link>
    );
  }
});

/**
 * HeaderSearch Component
 */
const HeaderSearchSlot = createSlotComponent({
  name: 'HeaderSearch',
  render: ({ slot, context, headerContext, className, styles }) => {
    const { settings = {} } = headerContext || {};

    if (context === 'editor') {
      // Extract input-specific styles to match storefront exactly
      const inputStyles = {
        backgroundColor: styles?.backgroundColor || '#ffffff',
        borderColor: styles?.borderColor || '#d1d5db',
        borderRadius: styles?.borderRadius || '0.5rem',
        borderWidth: '1px',
        borderStyle: 'solid'
      };

      return (
        <div className={className || "w-full max-w-lg"}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-12 py-2 w-full focus:outline-none focus:border-blue-500"
              style={inputStyles}
              disabled
            />
          </div>
        </div>
      );
    }

    // Storefront rendering
    if (settings.hide_header_search) return null;

    return (
      <div className={className} style={styles}>
        <HeaderSearch styles={styles} />
      </div>
    );
  }
});

/**
 * MiniCart Component
 */
const MiniCartSlot = createSlotComponent({
  name: 'MiniCart',
  render: ({ slot, context, headerContext, className, styles }) => {
    const { settings = {} } = headerContext || {};

    if (context === 'editor') {
      return (
        <div className={className || "relative"} style={styles}>
          <button className="relative p-2 text-gray-700 hover:text-gray-900">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              0
            </span>
          </button>
        </div>
      );
    }

    // Storefront rendering
    if (settings.hide_header_cart) return null;

    return (
      <div className={className} style={styles}>
        <MiniCart />
      </div>
    );
  }
});

/**
 * WishlistDropdown Component
 */
const WishlistDropdownSlot = createSlotComponent({
  name: 'WishlistDropdown',
  render: ({ slot, context, headerContext, className, styles }) => {
    if (context === 'editor') {
      return (
        <div className={className} style={styles}>
          <button className="relative p-2 text-gray-700 hover:text-gray-900">
            <Heart className="w-6 h-6" />
          </button>
        </div>
      );
    }

    // Storefront rendering
    return (
      <div className={className} style={styles}>
        <WishlistDropdown />
      </div>
    );
  }
});

/**
 * CategoryNav Component
 */
const CategoryNavSlot = createSlotComponent({
  name: 'CategoryNav',
  render: ({ slot, context, headerContext, className, styles }) => {
    const { categories = [], store } = headerContext || {};
    const metadata = slot?.metadata || {};

    // Extract link styles
    const linkColor = styles?.color || '#374151';
    const linkHoverColor = styles?.hoverColor || '#2563EB';
    const linkFontSize = styles?.fontSize || '0.875rem';
    const linkFontWeight = styles?.fontWeight || '500';

    if (context === 'editor') {
      // Use actual CategoryNav component in editor for interactive dropdowns
      return (
        <div className={className} style={styles}>
          <CategoryNav categories={categories} styles={styles} metadata={metadata} store={store} />
        </div>
      );
    }

    // Storefront rendering
    return (
      <div className={className} style={styles}>
        <CategoryNav categories={categories} styles={styles} metadata={metadata} />
      </div>
    );
  }
});

/**
 * UserMenu Component - Simple icon-based user menu
 */
const UserMenuSlot = createSlotComponent({
  name: 'UserMenu',
  render: ({ slot, context, headerContext, className, styles }) => {
    const { user, userLoading, handleCustomerLogout } = headerContext || {};

    if (context === 'editor') {
      return (
        <div className={className} style={styles}>
          <button className="p-2 text-gray-700 hover:text-gray-900">
            <User className="w-6 h-6" />
          </button>
        </div>
      );
    }

    // Storefront rendering
    if (userLoading) {
      return (
        <div className={className || "p-2"} style={styles}>
          <User className="w-6 h-6 text-gray-400 animate-pulse" />
        </div>
      );
    }

    if (user) {
      return (
        <div className={className || "relative group"} style={styles}>
          <button className="flex items-center p-2 text-gray-700 hover:text-gray-900">
            <User className="w-6 h-6" />
            <ChevronDown className="w-4 h-4 ml-1" />
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <div className="p-2">
              <div className="px-3 py-2 text-sm text-gray-700">{user.email}</div>
              <hr className="my-2" />
              <button
                onClick={handleCustomerLogout}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link to="/customer/login" className={className || "p-2 text-gray-700 hover:text-gray-900"} style={styles}>
        <User className="w-6 h-6" />
      </Link>
    );
  }
});

/**
 * UserAccountMenu Component - Button-based user account menu (for desktop)
 */
const UserAccountMenuSlot = createSlotComponent({
  name: 'UserAccountMenu',
  render: ({ slot, context, headerContext, className, styles }) => {
    const { user, userLoading, handleCustomerLogout, store, navigate } = headerContext || {};

    const buttonStyles = {
      backgroundColor: styles?.backgroundColor || '#2563EB',
      color: styles?.color || '#ffffff',
      borderRadius: styles?.borderRadius || '0.5rem',
      padding: styles?.padding || '0.5rem 1rem'
    };

    const hoverBg = styles?.hoverBackgroundColor || '#1D4ED8';

    if (context === 'editor') {
      return (
        <div className={className} style={styles}>
          <Button
            size="sm"
            className="px-4 py-2 flex items-center space-x-2"
            style={buttonStyles}
          >
            <User className="w-4 h-4" />
            <span>Sign In</span>
          </Button>
        </div>
      );
    }

    // Storefront rendering
    if (user) {
      return (
        <div className={className} style={styles}>
          <Button
            size="sm"
            className="px-4 py-2 flex items-center space-x-1"
            style={buttonStyles}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor}
          >
            <User className="w-4 h-4" />
            <span>{user.first_name || user.name || user.email}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className={className} style={styles}>
        <Button
          onClick={() => {
            localStorage.setItem('customer_auth_store_id', store?.id);
            localStorage.setItem('customer_auth_store_code', store?.slug);
            navigate?.(createPublicUrl(store?.slug, 'CUSTOMER_AUTH'));
          }}
          disabled={userLoading}
          className="px-4 py-2 flex items-center space-x-2"
          style={buttonStyles}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor}
        >
          <User className="w-5 h-5 mr-2" />
          <span>Sign In</span>
        </Button>
      </div>
    );
  }
});

/**
 * LanguageSelector Component
 */
const LanguageSelectorSlot = createSlotComponent({
  name: 'LanguageSelector',
  render: ({ slot, context, headerContext, className, styles }) => {
    const { languages = [], currentLanguage, setCurrentLanguage } = headerContext || {};

    if (context === 'editor') {
      return (
        <div className={className || "flex items-center space-x-2"} style={styles}>
          <Globe className="w-5 h-5 text-gray-600" />
          <select className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 cursor-pointer focus:outline-none focus:border-blue-500">
            <option>🇺🇸 English</option>
            <option>🇪🇸 Español</option>
          </select>
        </div>
      );
    }

    // Storefront rendering
    if (languages.length <= 1) return null;

    return (
      <div className={className || "flex items-center space-x-2"} style={styles}>
        <Globe className="w-5 h-5 text-gray-600" />
        <select
          value={currentLanguage}
          onChange={(e) => setCurrentLanguage?.(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 cursor-pointer focus:outline-none focus:border-blue-500"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.flag_icon} {lang.name}
            </option>
          ))}
        </select>
      </div>
    );
  }
});

/**
 * CountrySelector Component
 */
const CountrySelectorSlot = createSlotComponent({
  name: 'CountrySelector',
  render: ({ slot, context, headerContext }) => {
    const { settings = {}, selectedCountry, setSelectedCountry } = headerContext || {};
    const allowedCountries = settings.allowed_countries || ['US', 'CA', 'UK'];

    if (context === 'editor') {
      return (
        <div className="text-sm text-gray-600">
          <Globe className="w-4 h-4 inline mr-1" />
          US
        </div>
      );
    }

    // Storefront rendering
    return (
      <CountrySelect
        value={selectedCountry}
        onChange={setSelectedCountry}
        allowedCountries={allowedCountries}
      />
    );
  }
});

/**
 * MobileMenuButton Component
 */
const MobileMenuButtonSlot = createSlotComponent({
  name: 'MobileMenuButton',
  render: ({ slot, context, headerContext }) => {
    const { mobileMenuOpen, setMobileMenuOpen } = headerContext || {};

    if (context === 'editor') {
      return (
        <button className="p-2 text-gray-700 hover:text-gray-900 md:hidden">
          <Menu className="w-6 h-6" />
        </button>
      );
    }

    // Storefront rendering
    return (
      <button
        onClick={() => setMobileMenuOpen?.(!mobileMenuOpen)}
        className="p-2 text-gray-700 hover:text-gray-900 md:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>
    );
  }
});

/**
 * MobileSearchButton Component
 */
const MobileSearchButtonSlot = createSlotComponent({
  name: 'MobileSearchButton',
  render: ({ slot, context, headerContext }) => {
    const { mobileSearchOpen, setMobileSearchOpen } = headerContext || {};

    if (context === 'editor') {
      return (
        <button className="p-2 text-gray-700 hover:text-gray-900 md:hidden">
          <Search className="w-6 h-6" />
        </button>
      );
    }

    // Storefront rendering
    return (
      <button
        onClick={() => setMobileSearchOpen?.(!mobileSearchOpen)}
        className="p-2 text-gray-700 hover:text-gray-900 md:hidden"
      >
        <Search className="w-6 h-6" />
      </button>
    );
  }
});

// Create aliases for mobile components with correct names
const MobileSearchToggleSlot = MobileSearchButtonSlot;
const MobileMenuToggleSlot = MobileMenuButtonSlot;

// MobileUserMenu - Icon button for mobile user menu
const MobileUserMenuSlot = createSlotComponent({
  name: 'MobileUserMenu',
  render: ({ slot, context, headerContext, className, styles }) => {
    const { user, userLoading, store, navigate } = headerContext || {};

    if (context === 'editor') {
      return (
        <div className={className} style={styles}>
          <Button variant="ghost" size="icon">
            <User className="w-5 h-5" />
          </Button>
        </div>
      );
    }

    // Storefront rendering
    return (
      <div className={className} style={styles}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (user) {
              // Show dropdown or navigate to account
            } else {
              localStorage.setItem('customer_auth_store_id', store?.id);
              localStorage.setItem('customer_auth_store_code', store?.slug);
              navigate?.(createPublicUrl(store?.slug, 'CUSTOMER_AUTH'));
            }
          }}
          disabled={userLoading}
        >
          <User className="w-5 h-5" />
        </Button>
      </div>
    );
  }
});

// Create MobileNavigation component
const MobileNavigationSlot = createSlotComponent({
  name: 'MobileNavigation',
  render: ({ slot, context, headerContext, className, styles }) => {
    const { categories = [], store, setMobileMenuOpen } = headerContext || {};

    if (context === 'editor') {
      return (
        <div className={className || "space-y-2"} style={styles}>
          <a href="#" className="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-md">
            Electronics
          </a>
          <a href="#" className="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-md">
            Clothing
          </a>
          <a href="#" className="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-md">
            Home & Garden
          </a>
        </div>
      );
    }

    // Storefront rendering
    return (
      <div className={className} style={styles}>
        {categories?.map(cat => (
          <Link
            key={cat.id}
            to={createPublicUrl(store?.slug, 'CATEGORY', cat.slug)}
            className="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-md"
            onClick={() => setMobileMenuOpen?.(false)}
          >
            {cat.name}
          </Link>
        ))}
      </div>
    );
  }
});

// Register all components with the ComponentRegistry
registerSlotComponent('StoreLogo', StoreLogo);
registerSlotComponent('HeaderSearch', HeaderSearchSlot);
registerSlotComponent('MiniCart', MiniCartSlot);
registerSlotComponent('WishlistDropdown', WishlistDropdownSlot);
registerSlotComponent('CategoryNav', CategoryNavSlot);
registerSlotComponent('UserMenu', UserMenuSlot);
registerSlotComponent('UserAccountMenu', UserAccountMenuSlot);
registerSlotComponent('LanguageSelector', LanguageSelectorSlot);
registerSlotComponent('CountrySelector', CountrySelectorSlot);
registerSlotComponent('CountrySelect', CountrySelectorSlot);
registerSlotComponent('MobileMenuButton', MobileMenuButtonSlot);
registerSlotComponent('MobileSearchButton', MobileSearchButtonSlot);
registerSlotComponent('MobileSearchToggle', MobileSearchToggleSlot);
registerSlotComponent('MobileUserMenu', MobileUserMenuSlot);
registerSlotComponent('MobileMenuToggle', MobileMenuToggleSlot);
registerSlotComponent('MobileNavigation', MobileNavigationSlot);

// Export all components for potential individual use
export {
  StoreLogo,
  HeaderSearchSlot,
  MiniCartSlot,
  WishlistDropdownSlot,
  CategoryNavSlot,
  UserMenuSlot,
  UserAccountMenuSlot,
  LanguageSelectorSlot,
  CountrySelectorSlot,
  MobileMenuButtonSlot,
  MobileSearchButtonSlot,
  MobileSearchToggleSlot,
  MobileUserMenuSlot,
  MobileMenuToggleSlot,
  MobileNavigationSlot
};
