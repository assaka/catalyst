import { base44 } from './base44Client';


export const createPaymentIntent = base44.functions.createPaymentIntent;

export const createStripeCheckout = base44.functions.createStripeCheckout;

export const stripeWebhook = base44.functions.stripeWebhook;

export const createStripeConnectLink = base44.functions.createStripeConnectLink;

export const checkStripeConnectStatus = base44.functions.checkStripeConnectStatus;

export const getStripePublishableKey = base44.functions.getStripePublishableKey;

