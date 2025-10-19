import React, { useState, useEffect } from 'react';
import { Customer } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import NoStoreSelected from '@/components/admin/NoStoreSelected';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SaveButton from '@/components/ui/save-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Search, Download, Edit, Trash2, UserPlus } from 'lucide-react';
import { useAlertTypes } from '@/hooks/useAlert';

export default function Customers() {
    const { selectedStore, getSelectedStoreId } = useStoreSelection();
    const { showError, AlertComponent } = useAlertTypes();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

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
            const customerData = await Customer.filter({ store_id: storeId }, '-last_order_date');
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
        (customer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (customer.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const handleEditCustomer = (customer) => {
        setEditingCustomer(customer);
        setIsEditModalOpen(true);
    };

    const handleDeleteCustomer = async (customerId) => {
        if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            return;
        }

        try {
            await Customer.delete(customerId);
            setCustomers(customers.filter(c => c.id !== customerId));
        } catch (error) {
            console.error('Error deleting customer:', error);
            showError('Failed to delete customer. Please try again.');
        }
    };

    const handleSaveCustomer = async (e) => {
        e.preventDefault();
        if (!editingCustomer) return;

        setSaveSuccess(false);
        setSaving(true);
        try {
            const formData = new FormData(e.target);
            const updatedData = {
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address_data: {
                    ...editingCustomer.address_data,
                    shipping_address: {
                        street: formData.get('street'),
                        city: formData.get('city'),
                        state: formData.get('state'),
                        postal_code: formData.get('postal_code'),
                        country: formData.get('country')
                    }
                }
            };

            await Customer.update(editingCustomer.id, updatedData);

            // Update the local state
            setCustomers(customers.map(c =>
                c.id === editingCustomer.id
                    ? { ...c, ...updatedData }
                    : c
            ));

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
            setIsEditModalOpen(false);
            setEditingCustomer(null);
        } catch (error) {
            console.error('Error updating customer:', error);
            showError('Failed to update customer. Please try again.');
        } finally {
            setSaving(false);
        }
    };
    
    const handleExport = () => {
        const headers = ["First Name", "Last Name", "Email", "Total Orders", "Total Spent", "Last Order Date"];
        const rows = filteredCustomers.map(c => [
            c.first_name,
            c.last_name,
            c.email,
            c.phone || '',
            (() => {
                const addressData = c.address_data?.shipping_address || c.address_data?.billing_address;
                if (addressData) {
                    const parts = [
                        addressData.street,
                        addressData.city,
                        addressData.state,
                        addressData.postal_code
                    ].filter(Boolean);
                    return parts.length > 0 ? parts.join(', ') : '';
                }
                return '';
            })(),
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
                            placeholder="Search customers by name, email, or phone..."
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
                                    <th className="text-left py-3 px-4 font-medium">Actions</th>
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
                                        <td className="py-3 px-4">
                                            <div className="flex space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditCustomer(customer)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeleteCustomer(customer.id)}
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
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

            {/* Edit Customer Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Customer</DialogTitle>
                    </DialogHeader>
                    {editingCustomer && (
                        <form onSubmit={handleSaveCustomer} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="first_name">First Name</Label>
                                    <Input
                                        id="first_name"
                                        name="first_name"
                                        defaultValue={editingCustomer.first_name || ''}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        name="last_name"
                                        defaultValue={editingCustomer.last_name || ''}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={editingCustomer.email || ''}
                                    required
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={editingCustomer.phone || ''}
                                />
                            </div>
                            
                            <div className="space-y-3">
                                <h4 className="font-medium">Address Information</h4>
                                <div>
                                    <Label htmlFor="street">Street Address</Label>
                                    <Input
                                        id="street"
                                        name="street"
                                        defaultValue={editingCustomer.address_data?.shipping_address?.street || ''}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            name="city"
                                            defaultValue={editingCustomer.address_data?.shipping_address?.city || ''}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="state">State</Label>
                                        <Input
                                            id="state"
                                            name="state"
                                            defaultValue={editingCustomer.address_data?.shipping_address?.state || ''}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="postal_code">Postal Code</Label>
                                        <Input
                                            id="postal_code"
                                            name="postal_code"
                                            defaultValue={editingCustomer.address_data?.shipping_address?.postal_code || ''}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="country">Country</Label>
                                        <Input
                                            id="country"
                                            name="country"
                                            defaultValue={editingCustomer.address_data?.shipping_address?.country || ''}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <SaveButton
                                    type="submit"
                                    loading={saving}
                                    success={saveSuccess}
                                    defaultText="Save Changes"
                                />
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
            <AlertComponent />
        </div>
    );
}