/**
 * Header Slot Components
 * Register header-specific slot components with the unified registry
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { createSlotComponent } from './SlotComponentRegistry';
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
  render: ({ slot, context, headerContext }) => {
    const { store } = headerContext || {};
    const storeUrl = store ? createPublicUrl(store.slug, 'STOREFRONT') : '/';

    if (context === 'editor') {
      return (
        <div className="flex items-center">
          <div className="text-xl font-bold text-gray-900">
            {store?.name || 'Store Logo'}
          </div>
        </div>
      );
    }

    // Storefront rendering
    return (
      <Link to={storeUrl} className="flex items-center">
        {store?.logo_url ? (
          <img
            src={store.logo_url}
            alt={store.name}
            className="h-8 w-auto"
          />
        ) : (
          <span className="text-xl font-bold text-gray-900">
            {store?.name || 'Store'}
          </span>
        )}
      </Link>
    );
  }
});

/**
 * HeaderSearch Component
 */
const HeaderSearchSlot = createSlotComponent({
  name: 'HeaderSearch',
  render: ({ slot, context, headerContext }) => {
    const { settings = {} } = headerContext || {};

    if (context === 'editor') {
      return (
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              disabled
            />
            <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
        </div>
      );
    }

    // Storefront rendering
    if (settings.hide_header_search) return null;

    return <HeaderSearch />;
  }
});

/**
 * MiniCart Component
 */
const MiniCartSlot = createSlotComponent({
  name: 'MiniCart',
  render: ({ slot, context, headerContext }) => {
    const { settings = {} } = headerContext || {};

    if (context === 'editor') {
      return (
        <button className="relative p-2 text-gray-700 hover:text-gray-900">
          <ShoppingBag className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            0
          </span>
        </button>
      );
    }

    // Storefront rendering
    if (settings.hide_header_cart) return null;

    return <MiniCart />;
  }
});

/**
 * WishlistDropdown Component
 */
const WishlistDropdownSlot = createSlotComponent({
  name: 'WishlistDropdown',
  render: ({ slot, context, headerContext }) => {
    if (context === 'editor') {
      return (
        <button className="relative p-2 text-gray-700 hover:text-gray-900">
          <Heart className="w-6 h-6" />
        </button>
      );
    }

    // Storefront rendering
    return <WishlistDropdown />;
  }
});

/**
 * CategoryNav Component
 */
const CategoryNavSlot = createSlotComponent({
  name: 'CategoryNav',
  render: ({ slot, context, headerContext }) => {
    const { categories = [] } = headerContext || {};

    if (context === 'editor') {
      return (
        <nav className="flex space-x-6">
          <a href="#" className="text-gray-700 hover:text-gray-900">Electronics</a>
          <a href="#" className="text-gray-700 hover:text-gray-900">Clothing</a>
          <a href="#" className="text-gray-700 hover:text-gray-900">Home & Garden</a>
        </nav>
      );
    }

    // Storefront rendering
    return <CategoryNav categories={categories} />;
  }
});

/**
 * UserMenu Component
 */
const UserMenuSlot = createSlotComponent({
  name: 'UserMenu',
  render: ({ slot, context, headerContext }) => {
    const { user, userLoading, handleCustomerLogout } = headerContext || {};

    if (context === 'editor') {
      return (
        <button className="p-2 text-gray-700 hover:text-gray-900">
          <User className="w-6 h-6" />
        </button>
      );
    }

    // Storefront rendering
    if (userLoading) {
      return (
        <div className="p-2">
          <User className="w-6 h-6 text-gray-400 animate-pulse" />
        </div>
      );
    }

    if (user) {
      return (
        <div className="relative group">
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
      <Link to="/customer/login" className="p-2 text-gray-700 hover:text-gray-900">
        <User className="w-6 h-6" />
      </Link>
    );
  }
});

/**
 * LanguageSelector Component
 */
const LanguageSelectorSlot = createSlotComponent({
  name: 'LanguageSelector',
  render: ({ slot, context, headerContext }) => {
    const { languages = [], currentLanguage, setCurrentLanguage } = headerContext || {};

    if (context === 'editor') {
      return (
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-gray-600" />
          <select className="text-sm border-none bg-transparent text-gray-700">
            <option>English</option>
            <option>Español</option>
          </select>
        </div>
      );
    }

    // Storefront rendering
    if (languages.length <= 1) return null;

    return (
      <div className="flex items-center space-x-2">
        <Globe className="w-5 h-5 text-gray-600" />
        <select
          value={currentLanguage}
          onChange={(e) => setCurrentLanguage?.(e.target.value)}
          className="text-sm border-none bg-transparent text-gray-700 cursor-pointer"
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

// Export all components for potential individual use
export {
  StoreLogo,
  HeaderSearchSlot,
  MiniCartSlot,
  WishlistDropdownSlot,
  CategoryNavSlot,
  UserMenuSlot,
  LanguageSelectorSlot,
  CountrySelectorSlot,
  MobileMenuButtonSlot,
  MobileSearchButtonSlot
};
