
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Store } from "@/api/entities";
import { Product } from "@/api/entities";
import { Order } from "@/api/entities"; // Added Order import
import { Customer } from "@/api/entities"; // Added Customer import
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate import
import { createPageUrl } from "@/utils";
import { 
  ShoppingBag, 
  Store as StoreIcon, 
  Package, 
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  ArrowRight,
  BarChart3,
  Calendar,
  Eye,
  Settings,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  Circle,
  Activity, // Added Activity
  Globe, // Added Globe
  CheckCircle, // Added CheckCircle
  AlertCircle, // Added AlertCircle
  ExternalLink,
  Unlink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardDescription
import { Badge } from "@/components/ui/badge";
import { SetupGuide } from '@/components/dashboard/SetupGuide'; // Moved SetupGuide to its own file
import { checkStripeConnectStatus } from '@/api/functions';
import { createStripeConnectLink } from '@/api/functions';

// Add retry utility
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryApiCall = async (apiCall, maxRetries = 5, baseDelay = 3000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      // Check for specific error message or status code related to rate limiting
      // Assuming the error object or message contains '429' or 'Rate limit' for simplicity
      const errorMessage = error.response?.status === 429 ? '429' : error.message;

      if (errorMessage?.includes('429') || errorMessage?.includes('Rate limit')) {
        if (i < maxRetries - 1) {
          const delayTime = baseDelay * Math.pow(2, i) + Math.random() * 1000;
          console.warn(`Dashboard: Rate limit hit, retrying in ${delayTime.toFixed(0)}ms...`);
          await delay(delayTime);
          continue;
        }
      }
      throw error; // Re-throw if not a rate limit error or max retries reached
    }
  }
};


