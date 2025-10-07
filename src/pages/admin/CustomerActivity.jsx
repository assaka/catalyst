import React, { useState, useEffect } from "react";
import { CustomerActivity } from "@/api/entities";
import { Store } from "@/api/entities";
import { User } from "@/api/entities";
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, ShoppingCart, Search, Heart, CreditCard, Package, RefreshCw, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export default function CustomerActivityPage() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [activities, setActivities] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Date range filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (selectedStore) {
      loadData(1); // Reset to page 1 when store changes
    }
  }, [selectedStore]);

  // Reload data when filters change
  useEffect(() => {
    if (selectedStore) {
      setCurrentPage(1); // Reset to page 1 when filters change
      loadData(1);
    }
  }, [activityFilter, startDate, endDate, searchQuery]);

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadData(page);
  };

  const loadData = async (page = currentPage) => {
    try {
      setLoading(true);
      
      if (!selectedStore) {
        setActivities([]);
        setStore(null);
        setTotalItems(0);
        setTotalPages(0);
        setLoading(false);
        return;
      }
      
      setStore(selectedStore);
      
      // Build filter parameters
      const filters = {
        store_id: selectedStore.id,
        page: page,
        limit: itemsPerPage
      };
      
      // Add activity type filter
      if (activityFilter !== "all") {
        filters.activity_type = activityFilter;
      }
      
      // Add date range filters
      if (startDate) {
        filters.start_date = startDate;
      }
      if (endDate) {
        filters.end_date = endDate;
      }
      
      // Add search query filter
      if (searchQuery.trim()) {
        // The API should support searching across multiple fields
        filters.search = searchQuery.trim();
      }

      // Use findPaginated for proper pagination support
      const paginatedResult = await CustomerActivity.findPaginated(
        page,
        itemsPerPage,
        filters
      );
      
      if (paginatedResult && paginatedResult.data) {
        setActivities(paginatedResult.data || []);
        setTotalItems(paginatedResult.pagination?.total || 0);
        setTotalPages(paginatedResult.pagination?.total_pages || 0);
        setCurrentPage(paginatedResult.pagination?.current_page || page);
      } else {
        // Fallback to filter method if findPaginated doesn't work
        const activitiesData = await CustomerActivity.filter(filters);
        setActivities(activitiesData || []);
        setTotalItems(activitiesData?.length || 0);
        setTotalPages(Math.ceil((activitiesData?.length || 0) / itemsPerPage));
      }
      
    } catch (error) {
      console.error("Error loading customer activity:", error);
      setActivities([]);
      setStore(null);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      page_view: Eye,
      product_view: Package,
      add_to_cart: ShoppingCart,
      remove_from_cart: ShoppingCart,
      checkout_started: CreditCard,
      order_completed: CreditCard,
      search: Search,
      wishlist_add: Heart
    };
    return icons[type] || Eye;
  };

  const getActivityColor = (type) => {
    const colors = {
      page_view: "bg-blue-100 text-blue-800",
      product_view: "bg-green-100 text-green-800",
      add_to_cart: "bg-purple-100 text-purple-800",
      remove_from_cart: "bg-red-100 text-red-800",
      checkout_started: "bg-yellow-100 text-yellow-800",
      order_completed: "bg-emerald-100 text-emerald-800",
      search: "bg-gray-100 text-gray-800",
      wishlist_add: "bg-pink-100 text-pink-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  // Pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const pages = [];
      const showEllipsis = totalPages > 7;
      
      if (!showEllipsis) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 4) {
          for (let i = 1; i <= 5; i++) pages.push(i);
          pages.push('ellipsis');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 3) {
          pages.push(1);
          pages.push('ellipsis');
          for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push('ellipsis');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
          pages.push('ellipsis');
          pages.push(totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} activities
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === 'ellipsis' ? (
                <span className="px-3 py-1 text-gray-500">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="min-w-[2.5rem]"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  // No need for client-side filtering since we're doing server-side filtering
  const filteredActivities = activities;

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Activity</h1>
            <p className="text-gray-600 mt-1">Track customer behavior and interactions</p>
          </div>
          <Button 
            onClick={() => loadData(currentPage)} 
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* First row: Search and Activity Filter */}
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
                    <SelectItem value="add_to_cart">Add to Cart</SelectItem>
                    <SelectItem value="remove_from_cart">Remove from Cart</SelectItem>
                    <SelectItem value="checkout_started">Checkout Started</SelectItem>
                    <SelectItem value="order_completed">Orders Completed</SelectItem>
                    <SelectItem value="search">Searches</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Second row: Date Range Filter */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Date Range:</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <div className="flex-1">
                    <Input
                      type="date"
                      placeholder="Start date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="date"
                      placeholder="End date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  {(startDate || endDate) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="text-sm"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Log ({totalItems} total, page {currentPage} of {totalPages})</CardTitle>
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
                            {(() => {
                              const timestamp = activity.created_at || activity.createdAt || activity.updated_at || activity.updatedAt;
                              if (!timestamp) return 'No timestamp';
                              try {
                                const date = new Date(timestamp);
                                if (isNaN(date.getTime())) return 'Invalid timestamp';
                                return date.toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                });
                              } catch (e) {
                                return 'Invalid timestamp';
                              }
                            })()}
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
            
            {/* Pagination */}
            {renderPagination()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}