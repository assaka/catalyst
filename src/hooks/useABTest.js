/**
 * React Hook for A/B Testing
 * Provides easy access to A/B test variants in components
 *
 * Usage Examples:
 *
 * 1. Basic usage - get variant for a test:
 *    const { variant, isControl, isLoading } = useABTest('test-123');
 *    if (variant?.config?.showNewFeature) {
 *      return <NewFeature />;
 *    }
 *
 * 2. Track conversion:
 *    const { variant, trackConversion } = useABTest('checkout-test');
 *    const handlePurchase = async (orderTotal) => {
 *      await trackConversion(orderTotal);
 *    };
 *
 * 3. Track custom metrics:
 *    const { trackMetric } = useABTest('engagement-test');
 *    const handleVideoView = () => {
 *      trackMetric('video_views', 1);
 *    };
 *
 * 4. Get all active tests:
 *    const { activeTests } = useABTesting();
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Get or generate session ID
 */
function getSessionId() {
  // Try to get from localStorage first
  let sessionId = localStorage.getItem('session_id');

  if (!sessionId) {
    // Generate new session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('session_id', sessionId);
  }

  return sessionId;
}

/**
 * Hook to use A/B testing in components
 * @param {string} testId - Test ID to get variant for
 * @returns {object} { variant, isControl, isLoading, trackConversion, trackMetric }
 */
export function useABTest(testId) {
  const [variant, setVariant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!testId) {
      setIsLoading(false);
      return;
    }

    const fetchVariant = async () => {
      try {
        setIsLoading(true);

        const sessionId = getSessionId();

        const response = await fetch(`/api/ab-testing/variant/${testId}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch variant');
        }

        const data = await response.json();

        if (data.success) {
          setVariant(data.data);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('[useABTest] Error fetching variant:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariant();
  }, [testId]);

  // Track conversion
  const trackConversion = useCallback(async (value = null, metrics = {}) => {
    if (!testId) return { success: false, error: 'No test ID' };

    try {
      const sessionId = getSessionId();

      const response = await fetch(`/api/ab-testing/conversion/${testId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({ value, metrics })
      });

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('[useABTest] Error tracking conversion:', err);
      return { success: false, error: err.message };
    }
  }, [testId]);

  // Track custom metric
  const trackMetric = useCallback(async (metricName, metricValue) => {
    if (!testId) return { success: false, error: 'No test ID' };

    try {
      const sessionId = getSessionId();

      const response = await fetch(`/api/ab-testing/metric/${testId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({ metricName, metricValue })
      });

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('[useABTest] Error tracking metric:', err);
      return { success: false, error: err.message };
    }
  }, [testId]);

  return {
    variant,
    isControl: variant?.is_control || false,
    isLoading,
    error,
    trackConversion,
    trackMetric
  };
}

/**
 * Hook to get all active A/B tests for the store
 * @param {string} storeId - Store ID
 * @param {string} pageType - Optional page type filter
 * @returns {object} { activeTests, isLoading, error }
 */
export function useABTesting(storeId, pageType = null) {
  const [activeTests, setActiveTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!storeId) {
      setIsLoading(false);
      return;
    }

    const fetchActiveTests = async () => {
      try {
        setIsLoading(true);

        const sessionId = getSessionId();

        const url = pageType
          ? `/api/ab-testing/active/${storeId}?pageType=${pageType}`
          : `/api/ab-testing/active/${storeId}`;

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch active tests');
        }

        const data = await response.json();

        if (data.success) {
          setActiveTests(data.data);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('[useABTesting] Error fetching active tests:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveTests();
  }, [storeId, pageType]);

  return {
    activeTests,
    isLoading,
    error
  };
}

/**
 * Higher-order component to wrap components with A/B test variants
 * @param {React.Component} Component - Component to wrap
 * @param {string} testId - Test ID
 * @returns {React.Component} Wrapped component
 *
 * Usage:
 * const HeroWithABTest = withABTest(Hero, 'hero-test-123');
 */
export function withABTest(Component, testId) {
  return function ABTestWrapper(props) {
    const { variant, isControl, isLoading } = useABTest(testId);

    if (isLoading) {
      return null; // Or a loading skeleton
    }

    // Merge variant config into props
    const mergedProps = variant?.config
      ? { ...props, ...variant.config, abTestVariant: variant }
      : props;

    return <Component {...mergedProps} />;
  };
}

/**
 * Component to conditionally render based on variant
 * @param {object} props - { testId, variantId, children, fallback }
 *
 * Usage:
 * <ABTestVariant testId="hero-test" variantId="variant_1">
 *   <NewHeroDesign />
 * </ABTestVariant>
 */
export function ABTestVariant({ testId, variantId, children, fallback = null }) {
  const { variant, isLoading } = useABTest(testId);

  if (isLoading) {
    return fallback;
  }

  if (variant?.variant_id === variantId) {
    return children;
  }

  return fallback;
}

/**
 * Component to render control vs variant
 * @param {object} props - { testId, control, variant }
 *
 * Usage:
 * <ABTestSwitch testId="hero-test">
 *   {{
 *     control: <OldHero />,
 *     variant: <NewHero />
 *   }}
 * </ABTestSwitch>
 */
export function ABTestSwitch({ testId, children }) {
  const { isControl, isLoading } = useABTest(testId);

  if (isLoading) {
    return children.control || null;
  }

  return isControl ? (children.control || null) : (children.variant || null);
}
