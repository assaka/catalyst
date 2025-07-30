import apiClient from './client';
import storefrontApiClient from './storefront-client';

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
    console.log('Creating Stripe checkout with data:', checkoutData);
    console.log('🔍 Key values being sent:', {
      email: checkoutData.email,
      taxAmount: checkoutData.taxAmount,
      paymentFee: checkoutData.paymentFee,
      shippingCost: checkoutData.shippingCost,
      userId: checkoutData.userId,
      sessionId: checkoutData.sessionId
    });
    
    // Extract data from checkoutData object
    const {
      cartItems,
      shippingAddress,
      billingAddress,
      store,
      taxAmount,
      shippingCost,
      paymentFee,
      shippingMethod,
      selectedShippingMethod,
      selectedPaymentMethod,
      selectedPaymentMethodName,
      discountAmount,
      appliedCoupon,
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
      success_url: `${window.location.origin}/public/${store.slug}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/public/${store.slug}/checkout`,
      customer_email: email,
      shipping_address: shippingAddress,
      shipping_method: shippingMethod,
      selected_shipping_method: selectedShippingMethod,
      shipping_cost: shippingCost,
      tax_amount: taxAmount,
      payment_fee: paymentFee,
      selected_payment_method: selectedPaymentMethod,
      selected_payment_method_name: selectedPaymentMethodName,
      discount_amount: discountAmount,
      applied_coupon: appliedCoupon,
      delivery_date: deliveryDate,
      delivery_time_slot: deliveryTimeSlot,
      delivery_instructions: deliveryComments,
      session_id: sessionId, // Include session_id for guest checkout
      customer_id: userId // Use customer_id instead of user_id for customer orders
    };

    console.log('🔍 Final request payload:', {
      ...requestPayload,
      items: requestPayload.items?.length || 0 + ' items' // Don't log full items array
    });

    // Use storefront API client instead of admin API client for guest/customer checkout
    const response = await storefrontApiClient.postCustomer('payments/create-checkout', requestPayload);

    // Ensure we return the data
    const result = response.data || response;

    // Store session ID for fallback on order-success page
    if (result.data?.session_id) {
      localStorage.setItem('stripe_session_id', result.data.session_id);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating Stripe checkout:', error);
    console.error('Error response:', error.response);
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