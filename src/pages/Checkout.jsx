
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Product } from "@/api/entities";
import { User } from "@/api/entities";
import cartService from "@/services/cartService";
import { PaymentMethod } from "@/api/entities";
import { ShippingMethod } from "@/api/entities";
import { Address } from "@/api/entities";
import { Coupon } from "@/api/entities";
import { useStore } from "@/components/storefront/StoreProvider";
import { createStripeCheckout } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountrySelect } from "@/components/ui/country-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tag } from "lucide-react";

export default function Checkout() {
  const { store, settings, loading: storeLoading } = useStore();
  
  // Get currency symbol from settings
  const currencySymbol = settings?.currency_symbol || '$';
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartProducts, setCartProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [selectedShippingMethod, setSelectedShippingMethod] = useState('');
  const [selectedShippingAddress, setSelectedShippingAddress] = useState('');
  const [selectedBillingAddress, setSelectedBillingAddress] = useState('');
  const [useShippingForBilling, setUseShippingForBilling] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [shippingAddress, setShippingAddress] = useState({
    full_name: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: ''
  });
  
  const [billingAddress, setBillingAddress] = useState({
    full_name: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: ''
  });
  
  const [shippingCost, setShippingCost] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState('');
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    loadCheckoutData();
  }, [store?.id, storeLoading]);

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = (event) => {
      console.log('🛒 Checkout: Cart update event received', event);
      console.log('🛒 Checkout: Current page URL:', window.location.pathname);
      console.log('🛒 Checkout: Loading state:', loading);
      
      if (!loading) {
        console.log('🛒 Checkout: Reloading cart items due to external update');
        loadCartItems();
      } else {
        console.log('🛒 Checkout: Skipping reload - page is loading');
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [loading]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      
      // Load user
      try {
        const userData = await User.me();
        setUser(userData);
        
        // Load user addresses if logged in
        if (userData?.id) {
          try {
            const addresses = await Address.filter({ user_id: userData.id });
            setUserAddresses(addresses || []);
          } catch (error) {
            console.warn('Addresses API not available:', error);
            setUserAddresses([]);
          }
        }
      } catch (error) {
        setUser(null);
        setUserAddresses([]);
      }

      if (!store?.id) return;

      // Load cart items
      await loadCartItems();

      // Load payment and shipping methods
      const [paymentData, shippingData] = await Promise.all([
        PaymentMethod.filter({ store_id: store.id, is_active: true }),
        ShippingMethod.filter({ store_id: store.id, is_active: true })
      ]);

      setPaymentMethods(paymentData || []);
      setShippingMethods(shippingData || []);

      // Set default selections
      if (paymentData?.length > 0) {
        setSelectedPaymentMethod(paymentData[0].code);
      }
      if (shippingData?.length > 0) {
        setSelectedShippingMethod(shippingData[0].name);
        calculateShippingCost(shippingData[0]);
      }

    } catch (error) {
      console.error('Failed to load checkout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCartItems = async () => {
    try {
      let sessionId = localStorage.getItem('cart_session_id');
      if (!sessionId) return;

      // Use simplified cart service (session-based approach)
      const cartResult = await cartService.getCart();
      console.log('🛒 Checkout: Cart service result:', cartResult);
      
      let cartItems = [];
      if (cartResult.success && cartResult.items) {
        cartItems = cartResult.items;
      }

      console.log('🛒 Checkout: Extracted cart items:', cartItems);
      setCartItems(cartItems);

      // Load product details for cart items
      if (cartItems && cartItems.length > 0) {
        const productDetails = {};
        for (const item of cartItems) {
          if (!productDetails[item.product_id]) {
            try {
              const result = await Product.filter({ id: item.product_id });
              const products = Array.isArray(result) ? result : [];
              if (products.length > 0) {
                productDetails[item.product_id] = products[0];
              }
            } catch (error) {
              console.warn(`Failed to load product ${item.product_id}:`, error);
            }
          }
        }
        setCartProducts(productDetails);
      }
    } catch (error) {
      console.error('Failed to load cart items:', error);
      setCartItems([]);
      setCartProducts({});
    }
  };

  const calculateItemPrice = (item, product) => {
    if (!product) return 0;
    
    let basePrice = parseFloat(item.price || 0);
    if (!item.price || isNaN(basePrice)) {
      basePrice = parseFloat(product.price || 0);
      if (isNaN(basePrice)) basePrice = 0;
      if (product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price)) {
        basePrice = Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0));
        if (isNaN(basePrice)) basePrice = 0;
      }
    }
    
    const optionsPrice = (item.selected_options || []).reduce((sum, option) => sum + (parseFloat(option.price) || 0), 0);
    const finalPrice = basePrice + optionsPrice;
    
    console.log('🛒 Checkout calculateItemPrice:', {
      itemPrice: item.price,
      productPrice: product.price,
      basePrice,
      optionsPrice,
      finalPrice,
      itemId: item.id
    });
    
    return finalPrice;
  };

  const calculateSubtotal = () => {
    const subtotal = cartItems.reduce((total, item) => {
      const product = cartProducts[item.product_id];
      const itemPrice = calculateItemPrice(item, product);
      const lineTotal = itemPrice * item.quantity;
      
      console.log('🛒 Checkout calculateSubtotal line:', {
        itemId: item.id,
        itemPrice,
        quantity: item.quantity,
        lineTotal,
        runningTotal: total + (isNaN(lineTotal) ? 0 : lineTotal)
      });
      
      return total + (isNaN(lineTotal) ? 0 : lineTotal);
    }, 0);
    
    console.log('🛒 Checkout final subtotal:', subtotal);
    return isNaN(subtotal) ? 0 : subtotal;
  };

  const getTotalAmount = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const shipping = isNaN(parseFloat(shippingCost)) ? 0 : parseFloat(shippingCost);
    const tax = isNaN(parseFloat(taxAmount)) ? 0 : parseFloat(taxAmount);
    const total = subtotal - discount + shipping + tax;
    
    console.log('🛒 Checkout getTotalAmount:', {
      subtotal,
      discount,
      shipping,
      tax,
      total,
      shippingCostRaw: shippingCost,
      taxAmountRaw: taxAmount
    });
    
    return isNaN(total) ? 0 : total;
  };

  // Safe number formatter to prevent toFixed errors
  const formatPrice = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const calculateShippingCost = (method) => {
    if (!method) return;
    
    if (method.type === 'free_shipping') {
      const subtotal = calculateSubtotal();
      if (subtotal >= (method.free_shipping_min_order || 0)) {
        setShippingCost(0);
      } else {
        setShippingCost(parseFloat(method.flat_rate_cost) || 0);
      }
    } else if (method.type === 'flat_rate') {
      setShippingCost(parseFloat(method.flat_rate_cost) || 0);
    }
  };

  // Coupon handling functions
  const handleApplyCoupon = async () => {
    if (!couponCode) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    
    if (!store?.id) {
      setCouponError("Store information not available.");
      return;
    }
    
    try {
      setCouponError('');
      console.log('🎟️ Checkout: Applying coupon:', couponCode, 'for store:', store.id);
      
      const coupons = await Coupon.filter({ 
        code: couponCode, 
        is_active: true, 
        store_id: store.id 
      });
      
      console.log('🎟️ Checkout: Coupon API response:', coupons);
      
      if (coupons && coupons.length > 0) {
        const coupon = coupons[0];
        console.log('🎟️ Checkout: Found coupon:', coupon);
        
        // Check if coupon is still valid (not expired)
        if (coupon.end_date) {
          const expiryDate = new Date(coupon.end_date);
          const now = new Date();
          if (expiryDate < now) {
            setCouponError("This coupon has expired.");
            return;
          }
        }
        
        // Check if coupon has started
        if (coupon.start_date) {
          const startDate = new Date(coupon.start_date);
          const now = new Date();
          if (startDate > now) {
            setCouponError("This coupon is not yet active.");
            return;
          }
        }
        
        // Check usage limit
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
          setCouponError("This coupon has reached its usage limit.");
          return;
        }
        
        // Check minimum purchase amount
        const subtotal = calculateSubtotal();
        if (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) {
          setCouponError(`Minimum order amount of ${currencySymbol}${formatPrice(coupon.min_purchase_amount)} required for this coupon.`);
          return;
        }
        
        // Check if coupon applies to products in cart
        if (coupon.applicable_products && coupon.applicable_products.length > 0) {
          const hasApplicableProduct = cartItems.some(item => 
            coupon.applicable_products.includes(item.product_id)
          );
          if (!hasApplicableProduct) {
            setCouponError("This coupon doesn't apply to any products in your cart.");
            return;
          }
        }
        
        // Check if coupon applies to categories in cart
        if (coupon.applicable_categories && coupon.applicable_categories.length > 0) {
          const hasApplicableCategory = cartItems.some(item => {
            const product = cartProducts[item.product_id];
            return product?.category_ids?.some(catId => 
              coupon.applicable_categories.includes(catId)
            );
          });
          if (!hasApplicableCategory) {
            setCouponError("This coupon doesn't apply to any products in your cart.");
            return;
          }
        }
        
        setAppliedCoupon(coupon);
        setCouponCode(''); // Clear the input after successful application
      } else {
        setCouponError("Invalid or expired coupon code.");
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponError("Could not apply coupon. Please try again.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleCouponKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    const subtotal = calculateSubtotal();
    let discount = 0;
    
    if (appliedCoupon.discount_type === 'fixed') {
      discount = parseFloat(appliedCoupon.discount_value) || 0;
    } else if (appliedCoupon.discount_type === 'percentage') {
      discount = subtotal * ((parseFloat(appliedCoupon.discount_value) || 0) / 100);
      
      // Apply max discount limit if specified
      if (appliedCoupon.max_discount_amount && discount > parseFloat(appliedCoupon.max_discount_amount)) {
        discount = parseFloat(appliedCoupon.max_discount_amount);
      }
    }
    
    // Ensure discount doesn't exceed subtotal
    if (discount > subtotal) {
      discount = subtotal;
    }
    
    return discount;
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      await User.login();
      setShowLoginModal(false);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleShippingMethodChange = (methodName) => {
    setSelectedShippingMethod(methodName);
    const method = shippingMethods.find(m => m.name === methodName);
    if (method) {
      calculateShippingCost(method);
    }
  };

  const getEligibleShippingMethods = () => {
    const country = getShippingCountry();
    return shippingMethods.filter(method => {
      if (method.availability === 'all') return true;
      if (method.availability === 'specific_countries') {
        return method.countries && method.countries.includes(country);
      }
      return true;
    });
  };

  const getEligiblePaymentMethods = () => {
    const country = getBillingCountry();
    return paymentMethods.filter(method => {
      if (!method.countries || method.countries.length === 0) return true;
      return method.countries.includes(country);
    });
  };

  const getShippingCountry = () => {
    if (user && selectedShippingAddress && selectedShippingAddress !== 'new') {
      const address = userAddresses.find(a => a.id === selectedShippingAddress);
      return address?.country || 'US';
    }
    return shippingAddress.country || 'US';
  };

  const getBillingCountry = () => {
    if (useShippingForBilling) {
      return getShippingCountry();
    }
    if (user && selectedBillingAddress && selectedBillingAddress !== 'new') {
      const address = userAddresses.find(a => a.id === selectedBillingAddress);
      return address?.country || 'US';
    }
    return billingAddress.country || 'US';
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    setIsProcessing(true);
    try {
      const checkoutData = {
        cartItems,
        shippingAddress: getShippingCountry() === shippingAddress.country ? shippingAddress : userAddresses.find(a => a.id === selectedShippingAddress),
        billingAddress: useShippingForBilling ? (getShippingCountry() === shippingAddress.country ? shippingAddress : userAddresses.find(a => a.id === selectedShippingAddress)) : (getBillingCountry() === billingAddress.country ? billingAddress : userAddresses.find(a => a.id === selectedBillingAddress)),
        store,
        taxAmount,
        shippingCost,
        deliveryDate,
        email: user?.email || shippingAddress.email,
        userId: user?.id,
        sessionId: localStorage.getItem('cart_session_id')
      };

      const { data } = await createStripeCheckout(checkoutData);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
        <p className="text-gray-600 mb-6">Add some products to your cart before checking out.</p>
        <Button onClick={() => navigate(createPageUrl('Storefront'))}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  const eligibleShippingMethods = getEligibleShippingMethods();
  const eligiblePaymentMethods = getEligiblePaymentMethods();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Order Summary - Right Side */}
        <div className="lg:order-2 space-y-6">
          {/* Payment Methods */}
          {eligiblePaymentMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eligiblePaymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`payment-method-${method.id}`}
                        name="paymentMethod"
                        value={method.code}
                        checked={selectedPaymentMethod === method.code}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="text-blue-600"
                      />
                      <label htmlFor={`payment-method-${method.id}`} className="flex-1 cursor-pointer flex items-center space-x-3">
                        {method.icon_url && (
                          <img src={method.icon_url} alt={method.name} className="w-8 h-8 object-contain" />
                        )}
                        <div>
                          <p className="font-medium">{method.name}</p>
                          {method.description && (
                            <p className="text-sm text-gray-500">{method.description}</p>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Coupon Section */}
          <Card>
            <CardHeader>
              <CardTitle>Apply Coupon</CardTitle>
            </CardHeader>
            <CardContent>
              {!appliedCoupon ? (
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <Input 
                      placeholder="Enter coupon code" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyPress={handleCouponKeyPress}
                    />
                    <Button 
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim()}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      Apply
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-red-600">{couponError}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-800">Applied: {appliedCoupon.name}</p>
                    <p className="text-xs text-green-600">
                      {appliedCoupon.discount_type === 'fixed' 
                        ? `${currencySymbol}${formatPrice(appliedCoupon.discount_value)} off`
                        : `${formatPrice(appliedCoupon.discount_value)}% off`
                      }
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRemoveCoupon}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      <h3 className="font-medium text-gray-900">Items in Cart ({cartItems.length})</h3>
                    </AccordionTrigger>
                    <AccordionContent>
                      {cartItems.map((item) => {
                        const product = cartProducts[item.product_id];
                        if (!product) return null;
                        
                        let basePrice = parseFloat(item.price || 0);
                        if (!item.price || isNaN(basePrice)) {
                          basePrice = parseFloat(product.price || 0);
                          if (isNaN(basePrice)) basePrice = 0;
                          if (product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price)) {
                            basePrice = Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0));
                            if (isNaN(basePrice)) basePrice = 0;
                          }
                        }
                        
                        const itemPrice = calculateItemPrice(item, product);
                        const itemTotal = itemPrice * item.quantity;

                        return (
                          <div key={item.id} className="flex items-center space-x-3 py-3 border-b border-gray-100">
                            <img 
                              src={product.images?.[0] || 'https://placehold.co/60x60?text=No+Image'} 
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-sm text-gray-500">{currencySymbol}{formatPrice(basePrice)} each</p>
                              
                              {item.selected_options && item.selected_options.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.selected_options.map((option, idx) => (
                                    <div key={idx}>+ {option.name} (+{currencySymbol}{formatPrice(option.price)})</div>
                                  ))}
                                </div>
                              )}
                              
                              <p className="text-sm text-gray-600 mt-1">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{currencySymbol}{formatPrice(itemTotal)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Order Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{currencySymbol}{formatPrice(calculateSubtotal())}</span>
                </div>
                
                {appliedCoupon && calculateDiscount() > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.name})</span>
                    <span>-{currencySymbol}{formatPrice(calculateDiscount())}</span>
                  </div>
                )}
                
                {shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{currencySymbol}{formatPrice(shippingCost)}</span>
                  </div>
                )}
                
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{currencySymbol}{formatPrice(taxAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{currencySymbol}{formatPrice(getTotalAmount())}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Place Order Button */}
          <Button
            onClick={handleCheckout}
            disabled={isProcessing || cartItems.length === 0}
            className="w-full h-12 text-lg"
            style={{
              backgroundColor: settings?.theme?.place_order_button_color || '#28a745',
              color: '#FFFFFF',
            }}
          >
            {isProcessing ? 'Processing...' : `Place Order - ${currencySymbol}${formatPrice(getTotalAmount())}`}
          </Button>
        </div>

        {/* Checkout Forms - Left Side */}
        <div className="lg:order-1 space-y-6">
          
          {/* Login Section */}
          {!user && (
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Continue as guest or login to your account</span>
                  <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Already have an account?</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Login to Your Account</DialogTitle>
                        <DialogDescription>
                          Sign in to access your saved addresses and order history.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Button
                          onClick={handleLogin}
                          disabled={loginLoading}
                          className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          {loginLoading ? "Signing in..." : "Continue with Google"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              {user && userAddresses.length > 0 ? (
                <div className="space-y-3">
                  {userAddresses.map((address) => (
                    <div key={address.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`shipping-${address.id}`}
                        name="shippingAddress"
                        value={address.id}
                        checked={selectedShippingAddress === address.id}
                        onChange={(e) => setSelectedShippingAddress(e.target.value)}
                        className="text-blue-600"
                      />
                      <label htmlFor={`shipping-${address.id}`} className="flex-1 cursor-pointer">
                        <div className="text-sm">
                          <p className="font-medium">{address.full_name}</p>
                          <p>{address.street}</p>
                          <p>{address.city}, {address.state} {address.postal_code}</p>
                          <p>{address.country}</p>
                        </div>
                      </label>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="new-shipping-address"
                      name="shippingAddress"
                      value="new"
                      checked={selectedShippingAddress === 'new'}
                      onChange={(e) => setSelectedShippingAddress(e.target.value)}
                      className="text-blue-600"
                    />
                    <label htmlFor="new-shipping-address" className="cursor-pointer">
                      Use a new address
                    </label>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 mb-4">Enter your shipping address</p>
              )}

              {(!user || userAddresses.length === 0 || selectedShippingAddress === 'new') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Input
                    placeholder="Email"
                    type="email"
                    className="md:col-span-2"
                    value={shippingAddress.email}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <Input
                    placeholder="Full Name"
                    className="md:col-span-2"
                    value={shippingAddress.full_name}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                  <Input
                    placeholder="Street Address"
                    className="md:col-span-2"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                  />
                  <Input
                    placeholder="City"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                  />
                  <Input
                    placeholder="State/Province"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                  />
                  <Input
                    placeholder="Postal Code"
                    value={shippingAddress.postal_code}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                  />
                  <CountrySelect
                    value={shippingAddress.country}
                    onChange={(country) => setShippingAddress(prev => ({ ...prev, country }))}
                    placeholder="Select country..."
                    allowedCountries={settings?.allowed_countries}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Methods */}
          {eligibleShippingMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eligibleShippingMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`shipping-method-${method.id}`}
                        name="shippingMethod"
                        value={method.name}
                        checked={selectedShippingMethod === method.name}
                        onChange={(e) => handleShippingMethodChange(e.target.value)}
                        className="text-blue-600"
                      />
                      <label htmlFor={`shipping-method-${method.id}`} className="flex-1 cursor-pointer flex justify-between">
                        <span>{method.name}</span>
                        <span className="font-medium">
                          {method.type === 'free_shipping' && calculateSubtotal() >= (method.free_shipping_min_order || 0) 
                            ? 'Free' 
                            : `${currencySymbol}${formatPrice(method.flat_rate_cost || 0)}`
                          }
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing Address */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="use-shipping-for-billing"
                    checked={useShippingForBilling}
                    onChange={(e) => setUseShippingForBilling(e.target.checked)}
                    className="text-blue-600"
                  />
                  <label htmlFor="use-shipping-for-billing" className="cursor-pointer">
                    Same as shipping address
                  </label>
                </div>

                {!useShippingForBilling && (
                  <>
                    {user && userAddresses.length > 0 ? (
                      <div className="space-y-3">
                        {userAddresses.map((address) => (
                          <div key={address.id} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`billing-${address.id}`}
                              name="billingAddress"
                              value={address.id}
                              checked={selectedBillingAddress === address.id}
                              onChange={(e) => setSelectedBillingAddress(e.target.value)}
                              className="text-blue-600"
                            />
                            <label htmlFor={`billing-${address.id}`} className="flex-1 cursor-pointer">
                              <div className="text-sm">
                                <p className="font-medium">{address.full_name}</p>
                                <p>{address.street}</p>
                                <p>{address.city}, {address.state} {address.postal_code}</p>
                                <p>{address.country}</p>
                              </div>
                            </label>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="new-billing-address"
                            name="billingAddress"
                            value="new"
                            checked={selectedBillingAddress === 'new'}
                            onChange={(e) => setSelectedBillingAddress(e.target.value)}
                            className="text-blue-600"
                          />
                          <label htmlFor="new-billing-address" className="cursor-pointer">
                            Use a new address
                          </label>
                        </div>
                      </div>
                    ) : null}

                    {(!user || userAddresses.length === 0 || selectedBillingAddress === 'new') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          placeholder="Email"
                          type="email"
                          className="md:col-span-2"
                          value={billingAddress.email}
                          onChange={(e) => setBillingAddress(prev => ({ ...prev, email: e.target.value }))}
                        />
                        <Input
                          placeholder="Full Name"
                          className="md:col-span-2"
                          value={billingAddress.full_name}
                          onChange={(e) => setBillingAddress(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                        <Input
                          placeholder="Street Address"
                          className="md:col-span-2"
                          value={billingAddress.street}
                          onChange={(e) => setBillingAddress(prev => ({ ...prev, street: e.target.value }))}
                        />
                        <Input
                          placeholder="City"
                          value={billingAddress.city}
                          onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                        />
                        <Input
                          placeholder="State/Province"
                          value={billingAddress.state}
                          onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                        />
                        <Input
                          placeholder="Postal Code"
                          value={billingAddress.postal_code}
                          onChange={(e) => setBillingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                        />
                        <CountrySelect
                          value={billingAddress.country}
                          onChange={(country) => setBillingAddress(prev => ({ ...prev, country }))}
                          placeholder="Select country..."
                          allowedCountries={settings?.allowed_countries}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
