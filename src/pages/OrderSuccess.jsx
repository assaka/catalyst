import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Order } from '@/api/entities';
import { OrderItem } from '@/api/entities';
import { Product } from '@/api/entities';
import { Auth } from '@/api/entities';
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
  UserPlus, 
  Truck,
  ShoppingBag,
  Info
} from 'lucide-react';

export default function OrderSuccess() {
  console.log('OrderSuccess component loaded hamid - Version: Simplified Layout 4.0');
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
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Account creation state - simplified to password only
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountCreationError, setAccountCreationError] = useState('');
  const [accountCreationSuccess, setAccountCreationSuccess] = useState(false);

  // Currency formatting helper
  const formatCurrency = (amount, currency) => {
    if (!amount || amount === null || amount === undefined) return currency && currency !== 'USD' ? `${currency} 0.00` : '$0.00';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return currency && currency !== 'USD' ? `${currency} 0.00` : '$0.00';
    const formattedAmount = numAmount.toFixed(2);
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
          console.log('Full order data loaded:', JSON.stringify(orderData, null, 2));
          setOrder(orderData);
          
          // Set order items from order data - check multiple possible keys
          console.log('🔍 Order data structure debug:', {
            hasOrderItems: !!orderData.OrderItems,
            orderItemsType: typeof orderData.OrderItems,
            orderItemsLength: orderData.OrderItems?.length,
            hasOrderitemset: !!orderData.OrderItemSet,
            hasItems: !!orderData.items,
            availableKeys: Object.keys(orderData),
            sampleOrderItem: orderData.OrderItems?.[0] || orderData.items?.[0],
            // Add more detailed inspection
            orderData_keys: Object.keys(orderData || {}),
            orderData_dataValues_keys: Object.keys(orderData?.dataValues || {}),
            rawOrderItems: orderData.OrderItems,
            rawItems: orderData.items
          });
          
          // Try different possible keys for order items
          let items = orderData.OrderItems || orderData.items || orderData.orderItems || [];
          
          if (items && Array.isArray(items) && items.length > 0) {
            console.log('✅ Setting order items:', items.length, 'items found');
            console.log('🔍 Sample order item structure:', items[0]);
            setOrderItems(items);
          } else {
            console.log('❌ No order items found in any expected location');
            console.log('🔍 Full order data for debugging:', JSON.stringify(orderData, null, 2));
            
            // If no items found, try to reload the data after a short delay
            // This handles the case where order items might still be being created
            console.log('🔄 Attempting to reload order data in 2 seconds...');
            setTimeout(async () => {
              try {
                console.log('🔄 Retrying order data fetch...');
                const retryResponse = await fetch(`${apiUrl}/api/orders/by-payment-reference/${sessionId}`);
                const retryResult = await retryResponse.json();
                
                if (retryResponse.ok && retryResult.success && retryResult.data) {
                  const retryOrderData = retryResult.data;
                  console.log('🔄 Retry order data:', JSON.stringify(retryOrderData, null, 2));
                  
                  const retryItems = retryOrderData.OrderItems || retryOrderData.items || retryOrderData.orderItems || [];
                  if (retryItems && Array.isArray(retryItems) && retryItems.length > 0) {
                    console.log('✅ Found items on retry:', retryItems.length, 'items');
                    setOrderItems(retryItems);
                    setOrder(retryOrderData); // Update order data too
                  } else {
                    console.log('❌ Still no items found on retry');
                    setOrderItems([]);
                  }
                } else {
                  console.log('❌ Retry fetch failed');
                }
              } catch (retryError) {
                console.error('❌ Error during retry fetch:', retryError);
              }
            }, 2000);
            
            setOrderItems([]);
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
    if (accountFormData.password.length < 6) {
      setAccountCreationError('Password must be at least 6 characters long.');
      return;
    }
    
    if (accountFormData.password !== accountFormData.confirmPassword) {
      setAccountCreationError('Passwords do not match.');
      return;
    }

    setCreatingAccount(true);
    
    try {
      // Extract comprehensive details from order data
      const shippingAddr = order.shipping_address || {};
      const billingAddr = order.billing_address || {};
      
      // Extract name - try multiple sources
      let customerName = '';
      if (shippingAddr.name || shippingAddr.full_name) {
        customerName = shippingAddr.name || shippingAddr.full_name;
      } else if (billingAddr.name || billingAddr.full_name) {
        customerName = billingAddr.name || billingAddr.full_name;
      } else if (order.customer_name) {
        customerName = order.customer_name;
      }
      
      const nameParts = customerName.trim().split(' ');
      let firstName = nameParts[0] || '';
      let lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      // Only use defaults if we truly have no name data
      if (!firstName) firstName = 'Customer';
      if (!lastName) lastName = 'User';
      
      // Extract phone number
      const phone = order.customer_phone || shippingAddr.phone || billingAddr.phone || '';
      
      // Create registration payload with address details
      const registrationData = {
        first_name: firstName,
        last_name: lastName,
        email: order.customer_email,
        password: accountFormData.password,
        phone: phone,
        role: 'customer',
        send_welcome_email: true,
        // Add address information for profile
        address_data: {
          shipping_address: {
            street: shippingAddr.line1 || shippingAddr.street || '',
            street2: shippingAddr.line2 || '',
            city: shippingAddr.city || '',
            state: shippingAddr.state || shippingAddr.province || '',
            postal_code: shippingAddr.postal_code || shippingAddr.zip || '',
            country: shippingAddr.country || ''
          },
          billing_address: {
            street: billingAddr.line1 || billingAddr.street || '',
            street2: billingAddr.line2 || '',
            city: billingAddr.city || '',
            state: billingAddr.state || billingAddr.province || '',
            postal_code: billingAddr.postal_code || billingAddr.zip || '',
            country: billingAddr.country || ''
          }
        }
      };
      
      console.log('Creating account with data:', registrationData);
      const response = await Auth.register(registrationData);
      
      setAccountCreationSuccess(true);
      setShowCreateAccount(false);
      
      // Don't redirect to auth - just show success message
      
    } catch (error) {
      console.error('Account creation error:', error);
      setAccountCreationError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setCreatingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-lg text-gray-600 mb-4">Your order has been successfully placed</p>
          <p className="text-sm text-gray-500 mb-4">Order Number: <span className="font-semibold text-gray-900">#{order.order_number}</span></p>
          
          {/* Download Invoice Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Create simple invoice content
              const invoiceContent = `
                INVOICE
                Order #${order.order_number}
                Date: ${formatDate(order.created_date || order.createdAt)}
                
                Customer: ${order.customer_email}
                
                Items:
                ${orderItems.map(item => 
                  `${item.product_name} x${item.quantity} - ${formatCurrency(item.total_price, order.currency)}`
                ).join('\n                ')}
                
                Subtotal: ${formatCurrency(order.subtotal, order.currency)}
                Shipping${order.shipping_method ? ` (${order.shipping_method})` : ''}: ${formatCurrency(order.shipping_amount || order.shipping_cost, order.currency)}
                Tax: ${formatCurrency(order.tax_amount, order.currency)}
                ${parseFloat(order.discount_amount || 0) > 0 ? `Discount: -${formatCurrency(order.discount_amount, order.currency)}\n                ` : ''}Total: ${formatCurrency(order.total_amount, order.currency)}
              `;
              
              const blob = new Blob([invoiceContent], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `invoice-${order.order_number}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            📄 Download Invoice
          </Button>
        </div>

        {/* Account Creation Success Alert */}
        {accountCreationSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Account created successfully! A welcome email has been sent to {order.customer_email}. Your shipping and billing addresses have been saved to your profile. You can now log in to track your orders.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-6">
            
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2 text-blue-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-semibold">#{order.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-semibold">{formatDate(order.created_date || order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-semibold capitalize">{order.payment_method || 'Card'}</span>
                  </div>
                  {order.delivery_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Date:</span>
                      <span className="font-semibold">{formatDate(order.delivery_date)}</span>
                    </div>
                  )}
                  {order.delivery_time_slot && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Time:</span>
                      <span className="font-semibold">{order.delivery_time_slot}</span>
                    </div>
                  )}
                  {order.shipping_method && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Method:</span>
                      <span className="font-semibold">{order.shipping_method}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2 text-green-600" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderItems.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="mb-4">
                      <p className="text-gray-500">Order items are being processed...</p>
                      <p className="text-xs text-gray-400 mt-1">Your order was successful and will be fulfilled.</p>
                    </div>
                    
                    {/* Fallback order info */}
                    <div className="bg-blue-50 p-3 rounded-lg text-left">
                      <h4 className="font-medium text-blue-900 mb-2">Order Details</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>Total Amount:</strong> {formatCurrency(order.total_amount, order.currency)}</p>
                        {order.subtotal && (
                          <p><strong>Subtotal:</strong> {formatCurrency(order.subtotal, order.currency)}</p>
                        )}
                        {parseFloat(order.shipping_amount || 0) > 0 && (
                          <p><strong>Shipping:</strong> {formatCurrency(order.shipping_amount, order.currency)}</p>
                        )}
                        {parseFloat(order.discount_amount || 0) > 0 && (
                          <p><strong>Discount:</strong> -{formatCurrency(order.discount_amount, order.currency)}</p>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-3">Debug: OrderItems={JSON.stringify(order?.OrderItems?.length || 'undefined')}</p>
                    
                    {order && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          console.log('Attempting to reload order items...');
                          console.log('Current order data:', order);
                          // Try to reload order data
                          window.location.reload();
                        }}
                      >
                        🔄 Reload Order Items
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Table Header */}
                    <div className="min-w-full">
                      <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-gray-100 rounded-t-lg text-sm font-medium text-gray-700">
                        <div className="col-span-5">Product</div>
                        <div className="col-span-2 text-center">Qty</div>
                        <div className="col-span-3 text-right">Unit Price</div>
                        <div className="col-span-2 text-right">Total</div>
                      </div>
                      
                      {/* Table Rows */}
                      {orderItems.map((item, index) => {
                        // Calculate base unit price and options price
                        const quantity = Math.max(1, parseFloat(item.quantity) || 1);
                        const totalPrice = parseFloat(item.total_price) || (parseFloat(item.unit_price || item.price || 0) * quantity) || 0;
                        const unitPrice = parseFloat(item.unit_price || item.price || 0);
                        const selectedOptions = item.selected_options || item.product_attributes?.selected_options || [];
                        const optionsPrice = selectedOptions.reduce((sum, option) => {
                          const optionPrice = parseFloat(option.price || 0);
                          return sum + (isNaN(optionPrice) ? 0 : optionPrice);
                        }, 0);
                        const baseUnitPrice = Math.max(0, unitPrice - optionsPrice);
                        
                        return (
                          <div key={index} className="grid grid-cols-12 gap-4 py-4 px-4 border-b border-gray-200 text-sm">
                            {/* Product Column */}
                            <div className="col-span-5">
                              <h4 className="font-medium text-gray-900 mb-1">{item.product_name}</h4>
                              {item.product_sku && (
                                <p className="text-xs text-gray-500 mb-2">SKU: {item.product_sku}</p>
                              )}
                              
                              {/* Custom Options */}
                              {selectedOptions && selectedOptions.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {selectedOptions.map((option, optIndex) => (
                                    <div key={optIndex} className="text-xs text-gray-600 flex justify-between">
                                      <span>• {option.name}</span>
                                      {parseFloat(option.price || 0) > 0 && (
                                        <span className="text-green-600">(+{formatCurrency(option.price, order.currency)})</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Quantity Column */}
                            <div className="col-span-2 text-center">
                              <span className="font-medium">{quantity}</span>
                            </div>
                            
                            {/* Unit Price Column */}
                            <div className="col-span-3 text-right">
                              <div className="space-y-1">
                                <div className="font-medium">{formatCurrency(baseUnitPrice, order.currency)}</div>
                                {selectedOptions && selectedOptions.length > 0 && (
                                  <div className="text-xs text-gray-500">
                                    Options: +{formatCurrency(optionsPrice, order.currency)}
                                  </div>
                                )}
                                {selectedOptions && selectedOptions.length > 0 && (
                                  <div className="text-xs font-medium border-t pt-1">
                                    Total: {formatCurrency(unitPrice, order.currency)}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Total Column */}
                            <div className="col-span-2 text-right">
                              <span className="font-semibold">{formatCurrency(totalPrice, order.currency)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Total */}
            <Card>
              <CardHeader>
                <CardTitle>Order Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(order.subtotal, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Shipping{order.shipping_method ? ` (${order.shipping_method})` : ''}
                    </span>
                    <span>{formatCurrency(order.shipping_amount || order.shipping_cost, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatCurrency(order.tax_amount, order.currency)}</span>
                  </div>
                  {parseFloat(order.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(order.discount_amount, order.currency)}</span>
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
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Shipping Address */}
            {order.shipping_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-green-600" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
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

            {/* Create Account - Simplified */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                  Create Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Create an account using your email <strong>{order.customer_email}</strong> to track your orders and save your details for faster checkout. We'll send you a welcome email to get started.
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
                    <div>
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
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
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
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
                    
                    {accountCreationError && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-600 text-sm">
                          {accountCreationError}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex space-x-2">
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
                          'Create Account'
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowCreateAccount(false)}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* What Happens Next - Bottom Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center text-center w-full justify-center">
              <Info className="w-5 h-5 mr-2 text-blue-600" />
              What Happens Next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">1. Order Processing</h3>
                <p className="text-sm text-gray-600">
                  We'll prepare your order and send you a confirmation email with tracking information.
                </p>
              </div>
              <div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Truck className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">2. Shipping</h3>
                <p className="text-sm text-gray-600">
                  Your order will be carefully packed and shipped{order.shipping_method ? ` via ${order.shipping_method}` : ''} to your delivery address.
                </p>
              </div>
              <div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">3. Delivery</h3>
                <p className="text-sm text-gray-600">
                  {order.delivery_date ? (
                    <>You'll receive your order on {formatDate(order.delivery_date)}{order.delivery_time_slot ? ` during ${order.delivery_time_slot}` : ''}.</>
                  ) : (
                    "You'll receive your order according to the shipping method selected."
                  )}
                  {order.delivery_instructions && (
                    <span className="block mt-1 font-medium">Special instructions: {order.delivery_instructions}</span>
                  )}
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
    </div>
  );
}