import React, { useState, useEffect, useCallback } from 'react';
import { MediaAsset } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import apiClient from '@/api/client';
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
  Info,
  File
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

export default function FileManager() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);

  useEffect(() => {
    console.log('📂 FileManager: useEffect triggered, selectedStore:', selectedStore);
    if (selectedStore) {
      console.log('📂 FileManager: Store selected, loading assets...');
      loadAssets();
    } else {
      console.log('📂 FileManager: No store selected, clearing assets');
      setAssets([]);
      setLoading(false);
    }
  }, [selectedStore]);

  // Listen for store changes
  useEffect(() => {
    console.log('📂 FileManager: Setting up store change listener');
    const handleStoreChange = () => {
      console.log('📂 FileManager: Store change detected');
      if (selectedStore) {
        console.log('📂 FileManager: Reloading assets after store change');
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
      setAssets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📂 FileManager: Loading files from Supabase storage...');

      // Add timeout protection like FilePickerModal
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      // Use the same API as FilePickerModal for consistency
      const responsePromise = apiClient.get('/supabase/storage/list/suprshop-assets');
      const filesResponse = await Promise.race([responsePromise, timeoutPromise]);

      console.log('📂 FileManager: Full API response:', filesResponse);

      if (!filesResponse.success) {
        throw new Error(filesResponse.message || 'Failed to load files');
      }

      if (filesResponse.success && filesResponse.files) {
        console.log('📂 FileManager: Found files:', filesResponse.files);

        // Convert files to asset format for compatibility
        const formattedAssets = filesResponse.files.map(file => {
          const imageUrl = file.url || file.publicUrl || file.name;
          console.log(`🖼️ FileManager: Processing file ${file.name}, URL: ${imageUrl}`);

          return {
            id: file.id || `file-${file.name}`,
            name: file.name,
            file_url: imageUrl, // Keep using file_url for compatibility with existing UI
            file_type: file.metadata?.mimetype || file.mimeType || 'application/octet-stream',
            file_size: file.metadata?.size || file.size || 0,
            alt_text: '',
            created_date: file.created_at || new Date().toISOString()
          };
        });

        setAssets(formattedAssets);
        console.log('✅ FileManager: Successfully loaded files:', formattedAssets.length);
      } else {
        setAssets([]);
      }
    } catch (error) {
      console.error('❌ FileManager: Error loading assets:', error);

      // Parse error message to provide helpful feedback (same as FilePickerModal)
      const errorMessage = error.message || 'Unknown error';
      let userFriendlyError = 'Failed to load images.';

      if (errorMessage.includes('Request timeout')) {
        userFriendlyError = 'Request timed out: Please check your connection and try again.';
      } else if (errorMessage.includes('Invalid service role key')) {
        userFriendlyError = 'Invalid service role key: Please check your Supabase integration settings.';
      } else if (errorMessage.includes('Storage operations require API keys')) {
        userFriendlyError = 'Storage not configured: Please configure Supabase integration in Admin → Integrations.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        userFriendlyError = 'Authentication failed: Please check your Supabase service role key.';
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        userFriendlyError = 'Access denied: Service role key lacks storage permissions.';
      } else if (errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
        userFriendlyError = 'Network error: Unable to connect to storage service.';
      } else {
        userFriendlyError = `Error loading files: ${errorMessage}`;
      }

      console.log('📂 FileManager: Setting error message:', userFriendlyError);
      setFlashMessage({ type: 'error', message: userFriendlyError });
      setAssets([]);
    } finally {
      console.log('📂 FileManager: Clearing loading state');
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    // Convert FileList to array if needed
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      console.log('📤 FileManager: No files to upload');
      return;
    }

    setUploading(true);
    setFlashMessage(null);
    console.log('📤 FileManager: Starting upload for', files.length, 'files:', files.map(f => f.name));

    try {
      const uploadedFiles = [];

      // Upload files one by one to Supabase storage (same as FilePickerModal)
      for (const file of files) {
        console.log('📤 FileManager: Uploading file:', {
          name: file.name,
          size: file.size,
          type: file.type
        });

        // Validate file before creating FormData
        if (!file || !file.name || file.size === 0) {
          throw new Error(`Invalid file: ${file?.name || 'Unknown'}`);
        }

        // Use apiClient's uploadFile method which handles auth and FormData properly
        console.log('📤 FileManager: Using apiClient.uploadFile with auth...');

        const additionalData = {
          folder: 'library',
          public: 'true',
          type: 'general'
        };

        console.log('📤 FileManager: Upload data:', { file: file.name, ...additionalData });

        const response = await apiClient.uploadFile('/supabase/storage/upload', file, additionalData);

        if (response.success) {
          console.log('✅ FileManager: Upload successful for', file.name, ':', response);

          // Add uploaded file to our list
          uploadedFiles.push({
            id: response.id || `uploaded-${Date.now()}-${uploadedFiles.length}`,
            name: response.filename || file.name,
            url: response.url || response.publicUrl,
            mimeType: file.type,
            size: file.size,
            lastModified: Date.now()
          });
        } else {
          throw new Error(`Upload failed for ${file.name}: ${response.message || 'Unknown error'}`);
        }
      }

      if (uploadedFiles.length > 0) {
        setFlashMessage({ type: 'success', message: `Successfully uploaded ${uploadedFiles.length} file(s)!` });
        console.log('📤 FileManager: All uploads successful, refreshing file list...');

        // Refresh the file list to show all files including newly uploaded ones
        await loadAssets();
      }

    } catch (error) {
      console.error('❌ FileManager: Upload error:', error);

      // Parse upload error and provide helpful feedback (same as FilePickerModal)
      const errorMessage = error.message || 'Unknown upload error';
      let uploadErrorMessage = 'File upload failed.';

      if (errorMessage.includes('No file provided')) {
        uploadErrorMessage = 'File upload issue: The server didn\'t receive the file properly. Try a smaller file or check your connection.';
      } else if (errorMessage.includes('Storage operations require API keys')) {
        uploadErrorMessage = 'Storage not configured: Please configure Supabase integration in Admin → Integrations.';
      } else if (errorMessage.includes('Invalid service role key')) {
        uploadErrorMessage = 'Invalid service role key: Please check your Supabase integration settings.';
      } else if (errorMessage.includes('File size exceeds')) {
        uploadErrorMessage = 'File too large: Please use a smaller file (under 50MB).';
      } else {
        uploadErrorMessage = `Upload failed: ${errorMessage}`;
      }

      setFlashMessage({ type: 'error', message: uploadErrorMessage });
    } finally {
      setUploading(false);
      // Clear the input so the same file can be uploaded again
      if (event.target) event.target.value = '';
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
            <h1 className="text-3xl font-bold text-gray-900">File Manager</h1>
            <p className="text-gray-600 mt-1">Upload and manage your media assets.</p>
          </div>
        </div>

        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-700" />
          <AlertTitle className="text-blue-800">Unified Cloud Storage</AlertTitle>
          <AlertDescription className="text-blue-700">
            Your images are uploaded using our unified storage system that supports multiple providers including Supabase, Google Cloud Storage, AWS S3, and local storage. The system automatically selects the best available provider based on your store configuration with intelligent fallback support.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Uploader */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Upload Images</CardTitle>
                <CardDescription>Select one or more images to upload to your store.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
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
                    <div className="grid grid-cols-4 gap-4">
                      {assets.map(asset => (
                        <div key={asset.id} className="border rounded-lg overflow-hidden hover:shadow-lg border-gray-200 transition-all">
                          <div className="aspect-square bg-gray-100 flex items-center justify-center relative group">
                            {asset.file_type?.startsWith('image/') ? (
                              <img
                                src={asset.file_url}
                                alt={asset.alt_text || asset.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <File className="w-8 h-8 text-gray-400" />
                            )}

                            {/* Hover overlay with actions */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center space-x-2">
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 bg-white hover:bg-gray-100"
                                  onClick={() => handleCopyUrl(asset.file_url)}
                                  title="Copy URL"
                                >
                                  {copiedUrl === asset.file_url ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDelete(asset.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="p-2">
                            <p className="text-sm font-medium truncate" title={asset.name}>{asset.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{(asset.file_size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No images</h3>
                      <p className="mt-1 text-sm text-gray-500">Upload some images to get started</p>
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