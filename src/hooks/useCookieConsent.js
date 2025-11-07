/**
 * Cookie Consent Hook for Analytics
 * Provides consent status and utilities for analytics tracking
 *
 * Usage:
 * const { hasConsent, getConsentHeader } = useCookieConsent();
 *
 * if (hasConsent('analytics')) {
 *   // Track analytics event
 * }
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Get cookie consent from localStorage
 * @returns {array} Array of consented categories
 */
function getStoredConsent() {
  try {
    const consent = localStorage.getItem('cookie_consent');
    if (consent) {
      return JSON.parse(consent);
    }
  } catch (error) {
    console.warn('[CONSENT] Error reading consent:', error);
  }
  return [];
}

/**
 * Hook to manage cookie consent for analytics
 */
export function useCookieConsent() {
  const [consentedCategories, setConsentedCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial consent
    const consent = getStoredConsent();
    setConsentedCategories(consent);
    setIsLoading(false);

    // Listen for consent changes
    const handleStorageChange = (e) => {
      if (e.key === 'cookie_consent') {
        const newConsent = e.newValue ? JSON.parse(e.newValue) : [];
        setConsentedCategories(newConsent);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for consent changes in same tab
    const handleConsentChange = (e) => {
      setConsentedCategories(e.detail.consent);
    };

    window.addEventListener('consentChanged', handleConsentChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('consentChanged', handleConsentChange);
    };
  }, []);

  /**
   * Check if user has consented to a specific category
   * @param {string} category - Category to check (analytics, marketing, functional)
   * @returns {boolean}
   */
  const hasConsent = useCallback((category) => {
    if (!category) return false;

    // Check for exact match or category with _cookies suffix
    return consentedCategories.includes(category) ||
           consentedCategories.includes(`${category}_cookies`);
  }, [consentedCategories]);

  /**
   * Get consent header for API requests
   * @returns {string} JSON string of consented categories
   */
  const getConsentHeader = useCallback(() => {
    return JSON.stringify(consentedCategories);
  }, [consentedCategories]);

  /**
   * Update consent (triggers save to localStorage and backend)
   * @param {array} categories - Array of consented category IDs
   */
  const updateConsent = useCallback((categories) => {
    try {
      localStorage.setItem('cookie_consent', JSON.stringify(categories));
      setConsentedCategories(categories);

      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('consentChanged', {
        detail: { consent: categories }
      }));

      // Track consent change
      trackConsentChange(categories);
    } catch (error) {
      console.error('[CONSENT] Error updating consent:', error);
    }
  }, []);

  /**
   * Check if consent has been given (any consent saved)
   * @returns {boolean}
   */
  const hasAnyConsent = useCallback(() => {
    const consentExpiry = localStorage.getItem('cookie_consent_expiry');
    if (!consentExpiry) return false;

    const expiryDate = new Date(consentExpiry);
    return expiryDate > new Date();
  }, []);

  return {
    consentedCategories,
    hasConsent,
    hasAnalyticsConsent: hasConsent('analytics'),
    hasMarketingConsent: hasConsent('marketing'),
    hasFunctionalConsent: hasConsent('functional'),
    getConsentHeader,
    updateConsent,
    hasAnyConsent,
    isLoading
  };
}

/**
 * Track consent change event
 * @param {array} categories - Consented categories
 */
async function trackConsentChange(categories) {
  try {
    const sessionId = localStorage.getItem('session_id') ||
                     localStorage.getItem('cookie_consent_session');

    if (!sessionId) return;

    // Send consent change event to analytics
    await fetch('/api/analytics/consent-change', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        categories_accepted: categories,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.warn('[CONSENT] Failed to track consent change:', error);
    });
  } catch (error) {
    console.warn('[CONSENT] Error tracking consent change:', error);
  }
}

/**
 * Higher-order component to wrap components with consent check
 * @param {React.Component} Component - Component to wrap
 * @param {string} requiredConsent - Required consent category
 * @param {React.Component} FallbackComponent - Component to show if no consent
 * @returns {React.Component}
 *
 * Usage:
 * const AnalyticsWidget = withConsent(MyWidget, 'analytics', <div>Analytics disabled</div>);
 */
export function withConsent(Component, requiredConsent, FallbackComponent = null) {
  return function ConsentWrapper(props) {
    const { hasConsent, isLoading } = useCookieConsent();

    if (isLoading) {
      return null;
    }

    if (!hasConsent(requiredConsent)) {
      return FallbackComponent;
    }

    return <Component {...props} />;
  };
}

/**
 * Component to conditionally render based on consent
 * @param {object} props - { category, children, fallback }
 *
 * Usage:
 * <ConsentGate category="analytics">
 *   <AnalyticsWidget />
 * </ConsentGate>
 */
export function ConsentGate({ category, children, fallback = null }) {
  const { hasConsent, isLoading } = useCookieConsent();

  if (isLoading) {
    return fallback;
  }

  if (!hasConsent(category)) {
    return fallback;
  }

  return children;
}

/**
 * Hook to create consent-aware fetch function
 * Automatically adds consent header to requests
 *
 * Usage:
 * const fetchWithConsent = useConsentAwareFetch();
 * await fetchWithConsent('/api/customer-activity', { method: 'POST', body: ... });
 */
export function useConsentAwareFetch() {
  const { getConsentHeader } = useCookieConsent();

  const fetchWithConsent = useCallback(async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'X-Cookie-Consent': getConsentHeader()
    };

    return fetch(url, {
      ...options,
      headers
    });
  }, [getConsentHeader]);

  return fetchWithConsent;
}
