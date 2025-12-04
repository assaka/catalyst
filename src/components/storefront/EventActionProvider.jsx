/**
 * EventActionProvider Component
 *
 * Wraps the storefront to provide database-driven event actions
 * Automatically triggers events based on page views and cart state
 */

import React, { createContext, useContext, useEffect, useCallback, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useEventActions } from '../../hooks/useEventActions';
import { EventActionModal } from './EventActionModal';
import { useStore } from './StoreProvider';

// Create context
const EventActionContext = createContext(null);

// Export hook to use event actions in child components
export const useEventActionContext = () => {
    const context = useContext(EventActionContext);
    if (!context) {
        throw new Error('useEventActionContext must be used within EventActionProvider');
    }
    return context;
};

export function EventActionProvider({ children }) {
    const location = useLocation();
    const storeContext = useStore();
    const store = storeContext?.store;
    const user = storeContext?.user;

    // Track cart items count from cart events
    const [cartItemsCount, setCartItemsCount] = useState(0);

    // Listen for cart updates
    useEffect(() => {
        const handleCartUpdate = (event) => {
            if (event.detail?.freshCartData) {
                setCartItemsCount(event.detail.freshCartData.items?.length || 0);
            }
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => window.removeEventListener('cartUpdated', handleCartUpdate);
    }, []);
    const {
        currentAction,
        isModalOpen,
        appliedCoupon,
        triggerEvent,
        events,
        handleModalAction,
        closeModal,
        markConversion,
        clearAppliedCoupon
    } = useEventActions();

    const lastCartCount = useRef(cartItemsCount);
    const hasTriggeredEmpty = useRef(false);

    // Track page views
    useEffect(() => {
        const pageName = getPageName(location.pathname);
        events.pageView(pageName);
    }, [location.pathname]);

    // Track cart view when on cart page
    useEffect(() => {
        if (location.pathname.includes('/cart')) {
            events.cartView();

            // Trigger empty cart event if cart is empty
            if (cartItemsCount === 0 && !hasTriggeredEmpty.current) {
                hasTriggeredEmpty.current = true;
                events.cartEmpty();
            } else if (cartItemsCount > 0) {
                hasTriggeredEmpty.current = false;
            }
        }
    }, [location.pathname, cartItemsCount]);

    // Track checkout start
    useEffect(() => {
        if (location.pathname.includes('/checkout')) {
            events.checkoutStart();
        }
    }, [location.pathname]);

    // Track cart changes
    useEffect(() => {
        const currentCount = cartItemsCount;
        const previousCount = lastCartCount.current;

        if (currentCount > previousCount) {
            // Item was added
            events.cartAdd({});
        } else if (currentCount < previousCount) {
            // Item was removed
            events.cartRemove();
        }

        lastCartCount.current = currentCount;
    }, [cartItemsCount]);

    // Track first visit
    useEffect(() => {
        const hasVisited = localStorage.getItem('has_visited');
        if (!hasVisited) {
            localStorage.setItem('has_visited', 'true');
            events.firstVisit();
        }
    }, []);

    // Track user login
    useEffect(() => {
        if (user?.id) {
            events.userLogin();
        }
    }, [user?.id]);

    // Track exit intent
    useEffect(() => {
        const handleMouseLeave = (e) => {
            if (e.clientY <= 0) {
                events.exitIntent();
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, []);

    // Get page name from pathname
    const getPageName = useCallback((pathname) => {
        if (pathname === '/') return 'home';
        if (pathname.includes('/cart')) return 'cart';
        if (pathname.includes('/checkout')) return 'checkout';
        if (pathname.includes('/product')) return 'product';
        if (pathname.includes('/category')) return 'category';
        if (pathname.includes('/account')) return 'account';
        if (pathname.includes('/wishlist')) return 'wishlist';
        return pathname.replace(/^\//, '').replace(/\//g, '-') || 'other';
    }, []);

    // Context value
    const contextValue = {
        // State
        currentAction,
        isModalOpen,
        appliedCoupon,

        // Event triggers
        events,
        triggerEvent,

        // Actions
        markConversion,
        clearAppliedCoupon,

        // Manual modal control
        closeModal
    };

    return (
        <EventActionContext.Provider value={contextValue}>
            {children}

            {/* Event Action Modal */}
            <EventActionModal
                isOpen={isModalOpen}
                onClose={closeModal}
                modalConfig={currentAction?.modalConfig}
                couponConfig={currentAction?.couponConfig}
                onButtonClick={handleModalAction}
                trigger={currentAction?.trigger}
            />

            {/* Toast Notification Styles */}
            <style>{`
                .event-action-toast {
                    position: fixed;
                    z-index: 9999;
                    padding: 12px 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    animation: toastSlideIn 0.3s ease-out;
                }
                .event-action-toast--top-right {
                    top: 20px;
                    right: 20px;
                }
                .event-action-toast--top-left {
                    top: 20px;
                    left: 20px;
                }
                .event-action-toast--bottom-right {
                    bottom: 20px;
                    right: 20px;
                }
                .event-action-toast--bottom-left {
                    bottom: 20px;
                    left: 20px;
                }
                .event-action-toast--hiding {
                    animation: toastSlideOut 0.3s ease-out forwards;
                }
                .event-action-toast__content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .event-action-toast--banner {
                    left: 0;
                    right: 0;
                    border-radius: 0;
                }
                @keyframes toastSlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes toastSlideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `}</style>
        </EventActionContext.Provider>
    );
}

export default EventActionProvider;
