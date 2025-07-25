// Coupon service for managing coupon state across cart and checkout
class CouponService {
    constructor() {
        this.storageKey = 'applied_coupon';
        this.listeners = new Set();
    }

    // Get applied coupon from localStorage
    getAppliedCoupon() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.warn('Failed to get applied coupon from storage:', error);
            return null;
        }
    }

    // Set applied coupon and notify listeners
    setAppliedCoupon(coupon) {
        try {
            if (coupon) {
                localStorage.setItem(this.storageKey, JSON.stringify(coupon));
            } else {
                localStorage.removeItem(this.storageKey);
            }
            
            // Notify all listeners about the change
            this.notifyListeners(coupon);
            
            return { success: true };
        } catch (error) {
            console.error('Failed to set applied coupon:', error);
            return { success: false, error: error.message };
        }
    }

    // Remove applied coupon
    removeAppliedCoupon() {
        return this.setAppliedCoupon(null);
    }

    // Add listener for coupon changes
    addListener(callback) {
        this.listeners.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    }

    // Notify all listeners of coupon changes
    notifyListeners(coupon) {
        this.listeners.forEach(callback => {
            try {
                callback(coupon);
            } catch (error) {
                console.error('Error in coupon listener:', error);
            }
        });
    }

    // Clear all listeners (useful for cleanup)
    clearListeners() {
        this.listeners.clear();
    }
}

// Export singleton instance
const couponService = new CouponService();
export default couponService;