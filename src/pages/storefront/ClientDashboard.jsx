
import React, { useState, useEffect } from "react";
import { User, Auth } from "@/api/entities";
import { Store } from "@/api/entities";
import { Order } from "@/api/entities";
import { CreditTransaction } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Store as StoreIcon,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  Plus,
  Calendar,
  DollarSign,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ClientDashboard() {
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    creditsRemaining: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      // Load client's store
      const stores = await Store.findAll();
      if (stores.length > 0) {
        setStore(stores[0]);

        // Load orders for revenue calculation
        const orders = await Order.filter({ store_id: stores[0].id });
        const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);

        setStats({
          totalOrders: orders.length,
          totalRevenue,
          creditsRemaining: userData.credits || 0
        });
      } else {
        // Handle case where user has no store yet (onboarding scenario)
        setStore(null); // Explicitly set to null if no store found
        setStats({ // Still show user credits even if no store, but other stats are 0
          totalOrders: 0,
          totalRevenue: 0,
          creditsRemaining: userData.credits || 0
        });
      }

      // Load credit transactions
      const creditTransactions = await CreditTransaction.filter({ user_id: userData.id }, "-created_date");
      setTransactions(creditTransactions.slice(0, 5));

    } catch (error) {
      console.error("Error loading client data:", error);
      // In a real application, you might redirect to a login page or show an error state
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async (credits, amount) => {
    try {
      // Create transaction
      await CreditTransaction.create({
        user_id: user.id,
        amount_usd: amount,
        credits_purchased: credits,
        status: 'completed',
        stripe_charge_id: 'simulated_' + Date.now() // Placeholder for actual Stripe charge ID
      });

      // Update user credits
      const newCredits = (user.credits || 0) + credits;
      await User.updateMyUserData({ credits: newCredits });

      // Refresh data to reflect new credits and transactions
      loadClientData();
    } catch (error) {
      console.error("Purchase failed:", error);
      // Provide user feedback on purchase failure
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.full_name?.split(' ')[0]} 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your store and monitor performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="px-3 py-1 bg-green-100 text-green-700">
                ACTIVE
              </Badge>
              {store && (
                <Link to={createPageUrl("Storefront")}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <StoreIcon className="w-4 h-4 mr-2" />
                    View Store
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Credits Remaining</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.creditsRemaining}</p>
                  <p className="text-xs text-gray-500">
                    {/* Placeholder for actual calculation logic if 1 credit = X days */}
                    {`~${stats.creditsRemaining} days remaining`} 
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Changed "Manage Store" link to a more specific store settings page */}
                  <Link to={createPageUrl("StoreSettings")}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <Settings className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <h3 className="font-semibold">Manage Store</h3>
                        <p className="text-sm text-gray-600">Access admin panel</p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handlePurchaseCredits(100, 10)}>
                    <CardContent className="p-4 text-center">
                      <CreditCard className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <h3 className="font-semibold">Buy Credits</h3>
                      <p className="text-sm text-gray-600">100 credits for $10</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Store Info / Onboarding Section */}
            {store ? (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Your Store</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                      <StoreIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{store.name}</h3>
                      <p className="text-gray-600">Status: {store.status}</p>
                      <Link to={createPageUrl("Storefront")} className="text-blue-600 hover:text-blue-800 text-sm">
                        Visit Store →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Get Started: Create Your Store</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">It looks like you haven't set up your store yet. Create one now to start selling and unlock full dashboard features!</p>
                  {/* Link to a dedicated store creation page */}
                  <Link to={createPageUrl("CreateStore")}> 
                    <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Create My Store
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Credit Management */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Credit Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{user?.credits || 0}</p>
                    <p className="text-sm text-gray-600">Credits Available</p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => handlePurchaseCredits(100, 10)}
                    >
                      Buy 100 Credits - $10
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handlePurchaseCredits(500, 45)}
                    >
                      Buy 500 Credits - $45
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    <p>1 credit = 1 day of store operation</p>
                    <p>10 credits = $1 USD</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.length > 0 ? transactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">+{tx.credits_purchased} credits</p>
                        <p className="text-sm text-gray-500">{new Date(tx.created_date).toLocaleDateString()}</p>
                      </div>
                      <p className="font-medium">${tx.amount_usd}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500">No transactions yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={async () => {
            try {
              await Auth.logout();
              setTimeout(() => {
                window.location.href = '/admin/auth';
              }, 100);
            } catch (error) {
              window.location.href = '/auth';
            }
          }}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
