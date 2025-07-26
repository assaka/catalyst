import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Order } from '@/api/entities';
import { OrderItem } from '@/api/entities';
import { Product } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Package, MapPin, Calendar, Clock, MessageCircle, Mail, Phone, Truck } from 'lucide-react';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const sessionId = searchParams.get('session_id');
  
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [orderProducts, setOrderProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
    } else if (sessionId) {
      loadOrderFromSession();
    }
  }, [orderId, sessionId]);

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

  const loadOrderFromSession = async () => {
    try {
      console.log('Loading order from session ID:', sessionId);
      console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
      
      // Use public endpoint to find order by payment reference (session_id)
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/orders/by-payment-reference/${sessionId}`;
      console.log('Fetching order from:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const result = await response.json();
      console.log('Response result:', result);
      
      if (response.ok) {
        if (result.success && result.data) {
          const orderData = result.data;
          console.log('Order data found:', orderData);
          setOrder(orderData);

          const itemsData = await OrderItem.filter({ order_id: orderData.id });
          setOrderItems(itemsData);

          const productIds = [...new Set(itemsData.map(item => item.product_id))];
          const productsData = await Product.filter({ id: { $in: productIds } });
          const productsMap = {};
          productsData.forEach(product => {
            productsMap[product.id] = product;
          });
          setOrderProducts(productsMap);
        } else {
          console.log('No order data in successful response:', result);
        }
      } else {
        console.log('Response not ok:', result);
      }
    } catch (error) {
      console.error('Error loading order from session:', error);
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
      <div className="text-center mb-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-xl text-gray-700 mb-4">Thank you for your purchase. Your order has been successfully placed.</p>
        
        {/* Order Summary Info */}
        <div className="bg-white rounded-lg p-4 max-w-md mx-auto shadow-sm">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Order Number</p>
              <p className="font-bold text-lg text-blue-600">#{order.order_number}</p>
            </div>
            <div>
              <p className="text-gray-500">Order Date</p>
              <p className="font-semibold">
                {new Date(order.created_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-gray-500 text-xs">Total Amount</p>
            <p className="font-bold text-2xl text-green-600">${order.total_amount.toFixed(2)}</p>
          </div>
        </div>
        
        {order.delivery_date && (
          <div className="mt-4 text-blue-700">
            <p className="text-sm font-medium">Expected Delivery</p>
            <p className="text-lg font-semibold">
              {new Date(order.delivery_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}
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
          {(order.delivery_date || order.delivery_time_slot || order.delivery_instructions) && (
            <Card className="material-elevation-1 border-0 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2 text-blue-600" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.delivery_date && (
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Scheduled Delivery Date</p>
                      <p className="text-lg font-semibold text-blue-900">
                        {new Date(order.delivery_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {order.delivery_time_slot && (
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <Clock className="w-5 h-5 mr-3 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Delivery Time Slot</p>
                      <p className="text-lg font-semibold text-green-900">{order.delivery_time_slot}</p>
                    </div>
                  </div>
                )}
                {order.delivery_instructions && (
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-start">
                      <MessageCircle className="w-5 h-5 mr-3 mt-0.5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Special Delivery Instructions</p>
                        <p className="text-amber-900 mt-1 leading-relaxed">{order.delivery_instructions}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Delivery Status Progress */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Delivery Status</p>
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          ['processing', 'shipped', 'complete'].includes(order.status) 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`}></div>
                        <div className={`h-1 flex-1 mx-2 ${
                          ['shipped', 'complete'].includes(order.status)
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}></div>
                        <div className={`w-3 h-3 rounded-full ${
                          ['shipped', 'complete'].includes(order.status)
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}></div>
                        <div className={`h-1 flex-1 mx-2 ${
                          order.status === 'complete'
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}></div>
                        <div className={`w-3 h-3 rounded-full ${
                          order.status === 'complete'
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Confirmed</span>
                        <span>Shipped</span>
                        <span>Delivered</span>
                      </div>
                    </div>
                  </div>
                </div>
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
                  const basePrice = item.unit_price;
                  const customOptions = item.product_attributes?.selected_options || [];
                  const customOptionsTotal = customOptions.reduce((sum, opt) => sum + (opt.price || 0), 0);
                  
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                          <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">${item.total_price.toFixed(2)}</p>
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
                          <span>${item.total_price.toFixed(2)}</span>
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

          {/* Contact Information */}
          <Card className="material-elevation-1 border-0 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">
                If you have any questions about your order or need to make changes, please contact us:
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Email: support@yourstore.com</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Phone: 1-800-123-4567</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Order Reference:</strong> Please have your order number #{order.order_number} ready when contacting us.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Next Steps Section */}
      <div className="mt-12 text-center">
        <Card className="material-elevation-1 border-0 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Happens Next?</h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Processing</h3>
                <p className="text-sm text-gray-600">
                  We'll prepare your order and send you a confirmation email with tracking information.
                </p>
              </div>
              <div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Truck className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Shipping</h3>
                <p className="text-sm text-gray-600">
                  Your order will be carefully packed and shipped to your delivery address.
                </p>
              </div>
              <div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Delivery</h3>
                <p className="text-sm text-gray-600">
                  {order.delivery_date 
                    ? `Expected delivery on ${new Date(order.delivery_date).toLocaleDateString()}`
                    : "You'll receive your order according to the shipping method selected."
                  }
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                A confirmation email has been sent to your email address with all the details.
                You can track your order status in your account dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}