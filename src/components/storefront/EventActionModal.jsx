/**
 * EventActionModal Component
 *
 * Renders database-driven modals for event actions
 * Supports various styles, positions, and button configurations
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X, Gift, Tag, ShoppingCart, Percent, Sparkles } from 'lucide-react';

// Position styles
const positionStyles = {
    center: 'fixed inset-0 flex items-center justify-center z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'top-bar': 'fixed top-0 left-0 right-0 z-50',
    'bottom-bar': 'fixed bottom-0 left-0 right-0 z-50'
};

// Size styles
const sizeStyles = {
    small: 'max-w-sm',
    medium: 'max-w-md',
    large: 'max-w-lg',
    fullscreen: 'w-full h-full max-w-none'
};

// Theme styles
const themeStyles = {
    light: {
        bg: 'bg-white',
        text: 'text-gray-900',
        secondaryText: 'text-gray-600',
        border: 'border-gray-200'
    },
    dark: {
        bg: 'bg-gray-900',
        text: 'text-white',
        secondaryText: 'text-gray-300',
        border: 'border-gray-700'
    },
    gradient: {
        bg: 'bg-gradient-to-br from-purple-600 to-blue-600',
        text: 'text-white',
        secondaryText: 'text-purple-100',
        border: 'border-transparent'
    },
    festive: {
        bg: 'bg-gradient-to-br from-red-500 to-pink-600',
        text: 'text-white',
        secondaryText: 'text-red-100',
        border: 'border-transparent'
    }
};

// Button styles
const buttonStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium',
    success: 'bg-green-600 hover:bg-green-700 text-white font-medium',
    danger: 'bg-red-600 hover:bg-red-700 text-white font-medium',
    outline: 'border-2 border-current bg-transparent hover:bg-white/10 font-medium',
    link: 'text-blue-600 hover:text-blue-700 underline bg-transparent',
    ghost: 'hover:bg-gray-100 text-gray-600'
};

// Animation styles
const animationStyles = {
    fade: {
        enter: 'animate-fadeIn',
        exit: 'animate-fadeOut'
    },
    slide: {
        enter: 'animate-slideInUp',
        exit: 'animate-slideOutDown'
    },
    zoom: {
        enter: 'animate-zoomIn',
        exit: 'animate-zoomOut'
    },
    bounce: {
        enter: 'animate-bounceIn',
        exit: 'animate-bounceOut'
    }
};

// Icon mapping
const iconMap = {
    gift: Gift,
    tag: Tag,
    cart: ShoppingCart,
    percent: Percent,
    sparkles: Sparkles
};

export function EventActionModal({
    isOpen,
    onClose,
    modalConfig = {},
    couponConfig = {},
    onButtonClick,
    trigger
}) {
    const modalRef = useRef(null);
    const firstButtonRef = useRef(null);

    // Extract config with defaults
    const {
        title = '',
        message = '',
        image_url: imageUrl,
        icon,
        style = {},
        buttons = [],
        close_on_backdrop: closeOnBackdrop = true,
        auto_dismiss_seconds: autoDismiss,
        show_coupon_code: showCouponCode = true
    } = modalConfig;

    const {
        position = 'center',
        size = 'medium',
        theme = 'light',
        backdrop = true,
        animation = 'zoom',
        rounded = true,
        shadow = true
    } = style;

    const themeStyle = themeStyles[theme] || themeStyles.light;
    const positionStyle = positionStyles[position] || positionStyles.center;
    const sizeStyle = sizeStyles[size] || sizeStyles.medium;
    const animationStyle = animationStyles[animation] || animationStyles.zoom;

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Focus trap
    useEffect(() => {
        if (isOpen && firstButtonRef.current) {
            firstButtonRef.current.focus();
        }
    }, [isOpen]);

    // Auto dismiss
    useEffect(() => {
        if (isOpen && autoDismiss) {
            const timer = setTimeout(() => {
                onClose();
            }, autoDismiss * 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoDismiss, onClose]);

    // Handle backdrop click
    const handleBackdropClick = useCallback((e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
            onClose();
        }
    }, [closeOnBackdrop, onClose]);

    // Handle button click
    const handleButtonClick = useCallback((button) => {
        if (onButtonClick) {
            onButtonClick(button);
        }
    }, [onButtonClick]);

    // Get icon component
    const IconComponent = icon ? iconMap[icon] : null;

    if (!isOpen) return null;

    const isBarPosition = position === 'top-bar' || position === 'bottom-bar';
    const isCornerPosition = position.includes('right') || position.includes('left');

    return (
        <>
            {/* Backdrop */}
            {backdrop && position === 'center' && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
                    onClick={handleBackdropClick}
                    aria-hidden="true"
                />
            )}

            {/* Modal Container */}
            <div
                className={positionStyle}
                onClick={position === 'center' ? handleBackdropClick : undefined}
                role="dialog"
                aria-modal="true"
                aria-labelledby="event-modal-title"
            >
                {/* Modal Content */}
                <div
                    ref={modalRef}
                    className={`
                        ${themeStyle.bg}
                        ${themeStyle.text}
                        ${sizeStyle}
                        ${rounded && !isBarPosition ? 'rounded-xl' : ''}
                        ${shadow ? 'shadow-2xl' : ''}
                        ${animationStyle.enter}
                        ${isBarPosition ? 'w-full' : 'w-full mx-4'}
                        overflow-hidden
                        border ${themeStyle.border}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className={`
                            absolute top-3 right-3 z-10
                            p-1 rounded-full
                            ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}
                            transition-colors
                        `}
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Image */}
                    {imageUrl && (
                        <div className="relative w-full h-40 overflow-hidden">
                            <img
                                src={imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                            {/* Gradient overlay for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>
                    )}

                    {/* Content */}
                    <div className={`p-6 ${isBarPosition ? 'flex items-center justify-between' : ''}`}>
                        <div className={isBarPosition ? 'flex items-center gap-4' : ''}>
                            {/* Icon */}
                            {IconComponent && !imageUrl && (
                                <div className={`
                                    ${isBarPosition ? '' : 'mb-4'}
                                    ${theme === 'light' ? 'text-blue-600' : 'text-white/80'}
                                `}>
                                    <IconComponent className={`${isBarPosition ? 'w-6 h-6' : 'w-12 h-12 mx-auto'}`} />
                                </div>
                            )}

                            {/* Title */}
                            {title && (
                                <h2
                                    id="event-modal-title"
                                    className={`
                                        ${isBarPosition ? 'text-base font-semibold' : 'text-xl font-bold mb-2 text-center'}
                                    `}
                                >
                                    {title}
                                </h2>
                            )}

                            {/* Message */}
                            {message && (
                                <p className={`
                                    ${themeStyle.secondaryText}
                                    ${isBarPosition ? 'text-sm' : 'text-center mb-4'}
                                `}>
                                    {message}
                                </p>
                            )}

                            {/* Coupon Code Display */}
                            {showCouponCode && couponConfig?.code && !isBarPosition && (
                                <div className={`
                                    mb-4 p-3 rounded-lg text-center
                                    ${theme === 'light' ? 'bg-gray-100' : 'bg-white/10'}
                                `}>
                                    <p className={`text-xs uppercase tracking-wide mb-1 ${themeStyle.secondaryText}`}>
                                        Your coupon code
                                    </p>
                                    <p className="text-2xl font-bold font-mono tracking-wider">
                                        {couponConfig.code}
                                    </p>
                                    {couponConfig.discount_value && (
                                        <p className={`text-sm mt-1 ${themeStyle.secondaryText}`}>
                                            {couponConfig.discount_type === 'percentage'
                                                ? `${couponConfig.discount_value}% off`
                                                : `$${couponConfig.discount_value} off`}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        {buttons.length > 0 && (
                            <div className={`
                                ${isBarPosition ? 'flex gap-2' : 'flex flex-col gap-2 mt-4'}
                            `}>
                                {buttons.map((button, index) => (
                                    <button
                                        key={index}
                                        ref={index === 0 ? firstButtonRef : null}
                                        onClick={() => handleButtonClick(button)}
                                        className={`
                                            px-4 py-2 rounded-lg transition-all
                                            ${buttonStyles[button.style] || buttonStyles.primary}
                                            ${isBarPosition ? 'text-sm whitespace-nowrap' : 'w-full'}
                                        `}
                                    >
                                        {button.text}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes slideInUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideOutDown {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(20px); opacity: 0; }
                }
                @keyframes zoomIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes zoomOut {
                    from { transform: scale(1); opacity: 1; }
                    to { transform: scale(0.9); opacity: 0; }
                }
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
                .animate-fadeOut { animation: fadeOut 0.2s ease-out; }
                .animate-slideInUp { animation: slideInUp 0.3s ease-out; }
                .animate-slideOutDown { animation: slideOutDown 0.3s ease-out; }
                .animate-zoomIn { animation: zoomIn 0.2s ease-out; }
                .animate-zoomOut { animation: zoomOut 0.2s ease-out; }
                .animate-bounceIn { animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
            `}</style>
        </>
    );
}

export default EventActionModal;
