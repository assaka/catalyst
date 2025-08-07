import React, { useState, useEffect, useRef } from 'react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  X,
  Image as ImageIcon,
  Star,
  RotateCcw,
  ExternalLink,
  Eye,
  Move,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileText,
  File,
  Archive
} from 'lucide-react';

const ProductImageUpload = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 10, 
  maxFileSizeMB = 10,
  allowedTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  showPreview = true,
  enableReordering = true,
  disabled = false,
  attributeType = 'image', // 'image' or 'file'
  fileSettings = null // Attribute file_settings from database
}) => {
  const { getSelectedStoreId } = useStoreSelection();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef();
  const dragCounter = useRef(0);

  // Determine actual file types and settings based on attribute type
  const getFileConfiguration = () => {
    // If fileSettings provided from attribute, use those
    if (fileSettings) {
      return {
        allowedTypes: fileSettings.allowed_extensions || allowedTypes,
        maxFileSizeMB: fileSettings.max_file_size || maxFileSizeMB,
        isImageType: attributeType === 'image'
      };
    }

    // Default configurations based on attribute type
    if (attributeType === 'file') {
      return {
        allowedTypes: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar'],
        maxFileSizeMB: maxFileSizeMB,
        isImageType: false
      };
    }

    // Default image configuration
    return {
      allowedTypes: allowedTypes,
      maxFileSizeMB: maxFileSizeMB,
      isImageType: true
    };
  };

  const fileConfig = getFileConfiguration();

  // Helper function to get file icon based on file type
  const getFileIcon = (filename, mimeType) => {
    const extension = filename?.split('.').pop()?.toLowerCase();
    
    // Image files
    if (fileConfig.isImageType || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return ImageIcon;
    }
    
    // Document files
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) {
      return FileText;
    }
    
    // Archive files
    if (['zip', 'rar', '7z'].includes(extension)) {
      return Archive;
    }
    
    // Default file icon
    return File;
  };

  // Helper function to check if file should show as image preview
  const isImageFile = (filename, mimeType) => {
    const extension = filename?.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension) || 
           (mimeType && mimeType.startsWith('image/'));
  };

  // Clear messages after some time
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const validateFile = (file) => {
    // Check file size
    if (file.size > fileConfig.maxFileSizeMB * 1024 * 1024) {
      throw new Error(`File size must be less than ${fileConfig.maxFileSizeMB}MB`);
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileConfig.allowedTypes.includes(fileExtension)) {
      throw new Error(`File type must be one of: ${fileConfig.allowedTypes.join(', ')}`);
    }

    // Check if we're at max files
    if (images.length >= maxImages) {
      throw new Error(`Maximum ${maxImages} ${fileConfig.isImageType ? 'images' : 'files'} allowed`);
    }
  };

  const uploadFile = async (file) => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      throw new Error('Store not selected');
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'products');
    formData.append('public', 'true');

    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'x-store-id': storeId
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return result;
  };

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;
    
    setError(null);
    setSuccess(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const filesToUpload = Array.from(files).slice(0, maxImages - images.length);
      const totalFiles = filesToUpload.length;
      const uploadedImages = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        try {
          validateFile(file);
          
          setUploadProgress(((i) / totalFiles) * 100);
          
          const result = await uploadFile(file);
          
          // Create image object with storage manager data
          const imageData = {
            id: result.data?.id || Date.now() + Math.random(),
            url: result.data?.publicUrl || result.data?.url,
            filename: result.data?.filename || file.name,
            path: result.data?.path,
            size: file.size,
            mimeType: file.type,
            alt: '',
            isPrimary: images.length === 0 && uploadedImages.length === 0, // First image is primary
            uploadedAt: new Date().toISOString(),
            bucket: result.data?.bucket,
            provider: result.provider
          };
          
          uploadedImages.push(imageData);
          
        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          setError(prev => prev ? `${prev}, ${fileError.message}` : fileError.message);
        }
      }

      if (uploadedImages.length > 0) {
        const newImages = [...images, ...uploadedImages];
        onImagesChange(newImages);
        const itemType = fileConfig.isImageType ? 'image' : 'file';
        setSuccess(`Successfully uploaded ${uploadedImages.length} ${itemType}${uploadedImages.length > 1 ? 's' : ''}`);
      }

      setUploadProgress(100);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (event) => {
    handleFileSelect(event.target.files);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    // If we removed the primary image, make the first remaining image primary
    if (newImages.length > 0 && images[index]?.isPrimary) {
      newImages[0].isPrimary = true;
    }
    onImagesChange(newImages);
    const itemType = fileConfig.isImageType ? 'Image' : 'File';
    setSuccess(`${itemType} removed`);
  };

  const setPrimaryImage = (index) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    onImagesChange(newImages);
    const itemType = fileConfig.isImageType ? 'image' : 'file';
    setSuccess(`Primary ${itemType} updated`);
  };

  const reorderImages = (fromIndex, toIndex) => {
    if (!enableReordering) return;
    
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  const updateImageAlt = (index, alt) => {
    const newImages = images.map((img, i) => 
      i === index ? { ...img, alt } : img
    );
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {fileConfig.isImageType ? (
              <ImageIcon className="w-5 h-5" />
            ) : (
              <File className="w-5 h-5" />
            )}
            Product {fileConfig.isImageType ? 'Images' : 'Files'}
            <Badge variant="secondary">{images.length}/{maxImages}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Messages */}
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Drag & Drop Area */}
          {images.length < maxImages && (
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              onDragEnter={!disabled ? handleDragEnter : undefined}
              onDragLeave={!disabled ? handleDragLeave : undefined}
              onDragOver={!disabled ? handleDragOver : undefined}
              onDrop={!disabled ? handleDrop : undefined}
              onClick={!disabled && !uploading ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              } : undefined}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={fileConfig.allowedTypes.map(type => `.${type}`).join(',')}
                onChange={handleFileInputChange}
                className="hidden"
                disabled={disabled || uploading}
              />
              
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-lg font-medium text-blue-700">
                    Uploading {fileConfig.isImageType ? 'images' : 'files'}...
                  </p>
                  <p className="text-sm text-gray-500">Please wait while we process your files</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drag & drop {fileConfig.isImageType ? 'images' : 'files'} here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {fileConfig.allowedTypes.map(type => type.toUpperCase()).join(', ')} files up to {fileConfig.maxFileSizeMB}MB each
                  </p>
                  <Button variant="outline" size="sm" disabled={disabled}>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Grid */}
      {images.length > 0 && showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Uploaded {fileConfig.isImageType ? 'Images' : 'Files'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image, index) => {
                const FileIcon = getFileIcon(image.filename, image.mimeType);
                const shouldShowImagePreview = isImageFile(image.filename, image.mimeType);
                
                return (
                <div key={image.id || index} className="group relative">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-blue-400 transition-colors">
                    {shouldShowImagePreview ? (
                      <img
                        src={image.url}
                        alt={image.alt || image.filename}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide broken image and show error icon
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100"><svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <FileIcon className="w-16 h-16 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-600 text-center truncate w-full">
                          {image.filename}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          {image.size ? (image.size / 1024 / 1024).toFixed(2) + ' MB' : ''}
                        </span>
                      </div>
                    )}
                    
                    {/* Primary Badge */}
                    {image.isPrimary && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Primary
                      </Badge>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!image.isPrimary && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => setPrimaryImage(index)}
                          title="Set as primary image"
                        >
                          <Star className="w-3 h-3" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={() => window.open(image.url, '_blank')}
                        title="View full size"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={() => removeImage(index)}
                        title="Remove image"
                        disabled={disabled}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Image Info */}
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Alt text (optional)"
                      value={image.alt || ''}
                      onChange={(e) => updateImageAlt(index, e.target.value)}
                      className="w-full text-xs px-2 py-1 border rounded"
                      disabled={disabled}
                    />
                    
                    <div className="text-xs text-gray-500">
                      <div className="truncate" title={image.filename}>
                        📁 {image.filename}
                      </div>
                      <div>
                        📊 {image.size ? (image.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            {fileConfig.isImageType ? (
              <ImageIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            ) : (
              <File className="w-5 h-5 text-blue-600 mt-0.5" />
            )}
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 mb-2">
                {fileConfig.isImageType ? 'Image' : 'File'} Guidelines
              </h4>
              <ul className="space-y-1 text-blue-700">
                {fileConfig.isImageType ? (
                  <>
                    <li>• Use high-quality images for best results</li>
                    <li>• The first image (or marked primary) will be the main product image</li>
                    <li>• Recommended aspect ratio: Square (1:1) or landscape (4:3)</li>
                    <li>• Images are automatically optimized for web delivery</li>
                  </>
                ) : (
                  <>
                    <li>• Supported file types: {fileConfig.allowedTypes.join(', ')}</li>
                    <li>• Maximum file size: {fileConfig.maxFileSizeMB}MB per file</li>
                    <li>• Files are stored securely and can be downloaded by customers</li>
                    <li>• Use descriptive filenames for better organization</li>
                  </>
                )}
                <li>• All files are stored securely in cloud storage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductImageUpload;