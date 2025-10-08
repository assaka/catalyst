/**
 * Success/Order Confirmation Slot Components
 * Unified components for order success page
 */

import React from 'react';
import { createSlotComponent, registerSlotComponent } from './SlotComponentRegistry';

/**
 * OrderDetailsSlot - Display order details and items
 */
const OrderDetailsSlot = createSlotComponent({
  name: 'OrderDetailsSlot',
  render: ({ slot, context, variableContext }) => {
    const order = variableContext?.order || null;
    const orderItems = order?.items || [];

    if (!order) {
      return null;
    }

    return (
      <div className={slot.className} style={slot.styles}>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order #{order.id || '12345'}</h2>

          {/* Order Items */}
          <div className="space-y-4 mb-6">
            {orderItems.length > 0 ? (
              orderItems.map((item, index) => (
                <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                  <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name || 'Product Name'}</h3>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity || 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">${(item.price || 0).toFixed(2)} each</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-600">
                <p>No items in this order</p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">${(order.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="text-gray-900">${(order.shipping || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="text-gray-900">${(order.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-green-600">${(order.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

/**
 * OrderSummarySlot - Compact order summary
 */
const OrderSummarySlot = createSlotComponent({
  name: 'OrderSummarySlot',
  render: ({ slot, context, variableContext }) => {
    const order = variableContext?.order || null;

    if (!order) {
      return null;
    }

    return (
      <div className={slot.className} style={slot.styles}>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Order Number</span>
            <span className="font-medium text-gray-900">#{order.id || '12345'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Order Date</span>
            <span className="text-gray-900">{order.date || new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total</span>
            <span className="font-medium text-green-600">${(order.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }
});

/**
 * ShippingDetailsSlot - Display shipping information
 */
const ShippingDetailsSlot = createSlotComponent({
  name: 'ShippingDetailsSlot',
  render: ({ slot, context, variableContext }) => {
    const shipping = variableContext?.shipping || {};

    return (
      <div className={slot.className} style={slot.styles}>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-900">{shipping.name || 'John Doe'}</p>
            <p>{shipping.address || '123 Main Street'}</p>
            <p>{shipping.city || 'New York'}, {shipping.state || 'NY'} {shipping.zip || '10001'}</p>
            <p>{shipping.country || 'United States'}</p>
          </div>
          {shipping.method && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">Shipping Method</p>
              <p className="font-medium text-gray-900">{shipping.method}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
});

/**
 * PaymentDetailsSlot - Display payment information
 */
const PaymentDetailsSlot = createSlotComponent({
  name: 'PaymentDetailsSlot',
  render: ({ slot, context, variableContext }) => {
    const payment = variableContext?.payment || {};

    return (
      <div className={slot.className} style={slot.styles}>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-900">{payment.method || 'Credit Card'}</p>
            {payment.last4 && (
              <p>•••• •••• •••• {payment.last4}</p>
            )}
            {payment.status && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">Payment Status</p>
                <p className="font-medium text-green-600">{payment.status}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
});

/**
 * OrderTrackingSlot - Display order tracking information
 */
const OrderTrackingSlot = createSlotComponent({
  name: 'OrderTrackingSlot',
  render: ({ slot, context, variableContext }) => {
    const tracking = variableContext?.tracking || {};

    return (
      <div className={slot.className} style={slot.styles}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Track Your Order</h3>
          {tracking.number ? (
            <div>
              <p className="text-sm text-blue-800 mb-2">Tracking Number: {tracking.number}</p>
              <p className="text-sm text-blue-700">Carrier: {tracking.carrier || 'USPS'}</p>
              {tracking.url && (
                <a href={tracking.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Track Package →
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-blue-800">Tracking information will be available once your order ships.</p>
          )}
        </div>
      </div>
    );
  }
});

// Register all components
registerSlotComponent('OrderDetailsSlot', OrderDetailsSlot);
registerSlotComponent('OrderSummarySlot', OrderSummarySlot);
registerSlotComponent('ShippingDetailsSlot', ShippingDetailsSlot);
registerSlotComponent('PaymentDetailsSlot', PaymentDetailsSlot);
registerSlotComponent('OrderTrackingSlot', OrderTrackingSlot);

export {
  OrderDetailsSlot,
  OrderSummarySlot,
  ShippingDetailsSlot,
  PaymentDetailsSlot,
  OrderTrackingSlot
};
