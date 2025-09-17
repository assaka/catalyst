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

  // Debug state changes
  useEffect(() => {
    console.log('🔍 FilePickerModal: State changed - loading:', loading);
  }, [loading]);

  useEffect(() => {
    console.log('🔍 FilePickerModal: State changed - error:', error);
  }, [error]);

  useEffect(() => {
    console.log('🔍 FilePickerModal: State changed - files count:', files.length);
  }, [files]);

  // Load files from File Library
  const loadFiles = async () => {
    console.log('🔍 FilePickerModal: loadFiles() called');
    console.log('🔍 FilePickerModal: Current state before loading:', { loading, error, filesCount: files.length });

    try {
      console.log('🔍 FilePickerModal: Setting loading to true');
      setLoading(true);
      setError(null);

      console.log('🔍 FilePickerModal: Making API call to /storage/list?folder=library');

      // Use direct fetch instead of problematic API client
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com';
      const response = await fetch(`${apiUrl}/api/storage/list?folder=library`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log('🔍 FilePickerModal: Response status:', response.status);

      if (!response.ok) {
        // Handle HTTP errors
        const errorData = await response.json();
        console.log('🔍 FilePickerModal: Error response data:', errorData);

        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      const responseData = await response.json();
      console.log('🔍 FilePickerModal: API Response data received:', responseData);
      console.log('🔍 FilePickerModal: Response data type:', typeof responseData);
      console.log('🔍 FilePickerModal: Response data keys:', responseData ? Object.keys(responseData) : 'null response');

      if (responseData && responseData.success && responseData.data) {
        console.log('🔍 FilePickerModal: Response has success=true and data');
        console.log('🔍 FilePickerModal: responseData.data:', responseData.data);
        const rawFiles = responseData.data.files || [];
        console.log('🔍 FilePickerModal: Raw files array:', rawFiles);
        console.log('🔍 FilePickerModal: Raw files count:', rawFiles.length);

        // Transform to consistent format
        const transformedFiles = rawFiles.map(file => ({
          id: file.id || file.name,
          name: file.name,
          url: file.url || file.signedUrl,
          mimeType: file.mimeType || file.contentType,
          size: file.size,
          lastModified: file.lastModified
        }));
        console.log('🔍 FilePickerModal: Transformed files:', transformedFiles);

        // Filter by file type if specified
        const filteredFiles = fileType === 'image'
          ? transformedFiles.filter(file => file.mimeType?.startsWith('image/'))
          : transformedFiles;
        console.log('🔍 FilePickerModal: Filtered files count:', filteredFiles.length);
        console.log('🔍 FilePickerModal: Setting files state with:', filteredFiles);

        setFiles(filteredFiles);
      } else if (responseData && responseData.success && responseData.data && responseData.data.files === undefined) {
        // Handle case where API returns success but no files structure
        console.log('🔍 FilePickerModal: Response success but no files property');
        setFiles([]);
      } else {
        // If response doesn't have expected structure, treat as no files
        console.log('🔍 FilePickerModal: Unexpected response structure');
        console.log('🔍 FilePickerModal: Full response object:', JSON.stringify(responseData, null, 2));
        setFiles([]);
        setError('Unable to load files. Please try again.');
      }
    } catch (error) {
      console.error('❌ FilePickerModal: Error caught in loadFiles:', error);
      console.log('❌ FilePickerModal: Error type:', error.constructor.name);
      console.log('❌ FilePickerModal: Error message:', error.message);
      console.log('❌ FilePickerModal: Error status:', error.status);
      console.log('❌ FilePickerModal: Error data:', error.data);
      console.log('❌ FilePickerModal: Full error object:', error);

      if (error.status === 401 ||
          error.message.includes('Access denied') ||
          error.message.includes('No token provided') ||
          error.message.includes('Authentication') ||
          error.message.includes('Unauthorized')) {
        console.log('❌ FilePickerModal: Detected as authentication error');
        setError('Please log in to access your files');
      } else if (error.message.includes('Network error') || error.message.includes('fetch')) {
        console.log('❌ FilePickerModal: Detected as network error');
        setError('Unable to connect to server. Please check your connection.');
      } else if (error.message.includes('No storage provider')) {
        console.log('❌ FilePickerModal: Detected as storage configuration error');
        setError('Storage not configured. Please contact administrator.');
      } else {
        console.log('❌ FilePickerModal: Generic error');
        setError(`Failed to load files: ${error.message || 'Please try again.'}`);
      }

      // Set empty files array so UI shows "no files" state instead of loading forever
      console.log('❌ FilePickerModal: Setting files to empty array');
      setFiles([]);
    } finally {
      console.log('🔍 FilePickerModal: Finally block - setting loading to false');
      setLoading(false);
      console.log('🔍 FilePickerModal: loadFiles() completed');
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
    console.log('🔍 FilePickerModal: useEffect triggered. isOpen:', isOpen);
    if (isOpen) {
      console.log('🔍 FilePickerModal: Modal is open, clearing errors and loading files');
      setError(null); // Clear any previous errors
      loadFiles();
    } else {
      console.log('🔍 FilePickerModal: Modal is closed, not loading files');
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
          {(() => {
            console.log('🔍 FilePickerModal: Rendering UI. State:', { loading, error, filesCount: files.length, filteredCount: filteredFiles.length });

            if (loading) {
              console.log('🔍 FilePickerModal: Showing loading state');
              return (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading files...</p>
                </div>
              );
            } else if (error) {
              console.log('🔍 FilePickerModal: Showing error state. Error:', error);
              return (
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
              );
            } else if (filteredFiles.length === 0) {
              console.log('🔍 FilePickerModal: Showing no files state');
              return (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No images found</p>
                  <p className="text-sm text-gray-400 mt-2">Upload some images to get started</p>
                </div>
              );
            } else {
              console.log('🔍 FilePickerModal: Showing files grid. Files:', filteredFiles);
              return (
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
              );
            }
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