import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Package,
  MapPin,
  Heart,
  Settings,
  LogOut,
  ShoppingBag
} from "lucide-react";
import { createPublicUrl } from "@/utils/urlUtils";
import { useStore } from "@/components/storefront/StoreProvider";
import { CustomerAuth } from "@/api/storefront-entities";

export default function Account() {
  const navigate = useNavigate();
  const { store } = useStore();

  const handleLogout = async () => {
    try {
      await CustomerAuth.logout();
      localStorage.removeItem('customer_auth_token');
      localStorage.removeItem('customer_auth_store_code');
      localStorage.removeItem('customer_user_data');
      localStorage.setItem('user_logged_out', 'true');

      const storefrontUrl = createPublicUrl(store?.slug || 'default', 'STOREFRONT');
      navigate(storefrontUrl);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const goToDashboard = () => {
    navigate(createPublicUrl(store?.slug || 'default', 'CUSTOMER_DASHBOARD'));
  };

  const goToOrders = () => {
    navigate(createPublicUrl(store?.slug || 'default', 'CUSTOMER_DASHBOARD') + '?tab=orders');
  };

  const goToAddresses = () => {
    navigate(createPublicUrl(store?.slug || 'default', 'CUSTOMER_DASHBOARD') + '?tab=addresses');
  };

  const goToWishlist = () => {
    navigate(createPublicUrl(store?.slug || 'default', 'CUSTOMER_DASHBOARD') + '?tab=wishlist');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dashboard Overview */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={goToDashboard}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Account Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View your account overview and statistics</p>
            </CardContent>
          </Card>

          {/* Orders */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={goToOrders}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2 text-purple-600" />
                My Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Track and manage your orders</p>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={goToAddresses}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                Saved Addresses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage your delivery addresses</p>
            </CardContent>
          </Card>

          {/* Wishlist */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={goToWishlist}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-600" />
                My Wishlist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View and manage your saved items</p>
            </CardContent>
          </Card>
        </div>

        {/* Logout Section */}
        <div className="mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">Account Actions</h3>
                  <p className="text-sm text-gray-600">Manage your session</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
