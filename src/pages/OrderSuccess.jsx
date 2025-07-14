import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Order } from '@/api/entities';
import { OrderItem } from '@/api/entities';
import { Product } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Package, MapPin, Calendar, Clock, MessageCircle } from 'lucide-react';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [orderProducts, setOrderProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
    }
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      const orderData = await Order.get(orderId);
      setOrder(orderData);

      const itemsData = await OrderItem.filter({ order_id: orderId });
      setOrderItems(itemsData);

      const productIds = [...new Set(itemsData.map(item => item.product_id))];
      const productsData = await Product.filter({ id: { $in: productIds } });
      const productsMap = {};
      productsData.forEach(product => {
        productsMap[product.id] = product;
      });
      setOrderProducts(productsMap);
    } catch (error) {
      console.error('Error loading order data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Order not found</h1>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    complete: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Success Header */}
      <div className="text-center mb-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">Order Confirmed!</h1>
        <p className="text-gray-600 mt-2">Thank you for your purchase. Your order has been received.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2">
          <Card className="material-elevation-1 border-0">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-semibold">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={statusColors[order.status]}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-semibold">{new Date(order.created_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-semibold text-lg">${order.total_amount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          {(order.delivery_date || order.delivery_time_slot || order.delivery_comments) && (
            <Card className="material-elevation-1 border-0 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.delivery_date && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Delivery Date</p>
                      <p className="font-medium">{new Date(order.delivery_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {order.delivery_time_slot && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Time Slot</p>
                      <p className="font-medium">{order.delivery_time_slot}</p>
                    </div>
                  </div>
                )}
                {order.delivery_comments && (
                  <div className="flex items-start">
                    <MessageCircle className="w-4 h-4 mr-2 mt-1 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Special Instructions</p>
                      <p className="font-medium">{order.delivery_comments}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Items Ordered with Detailed Breakdown */}
          <Card className="material-elevation-1 border-0 mt-6">
            <CardHeader>
              <CardTitle>Items Ordered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {orderItems.map((item, index) => {
                  const product = orderProducts[item.product_id];
                  const basePrice = item.price;
                  const customOptions = item.selected_options || [];
                  const customOptionsTotal = customOptions.reduce((sum, opt) => sum + (opt.price || 0), 0);
                  
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                          <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">${item.total.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {/* Price Breakdown */}
                      <div className="bg-gray-50 rounded p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Base Price per item:</span>
                          <span>${basePrice.toFixed(2)}</span>
                        </div>
                        
                        {customOptions.length > 0 && (
                          <>
                            <div className="text-sm font-medium text-gray-700 pt-2">Custom Options:</div>
                            {customOptions.map((option, optIndex) => (
                              <div key={optIndex} className="flex justify-between text-sm text-gray-600 pl-4">
                                <span>• {option.name}</span>
                                <span>+${(option.price || 0).toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-sm font-medium pt-1 border-t border-gray-200">
                              <span>Options Total per item:</span>
                              <span>+${customOptionsTotal.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        
                        <div className="flex justify-between text-sm font-medium pt-1 border-t border-gray-200">
                          <span>Price per item (incl. options):</span>
                          <span>${(basePrice + customOptionsTotal).toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between font-semibold pt-1 border-t border-gray-300">
                          <span>Total for {item.quantity} item(s):</span>
                          <span>${item.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="material-elevation-1 border-0">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${order.shipping_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${order.tax_amount.toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${order.total_amount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {order.shipping_address && (
            <Card className="material-elevation-1 border-0 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.street}</p>
                  <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                  <p>{order.shipping_address.country}</p>
                  {order.shipping_address.phone && <p>Phone: {order.shipping_address.phone}</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}