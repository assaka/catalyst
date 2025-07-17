import React, { useState, useEffect } from "react";
import { CustomerActivity } from "@/api/entities";
import { Store } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, ShoppingCart, Search, Heart, CreditCard, Package } from "lucide-react";

export default function CustomerActivityPage() {
  const [activities, setActivities] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const user = await User.me();
      const stores = await Store.findAll();
      
      if (stores && stores.length > 0) {
        const currentStore = stores[0];
        setStore(currentStore);
        
        const activitiesData = await CustomerActivity.filter({ store_id: currentStore.id }, '-created_date');
        setActivities(activitiesData || []);
      } else {
        setActivities([]);
        setStore(null);
        console.warn("No store found for user:", user.email);
      }
    } catch (error) {
      console.error("Error loading customer activity:", error);
      setActivities([]);
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      page_view: Eye,
      product_view: Package,
      cart_add: ShoppingCart,
      cart_remove: ShoppingCart,
      checkout_start: CreditCard,
      purchase: CreditCard,
      search: Search,
      wishlist_add: Heart
    };
    return icons[type] || Eye;
  };

  const getActivityColor = (type) => {
    const colors = {
      page_view: "bg-blue-100 text-blue-800",
      product_view: "bg-green-100 text-green-800",
      cart_add: "bg-purple-100 text-purple-800",
      cart_remove: "bg-red-100 text-red-800",
      checkout_start: "bg-yellow-100 text-yellow-800",
      purchase: "bg-emerald-100 text-emerald-800",
      search: "bg-gray-100 text-gray-800",
      wishlist_add: "bg-pink-100 text-pink-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchQuery || 
      activity.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.search_query?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.page_url?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activityFilter === "all" || activity.activity_type === activityFilter;
    
    return matchesSearch && matchesFilter;
  });

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customer Activity</h1>
          <p className="text-gray-600 mt-1">Track customer behavior and interactions</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by email, query, or page..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="page_view">Page Views</SelectItem>
                  <SelectItem value="product_view">Product Views</SelectItem>
                  <SelectItem value="cart_add">Cart Additions</SelectItem>
                  <SelectItem value="cart_remove">Cart Removals</SelectItem>
                  <SelectItem value="checkout_start">Checkout Started</SelectItem>
                  <SelectItem value="purchase">Purchases</SelectItem>
                  <SelectItem value="search">Searches</SelectItem>
                  <SelectItem value="wishlist_add">Wishlist Additions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Log ({filteredActivities.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredActivities.length > 0 ? (
              <div className="space-y-4">
                {filteredActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.activity_type);
                  return (
                    <div key={activity.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0">
                        <Icon className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getActivityColor(activity.activity_type)}>
                            {activity.activity_type.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(activity.created_date).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.customer_email || 'Anonymous'}
                        </p>
                        {activity.page_url && (
                          <p className="text-sm text-gray-600">{activity.page_url}</p>
                        )}
                        {activity.search_query && (
                          <p className="text-sm text-gray-600">Search: "{activity.search_query}"</p>
                        )}
                        {activity.product_id && (
                          <p className="text-sm text-gray-600">Product ID: {activity.product_id}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h3>
                <p className="text-gray-600">
                  {searchQuery || activityFilter !== "all" 
                    ? "Try adjusting your filters to see more results." 
                    : "Customer activity will appear here as visitors interact with your store."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}