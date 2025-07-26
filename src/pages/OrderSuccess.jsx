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
                    <div className="text-2xl font-bold text-blue-600">${parseFloat(order.total_amount || 0).toFixed(2)}</div>
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
                      {new Date(order.created_date || order.createdAt).toLocaleDateString()}
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
            <p className="font-bold text-2xl text-green-600">${parseFloat(order.total_amount || 0).toFixed(2)}</p>
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
                  <p className="font-semibold text-lg">${parseFloat(order.total_amount || 0).toFixed(2)}</p>
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
                          <p className="font-semibold text-lg">${parseFloat(item.total_price || 0).toFixed(2)}</p>
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
                <span>${parseFloat(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${parseFloat(order.shipping_cost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${parseFloat(order.tax_amount || 0).toFixed(2)}</span>
              </div>
              {parseFloat(order.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${parseFloat(order.discount_amount || 0).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${parseFloat(order.total_amount || 0).toFixed(2)}</span>
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

          {/* Billing Address */}
          {order.billing_address && (
            <Card className="material-elevation-1 border-0 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.billing_address.name || order.billing_address.full_name}</p>
                  <p>{order.billing_address.line1 || order.billing_address.street || order.billing_address.address}</p>
                  {(order.billing_address.line2 || order.billing_address.address_line2) && (
                    <p>{order.billing_address.line2 || order.billing_address.address_line2}</p>
                  )}
                  <p>{order.billing_address.city}, {order.billing_address.state || order.billing_address.province} {order.billing_address.postal_code || order.billing_address.zip}</p>
                  <p>{order.billing_address.country}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guest Account Creation */}
          {!currentUser && (
            <Card className="material-elevation-1 border-0 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Save your information for faster checkout next time and track your orders easily.
                </p>
                
                {!showCreateAccount ? (
                  <Button 
                    onClick={() => setShowCreateAccount(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Account with Order Details
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={accountFormData.firstName}
                          onChange={(e) => setAccountFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={accountFormData.lastName}
                          onChange={(e) => setAccountFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={accountFormData.email}
                        onChange={(e) => setAccountFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Email address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={accountFormData.password}
                        onChange={(e) => setAccountFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Create a password"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={accountFormData.confirmPassword}
                        onChange={(e) => setAccountFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm password"
                      />
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="accept-terms"
                        checked={accountFormData.acceptTerms}
                        onChange={(e) => setAccountFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="accept-terms" className="text-sm text-gray-600">
                        I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
                        <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                      </label>
                    </div>
                    
                    {accountCreationError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{accountCreationError}</p>
                      </div>
                    )}
                    
                    {accountCreationSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-600">Account created successfully! You can now log in.</p>
                      </div>
                    )}
                    
                    <div className="flex space-x-3">
                      <Button
                        onClick={handleCreateAccount}
                        disabled={creatingAccount}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {creatingAccount ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Create Account
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowCreateAccount(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
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