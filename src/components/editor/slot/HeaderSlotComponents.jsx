/**
 * Header Slot Components
 * Register header-specific slot components with the unified registry
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { createSlotComponent, registerSlotComponent } from './SlotComponentRegistry';
import { createPublicUrl } from '@/utils/urlUtils';
import { ShoppingBag, Search, User, Menu, Globe, ChevronDown, Heart, X } from 'lucide-react';
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

    // Use same rendering for both editor and storefront with responsive sizing
    const content = (
      <>
        {store?.logo_url ? (
          <img src={store.logo_url} alt={store.name} className="h-6 md:h-8 w-6 md:w-8 object-contain" />
        ) : (
          <ShoppingBag className="h-6 md:h-8 w-6 md:w-8 text-blue-600" />
        )}
        <span className="text-base md:text-xl font-bold text-gray-800 truncate" style={{ color: styles?.color, fontSize: styles?.fontSize, fontWeight: styles?.fontWeight }}>
          {store?.name || 'Demo Store'}
        </span>
      </>
    );

    if (context === 'editor') {
      return (
        <div className={className || "flex items-center space-x-1 md:space-x-2"} style={styles}>
          {content}
        </div>
      );
    }

    // Storefront rendering with link
    return (
      <Link to={storeUrl} className={className || "flex items-center space-x-1 md:space-x-2"} style={styles}>
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
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              0
            </span>
          </Button>
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
        <Button
          variant="ghost"
          size="icon"
          className={className}
          style={styles}
        >
          <Heart className="w-5 h-5" />
        </Button>
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
      // Render simplified static navigation in editor with hover dropdowns - matching storefront exactly
      return (
        <nav className={className || "hidden md:flex items-center space-x-1"} style={styles}>
          {categories.map(cat => (
            <div key={cat.id} className="relative group">
              <a
                href="#"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md inline-flex items-center transition-colors"
                style={{ color: linkColor, fontSize: linkFontSize, fontWeight: linkFontWeight }}
              >
                {cat.name}
                {cat.children && cat.children.length > 0 && <ChevronDown className="w-3 h-3 ml-1" />}
              </a>
              {cat.children && cat.children.length > 0 && (
                <div className="absolute left-0 top-full w-48 bg-white border border-gray-200 rounded-md shadow-lg p-2 space-y-1 z-[9999] invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
                  <a href="#" className="block px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded border-b border-gray-200 pb-2 mb-1">
                    View All {cat.name}
                  </a>
                  {cat.children.map(child => (
                    <a
                      key={child.id}
                      href="#"
                      className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      {child.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
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
        <Button
          variant="ghost"
          size="icon"
          className={className}
          style={styles}
        >
          <User className="w-5 h-5" />
        </Button>
      );
    }

    // Storefront rendering
    if (userLoading) {
      return (
        <Button
          variant="ghost"
          size="icon"
          disabled
          className={className}
          style={styles}
        >
          <User className="w-5 h-5 text-gray-400 animate-pulse" />
        </Button>
      );
    }

    if (user) {
      return (
        <div className={className || "relative group"} style={styles}>
          <Button variant="ghost" size="icon" className="flex items-center">
            <User className="w-5 h-5" />
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
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
      <Link to="/customer/login" className={className} style={styles}>
        <Button variant="ghost" size="icon">
          <User className="w-5 h-5" />
        </Button>
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
  render: ({ slot, context, headerContext, className, styles }) => {
    const { settings = {}, selectedCountry, setSelectedCountry } = headerContext || {};
    const allowedCountries = settings.allowed_countries || ['US', 'CA', 'UK'];

    if (context === 'editor') {
      return (
        <div className={className || "flex items-center"} style={styles}>
          <CountrySelect
            value="US"
            onValueChange={() => {}}
            allowedCountries={allowedCountries}
          />
        </div>
      );
    }

    // Storefront rendering
    if (!allowedCountries || allowedCountries.length <= 1) return null;

    return (
      <div className={className} style={styles}>
        <CountrySelect
          value={selectedCountry}
          onValueChange={setSelectedCountry}
          allowedCountries={allowedCountries}
        />
      </div>
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
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
      );
    }

    // Storefront rendering
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileMenuOpen?.(!mobileMenuOpen)}
        className="md:hidden"
      >
        <Menu className="w-5 h-5" />
      </Button>
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
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
        >
          <Search className="w-5 h-5" />
        </Button>
      );
    }

    // Storefront rendering
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileSearchOpen?.(!mobileSearchOpen)}
        className="md:hidden"
      >
        <Search className="w-5 h-5" />
      </Button>
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
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
        >
          <User className="w-5 h-5" />
        </Button>
      );
    }

    // Storefront rendering
    return (
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
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
          {categories.map(cat => (
            <div key={cat.id} className="mobile-nav-item">
              <a href="#" className="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-md font-medium">
                {cat.name}
              </a>
              {cat.children && cat.children.length > 0 && (
                <div className="pl-4 space-y-1">
                  {cat.children.map(child => (
                    <a
                      key={child.id}
                      href="#"
                      className="block py-2 px-3 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
                    >
                      {child.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Storefront rendering
    return (
      <div className={className} style={styles}>
        {categories?.map(cat => (
          <div key={cat.id} className="mobile-nav-item">
            <Link
              to={createPublicUrl(store?.slug, 'CATEGORY', cat.slug)}
              className="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
              onClick={() => setMobileMenuOpen?.(false)}
            >
              {cat.name}
            </Link>
            {cat.children && cat.children.length > 0 && (
              <div className="pl-4 space-y-1">
                {cat.children.map(child => (
                  <Link
                    key={child.id}
                    to={createPublicUrl(store?.slug, 'CATEGORY', child.slug)}
                    className="block py-2 px-3 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
                    onClick={() => setMobileMenuOpen?.(false)}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
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
