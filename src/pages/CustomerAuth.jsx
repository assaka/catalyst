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
      checkAuthStatus();
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

  const checkAuthStatus = async (isGoogleOAuth = false) => {
    try {
      if (apiClient.isLoggedOut || !apiClient.getToken()) {
        return;
      }

      let user = await User.me();
      
      // Handle case where user is returned as an array
      if (Array.isArray(user)) {
        user = user[0];
      }
      
      if (user) {
        // For Google OAuth users, ensure they have customer role
        if (isGoogleOAuth) {
          // If wrong role, set up the user as customer
          if (user.role !== 'customer') {
            try {
              // Use the backend PATCH route to set role
              const updateResponse = await apiClient.patch('auth/me', {
                role: 'customer',
                account_type: 'individual'
              });

              // Fetch fresh user data to ensure we have the updated role
              const updatedUser = await User.me();

              // Update user object with fresh data
              user.role = updatedUser.role || 'customer';
              user.account_type = updatedUser.account_type || 'individual';
              
            } catch (setupError) {
              console.error("❌ CustomerAuth.jsx: Failed to set Google OAuth user role:", setupError);
              // Fallback: manually set the role even if backend update failed
              user.role = 'customer';
              user.account_type = 'individual';
            }
          }

          // Set role-based session data for customer
          setRoleBasedAuthData(user, apiClient.getToken());

          // Always redirect Google OAuth users to CustomerDashboard
          navigate(createPageUrl("CustomerDashboard") + "?setup=complete");
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
            navigate(createPageUrl("CustomerDashboard"));
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
        // Login
        const response = await AuthService.login(formData.email, formData.password, formData.rememberMe);
        console.log("✅ CustomerAuth.jsx: Login successful:", response);

        // Check user role from response
        const userRole = response.data?.user?.role || response.user?.role;
        
        if (userRole !== 'customer') {
          setError("Invalid credentials. This login is for customers only.");
          await AuthService.logout();
          return;
        }

        // Set role-based session data for customer
        const userData = response.data?.user || response.user;
        const token = response.data?.token || response.token;
        
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

        // Small delay to ensure session data is properly set
        setTimeout(() => {
          // Redirect customer to appropriate page
          const returnTo = searchParams.get('returnTo');
          if (returnTo) {
            navigate(returnTo);
          } else {
            navigate(createPageUrl("CustomerDashboard"));
          }
        }, 100);
      } else {
        // Register as customer
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return;
        }

        const registerData = {
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'customer',
          account_type: 'individual'
        };

        const response = await AuthService.register(registerData);
        console.log("✅ CustomerAuth.jsx: Registration successful:", response);

        // Set role-based session data for new customer
        const userData = response.data?.user || response.user;
        const token = response.data?.token || response.token;
        
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

        // Small delay to ensure session data is properly set  
        setTimeout(() => {
          // Redirect to customer dashboard
          navigate(createPageUrl("CustomerDashboard"));
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

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Set customer role in session first using API client
      const response = await apiClient.post('auth/set-oauth-role', {
        role: 'customer'
      });
      
      if (response.success) {
        // Now redirect to Google OAuth via backend
        window.location.href = `${apiClient.baseURL}/api/auth/google`;
      } else {
        throw new Error('Failed to set OAuth role');
      }
    } catch (error) {
      console.error('Error setting OAuth role:', error);
      setError('Failed to initialize Google authentication. Please try again.');
      setLoading(false);
    }
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
              className="w-full border-gray-300 hover:bg-gray-50 font-medium py-2.5"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? "Connecting..." : "Sign in with Google"}
            </Button>

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
              
              <div className="mt-4 text-center">
                <Link 
                  to={createPageUrl("Auth")}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Store owner? Access admin panel
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}