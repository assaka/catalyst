import React, { useState, useEffect, useCallback } from 'react';
import { MediaAsset } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import NoStoreSelected from '@/components/admin/NoStoreSelected';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // New import for Select components
import {
  Upload,
  Trash2,
  Copy,
  Check,
  Image as ImageIcon,
  Loader2,
  Info
} from 'lucide-react';
import FlashMessage from '@/components/storefront/FlashMessage';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const retryApiCall = async (apiCall, retries = 3, delayMs = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429 && i < retries - 1) {
        await delay(delayMs * Math.pow(2, i));
      } else {
        throw error;
      }
    }
  }
};

export default function ImageManager() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);

  useEffect(() => {
    if (selectedStore) {
      loadAssets();
    }
  }, [selectedStore]);

  // Listen for store changes
  useEffect(() => {
    const handleStoreChange = () => {
      if (selectedStore) {
        loadAssets();
      }
    };

    window.addEventListener('storeSelectionChanged', handleStoreChange);
    return () => window.removeEventListener('storeSelectionChanged', handleStoreChange);
  }, [selectedStore]);


  const loadAssets = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      console.warn("No store selected");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const assetsData = await retryApiCall(() => MediaAsset.filter({ store_id: storeId }, "-created_date"));
      setAssets(assetsData || []);
    } catch (error) {
      console.error('Error loading media assets:', error);
      setFlashMessage({ type: 'error', message: 'Failed to load images.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    const storeId = getSelectedStoreId();
    if (!file || !storeId) return;

    setUploading(true);
    setFlashMessage(null);
    try {
      const uploadResult = await retryApiCall(() => UploadFile({ file }));
      if (uploadResult && uploadResult.file_url) {
        const newAsset = {
          name: file.name,
          file_url: uploadResult.file_url,
          file_type: file.type,
          file_size: file.size,
          alt_text: '',
          store_id: storeId,
        };
        await retryApiCall(() => MediaAsset.create(newAsset));
        setFlashMessage({ type: 'success', message: 'Image uploaded successfully!' });
        await loadAssets();
      } else {
        throw new Error('Upload failed to return a URL');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setFlashMessage({ type: 'error', message: 'File upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (assetId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await retryApiCall(() => MediaAsset.delete(assetId));
        setFlashMessage({ type: 'success', message: 'Image deleted.' });
        loadAssets();
      } catch (error) {
        console.error('Error deleting asset:', error);
        setFlashMessage({ type: 'error', message: 'Failed to delete image.' });
      }
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  if (!selectedStore) {
    return <NoStoreSelected />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Image Manager</h1>
            <p className="text-gray-600 mt-1">Upload and manage your media assets.</p>
          </div>
        </div>

        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-700" />
          <AlertTitle className="text-blue-800">Managed Cloud Storage</AlertTitle>
          <AlertDescription className="text-blue-700">
            Your images are uploaded to a secure, managed cloud storage provider. There is no need to configure credentials for AWS S3 or Google Cloud. The platform handles all storage infrastructure automatically.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Uploader */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Image</CardTitle>
                <CardDescription>Select an image to upload to your store.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading || !selectedStore}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className={`cursor-pointer flex flex-col items-center ${!selectedStore || uploading ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {uploading ? 'Uploading...' : 'Click to upload'}
                    </span>
                  </label>
                  {uploading && <Loader2 className="w-6 h-6 animate-spin mx-auto mt-2" />}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gallery */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Image Gallery</CardTitle>
                <CardDescription>Your uploaded media assets.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
                ) : (
                  assets.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {assets.map(asset => (
                        <div key={asset.id} className="group relative border rounded-lg overflow-hidden">
                          <img
                            src={asset.file_url}
                            alt={asset.alt_text || asset.name}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex flex-col justify-end p-2">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleCopyUrl(asset.file_url)}
                              >
                                {copiedUrl === asset.file_url ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDelete(asset.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No images</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by uploading an image.</p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}