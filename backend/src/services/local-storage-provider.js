const StorageInterface = require('./storage-interface');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Local File System Storage Provider implementing StorageInterface
 * Stores files on the local file system with organized directory structure
 */
class LocalStorageProvider extends StorageInterface {
  constructor() {
    super();
    this.baseUploadPath = path.join(process.cwd(), 'uploads');
    this.basePublicUrl = process.env.BACKEND_URL || process.env.BASE_URL || 'http://localhost:5000';
    this.initialized = false;
    
    // Ensure base upload directory exists on initialization
    this.initializeStorage();
  }
  
  /**
   * Initialize storage by ensuring base directory exists
   */
  async initializeStorage() {
    if (this.initialized) return;
    
    try {
      await this.ensureDirectoryExists(this.baseUploadPath);
      this.initialized = true;
      console.log(`📁 Local storage initialized at: ${this.baseUploadPath}`);
    } catch (error) {
      console.error(`Failed to initialize local storage at ${this.baseUploadPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Ensure upload directory exists
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Upload a single file
   */
  async uploadFile(storeId, file, options = {}) {
    try {
      const fileExt = path.extname(file.originalname || file.name || '');
      let fileName, filePath, relativePath;
      
      if (options.useOrganizedStructure) {
        // Use organized structure like supabase (first two characters)
        fileName = options.filename || file.originalname || `${uuidv4()}${fileExt}`;
        const organizedPath = this.generateOrganizedPath(fileName);
        
        // Determine base folder based on type
        let baseFolder = '';
        if (options.type === 'category') {
          baseFolder = 'categories';
        } else if (options.type === 'product') {
          baseFolder = 'products';
        } else if (options.type === 'asset') {
          baseFolder = 'assets';
        } else {
          baseFolder = options.folder || `store-${storeId}`;
        }
        
        relativePath = `${baseFolder}/${organizedPath}`;
        filePath = path.join(this.baseUploadPath, relativePath);
      } else {
        // Legacy path structure
        fileName = `${uuidv4()}${fileExt}`;
        const folder = options.folder || `store-${storeId}`;
        relativePath = `${folder}/${fileName}`;
        filePath = path.join(this.baseUploadPath, relativePath);
      }
      
      // Ensure directory exists
      await this.ensureDirectoryExists(path.dirname(filePath));
      
      // Write file to disk
      const fileBuffer = file.buffer || file;
      await fs.writeFile(filePath, fileBuffer);
      
      // Generate public URL
      const publicUrl = `${this.basePublicUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;
      
      return {
        success: true,
        url: publicUrl,
        publicUrl: publicUrl,
        path: relativePath,
        filename: fileName,
        size: file.size || fileBuffer.length,
        mimetype: file.mimetype || 'application/octet-stream'
      };
      
    } catch (error) {
      console.error('Local storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(storeId, filePath, bucket = null) {
    try {
      const fullPath = path.join(this.baseUploadPath, filePath);
      
      try {
        await fs.access(fullPath);
        await fs.unlink(fullPath);
        
        return {
          success: true,
          message: 'File deleted successfully'
        };
      } catch (error) {
        if (error.code === 'ENOENT') {
          return {
            success: true,
            message: 'File does not exist (already deleted)'
          };
        }
        throw error;
      }
    } catch (error) {
      console.error('Local storage delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(storeId, folder = null, options = {}) {
    try {
      const folderPath = folder || `store-${storeId}`;
      const fullPath = path.join(this.baseUploadPath, folderPath);
      
      try {
        await fs.access(fullPath);
      } catch (error) {
        // Directory doesn't exist
        return {
          success: true,
          files: [],
          total: 0
        };
      }
      
      const files = await fs.readdir(fullPath, { withFileTypes: true });
      const fileList = [];
      
      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(fullPath, file.name);
          const stats = await fs.stat(filePath);
          const relativePath = path.join(folderPath, file.name).replace(/\\/g, '/');
          
          fileList.push({
            name: file.name,
            fullPath: relativePath,
            publicUrl: `${this.basePublicUrl}/uploads/${relativePath}`,
            size: stats.size,
            created_at: stats.birthtime,
            updated_at: stats.mtime,
            metadata: {
              size: stats.size
            }
          });
        }
      }
      
      // Sort by creation time (newest first)
      fileList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Apply limit and offset
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      const paginatedFiles = fileList.slice(offset, offset + limit);
      
      return {
        success: true,
        files: paginatedFiles,
        total: fileList.length
      };
      
    } catch (error) {
      console.error('Local storage list error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Move a file to a different location
   */
  async moveFile(storeId, fromPath, toPath, bucket = null) {
    try {
      const fullFromPath = path.join(this.baseUploadPath, fromPath);
      const fullToPath = path.join(this.baseUploadPath, toPath);
      
      // Ensure destination directory exists
      await this.ensureDirectoryExists(path.dirname(fullToPath));
      
      // Move file
      await fs.rename(fullFromPath, fullToPath);
      
      const newUrl = `${this.basePublicUrl}/uploads/${toPath.replace(/\\/g, '/')}`;
      
      return {
        success: true,
        newPath: toPath,
        newUrl: newUrl
      };
      
    } catch (error) {
      console.error('Local storage move error:', error);
      throw new Error(`Failed to move file: ${error.message}`);
    }
  }

  /**
   * Copy a file
   */
  async copyFile(storeId, fromPath, toPath, bucket = null) {
    try {
      const fullFromPath = path.join(this.baseUploadPath, fromPath);
      const fullToPath = path.join(this.baseUploadPath, toPath);
      
      // Ensure destination directory exists
      await this.ensureDirectoryExists(path.dirname(fullToPath));
      
      // Copy file
      await fs.copyFile(fullFromPath, fullToPath);
      
      const copiedUrl = `${this.basePublicUrl}/uploads/${toPath.replace(/\\/g, '/')}`;
      
      return {
        success: true,
        copiedPath: toPath,
        copiedUrl: copiedUrl
      };
      
    } catch (error) {
      console.error('Local storage copy error:', error);
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(storeId) {
    try {
      const storeFolder = `store-${storeId}`;
      const storePath = path.join(this.baseUploadPath, storeFolder);
      
      let totalFiles = 0;
      let totalSize = 0;
      
      try {
        const files = await this.getDirectoryStats(storePath);
        totalFiles = files.count;
        totalSize = files.size;
      } catch (error) {
        // Directory doesn't exist or is empty
        console.log(`No files found for store ${storeId}`);
      }
      
      return {
        success: true,
        stats: [{
          bucket: 'local-storage',
          fileCount: totalFiles,
          totalSize: totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        }],
        summary: {
          totalFiles,
          totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
          totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2)
        }
      };
      
    } catch (error) {
      console.error('Local storage stats error:', error);
      throw new Error(`Failed to get storage statistics: ${error.message}`);
    }
  }

  /**
   * Get directory statistics recursively
   */
  async getDirectoryStats(dirPath) {
    let totalSize = 0;
    let fileCount = 0;
    
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          const subStats = await this.getDirectoryStats(itemPath);
          totalSize += subStats.size;
          fileCount += subStats.count;
        } else {
          const stats = await fs.stat(itemPath);
          totalSize += stats.size;
          fileCount++;
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be accessed
      return { size: 0, count: 0 };
    }
    
    return { size: totalSize, count: fileCount };
  }

  /**
   * Get signed/temporary URL (for local storage, just return the public URL)
   */
  async getSignedUrl(storeId, filePath, expiresIn = 3600, bucket = null) {
    // Local storage doesn't have "signed" URLs, just return the public URL
    const publicUrl = `${this.basePublicUrl}/uploads/${filePath.replace(/\\/g, '/')}`;
    
    return {
      success: true,
      signedUrl: publicUrl,
      publicUrl: publicUrl,
      expiresIn
    };
  }

  /**
   * Extract file path from local URL format
   */
  extractPathFromUrl(url) {
    if (url && url.includes('/uploads/')) {
      try {
        const urlObj = new URL(url);
        const uploadsIndex = urlObj.pathname.indexOf('/uploads/');
        if (uploadsIndex !== -1) {
          return urlObj.pathname.substring(uploadsIndex + '/uploads/'.length);
        }
      } catch (e) {
        console.warn('Failed to parse local URL:', url);
      }
    }
    return null;
  }

  /**
   * Get provider name
   */
  getProviderName() {
    return 'local';
  }

  /**
   * Test connection (local storage is always available if we can write to uploads dir)
   */
  async testConnection(storeId) {
    try {
      // Test by creating and deleting a test file
      const testPath = path.join(this.baseUploadPath, 'test');
      await this.ensureDirectoryExists(testPath);
      
      const testFile = path.join(testPath, 'connection-test.txt');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      
      return {
        success: true,
        message: 'Local storage is available and writable',
        provider: 'local',
        details: {
          uploadPath: this.baseUploadPath,
          baseUrl: this.basePublicUrl
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Local storage test failed: ${error.message}`,
        provider: 'local',
        error: error.message
      };
    }
  }
}

module.exports = LocalStorageProvider;