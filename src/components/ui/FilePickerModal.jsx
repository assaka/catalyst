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
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'checking', 'connected', 'failed'

  console.log('🔵 FilePickerModal: Component rendered with props:', {
    isOpen,
    fileType,
    hasOnClose: !!onClose,
    hasOnSelect: !!onSelect
  });

  console.log('🔵 FilePickerModal: Current state:', {
    filesCount: files.length,
    loading,
    uploading,
    error,
    selectedFile: selectedFile?.name
  });


  // Load files from File Library
  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      setConnectionStatus('checking');

      console.log('🔍 FilePickerModal: Starting file load request...');
      console.log('🔐 FilePickerModal: Auth token present:', !!apiClient.getToken());
      console.log('🔐 FilePickerModal: User role:', apiClient.getCurrentUserRole());

      // Very aggressive timeout - 3 seconds max
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.log('⏰ FilePickerModal: Request timed out after 3 seconds');
          reject(new Error('Request timeout'));
        }, 3000);
      });

      // First test with a simple working endpoint like MediaStorage uses
      console.log('📡 FilePickerModal: Testing connection with /supabase/storage/stats');
      const startTime = Date.now();

      const responsePromise = apiClient.get('/supabase/storage/stats');
      const response = await Promise.race([responsePromise, timeoutPromise]);

      const duration = Date.now() - startTime;
      console.log(`✅ FilePickerModal: Response received in ${duration}ms:`, response);

      // Process successful response
      setConnectionStatus('connected');
      console.log('✅ FilePickerModal: Supabase connection successful');

      // For now, just show connection success - we'll implement file listing later
      setFiles([]);
      setError('✅ Supabase connected! File listing coming next.');
    } catch (error) {
      console.error('❌ FilePickerModal: Error loading files:', error);
      setConnectionStatus('failed');

      // Add test files while backend issue is resolved
      console.log('🧪 FilePickerModal: Connection failed, adding test files for development');
      const testFiles = [
        {
          id: 'test-1',
          name: 'test-product.png',
          url: 'https://jqqfjfoigtwdpnlicjmh.supabase.co/storage/v1/object/public/suprshop-assets/test-products/t/e/test-product.png',
          mimeType: 'image/png',
          size: 25000,
          lastModified: Date.now()
        }
      ];

      console.log('🧪 FilePickerModal: Created test files:', testFiles);
      setFiles(testFiles);
      setError('❌ Connection failed. Showing test image for development.');
      console.log('🧪 FilePickerModal: State updated with test files');
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
        console.log('✅ Upload successful:', response);

        // Clear error and show uploaded files immediately
        setError(null);

        // Create file objects from uploaded files for immediate display
        const uploadedFiles = Array.from(fileList).map((file, index) => ({
          id: `uploaded-${Date.now()}-${index}`,
          name: file.name,
          url: response.data?.files?.[index]?.url || URL.createObjectURL(file),
          mimeType: file.type,
          size: file.size,
          lastModified: file.lastModified || Date.now()
        }));

        setFiles(uploadedFiles);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed. Please try again.');
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
    console.log('🟡 FilePickerModal: useEffect triggered with isOpen:', isOpen);
    if (isOpen) {
      console.log('🟡 FilePickerModal: Modal is open, loading files...');
      setError(null); // Clear any previous errors
      loadFiles();
    }
  }, [isOpen]);

  console.log('🟢 FilePickerModal: About to render. isOpen:', isOpen);

  if (!isOpen) {
    console.log('🔴 FilePickerModal: Modal not open, returning null');
    return null;
  }

  console.log('🟢 FilePickerModal: Rendering modal with files:', files.length, 'loading:', loading, 'error:', error);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Select Image</h3>

            {/* Connection Status Badge */}
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
            console.log('🎨 FilePickerModal: Rendering files grid. loading:', loading, 'error:', error, 'filteredFiles.length:', filteredFiles.length);

            if (loading) {
              console.log('🔄 FilePickerModal: Showing loading state');
              return (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading files...</p>
                </div>
              );
            }

            if (error) {
              console.log('❌ FilePickerModal: Showing error state:', error);
              return (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto text-orange-300 mb-4 flex items-center justify-center">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-orange-600 font-medium">{error}</p>
                  <p className="text-sm text-gray-500 mt-2">Use the "Upload New" button above to add images</p>
                  <div className="flex gap-3 justify-center mt-4">
                    <Button
                      onClick={loadFiles}
                      variant="outline"
                      size="sm"
                      disabled={loading}
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
              );
            }

            if (filteredFiles.length === 0) {
              console.log('📭 FilePickerModal: No files to show');
              return (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No images found</p>
                  <p className="text-sm text-gray-400 mt-2">Upload some images to get started</p>
                </div>
              );
            }

            console.log('🖼️ FilePickerModal: Showing files grid with', filteredFiles.length, 'files');
            return (
              <div className="grid grid-cols-4 gap-4">
                {filteredFiles.map((file, index) => {
                  console.log(`🖼️ FilePickerModal: Rendering file ${index}:`, file);
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