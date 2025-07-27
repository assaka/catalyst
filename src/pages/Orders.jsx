
import React, { useState, useEffect } from "react";
import { Order } from "@/api/entities";
import { OrderItem } from "@/api/entities";
import { User } from "@/api/entities";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import NoStoreSelected from "@/components/admin/NoStoreSelected";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  User as UserIcon,
  MapPin,
  Plus,
  Calendar,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

export default function Orders() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState({});
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openOrderId, setOpenOrderId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedStore) {
      loadOrders();
    }
  }, [selectedStore]);

  // Listen for store changes
  useEffect(() => {
    const handleStoreChange = () => {
      if (selectedStore) {
        loadOrders();
      }
    };

    window.addEventListener('storeSelectionChanged', handleStoreChange);
    return () => window.removeEventListener('storeSelectionChanged', handleStoreChange);
  }, [selectedStore]);

  const loadOrders = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      console.warn("No store selected");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch orders filtered by the store_id
      const ordersData = await Order.filter({ store_id: storeId }, '-created_date');
      setOrders(ordersData || []);

      // Load user data for the customers in these orders
      if (ordersData && ordersData.length > 0) {
        const userIds = [...new Set(ordersData.map(o => o.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          try {
            const usersData = await User.filter({ id__in: userIds });
            const usersMap = usersData.reduce((acc, u) => {
              acc[u.id] = u;
              return acc;
            }, {});
            setUsers(usersMap);
          } catch (userError) {
            console.error("Could not load user data for orders:", userError);
            setUsers({});
          }
        } else {
          setUsers({});
        }

        // Load order items for each order
        const orderIds = ordersData.map(o => o.id);
        if (orderIds.length > 0) {
          try {
            const itemsData = await OrderItem.filter({ order_id__in: orderIds });
            const itemsMap = itemsData.reduce((acc, item) => {
              if (!acc[item.order_id]) acc[item.order_id] = [];
              acc[item.order_id].push(item);
              return acc;
            }, {});
            setOrderItems(itemsMap);
          } catch (itemError) {
            console.error("Could not load order items:", itemError);
            setOrderItems({});
          }
        } else {
          setOrderItems({});
        }
      } else {
        setUsers({});
        setOrderItems({});
      }
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Failed to load orders. Please try again later.");
      setOrders([]);
      setUsers({});
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "complete":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredOrders = orders.filter(order =>
    order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (users[order.user_id]?.full_name || order.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (users[order.user_id]?.email || order.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price) => {
    return `$${Number(price || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedStore) {
    return <NoStoreSelected />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-1">View and manage customer orders</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                disabled={!selectedStore}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-8" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="material-elevation-1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="material-elevation-1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {orders.filter(o => o.status === 'pending').length}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="material-elevation-1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Processing</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {orders.filter(o => o.status === 'processing').length}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="material-elevation-1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPrice(orders.reduce((sum, order) => sum + (order.total_amount || 0), 0))}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders Table */}
            <Card className="material-elevation-1 border-0">
              <CardContent className="p-0">
                {filteredOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <Collapsible asChild key={order.id} open={openOrderId === order.id} onOpenChange={() => setOpenOrderId(openOrderId === order.id ? null : order.id)}>
                          <>
                            <CollapsibleTrigger asChild>
                              <TableRow className="cursor-pointer hover:bg-gray-50">
                                <TableCell>
                                  {openOrderId === order.id ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">
                                  #{order.order_number || order.id.slice(-8)}
                                </TableCell>
                                <TableCell>{formatDate(order.created_date || order.createdAt)}</TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">
                                      {users[order.user_id]?.full_name || 
                                       order.customer_name || 
                                       order.billing_address?.name || 
                                       order.shipping_address?.name || 
                                       'Guest Customer'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {users[order.user_id]?.email || order.customer_email || 'No email'}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {formatPrice(order.total_amount)}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusBadge(order.status)}>
                                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            </CollapsibleTrigger>
                            <CollapsibleContent asChild>
                              <TableRow>
                                <TableCell colSpan={6} className="p-0">
                                  <div className="p-6 bg-gray-50 border-t">
                                    {/* Order Items */}
                                    <div className="mb-6">
                                      <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                                      {orderItems[order.id] && orderItems[order.id].length > 0 ? (
                                        <div className="bg-white rounded-lg border overflow-hidden">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead className="text-center">Qty</TableHead>
                                                <TableHead className="text-right">Price</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {orderItems[order.id].map((item, index) => (
                                                <TableRow key={index}>
                                                  <TableCell>
                                                    <div>
                                                      <p className="font-medium">{item.product_name || 'Unknown Product'}</p>
                                                      {item.product_sku && (
                                                        <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                                                      )}
                                                    </div>
                                                  </TableCell>
                                                  <TableCell className="text-center">{item.quantity || 1}</TableCell>
                                                  <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                                                  <TableCell className="text-right font-medium">{formatPrice(item.total_price || (item.price * item.quantity))}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      ) : (
                                        <div className="bg-white rounded-lg border p-4 text-center text-gray-500">
                                          <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                          <p>No order items found</p>
                                          <p className="text-sm">Order details may still be processing</p>
                                        </div>
                                      )}
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                      {/* Order Details */}
                                      <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Subtotal:</span>
                                            <span>{formatPrice(order.subtotal)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Shipping:</span>
                                            <span>{formatPrice(order.shipping_cost || order.shipping_amount)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Tax:</span>
                                            <span>{formatPrice(order.tax_amount)}</span>
                                          </div>
                                          {order.discount_amount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                              <span>Discount:</span>
                                              <span>-{formatPrice(order.discount_amount)}</span>
                                            </div>
                                          )}
                                          <Separator />
                                          <div className="flex justify-between font-semibold">
                                            <span>Total:</span>
                                            <span>{formatPrice(order.total_amount)}</span>
                                          </div>
                                        </div>
                                        
                                        {/* Additional Order Info */}
                                        <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Method:</span>
                                            <span className="capitalize">{order.payment_method || 'N/A'}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Status:</span>
                                            <Badge className={order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                              {order.payment_status || 'Pending'}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Shipping Address */}
                                      <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">Shipping Address</h4>
                                        {order.shipping_address ? (
                                          <div className="text-sm text-gray-600">
                                            <p className="font-medium">{order.shipping_address.full_name || order.shipping_address.name}</p>
                                            <p>{order.shipping_address.street || order.shipping_address.line1 || order.shipping_address.address}</p>
                                            {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                                            <p>{order.shipping_address.city}, {order.shipping_address.state || order.shipping_address.province} {order.shipping_address.postal_code || order.shipping_address.zip}</p>
                                            <p>{order.shipping_address.country}</p>
                                            {order.shipping_address.phone && <p>Phone: {order.shipping_address.phone}</p>}
                                          </div>
                                        ) : (
                                          <p className="text-sm text-gray-500">No shipping address provided</p>
                                        )}
                                        
                                        {/* Billing Address if different */}
                                        {order.billing_address && JSON.stringify(order.billing_address) !== JSON.stringify(order.shipping_address) && (
                                          <div className="mt-4">
                                            <h5 className="font-medium text-gray-900 mb-2">Billing Address</h5>
                                            <div className="text-sm text-gray-600">
                                              <p className="font-medium">{order.billing_address.full_name || order.billing_address.name}</p>
                                              <p>{order.billing_address.street || order.billing_address.line1 || order.billing_address.address}</p>
                                              {order.billing_address.line2 && <p>{order.billing_address.line2}</p>}
                                              <p>{order.billing_address.city}, {order.billing_address.state || order.billing_address.province} {order.billing_address.postal_code || order.billing_address.zip}</p>
                                              <p>{order.billing_address.country}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            </CollapsibleContent>
                          </>
                        </Collapsible>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-12 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                    <p className="text-gray-500">
                      {searchQuery ? 'Try adjusting your search criteria.' : 'No orders have been placed for this store yet.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
      </div>
    </div>
  );
}
