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
    
    try {
      // Check if user was just logged out (listen for logout events)
      if (apiClient.isLoggedOut) {
        console.log('🚫 Auth.jsx: User was logged out, staying on auth page');
        return;
      }
      
      console.log('🔍 Auth.jsx: Calling User.me()...');
      const user = await User.me();
      console.log('✅ Auth.jsx: User.me() succeeded:', user ? 'user found' : 'no user');
      
      if (user) {
        // For Google OAuth users without a role, set up basic account and skip onboarding
        if (!user.role && isGoogleOAuth) {
          try {
            // Set up basic account for Google OAuth users
            await User.updateMyUserData({
              account_type: 'agency',
              role: 'store_owner',
              credits: 20
            });

            // Create a default store if none exists
            const stores = await User.getMyStores?.() || [];
            if (stores.length === 0) {
              const storeName = user.company_name || `${user.full_name}'s Store` || `${user.email} Store`;
              const storeSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

              await Store.create({
                name: storeName,
                slug: storeSlug,
                owner_email: user.email,
              });
            }

            // Redirect to Dashboard with a success message
            navigate(createPageUrl("Dashboard") + "?setup=complete");
            return;
          } catch (setupError) {
            console.error("Failed to setup Google OAuth user:", setupError);
            // Fall back to onboarding if auto-setup fails
            navigate(createPageUrl("Onboarding"));
            return;
          }
        }

        // Regular flow for non-OAuth users or users that already have a role
        console.log('🔍 Auth.jsx: Checking user role:', user.role);
        if (!user.role) {
          console.log('🔄 Auth.jsx: No role found, redirecting to Onboarding');
          navigate(createPageUrl("Onboarding"));
          return;
        }

        console.log('🔄 Auth.jsx: User has role, redirecting based on role/type');
        if (user.role === 'admin' || user.role === 'store_owner' || user.account_type === 'agency') {
          console.log('🔄 Auth.jsx: Redirecting to Dashboard');
          navigate(createPageUrl("Dashboard"));
        } else {
          console.log('🔄 Auth.jsx: Redirecting to CustomerDashboard');
          navigate(createPageUrl("CustomerDashboard"));
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
          checkAuthStatus();
        }
      } else {
        const response = await AuthService.register({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName
        });
        if (response.success) {
          setSuccess("Registration successful! Redirecting...");
          setTimeout(() => checkAuthStatus(), 1500);
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