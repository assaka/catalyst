/**
 * Storefronts Admin Page
 *
 * Manage multiple theme/layout configurations per store.
 * Features:
 * - List all storefronts with primary/scheduled badges
 * - Create new storefronts
 * - Edit storefront settings (name, slug, theme override)
 * - Schedule activation (publish_start_at, publish_end_at)
 * - Preview storefronts
 * - Set storefront as primary
 * - Duplicate storefronts
 */

import React, { useState, useEffect } from 'react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  Star,
  Copy,
  Calendar,
  Palette,
  ExternalLink
} from 'lucide-react';
import { useAlertTypes } from '@/hooks/useAlert';
import FlashMessage from '@/components/storefront/FlashMessage';
import apiClient from '@/api/client';

export default function Storefronts() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const { showWarning, showConfirm, AlertComponent } = useAlertTypes();
  const [flashMessage, setFlashMessage] = useState(null);

  const [storefronts, setStorefronts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStorefront, setEditingStorefront] = useState(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicatingStorefront, setDuplicatingStorefront] = useState(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [duplicateSlug, setDuplicateSlug] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    settings_override: {},
    publish_start_at: '',
    publish_end_at: ''
  });

  useEffect(() => {
    if (selectedStore) {
      loadStorefronts();
    }
  }, [selectedStore]);

  const loadStorefronts = async () => {
    setLoading(true);
    try {
      const storeId = getSelectedStoreId();
      if (!storeId) {
        setLoading(false);
        return;
      }

      const response = await apiClient.get(`/storefronts?store_id=${storeId}`);
      setStorefronts(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load storefronts:', error);
      setStorefronts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingStorefront(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      settings_override: {},
      publish_start_at: '',
      publish_end_at: ''
    });
    setShowForm(true);
  };

  const handleEdit = (storefront) => {
    setEditingStorefront(storefront);
    setFormData({
      name: storefront.name,
      slug: storefront.slug,
      description: storefront.description || '',
      settings_override: storefront.settings_override || {},
      publish_start_at: storefront.publish_start_at ? storefront.publish_start_at.slice(0, 16) : '',
      publish_end_at: storefront.publish_end_at ? storefront.publish_end_at.slice(0, 16) : ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const storeId = getSelectedStoreId();

    if (!formData.name?.trim()) {
      showWarning('Please enter a name for the storefront.');
      return;
    }

    if (!formData.slug?.trim()) {
      showWarning('Please enter a slug for the storefront.');
      return;
    }

    try {
      const payload = {
        ...formData,
        store_id: storeId,
        publish_start_at: formData.publish_start_at || null,
        publish_end_at: formData.publish_end_at || null
      };

      if (editingStorefront) {
        await apiClient.put(`/storefronts/${editingStorefront.id}`, payload);
        setFlashMessage({ type: 'success', message: 'Storefront updated successfully!' });
      } else {
        await apiClient.post('/storefronts', payload);
        setFlashMessage({ type: 'success', message: 'Storefront created successfully!' });
      }

      setShowForm(false);
      loadStorefronts();
    } catch (error) {
      console.error('Failed to save storefront:', error);
      setFlashMessage({ type: 'error', message: error.response?.data?.error || 'Failed to save storefront' });
    }
  };

  const handleDelete = async (storefront) => {
    if (storefront.is_primary) {
      showWarning('Cannot delete the primary storefront. Set another storefront as primary first.');
      return;
    }

    const confirmed = await showConfirm(
      `Are you sure you want to delete "${storefront.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await apiClient.delete(`/storefronts/${storefront.id}?store_id=${getSelectedStoreId()}`);
      setFlashMessage({ type: 'success', message: 'Storefront deleted successfully!' });
      loadStorefronts();
    } catch (error) {
      console.error('Failed to delete storefront:', error);
      setFlashMessage({ type: 'error', message: error.response?.data?.error || 'Failed to delete storefront' });
    }
  };

  const handleSetPrimary = async (storefront) => {
    const confirmed = await showConfirm(
      `Set "${storefront.name}" as the primary storefront? This will be shown to all visitors.`
    );

    if (!confirmed) return;

    try {
      await apiClient.post(`/storefronts/${storefront.id}/set-primary`, {
        store_id: getSelectedStoreId()
      });
      setFlashMessage({ type: 'success', message: `"${storefront.name}" is now the primary storefront!` });
      loadStorefronts();
    } catch (error) {
      console.error('Failed to set primary storefront:', error);
      setFlashMessage({ type: 'error', message: error.response?.data?.error || 'Failed to set primary' });
    }
  };

  const handleDuplicate = (storefront) => {
    setDuplicatingStorefront(storefront);
    setDuplicateName(`${storefront.name} (Copy)`);
    setDuplicateSlug(`${storefront.slug}-copy`);
    setShowDuplicateDialog(true);
  };

  const handleDuplicateSubmit = async () => {
    if (!duplicateName?.trim() || !duplicateSlug?.trim()) {
      showWarning('Please enter both name and slug for the duplicate.');
      return;
    }

    try {
      await apiClient.post(`/storefronts/${duplicatingStorefront.id}/duplicate`, {
        store_id: getSelectedStoreId(),
        new_name: duplicateName,
        new_slug: duplicateSlug
      });
      setFlashMessage({ type: 'success', message: 'Storefront duplicated successfully!' });
      setShowDuplicateDialog(false);
      loadStorefronts();
    } catch (error) {
      console.error('Failed to duplicate storefront:', error);
      setFlashMessage({ type: 'error', message: error.response?.data?.error || 'Failed to duplicate' });
    }
  };

  const handlePreview = (storefront) => {
    const storeSlug = selectedStore?.slug;
    if (!storeSlug) return;

    // Open storefront with preview param
    const previewUrl = `/public/${storeSlug}?storefront=${storefront.slug}`;
    window.open(previewUrl, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStorefrontStatus = (storefront) => {
    const now = new Date();

    if (storefront.is_primary) {
      return { label: 'Primary', variant: 'default' };
    }

    if (storefront.publish_start_at) {
      const start = new Date(storefront.publish_start_at);
      const end = storefront.publish_end_at ? new Date(storefront.publish_end_at) : null;

      if (start <= now && (!end || end >= now)) {
        return { label: 'Active (Scheduled)', variant: 'success' };
      } else if (start > now) {
        return { label: 'Scheduled', variant: 'secondary' };
      } else if (end && end < now) {
        return { label: 'Expired', variant: 'outline' };
      }
    }

    return { label: 'Draft', variant: 'outline' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AlertComponent />

      {flashMessage && (
        <FlashMessage
          message={flashMessage}
          onClose={() => setFlashMessage(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Storefronts</h1>
          <p className="text-gray-600 mt-1">
            Manage multiple theme and layout variants for your store
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Storefront
        </Button>
      </div>

      {/* Storefronts Grid */}
      {storefronts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Palette className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No storefronts yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first storefront to start customizing themes and layouts.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Storefront
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {storefronts.map((storefront) => {
            const status = getStorefrontStatus(storefront);
            return (
              <Card key={storefront.id} className={storefront.is_primary ? 'border-blue-500 border-2' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {storefront.name}
                        {storefront.is_primary && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="font-mono text-sm">
                        /{storefront.slug}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreview(storefront)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(storefront)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(storefront)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        {!storefront.is_primary && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSetPrimary(storefront)}>
                              <Star className="w-4 h-4 mr-2" />
                              Set as Primary
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(storefront)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Badge variant={status.variant}>{status.label}</Badge>

                    {storefront.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {storefront.description}
                      </p>
                    )}

                    {(storefront.publish_start_at || storefront.publish_end_at) && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {storefront.publish_start_at && (
                          <span>Starts: {formatDate(storefront.publish_start_at)}</span>
                        )}
                        {storefront.publish_end_at && (
                          <span className="ml-2">Ends: {formatDate(storefront.publish_end_at)}</span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(storefront)}
                        className="flex-1"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(storefront)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingStorefront ? 'Edit Storefront' : 'Create Storefront'}
            </DialogTitle>
            <DialogDescription>
              {editingStorefront
                ? 'Update the storefront settings'
                : 'Create a new theme variant for your store'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Black Friday Theme"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({
                  ...formData,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                })}
                placeholder="e.g., black-friday"
              />
              <p className="text-xs text-gray-500">
                Used in preview URL: ?storefront={formData.slug || 'slug'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this storefront variant..."
                rows={2}
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Scheduling (Optional)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="publish_start">Start Date/Time</Label>
                  <Input
                    id="publish_start"
                    type="datetime-local"
                    value={formData.publish_start_at}
                    onChange={(e) => setFormData({ ...formData, publish_start_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publish_end">End Date/Time</Label>
                  <Input
                    id="publish_end"
                    type="datetime-local"
                    value={formData.publish_end_at}
                    onChange={(e) => setFormData({ ...formData, publish_end_at: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Schedule when this storefront should automatically become active.
                Leave empty for manual control.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingStorefront ? 'Update' : 'Create'} Storefront
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Storefront</DialogTitle>
            <DialogDescription>
              Create a copy of "{duplicatingStorefront?.name}" with a new name and slug.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dup-name">Name *</Label>
              <Input
                id="dup-name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dup-slug">Slug *</Label>
              <Input
                id="dup-slug"
                value={duplicateSlug}
                onChange={(e) => setDuplicateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDuplicateSubmit}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
