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
    console.log('🚀 Auth.jsx: useEffect triggered');
    
    // Handle OAuth callback
    const token = searchParams.get('token');
    const oauth = searchParams.get('oauth');
    const errorParam = searchParams.get('error');
    const isGoogleOAuth = oauth === 'success';

    console.log('🔍 Auth.jsx: URL params:', { 
      hasToken: !!token, 
      oauth, 
      errorParam, 
      isGoogleOAuth 
    });

    if (token && oauth === 'success') {
      console.log('🔄 Auth.jsx: OAuth success flow, setting token and checking auth');
      apiClient.setToken(token);
      checkAuthStatus(isGoogleOAuth);
    } else if (errorParam) {
      console.log('🔄 Auth.jsx: Error param found, showing error');
      setError(getErrorMessage(errorParam));
    } else {
      console.log('🔄 Auth.jsx: Normal flow, checking auth status');
      checkAuthStatus();
    }

    // Listen for logout events to prevent redirections after logout
    const handleLogout = () => {
      console.log('🔄 Auth page: User logged out, staying on auth page');
      setError('');
      setSuccess('');
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
    console.log('🔍 Auth.jsx: checkAuthStatus called', { isGoogleOAuth });
    console.log('🔍 Auth.jsx: apiClient state before check:', {
      isLoggedOut: apiClient.isLoggedOut,
      hasToken: !!apiClient.getToken(),
      logoutFlagInStorage: localStorage.getItem('user_logged_out'),
      tokenInStorage: localStorage.getItem('auth_token'),
      allStorageKeys: Object.keys(localStorage)
    });
    
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
        console.log('🔍 Auth.jsx: Decoded JWT token:', decodedToken);
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
    
    try {
      // Check if user was just logged out (listen for logout events)
      if (apiClient.isLoggedOut) {
        console.log('🚫 Auth.jsx: User was logged out, staying on auth page');
        return;
      }
      
      console.log('🔍 Auth.jsx: Calling User.me()...');
      const user = await User.me();
      console.log('✅ Auth.jsx: User.me() succeeded:', user ? 'user found' : 'no user');
      console.log('🔍 Auth.jsx: Full user data from User.me():', JSON.stringify(user, null, 2));
      
      if (user) {
        // For Google OAuth users, ensure they have a role and redirect to Dashboard
        if (isGoogleOAuth) {
          console.log('🔍 Auth.jsx: Google OAuth user detected, role:', user.role);
          
          // If no role, set up the user as store_owner
          if (!user.role) {
            console.log('🔄 Auth.jsx: Google OAuth user has no role, setting store_owner...');
            try {
              // Use the backend PATCH route to set role
              const updateResponse = await apiClient.patch('auth/me', {
                role: 'store_owner',
                account_type: 'agency'
              });
              console.log('✅ Auth.jsx: Google OAuth role set successfully', updateResponse);
              
              // Fetch fresh user data to ensure we have the updated role
              console.log('🔄 Auth.jsx: Fetching fresh user data after role update...');
              const updatedUser = await User.me();
              console.log('🔍 Auth.jsx: Fresh user data:', updatedUser);
              
              // Update user object with fresh data
              user.role = updatedUser.role || 'store_owner';
              user.account_type = updatedUser.account_type || 'agency';
              
              console.log('✅ Auth.jsx: User object updated with fresh data:', {
                role: user.role,
                account_type: user.account_type
              });
            } catch (setupError) {
              console.error("❌ Auth.jsx: Failed to set Google OAuth user role:", setupError);
              // Fallback: manually set the role even if backend update failed
              user.role = 'store_owner';
              user.account_type = 'agency';
              console.log('🔄 Auth.jsx: Fallback role assignment applied');
            }
          }

          // Always redirect Google OAuth users to Dashboard
          console.log('✅ Auth.jsx: Google OAuth -> Redirecting to Dashboard');
          navigate(createPageUrl("Dashboard") + "?setup=complete");
          return;
        }

        // Always redirect to dashboard for authenticated users
        console.log('🔍 Auth.jsx: User authenticated, checking role:', user.role);
        
        // If user has no role, set default role automatically
        if (!user.role) {
          console.log('🔄 Auth.jsx: No role found, setting default role to store_owner');
          try {
            const updateResponse = await User.update(user.id, {
              role: 'store_owner',
              account_type: 'agency'
            });
            console.log('✅ Auth.jsx: Default role set successfully', updateResponse);
            
            // Refresh user data after update
            console.log('🔄 Auth.jsx: Refreshing user data after role update...');
            user = await User.me();
            console.log('🔍 Auth.jsx: Updated user data:', user);
          } catch (error) {
            console.error('❌ Auth.jsx: Failed to set default role:', error);
          }
        }

        // Always redirect to appropriate dashboard based on role
        console.log('🔄 Auth.jsx: FINAL REDIRECT DECISION');
        console.log('🔍 Auth.jsx: Final user data for redirect:', {
          role: user.role,
          account_type: user.account_type,
          id: user.id,
          email: user.email,
          fullUserObject: user
        });
        
        // ENHANCED DEBUGGING - Log exact values and types
        console.log('🔍 ENHANCED DEBUG - Exact user properties:');
        console.log('- user.role (value):', user.role);
        console.log('- user.role (type):', typeof user.role);
        console.log('- user.account_type (value):', user.account_type);
        console.log('- user.account_type (type):', typeof user.account_type);
        console.log('- user.email:', user.email);
        
        // Store owners and admins go to main Dashboard
        const isStoreOwner = user.role === 'store_owner';
        const isAdmin = user.role === 'admin';
        const isAgency = user.account_type === 'agency';
        const hasNoRole = !user.role;
        
        console.log('🔍 Auth.jsx: Individual condition checks:', {
          'user.role === "store_owner"': isStoreOwner,
          'user.role === "admin"': isAdmin, 
          'user.account_type === "agency"': isAgency,
          '!user.role': hasNoRole,
          'ANY_CONDITION_TRUE': isStoreOwner || isAdmin || isAgency || hasNoRole
        });
        
        if (isStoreOwner || isAdmin || isAgency || hasNoRole) {
          console.log('✅ Auth.jsx: store_owner/admin/agency -> Redirecting to Dashboard');
          console.log('🎯 REDIRECTING TO DASHBOARD');
          navigate(createPageUrl("Dashboard"));
        } 
        // Regular customers go to CustomerDashboard
        else if (user.role === 'customer') {
          console.log('🔄 Auth.jsx: customer -> Redirecting to CustomerDashboard');
          console.log('🎯 REDIRECTING TO CUSTOMER DASHBOARD');
          navigate(createPageUrl("CustomerDashboard"));
        }
        // Default fallback to Dashboard
        else {
          console.log('🔄 Auth.jsx: unknown role -> Redirecting to Dashboard');
          console.log('🎯 REDIRECTING TO DASHBOARD (fallback)');
          navigate(createPageUrl("Dashboard"));
        }
      }
    } catch (error) {
      console.log("❌ Auth.jsx: User not authenticated, ready for login:", error.message);
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
        const response = await AuthService.login(formData.email, formData.password, formData.rememberMe);
        if (response.success) {
          // Check user role from response and redirect accordingly
          const userRole = response.data?.user?.role || response.user?.role;
          console.log('🔍 Login successful, user role:', userRole);
          
          if (userRole === 'store_owner' || userRole === 'admin' || !userRole) {
            navigate(createPageUrl("Dashboard"));
          } else if (userRole === 'customer') {
            navigate(createPageUrl("CustomerDashboard"));
          } else {
            // Fallback to checkAuthStatus
            checkAuthStatus();
          }
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
    AuthService.googleLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md mx-auto w-full">
        <Card className="material-elevation-2 border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {isLogin ? "Sign in to your account to continue" : "Sign up for a new account"}
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
              {loading ? "Redirecting..." : "Continue with Google"}
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