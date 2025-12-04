/**
 * useEventActions Hook
 *
 * Database-driven event triggers and actions for storefront
 * Handles modals, coupons, notifications, redirects, and custom scripts
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '@/components/storefront/StoreProvider';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Generate or retrieve session ID
const getSessionId = () => {
    let sessionId = sessionStorage.getItem('event_session_id');
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('event_session_id', sessionId);
    }
    return sessionId;
};

// Generate or retrieve visitor ID (persists across sessions)
const getVisitorId = () => {
    let visitorId = localStorage.getItem('event_visitor_id');
    if (!visitorId) {
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('event_visitor_id', visitorId);
    }
    return visitorId;
};

// Track shown triggers in this session
const shownTriggers = new Set();

export function useEventActions() {
    const storeContext = useStore();
    const store = storeContext?.store;
    const user = storeContext?.user;
    const storeId = store?.id;

    const [currentAction, setCurrentAction] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [cartData, setCartData] = useState({ items: [], total: 0, subtotal: 0 });
    const evaluatingRef = useRef(false);

    // Listen for cart updates from the cart service
    useEffect(() => {
        const handleCartUpdate = (event) => {
            if (event.detail?.freshCartData) {
                setCartData({
                    items: event.detail.freshCartData.items || [],
                    total: event.detail.freshCartData.total || 0,
                    subtotal: event.detail.freshCartData.subtotal || 0
                });
            }
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => window.removeEventListener('cartUpdated', handleCartUpdate);
    }, []);

    /**
     * Evaluate triggers for a given event type
     * Returns matching actions to execute
     */
    const evaluateEvent = useCallback(async (eventType, additionalContext = {}) => {
        if (!storeId || evaluatingRef.current) return null;

        evaluatingRef.current = true;

        try {
            const context = {
                // Cart context (from state or additional context)
                cart_items_count: additionalContext.cart_items_count ?? cartData.items?.length ?? 0,
                cart_total: additionalContext.cart_total ?? cartData.total ?? 0,
                cart_subtotal: additionalContext.cart_subtotal ?? cartData.subtotal ?? 0,
                cart_items: additionalContext.cart_items ?? cartData.items ?? [],

                // User context
                user: user ? {
                    id: user.id,
                    email: user.email,
                    order_count: user.order_count || 0,
                    is_logged_in: true
                } : { is_logged_in: false },

                // Session tracking
                session_id: getSessionId(),
                visitor_id: getVisitorId(),
                user_id: user?.id,

                // Page context
                currentPage: window.location.pathname,
                pageUrl: window.location.href,

                // Device context
                device: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',

                // Additional context passed by caller
                ...additionalContext
            };

            const response = await fetch(`${API_BASE}/api/event-actions/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeId, eventType, context })
            });

            if (!response.ok) {
                throw new Error('Failed to evaluate event');
            }

            const data = await response.json();

            if (data.actions && data.actions.length > 0) {
                // Check if already shown in this session
                if (shownTriggers.has(data.trigger.id)) {
                    return null;
                }

                shownTriggers.add(data.trigger.id);
                return data;
            }

            return null;
        } catch (error) {
            console.error('Error evaluating event:', error);
            return null;
        } finally {
            evaluatingRef.current = false;
        }
    }, [storeId, cartData, user]);

    /**
     * Execute actions returned from evaluation
     */
    const executeActions = useCallback(async (data) => {
        if (!data || !data.actions) return;

        for (const action of data.actions) {
            switch (action.action_type) {
                case 'show_modal':
                    setCurrentAction({
                        trigger: data.trigger,
                        action,
                        modalConfig: action.modal_config,
                        couponConfig: action.coupon_config
                    });
                    setIsModalOpen(true);

                    // Log display
                    logAction(data.trigger.id, action.id, 'displayed');
                    break;

                case 'apply_coupon':
                    if (action.coupon_config?.code && action.coupon_config?.auto_apply) {
                        setAppliedCoupon(action.coupon_config);
                        logAction(data.trigger.id, action.id, 'auto_applied');
                    }
                    break;

                case 'show_notification':
                    showNotification(action.notification_config);
                    logAction(data.trigger.id, action.id, 'displayed');
                    break;

                case 'redirect':
                    if (action.redirect_config?.url) {
                        logAction(data.trigger.id, action.id, 'redirected');
                        const delay = action.redirect_config.delay_ms || 0;
                        setTimeout(() => {
                            if (action.redirect_config.new_tab) {
                                window.open(action.redirect_config.url, '_blank');
                            } else {
                                window.location.href = action.redirect_config.url;
                            }
                        }, delay);
                    }
                    break;

                case 'run_script':
                    if (action.script_code) {
                        try {
                            // Sandboxed script execution
                            const fn = new Function('context', action.script_code);
                            fn({ cart: cartData, user, storeId });
                            logAction(data.trigger.id, action.id, 'script_executed');
                        } catch (error) {
                            console.error('Error executing event action script:', error);
                        }
                    }
                    break;
            }
        }
    }, [cartData, user, storeId]);

    /**
     * Trigger and execute event in one call
     */
    const triggerEvent = useCallback(async (eventType, additionalContext = {}) => {
        const data = await evaluateEvent(eventType, additionalContext);
        if (data) {
            await executeActions(data);
        }
        return data;
    }, [evaluateEvent, executeActions]);

    /**
     * Log action display/interaction
     */
    const logAction = useCallback(async (triggerId, actionId, actionResult, eventData = {}) => {
        try {
            await fetch(`${API_BASE}/api/event-actions/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId,
                    triggerId,
                    actionId,
                    sessionId: getSessionId(),
                    visitorId: getVisitorId(),
                    eventType: currentAction?.trigger?.slug,
                    eventData,
                    actionType: currentAction?.action?.action_type,
                    actionResult,
                    pageUrl: window.location.href
                })
            });
        } catch (error) {
            console.error('Error logging action:', error);
        }
    }, [storeId, currentAction]);

    /**
     * Mark conversion (e.g., order placed with coupon)
     */
    const markConversion = useCallback(async (triggerId, conversionValue) => {
        try {
            await fetch(`${API_BASE}/api/event-actions/convert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId,
                    triggerId,
                    sessionId: getSessionId(),
                    visitorId: getVisitorId(),
                    conversionValue
                })
            });
        } catch (error) {
            console.error('Error marking conversion:', error);
        }
    }, [storeId]);

    /**
     * Handle modal button click
     */
    const handleModalAction = useCallback((button) => {
        if (!currentAction) return;

        const { action: actionButton } = button;

        switch (actionButton) {
            case 'apply_coupon':
                if (button.coupon_code || currentAction.couponConfig?.code) {
                    setAppliedCoupon({
                        code: button.coupon_code || currentAction.couponConfig?.code,
                        ...currentAction.couponConfig
                    });
                }
                logAction(currentAction.trigger.id, currentAction.action.id, 'clicked', { button: button.text });
                closeModal();
                break;

            case 'redirect':
                logAction(currentAction.trigger.id, currentAction.action.id, 'clicked', { button: button.text });
                closeModal();
                if (button.url) {
                    window.location.href = button.url;
                }
                break;

            case 'dismiss':
                logAction(currentAction.trigger.id, currentAction.action.id, 'dismissed', { button: button.text });
                closeModal();
                break;

            default:
                logAction(currentAction.trigger.id, currentAction.action.id, 'clicked', { button: button.text });
                closeModal();
        }
    }, [currentAction, logAction]);

    /**
     * Close modal
     */
    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setTimeout(() => setCurrentAction(null), 300); // Allow animation to complete
    }, []);

    /**
     * Show toast notification
     */
    const showNotification = useCallback((config) => {
        if (!config) return;

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `event-action-toast event-action-toast--${config.type || 'toast'} event-action-toast--${config.position || 'top-right'}`;
        toast.innerHTML = `
            <div class="event-action-toast__content">
                ${config.icon ? `<span class="event-action-toast__icon">${config.icon}</span>` : ''}
                <span class="event-action-toast__message">${config.message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto-remove
        setTimeout(() => {
            toast.classList.add('event-action-toast--hiding');
            setTimeout(() => toast.remove(), 300);
        }, config.duration || 5000);
    }, []);

    /**
     * Predefined event triggers for common scenarios
     */
    const events = {
        // Cart events
        cartView: () => triggerEvent('cart.view'),
        cartEmpty: () => triggerEvent('cart.empty'),
        cartAdd: (product) => triggerEvent('cart.add', { product }),
        cartRemove: (product) => triggerEvent('cart.remove', { product }),

        // Checkout events
        checkoutStart: () => triggerEvent('checkout.start'),
        checkoutComplete: (order) => triggerEvent('checkout.complete', { order }),
        checkoutAbandoned: () => triggerEvent('checkout.abandoned'),

        // Product events
        productView: (product) => triggerEvent('product.view', { product }),

        // Page events
        pageView: (pageName) => triggerEvent('page.view', { pageName }),
        exitIntent: () => triggerEvent('exit.intent'),

        // User events
        userLogin: () => triggerEvent('user.login'),
        userRegister: () => triggerEvent('user.register'),
        firstVisit: () => triggerEvent('user.first_visit'),

        // Custom event
        custom: (eventType, context) => triggerEvent(eventType, context)
    };

    return {
        // State
        currentAction,
        isModalOpen,
        appliedCoupon,

        // Actions
        triggerEvent,
        evaluateEvent,
        executeActions,
        handleModalAction,
        closeModal,
        markConversion,
        logAction,

        // Predefined events
        events,

        // Utilities
        getSessionId,
        getVisitorId,
        clearAppliedCoupon: () => setAppliedCoupon(null)
    };
}

export default useEventActions;
