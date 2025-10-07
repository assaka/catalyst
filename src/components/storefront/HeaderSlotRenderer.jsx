import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { SlotManager } from '@/utils/slotUtils';
import { filterSlotsByViewMode, sortSlotsByGridCoordinates } from '@/hooks/useSlotConfiguration';
import { ComponentRegistry } from '@/components/editor/slot/SlotComponentRegistry';
import { createPublicUrl } from '@/utils/urlUtils';
import { ShoppingBag, Search, User, Menu, Globe, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeaderSearch from './HeaderSearch';
import MiniCart from './MiniCart';
import WishlistDropdown from './WishlistDropdown';
import CategoryNav from './CategoryNav';
import { CountrySelect } from '@/components/ui/country-select';
import CmsBlockRenderer from './CmsBlockRenderer';

/**
 * HeaderSlotRenderer - Renders header slots with full customization
 * Follows the same structure as CategorySlotRenderer and CartSlotRenderer
 */
export function HeaderSlotRenderer({
  slots,
  parentId = null,
  viewMode = 'desktop',
  headerContext = {}
}) {
  const {
    store,
    settings = {},
    user,
    userLoading,
    categories = [],
    languages = [],
    currentLanguage,
    selectedCountry,
    mobileMenuOpen,
    mobileSearchOpen,
    setCurrentLanguage,
    setSelectedCountry,
    setMobileMenuOpen,
    setMobileSearchOpen,
    handleCustomerLogout,
    navigate,
    location
  } = headerContext;

  // Get child slots for current parent
  let childSlots = SlotManager.getChildSlots(slots, parentId);

  // Filter by viewMode if applicable
  const filteredSlots = filterSlotsByViewMode(childSlots, viewMode);

  // Sort slots using grid coordinates for precise positioning
  const sortedSlots = sortSlotsByGridCoordinates(filteredSlots);

  // Process template variables
  const processVariables = (template, context) => {
    if (!template) return '';

    let processed = template;

    // Replace store variables
    if (context.store) {
      processed = processed.replace(/\{\{store\.name\}\}/g, context.store.name || '');
      processed = processed.replace(/\{\{store\.logo_url\}\}/g, context.store.logo_url || '');
      processed = processed.replace(/\{\{store\.url\}\}/g, createPublicUrl(context.store.slug, 'STOREFRONT'));
    }

    // Replace user variables
    if (context.user) {
      processed = processed.replace(/\{\{user\.name\}\}/g, context.user.name || context.user.email || '');
      processed = processed.replace(/\{\{user\.email\}\}/g, context.user.email || '');
    }

    // Replace settings variables
    if (context.settings?.theme) {
      Object.keys(context.settings.theme).forEach(key => {
        const regex = new RegExp(`\\{\\{settings\\.theme\\.${key}\\}\\}`, 'g');
        processed = processed.replace(regex, context.settings.theme[key] || '');
      });
    }

    return processed;
  };

  const renderSlotContent = (slot) => {
    const {
      id,
      type,
      component,
      content = '',
      className = '',
      parentClassName = '',
      styles = {},
      metadata = {}
    } = slot;

    // Apply custom styles from slot configuration
    const customStyles = { ...styles };

    // Handle different slot types
    switch (type) {
      case 'container':
      case 'grid':
      case 'flex':
        // Render container with children
        return (
          <div
            key={id}
            className={className}
            style={customStyles}
            data-slot-id={id}
          >
            <HeaderSlotRenderer
              slots={slots}
              parentId={id}
              viewMode={viewMode}
              headerContext={headerContext}
            />
          </div>
        );

      case 'text':
        const processedContent = processVariables(content, headerContext);
        const htmlTag = metadata.htmlTag || 'div';
        const TextTag = htmlTag;

        return (
          <TextTag
            key={id}
            className={className}
            style={customStyles}
            data-slot-id={id}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        );

      case 'component':
        // Render registered component
        return renderComponent(slot);

      case 'style_config':
        // Style config slots don't render directly
        return null;

      default:
        return null;
    }
  };

  const renderComponent = (slot) => {
    const { id, component, content, className, styles, metadata } = slot;

    // Special component rendering based on component name
    switch (component) {
      case 'StoreLogo':
        return (
          <div key={id} className={className} style={styles} data-slot-id={id}>
            <Link to={createPublicUrl(store?.slug, 'STOREFRONT')} className="flex items-center space-x-1 md:space-x-2">
              {store?.logo_url ? (
                <img src={store.logo_url} alt={store.name || 'Store Logo'} className="h-6 md:h-8 w-6 md:w-8 object-contain" />
              ) : (
                <ShoppingBag className="h-6 md:h-8 w-6 md:w-8 text-blue-600" />
              )}
              <span className="text-base md:text-xl font-bold text-gray-800 truncate" style={{ color: styles?.color, fontSize: styles?.fontSize, fontWeight: styles?.fontWeight }}>
                {store?.name || 'Catalyst'}
              </span>
            </Link>
          </div>
        );

      case 'HeaderSearch':
        if (settings?.hide_header_search) return null;
        return (
          <div key={id} className={className} style={styles} data-slot-id={id}>
            <HeaderSearch styles={styles} />
          </div>
        );

      case 'MobileSearchToggle':
        if (settings?.hide_header_search) return null;
        // Don't show toggle if search is permanently visible (from store settings)
        if (settings?.show_permanent_search) return null;

        return (
          <Button
            key={id}
            variant="ghost"
            size="icon"
            onClick={() => setMobileSearchOpen?.(!mobileSearchOpen)}
            data-slot-id={id}
          >
            <Search className="w-5 h-5" />
          </Button>
        );

      case 'MobileUserMenu':
        return (
          <Button
            key={id}
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
            data-slot-id={id}
          >
            <User className="w-5 h-5" />
          </Button>
        );

      case 'WishlistDropdown':
        return (
          <div key={id} data-slot-id={id}>
            <WishlistDropdown />
          </div>
        );

      case 'LanguageSelector':
        // Hide if setting is disabled (default: false/hidden)
        // Only show if explicitly enabled
        if (settings?.show_language_selector !== true) return null;
        if (!languages || languages.length <= 1) return null;
        return (
          <div key={id} className={className} data-slot-id={id}>
            <select
              className="border-none bg-transparent text-sm"
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage?.(e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang.id} value={lang.code}>
                  {lang.flag_icon} {lang.name}
                </option>
              ))}
            </select>
          </div>
        );

      case 'CountrySelect':
        if (!settings?.allowed_countries || settings.allowed_countries.length <= 1) return null;
        return (
          <div key={id} className={className} data-slot-id={id}>
            <CountrySelect
              value={selectedCountry}
              onValueChange={setSelectedCountry}
              allowedCountries={settings.allowed_countries}
            />
          </div>
        );

      case 'UserAccountMenu':
        const buttonStyles = {
          backgroundColor: styles?.backgroundColor || '#2563EB',
          color: styles?.color || '#ffffff',
          borderRadius: styles?.borderRadius || '0.5rem',
        };

        const hoverBg = styles?.hoverBackgroundColor || '#1D4ED8';

        return (
          <div key={id} className={className} data-slot-id={id}>
            {user ? (
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
            ) : (
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
            )}
          </div>
        );

      case 'MiniCart':
        if (settings?.hide_header_cart) return null;
        return (
          <div key={id} data-slot-id={id}>
            <MiniCart />
          </div>
        );

      case 'MobileMenuToggle':
        return (
          <Button
            key={id}
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen?.(!mobileMenuOpen)}
            data-slot-id={id}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        );

      case 'MobileNavigation':
        // Render mobile navigation with collapsible children
        const { expandedMobileCategories, setExpandedMobileCategories } = headerContext || {};

        const toggleMobileCategory = (categoryId) => {
          if (!setExpandedMobileCategories) return;
          setExpandedMobileCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
              newSet.delete(categoryId);
            } else {
              newSet.add(categoryId);
            }
            return newSet;
          });
        };

        // Get custom colors from styles
        const linkColor = styles?.color || '#374151';
        const hoverColor = styles?.hoverColor || '#111827';
        const hoverBgColor = styles?.hoverBackgroundColor || '#f3f4f6';

        return (
          <div key={id} className={className} data-slot-id={id}>
            {categories?.map(cat => {
              const hasChildren = cat.children && cat.children.length > 0;
              const isExpanded = expandedMobileCategories?.has(cat.id);

              return (
                <div key={cat.id} className="mobile-nav-item">
                  <div className="flex items-center">
                    {hasChildren && (
                      <button
                        onClick={() => toggleMobileCategory(cat.id)}
                        className="p-2 rounded touch-manipulation transition-colors"
                        style={{ color: linkColor }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBgColor}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    )}
                    <Link
                      to={createPublicUrl(store?.slug, 'CATEGORY', cat.slug)}
                      className="flex-1 block py-2 px-3 rounded-md font-medium transition-colors"
                      style={{ color: linkColor }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = hoverColor;
                        e.currentTarget.style.backgroundColor = hoverBgColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = linkColor;
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={() => setMobileMenuOpen?.(false)}
                    >
                      {cat.name}
                    </Link>
                  </div>
                  {hasChildren && isExpanded && (
                    <div className="pl-4 space-y-1">
                      {cat.children.map(child => (
                        <Link
                          key={child.id}
                          to={createPublicUrl(store?.slug, 'CATEGORY', child.slug)}
                          className="block py-2 px-3 rounded-md text-sm transition-colors"
                          style={{ color: linkColor, opacity: 0.8 }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = hoverColor;
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.backgroundColor = hoverBgColor;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = linkColor;
                            e.currentTarget.style.opacity = '0.8';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          onClick={() => setMobileMenuOpen?.(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'CategoryNav':
        return (
          <div key={id} className={className} style={styles} data-slot-id={id}>
            <CategoryNav categories={categories} styles={styles} metadata={metadata} />
          </div>
        );

      case 'CmsBlockRenderer':
        const cmsPosition = metadata?.cmsPosition || metadata?.props?.position;
        if (!cmsPosition) return null;

        return (
          <div key={id} className={className} data-slot-id={id}>
            <CmsBlockRenderer position={cmsPosition} />
          </div>
        );

      default:
        // Try to render from component registry
        const RegisteredComponent = ComponentRegistry.get(component);
        if (RegisteredComponent) {
          return (
            <div key={id} className={className} data-slot-id={id}>
              <RegisteredComponent
                content={content}
                headerContext={headerContext}
                slot={slot}
              />
            </div>
          );
        }

        // Fallback: render content as HTML
        if (content) {
          const processedContent = processVariables(content, headerContext);
          return (
            <div
              key={id}
              className={className}
              style={styles}
              data-slot-id={id}
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />
          );
        }

        return null;
    }
  };

  // Filter mobile search and menu based on state
  const finalSlots = sortedSlots.filter((slot) => {
    // Check if permanent mobile search is enabled from store settings
    const showPermanentMobile = settings?.show_permanent_search || false;

    // Hide mobile_search_bar unless mobileSearchOpen OR showPermanentMobile
    if (slot.id === 'mobile_search_bar' && !mobileSearchOpen && !showPermanentMobile) {
      return false;
    }
    // Hide mobile_menu unless mobileMenuOpen
    if (slot.id === 'mobile_menu' && !mobileMenuOpen) {
      return false;
    }
    return true;
  });

  // Render all slots
  return (
    <>
      {finalSlots.map(slot => (
        <Fragment key={slot.id}>
          {renderSlotContent(slot)}
        </Fragment>
      ))}
    </>
  );
}

export default HeaderSlotRenderer;
