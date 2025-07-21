import apiClient from './client';

// Stripe payment functions
export const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    const response = await apiClient.post('payments/create-intent', {
      amount,
      currency,
      metadata
    });
    return response.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

export const createStripeCheckout = async (items, successUrl, cancelUrl, customerEmail) => {
  try {
    const response = await apiClient.post('payments/create-checkout', {
      items,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Stripe checkout:', error);
    throw error;
  }
};

export const stripeWebhook = async (payload, signature) => {
  try {
    const response = await apiClient.post('payments/stripe-webhook', {
      payload,
      signature
    });
    return response.data;
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    throw error;
  }
};

export const createStripeConnectLink = async (returnUrl, refreshUrl) => {
  try {
    const response = await apiClient.post('payments/connect-link', {
      return_url: returnUrl,
      refresh_url: refreshUrl
    });
    return { data: response.data || response };
  } catch (error) {
    console.error('Error creating Stripe Connect link:', error);
    throw error;
  }
};

export const checkStripeConnectStatus = async () => {
  try {
    const response = await apiClient.get('payments/connect-status');
    return { data: response.data || response };
  } catch (error) {
    console.error('Error checking Stripe Connect status:', error);
    throw error;
  }
};

export const getStripePublishableKey = async () => {
  try {
    const response = await apiClient.get('payments/publishable-key');
    return response.data;
  } catch (error) {
    console.error('Error getting Stripe publishable key:', error);
    // Return a fallback key from environment variables
    return {
      publishable_key: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
    };
  }
};