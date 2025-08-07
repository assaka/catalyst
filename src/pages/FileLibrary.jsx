import React, { useState, useEffect, useCallback } from 'react';
import { Upload, File, Image, FileText, Film, Music, Archive, Copy, Check, Trash2, Search, Grid, List, Download, Eye, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { api } from '../services/api';

const FileLibrary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [storageProvider, setStorageProvider] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // File type icons
  const getFileIcon = (mimeType) => {
    if (!mimeType) return <File className="w-8 h-8" />;
    
    if (mimeType.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Film className="w-8 h-8 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-8 h-8 text-pink-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) 
      return <Archive className="w-8 h-8 text-yellow-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Load files
  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/file-library');
      setFiles(response.data.files || []);
      setStorageProvider(response.data.storageProvider);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // Handle file upload
  const handleFileUpload = async (filesArray) => {
    if (!storageProvider) {
      toast({
        title: "Configuration Required",
        description: "Please configure a storage provider in Media Storage settings first",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    
    for (let file of filesArray) {
      formData.append('files', file);
    }

    try {
      const response = await api.post('/api/file-library/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast({
        title: "Success",
        description: `${response.data.uploadedFiles.length} file(s) uploaded successfully`
      });

      await loadFiles();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(Array.from(e.dataTransfer.files));
    }
  };

  // Copy URL to clipboard
  const copyToClipboard = async (url, fileId) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(fileId);
      toast({
        title: "Copied!",
        description: "File URL copied to clipboard"
      });
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive"
      });
    }
  };

  // Delete file
  const deleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.delete(`/api/file-library/${fileId}`);
      toast({
        title: "Success",
        description: "File deleted successfully"
      });
      await loadFiles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  // Filter files based on search
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.mimeType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">File Library</h1>
        <p className="text-gray-600">
          Upload and manage files for your store. Copy URLs to use in CMS blocks, pages, or anywhere else.
        </p>
        {storageProvider && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            Storage Provider: {storageProvider}
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div 
        className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 mb-2">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supports images, PDFs, documents, videos, and more
        </p>
        <input
          type="file"
          multiple
          onChange={(e) => handleFileUpload(Array.from(e.target.files))}
          className="hidden"
          id="file-upload"
          disabled={uploading || !storageProvider}
        />
        <label
          htmlFor="file-upload"
          className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ${
            (uploading || !storageProvider) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? 'Uploading...' : 'Select Files'}
        </label>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Files Display */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading files...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <File className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No files found</p>
          {!storageProvider && (
            <p className="text-sm text-gray-400 mt-2">
              Configure a storage provider in Media Storage settings to start uploading files
            </p>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles.map((file) => (
            <div key={file.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {/* Preview */}
              <div className="aspect-square bg-gray-100 flex items-center justify-center relative group">
                {file.mimeType?.startsWith('image/') ? (
                  <img 
                    src={file.url} 
                    alt={file.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  getFileIcon(file.mimeType)
                )}
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  {file.mimeType?.startsWith('image/') && (
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(file.url, file.id)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                    title="Copy URL"
                  >
                    {copiedUrl === file.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={file.url}
                    download={file.name}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              
              {/* File Info */}
              <div className="p-3">
                <p className="text-sm font-medium truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {file.mimeType?.startsWith('image/') ? (
                          <img className="h-10 w-10 rounded object-cover" src={file.url} alt={file.name} />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                            {React.cloneElement(getFileIcon(file.mimeType), { className: "w-5 h-5" })}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={file.name}>
                          {file.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{file.mimeType || 'Unknown'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{formatFileSize(file.size)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {file.mimeType?.startsWith('image/') && (
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(file.url, file.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Copy URL"
                      >
                        {copiedUrl === file.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a
                        href={file.url}
                        download={file.name}
                        className="text-gray-600 hover:text-gray-900"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={previewFile.url} 
              alt={previewFile.name}
              className="max-w-full max-h-[80vh] object-contain"
            />
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg p-4">
              <p className="font-medium mb-2">{previewFile.name}</p>
              <div className="flex items-center space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(previewFile.url, previewFile.id);
                  }}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy URL</span>
                </button>
                <code className="flex-1 px-3 py-1 bg-gray-100 rounded text-sm truncate">
                  {previewFile.url}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileLibrary;