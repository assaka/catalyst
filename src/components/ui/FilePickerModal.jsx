import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image, File, Search, X } from 'lucide-react';
import apiClient from '@/api/client';
import { PageLoader } from '@/components/ui/page-loader';

const FilePickerModal = ({ isOpen, onClose, onSelect, fileType = 'image' }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'checking', 'connected', 'failed'

  // Validate service role key format and basic properties
  const validateServiceRoleKey = (token) => {
    if (!token) {
      return { valid: false, reason: 'No token provided' };
    }

    // Service role keys should be JWTs starting with 'eyJ'
    if (!token.startsWith('eyJ')) {
      return { valid: false, reason: 'Invalid token format - should start with "eyJ"' };
    }

    try {
      // Try to decode the JWT header and payload (without verification)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, reason: 'Invalid JWT format - should have 3 parts' };
      }

      // Decode header
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      // Check if it's a valid role for storage operations
      const validStorageRoles = ['service_role', 'store_owner', 'admin'];
      if (payload.role && !validStorageRoles.includes(payload.role)) {
        return { valid: false, reason: `Token role is "${payload.role}" - should be one of: ${validStorageRoles.join(', ')} for storage operations` };
      }

      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return { valid: false, reason: 'Token has expired' };
      }

      return { valid: true, payload };

    } catch (error) {
      return { valid: false, reason: `Invalid JWT format: ${error.message}` };
    }
  };

  // Load files from File Library
  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      setConnectionStatus('checking');

      const token = apiClient.getToken();

      // Validate the token format first
      if (token) {
        const validation = validateServiceRoleKey(token);

        if (!validation.valid) {
          throw new Error(`Invalid service role key: ${validation.reason}`);
        }
      }

      // Very aggressive timeout - 3 seconds max
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout'));
        }, 3000);
      });

      // First test with a simple working endpoint like MediaStorage uses
      const startTime = Date.now();

      const responsePromise = apiClient.get('/supabase/storage/stats');
      const response = await Promise.race([responsePromise, timeoutPromise]);

      const duration = Date.now() - startTime;

      // Process successful response
      setConnectionStatus('connected');

      // Now try to get actual files using the storage/list endpoint
      try {
        const filesResponse = await apiClient.get('/supabase/storage/list/suprshop-assets');

        // Check for authentication/authorization errors first
        if (!filesResponse.success) {
          // API returned error - throw to trigger error handling
          const errorMsg = filesResponse.message || filesResponse.error || 'Failed to list files';
          throw new Error(errorMsg);
        }

        if (filesResponse.success && filesResponse.files) {

          // Convert files to our format, using URLs from backend
          const formattedFiles = filesResponse.files.map(file => {
            const imageUrl = file.url || file.publicUrl || file.name;

            return {
              id: file.id || `file-${file.name}`,
              name: file.name,
              url: imageUrl, // Use backend-generated URLs
              mimeType: file.metadata?.mimetype || file.mimeType || 'application/octet-stream',
              size: file.metadata?.size || file.size || 0,
              lastModified: new Date(file.updated_at || file.created_at).getTime()
            };
          });

          // Filter to only show image files if fileType is 'image'
          const filteredFiles = fileType === 'image'
            ? formattedFiles.filter(file => file.mimeType.startsWith('image/'))
            : formattedFiles;

          setFiles(filteredFiles);
          setError(null);
        } else if (filesResponse.files && filesResponse.files.length === 0) {
          // Only show "no files" if we're sure authentication worked
          setFiles([]);
          setError('No files found in storage. Upload some images to get started.');
        } else {
          // Ambiguous response - could be auth issue
          throw new Error('Unable to access storage files - check your configuration');
        }
      } catch (filesError) {
        console.error('❌ FilePickerModal: Error fetching files:', filesError);

        // Parse error message to provide helpful feedback
        const errorMessage = filesError.message || 'Unknown error';
        const errorStatus = filesError.status;
        let userFriendlyError = '';


        // Check for token validation errors first
        if (errorMessage.includes('Invalid service role key')) {
          userFriendlyError = `🔑 Service Role Key Problem

${errorMessage.replace('Invalid service role key: ', '')}

**Common issues:**
• Using anon key instead of service_role key
• Key copied incorrectly (missing characters)
• Key has expired or been regenerated
• Wrong key format

**How to get the correct key:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings → API**
3. Copy the **service_role** key (not anon key)
4. Make sure to copy the entire key
5. Paste it in **Admin → Integrations → Supabase**

**Service role key format:** Should start with "eyJ" and be quite long.`;

        } else if (errorStatus === 401 || errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Access denied')) {
          userFriendlyError = `🔑 Invalid Service Role Key

Your Supabase service role key appears to be invalid or expired.

**This happens when:**
• Service role key is incorrect or mistyped
• Service role key has been regenerated in Supabase
• Using anon key instead of service role key
• Key doesn't have storage permissions

**How to fix:**
1. Go to **Admin → Integrations → Supabase**
2. Check your service role key is correct
3. Go to your Supabase project → Settings → API
4. Copy the **service_role** key (starts with 'eyJ...')
5. Paste the correct key in the integration settings
6. Save and test the connection

**Important:** Use the service_role key, not the anon key for storage operations.`;

        } else if (errorStatus === 403 || errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          userFriendlyError = `🚫 Storage Access Forbidden

Your service role key doesn't have permission to access storage.

**Possible causes:**
• Service role key lacks storage permissions
• Row Level Security (RLS) policies blocking access
• Bucket permissions not configured correctly

**How to fix:**
1. **Check Service Role Key:** Admin → Integrations → Supabase
2. **Verify Permissions:** Ensure service role key has storage admin rights
3. **Check RLS Policies:** Review bucket policies in Supabase dashboard
4. **Bucket Settings:** Ensure bucket allows your service role to list files

The service role key should have full storage permissions by default.`;

        } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
          userFriendlyError = `🔍 Storage Endpoint Not Found

The storage endpoint couldn't be found.

**Possible causes:**
• Supabase project URL is incorrect
• Storage API is not enabled
• Network connectivity issues

**How to fix:**
1. **Check Project URL:** Admin → Integrations → Supabase
2. **Verify URL Format:** Should be https://[project-id].supabase.co
3. **Test Connection:** Use the test button in integration settings
4. **Check Storage:** Ensure Storage is enabled in your Supabase project

Make sure your Supabase project URL is correct and storage is enabled.`;

        } else

        if (errorMessage.includes('Storage operations require API keys to be configured')) {
          userFriendlyError = `🔧 Storage Configuration Required

The Supabase storage system needs to be configured with API keys.

**How to fix this:**
1. Go to **Admin → Integrations → Supabase**
2. Make sure your Supabase project is connected
3. Ensure your service role key is properly configured
4. The service role key should have storage permissions

**What you need:**
• Supabase project URL
• Service role key (starts with 'eyJ...')

Once configured, file storage will work properly.`;

        } else if (errorMessage.includes('Service role key not available') || errorMessage.includes('admin permissions')) {
          userFriendlyError = `🔑 Admin Permissions Required

Your Supabase connection needs admin-level permissions for storage operations.

**How to fix this:**
1. Go to **Admin → Integrations → Supabase**
2. Click "Reconnect" or "Update Config"
3. Use a service role key (not anon key)
4. Service role key has full admin permissions

**Finding your service role key:**
• Go to your Supabase project dashboard
• Navigate to Settings → API
• Copy the "service_role" key (not "anon" key)
• Paste it in the Supabase integration settings

The service role key is needed for file upload/management operations.`;

        } else if (errorMessage.includes('bucket') || errorMessage.includes('suprshop-assets')) {
          userFriendlyError = `📦 Storage Bucket Issue

There's an issue with the storage bucket configuration.

**Checking bucket availability...**`;

          // Try to get more specific bucket information
          try {
            const bucketsResponse = await apiClient.get('/supabase/storage/buckets');

            if (bucketsResponse.success && bucketsResponse.buckets) {
              const assetsBucket = bucketsResponse.buckets.find(b => b.name === 'suprshop-assets');

              if (assetsBucket) {
                userFriendlyError = `📦 Bucket Found, Files Not Accessible

The 'suprshop-assets' bucket exists but files cannot be listed.

**Possible causes:**
• Row Level Security (RLS) policies too restrictive
• Service role key lacks storage permissions
• Bucket permissions not configured for your user role

**How to fix:**
1. Check bucket policies in Supabase dashboard
2. Ensure service role key has storage admin permissions
3. Verify RLS policies allow file listing

You can still try uploading new files.`;
              } else {
                const availableBuckets = bucketsResponse.buckets.map(b => b.name).join(', ');
                userFriendlyError = `📦 Bucket Not Found

The required 'suprshop-assets' storage bucket doesn't exist.

**Available buckets:** ${availableBuckets || 'None'}

**How to fix:**
1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a bucket named 'suprshop-assets'
4. Set it to public if you want public file access
5. Or ask an admin to create the bucket

Alternatively, you can upload files which may auto-create the bucket.`;
              }
            } else {
              throw new Error('Cannot access buckets');
            }
          } catch (bucketsError) {
            console.error('❌ FilePickerModal: Error with buckets fallback:', bucketsError);
            userFriendlyError = `🚫 Storage System Unavailable

Cannot access the Supabase storage system at all.

**Possible causes:**
• Supabase integration not configured
• API keys missing or invalid
• Network connectivity issues
• Service temporarily unavailable

**How to fix:**
1. **Check Supabase Integration:** Admin → Integrations → Supabase
2. **Verify API Keys:** Ensure project URL and service role key are set
3. **Test Connection:** Use the "Test Connection" button
4. **Check Network:** Ensure you can reach your Supabase project

Contact your admin if the integration needs to be set up.`;
          }
        } else {
          userFriendlyError = `❌ Storage Error

An unexpected error occurred: ${errorMessage}

**Try these steps:**
1. Refresh the page and try again
2. Check your internet connection
3. Verify Supabase integration in Admin → Integrations
4. Contact support if the issue persists

**Technical details:**
Endpoint: /supabase/storage/list/suprshop-assets
Error: ${errorMessage}`;
        }

        setFiles([]);
        setError(userFriendlyError);
      }
    } catch (error) {
      console.error('❌ FilePickerModal: Error loading files (outer catch):', error);
      setConnectionStatus('failed');

      // Check if this is an authentication error that should be handled properly
      const errorMessage = error.message || 'Unknown error';
      const errorStatus = error.status;

      if (errorStatus === 401 || errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Access denied') || errorMessage.includes('Invalid service role key')) {
        setFiles([]);
        setError(`🔑 Invalid Service Role Key

Your Supabase service role key appears to be invalid or expired.

**This happens when:**
• Service role key is incorrect or mistyped
• Service role key has been regenerated in Supabase
• Using anon key instead of service role key
• Key doesn't have storage permissions

**How to fix:**
1. Go to **Admin → Integrations → Supabase**
2. Check your service role key is correct
3. Go to your Supabase project → Settings → API
4. Copy the **service_role** key (starts with 'eyJ...')
5. Paste the correct key in the integration settings
6. Save and test the connection

**Important:** Use the service_role key, not the anon key for storage operations.`);
      } else {
        let detailedError = `🚫 Storage System Connection Failed

Unable to connect to the Supabase storage system.

**Error details:**
${errorMessage}

**This could be caused by:**
• Network connectivity issues
• Supabase project is down or suspended
• Invalid project URL configuration
• Firewall blocking requests to Supabase
• API rate limits exceeded
• Supabase storage service temporarily unavailable

**How to troubleshoot:**
1. **Check Project Status:** Go to your Supabase dashboard and verify project is active
2. **Test Network:** Try accessing your Supabase project directly in browser
3. **Verify Configuration:** Admin → Integrations → Supabase (check project URL)
4. **Check Logs:** Look for more specific errors in browser console
5. **Try Again:** Sometimes temporary network issues resolve themselves

**Need help?**
• Check Supabase status page: status.supabase.com
• Verify your project URL format: https://[project-id].supabase.co
• Contact support if the issue persists

**Technical details:**
Endpoint: /supabase/storage/stats
Error: ${errorMessage}`;

        setFiles([]);
        setError(detailedError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (fileList) => {
    // Convert FileList to array if needed
    const files = Array.from(fileList || []);
    if (!files.length) {
      return;
    }

    setUploading(true);

    try {
      const uploadedFiles = [];

      // Upload files one by one to Supabase storage
      for (const file of files) {

        // Validate file before creating FormData
        if (!file || !file.name || file.size === 0) {
          throw new Error(`Invalid file: ${file?.name || 'Unknown'}`);
        }

        const additionalData = {
          folder: 'library',
          public: 'true',
          type: 'general'
        };

        const response = await apiClient.uploadFile('/supabase/storage/upload', file, additionalData);

        if (response.success) {

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
        // Clear error and refresh file list
        setError(null);

        // Refresh the file list to show all files including newly uploaded ones
        await loadFiles();
      }

    } catch (error) {
      console.error('❌ FilePickerModal: Upload error:', error);

      // Parse upload error and provide helpful feedback
      const errorMessage = error.message || 'Unknown upload error';
      let uploadErrorMessage = '';

      if (errorMessage.includes('No file provided')) {
        uploadErrorMessage = `📁 File Upload Issue

The server didn't receive the file properly.

**This usually happens when:**
• File is too large (check size limits)
• File type not supported
• Network connection interrupted during upload

**Try these steps:**
1. Check file size (should be under 50MB)
2. Use supported file types (JPG, PNG, GIF, WebP)
3. Try a smaller file first
4. Check your internet connection`;

      } else if (errorMessage.includes('Storage operations require API keys')) {
        uploadErrorMessage = `🔧 Storage Not Configured

File uploads require Supabase storage to be properly configured.

**Setup required:**
1. Go to **Admin → Integrations → Supabase**
2. Configure your Supabase project connection
3. Add the service role key for storage permissions
4. Test the connection

**You need:**
• Supabase project URL
• Service role key (for uploads)

Contact your admin to set up storage integration.`;

      } else if (errorMessage.includes('Authentication') || errorMessage.includes('token') || errorMessage.includes('unauthorized')) {
        uploadErrorMessage = `🔑 Authentication Issue

You need to be logged in to upload files.

**Try these steps:**
1. Make sure you're logged into your account
2. Refresh the page if session expired
3. Check if you have upload permissions

If you're logged in and still see this error, contact support.`;

      } else if (errorMessage.includes('bucket') || errorMessage.includes('storage')) {
        uploadErrorMessage = `📦 Storage Bucket Issue

There's a problem with the storage bucket configuration.

**Possible causes:**
• Storage bucket doesn't exist
• Bucket permissions not set correctly
• Storage integration misconfigured

**How to fix:**
1. **Admin Setup:** Go to Admin → Integrations → Supabase
2. **Bucket Setup:** Ensure 'suprshop-assets' bucket exists
3. **Permissions:** Check bucket is configured for uploads

Contact your admin if you can't access integration settings.`;

      } else {
        uploadErrorMessage = `❌ Upload Failed

${errorMessage}

**Try these steps:**
1. Check your file is a valid image (JPG, PNG, GIF, WebP)
2. Ensure file size is reasonable (under 50MB)
3. Check your internet connection
4. Try refreshing the page
5. Contact support if problem persists

**File requirements:**
• Supported: JPG, PNG, GIF, WebP, SVG
• Max size: 50MB
• Valid file format`;
      }

      setError(uploadErrorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Filter files based on search term
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load files when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null); // Clear any previous errors
      loadFiles();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Select Image</h3>

            {/* Connection Status Badge */}
            {(() => {
              return (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  connectionStatus === 'connected'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : connectionStatus === 'failed'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-green-500'
                      : connectionStatus === 'failed'
                      ? 'bg-red-500'
                      : 'bg-yellow-500 animate-pulse'
                  }`}></div>
                  {connectionStatus === 'connected' && 'Connected'}
                  {connectionStatus === 'failed' && 'Failed'}
                  {connectionStatus === 'checking' && 'Checking...'}
                </div>
              );
            })()}
          </div>

          <Button onClick={onClose} variant="ghost" size="sm" className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Upload Section */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload-picker"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload-picker"
              className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload New'}
            </label>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
          </div>
        </div>

        {/* Files Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          {(() => {

            if (loading) {
              return <PageLoader size="lg" fullScreen={false} className="py-12" text="Loading files..." />;
            }

            if (error) {
              return (
                <div className="py-8 px-4">
                  <div className="max-w-lg mx-auto">
                    {/* Error Icon */}
                    <div className="w-16 h-16 mx-auto text-orange-400 mb-4 flex items-center justify-center">
                      <Upload className="w-8 h-8" />
                    </div>

                    {/* Error Message with proper formatting */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <div className="text-left space-y-2">
                        {error.split('\n').map((line, index) => {
                          // Handle different line types
                          if (line.startsWith('**') && line.endsWith('**')) {
                            // Bold headers
                            return (
                              <h4 key={index} className="font-semibold text-orange-800 mt-3 first:mt-0">
                                {line.replace(/\*\*/g, '')}
                              </h4>
                            );
                          } else if (line.startsWith('•')) {
                            // Bullet points
                            return (
                              <li key={index} className="text-orange-700 ml-4">
                                {line.substring(1).trim()}
                              </li>
                            );
                          } else if (line.match(/^\d+\./)) {
                            // Numbered lists
                            return (
                              <li key={index} className="text-orange-700 ml-4">
                                {line}
                              </li>
                            );
                          } else if (line.trim() === '') {
                            // Empty lines for spacing
                            return <div key={index} className="h-2"></div>;
                          } else {
                            // Regular text
                            return (
                              <p key={index} className="text-orange-700">
                                {line}
                              </p>
                            );
                          }
                        })}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={loadFiles}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className="border-orange-300 text-orange-600 hover:bg-orange-50"
                      >
                        {loading ? 'Retrying...' : 'Try Again'}
                      </Button>
                      <Button
                        onClick={() => document.getElementById('file-upload-picker').click()}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }

            if (filteredFiles.length === 0) {
              return (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No images found</p>
                  <p className="text-sm text-gray-400 mt-2">Upload some images to get started</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-4 gap-4">
                {filteredFiles.map((file, index) => {
                  return (
                <div
                  key={file.id}
                  className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedFile?.id === file.id
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'hover:shadow-lg border-gray-200'
                  }`}
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {file.mimeType?.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <File className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                  </div>
                </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {selectedFile ? `Selected: ${selectedFile.name}` : 'Select an image to continue'}
          </div>
          <div className="space-x-3">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedFile) {
                  onSelect(selectedFile);
                  onClose();
                }
              }}
              disabled={!selectedFile}
            >
              Select Image
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePickerModal;