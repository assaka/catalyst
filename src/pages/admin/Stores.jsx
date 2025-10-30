
import React, { useState, useEffect } from 'react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { User } from '@/api/entities';
import { Store } from '@/api/entities';
import { CreditTransaction } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Store as StoreIcon, Users, Settings, Trash2, Eye, Crown, UserPlus, Pause, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getExternalStoreUrl, getStoreBaseUrl } from '@/utils/urlUtils';

export default function Stores() {
  const { selectStore, refreshStores } = useStoreSelection();
  const [stores, setStores] = useState([]);
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]); // Keep state for clients, though its usage in loadData is removed by outline
  const [loading, setLoading] = useState(true);
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newStore, setNewStore] = useState({
    name: '',
    // client_email and description are kept here because UI still references them
    // but their handling in handleCreateStore is removed by the outline.
    client_email: '',
    description: '',
    slug: '' // Added slug to newStore state as required by new handleCreateStore logic
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      // Backend API automatically filters stores by user's email from JWT token
      // No need to pass filter parameters - the backend handles this
      const userStores = await Store.findAll();
      
      // The stores from findAll might not include all fields, let's fetch complete data for each
      const completeStores = await Promise.all(
        (userStores || []).map(async (store) => {
          try {
            const fullStoreData = await Store.findById(store.id);
            // findById returns array, get first item
            const fullStore = Array.isArray(fullStoreData) ? fullStoreData[0] : fullStoreData;
            return { ...store, ...fullStore }; // Merge to ensure we have all fields
          } catch (error) {
            console.warn(`Failed to load full data for store ${store.id}:`, error);
            return store; // Return original if fetch fails
          }
        })
      );
      
      setStores(completeStores);
    } catch (error) {
      console.error('Error loading stores:', error);
      // Set empty array on error to prevent "no stores" message from showing incorrectly
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  // Add function to refresh user data specifically
  const refreshUserData = async () => {
    try {
      console.log('🔄 Refreshing user data for Create Store modal...');
      const userData = await User.me();
      console.log('✅ Fresh user data received:', {
        email: userData?.email,
        credits: userData?.credits,
        creditsType: typeof userData?.credits
      });
      setUser(userData);
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
  };

  const handleCreateStore = async () => {
    setCreateError('');
    
    // Store creation is now free - credits only charged when publishing
    
    // Dynamically generate slug if not provided, to ensure validation works
    // and to align with previous functionality where slug was derived from name.
    // The outline removed the generation but added validation for slug.
    let storeSlug = newStore.slug;
    if (!storeSlug && newStore.name) {
      storeSlug = newStore.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    if (!newStore.name) {
      setCreateError("Store Name is required.");
      return;
    }

    try {
      // The outline significantly simplifies this logic, removing client_email handling,
      // credit deductions, and specific owner_id/agency_id assignments in favor of owner_email.
      // Remove client_email from the request data since it's not supported by the model
      const storeRequest = {
        name: newStore.name,
        description: newStore.description,
        slug: storeSlug,
        owner_email: user.email
      };
      
      
      const createdStore = await Store.create(storeRequest);

      setShowCreateStore(false);
      // Reset only name and slug as specified in the outline,
      // despite client_email and description being present in the input fields.
      setNewStore({ name: '', client_email: '', description: '', slug: '' });
      setCreateError('');
      
      // Store created successfully - auto-select and redirect to store dashboard
      const storeData = createdStore.data || createdStore;
      
      // Refresh stores list and auto-select the new store
      await refreshStores();
      selectStore({
        id: storeData.id,
        name: storeData.name || newStore.name
      });
      
      // Redirect to store dashboard
      window.location.href = `/admin/settings?store=${storeData.id}`;
      
      loadData();
    } catch (error) {
      console.error("Error creating store:", error);
      
      // Handle specific error messages from the backend
      if (error.response?.data?.message) {
        setCreateError(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(e => e.message || e.msg || 'Unknown error');
        setCreateError(errorMessages.join(', '));
      } else if (error.message) {
        setCreateError(error.message);
      } else {
        setCreateError('Failed to create store. Please try again.');
      }
    }
  };

  const handleTogglePublished = async (storeId, currentStatus) => {
    try {
      await Store.update(storeId, { published: !currentStatus });
      loadData();
    } catch (error) {
      console.error('Error toggling store published status:', error);
      alert('Failed to update store status. Please try again.');
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (window.confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      try {
        await Store.delete(storeId);
        loadData();
      } catch (error) {
        console.error('Error deleting store:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.account_type === 'agency' ? 'Client Stores' : user?.role === 'admin' ? 'All Stores' : 'My Stores'}
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.account_type === 'agency'
              ? `Manage stores for your clients. ${user?.credits || 0} credits remaining.`
              : user?.role === 'admin'
                ? 'Manage all stores in the system'
                : 'Manage your online stores'
            }
          </p>
        </div>

        <Dialog open={showCreateStore} onOpenChange={async (open) => {
          setShowCreateStore(open);
          if (!open) {
            setCreateError('');
          } else {
            // Refresh user data when opening dialog to get latest credits
            await refreshUserData();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Store
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Store</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{createError}</p>
                </div>
              )}
              <div>
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  placeholder="My Awesome Store"
                />
              </div>

              {/* Input for slug - not provided in outline, but needed for new validation logic */}
              <div>
                <Label htmlFor="storeSlug">Store Slug (Optional, will be generated if empty)</Label>
                <Input
                  id="storeSlug"
                  value={newStore.slug}
                  onChange={(e) => setNewStore({ ...newStore, slug: e.target.value })}
                  placeholder="my-awesome-store"
                />
              </div>

              {(user?.account_type === 'agency' || user?.role === 'admin') && (
                <div>
                  <Label htmlFor="clientEmail">Client Email (optional)</Label>
                  <Input
                    id="clientEmail"
                    value={newStore.client_email}
                    onChange={(e) => setNewStore({ ...newStore, client_email: e.target.value })}
                    placeholder="client@example.com"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {user?.role === 'admin' ? 'Leave empty to create under your admin account' : 'Leave empty to create under your agency account'}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="storeDescription">Description</Label>
                <Input
                  id="storeDescription"
                  value={newStore.description}
                  onChange={(e) => setNewStore({ ...newStore, description: e.target.value })}
                  placeholder="Brief description of the store"
                />
              </div>

              {user?.account_type === 'agency' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Store Pricing:</strong> Stores are free to create and develop. Publishing costs 1 credit per day.
                    During development, you can view your store on a preview URL.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateStore(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateStore}
                  disabled={!newStore.name}
                >
                  Create Store
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {stores.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <StoreIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stores yet</h3>
            <p className="text-gray-600 mb-6">
              {user?.account_type === 'agency'
                ? 'Create your first client store to get started.'
                : user?.role === 'admin'
                  ? 'Create the first store to get started.'
                  : 'Create your first store to start selling online.'
              }
            </p>
            <Button onClick={() => setShowCreateStore(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Store
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Card key={store.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{store.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {store.created_at ?
                        new Date(store.created_at).toLocaleDateString() :
                        'Unknown'
                      }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* Check multiple ways to determine ownership */}
                    {(store.owner_email === user?.email || store.is_direct_owner || store.access_role === 'owner') ? (
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200" variant="outline">
                        <Crown className="w-3 h-3 mr-1" />
                        Owner
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200" variant="outline">
                        <UserPlus className="w-3 h-3 mr-1" />
                        Invited
                      </Badge>
                    )}
                    <Badge className={store.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {store.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const baseUrl = getStoreBaseUrl(store);
                        const storeCode = store.slug || store.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        window.open(getExternalStoreUrl(storeCode, '', baseUrl), '_blank');
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        // Set this store as selected and navigate to settings
                        // This ensures the settings page loads with the correct store context
                        window.location.href = `/admin/settings?store=${store.id}`;
                      }}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTogglePublished(store.id, store.published)}
                      className={store.published ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                      title={store.published ? "Pause store (stop daily charges)" : "Run store (start daily charges)"}
                    >
                      {store.published ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteStore(store.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
