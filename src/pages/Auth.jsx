import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Auth as AuthService, User, Store } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import apiClient from "@/api/client";
import { setRoleBasedAuthData, validateRoleBasedSession, getSessionRole } from "@/utils/auth";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    rememberMe: false
  });

  useEffect(() => {

    // Handle OAuth callback
    const token = searchParams.get('token');
    const oauth = searchParams.get('oauth');
    const errorParam = searchParams.get('error');
    const isGoogleOAuth = oauth === 'success';

    if (token && oauth === 'success') {
      apiClient.setToken(token);
      checkAuthStatus(isGoogleOAuth);
    } else if (errorParam) {
      setError(getErrorMessage(errorParam));
    } else {
      // Check if store owner is already logged in (not customer)
      const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
      const storeOwnerUserData = localStorage.getItem('store_owner_user_data');
      
      if (storeOwnerToken && storeOwnerUserData) {
        try {
          const userData = JSON.parse(storeOwnerUserData);
          if (userData.role === 'store_owner' || userData.role === 'admin') {
            console.log('🔄 Auth.jsx: Store owner already logged in, redirecting to Dashboard');
            navigate(createPageUrl("Dashboard"));
            return;
          }
        } catch (e) {
          console.error('Error parsing store owner data:', e);
        }
      }
    }

    // Listen for logout events to prevent redirections after logout
    const handleLogout = () => {
      setError('');
      setSuccess('');
      localStorage.setItem('user_logged_out', 'true');
    };

    window.addEventListener('userLoggedOut', handleLogout);
    return () => window.removeEventListener('userLoggedOut', handleLogout);
  }, [searchParams]);

  const getErrorMessage = (error) => {
    const errorMessages = {
      'oauth_failed': 'Google authentication failed. Please try again.',
      'token_generation_failed': 'Failed to generate authentication token. Please try again.',
      'database_connection_failed': 'Database connection issue. Please try again in a few moments.'
    };
    return errorMessages[error] || 'An error occurred. Please try again.';
  };

  const checkAuthStatus = async (isGoogleOAuth = false) => {
    // Don't redirect if user just logged in
    if (localStorage.getItem('just_logged_in') === 'true') {
      console.log('🔄 Skipping checkAuthStatus redirect - user just logged in');
      return;
    }
    
    console.log('🔍 Auth.jsx checkAuthStatus: Starting check, current path:', window.location.pathname);

    // Debug: decode JWT token to see what's in it
    const token = apiClient.getToken();
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decodedToken = JSON.parse(jsonPayload);
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
    
    try {
      // Check if user was just logged out (listen for logout events)
      if (apiClient.isLoggedOut) {
        return;
      }
      
      let user = await User.me();

      // Handle case where user is returned as an array
      if (Array.isArray(user)) {
        user = user[0];
      }
      
      if (user) {
        // Determine current context (storefront vs dashboard)
        const currentPath = window.location.pathname.toLowerCase();
        const storefrontPages = ['/landing', '/', '/storefront', '/productdetail', '/cart', '/checkout', '/order-success', '/ordersuccess'];
        const dashboardPages = ['/dashboard', '/products', '/categories', '/settings', '/attributes', '/plugins', '/cmsblocks', '/tax', '/orders', '/coupons', '/cmspages', '/producttabs', '/productlabels', '/customoptionrules', '/shippingmethods', '/googletagmanager', '/deliverysettings', '/themelayout', '/marketplaceexport', '/imagemanager', '/htmlsitemap', '/customers', '/stocksettings', '/analyticssettings', '/paymentmethods', '/seotools', '/xmlsitemap', '/robotstxt', '/onboarding', '/billing', '/clientdashboard', '/stores', '/ordercancel', '/customeractivity', '/cookieconsent'];
        
        const isStorefrontContext = storefrontPages.some(page => currentPath.startsWith(page));
        const isDashboardContext = dashboardPages.some(page => currentPath.startsWith(page));
        
        // For Google OAuth users, ensure they have a role and redirect to Dashboard
        if (isGoogleOAuth) {
          // If no role, set up the user as store_owner
          if (!user.role) {
            try {
              // Use the backend PATCH route to set role
              const updateResponse = await apiClient.patch('auth/me', {
                role: 'store_owner',
                account_type: 'agency'
              });

              // Fetch fresh user data to ensure we have the updated role
              const updatedUser = await User.me();

              // Update user object with fresh data
              user.role = updatedUser.role || 'store_owner';
              user.account_type = updatedUser.account_type || 'agency';
              
            } catch (setupError) {
              console.error("❌ Auth.jsx: Failed to set Google OAuth user role:", setupError);
              // Fallback: manually set the role even if backend update failed
              user.role = 'store_owner';
              user.account_type = 'agency';
            }
          }

          // Always redirect Google OAuth users to Dashboard
          navigate(createPageUrl("Dashboard") + "?setup=complete");
          return;
        }

        // If user has no role, set default role automatically
        if (!user.role) {
          try {
            const updateResponse = await User.update(user.id, {
              role: 'store_owner',
              account_type: 'agency'
            });

            // Refresh user data after update
            user = await User.me();
          } catch (error) {
            console.error('❌ Auth.jsx: Failed to set default role:', error);
          }
        }

        // Role-based access control
        const isStoreOwner = user.role === 'store_owner';
        const isAdmin = user.role === 'admin';
        const isCustomer = user.role === 'customer';
        const isAgency = user.account_type === 'agency';
        const hasNoRole = !user.role;

        // Handle role-based redirections based on context
        if (isStorefrontContext) {
          // Storefront access control
          // Allow all users (including store_owners) to access storefront as guests
          // No automatic redirects for storefront pages
          return;
        } else if (isDashboardContext) {
          // Dashboard access control
          if (isStoreOwner || isAdmin || isAgency || hasNoRole) {
            // Store owners can access dashboard - no redirect needed
            return;
          } else if (isCustomer) {
            // Customers cannot access dashboard - redirect to customer dashboard or storefront
            if (currentPath === '/customerdashboard') {
              return; // Allow access to customer dashboard
            } else {
              // Customer trying to access admin areas - redirect to storefront
              navigate(createPageUrl("Storefront"));
              return;
            }
          }
        } else {
          // Default routing for other pages
          // Check if we're on the auth page itself
          const isOnAuthPage = currentPath === '/auth' || currentPath.endsWith('/auth');
          
          if (isOnAuthPage) {
            // On auth page - only redirect if user is already authenticated
            // This prevents interfering with the login process
            console.log('🔍 Auth.jsx checkAuthStatus: On auth page, user roles:', {
              isStoreOwner, isAdmin, isAgency, isCustomer, hasNoRole
            });
            if (isStoreOwner || isAdmin || isAgency) {
              console.log('🔄 Auth.jsx checkAuthStatus: User already authenticated as store owner, redirecting to Dashboard');
              navigate(createPageUrl("Dashboard"));
            } else if (isCustomer) {
              console.log('🔄 Auth.jsx checkAuthStatus: Customer on store owner auth page, redirecting to customer auth');
              navigate(createPageUrl("CustomerAuth"));
            }
            // If hasNoRole, let them stay on auth page to complete setup
          } else {
            // Other pages - normal redirect logic
            if (isStoreOwner || isAdmin || isAgency || hasNoRole) {
              navigate(createPageUrl("Dashboard"));
            } else if (isCustomer) {
              navigate(createPageUrl("Storefront"));
            }
          }
        }
      }
    } catch (error) {
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return `Password must be at least ${minLength} characters long`;
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter";
    }
    if (!hasLowerCase) {
      return "Password must contain at least one lowercase letter";
    }
    if (!hasNumber) {
      return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isLogin) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Clear any existing customer tokens before store owner login
        localStorage.removeItem('customer_auth_token');
        localStorage.removeItem('customer_user_data');
        localStorage.removeItem('session_role');
        
        console.log('🔍 HAMID DEBUG: About to call AuthService.login with role: store_owner');
        console.log('🔍 HAMID DEBUG: FormData:', { email: formData.email, rememberMe: formData.rememberMe });
        const response = await AuthService.login(formData.email, formData.password, formData.rememberMe, 'store_owner');
        console.log('🔍 Auth.jsx: Full login response structure:', response);
        console.log('🔍 Auth.jsx: Response keys:', Object.keys(response || {}));
        console.log('🔍 Auth.jsx: Response.success:', response.success);
        
        if (response.success) {
          // Check user role from response and redirect accordingly
          const userRole = response.data?.user?.role || response.user?.role;
          console.log('🔍 Auth.jsx: Extracted userRole:', userRole);
          
          // Determine current context (storefront vs dashboard)
          const currentPath = window.location.pathname.toLowerCase();
          const storefrontPages = ['/landing', '/', '/storefront', '/productdetail', '/cart', '/checkout', '/order-success', '/ordersuccess'];
          const isStorefrontContext = storefrontPages.some(page => currentPath.startsWith(page));

          // Role-based validation and redirection
          if (userRole === 'customer') {
            // Customers cannot log in through store owner auth page
            setError("Invalid credentials. Customers should use the customer login page.");
            await AuthService.logout();
            return;
          } else if (userRole === 'store_owner' || userRole === 'admin' || !userRole) {
            // Set role-based session data for store owners/admins
            const userData = response.data?.user || response.user;
            const token = response.data?.token || response.token;
            
            // Ensure we have the token set in apiClient first
            if (token) {
              apiClient.setToken(token);
            }
            
            // Set role-based session data
            setRoleBasedAuthData(userData, token);
            
            console.log('✅ Store owner/admin login successful, session data set:', {
              role: userData.role,
              sessionRole: localStorage.getItem('session_role'),
              hasToken: !!token
            });
            
            // Set a temporary flag to prevent checkAuthStatus from redirecting
            localStorage.setItem('just_logged_in', 'true');
            // Clear logout flag since user is now logging in
            localStorage.removeItem('user_logged_out');
            
            // Always redirect store owners to Dashboard after login
            console.log('🔄 Auth.jsx: Setting up redirect to Dashboard for store owner');
            setTimeout(() => {
              console.log('🔄 Auth.jsx: Executing redirect to Dashboard');
              localStorage.removeItem('just_logged_in');
              
              // Ensure we navigate to the correct dashboard
              const dashboardUrl = createPageUrl("Dashboard");
              console.log('🔄 Auth.jsx: Navigating to:', dashboardUrl);
              navigate(dashboardUrl);
            }, 100);
          }
          // Note: No fallback to checkAuthStatus here to prevent unwanted redirects
        }
      } else {
        const response = await AuthService.register({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'store_owner',
          account_type: 'agency'
        });
        if (response.success) {
          setSuccess("Registration successful! Redirecting...");
          // Set role-based session data for new store owner
          const userData = response.data?.user || response.user;
          const token = response.data?.token || response.token;
          
          // Ensure we have the token set in apiClient first
          if (token) {
            apiClient.setToken(token);
          }
          
          // Set role-based session data
          setRoleBasedAuthData(userData, token);
          
          console.log('✅ Store owner registration successful, session data set:', {
            role: userData.role,
            sessionRole: localStorage.getItem('session_role'),
            hasToken: !!token
          });
          
          // Set a temporary flag to prevent checkAuthStatus from redirecting
          localStorage.setItem('just_logged_in', 'true');
          // Clear logout flag since user is now registering
          localStorage.removeItem('user_logged_out');
          
          // Clear the flag after a short delay
          setTimeout(() => {
            localStorage.removeItem('just_logged_in');
          }, 200);
          
          // Since we explicitly set role as store_owner during registration,
          // redirect directly to Dashboard
          setTimeout(() => {
            navigate(createPageUrl("Dashboard"));
          }, 1500);
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setLoading(true);
    setError("");
    
    // Since Google OAuth is only for store owners, we can redirect directly
    // The backend will automatically set the role to store_owner
    console.log('🔐 Redirecting to Google OAuth for store owner...');
    window.location.href = `${apiClient.baseURL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md mx-auto w-full">
        <Card className="material-elevation-2 border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Store Owner {isLogin ? "Login" : "Register"}
            </CardTitle>
            <CardDescription>
              {isLogin ? "Access your store management dashboard" : "Create your store owner account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required={!isLogin}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required={!isLogin}
                      placeholder="Doe"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                  </button>
                </div>
                {!isLogin && formData.password && (
                  <p className="text-xs text-gray-500">
                    Password must be at least 8 characters with uppercase, lowercase, number, and special character
                  </p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required={!isLogin}
                    placeholder="••••••••"
                  />
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, rememberMe: checked }))
                      }
                    />
                    <Label htmlFor="rememberMe" className="text-sm font-normal">
                      Remember me
                    </Label>
                  </div>
                  <Link
                    to={createPageUrl("ForgotPassword")}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleAuth}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? "Redirecting..." : "Sign in with Google"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}