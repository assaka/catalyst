import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Order } from '@/api/entities';
import { OrderItem } from '@/api/entities';
import { Product } from '@/api/entities';
import { Auth } from '@/api/entities';
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
  UserPlus,
  Truck,
  ShoppingBag,
  Info
} from 'lucide-react';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';
import { formatPrice, safeNumber } from '@/utils/priceUtils';
import { getProductName, getCurrentLanguage } from '@/utils/translationUtils';
import cartService from '@/services/cartService';
import { t } from '@/utils/translationHelper';
import { useStore } from '@/components/storefront/StoreProvider';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useStore();
  const [storeCode, setStoreCode] = useState(null);

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Account creation state - simplified to password only
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountCreationError, setAccountCreationError] = useState('');
  const [accountCreationSuccess, setAccountCreationSuccess] = useState(false);
  const [customerHasAccount, setCustomerHasAccount] = useState(false); // Track if customer already registered

  // Currency formatting helper - uses new priceUtils API
  // Note: OrderSuccess has special needs since orders can have different currencies
  const formatCurrency = (amount, currency) => {
    const numAmount = safeNumber(amount);
    // Always use the centralized formatPrice utility
    return formatPrice(numAmount);
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

  // Check authentication status - only consider CUSTOMER authentication for storefront
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await User.me();
        // Only consider authenticated if user is a customer (not store_owner/admin)
        const isCustomerAuth = !!userData?.id && userData?.role === 'customer';
        setIsAuthenticated(isCustomerAuth);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [accountCreationSuccess]); // Re-check auth when account is created

  // Load order data
  useEffect(() => {
    const loadOrder = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiUrl}/api/orders/by-payment-reference/${sessionId}`);
        const result = await response.json();

        if (response.ok && result.success && result.data) {
          const orderData = result.data;
          setOrder(orderData);

          // Get store code from the order's Store object
          if (orderData.Store?.code) {
            setStoreCode(orderData.Store.code);
          }

          // Clear the cart after successful order
          if (orderData.store_id) {
            try {
              await cartService.clearCart(orderData.store_id);
              console.log('✅ Cart cleared after successful order');

              // Dispatch cart update event to refresh cart UI
              window.dispatchEvent(new CustomEvent('cartUpdated', {
                detail: {
                  action: 'cleared_after_order',
                  timestamp: Date.now(),
                  source: 'OrderSuccess'
                }
              }));
            } catch (error) {
              console.error('Failed to clear cart after order:', error);
              // Don't show error to user as order was successful
            }
          }

          // Check if customer already has a registered account (has password)
          if (orderData.customer_email && orderData.store_id) {
            try {
              const statusResponse = await fetch(
                `${apiUrl}/api/auth/check-customer-status/${encodeURIComponent(orderData.customer_email)}/${orderData.store_id}`
              );
              const statusResult = await statusResponse.json();

              if (statusResult.success && statusResult.data) {
                setCustomerHasAccount(statusResult.data.hasPassword);
              }
            } catch (error) {
              console.error('Error checking customer status:', error);
            }
          }

          // Try different possible keys for order items
          let items = orderData.OrderItems || orderData.items || orderData.orderItems || [];

          if (items && Array.isArray(items) && items.length > 0) {
            setOrderItems(items);

            // Track purchase event with items
            if (typeof window !== 'undefined' && window.catalyst?.trackPurchase) {
              window.catalyst.trackPurchase(orderData);
            }
          } else {
            // If no items found, try to reload the data after a short delay
            // This handles the case where order items might still be being created
            setTimeout(async () => {
              try {
                const retryResponse = await fetch(`${apiUrl}/api/orders/by-payment-reference/${sessionId}`);
                const retryResult = await retryResponse.json();

                if (retryResponse.ok && retryResult.success && retryResult.data) {
                  const retryOrderData = retryResult.data;
                  const retryItems = retryOrderData.OrderItems || retryOrderData.items || retryOrderData.orderItems || [];

                  if (retryItems && Array.isArray(retryItems) && retryItems.length > 0) {
                    setOrderItems(retryItems);
                    setOrder(retryOrderData);

                    // Track purchase event after retry with items
                    if (typeof window !== 'undefined' && window.catalyst?.trackPurchase) {
                      window.catalyst.trackPurchase(retryOrderData);
                    }
                  } else {
                    setOrderItems([]);
                  }
                }
              } catch (retryError) {
                console.error('Error during retry fetch:', retryError);
              }
            }, 2000);

            setOrderItems([]);
          }
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
      setAccountCreationError(t('validation.password_min_length', settings));
      return;
    }

    if (accountFormData.password !== accountFormData.confirmPassword) {
      setAccountCreationError(t('validation.passwords_no_match', settings));
      return;
    }

    setCreatingAccount(true);

    try {
      // Use the new upgrade-guest endpoint instead of register
      // This updates the existing guest customer record instead of creating a new one
      const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/auth/upgrade-guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: order.customer_email,
          password: accountFormData.password,
          store_id: order.store_id
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create account');
      }

      setAccountCreationSuccess(true);
      setShowCreateAccount(false);

      // Auto-login the user by storing the token
      if (result.data?.token) {
        localStorage.setItem('customer_auth_token', result.data.token);

        // Save the shipping address from the order to the customer's addresses
        if (order.shipping_address && result.data?.customer?.id) {
          try {
            console.log('📍 Attempting to save shipping address for customer:', result.data.customer.id);
            console.log('📍 Shipping address data:', order.shipping_address);

            const { CustomerAddress } = await import('@/api/storefront-entities');

            const addressData = {
              customer_id: result.data.customer.id,
              full_name: order.shipping_address.name || order.shipping_address.full_name,
              email: order.customer_email,
              street: order.shipping_address.line1 || order.shipping_address.street,
              city: order.shipping_address.city,
              state: order.shipping_address.state || order.shipping_address.province,
              postal_code: order.shipping_address.postal_code || order.shipping_address.zip,
              country: order.shipping_address.country,
              phone: order.shipping_address.phone || order.customer_phone,
              is_default_shipping: true,
              is_default_billing: false
            };

            console.log('📍 Address data to save:', addressData);

            const savedAddress = await CustomerAddress.create(addressData);
            console.log('✅ Saved order shipping address to customer account:', savedAddress);
          } catch (addressError) {
            console.error('❌ Failed to save address:', addressError);
            console.error('❌ Address error details:', addressError.response?.data || addressError.message);
            // Don't show error to user as account was created successfully
          }
        } else {
          console.log('⚠️ Shipping address not saved - missing data:', {
            hasShippingAddress: !!order.shipping_address,
            hasCustomerId: !!result.data?.customer?.id,
            customerId: result.data?.customer?.id
          });
        }
      }

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
          <p className="text-gray-600">{t('order.loading', settings)}</p>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('order.not_found', settings)}</h1>
          <p className="text-gray-600">{t('order.check_email', settings)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* CMS Block - Above Content */}
        <CmsBlockRenderer position="success_above_content" storeId={order?.store_id} />

        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('success.thank_you', settings)}</h1>
          <p className="text-lg text-gray-600 mb-4">{t('success.order_placed', settings)}</p>
          <p className="text-sm text-gray-600">{t('success.confirmation_sent', settings)}{' '} <span className="font-medium text-gray-900">{order.customer_email}</span></p>
          <p className="text-sm text-gray-500 mb-4">{t('order.number', settings)}: <span className="font-semibold text-gray-900">#{order.order_number}</span></p>
          
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
                ${safeNumber(order.discount_amount) > 0 ? `Discount: -${formatCurrency(order.discount_amount, order.currency)}\n                ` : ''}Total: ${formatCurrency(order.total_amount, order.currency)}
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
            📄 {t('success.download_invoice', settings)}
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-6">
            
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2 text-blue-600" />
                  {t('order_summary', settings)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('order.number', settings)}:</span>
                    <span className="font-semibold">#{order.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('order.date', settings)}:</span>
                    <span className="font-semibold">{formatDate(order.created_date || order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('common.status', settings)}:</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {t(`common.${order.status || 'pending'}`, settings)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('common.payment_status', settings)}:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {t(`common.${order.payment_status || 'pending'}`, settings)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('payment_method', settings)}:</span>
                    <span className="font-semibold capitalize">{order.payment_method || 'Card'}</span>
                  </div>
                  {order.delivery_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('order.delivery_date', settings)}:</span>
                      <span className="font-semibold">{formatDate(order.delivery_date)}</span>
                    </div>
                  )}
                  {order.delivery_time_slot && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('order.delivery_time', settings)}:</span>
                      <span className="font-semibold">{order.delivery_time_slot}</span>
                    </div>
                  )}
                  {order.shipping_method && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('shipping_method', settings)}:</span>
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
                  {t('order.items', settings)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderItems.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="mb-4">
                      <p className="text-gray-500">{t('order.items_processing', settings)}</p>
                      <p className="text-xs text-gray-400 mt-1">{t('order.successful', settings)}</p>
                    </div>

                    {/* Fallback order info */}
                    <div className="bg-blue-50 p-3 rounded-lg text-left">
                      <h4 className="font-medium text-blue-900 mb-2">{t('order.details', settings)}</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>{t('order.total_amount', settings)}:</strong> {formatCurrency(order.total_amount, order.currency)}</p>
                        {order.subtotal && (
                          <p><strong>Subtotal:</strong> {formatCurrency(order.subtotal, order.currency)}</p>
                        )}
                        {safeNumber(order.shipping_amount) > 0 && (
                          <p><strong>Shipping:</strong> {formatCurrency(order.shipping_amount, order.currency)}</p>
                        )}
                        {safeNumber(order.discount_amount) > 0 && (
                          <p><strong>Discount:</strong> -{formatCurrency(order.discount_amount, order.currency)}</p>
                        )}
                      </div>
                    </div>
                    
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Table Header */}
                    <div className="min-w-full">
                      <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-gray-100 rounded-t-lg text-sm font-medium text-gray-700">
                        <div className="col-span-5">{t('common.product', settings)}</div>
                        <div className="col-span-2 text-center">{t('common.qty', settings)}</div>
                        <div className="col-span-3 text-right">{t('order.unit_price', settings)}</div>
                        <div className="col-span-2 text-right">{t('common.total', settings)}</div>
                      </div>
                      
                      {/* Table Rows */}
                      {orderItems.map((item, index) => {
                        // Calculate base unit price and options price
                        const quantity = Math.max(1, safeNumber(item.quantity) || 1);
                        const totalPrice = safeNumber(item.total_price) || (safeNumber(item.unit_price || item.price) * quantity) || 0;
                        const unitPrice = safeNumber(item.unit_price || item.price);
                        const selectedOptions = item.selected_options || item.product_attributes?.selected_options || [];
                        const optionsPrice = selectedOptions.reduce((sum, option) => {
                          return sum + safeNumber(option.price);
                        }, 0);
                        const baseUnitPrice = Math.max(0, unitPrice - optionsPrice);
                        
                        return (
                          <div key={index} className="grid grid-cols-12 gap-4 py-4 px-4 border-b border-gray-200 text-sm">
                            {/* Product Column */}
                            <div className="col-span-5">
                              <h4 className="font-medium text-gray-900 mb-1">{item.product_name}</h4>
                              {item.product_sku && (
                                <p className="text-xs text-gray-500 mb-2">{t('common.sku', settings)}: {item.product_sku}</p>
                              )}

                              {/* Custom Options */}
                              {selectedOptions && selectedOptions.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {selectedOptions.map((option, optIndex) => (
                                    <div key={optIndex} className="text-xs text-gray-600 flex justify-between">
                                      <span>• {option.name}</span>
                                      {safeNumber(option.price) > 0 && (
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
                                    {t('common.options', settings)}: +{formatCurrency(optionsPrice, order.currency)}
                                  </div>
                                )}
                                {selectedOptions && selectedOptions.length > 0 && (
                                  <div className="text-xs font-medium border-t pt-1">
                                    {t('common.total', settings)}: {formatCurrency(unitPrice, order.currency)}
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
                <CardTitle>{t('order.total', settings)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600"> {t('common.subtotal', settings)}</span>
                    <span>{formatCurrency(order.subtotal, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Shipping{order.shipping_method ? ` (${order.shipping_method})` : ''}
                    </span>
                    <span>{formatCurrency(order.shipping_amount || order.shipping_cost, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600"> {t('common.tax', settings)}</span>
                    <span>{formatCurrency(order.tax_amount, order.currency)}</span>
                  </div>
                  {safeNumber(order.discount_amount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span> {t('common.discount', settings)}</span>
                      <span>-{formatCurrency(order.discount_amount, order.currency)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span> {t('common.total', settings)}</span>
                    <span className="text-green-600">{formatCurrency(order.total_amount, order.currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Shipping Address */}
            {order.shipping_address && Object.keys(order.shipping_address).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-green-600" />
                    {t('common.shipping_address', settings)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    {(order.shipping_address.full_name || order.shipping_address.name) && (
                      <p className="font-medium text-gray-900">
                        {order.shipping_address.full_name || order.shipping_address.name}
                      </p>
                    )}
                    {(order.shipping_address.street || order.shipping_address.line1 || order.shipping_address.address) && (
                      <p className="text-gray-600">
                        {order.shipping_address.street || order.shipping_address.line1 || order.shipping_address.address}
                      </p>
                    )}
                    {(order.shipping_address.line2 || order.shipping_address.address_line2) && (
                      <p className="text-gray-600">
                        {order.shipping_address.line2 || order.shipping_address.address_line2}
                      </p>
                    )}
                    {(order.shipping_address.city || order.shipping_address.state || order.shipping_address.province || order.shipping_address.postal_code || order.shipping_address.zip) && (
                      <p className="text-gray-600">
                        {order.shipping_address.city ? `${order.shipping_address.city}, ` : ''}
                        {order.shipping_address.state || order.shipping_address.province || ''}{' '}
                        {order.shipping_address.postal_code || order.shipping_address.zip || ''}
                      </p>
                    )}
                    {order.shipping_address.country && (
                      <p className="text-gray-600">{order.shipping_address.country}</p>
                    )}
                    {(order.shipping_address.phone || order.customer_phone) && (
                      <p className="text-gray-600">Phone: {order.shipping_address.phone || order.customer_phone}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billing Address */}
            {order.billing_address && Object.keys(order.billing_address).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                    {t('common.billing_address', settings)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    {(order.billing_address.name || order.billing_address.full_name) && (
                      <p className="font-medium text-gray-900">
                        {order.billing_address.name || order.billing_address.full_name}
                      </p>
                    )}
                    {(order.billing_address.line1 || order.billing_address.street || order.billing_address.address) && (
                      <p className="text-gray-600">
                        {order.billing_address.line1 || order.billing_address.street || order.billing_address.address}
                      </p>
                    )}
                    {(order.billing_address.line2 || order.billing_address.address_line2) && (
                      <p className="text-gray-600">
                        {order.billing_address.line2 || order.billing_address.address_line2}
                      </p>
                    )}
                    {(order.billing_address.city || order.billing_address.state || order.billing_address.province || order.billing_address.postal_code || order.billing_address.zip) && (
                      <p className="text-gray-600">
                        {order.billing_address.city ? `${order.billing_address.city}, ` : ''}
                        {order.billing_address.state || order.billing_address.province || ''}{' '}
                        {order.billing_address.postal_code || order.billing_address.zip || ''}
                      </p>
                    )}
                    {order.billing_address.country && (
                      <p className="text-gray-600">{order.billing_address.country}</p>
                    )}
                    {(order.billing_address.phone || order.customer_phone) && (
                      <p className="text-gray-600">Phone: {order.billing_address.phone || order.customer_phone}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Create Account - Only show for guest users who don't have a registered account */}
            {!isAuthenticated && !customerHasAccount && (
              <>
                {accountCreationSuccess ? (
                  // Success message - replaces the Create Account card
                  <Card className="border-green-500 bg-green-50 shadow-lg">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-green-900 mb-2">
                            🎉 {t('success.account_created', settings)}
                          </h3>
                          <div className="text-green-800 space-y-2">
                            <p className="font-medium">
                              {t('success.welcome_message', settings)} <strong>{order.customer_email}</strong>
                            </p>
                            <div className="text-sm space-y-1 mt-3">
                              <p>✅ {t('success.auto_logged_in', settings)}</p>
                              <p>✅ {t('success.welcome_email_sent', settings)}</p>
                              <p>✅ {t('success.addresses_saved', settings)}</p>
                              <p>✅ {t('success.track_profile', settings)}</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-green-200">
                              <Button
                                onClick={() => {
                                  if (storeCode) {
                                    navigate(`/public/${storeCode}/account`);
                                  } else {
                                    navigate('/account/orders');
                                  }
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                size="sm"
                              >
                                {t('success.view_orders', settings)}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Create Account card - shown before account creation
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                        {t('success.create_account', settings)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        {t('success.create_description', settings)} <strong>{order.customer_email}</strong> {t('success.track_orders', settings)}
                      </p>

                      {!showCreateAccount ? (
                        <Button
                          onClick={() => setShowCreateAccount(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {t('success.create_account', settings)}
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                              {t('common.password', settings)}
                            </Label>
                            <Input
                              id="password"
                              type="password"
                              value={accountFormData.password}
                              onChange={(e) => setAccountFormData(prev => ({ ...prev, password: e.target.value }))}
                              className="mt-1"
                              placeholder={t('common.password', settings)}
                            />
                          </div>

                          <div>
                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                              {t('common.confirm_password', settings)}
                            </Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={accountFormData.confirmPassword}
                              onChange={(e) => setAccountFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="mt-1"
                              placeholder={t('common.confirm_password', settings)}
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
                                  <div class to Name="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  {t('common.creating', settings)}
                                </>
                              ) : (
                                t('success.create_account', settings)
                              )}
                            </Button>
                            <Button
                              onClick={() => setShowCreateAccount(false)}
                              variant="outline"
                            >
                              {t('common.cancel', settings)}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
        {/* CMS Block - Below Content */}
        <CmsBlockRenderer position="success_below_content" storeId={order?.store_id} />
      </div>
    </div>
  );
}