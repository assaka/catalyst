const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class LocalStorageService {
  constructor() {
    this.baseUploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  }

  /**
   * Ensure upload directory exists
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Upload image to local storage
   */
  async uploadImage(file, options = {}) {
    try {
      console.log('Starting local image upload');
      console.log('File info:', {
        name: file.originalname || file.name,
        size: file.size,
        type: file.mimetype
      });

      // Generate unique filename
      const fileExt = path.extname(file.originalname || file.name || '');
      const fileName = `${uuidv4()}${fileExt}`;
      
      // Determine folder structure
      const folder = options.folder || 'general';
      const uploadDir = path.join(this.baseUploadDir, folder);
      
      // Ensure directory exists
      await this.ensureDirectoryExists(uploadDir);
      
      // Full file path
      const filePath = path.join(uploadDir, fileName);
      const relativePath = `${folder}/${fileName}`;

      console.log('Upload details:', {
        uploadDir,
        fileName,
        filePath
      });

      // Write file to disk
      await fs.writeFile(filePath, file.buffer || file);

      console.log('Upload successful to local storage');

      // Construct public URL
      const publicUrl = `${this.baseUrl}/uploads/${relativePath}`;

      return {
        success: true,
        url: publicUrl,
        publicUrl: publicUrl,
        path: relativePath,
        filename: fileName,
        size: file.size,
        mimetype: file.mimetype,
        provider: 'local',
        fullPath: filePath
      };

    } catch (error) {
      console.error('Error uploading image to local storage:', error);
      throw new Error('Failed to upload image to local storage: ' + error.message);
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(files, options = {}) {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, options));
      const results = await Promise.allSettled(uploadPromises);

      const successful = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      const failed = results
        .filter(r => r.status === 'rejected')
        .map((r, index) => ({
          file: files[index].originalname || files[index].name,
          error: r.reason.message
        }));

      return {
        success: true,
        uploaded: successful,
        failed,
        totalUploaded: successful.length,
        totalFailed: failed.length
      };
    } catch (error) {
      console.error('Error uploading multiple images to local storage:', error);
      throw new Error('Failed to upload images to local storage: ' + error.message);
    }
  }

  /**
   * Delete image from local storage
   */
  async deleteImage(imagePath) {
    try {
      const fullPath = path.join(this.baseUploadDir, imagePath);
      
      // Check if file exists
      try {
        await fs.access(fullPath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return { 
            success: true, 
            message: 'Image already deleted or does not exist' 
          };
        }
        throw error;
      }

      // Delete file
      await fs.unlink(fullPath);

      return { 
        success: true, 
        message: 'Image deleted successfully from local storage' 
      };
    } catch (error) {
      console.error('Error deleting image from local storage:', error);
      throw new Error('Failed to delete image from local storage: ' + error.message);
    }
  }

  /**
   * List images in a folder
   */
  async listImages(folder = 'general', options = {}) {
    try {
      const folderPath = path.join(this.baseUploadDir, folder);
      
      try {
        await fs.access(folderPath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return {
            success: true,
            files: [],
            total: 0
          };
        }
        throw error;
      }

      const files = await fs.readdir(folderPath);
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      
      // Filter image files and apply pagination
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const imageFiles = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return imageExtensions.includes(ext);
        })
        .slice(offset, offset + limit);

      const filesWithUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const filePath = path.join(folderPath, file);
          const stats = await fs.stat(filePath);
          
          const publicUrl = `${this.baseUrl}/uploads/${folder}/${file}`;
          
          return {
            name: file,
            fullPath: `${folder}/${file}`,
            publicUrl: publicUrl,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            isDirectory: stats.isDirectory()
          };
        })
      );

      // Sort by modification date (newest first)
      filesWithUrls.sort((a, b) => new Date(b.modified) - new Date(a.modified));

      return {
        success: true,
        files: filesWithUrls,
        total: filesWithUrls.length,
        hasMore: files.length > offset + limit
      };
    } catch (error) {
      console.error('Error listing images from local storage:', error);
      throw new Error('Failed to list images from local storage: ' + error.message);
    }
  }

  /**
   * Move image to different folder
   */
  async moveImage(fromPath, toPath) {
    try {
      const sourceFile = path.join(this.baseUploadDir, fromPath);
      const destFile = path.join(this.baseUploadDir, toPath);
      const destDir = path.dirname(destFile);
      
      // Ensure destination directory exists
      await this.ensureDirectoryExists(destDir);
      
      // Move file
      await fs.rename(sourceFile, destFile);

      const publicUrl = `${this.baseUrl}/uploads/${toPath}`;

      return {
        success: true,
        newPath: toPath,
        newUrl: publicUrl
      };
    } catch (error) {
      console.error('Error moving image in local storage:', error);
      throw new Error('Failed to move image in local storage: ' + error.message);
    }
  }

  /**
   * Copy image
   */
  async copyImage(fromPath, toPath) {
    try {
      const sourceFile = path.join(this.baseUploadDir, fromPath);
      const destFile = path.join(this.baseUploadDir, toPath);
      const destDir = path.dirname(destFile);
      
      // Ensure destination directory exists
      await this.ensureDirectoryExists(destDir);
      
      // Copy file
      await fs.copyFile(sourceFile, destFile);

      const publicUrl = `${this.baseUrl}/uploads/${toPath}`;

      return {
        success: true,
        copiedPath: toPath,
        copiedUrl: publicUrl
      };
    } catch (error) {
      console.error('Error copying image in local storage:', error);
      throw new Error('Failed to copy image in local storage: ' + error.message);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(folder = null) {
    try {
      const scanDir = folder ? path.join(this.baseUploadDir, folder) : this.baseUploadDir;
      
      // Recursively scan directory
      const stats = await this.scanDirectory(scanDir);

      return {
        success: true,
        provider: 'local',
        basePath: this.baseUploadDir,
        stats: {
          totalFiles: stats.fileCount,
          totalSize: stats.totalSize,
          totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
          totalSizeGB: (stats.totalSize / (1024 * 1024 * 1024)).toFixed(2),
          fileTypes: stats.fileTypes,
          directories: stats.directories
        }
      };
    } catch (error) {
      console.error('Error getting local storage stats:', error);
      throw new Error('Failed to get local storage statistics: ' + error.message);
    }
  }

  /**
   * Recursively scan directory for statistics
   */
  async scanDirectory(dirPath, stats = { fileCount: 0, totalSize: 0, fileTypes: {}, directories: 0 }) {
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const itemStats = await fs.stat(itemPath);
        
        if (itemStats.isDirectory()) {
          stats.directories++;
          await this.scanDirectory(itemPath, stats);
        } else {
          stats.fileCount++;
          stats.totalSize += itemStats.size;
          
          // Count by file extension
          const ext = path.extname(item).toLowerCase();
          const contentType = this.getContentTypeFromExtension(ext);
          stats.fileTypes[contentType] = (stats.fileTypes[contentType] || 0) + 1;
        }
      }
      
      return stats;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return stats;
      }
      throw error;
    }
  }

  /**
   * Get content type from file extension
   */
  getContentTypeFromExtension(ext) {
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain'
    };

    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Clean up old files (optional maintenance method)
   */
  async cleanupOldFiles(olderThanDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const cleanupStats = await this.cleanupDirectory(this.baseUploadDir, cutoffDate);
      
      return {
        success: true,
        message: `Cleanup completed`,
        deletedFiles: cleanupStats.deletedFiles,
        freedSpace: cleanupStats.freedSpace
      };
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw new Error('Failed to cleanup old files: ' + error.message);
    }
  }

  /**
   * Recursively cleanup old files in directory
   */
  async cleanupDirectory(dirPath, cutoffDate, stats = { deletedFiles: 0, freedSpace: 0 }) {
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const itemStats = await fs.stat(itemPath);
        
        if (itemStats.isDirectory()) {
          await this.cleanupDirectory(itemPath, cutoffDate, stats);
        } else if (itemStats.mtime < cutoffDate) {
          stats.freedSpace += itemStats.size;
          await fs.unlink(itemPath);
          stats.deletedFiles++;
        }
      }
      
      return stats;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return stats;
      }
      throw error;
    }
  }
}

module.exports = LocalStorageService;