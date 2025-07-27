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
import { 
  CheckCircle, 
  Package, 
  MapPin, 
  CreditCard, 
  Mail, 
  Phone, 
  Truck, 
  UserPlus, 
  Download,
  Share2,
  Calendar,
  Clock,
  ShoppingBag,
  Info
} from 'lucide-react';

export default function OrderSuccess() {
  console.log('OrderSuccess component loaded - Version: Modern 3.0');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get session ID from URL
  let sessionId = searchParams.get('session_id');
  
  // Fallback methods to get session ID
  if (!sessionId) {
    const hash = window.location.hash;
    if (hash.includes('session_id=')) {
      sessionId = hash.split('session_id=')[1]?.split('&')[0];
    }
    
    if (!sessionId && window.location.href.includes('session_id=')) {
      sessionId = window.location.href.split('session_id=')[1]?.split('&')[0];
    }
    
    if (!sessionId) {
      sessionId = localStorage.getItem('stripe_session_id');
    }
  }

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Guest account creation state
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountCreationError, setAccountCreationError] = useState('');
  const [accountCreationSuccess, setAccountCreationSuccess] = useState(false);

  // Currency formatting helper
  const formatCurrency = (amount, currency) => {
    if (!amount) return currency && currency !== 'USD' ? `${currency} 0.00` : '$0.00';
    const formattedAmount = parseFloat(amount).toFixed(2);
    return currency && currency !== 'USD' ? `${currency} ${formattedAmount}` : `$${formattedAmount}`;
  };

  // Date formatting helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  // Load order data
  useEffect(() => {
    const loadOrder = async () => {
      if (!sessionId) {
        console.log('No session ID found');
        setLoading(false);
        return;
      }

      try {
        console.log('Loading order from session ID:', sessionId);
        const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiUrl}/api/orders/by-payment-reference/${sessionId}`);
        const result = await response.json();
        
        if (response.ok && result.success && result.data) {
          const orderData = result.data;
          console.log('Order data loaded:', orderData);
          setOrder(orderData);
          
          // Pre-fill account form if guest
          if (orderData.customer_email) {
            setAccountFormData(prev => ({
              ...prev,
              email: orderData.customer_email
            }));
          }
        } else {
          console.error('Failed to load order:', result);
        }
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [sessionId]);

  // Handle account creation
  const handleCreateAccount = async () => {
    setAccountCreationError('');
    
    // Validate form
    if (!accountFormData.firstName.trim() || !accountFormData.lastName.trim()) {
      setAccountCreationError('Please enter your first and last name.');
      return;
    }
    
    if (!accountFormData.email.trim()) {
      setAccountCreationError('Please enter your email address.');
      return;
    }
    
    if (accountFormData.password.length < 6) {
      setAccountCreationError('Password must be at least 6 characters long.');
      return;
    }
    
    if (accountFormData.password !== accountFormData.confirmPassword) {
      setAccountCreationError('Passwords do not match.');
      return;
    }
    
    if (!accountFormData.acceptTerms) {
      setAccountCreationError('Please accept the terms and conditions.');
      return;
    }

    setCreatingAccount(true);
    
    try {
      const response = await User.create({
        first_name: accountFormData.firstName,
        last_name: accountFormData.lastName,
        email: accountFormData.email,
        password: accountFormData.password,
      });
      
      setAccountCreationSuccess(true);
      setShowCreateAccount(false);
      
      setTimeout(() => {
        navigate('/auth?tab=login');
      }, 2000);
      
    } catch (error) {
      console.error('Account creation error:', error);
      setAccountCreationError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setCreatingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600">Please check your email for order confirmation or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Success Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full mb-6 shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-xl text-gray-600 mb-4">Your order has been successfully placed</p>
          <div className="inline-flex items-center space-x-4 bg-white rounded-full px-6 py-3 shadow-md">
            <span className="text-sm text-gray-500">Order Number:</span>
            <span className="font-bold text-green-600 text-lg">#{order.order_number}</span>
            <Button variant="ghost" size="sm" className="p-1">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Account Creation Success Alert */}
        {accountCreationSuccess && (
          <Alert className="mb-8 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Account created successfully! You'll be redirected to login shortly.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Order Summary Card */}
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                <CardTitle className="flex items-center text-gray-900">
                  <ShoppingBag className="w-5 h-5 mr-2 text-blue-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {formatCurrency(order.total_amount, order.currency)}
                    </div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      {formatDate(order.created_date || order.createdAt)}
                    </div>
                    <p className="text-sm text-gray-500">Order Date</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">Status</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1)}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">Payment</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Breakdown */}
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Package className="w-5 h-5 mr-2 text-green-600" />
                  Order Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(order.subtotal, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">{formatCurrency(order.shipping_cost, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">{formatCurrency(order.tax_amount, order.currency)}</span>
                  </div>
                  {parseFloat(order.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-medium">-{formatCurrency(order.discount_amount, order.currency)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green-600">{formatCurrency(order.total_amount, order.currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What Happens Next */}
            <Card className="shadow-sm border-0 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Info className="w-5 h-5 mr-2 text-blue-600" />
                  What Happens Next?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Order Processing</h3>
                    <p className="text-sm text-gray-600">
                      We'll prepare your order and send you a confirmation email with tracking information.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Truck className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Shipping</h3>
                    <p className="text-sm text-gray-600">
                      Your order will be carefully packed and shipped to your delivery address.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Delivery</h3>
                    <p className="text-sm text-gray-600">
                      You'll receive your order according to the shipping method selected.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    A confirmation email has been sent to{' '}
                    <span className="font-medium text-gray-900">{order.customer_email}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Secondary Info */}
          <div className="space-y-6">
            
            {/* Shipping Address */}
            {order.shipping_address && (
              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <MapPin className="w-5 h-5 mr-2 text-green-600" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-gray-900">
                      {order.shipping_address.full_name || order.shipping_address.name}
                    </p>
                    <p className="text-gray-600">
                      {order.shipping_address.street || order.shipping_address.line1 || order.shipping_address.address}
                    </p>
                    {(order.shipping_address.line2 || order.shipping_address.address_line2) && (
                      <p className="text-gray-600">
                        {order.shipping_address.line2 || order.shipping_address.address_line2}
                      </p>
                    )}
                    <p className="text-gray-600">
                      {order.shipping_address.city}, {order.shipping_address.state || order.shipping_address.province}{' '}
                      {order.shipping_address.postal_code || order.shipping_address.zip}
                    </p>
                    <p className="text-gray-600">{order.shipping_address.country}</p>
                    {order.shipping_address.phone && (
                      <p className="text-gray-600">Phone: {order.shipping_address.phone}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billing Address */}
            {order.billing_address && (
              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-gray-900">
                      {order.billing_address.name || order.billing_address.full_name}
                    </p>
                    <p className="text-gray-600">
                      {order.billing_address.line1 || order.billing_address.street || order.billing_address.address}
                    </p>
                    {(order.billing_address.line2 || order.billing_address.address_line2) && (
                      <p className="text-gray-600">
                        {order.billing_address.line2 || order.billing_address.address_line2}
                      </p>
                    )}
                    <p className="text-gray-600">
                      {order.billing_address.city}, {order.billing_address.state || order.billing_address.province}{' '}
                      {order.billing_address.postal_code || order.billing_address.zip}
                    </p>
                    <p className="text-gray-600">{order.billing_address.country}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guest Account Creation */}
            <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                  Create Account
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Save your information for faster checkout next time and track your orders easily.
                </p>
                
                {!showCreateAccount ? (
                  <Button 
                    onClick={() => setShowCreateAccount(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Account
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={accountFormData.firstName}
                          onChange={(e) => setAccountFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="mt-1"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={accountFormData.lastName}
                          onChange={(e) => setAccountFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="mt-1"
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={accountFormData.email}
                        onChange={(e) => setAccountFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1"
                        placeholder="Email address"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="password" className="text-xs font-medium text-gray-700">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={accountFormData.password}
                        onChange={(e) => setAccountFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="mt-1"
                        placeholder="Create a password"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700">
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={accountFormData.confirmPassword}
                        onChange={(e) => setAccountFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="mt-1"
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
                      <Label htmlFor="accept-terms" className="text-xs text-gray-600">
                        I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms</a> and{' '}
                        <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                      </Label>
                    </div>
                    
                    {accountCreationError && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-600 text-xs">
                          {accountCreationError}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleCreateAccount}
                        disabled={creatingAccount}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        {creatingAccount ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowCreateAccount(false)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Mail className="w-5 h-5 mr-2 text-green-600" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Have questions about your order? We're here to help!
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-3 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Email Support</p>
                      <p className="text-gray-600">support@yourstore.com</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 mr-3 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Phone Support</p>
                      <p className="text-gray-600">1-800-123-4567</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Order Reference:</strong> #{order.order_number}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}