export default function Dashboard() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [user, setUser] = useState(null);
  const [stores, setStores] = useState([]); // Kept for general list of stores if needed
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null); // State to hold the current active store (e.g., first one found)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stripeSuccessMessage, setStripeSuccessMessage] = useState('');
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [stripeConnecting, setStripeConnecting] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    if (selectedStore) {
      loadDashboardData();
    }
  }, [selectedStore]);

  useEffect(() => {

    // Handle setup completion from Google OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('setup') && urlParams.get('setup') === 'complete') {
      setShowWelcomeMessage(true);
      // Clean up URL
      navigate(createPageUrl('Dashboard'), { replace: true });
      // Auto-hide welcome message after 10 seconds
      setTimeout(() => setShowWelcomeMessage(false), 10000);
    }

    // Handle Stripe Connect return
    const handleStripeReturn = async () => {
      if (urlParams.has('stripe_return')) {
        try {
          // Assuming checkStripeConnectStatus returns { data: { onboardingComplete: boolean } }
          const { data } = await checkStripeConnectStatus(selectedStore?.id); 
          if (data.onboardingComplete) {
            setStripeSuccessMessage('Stripe account connected successfully!');
            // Re-load data to get updated store status
            loadDashboardData();
          } else {
            setError('Stripe connection was not completed. Please try again.');
          }
        } catch (err) {
          console.error("Error verifying Stripe connection:", err);
          setError('Failed to verify Stripe connection status.');
        } finally {
          // Clean up URL params
          navigate(createPageUrl('Dashboard'), { replace: true });
        }
      } else if (urlParams.has('stripe_refresh')) {
        // The link expired, trigger the flow again
        try {
            const currentUrl = window.location.origin + window.location.pathname;
            const returnUrl = `${currentUrl}?stripe_return=true`;
            const refreshUrl = `${currentUrl}?stripe_refresh=true`;
            
            // Assuming createStripeConnectLink returns { data: { url: string } }
            const { data } = await createStripeConnectLink(returnUrl, refreshUrl, selectedStore?.id);
            if (data.url) {
                window.location.href = data.url;
            } else {
                setError('Could not generate a new Stripe connection link. Please try again.');
            }
        } catch(err) {
             console.error("Error refreshing Stripe connection link:", err);
             setError('Could not refresh Stripe connection link. Please try again.');
        } finally {
             // Clean up URL params (this will only happen if the redirect didn't occur)
            navigate(createPageUrl('Dashboard'), { replace: true });
        }
      }
    };
    handleStripeReturn();

  }, []);


  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      setStripeSuccessMessage(''); // Clear success message on new load
      
      const userData = await retryApiCall(() => User.me());
      setUser(userData);
      
      // Removed await delay(500); for performance improvement
      
      const storeId = getSelectedStoreId();
      if (!storeId) {
        console.warn("No store selected");
        setLoading(false);
        return;
      }
      
      setStore(selectedStore);
      
      const productsData = await retryApiCall(() => Product.filter({ store_id: storeId }));
      setProducts(productsData || []);

      const allOrders = await retryApiCall(() => Order.filter({ store_id: storeId }), 3, 1000);
      const customers = await retryApiCall(() => Customer.filter({ store_id: storeId }), 3, 1000);

      console.log('Dashboard orders:', allOrders?.slice(0, 3)); // Debug first 3 orders
      
      const totalOrders = Array.isArray(allOrders) ? allOrders.length : 0;
      const totalRevenue = Array.isArray(allOrders) ? allOrders.reduce((sum, order) => {
        const amount = parseFloat(order?.total_amount || 0);
        if (order?.total_amount && isNaN(amount)) {
          console.warn('Invalid total_amount in order:', order.id, order.total_amount);
        }
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0) : 0;
      const totalProductsCount = Array.isArray(productsData) ? productsData.length : 0;
      const totalCustomers = Array.isArray(customers) ? customers.length : 0;

      setStats({
        totalRevenue,
        totalOrders,
        totalProducts: totalProductsCount,
        totalCustomers
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load dashboard data. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!selectedStore?.id) {
      setError("Store ID is required");
      return;
    }

    setStripeConnecting(true);
    setError(null);
    
    try {
      console.log("Starting Stripe Connect flow for store:", selectedStore.id);
      
      const currentUrl = window.location.origin + window.location.pathname;
      const returnUrl = `${currentUrl}?stripe_return=true`;
      const refreshUrl = `${currentUrl}?stripe_refresh=true`;
      
      const { data } = await createStripeConnectLink(returnUrl, refreshUrl, selectedStore.id);
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Could not generate Stripe connection link. Please try again.');
      }
    } catch (error) {
      console.error("Error setting up Stripe connect:", error);
      setError('An error occurred while setting up Stripe. Please try again.');
    } finally {
      setStripeConnecting(false);
    }
  };

  const handleChangeStripeAccount = async () => {
    if (!selectedStore?.id) {
      setError("Store ID is required");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to connect a different Stripe account? This will replace your current Stripe connection."
    );
    
    if (confirmed) {
      await handleConnectStripe();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="flex gap-3">
          <Button onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Add Product",
      description: "Add new products to your store",
      icon: Package,
      link: "Products",
      color: "bg-blue-500"
    },
    {
      title: "Manage Categories",
      description: "Organize your product categories",
      icon: StoreIcon,
      link: "Categories",
      color: "bg-green-500"
    },
    {
      title: "Store Settings",
      description: "Configure payments and domain",
      icon: Settings,
      link: "Settings",
      color: "bg-purple-500"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.full_name?.split(' ')[0] || 'User'} 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your store today
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to={createPageUrl("Products")}>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple material-elevation-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Welcome Message for new Google OAuth users */}
        {showWelcomeMessage && (
          <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>🎉 Welcome! Your account has been set up successfully. Connect Stripe below to start accepting payments.</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowWelcomeMessage(false)}
              className="text-blue-800 hover:text-blue-900"
            >
              ✕
            </Button>
          </div>
        )}

        {stripeSuccessMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                {stripeSuccessMessage}
            </div>
        )}


        {/* Setup Guide Component */}
        <SetupGuide store={store} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">${Math.round(stats.totalRevenue || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stripe Connect Status */}
        <div className="mb-8">
          <Card className="material-elevation-1 border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Processing
              </CardTitle>
              <CardDescription>
                Manage your Stripe Connect integration for accepting payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {(store?.stripe_account_id || store?.stripe_connect_onboarding_complete) ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Stripe Connected</p>
                          <p className="text-sm text-gray-600">
                            {store?.stripe_account_id ? `Account ID: ${store.stripe_account_id.substring(0, 20)}...` : 'Ready to accept payments'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="font-semibold text-gray-900">Stripe Not Connected</p>
                          <p className="text-sm text-gray-600">Connect your Stripe account to accept payments</p>
                        </div>
                      </>
                    )}
                  </div>
                  <Badge 
                    className={
                      (store?.stripe_account_id || store?.stripe_connect_onboarding_complete) 
                        ? "bg-green-100 text-green-800 border-green-200" 
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    }
                    variant="outline"
                  >
                    {(store?.stripe_account_id || store?.stripe_connect_onboarding_complete) ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {(store?.stripe_account_id || store?.stripe_connect_onboarding_complete) ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl('PaymentMethods'))}>
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleChangeStripeAccount}
                        disabled={stripeConnecting}
                      >
                        {stripeConnecting ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Unlink className="w-4 h-4 mr-2" />
                            Change Account
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={handleConnectStripe}
                      disabled={stripeConnecting}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {stripeConnecting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Connect Stripe
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="material-elevation-1 border-0">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <Link key={index} to={createPageUrl(action.link)}>
                      <Card className="material-elevation-1 border-0 hover:material-elevation-2 transition-all duration-300 cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center material-elevation-1`}>
                              <action.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{action.title}</h3>
                              <p className="text-sm text-gray-600">{action.description}</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Products */}
          <div>
            <Card className="material-elevation-1 border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900">Recent Products</CardTitle>
                  <Link to={createPageUrl("Products")}>
                    <Button variant="ghost" size="sm">
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm text-gray-500">${product.price}</p>
                      </div>
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                        {product.status}
                      </Badge>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No products yet</p>
                      <p className="text-sm text-gray-500 mb-4">Start by adding your first product</p>
                      <Link to={createPageUrl("Products")}>
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 material-ripple">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Product
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Store Performance */}
        <div className="mt-8">
          <Card className="material-elevation-1 border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Store Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Sales Growth</h3>
                  <p className="text-2xl font-bold text-green-600">+24%</p>
                  <p className="text-sm text-gray-500">vs last month</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">New Customers</h3>
                  <p className="text-2xl font-bold text-blue-600">127</p>
                  <p className="text-sm text-gray-500">this month</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Page Views</h3>
                  <p className="text-2xl font-bold text-purple-600">2,341</p>
                  <p className="text-sm text-gray-500">this week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
