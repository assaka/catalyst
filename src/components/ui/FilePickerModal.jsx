import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image, File, Search, X } from 'lucide-react';
import apiClient from '@/api/client';

const FilePickerModal = ({ isOpen, onClose, onSelect, fileType = 'image' }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);


  // Load files from File Library
  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use apiClient like MediaStorage does - it handles authentication properly
      console.log('🔍 Making request using apiClient...');

      // Add timeout to handle hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Storage service timeout - this may indicate the storage provider is not properly configured')), 8000);
      });

      // Use the Supabase storage/list endpoint that MediaStorage uses successfully
      const responsePromise = apiClient.get('/supabase/storage/list?bucket=suprshop-assets&folder=library');
      const response = await Promise.race([responsePromise, timeoutPromise]);

      console.log('🔍 apiClient response received:', response);

      // apiClient returns the response directly, not wrapped in .data
      if (response && response.success && response.data) {
        const rawFiles = response.data.files || [];

        // Transform to consistent format
        const transformedFiles = rawFiles.map(file => ({
          id: file.id || file.name,
          name: file.name,
          url: file.url || file.signedUrl,
          mimeType: file.mimeType || file.contentType,
          size: file.size,
          lastModified: file.lastModified
        }));

        // Filter by file type if specified
        const filteredFiles = fileType === 'image'
          ? transformedFiles.filter(file => file.mimeType?.startsWith('image/'))
          : transformedFiles;

        setFiles(filteredFiles);
      } else if (response && response.success && response.data && response.data.files === undefined) {
        // Handle case where API returns success but no files structure
        setFiles([]);
      } else {
        // If response doesn't have expected structure, treat as no files
        setFiles([]);
        setError('Unable to load files. Please try again.');
      }
    } catch (error) {
      console.error('Error loading files:', error);

      if (error.status === 401 ||
          error.message.includes('Access denied') ||
          error.message.includes('No token provided') ||
          error.message.includes('Authentication') ||
          error.message.includes('Unauthorized')) {
        setError('Please log in to access your files');
      } else if (error.message.includes('Network error') || error.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your connection.');
      } else if (error.message.includes('No storage provider') ||
                 error.message.includes('Storage service timeout') ||
                 error.message.includes('storage provider is not properly configured')) {
        setError('Storage not configured. You can still upload files using the "Upload New" button below.');
      } else {
        setError(`Failed to load files: ${error.message || 'Please try again.'}`);
      }

      // Set empty files array so UI shows "no files" state instead of loading forever
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (fileList) => {
    if (!fileList.length) return;

    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(fileList).forEach(file => {
        formData.append('files', file);
      });
      formData.append('folder', 'library');

      const response = await apiClient.post('/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.success) {
        // Reload files to include newly uploaded ones
        await loadFiles();
      }
    } catch (error) {
      console.error('Upload error:', error);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold">Select Image</h3>
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
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading files...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto text-red-300 mb-4 flex items-center justify-center">
                <X className="w-8 h-8" />
              </div>
              <p className="text-red-500 font-medium">{error}</p>
              <p className="text-sm text-gray-400 mt-2">Please try uploading a new image below</p>
              <Button
                onClick={loadFiles}
                variant="outline"
                className="mt-4"
                disabled={loading}
              >
                {loading ? 'Retrying...' : 'Try Again'}
              </Button>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No images found</p>
              <p className="text-sm text-gray-400 mt-2">Upload some images to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
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
              ))}
            </div>
          )}
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