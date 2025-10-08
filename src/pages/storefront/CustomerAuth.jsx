import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Auth as AuthService } from "@/api/entities";
import apiClient from "@/api/client";
import { createPublicUrl, getStoreSlugFromPublicUrl } from "@/utils/urlUtils";

// Login form component
function CustomerLoginForm({ loading, error, success, onAuth }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onAuth(formData, true); // true = isLogin
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="login-email">Email Address</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Enter your email"
        />
      </div>

      <div>
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Input
            id="login-password"
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

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
        disabled={loading}
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </Button>
    </form>
  );
}

// Registration form component
function CustomerRegisterForm({ loading, error, success, onAuth }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onAuth(formData, false); // false = isRegistration
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

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

      <div>
        <Label htmlFor="register-email">Email Address</Label>
        <Input
          id="register-email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Enter your email"
        />
      </div>

      <div>
        <Label htmlFor="register-password">Password</Label>
        <div className="relative">
          <Input
            id="register-password"
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

      <Button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5"
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Create My Account'}
      </Button>
    </form>
  );
}

export default function CustomerAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { storeCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const customerToken = localStorage.getItem('customer_auth_token');
      if (customerToken) {
        const userData = await User.me();
        if (userData && userData.role === 'customer') {
          // User is already authenticated, redirect to dashboard
          const accountUrl = await getCustomerAccountUrl();
          navigate(accountUrl);
          return;
        }
      }
    } catch (error) {
      // User not authenticated, stay on auth page
    } finally {
      setLoading(false);
    }
  };

  const getCustomerAccountUrl = async () => {
    // Use current store from URL
    if (storeCode) {
      return createPublicUrl(storeCode, 'CUSTOMER_DASHBOARD');
    }
    
    // Fallback to saved store code
    const savedStoreCode = localStorage.getItem('customer_auth_store_code');
    if (savedStoreCode) {
      return createPublicUrl(savedStoreCode, 'CUSTOMER_DASHBOARD');
    }
    
    return createPublicUrl('default', 'CUSTOMER_DASHBOARD');
  };

  const handleAuth = async (formData, isLogin) => {
    setAuthLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        const response = await AuthService.login(
          formData.email, 
          formData.password, 
          formData.rememberMe, 
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
            
            // Navigate to customer account
            const accountUrl = await getCustomerAccountUrl();
            navigate(accountUrl);
            return;
          }
        }
      } else {
        // Registration
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

        // Add store_id for customer registration
        const savedStoreId = localStorage.getItem('customer_auth_store_id');
        if (savedStoreId) {
          registerData.store_id = savedStoreId;
        }
        
        const response = await AuthService.register(registerData);
        
        // Handle both array and object responses for registration
        let actualRegResponse = response;
        if (Array.isArray(response)) {
          actualRegResponse = response[0];
        }
        
        if (actualRegResponse?.success) {
          const token = actualRegResponse.data?.token || actualRegResponse.token;
          
          if (token) {
            // Clear logged out flag before setting token
            localStorage.removeItem('user_logged_out');
            
            localStorage.setItem('customer_auth_token', token);
            apiClient.setToken(token);
            
            const accountUrl = await getCustomerAccountUrl();
            navigate(accountUrl);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || `${isLogin ? 'Login' : 'Registration'} failed`);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show 2-column login/register layout
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Column */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Already Registered? Login!</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerLoginForm
              loading={authLoading}
              error={error}
              success={success}
              onAuth={handleAuth}
            />
          </CardContent>
        </Card>

        {/* Register Column */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerRegisterForm
              loading={authLoading}
              error={error}
              success={success}
              onAuth={handleAuth}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}