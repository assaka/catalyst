
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { StorefrontProduct, CustomerAddress } from "@/api/storefront-entities";
import { User } from "@/api/entities";
import cartService from "@/services/cartService";
import couponService from "@/services/couponService";
import taxService from "@/services/taxService";
import { PaymentMethod } from "@/api/entities";
import { ShippingMethod } from "@/api/entities";
import { Coupon } from "@/api/entities";
import { Tax } from "@/api/entities";
import { DeliverySettings } from "@/api/entities";
import { useStore } from "@/components/storefront/StoreProvider";
import { createStripeCheckout } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Tag, CalendarIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Auth as AuthService } from "@/api/entities";
import CmsBlockRenderer from "@/components/storefront/CmsBlockRenderer";
import apiClient from "@/api/client";

export default function Checkout() {
  const { store, settings, loading: storeLoading, selectedCountry, setSelectedCountry } = useStore();
  
  // Get currency symbol from settings
  const currencySymbol = settings?.currency_symbol || '$';
  
  // Debug allowed countries
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
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginFormData, setLoginFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [saveShippingAddress, setSaveShippingAddress] = useState(false);
  const [saveBillingAddress, setSaveBillingAddress] = useState(false);
  
  const [shippingAddress, setShippingAddress] = useState({
    full_name: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: selectedCountry || 'US',
    phone: ''
  });
  
  const [billingAddress, setBillingAddress] = useState({
    full_name: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: selectedCountry || 'US',
    phone: ''
  });
  
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentFee, setPaymentFee] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxRules, setTaxRules] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('');
  const [deliveryComments, setDeliveryComments] = useState('');
  const [deliverySettings, setDeliverySettings] = useState(null);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    loadCheckoutData();
  }, [store?.id, storeLoading]);

  // Load applied coupon from service on mount
  useEffect(() => {
    const storedCoupon = couponService.getAppliedCoupon();
    if (storedCoupon) {
      setAppliedCoupon(storedCoupon);
    }

    // Listen for coupon changes from other components
    const unsubscribe = couponService.addListener((coupon) => {
      setAppliedCoupon(coupon);
      setCouponError(''); // Clear any errors when coupon changes
    });

    return unsubscribe;
  }, []);

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = (event) => {
      
      if (!loading) {
        loadCartItems();
      } else {
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [loading]);

  // Trigger tax recalculation when shipping address country changes
  useEffect(() => {
    // Tax will be recalculated automatically through getTotalAmount since it calls calculateTax
  }, [shippingAddress.country, selectedShippingAddress]);

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
            const addresses = await CustomerAddress.findAll();
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

      // Load payment methods, shipping methods, delivery settings, and tax rules
      const [paymentData, shippingData, deliveryData, taxData] = await Promise.all([
        PaymentMethod.filter({ store_id: store.id }),
        ShippingMethod.filter({ store_id: store.id }),
        DeliverySettings.filter({ store_id: store.id }),
        Tax.filter({ store_id: store.id })
      ]);


      setPaymentMethods(paymentData || []);
      setShippingMethods(shippingData || []);
      setDeliverySettings(deliveryData && deliveryData.length > 0 ? deliveryData[0] : null);
      setTaxRules(taxData || []);

      // Set default selections
      if (paymentData?.length > 0) {
        setSelectedPaymentMethod(paymentData[0].code);
        calculatePaymentFeeWithData(paymentData[0].code, paymentData);
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
      
      let cartItems = [];
      if (cartResult.success && cartResult.items) {
        cartItems = cartResult.items;
      }

      setCartItems(cartItems);

      // Load product details for cart items
      if (cartItems && cartItems.length > 0) {
        const productDetails = {};
        for (const item of cartItems) {
          if (!productDetails[item.product_id]) {
            try {
              const result = await StorefrontProduct.filter({ id: item.product_id });
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
        
        // Validate applied coupon when cart contents change
        if (appliedCoupon) {
          validateAppliedCoupon(appliedCoupon, cartItems, productDetails);
        }
        
        // Recalculate payment fee when cart contents change
        if (selectedPaymentMethod) {
          calculatePaymentFee(selectedPaymentMethod);
        }
      } else if (appliedCoupon) {
        // Clear coupon if cart is empty
        couponService.removeAppliedCoupon();
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
    
    
    return finalPrice;
  };

  const calculateSubtotal = () => {
    const subtotal = cartItems.reduce((total, item) => {
      const product = cartProducts[item.product_id];
      const itemPrice = calculateItemPrice(item, product);
      const lineTotal = itemPrice * item.quantity;
      
      
      return total + (isNaN(lineTotal) ? 0 : lineTotal);
    }, 0);
    
    return isNaN(subtotal) ? 0 : subtotal;
  };

  const getTotalAmount = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const shipping = isNaN(parseFloat(shippingCost)) ? 0 : parseFloat(shippingCost);
    const paymentMethodFee = isNaN(parseFloat(paymentFee)) ? 0 : parseFloat(paymentFee);
    const tax = calculateTax(); // Use calculated tax instead of state
    const total = subtotal - discount + shipping + paymentMethodFee + tax;
    
    
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

  const calculatePaymentFee = (paymentMethodCode) => {
    calculatePaymentFeeWithData(paymentMethodCode, paymentMethods);
  };

  const calculatePaymentFeeWithData = (paymentMethodCode, paymentMethodsData) => {

    if (!paymentMethodCode || !paymentMethodsData) {
      setPaymentFee(0);
      return;
    }
    
    const method = paymentMethodsData.find(m => m.code === paymentMethodCode);

    if (!method || method.fee_type === 'none' || !method.fee_amount) {
      setPaymentFee(0);
      return;
    }
    
    const subtotal = calculateSubtotal();
    let fee = 0;
    
    if (method.fee_type === 'fixed') {
      fee = parseFloat(method.fee_amount) || 0;
    } else if (method.fee_type === 'percentage') {
      fee = subtotal * (parseFloat(method.fee_amount) / 100);
    }
    
    setPaymentFee(fee);
  };

  // Validate that applied coupon is still valid for current cart contents
  const validateAppliedCoupon = (coupon, cartItems, productDetails) => {
    if (!coupon || !cartItems || cartItems.length === 0) return;

    try {
      // Check if coupon applies to products in cart
      if (coupon.applicable_products && coupon.applicable_products.length > 0) {
        const hasApplicableProduct = cartItems.some(item => 
          coupon.applicable_products.includes(item.product_id)
        );
        if (!hasApplicableProduct) {
          couponService.removeAppliedCoupon();
          return;
        }
      }

      // Check if coupon applies to categories in cart
      if (coupon.applicable_categories && coupon.applicable_categories.length > 0) {
        const hasApplicableCategory = cartItems.some(item => {
          const product = productDetails[item.product_id];
          return product?.category_ids?.some(catId => 
            coupon.applicable_categories.includes(catId)
          );
        });
        if (!hasApplicableCategory) {
          couponService.removeAppliedCoupon();
          return;
        }
      }

      // Check minimum purchase amount
      const subtotal = calculateSubtotal();
      if (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) {
        couponService.removeAppliedCoupon();
        return;
      }

    } catch (error) {
      console.error('Error validating applied coupon:', error);
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
      
      const coupons = await Coupon.filter({ 
        code: couponCode, 
        is_active: true, 
        store_id: store.id 
      });
      
      
      if (coupons && coupons.length > 0) {
        const coupon = coupons[0];
        
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
        
        // Use coupon service to persist and sync coupon
        const result = couponService.setAppliedCoupon(coupon);
        if (result.success) {
          setAppliedCoupon(coupon);
          setCouponCode(''); // Clear the input after successful application
        } else {
          setCouponError('Failed to apply coupon. Please try again.');
        }
      } else {
        setAppliedCoupon(null);
        setCouponError("Invalid or expired coupon code.");
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponError("Could not apply coupon. Please try again.");
    }
  };

  const handleRemoveCoupon = () => {
    const result = couponService.removeAppliedCoupon();
    if (result.success) {
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponError('');
    }
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

  const calculateTax = () => {
    if (!store || !taxRules.length || !cartItems.length) {
      return 0;
    }

    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    
    // Get the current shipping country for tax calculation
    const currentShippingCountry = getShippingCountry();
    const taxShippingAddress = { 
      ...shippingAddress, 
      country: currentShippingCountry 
    };
    
    const taxResult = taxService.calculateTax(
      cartItems,
      cartProducts,
      store,
      taxRules,
      taxShippingAddress,
      subtotal,
      discount
    );
    return taxResult.taxAmount || 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    
    try {
      const response = await AuthService.login(
        loginFormData.email,
        loginFormData.password,
        loginFormData.rememberMe,
        'customer'
      );
      
      // Handle both array and object responses
      let actualResponse = response;
      if (Array.isArray(response)) {
        actualResponse = response[0];
      }
      
      const isSuccess = actualResponse?.success || 
                       actualResponse?.status === 'success' || 
                       actualResponse?.token || 
                       (actualResponse && Object.keys(actualResponse).length > 0);
      
      if (isSuccess) {
        const token = actualResponse.data?.token || actualResponse.token;
        
        if (token) {
          // Clear logged out flag before setting token
          localStorage.removeItem('user_logged_out');
          
          // Store token
          localStorage.setItem('customer_auth_token', token);
          apiClient.setToken(token);
          
          // Reload checkout data with authenticated user
          setShowLoginModal(false);
          await loadCheckoutData();
        }
      } else {
        setLoginError('Invalid email or password');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLoginInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveAddressToAccount = async (addressData, type) => {
    if (!user?.id) return;
    
    try {
      const addressToSave = {
        ...addressData,
        user_id: user.id,
        type: type,
        is_default: userAddresses.length === 0
      };
      
      const savedAddress = await CustomerAddress.create(addressToSave);
      const updatedAddresses = await CustomerAddress.findAll();
      setUserAddresses(updatedAddresses || []);
      
      return savedAddress;
    } catch (error) {
      console.error('Failed to save address:', error);
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
    

    const eligible = shippingMethods.filter(method => {
      const isEligible = method.availability === 'all' || 
        (method.availability === 'specific_countries' && method.countries && method.countries.includes(country));
      
      
      return isEligible;
    });

    return eligible;
  };

  const getEligiblePaymentMethods = () => {
    const country = getBillingCountry();
    return paymentMethods.filter(method => {
      if (!method.countries || method.countries.length === 0) return true;
      return method.countries.includes(country);
    });
  };

  const getDeliveryDateConstraints = () => {
    if (!deliverySettings) return { fromDate: new Date(), toDate: new Date() };

    const today = new Date();
    const offsetDays = deliverySettings.offset_days || 1;
    const maxAdvanceDays = deliverySettings.max_advance_days || 30;

    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() + offsetDays);

    const toDate = new Date(today);
    toDate.setDate(today.getDate() + maxAdvanceDays);

    return { fromDate, toDate };
  };

  const isDateDisabled = (date) => {
    if (!deliverySettings) return true;

    const { fromDate, toDate } = getDeliveryDateConstraints();
    
    // Disable dates outside the allowed range
    if (date < fromDate || date > toDate) return true;

    const dateString = date.toISOString().split('T')[0];
    const weekday = date.getDay();
    const blockedDates = deliverySettings.blocked_dates || [];
    const blockedWeekdays = deliverySettings.blocked_weekdays || [];

    // Disable if date is specifically blocked
    if (blockedDates.includes(dateString)) return true;
    
    // Disable if weekday is blocked
    if (blockedWeekdays.includes(weekday)) return true;

    // Disable if in out of office period
    const outOfOfficeStart = deliverySettings.out_of_office_start ? new Date(deliverySettings.out_of_office_start) : null;
    const outOfOfficeEnd = deliverySettings.out_of_office_end ? new Date(deliverySettings.out_of_office_end) : null;
    
    if (outOfOfficeStart && outOfOfficeEnd && date >= outOfOfficeStart && date <= outOfOfficeEnd) return true;

    return false;
  };

  const getAvailableTimeSlots = () => {
    if (!deliverySettings || !deliverySettings.delivery_time_slots) return [];
    return deliverySettings.delivery_time_slots.filter(slot => slot.is_active);
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
      // Save addresses if requested by user
      if (user && saveShippingAddress && selectedShippingAddress === 'new') {
        await saveAddressToAccount(shippingAddress, 'shipping');
      }
      
      if (user && saveBillingAddress && selectedBillingAddress === 'new' && !useShippingForBilling) {
        await saveAddressToAccount(billingAddress, 'billing');
      }
      
      const selectedMethod = shippingMethods.find(m => m.name === selectedShippingMethod);
      const selectedPaymentMethodObj = paymentMethods.find(m => m.code === selectedPaymentMethod);
      
      const discount = calculateDiscount();
      
      const checkoutData = {
        cartItems,
        shippingAddress: getShippingCountry() === shippingAddress.country ? shippingAddress : userAddresses.find(a => a.id === selectedShippingAddress),
        billingAddress: useShippingForBilling ? (getShippingCountry() === shippingAddress.country ? shippingAddress : userAddresses.find(a => a.id === selectedShippingAddress)) : (getBillingCountry() === billingAddress.country ? billingAddress : userAddresses.find(a => a.id === selectedBillingAddress)),
        store,
        taxAmount: calculateTax(),
        shippingCost,
        paymentFee,
        shippingMethod: selectedMethod,
        selectedShippingMethod,
        selectedPaymentMethod,
        selectedPaymentMethodName: selectedPaymentMethodObj?.name || selectedPaymentMethod,
        discountAmount: discount,
        appliedCoupon,
        deliveryDate: deliveryDate ? deliveryDate.toISOString().split('T')[0] : null,
        deliveryTimeSlot,
        deliveryComments,
        email: user?.email || shippingAddress.email,
        userId: user?.id,
        sessionId: localStorage.getItem('cart_session_id')
      };

      const response = await createStripeCheckout(checkoutData);

      if (!response) {
        throw new Error('No response from checkout API');
      }
      
      // Handle array response from API
      const responseData = Array.isArray(response) ? response[0] : response;

      // Get checkout URL from response
      const checkoutUrl = responseData.checkout_url || responseData.url;
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        console.error('No checkout URL in response:', responseData);
        throw new Error('No checkout URL received');
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
      <CmsBlockRenderer position="checkout_above_form" />

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
                <CmsBlockRenderer position="checkout_above_payment" />
                <div className="space-y-3">
                  {eligiblePaymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`payment-method-${method.id}`}
                        name="paymentMethod"
                        value={method.code}
                        checked={selectedPaymentMethod === method.code}
                        onChange={(e) => {
                          setSelectedPaymentMethod(e.target.value);
                          calculatePaymentFee(e.target.value);
                        }}
                        className="text-blue-600"
                      />
                      <label htmlFor={`payment-method-${method.id}`} className="flex-1 cursor-pointer flex items-center space-x-3">
                        {method.icon_url && (
                          <img src={method.icon_url} alt={method.name} className="w-8 h-8 object-contain" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{method.name}</p>
                          {method.description && (
                            <p className="text-sm text-gray-500">{method.description}</p>
                          )}
                          {method.fee_type !== 'none' && method.fee_amount > 0 && (
                            <p className="text-sm text-gray-600">
                              Fee: {method.fee_type === 'fixed' 
                                ? `${currencySymbol}${formatPrice(method.fee_amount)}`
                                : `${formatPrice(method.fee_amount)}%`
                              }
                            </p>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
                <CmsBlockRenderer position="checkout_below_payment" />
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
                
                {selectedShippingMethod && (
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shippingCost > 0 ? `${currencySymbol}${formatPrice(shippingCost)}` : 'Free'}</span>
                  </div>
                )}
                
                {paymentFee > 0 && (
                  <div className="flex justify-between">
                    <span>Payment Fee</span>
                    <span>{currencySymbol}{formatPrice(paymentFee)}</span>
                  </div>
                )}
                
                {calculateTax() > 0 && (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{currencySymbol}{formatPrice(calculateTax())}</span>
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
                      <form onSubmit={handleLogin} className="space-y-4 mt-4">
                        {loginError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {loginError}
                          </div>
                        )}
                        
                        <div>
                          <Label htmlFor="checkout-login-email">Email Address</Label>
                          <Input
                            id="checkout-login-email"
                            name="email"
                            type="email"
                            required
                            value={loginFormData.email}
                            onChange={handleLoginInputChange}
                            placeholder="Enter your email"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="checkout-login-password">Password</Label>
                          <div className="relative mt-1">
                            <Input
                              id="checkout-login-password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              required
                              value={loginFormData.password}
                              onChange={handleLoginInputChange}
                              placeholder="Enter your password"
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOffIcon className="h-4 w-4 text-gray-400" />
                              ) : (
                                <EyeIcon className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="checkout-rememberMe"
                            name="rememberMe"
                            checked={loginFormData.rememberMe}
                            onChange={handleLoginInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <Label htmlFor="checkout-rememberMe" className="text-sm">
                            Remember me
                          </Label>
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loginLoading}
                        >
                          {loginLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                      </form>
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
                <div className="space-y-4">
                  <div className="space-y-3">
                    {userAddresses.map((address) => (
                      <div key={address.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-start space-x-3">
                          <input
                            type="radio"
                            id={`shipping-${address.id}`}
                            name="shippingAddress"
                            value={address.id}
                            checked={selectedShippingAddress === address.id}
                            onChange={(e) => setSelectedShippingAddress(e.target.value)}
                            className="text-blue-600 mt-1"
                          />
                          <label htmlFor={`shipping-${address.id}`} className="flex-1 cursor-pointer">
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">{address.full_name}</p>
                              <p className="text-gray-600">{address.street}</p>
                              <p className="text-gray-600">{address.city}, {address.state} {address.postal_code}</p>
                              <p className="text-gray-600">{address.country}</p>
                              {address.phone && <p className="text-gray-500 text-xs mt-1">Phone: {address.phone}</p>}
                              {address.is_default && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                                  Default
                                </span>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border rounded-lg p-3 border-dashed border-gray-300">
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
                      <label htmlFor="new-shipping-address" className="cursor-pointer text-blue-600 font-medium">
                        + Add a new shipping address
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                user ? (
                  <p className="text-sm text-gray-600 mb-4">You don't have any saved addresses. Add one below.</p>
                ) : (
                  <p className="text-sm text-gray-600 mb-4">Enter your shipping address</p>
                )
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
                  
                  {user && selectedShippingAddress === 'new' && (
                    <div className="md:col-span-2 flex items-center space-x-2 mt-3">
                      <input
                        type="checkbox"
                        id="save-shipping-address"
                        checked={saveShippingAddress}
                        onChange={(e) => setSaveShippingAddress(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="save-shipping-address" className="text-sm text-gray-700">
                        Save this address to my account for future orders
                      </Label>
                    </div>
                  )}
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

          {/* Delivery Settings */}
          {deliverySettings && deliverySettings.enable_delivery_date && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Delivery Date */}
                  <div>
                    <Label>Preferred Delivery Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal mt-1"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deliveryDate ? deliveryDate.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : "Select a delivery date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={deliveryDate}
                          onSelect={setDeliveryDate}
                          disabled={isDateDisabled}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Slots */}
                  {getAvailableTimeSlots().length > 0 && (
                    <div>
                      <Label htmlFor="delivery-time">Preferred Time Slot</Label>
                      <select
                        id="delivery-time"
                        value={deliveryTimeSlot}
                        onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a time slot</option>
                        {getAvailableTimeSlots().map((slot, index) => (
                          <option key={index} value={`${slot.start_time}-${slot.end_time}`}>
                            {slot.start_time} - {slot.end_time}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Comments */}
          {deliverySettings && deliverySettings.enable_comments && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="delivery-comments">Special delivery instructions (optional)</Label>
                  <textarea
                    id="delivery-comments"
                    value={deliveryComments}
                    onChange={(e) => setDeliveryComments(e.target.value)}
                    placeholder="Any special instructions for delivery..."
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
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
                          <div key={address.id} className="border rounded-lg p-3 hover:bg-gray-50">
                            <div className="flex items-start space-x-3">
                              <input
                                type="radio"
                                id={`billing-${address.id}`}
                                name="billingAddress"
                                value={address.id}
                                checked={selectedBillingAddress === address.id}
                                onChange={(e) => setSelectedBillingAddress(e.target.value)}
                                className="text-blue-600 mt-1"
                              />
                              <label htmlFor={`billing-${address.id}`} className="flex-1 cursor-pointer">
                                <div className="text-sm">
                                  <p className="font-medium text-gray-900">{address.full_name}</p>
                                  <p className="text-gray-600">{address.street}</p>
                                  <p className="text-gray-600">{address.city}, {address.state} {address.postal_code}</p>
                                  <p className="text-gray-600">{address.country}</p>
                                  {address.phone && <p className="text-gray-500 text-xs mt-1">Phone: {address.phone}</p>}
                                  {address.is_default && (
                                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                                      Default
                                    </span>
                                  )}
                                </div>
                              </label>
                            </div>
                          </div>
                        ))}
                        <div className="border rounded-lg p-3 border-dashed border-gray-300">
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
                            <label htmlFor="new-billing-address" className="cursor-pointer text-blue-600 font-medium">
                              + Add a new billing address
                            </label>
                          </div>
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
                        
                        {user && selectedBillingAddress === 'new' && (
                          <div className="md:col-span-2 flex items-center space-x-2 mt-3">
                            <input
                              type="checkbox"
                              id="save-billing-address"
                              checked={saveBillingAddress}
                              onChange={(e) => setSaveBillingAddress(e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <Label htmlFor="save-billing-address" className="text-sm text-gray-700">
                              Save this billing address to my account for future orders
                            </Label>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <CmsBlockRenderer position="checkout_below_form" />
    </div>
  );
}
