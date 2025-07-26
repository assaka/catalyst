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

export const createStripeCheckout = async (checkoutData) => {
  try {
    // Extract data from checkoutData object
    const {
      cartItems,
      shippingAddress,
      billingAddress,
      store,
      taxAmount,
      shippingCost,
      deliveryDate,
      deliveryTimeSlot,
      deliveryComments,
      email,
      userId,
      sessionId
    } = checkoutData;

    const requestPayload = {
      items: cartItems, // Map cartItems to items
      store_id: store?.id,
      success_url: `${window.location.origin}/order-success`,
      cancel_url: `${window.location.origin}/cart`,
      customer_email: email,
      shipping_address: shippingAddress,
      delivery_date: deliveryDate,
      delivery_time_slot: deliveryTimeSlot,
      delivery_instructions: deliveryComments
    };

    const response = await apiClient.post('payments/create-checkout', requestPayload);
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

export const createStripeConnectAccount = async (storeId, country = 'US', businessType = 'company') => {
  try {
    const response = await apiClient.post('payments/connect-account', {
      store_id: storeId,
      country: country,
      business_type: businessType
    });
    return { data: response.data || response };
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    throw error;
  }
};

export const createStripeConnectLink = async (returnUrl, refreshUrl, storeId) => {
  try {
    const response = await apiClient.post('payments/connect-link', {
      return_url: returnUrl,
      refresh_url: refreshUrl,
      store_id: storeId
    });
    return { data: response.data || response };
  } catch (error) {
    console.error('Error creating Stripe Connect link:', error);
    throw error;
  }
};

export const checkStripeConnectStatus = async (storeId) => {
  try {
    const response = await apiClient.get(`payments/connect-status${storeId ? `?store_id=${storeId}` : ''}`);
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