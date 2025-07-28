import React, { useState, useEffect } from 'react';
import { Customer } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import NoStoreSelected from '@/components/admin/NoStoreSelected';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Search, Download } from 'lucide-react';

export default function Customers() {
    const { selectedStore, getSelectedStoreId } = useStoreSelection();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (selectedStore) {
            loadData();
        }
    }, [selectedStore]);

    // Listen for store changes
    useEffect(() => {
        const handleStoreChange = () => {
            if (selectedStore) {
                loadData();
            }
        };

        window.addEventListener('storeSelectionChanged', handleStoreChange);
        return () => window.removeEventListener('storeSelectionChanged', handleStoreChange);
    }, [selectedStore]);

    const loadData = async () => {
        const storeId = getSelectedStoreId();
        if (!storeId) {
            console.warn("No store selected");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('🔍 Loading customers for store:', storeId);
            const customerData = await Customer.filter({ store_id: storeId }, '-last_order_date');
            console.log('🔍 Customer data received:', customerData);
            console.log('🔍 Customer data type:', typeof customerData);
            console.log('🔍 Customer data length:', customerData?.length);
            setCustomers(customerData || []);
        } catch (error) {
            console.error("❌ Error loading customers:", error);
            console.error("❌ Error details:", {
                message: error.message,
                status: error.status,
                data: error.data
            });
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(customer =>
        (customer.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (customer.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (customer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    
    const handleExport = () => {
        const headers = ["First Name", "Last Name", "Email", "Total Orders", "Total Spent", "Last Order Date"];
        const rows = filteredCustomers.map(c => [
            c.first_name,
            c.last_name,
            c.email,
            c.total_orders,
            (() => {
                const totalSpent = parseFloat(c.total_spent || 0);
                return isNaN(totalSpent) ? '0.00' : totalSpent.toFixed(2);
            })(),
            c.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : ''
        ].join(','));
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "customers.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!selectedStore) {
        return <NoStoreSelected />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-600 mt-1">View and manage your store's customers</p>
                </div>
                <Button onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </div>
            
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="Search customers by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium">Name</th>
                                    <th className="text-left py-3 px-4 font-medium">Email</th>
                                    <th className="text-left py-3 px-4 font-medium">Total Orders</th>
                                    <th className="text-left py-3 px-4 font-medium">Total Spent</th>
                                    <th className="text-left py-3 px-4 font-medium">Last Order</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map(customer => (
                                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">{customer.first_name} {customer.last_name}</td>
                                        <td className="py-3 px-4">{customer.email}</td>
                                        <td className="py-3 px-4">{customer.total_orders}</td>
                                        <td className="py-3 px-4">${(() => {
                                            const totalSpent = parseFloat(customer.total_spent || 0);
                                            return isNaN(totalSpent) ? '0.00' : totalSpent.toFixed(2);
                                        })()}</td>
                                        <td className="py-3 px-4">{customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredCustomers.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
                            <p className="text-gray-600">Your customers will appear here once they place an order.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}