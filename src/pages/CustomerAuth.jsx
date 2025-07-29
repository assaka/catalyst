import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { createPageUrl, createStoreUrl, getStoreSlugFromUrl } from "@/utils";
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

export default function CustomerAuth() {
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
      // Allow access to CustomerAuth even if customer is logged in
      // This allows customers to switch accounts, log out, or register new accounts
      console.log('🔍 CustomerAuth.jsx: CustomerAuth page accessed');
    }
  }, [searchParams]);

  const getErrorMessage = (error) => {
    const errorMessages = {
      'oauth_failed': 'Google authentication failed. Please try again.',
      'token_generation_failed': 'Failed to generate authentication token. Please try again.',
      'database_connection_failed': 'Database connection issue. Please try again in a few moments.'
    };
    return errorMessages[error] || 'An error occurred. Please try again.';
  };

  const getStorefrontUrl = () => {
    // Try to get store code from localStorage (saved when user clicked sign in)
    const savedStoreCode = localStorage.getItem('customer_auth_store_code');
    if (savedStoreCode) {
      return createStoreUrl(savedStoreCode, 'storefront');
    }
    
    // Try to get store slug from current URL
    const currentStoreSlug = getStoreSlugFromUrl(window.location.pathname);
    
    // If we have a store slug from URL, use it
    if (currentStoreSlug) {
      return createStoreUrl(currentStoreSlug, 'storefront');
    }
    
    // Default to hamid2 store if no store context
    return createStoreUrl('hamid2', 'storefront');
  };

  const checkAuthStatus = async (isGoogleOAuth = false) => {
    try {
      // Don't redirect if user just logged in
      if (localStorage.getItem('just_logged_in') === 'true') {
        console.log('🔄 Skipping checkAuthStatus redirect - user just logged in');
        return;
      }
      
      if (apiClient.isLoggedOut || !apiClient.getToken()) {
        return;
      }

      let user = await User.me();
      
      // Handle case where user is returned as an array
      if (Array.isArray(user)) {
        user = user[0];
      }
      
      if (user) {
        // Google OAuth is not available for customers, but handle edge case
        if (isGoogleOAuth) {
          console.warn('⚠️ Customer received Google OAuth token - redirecting to store owner auth');
          navigate(createPageUrl("Auth"));
          return;
        }

        if (user.role === 'customer') {
          // Validate customer session
          if (!validateRoleBasedSession('customer')) {
            // Invalid session, clear data and stay on auth page
            apiClient.clearToken();
            return;
          }
          
          // Customer is already logged in, redirect appropriately
          const returnTo = searchParams.get('returnTo');
          if (returnTo) {
            navigate(returnTo);
          } else {
            navigate(getStorefrontUrl());
          }
        }
      }
    } catch (error) {
      console.log('No current user session');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        // Clear any existing admin tokens before customer login
        apiClient.setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('session_role');
        
        // Login with customer role
        const response = await AuthService.login(formData.email, formData.password, formData.rememberMe, 'customer');
        console.log("✅ CustomerAuth.jsx: Login successful:", response);

        // Check user role from response - handle array response
        const responseData = Array.isArray(response) ? response[0] : response;
        const userRole = responseData.data?.user?.role || responseData.user?.role;
        
        if (userRole !== 'customer') {
          setError("Invalid credentials. This login is for customers only.");
          await AuthService.logout();
          return;
        }

        // Set role-based session data for customer
        // Handle different response structures from API client processing
        let userData, token;
        
        if (responseData.user && responseData.token) {
          // Direct response structure
          userData = responseData.user;
          token = responseData.token;
        } else if (responseData.data?.user && responseData.data?.token) {
          // Nested response structure
          userData = responseData.data.user;
          token = responseData.data.token;
        } else {
          // Response might be just the user object itself
          userData = responseData;
          token = responseData.token || localStorage.getItem('auth_token');
        }
        
        console.log("📊 Login response data:", {
          response,
          userData,
          token,
          hasUser: !!userData,
          userRole: userData?.role
        });
        
        if (!userData || !token) {
          setError("Login failed - invalid response from server");
          return;
        }
        
        // Ensure we have the token set in apiClient first
        if (token) {
          apiClient.setToken(token);
        }
        
        // Set role-based session data
        setRoleBasedAuthData(userData, token);
        
        console.log('✅ Customer login successful, session data set:', {
          role: userData.role,
          sessionRole: localStorage.getItem('session_role'),
          hasToken: !!token
        });

        // Set a temporary flag to prevent checkAuthStatus from redirecting
        localStorage.setItem('just_logged_in', 'true');
        // Clear logout flag since user is now logging in
        localStorage.removeItem('user_logged_out');

        // Small delay to ensure session data is properly set
        setTimeout(() => {
          // Clear the flag
          localStorage.removeItem('just_logged_in');
          
          // Clear store auth info after successful login
          localStorage.removeItem('customer_auth_store_id');
          localStorage.removeItem('customer_auth_store_code');
          
          // Redirect customer to appropriate page
          const returnTo = searchParams.get('returnTo');
          if (returnTo) {
            navigate(returnTo);
          } else {
            navigate(getStorefrontUrl());
          }
        }, 100);
      } else {
        // Register as customer
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return;
        }

        // Get store_id from localStorage (saved when user clicked sign in)
        const savedStoreId = localStorage.getItem('customer_auth_store_id');
        
        const registerData = {
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'customer',
          account_type: 'individual',
          store_id: savedStoreId
        };

        const response = await AuthService.register(registerData);
        console.log("✅ CustomerAuth.jsx: Registration successful:", response);

        // Set role-based session data for new customer
        // Handle different response structures from API client processing
        const regResponseData = Array.isArray(response) ? response[0] : response;
        let userData, token;
        
        if (regResponseData.user && regResponseData.token) {
          // Direct response structure
          userData = regResponseData.user;
          token = regResponseData.token;
        } else if (regResponseData.data?.user && regResponseData.data?.token) {
          // Nested response structure
          userData = regResponseData.data.user;
          token = regResponseData.data.token;
        } else {
          // Response might be just the user object itself
          userData = regResponseData;
          token = regResponseData.token || localStorage.getItem('auth_token');
        }
        
        console.log("📊 Registration response data:", {
          response,
          responseKeys: Object.keys(response || {}),
          userData,
          token,
          hasUser: !!userData,
          userRole: userData?.role,
          responseType: typeof response,
          hasResponseData: !!response?.data,
          hasResponseUser: !!response?.user,
          hasResponseToken: !!response?.token
        });
        
        if (!userData || !token) {
          setError("Registration failed - invalid response from server");
          return;
        }
        
        // Ensure we have the token set in apiClient first
        if (token) {
          apiClient.setToken(token);
        }
        
        // Set role-based session data
        setRoleBasedAuthData(userData, token);
        
        console.log('✅ Customer registration successful, session data set:', {
          role: userData.role,
          sessionRole: localStorage.getItem('session_role'),
          hasToken: !!token
        });

        // Set a temporary flag to prevent checkAuthStatus from redirecting
        localStorage.setItem('just_logged_in', 'true');
        // Clear logout flag since user is now registering
        localStorage.removeItem('user_logged_out');

        // Small delay to ensure session data is properly set  
        setTimeout(() => {
          // Clear the flag
          localStorage.removeItem('just_logged_in');
          
          // Clear store auth info after successful registration
          localStorage.removeItem('customer_auth_store_id');
          localStorage.removeItem('customer_auth_store_code');
          
          // Redirect to storefront
          navigate(getStorefrontUrl());
        }, 100);
      }
    } catch (error) {
      console.error("❌ CustomerAuth.jsx: Auth error:", error);
      setError(error.message || `${isLogin ? 'Login' : 'Registration'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isLogin ? 'Welcome Back!' : 'Join Our Store'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isLogin 
              ? 'Sign in to your account to continue shopping'
              : 'Create your account to start shopping with us'
            }
          </p>
        </div>
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-semibold text-gray-800">
              {isLogin ? 'Sign In' : 'Create Account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
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

              {!isLogin && (
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
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
                    <Label htmlFor="rememberMe" className="text-sm">
                      Remember me
                    </Label>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5"
                disabled={loading}
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create My Account')}
              </Button>
            </form>


            <div className="mt-6">
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-500"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                    setSuccess("");
                  }}
                >
                  {isLogin 
                    ? "New customer? Create your account" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}