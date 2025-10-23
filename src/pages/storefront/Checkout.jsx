
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
import { useAlertTypes } from "@/hooks/useAlert";
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
import { CustomerAuth } from "@/api/storefront-entities";
import CmsBlockRenderer from "@/components/storefront/CmsBlockRenderer";
import apiClient from "@/api/client";
import StepIndicator from "@/components/storefront/StepIndicator";
import { formatPrice as formatPriceUtil } from '@/utils/priceUtils';
import { getProductName, getCurrentLanguage, getShippingMethodName, getShippingMethodDescription, getPaymentMethodName, getPaymentMethodDescription } from '@/utils/translationUtils';
import { useTranslation } from '@/contexts/TranslationContext';

export default function Checkout() {
  const { t } = useTranslation();
  const { store, settings, loading: storeLoading, selectedCountry, setSelectedCountry } = useStore();
  const { showError, AlertComponent } = useAlertTypes();

  // Get currency symbol from settings
  // Currency symbol comes from StoreProvider which derives it from store.currency → getCurrencySymbol()
  const currencySymbol = settings?.currency_symbol;

  // Check if phone field should be shown at checkout
  const showPhoneField = settings?.collect_phone_number_at_checkout;
  
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
  const [taxDetails, setTaxDetails] = useState({ effectiveRate: 0, country: null });
  const [taxRules, setTaxRules] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('');
  const [deliveryComments, setDeliveryComments] = useState('');
  const [deliverySettings, setDeliverySettings] = useState(null);

  // Multi-step checkout state
  const [currentStep, setCurrentStep] = useState(0);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Track if data has been restored to prevent overwriting on initial load
  const [dataRestored, setDataRestored] = useState(false);

  // Form validation errors
  const [shippingErrors, setShippingErrors] = useState({});
  const [billingErrors, setBillingErrors] = useState({});
  const [shippingAddressSelectionError, setShippingAddressSelectionError] = useState('');

  useEffect(() => {
    loadCheckoutData();
  }, [store?.id, storeLoading]);

  // Load persisted form data from localStorage after loading completes
  useEffect(() => {
    if (!loading && !dataRestored) {
      try {
        const persistedData = localStorage.getItem('checkout_form_data');
        if (persistedData) {
          const data = JSON.parse(persistedData);

          // Restore shipping address
          if (data.shippingAddress) {
            setShippingAddress(data.shippingAddress);
          }

          // Restore billing address
          if (data.billingAddress) {
            setBillingAddress(data.billingAddress);
          }

          // Restore selected addresses
          if (data.selectedShippingAddress) {
            setSelectedShippingAddress(data.selectedShippingAddress);
          }
          if (data.selectedBillingAddress) {
            setSelectedBillingAddress(data.selectedBillingAddress);
          }

          // Restore delivery settings
          if (data.deliveryDate) {
            setDeliveryDate(new Date(data.deliveryDate));
          }
          if (data.deliveryTimeSlot) {
            setDeliveryTimeSlot(data.deliveryTimeSlot);
          }
          if (data.deliveryComments) {
            setDeliveryComments(data.deliveryComments);
          }

          // Restore current step
          if (typeof data.currentStep === 'number') {
            setCurrentStep(data.currentStep);
          }

          // Restore checkboxes
          if (typeof data.useShippingForBilling === 'boolean') {
            setUseShippingForBilling(data.useShippingForBilling);
          }
          if (typeof data.saveShippingAddress === 'boolean') {
            setSaveShippingAddress(data.saveShippingAddress);
          }
          if (typeof data.saveBillingAddress === 'boolean') {
            setSaveBillingAddress(data.saveBillingAddress);
          }

          setDataRestored(true);
        }
      } catch (error) {
        console.error('Failed to load persisted checkout data:', error);
      }
    }
  }, [loading, dataRestored]);

  // Persist form data to localStorage whenever it changes (only after initial load)
  useEffect(() => {
    if (!loading) {
      try {
        const dataToSave = {
          shippingAddress,
          billingAddress,
          selectedShippingAddress,
          selectedBillingAddress,
          deliveryDate: deliveryDate ? deliveryDate.toISOString() : null,
          deliveryTimeSlot,
          deliveryComments,
          currentStep,
          useShippingForBilling,
          saveShippingAddress,
          saveBillingAddress,
          timestamp: new Date().toISOString()
        };

        localStorage.setItem('checkout_form_data', JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Failed to persist checkout data:', error);
      }
    }
  }, [
    shippingAddress,
    billingAddress,
    selectedShippingAddress,
    selectedBillingAddress,
    deliveryDate,
    deliveryTimeSlot,
    deliveryComments,
    currentStep,
    useShippingForBilling,
    saveShippingAddress,
    saveBillingAddress,
    loading
  ]);

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
      
      // Load user - use CustomerAuth for customer checkout
      try {
        // Check if customer is logged in
        if (CustomerAuth.isAuthenticated()) {
          const userData = await CustomerAuth.me();
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
        } else {
          setUser(null);
          setUserAddresses([]);
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
      let sessionId = localStorage.getItem('guest_session_id');
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
      const basePrice = calculateItemBasePrice(item, product);
      const lineTotal = basePrice * item.quantity;

      return total + (isNaN(lineTotal) ? 0 : lineTotal);
    }, 0);

    return isNaN(subtotal) ? 0 : subtotal;
  };

  const calculateOptionsTotal = () => {
    const optionsTotal = cartItems.reduce((total, item) => {
      const optionsPrice = (item.selected_options || []).reduce((sum, option) => sum + (parseFloat(option.price) || 0), 0);
      const lineTotal = optionsPrice * item.quantity;

      return total + (isNaN(lineTotal) ? 0 : lineTotal);
    }, 0);

    return isNaN(optionsTotal) ? 0 : optionsTotal;
  };

  const calculateItemBasePrice = (item, product) => {
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

    return basePrice;
  };

  const getTotalAmount = () => {
    const subtotal = calculateSubtotal();
    const optionsTotal = calculateOptionsTotal();
    const discount = calculateDiscount();
    const shipping = isNaN(parseFloat(shippingCost)) ? 0 : parseFloat(shippingCost);
    const paymentMethodFee = isNaN(parseFloat(paymentFee)) ? 0 : parseFloat(paymentFee);
    const tax = calculateTax(); // Use calculated tax instead of state
    const total = subtotal + optionsTotal - discount + shipping + paymentMethodFee + tax;
    
    
    return isNaN(total) ? 0 : total;
  };

  // formatPrice now uses centralized utility from priceUtils
  const formatPrice = (value) => {
    return formatPriceUtil(value);
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
      setCouponError(t('common.enter_coupon_code', 'Please enter a coupon code'));
      return;
    }

    if (!store?.id) {
      setCouponError(t('common.store_info_not_available', 'Store information not available'));
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
            setCouponError(t('common.coupon_expired', 'This coupon has expired'));
            return;
          }
        }

        // Check if coupon has started
        if (coupon.start_date) {
          const startDate = new Date(coupon.start_date);
          const now = new Date();
          if (startDate > now) {
            setCouponError(t('common.coupon_not_active', 'This coupon is not yet active'));
            return;
          }
        }

        // Check usage limit
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
          setCouponError(t('common.coupon_usage_limit', 'This coupon has reached its usage limit'));
          return;
        }
        
        // Check minimum purchase amount
        const subtotal = calculateSubtotal();
        if (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) {
          const message = t('common.minimum_order_required', 'Minimum order amount of {amount} required').replace('{amount}', formatPrice(coupon.min_purchase_amount));
          setCouponError(message);
          return;
        }

        // Check if coupon applies to products in cart
        if (coupon.applicable_products && coupon.applicable_products.length > 0) {
          const hasApplicableProduct = cartItems.some(item =>
            coupon.applicable_products.includes(item.product_id)
          );
          if (!hasApplicableProduct) {
            setCouponError(t('common.coupon_not_apply', 'This coupon doesn\'t apply to products in your cart'));
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
            setCouponError(t('common.coupon_not_apply', 'This coupon doesn\'t apply to products in your cart'));
            return;
          }
        }

        // Use coupon service to persist and sync coupon
        const result = couponService.setAppliedCoupon(coupon);
        if (result.success) {
          setAppliedCoupon(coupon);
          setCouponCode(''); // Clear the input after successful application
        } else {
          setCouponError(t('common.failed_apply_coupon', 'Failed to apply coupon'));
        }
      } else {
        setAppliedCoupon(null);
        setCouponError(t('common.invalid_coupon', 'Invalid or expired coupon code'));
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponError(t('common.could_not_apply_coupon', 'Could not apply coupon'));
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

    // Update tax details state
    setTaxDetails({
      effectiveRate: taxResult.effectiveRate || 0,
      country: currentShippingCountry
    });

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
        'customer',
        store?.id
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
          // The cart service will automatically merge guest cart with user cart
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
      
      // Enrich cart items with product details for order creation
      const enrichedCartItems = cartItems.map(item => {
        const product = cartProducts[item.product_id];
        const translatedName = product ? (getProductName(product, getCurrentLanguage()) || product.name) : (item.product_name || item.name || 'Product');
        return {
          ...item,
          product_name: translatedName,
          name: translatedName,
          sku: product?.sku || item.sku || '',
          price: item.price || product?.price || 0
        };
      });

      // Determine which shipping address to use
      let finalShippingAddress;
      if (user && selectedShippingAddress && selectedShippingAddress !== 'new') {
        // User selected an existing saved address
        finalShippingAddress = userAddresses.find(a => a.id === selectedShippingAddress);
      } else {
        // Guest user or user entering new address
        finalShippingAddress = shippingAddress;
      }

      // Determine which billing address to use
      let finalBillingAddress;
      if (useShippingForBilling) {
        finalBillingAddress = finalShippingAddress;
      } else if (user && selectedBillingAddress && selectedBillingAddress !== 'new') {
        // User selected an existing saved billing address
        finalBillingAddress = userAddresses.find(a => a.id === selectedBillingAddress);
      } else {
        // Guest user or user entering new billing address
        finalBillingAddress = billingAddress;
      }

      const checkoutData = {
        cartItems: enrichedCartItems,
        shippingAddress: finalShippingAddress,
        billingAddress: finalBillingAddress,
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
        // Use shipping address email first (what user just entered), fallback to user email for logged-in users
        email: finalShippingAddress.email || user?.email,
        userId: user?.id,
        sessionId: localStorage.getItem('guest_session_id')
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
        // Clear persisted checkout form data on successful checkout
        localStorage.removeItem('checkout_form_data');
        window.location.href = checkoutUrl;
      } else {
        console.error('No checkout URL in response:', responseData);
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      showError('Checkout failed. Please try again.');
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('common.cart_empty', 'Your cart is empty')}</h1>
        <p className="text-gray-600 mb-6">{t('common.add_products_checkout', 'Add products before checkout')}</p>
        <Button onClick={() => navigate(createPageUrl('Storefront'))}>
          {t('common.continue_shopping', 'Continue Shopping')}
        </Button>
      </div>
    );
  }

  const eligibleShippingMethods = getEligibleShippingMethods();
  const eligiblePaymentMethods = getEligiblePaymentMethods();

  // Get checkout styling from settings
  const checkoutSectionTitleColor = settings?.checkout_section_title_color || '#111827';
  const checkoutSectionTitleSize = settings?.checkout_section_title_size || '1.25rem';
  const checkoutSectionBgColor = settings?.checkout_section_bg_color || '#FFFFFF';
  const checkoutSectionBorderColor = settings?.checkout_section_border_color || '#E5E7EB';

  // Get step settings
  const stepsCount = settings?.checkout_steps_count || 3;
  const stepIndicatorStyle = settings?.checkout_step_indicator_style || 'circles';
  const stepActiveColor = settings?.checkout_step_indicator_active_color || '#007bff';
  const stepInactiveColor = settings?.checkout_step_indicator_inactive_color || '#D1D5DB';
  const stepCompletedColor = settings?.checkout_step_indicator_completed_color || '#10B981';

  // Get column configuration based on step count
  const getColumnCount = () => {
    if (stepsCount === 1) return settings?.checkout_1step_columns ?? 3;
    if (stepsCount === 2) return settings?.checkout_2step_columns ?? 2;
    return settings?.checkout_3step_columns ?? 2;
  };

  const columnCount = getColumnCount();

  // Get layout configuration based on step count and current step
  const getLayout = () => {
    const stepKey = `step${currentStep + 1}`;

    if (stepsCount === 1) {
      const fullLayout = settings?.checkout_1step_layout;
      return fullLayout?.step1 || { column1: [], column2: [], column3: [] };
    }

    if (stepsCount === 2) {
      const fullLayout = settings?.checkout_2step_layout;
      return fullLayout?.[stepKey] || { column1: [], column2: [], column3: [] };
    }

    // stepsCount === 3
    const fullLayout = settings?.checkout_3step_layout;
    return fullLayout?.[stepKey] || { column1: [], column2: [], column3: [] };
  };

  const layout = getLayout();

  // Define step configurations based on step count
  const getStepConfig = () => {
    if (stepsCount === 1) {
      return {
        steps: ['Checkout'],
        sections: [['account', 'shipping', 'delivery', 'billing', 'payment', 'review']]
      };
    } else if (stepsCount === 2) {
      return {
        steps: [
          settings?.checkout_2step_step1_name || 'Information',
          settings?.checkout_2step_step2_name || 'Payment'
        ],
        sections: [
          ['account', 'shipping', 'delivery', 'billing'],
          ['payment', 'review']
        ]
      };
    } else {
      return {
        steps: [
          settings?.checkout_3step_step1_name || 'Information',
          settings?.checkout_3step_step2_name || 'Shipping',
          settings?.checkout_3step_step3_name || 'Payment'
        ],
        sections: [
          ['account', 'shipping', 'billing'],
          ['delivery'],
          ['payment', 'review']
        ]
      };
    }
  };

  const stepConfig = getStepConfig();

  // Check if a section should be visible in current step
  const isSectionVisible = (sectionName) => {
    if (stepsCount === 1) return true;
    return stepConfig.sections[currentStep]?.includes(sectionName);
  };

  // Navigation handlers
  const canGoNext = () => {
    return currentStep < stepConfig.steps.length - 1;
  };

  const canGoPrev = () => {
    return currentStep > 0;
  };

  // Validate current step before proceeding
  const validateCurrentStep = () => {
    const newShippingErrors = {};
    const newBillingErrors = {};
    let hasErrors = false;

    // Step 0 validation for both 2-step and 3-step
    if (currentStep === 0) {
      // Validate shipping address selection for logged-in users with saved addresses
      if (user && userAddresses.length > 0 && !selectedShippingAddress) {
        setShippingAddressSelectionError('Please select a shipping address or add a new one');
        hasErrors = true;
      } else {
        setShippingAddressSelectionError('');
      }

      // Validate shipping address form fields (for new address or guest checkout)
      if (!user || selectedShippingAddress === 'new' || userAddresses.length === 0) {
        // Email validation
        if (!shippingAddress.email) {
          newShippingErrors.email = true;
          hasErrors = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
          newShippingErrors.email = true;
          hasErrors = true;
        }

        // Required field validation
        if (!shippingAddress.full_name) {
          newShippingErrors.full_name = true;
          hasErrors = true;
        }
        if (showPhoneField && !shippingAddress.phone) {
          newShippingErrors.phone = true;
          hasErrors = true;
        }
        if (!shippingAddress.street) {
          newShippingErrors.street = true;
          hasErrors = true;
        }
        if (!shippingAddress.city) {
          newShippingErrors.city = true;
          hasErrors = true;
        }
        if (!shippingAddress.state) {
          newShippingErrors.state = true;
          hasErrors = true;
        }
        if (!shippingAddress.postal_code) {
          newShippingErrors.postal_code = true;
          hasErrors = true;
        }
        if (!shippingAddress.country) {
          newShippingErrors.country = true;
          hasErrors = true;
        }
      }

      // Validate billing address if different from shipping
      if (!useShippingForBilling) {
        if (!user || selectedBillingAddress === 'new' || userAddresses.length === 0) {
          // Email validation for billing
          if (!billingAddress.email) {
            newBillingErrors.email = true;
            hasErrors = true;
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingAddress.email)) {
            newBillingErrors.email = true;
            hasErrors = true;
          }

          if (!billingAddress.full_name) {
            newBillingErrors.full_name = true;
            hasErrors = true;
          }
          if (showPhoneField && !billingAddress.phone) {
            newBillingErrors.phone = true;
            hasErrors = true;
          }
          if (!billingAddress.street) {
            newBillingErrors.street = true;
            hasErrors = true;
          }
          if (!billingAddress.city) {
            newBillingErrors.city = true;
            hasErrors = true;
          }
          if (!billingAddress.state) {
            newBillingErrors.state = true;
            hasErrors = true;
          }
          if (!billingAddress.postal_code) {
            newBillingErrors.postal_code = true;
            hasErrors = true;
          }
          if (!billingAddress.country) {
            newBillingErrors.country = true;
            hasErrors = true;
          }
        }
      }
    }

    setShippingErrors(newShippingErrors);
    setBillingErrors(newBillingErrors);

    if (hasErrors) {
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }

    return true;
  };

  const goToNextStep = () => {
    if (canGoNext()) {
      if (validateCurrentStep()) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const goToPrevStep = () => {
    if (canGoPrev()) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Map section names to their JSX components
  const renderSection = (sectionName) => {
    switch (sectionName) {
      case 'Shipping Address':
        return isSectionVisible('shipping') && (
          <Card key="shipping-address" style={{ backgroundColor: checkoutSectionBgColor, borderColor: checkoutSectionBorderColor }}>
            <CardHeader>
              <CardTitle style={{ color: checkoutSectionTitleColor, fontSize: checkoutSectionTitleSize }}>{t('common.shipping_address', 'Shipping Address')}</CardTitle>
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
                            onChange={(e) => {
                              setSelectedShippingAddress(e.target.value);
                              setShippingAddressSelectionError('');
                            }}
                            className="text-blue-600 mt-1"
                          />
                          <label htmlFor={`shipping-${address.id}`} className="flex-1 cursor-pointer">
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">{address.full_name}</p>
                              <p className="text-gray-600">{address.street}</p>
                              <p className="text-gray-600">{address.city}, {address.state} {address.postal_code}</p>
                              <p className="text-gray-600">{address.country}</p>
                              {address.phone && <p className="text-gray-500 text-xs mt-1">{t('common.phone', 'Phone')} {address.phone}</p>}
                              {address.is_default && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                                  {t('checkout.default', 'Default')}
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
                        onChange={(e) => {
                          setSelectedShippingAddress(e.target.value);
                          setShippingAddressSelectionError('');
                        }}
                        className="text-blue-600"
                      />
                      <label htmlFor="new-shipping-address" className="cursor-pointer text-blue-600 font-medium">
                        {t('checkout.add_new_shipping_address', 'Add New Shipping Address')}
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                user ? (
                  <p className="text-sm text-gray-600 mb-4">{t('checkout.no_saved_addresses', 'No saved addresses')}</p>
                ) : (
                  <p className="text-sm text-gray-600 mb-4">{t('checkout.enter_shipping_address', 'Enter shipping address')}</p>
                )
              )}

              {/* Display validation error for address selection */}
              {shippingAddressSelectionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-4">
                  <p className="text-sm font-medium">{shippingAddressSelectionError}</p>
                </div>
              )}

              {(!user || userAddresses.length === 0 || selectedShippingAddress === 'new') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder={t('common.email', 'Email')}
                      type="email"
                      required
                      value={shippingAddress.email}
                      onChange={(e) => {
                        setShippingAddress(prev => ({ ...prev, email: e.target.value }));
                        setShippingErrors(prev => ({ ...prev, email: false }));
                      }}
                      className={shippingErrors.email ? 'border-red-500' : ''}
                    />
                    {shippingAddress.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email) && (
                      <p className="text-xs text-red-600 mt-1">{t('checkout.valid_email_required', 'Valid email required')}</p>
                    )}
                  </div>
                  <Input
                    placeholder={t('common.full_name', 'Full Name')}
                    className={`md:col-span-2 ${shippingErrors.full_name ? 'border-red-500' : ''}`}
                    required
                    value={shippingAddress.full_name}
                    onChange={(e) => {
                      setShippingAddress(prev => ({ ...prev, full_name: e.target.value }));
                      setShippingErrors(prev => ({ ...prev, full_name: false }));
                    }}
                  />
                  {showPhoneField && (
                    <Input
                      placeholder={t('common.phone', 'Phone Number')}
                      type="tel"
                      className={`md:col-span-2 ${shippingErrors.phone ? 'border-red-500' : ''}`}
                      required
                      value={shippingAddress.phone}
                      onChange={(e) => {
                        setShippingAddress(prev => ({ ...prev, phone: e.target.value }));
                        setShippingErrors(prev => ({ ...prev, phone: false }));
                      }}
                    />
                  )}
                  <Input
                    placeholder={t('common.street_address', 'Street Address')}
                    className={`md:col-span-2 ${shippingErrors.street ? 'border-red-500' : ''}`}
                    required
                    value={shippingAddress.street}
                    onChange={(e) => {
                      setShippingAddress(prev => ({ ...prev, street: e.target.value }));
                      setShippingErrors(prev => ({ ...prev, street: false }));
                    }}
                  />
                  <Input
                    placeholder={t('common.city', 'City')}
                    className={shippingErrors.city ? 'border-red-500' : ''}
                    required
                    value={shippingAddress.city}
                    onChange={(e) => {
                      setShippingAddress(prev => ({ ...prev, city: e.target.value }));
                      setShippingErrors(prev => ({ ...prev, city: false }));
                    }}
                  />
                  <Input
                    placeholder={t('common.state_province', 'State / Province')}
                    className={shippingErrors.state ? 'border-red-500' : ''}
                    required
                    value={shippingAddress.state}
                    onChange={(e) => {
                      setShippingAddress(prev => ({ ...prev, state: e.target.value }));
                      setShippingErrors(prev => ({ ...prev, state: false }));
                    }}
                  />
                  <Input
                    placeholder={t('common.postal_code', 'Postal Code')}
                    className={shippingErrors.postal_code ? 'border-red-500' : ''}
                    required
                    value={shippingAddress.postal_code}
                    onChange={(e) => {
                      setShippingAddress(prev => ({ ...prev, postal_code: e.target.value }));
                      setShippingErrors(prev => ({ ...prev, postal_code: false }));
                    }}
                  />
                  <CountrySelect
                    value={shippingAddress.country}
                    onChange={(country) => {
                      setShippingAddress(prev => ({ ...prev, country }));
                      setShippingErrors(prev => ({ ...prev, country: false }));
                    }}
                    placeholder={t('common.country', 'Select Country')}
                    allowedCountries={settings?.allowed_countries}
                    required
                    className={shippingErrors.country ? 'border-red-500' : ''}
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
                        {t('checkout.save_address_future', 'Save address for future use')}
                      </Label>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'Shipping Method':
        return isSectionVisible('shipping') && eligibleShippingMethods.length > 0 && (
          <Card key="shipping-method" style={{ backgroundColor: checkoutSectionBgColor, borderColor: checkoutSectionBorderColor }}>
            <CardHeader>
              <CardTitle style={{ color: checkoutSectionTitleColor, fontSize: checkoutSectionTitleSize }}>{t('common.shipping_method', 'Shipping Method')}</CardTitle>
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
                      <span>{getShippingMethodName(method, getCurrentLanguage()) || method.name}</span>
                      <span className="font-medium">
                        {method.type === 'free_shipping' && calculateSubtotal() >= (method.free_shipping_min_order || 0)
                          ? t('common.free', 'Free')
                          : formatPrice(method.flat_rate_cost || 0)
                        }
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'Billing Address':
        return isSectionVisible('billing') && (
          <Card key="billing-address" style={{ backgroundColor: checkoutSectionBgColor, borderColor: checkoutSectionBorderColor }}>
            <CardHeader>
              <CardTitle style={{ color: checkoutSectionTitleColor, fontSize: checkoutSectionTitleSize }}>{t('common.billing_address', 'Billing Address')}</CardTitle>
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
                    {t('checkout.same_as_shipping', 'Same as shipping address')}
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
                                  {address.phone && <p className="text-gray-500 text-xs mt-1">{t('common.phone', 'Phone')} {address.phone}</p>}
                                  {address.is_default && (
                                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                                      {t('checkout.default', 'Default')}
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
                              {t('checkout.add_new_billing_address', 'Add New Billing Address')}
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {(!user || userAddresses.length === 0 || selectedBillingAddress === 'new') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Input
                            placeholder={t('common.email', 'Email')}
                            type="email"
                            required
                            value={billingAddress.email}
                            onChange={(e) => {
                              setBillingAddress(prev => ({ ...prev, email: e.target.value }));
                              setBillingErrors(prev => ({ ...prev, email: false }));
                            }}
                            className={billingErrors.email ? 'border-red-500' : ''}
                          />
                          {billingAddress.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingAddress.email) && (
                            <p className="text-xs text-red-600 mt-1">{t('checkout.valid_email_required', 'Valid email required')}</p>
                          )}
                        </div>
                        <Input
                          placeholder={t('common.full_name', 'Full Name')}
                          className={`md:col-span-2 ${billingErrors.full_name ? 'border-red-500' : ''}`}
                          required
                          value={billingAddress.full_name}
                          onChange={(e) => {
                            setBillingAddress(prev => ({ ...prev, full_name: e.target.value }));
                            setBillingErrors(prev => ({ ...prev, full_name: false }));
                          }}
                        />
                        {showPhoneField && (
                          <Input
                            placeholder={t('common.phone', 'Phone Number')}
                            type="tel"
                            className={`md:col-span-2 ${billingErrors.phone ? 'border-red-500' : ''}`}
                            required
                            value={billingAddress.phone}
                            onChange={(e) => {
                              setBillingAddress(prev => ({ ...prev, phone: e.target.value }));
                              setBillingErrors(prev => ({ ...prev, phone: false }));
                            }}
                          />
                        )}
                        <Input
                          placeholder={t('common.street', 'Street Address')}
                          className={`md:col-span-2 ${billingErrors.street ? 'border-red-500' : ''}`}
                          required
                          value={billingAddress.street}
                          onChange={(e) => {
                            setBillingAddress(prev => ({ ...prev, street: e.target.value }));
                            setBillingErrors(prev => ({ ...prev, street: false }));
                          }}
                        />
                        <Input
                          placeholder={t('common.city', 'City')}
                          className={billingErrors.city ? 'border-red-500' : ''}
                          required
                          value={billingAddress.city}
                          onChange={(e) => {
                            setBillingAddress(prev => ({ ...prev, city: e.target.value }));
                            setBillingErrors(prev => ({ ...prev, city: false }));
                          }}
                        />
                        <Input
                          placeholder={t('common.state_province', 'State / Province')}
                          className={billingErrors.state ? 'border-red-500' : ''}
                          required
                          value={billingAddress.state}
                          onChange={(e) => {
                            setBillingAddress(prev => ({ ...prev, state: e.target.value }));
                            setBillingErrors(prev => ({ ...prev, state: false }));
                          }}
                        />
                        <Input
                          placeholder={t('common.postal_code', 'Postal Code')}
                          className={billingErrors.postal_code ? 'border-red-500' : ''}
                          required
                          value={billingAddress.postal_code}
                          onChange={(e) => {
                            setBillingAddress(prev => ({ ...prev, postal_code: e.target.value }));
                            setBillingErrors(prev => ({ ...prev, postal_code: false }));
                          }}
                        />
                        <CountrySelect
                          value={billingAddress.country}
                          onChange={(country) => {
                            setBillingAddress(prev => ({ ...prev, country }));
                            setBillingErrors(prev => ({ ...prev, country: false }));
                          }}
                          placeholder={t('common.country', 'Select Country')}
                          allowedCountries={settings?.allowed_countries}
                          required
                          className={billingErrors.country ? 'border-red-500' : ''}
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
                              {t('checkout.save_billing_future', 'Save billing address for future use')}
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
        );

      case 'Delivery Settings':
        return isSectionVisible('delivery') && deliverySettings && (deliverySettings.enable_delivery_date || deliverySettings.enable_comments) && (
          <Card key="delivery-settings" style={{ backgroundColor: checkoutSectionBgColor, borderColor: checkoutSectionBorderColor }}>
            <CardHeader>
              <CardTitle style={{ color: checkoutSectionTitleColor, fontSize: checkoutSectionTitleSize }}>{t('checkout.delivery_settings', 'Delivery Settings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliverySettings.enable_delivery_date && (
                  <div>
                    <Label>{t('checkout.preferred_delivery_date', 'Preferred Delivery Date')}</Label>
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
                          }) : t('checkout.select_delivery_date', 'Select delivery date')}
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
                )}

                {deliverySettings.enable_delivery_date && getAvailableTimeSlots().length > 0 && (
                  <div>
                    <Label htmlFor="delivery-time">{t('checkout.preferred_time_slot', 'Preferred Time Slot')}</Label>
                    <select
                      id="delivery-time"
                      value={deliveryTimeSlot}
                      onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('checkout.select_time_slot', 'Select time slot')}</option>
                      {getAvailableTimeSlots().map((slot, index) => (
                        <option key={index} value={`${slot.start_time}-${slot.end_time}`}>
                          {slot.start_time} - {slot.end_time}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {deliverySettings.enable_comments && (
                  <div>
                    <Label htmlFor="delivery-comments">{t('checkout.special_delivery_instructions', 'Special Delivery Instructions')}</Label>
                    <textarea
                      id="delivery-comments"
                      value={deliveryComments}
                      onChange={(e) => setDeliveryComments(e.target.value)}
                      placeholder={t('checkout.special_instructions_placeholder', 'Enter any special instructions')}
                      rows={3}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'Payment Method':
        return isSectionVisible('payment') && eligiblePaymentMethods.length > 0 && (
          <Card key="payment-method" style={{ backgroundColor: checkoutSectionBgColor, borderColor: checkoutSectionBorderColor }}>
            <CardHeader>
              <CardTitle style={{ color: checkoutSectionTitleColor, fontSize: checkoutSectionTitleSize }}>{t('checkout.payment_method', 'Payment Method')}</CardTitle>
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
                        <p className="font-medium">{getPaymentMethodName(method, getCurrentLanguage()) || method.name}</p>
                        {(getPaymentMethodDescription(method, getCurrentLanguage()) || method.description) && (
                          <p className="text-sm text-gray-500">{getPaymentMethodDescription(method, getCurrentLanguage()) || method.description}</p>
                        )}
                        {method.fee_type !== 'none' && method.fee_amount > 0 && (
                          <p className="text-sm text-gray-600">
                            {t('checkout.fee', 'Fee')} {method.fee_type === 'fixed'
                              ? formatPrice(method.fee_amount)
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
        );

      case 'Coupon':
        return (
          <Card key="coupon" style={{ backgroundColor: checkoutSectionBgColor, borderColor: checkoutSectionBorderColor }}>
            <CardHeader>
              <CardTitle style={{ color: checkoutSectionTitleColor, fontSize: checkoutSectionTitleSize }}>{t('common.apply_coupon', 'Apply Coupon')}</CardTitle>
            </CardHeader>
            <CardContent>
              {!appliedCoupon ? (
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      placeholder={t('checkout.enter_coupon_code', 'Enter coupon code')}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyPress={handleCouponKeyPress}
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim()}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      {t('checkout.apply', 'Apply')}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-red-600">{couponError}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-800">{appliedCoupon.name}</p>
                    <p className="text-xs text-green-600">
                      {appliedCoupon.discount_type === 'fixed'
                        ? `${formatPrice(appliedCoupon.discount_value)} ${t('checkout.off', 'off')}`
                        : `${formatPrice(appliedCoupon.discount_value)}% ${t('checkout.off', 'off')}`
                      }
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveCoupon}
                    className="text-red-600 hover:text-red-800"
                  >
                    {t('common.remove', 'Remove')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'Order Summary':
        return (
          <Card key="order-summary" style={{ backgroundColor: checkoutSectionBgColor, borderColor: checkoutSectionBorderColor }}>
            <CardHeader>
              <CardTitle style={{ color: checkoutSectionTitleColor, fontSize: checkoutSectionTitleSize }}>{t('checkout.order_summary', 'Order Summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      <h3 className="font-medium text-gray-900">{t('checkout.items_in_cart', 'Items in Cart')} ({cartItems.length})</h3>
                    </AccordionTrigger>
                    <AccordionContent>
                      {cartItems.map((item) => {
                        const product = cartProducts[item.product_id];
                        if (!product) return null;

                        // Get translated product name
                        const translatedProductName = getProductName(product, getCurrentLanguage()) || product.name;

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
                              alt={translatedProductName}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{translatedProductName}</h4>
                              <p className="text-sm text-gray-500">{formatPrice(basePrice)} {t('checkout.each', 'each')}</p>

                              {item.selected_options && item.selected_options.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.selected_options.map((option, idx) => (
                                    <div key={idx}>+ {option.name} (+{formatPrice(option.price)})</div>
                                  ))}
                                </div>
                              )}

                              <p className="text-sm text-gray-600 mt-1">{t('checkout.qty', 'Qty')} {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(itemTotal)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>{t('checkout.subtotal', 'Subtotal')}</span>
                  <span>{formatPrice(calculateSubtotal())}</span>
                </div>

                {calculateOptionsTotal() > 0 && (
                  <div className="flex justify-between">
                    <span>{t('checkout.custom_options', 'Custom Options')}</span>
                    <span>{formatPrice(calculateOptionsTotal())}</span>
                  </div>
                )}

                {appliedCoupon && calculateDiscount() > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('checkout.discount', 'Discount')} ({appliedCoupon.name})</span>
                    <span>-{formatPrice(calculateDiscount())}</span>
                  </div>
                )}

                {selectedShippingMethod && (
                  <div className="flex justify-between">
                    <span>{t('checkout.shipping', 'Shipping')}</span>
                    <span>{shippingCost > 0 ? formatPrice(shippingCost) : t('common.free', 'Free')}</span>
                  </div>
                )}

                {paymentFee > 0 && (
                  <div className="flex justify-between">
                    <span>{t('checkout.payment_fee', 'Payment Fee')}</span>
                    <span>{formatPrice(paymentFee)}</span>
                  </div>
                )}

                {calculateTax() > 0 && (
                  <div className="flex justify-between">
                    <span>
                      {t('checkout.tax', 'Tax')}
                      {taxDetails && taxDetails.country && (
                        <span className="text-gray-500 text-sm ml-1">
                          ({taxDetails.country} {taxDetails.effectiveRate ? `${taxDetails.effectiveRate}%` : ''})
                        </span>
                      )}
                    </span>
                    <span>{formatPrice(calculateTax())}</span>
                  </div>
                )}

                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>{t('checkout.total', 'Total')}</span>
                  <span>{formatPrice(getTotalAmount())}</span>
                </div>
              </div>

              {isSectionVisible('review') && (
                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing || cartItems.length === 0}
                  className="w-full h-12 text-lg"
                  style={{
                    backgroundColor: settings?.theme?.place_order_button_color || '#28a745',
                    color: '#FFFFFF',
                  }}
                >
                  {isProcessing ? t('checkout.processing', 'Processing...') : `${t('common.place_order', 'Place Order')} - ${formatPrice(getTotalAmount())}`}
                </Button>
              )}
            </CardContent>
          </Card>
        );

      case 'Summary':
        // Summary is now rendered as a full-width bar outside the grid
        return null;

      default:
        return null;
    }
  };

  // Get summary of completed steps
  const getCompletedStepsSummary = () => {
    const summaries = [];

    // Step 0 summary (Account + Shipping + Billing for both 2-step and 3-step)
    if (currentStep > 0) {
      const items = [];

      if (user) {
        items.push({ label: 'Account', value: user.email });
      }

      // Shipping address (shown for both 2-step and 3-step)
      if (user && selectedShippingAddress && selectedShippingAddress !== 'new') {
        const address = userAddresses.find(a => a.id === selectedShippingAddress);
        if (address) {
          items.push({
            label: t('common.shipping_address'),
            value: `${address.full_name}, ${address.street}, ${address.city}, ${address.state} ${address.postal_code}, ${address.country}`
          });
        }
      } else if (shippingAddress.full_name) {
        items.push({
          label: t('common.shipping_address'),
          value: `${shippingAddress.full_name}, ${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}, ${shippingAddress.country}`
        });
      }

      // Billing address (if different from shipping)
      if (!useShippingForBilling && billingAddress.full_name) {
        items.push({
          label: t('common.billing_address'),
          value: `${billingAddress.full_name}, ${billingAddress.street}, ${billingAddress.city}, ${billingAddress.state} ${billingAddress.postal_code}, ${billingAddress.country}`
        });
      }

      if (items.length > 0) {
        summaries.push({ step: stepConfig.steps[0], items });
      }
    }

    // Step 1 summary for 3-step mode (Shipping Method + Delivery)
    if (stepsCount === 3 && currentStep > 1) {
      const items = [];

      if (selectedShippingMethod) {
        items.push({ label: t('common.shipping_method'), value: selectedShippingMethod });
      }

      if (deliveryDate) {
        items.push({
          label: 'Delivery Date',
          value: deliveryDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        });
      }

      if (deliveryTimeSlot) {
        items.push({ label: 'Delivery Time', value: deliveryTimeSlot });
      }

      if (items.length > 0) {
        summaries.push({ step: stepConfig.steps[1], items });
      }
    }

    // Step 1 summary for 2-step (includes shipping and delivery)
    if (stepsCount === 2 && currentStep > 0) {
      const items = [];

      if (selectedShippingMethod) {
        items.push({ label: t('common.shipping_method'), value: selectedShippingMethod });
      }

      if (deliveryDate) {
        items.push({
          label: t('checkout.preferred_delivery_date'),
          value: deliveryDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        });
      }

      if (items.length > 0) {
        summaries.push({ step: stepConfig.steps[0], items });
      }
    }

    return summaries;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
      <h1 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8">{t('checkout.title', 'Checkout')}</h1>
      <CmsBlockRenderer position="checkout_above_form" />

      {/* Step Indicator */}
      {stepsCount > 1 && (
        <StepIndicator
          steps={stepConfig.steps}
          currentStep={currentStep}
          style={stepIndicatorStyle}
          activeColor={stepActiveColor}
          inactiveColor={stepInactiveColor}
          completedColor={stepCompletedColor}
        />
      )}

      {/* Summary Bar - Full Width Below Step Indicators */}
      {stepsCount > 1 && currentStep > 0 && (
          <div className="flex flex-wrap items-center gap-x-1 gap-y-3 mb-3">
            {getCompletedStepsSummary().flatMap((summary, summaryIdx) =>
                summary.items.map((item, itemIdx) => (
                    <React.Fragment key={`${summary.step}-${itemIdx}`}>
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-xs font-semibold text-gray-500 uppercase">{item.label}</span>
                        <span className="text-sm text-gray-900 font-medium">{item.value}</span>
                      </div>
                    </React.Fragment>
                ))
            )}
            <Button
                onClick={() => setCurrentStep(0)}
                variant="outline"
                size="sm"
                className="ml-auto h-10 px-4 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-300"
            >
              {t('checkout.edit_info', 'Edit Info')}
            </Button>
          </div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-${columnCount} gap-6 lg:gap-8`}>
        {/* Dynamically render columns based on layout configuration */}
        {['column1', 'column2', 'column3'].slice(0, columnCount).map((columnKey, columnIndex) => {
          const columnSections = layout[columnKey] || [];

          return (
            <div key={columnKey} className="space-y-4 lg:space-y-6">
              {/* Render sections dynamically for this column */}
              {columnSections.map(sectionName => renderSection(sectionName))}

              {/* Navigation Buttons (always at bottom of last column) */}
              {columnIndex === columnCount - 1 && stepsCount > 1 && (
                <div className="flex gap-3">
                  {canGoPrev() && (
                    <Button
                      onClick={goToPrevStep}
                      variant="outline"
                      className="flex-1"
                    >
                      ← {t('common.previous', 'Previous')}
                    </Button>
                  )}
                  {canGoNext() && (
                    <Button
                      onClick={goToNextStep}
                      className="flex-1"
                      style={{ backgroundColor: stepActiveColor, color: '#FFFFFF' }}
                    >
                      {t('checkout.continue', 'Continue')} →
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}

      </div>
      <CmsBlockRenderer position="checkout_below_form" />
      <AlertComponent />
    </div>
  );
}
