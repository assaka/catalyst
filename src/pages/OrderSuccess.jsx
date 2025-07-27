import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Order } from '@/api/entities';
import { OrderItem } from '@/api/entities';
import { Product } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Package, MapPin, Calendar, Clock, MessageCircle, Mail, Phone, Truck, User as UserIcon, Download, Share2, Copy, CreditCard, Gift, UserPlus } from 'lucide-react';

export default function OrderSuccess() {
  console.log('OrderSuccess component loaded - Version: Comprehensive 2.0');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order');
  let sessionId = searchParams.get('session_id');
  
  // Fallback methods to get session ID
  if (!sessionId) {
    // Try to get from URL hash
    const hash = window.location.hash;
    if (hash.includes('session_id=')) {
      sessionId = hash.split('session_id=')[1]?.split('&')[0];
    }
    
    // Try to get from full URL if it contains session_id
    const fullUrl = window.location.href;
    if (fullUrl.includes('session_id=')) {
      sessionId = fullUrl.split('session_id=')[1]?.split('&')[0];
    }
    
    // Try alternative parameter names
    if (!sessionId) {
      sessionId = searchParams.get('session') || 
                 searchParams.get('checkout_session_id') || 
                 searchParams.get('payment_intent');
    }
  }
  
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [orderProducts, setOrderProducts] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Account creation state
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [accountCreationLoading, setAccountCreationLoading] = useState(false);
  const [accountCreationSuccess, setAccountCreationSuccess] = useState(false);
  const [accountCreationError, setAccountCreationError] = useState('');
  
  // Additional state
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    console.log('OrderSuccess useEffect triggered');
    console.log('orderId:', orderId);
    console.log('sessionId:', sessionId);
    console.log('Current URL:', window.location.href);
    console.log('Search params:', window.location.search);
    
    // Check if user is logged in
    const checkUserStatus = async () => {
      try {
        const userData = await User.me();
        setCurrentUser(userData);
        console.log('User is logged in:', userData);
      } catch (error) {
        console.log('User is not logged in');
        setCurrentUser(null);
      }
    };
    
    checkUserStatus();
    
    if (orderId) {
      console.log('Loading order by orderId:', orderId);
      loadOrderData();
    } else if (sessionId) {
      console.log('Loading order by sessionId:', sessionId);
      loadOrderFromSession();
    } else {
      console.log('No orderId or sessionId found');
      
      // Try to get session ID from localStorage as final fallback
      const storedSessionId = localStorage.getItem('stripe_session_id') || 
                              localStorage.getItem('last_checkout_session');
      
      if (storedSessionId) {
        console.log('Found stored session ID:', storedSessionId);
        // Try to load order with stored session ID
        loadOrderFromStoredSession(storedSessionId);
      } else {
        console.log('No stored session ID found, setting loading to false');
        setLoading(false);
      }
    }
  }, [orderId, sessionId]);

  // Pre-fill account data from order when order loads
  useEffect(() => {
    if (order && !currentUser) {
      // Extract name from billing/shipping address
      const billingAddress = order.billing_address || {};
      const shippingAddress = order.shipping_address || {};
      
      const fullName = billingAddress.name || shippingAddress.name || billingAddress.full_name || shippingAddress.full_name || '';
      const [firstName = '', lastName = ''] = fullName.split(' ');
      
      setAccountFormData(prev => ({
        ...prev,
        firstName: firstName,
        lastName: lastName
      }));
    }
  }, [order, currentUser]);

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

          // Check if order data already includes order items
          if (orderData.OrderItems && Array.isArray(orderData.OrderItems)) {
            console.log('Order items found in order data:', orderData.OrderItems);
            setOrderItems(orderData.OrderItems);
            
            // Extract product info if available
            const productsMap = {};
            orderData.OrderItems.forEach(item => {
              if (item.Product) {
                productsMap[item.product_id] = item.Product;
              }
            });
            setOrderProducts(productsMap);
          } else {
            console.log('No order items in order data, trying separate API call');
            try {
              const itemsData = await OrderItem.filter({ order_id: orderData.id });
              setOrderItems(itemsData);

              const productIds = [...new Set(itemsData.map(item => item.product_id))];
              if (productIds.length > 0) {
                const productsData = await Product.filter({ id: { $in: productIds } });
                const productsMap = {};
                productsData.forEach(product => {
                  productsMap[product.id] = product;
                });
                setOrderProducts(productsMap);
              }
            } catch (itemsError) {
              console.log('Failed to load order items separately:', itemsError);
              // Continue without order items details
            }
          }
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

  const loadOrderFromStoredSession = async (storedSessionId) => {
    try {
      console.log('Loading order from stored session ID:', storedSessionId);
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/orders/by-payment-reference/${storedSessionId}`;
      console.log('Fetching order from stored session:', url);
      
      const response = await fetch(url);
      console.log('Stored session response status:', response.status);
      
      const result = await response.json();
      console.log('Stored session response result:', result);
      
      if (response.ok && result.success && result.data) {
        const orderData = result.data;
        console.log('Order data found from stored session:', orderData);
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
        console.log('No order found with stored session ID');
      }
    } catch (error) {
      console.error('Error loading order from stored session:', error);
    } finally {
      setLoading(false);
    }
  };

  // Account creation functionality
  const handleAccountCreation = async (e) => {
    e.preventDefault();
    setAccountCreationLoading(true);
    setAccountCreationError('');

    // Validation
    if (!accountFormData.firstName.trim() || !accountFormData.lastName.trim()) {
      setAccountCreationError('First and last name are required');
      setAccountCreationLoading(false);
      return;
    }

    if (accountFormData.password.length < 6) {
      setAccountCreationError('Password must be at least 6 characters');
      setAccountCreationLoading(false);
      return;
    }

    if (accountFormData.password !== accountFormData.confirmPassword) {
      setAccountCreationError('Passwords do not match');
      setAccountCreationLoading(false);
      return;
    }

    if (!accountFormData.acceptTerms) {
      setAccountCreationError('Please accept the terms and conditions');
      setAccountCreationLoading(false);
      return;
    }

    try {
      // Create user account
      const userData = {
        name: `${accountFormData.firstName} ${accountFormData.lastName}`,
        email: order.customer_email,
        password: accountFormData.password,
        billing_address: order.billing_address,
        shipping_address: order.shipping_address
      };

      await User.create(userData);
      setAccountCreationSuccess(true);
      setShowAccountCreation(false);
      
      // Auto-login the user
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (error) {
      console.error('Account creation error:', error);
      setAccountCreationError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setAccountCreationLoading(false);
    }
  };

  // Utility functions
  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOrder = () => {
    if (navigator.share) {
      navigator.share({
        title: `Order ${order.order_number}`,
        text: `I just completed my order ${order.order_number} for $${parseFloat(order.total_amount || 0).toFixed(2)}`,
        url: window.location.href
      });
    }
  };

  const downloadInvoice = () => {
    // Implement invoice download functionality
    console.log('Download invoice for order:', order.order_number);
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return null;
    
    const parts = [
      address.name || address.full_name,
      address.line1 || address.street || address.address,
      address.line2,
      `${address.city || ''} ${address.state || ''} ${address.postal_code || address.zip || ''}`.trim(),
      address.country
    ].filter(Boolean);
    
    return parts;
  };

  // Status color helper
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      complete: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    // If we have a session ID but no order found, show a generic success message
    if (sessionId) {
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-xl text-gray-700 mb-4">Thank you for your purchase. Your order has been successfully processed.</p>
            <div className="bg-white rounded-lg p-4 max-w-md mx-auto shadow-sm">
              <p className="text-sm text-gray-500">Session ID</p>
              <p className="font-mono text-sm text-blue-600">{sessionId}</p>
            </div>
            <div className="mt-6">
              <p className="text-sm text-gray-600">You should receive a confirmation email shortly.</p>
              <p className="text-sm text-gray-600">If you need assistance, please contact support with the session ID above.</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Order not found</h1>
        <p className="text-gray-600 mt-2">Please check your email for order confirmation or contact support.</p>
      </div>
    );
  }

  // Currency formatting helper
  const formatCurrency = (amount, currency) => {
    if (!amount) return currency && currency !== 'USD' ? `${currency} 0.00` : '$0.00';
    const formattedAmount = parseFloat(amount).toFixed(2);
    return currency && currency !== 'USD' ? `${currency} ${formattedAmount}` : `$${formattedAmount}`;
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    complete: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <CheckCircle className="w-24 h-24 text-green-500" />
                <div className="absolute -top-2 -right-2 bg-green-100 rounded-full p-2">
                  <Gift className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Thank You!</h1>
            <p className="text-xl text-gray-600 mb-4">Your order has been successfully placed and is being processed.</p>
            
            {/* Order Number and Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg px-6 py-3 flex items-center gap-2">
                <span className="text-sm text-gray-500">Order Number:</span>
                <span className="font-mono font-bold text-lg text-blue-600">{order.order_number}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyOrderNumber}
                  className="ml-2 h-8 w-8 p-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                {copied && <span className="text-xs text-green-600">Copied!</span>}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={downloadInvoice} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>
              <Button onClick={shareOrder} variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {!currentUser && (
                <Button 
                  onClick={() => setShowAccountCreation(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  Create Account
                </Button>
              )}
            </div>
          </div>

          {/* Account Creation Success Alert */}
          {accountCreationSuccess && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Account created successfully! You'll be redirected to your dashboard shortly.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card className="shadow-md">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2 text-blue-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {order.currency && order.currency !== 'USD' ? 
                        `${order.currency} ${parseFloat(order.total_amount || 0).toFixed(2)}` : 
                        `$${parseFloat(order.total_amount || 0).toFixed(2)}`
                      }
                    </div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{orderItems.length}</div>
                    <div className="text-sm text-gray-500">Items</div>
                  </div>
                  <div className="text-center">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <div className="text-sm text-gray-500 mt-1">Status</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {(() => {
                        const dateStr = order.created_date || order.createdAt;
                        if (!dateStr) return 'N/A';
                        const date = new Date(dateStr);
                        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                      })()}
                    </div>
                    <div className="text-sm text-gray-500">Date</div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">Payment Method</div>
                      <div className="text-sm text-gray-500">
                        {order.payment_method === 'stripe' ? 'Credit Card via Stripe' : order.payment_method}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {order.payment_status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            {(order.delivery_date || order.delivery_time_slot || order.delivery_instructions || order.shipping_method_name) && (
              <Card className="shadow-md">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-green-600" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {order.shipping_method_name && (
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <Package className="w-5 h-5 mr-3 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800">Shipping Method</p>
                        <p className="text-blue-900">{order.shipping_method_name}</p>
                        {parseFloat(order.shipping_cost || 0) > 0 && (
                          <p className="text-sm text-blue-700">Cost: ${parseFloat(order.shipping_cost).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {order.delivery_date && (
                    <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                      <Calendar className="w-5 h-5 mr-3 text-purple-600" />
                      <div>
                        <p className="font-medium text-purple-800">Scheduled Delivery Date</p>
                        <p className="text-lg font-semibold text-purple-900">
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
                        <p className="font-medium text-green-800">Delivery Time Slot</p>
                        <p className="text-lg font-semibold text-green-900">{order.delivery_time_slot}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.delivery_instructions && (
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-start">
                        <MessageCircle className="w-5 h-5 mr-3 mt-0.5 text-amber-600" />
                        <div>
                          <p className="font-medium text-amber-800">Special Delivery Instructions</p>
                          <p className="text-amber-900 mt-1">{order.delivery_instructions}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card className="shadow-md">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>Items Ordered ({orderItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {orderItems.map((item, index) => {
                    const product = orderProducts[item.product_id];
                    const basePrice = parseFloat(item.unit_price || 0);
                    const customOptions = item.product_attributes?.selected_options || [];
                    const customOptionsTotal = customOptions.reduce((sum, opt) => sum + parseFloat(opt.price || 0), 0);
                    
                    return (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">{item.product_name}</h4>
                            <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-sm text-gray-600">Quantity: {item.quantity}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">${parseFloat(item.total_price || 0).toFixed(2)}</p>
                            <p className="text-sm text-gray-500">Total</p>
                          </div>
                        </div>
                        
                        {/* Price Breakdown */}
                        {customOptions.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3 mt-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">Price Breakdown:</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Base Price (per item):</span>
                                <span>${(basePrice - customOptionsTotal).toFixed(2)}</span>
                              </div>
                              {customOptions.map((option, optIndex) => (
                                <div key={optIndex} className="flex justify-between text-gray-600">
                                  <span>• {option.name}:</span>
                                  <span>+${parseFloat(option.price || 0).toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between font-medium pt-1 border-t border-gray-200">
                                <span>Price per item:</span>
                                <span>${basePrice.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-bold">
                                <span>Total ({item.quantity} items):</span>
                                <span>${parseFloat(item.total_price || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary & Details */}
          <div className="space-y-6">{/* Order Summary Info */}
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
            <p className="font-bold text-2xl text-green-600">{formatCurrency(order.total_amount, order.currency)}</p>
          </div>
        </div>
        
      </div>

      {/* Order Summary */}
      <div className="max-w-md mx-auto">
          <Card className="material-elevation-1 border-0">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatCurrency(order.shipping_cost, order.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(order.tax_amount, order.currency)}</span>
              </div>
              {parseFloat(order.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount_amount, order.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount, order.currency)}</span>
              </div>
            </CardContent>
          </Card>


      </div>
    </div>
  );
}