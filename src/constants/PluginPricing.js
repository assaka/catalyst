// src/constants/PluginPricing.js

export const PRICING_MODELS = {
  FREE: 'free',              // No cost
  ONE_TIME: 'one_time',      // Single payment, lifetime access
  SUBSCRIPTION: 'subscription', // Recurring monthly/yearly
  FREEMIUM: 'freemium',      // Free base + paid features
  CUSTOM: 'custom'           // Custom pricing tiers
};

export const LICENSE_TYPES = {
  PER_STORE: 'per_store',    // Each tenant pays separately
  UNLIMITED: 'unlimited',     // One price, unlimited installs
  PER_USER: 'per_user'       // Price based on admin user count
};

export const BILLING_INTERVALS = {
  MONTHLY: 'month',
  YEARLY: 'year'
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing'
};

// Revenue share configuration
export const REVENUE_SHARE = {
  CREATOR_PERCENTAGE: 70,    // Creator gets 70%
  PLATFORM_PERCENTAGE: 30    // Platform gets 30%
};
