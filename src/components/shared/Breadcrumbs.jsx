import React from 'react';
import { Home } from 'lucide-react';

/**
 * Unified Breadcrumbs Component
 *
 * Data structure expected:
 * {
 *   items: [
 *     { name: 'Category Name', url: '/category/slug', type: 'category' },
 *     { name: 'Product Name', url: null, type: 'product' }
 *   ],
 *   config: {
 *     showHomeIcon: true,
 *     itemTextColor: '#DC2626',
 *     itemHoverColor: '#16A34A',
 *     activeItemColor: '#22C55E',
 *     separatorColor: '#9CA3AF',
 *     fontSize: '0.875rem',
 *     mobileFontSize: '0.75rem',
 *     fontWeight: '700'
 *   }
 * }
 */
const Breadcrumbs = ({ items = [], config = {} }) => {
  // Default configuration
  const {
    showHomeIcon = true,
    itemTextColor = '#6B7280',
    itemHoverColor = '#374151',
    activeItemColor = '#111827',
    separatorColor = '#9CA3AF',
    fontSize = '0.875rem',
    mobileFontSize = '0.75rem',
    fontWeight = '400'
  } = config;

  if (!items || items.length === 0) return null;

  return (
    <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-6" aria-label="Breadcrumb">
      {/* Home Link */}
      <a
        href="/"
        style={{
          color: itemTextColor,
          fontSize: `clamp(${mobileFontSize}, 2vw, ${fontSize})`,
          fontWeight
        }}
        className="flex items-center hover:underline"
        onMouseEnter={(e) => e.target.style.color = itemHoverColor}
        onMouseLeave={(e) => e.target.style.color = itemTextColor}
        data-breadcrumb-type="home"
      >
        {showHomeIcon && <Home className="w-4 h-4 mr-1 flex-shrink-0" />}
        Home
      </a>
      <span style={{ color: separatorColor, fontSize: `clamp(${mobileFontSize}, 2vw, ${fontSize})` }} className="flex-shrink-0">/</span>

      {/* Breadcrumb Items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {item.url ? (
              <a
                href={item.url}
                style={{
                  color: itemTextColor,
                  fontSize: `clamp(${mobileFontSize}, 2vw, ${fontSize})`,
                  fontWeight
                }}
                className="hover:underline break-words"
                onMouseEnter={(e) => e.target.style.color = itemHoverColor}
                onMouseLeave={(e) => e.target.style.color = itemTextColor}
                data-breadcrumb-type={item.type || 'link'}
                data-breadcrumb-position={isLast ? 'last' : 'middle'}
              >
                {item.name}
              </a>
            ) : (
              <span
                style={{
                  color: activeItemColor,
                  fontSize: `clamp(${mobileFontSize}, 2vw, ${fontSize})`,
                  fontWeight
                }}
                className="break-words"
                data-breadcrumb-type={item.type || 'current'}
                data-breadcrumb-position="last"
                aria-current="page"
              >
                {item.name}
              </span>
            )}
            {!isLast && (
              <span style={{ color: separatorColor, fontSize: `clamp(${mobileFontSize}, 2vw, ${fontSize})` }} className="flex-shrink-0">/</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
