import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Plus, Trash2, Download, Upload } from "lucide-react";
import { useStoreSelection } from "@/contexts/StoreSelectionContext.jsx";
import adminApiClient from "@/api/admin-client";
import { toast } from "sonner";

export default function SeoRedirects() {
  const { getSelectedStoreId } = useStoreSelection();
  const [redirects, setRedirects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromUrl, setFromUrl] = useState('');
  const [toUrl, setToUrl] = useState('');
  const [redirectType, setRedirectType] = useState('301');

  useEffect(() => {
    loadRedirects();
  }, []);

  const loadRedirects = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      toast.error('No store selected');
      return;
    }

    try {
      setLoading(true);
      const response = await adminApiClient.get(`/redirects?store_id=${storeId}`);
      setRedirects(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading redirects:', error);
      toast.error('Failed to load redirects');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRedirect = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      toast.error('No store selected');
      return;
    }

    if (!fromUrl || !toUrl) {
      toast.error('Please enter both From and To URLs');
      return;
    }

    try {
      setLoading(true);
      await adminApiClient.post('/redirects', {
        store_id: storeId,
        from_url: fromUrl,
        to_url: toUrl,
        type: redirectType,
        is_active: true
      });

      toast.success('Redirect added successfully');
      setFromUrl('');
      setToUrl('');
      setRedirectType('301');
      await loadRedirects();
    } catch (error) {
      console.error('Error adding redirect:', error);
      toast.error('Failed to add redirect');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRedirect = async (id) => {
    if (!confirm('Are you sure you want to delete this redirect?')) {
      return;
    }

    try {
      setLoading(true);
      await adminApiClient.delete(`/redirects/${id}`);
      toast.success('Redirect deleted successfully');
      await loadRedirects();
    } catch (error) {
      console.error('Error deleting redirect:', error);
      toast.error('Failed to delete redirect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <RefreshCw className="h-6 w-6" />
        <h1 className="text-3xl font-bold">URL Redirects</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Redirect</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-url">From URL</Label>
              <Input
                id="from-url"
                placeholder="/old-path"
                value={fromUrl}
                onChange={(e) => setFromUrl(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-url">To URL</Label>
              <Input
                id="to-url"
                placeholder="/new-path"
                value={toUrl}
                onChange={(e) => setToUrl(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirect-type">Type</Label>
              <Select
                value={redirectType}
                onValueChange={setRedirectType}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 (Permanent)</SelectItem>
                  <SelectItem value="302">302 (Temporary)</SelectItem>
                  <SelectItem value="307">307 (Temporary)</SelectItem>
                  <SelectItem value="308">308 (Permanent)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={handleAddRedirect}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Redirect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Active Redirects</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Hits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading redirects...
                  </TableCell>
                </TableRow>
              ) : redirects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No redirects found. Add your first redirect above.
                  </TableCell>
                </TableRow>
              ) : (
                redirects.map(redirect => (
                  <TableRow key={redirect.id}>
                    <TableCell className="font-mono text-sm">{redirect.from_url}</TableCell>
                    <TableCell className="font-mono text-sm">{redirect.to_url}</TableCell>
                    <TableCell>{redirect.type}</TableCell>
                    <TableCell>{redirect.hit_count || 0}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded ${
                        redirect.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {redirect.is_active ? 'active' : 'inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRedirect(redirect.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}