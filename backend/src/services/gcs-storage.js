const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class GCSStorageService {
  constructor() {
    this.bucketName = 'daino-product-images';
  }

  /**
   * Initialize GCS client with store configuration
   */
  getGCSClient(config) {
    if (!config || !config.config) {
      throw new Error('GCS configuration not found');
    }

    const gcsConfig = {
      projectId: config.config.projectId
    };

    // Support both service account file and key content
    if (config.config.keyFilename) {
      gcsConfig.keyFilename = config.config.keyFilename;
    } else if (config.config.keyFileContent) {
      // Parse JSON key content
      const credentials = typeof config.config.keyFileContent === 'string' 
        ? JSON.parse(config.config.keyFileContent)
        : config.config.keyFileContent;
      gcsConfig.credentials = credentials;
    } else {
      throw new Error('GCS credentials not configured');
    }

    return new Storage(gcsConfig);
  }

  /**
   * Ensure bucket exists
   */
  async ensureBucketExists(storage, bucketName, config) {
    try {
      const bucket = storage.bucket(bucketName);
      const [exists] = await bucket.exists();
      
      if (!exists) {
        console.log(`Creating GCS bucket: ${bucketName}`);
        await bucket.create({
          location: config.config.location || 'US',
          storageClass: config.config.storageClass || 'STANDARD'
        });
        
        // Make bucket public if specified
        if (config.config.publicRead) {
          await bucket.makePublic();
        }
      }
      
      return bucket;
    } catch (error) {
      console.error('Error ensuring GCS bucket exists:', error);
      throw error;
    }
  }

  /**
   * Upload image to Google Cloud Storage
   */
  async uploadImage(storeId, file, options = {}) {
    try {
      console.log('Starting GCS image upload for store:', storeId);
      console.log('File info:', {
        name: file.originalname || file.name,
        size: file.size,
        type: file.mimetype
      });

      const { config } = options;
      if (!config) {
        throw new Error('GCS configuration required');
      }

      const storage = this.getGCSClient(config);
      
      // Use custom bucket name if specified
      const bucketName = config.config.bucketName || this.bucketName;
      const bucket = await this.ensureBucketExists(storage, bucketName, config);

      // Generate unique filename
      const fileExt = path.extname(file.originalname || file.name || '');
      const fileName = `${uuidv4()}${fileExt}`;
      
      // Determine path based on options
      const folder = options.folder || `store-${storeId}`;
      const filePath = `${folder}/${fileName}`;

      console.log('Upload details:', {
        bucketName,
        filePath,
        fileName
      });

      // Create file reference
      const gcsFile = bucket.file(filePath);
      
      // Upload file
      const stream = gcsFile.createWriteStream({
        metadata: {
          contentType: file.mimetype || 'image/jpeg',
          cacheControl: 'public, max-age=3600',
        },
        resumable: false
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          console.error('GCS upload error:', error);
          reject(error);
        });

        stream.on('finish', async () => {
          try {
            console.log('Upload successful to GCS');

            // Make file public if specified
            if (config.config.publicRead) {
              await gcsFile.makePublic();
            }

            // Get public URL
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

            resolve({
              success: true,
              url: publicUrl,
              publicUrl: publicUrl,
              path: filePath,
              bucket: bucketName,
              size: file.size,
              mimetype: file.mimetype,
              filename: fileName,
              provider: 'gcs'
            });
          } catch (error) {
            reject(error);
          }
        });

        // Write file data to stream
        stream.end(file.buffer || file);
      });

    } catch (error) {
      console.error('Error uploading image to GCS:', error);
      throw new Error('Failed to upload image to GCS: ' + error.message);
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(storeId, files, options = {}) {
    try {
      const uploadPromises = files.map(file => this.uploadImage(storeId, file, options));
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
      console.error('Error uploading multiple images to GCS:', error);
      throw new Error('Failed to upload images to GCS: ' + error.message);
    }
  }

  /**
   * Delete image from Google Cloud Storage
   */
  async deleteImage(storeId, imagePath, config) {
    try {
      const storage = this.getGCSClient(config);
      const bucketName = config.config.bucketName || this.bucketName;
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(imagePath);

      await file.delete();

      return { 
        success: true, 
        message: 'Image deleted successfully from GCS' 
      };
    } catch (error) {
      console.error('Error deleting image from GCS:', error);
      throw new Error('Failed to delete image from GCS: ' + error.message);
    }
  }

  /**
   * List images in a folder
   */
  async listImages(storeId, folder = null, options = {}) {
    try {
      const { config } = options;
      const storage = this.getGCSClient(config);
      const bucketName = config.config.bucketName || this.bucketName;
      const bucket = storage.bucket(bucketName);
      
      const folderPath = folder || `store-${storeId}`;
      
      const [files] = await bucket.getFiles({
        prefix: folderPath,
        maxResults: options.limit || 100
      });

      const filesWithUrls = files.map(file => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;
        
        return {
          name: path.basename(file.name),
          fullPath: file.name,
          publicUrl: publicUrl,
          size: file.metadata.size,
          contentType: file.metadata.contentType,
          created: file.metadata.timeCreated,
          updated: file.metadata.updated
        };
      });

      return {
        success: true,
        files: filesWithUrls,
        total: filesWithUrls.length
      };
    } catch (error) {
      console.error('Error listing images from GCS:', error);
      throw new Error('Failed to list images from GCS: ' + error.message);
    }
  }

  /**
   * Move image to different folder
   */
  async moveImage(storeId, fromPath, toPath, config) {
    try {
      const storage = this.getGCSClient(config);
      const bucketName = config.config.bucketName || this.bucketName;
      const bucket = storage.bucket(bucketName);
      
      const sourceFile = bucket.file(fromPath);
      const destFile = bucket.file(toPath);
      
      await sourceFile.copy(destFile);
      await sourceFile.delete();

      const publicUrl = `https://storage.googleapis.com/${bucketName}/${toPath}`;

      return {
        success: true,
        newPath: toPath,
        newUrl: publicUrl
      };
    } catch (error) {
      console.error('Error moving image in GCS:', error);
      throw new Error('Failed to move image in GCS: ' + error.message);
    }
  }

  /**
   * Copy image
   */
  async copyImage(storeId, fromPath, toPath, config) {
    try {
      const storage = this.getGCSClient(config);
      const bucketName = config.config.bucketName || this.bucketName;
      const bucket = storage.bucket(bucketName);
      
      const sourceFile = bucket.file(fromPath);
      const destFile = bucket.file(toPath);
      
      await sourceFile.copy(destFile);

      const publicUrl = `https://storage.googleapis.com/${bucketName}/${toPath}`;

      return {
        success: true,
        copiedPath: toPath,
        copiedUrl: publicUrl
      };
    } catch (error) {
      console.error('Error copying image in GCS:', error);
      throw new Error('Failed to copy image in GCS: ' + error.message);
    }
  }

  /**
   * Get signed URL for temporary access
   */
  async getSignedUrl(storeId, filePath, expiresIn = 3600, config) {
    try {
      const storage = this.getGCSClient(config);
      const bucketName = config.config.bucketName || this.bucketName;
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filePath);

      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + (expiresIn * 1000)
      });

      return {
        success: true,
        signedUrl,
        expiresIn
      };
    } catch (error) {
      console.error('Error creating signed URL in GCS:', error);
      throw new Error('Failed to create signed URL in GCS: ' + error.message);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(storeId, config) {
    try {
      const storage = this.getGCSClient(config);
      const bucketName = config.config.bucketName || this.bucketName;
      const bucket = storage.bucket(bucketName);
      
      const [files] = await bucket.getFiles({
        prefix: `store-${storeId}`
      });

      let totalSize = 0;
      const fileTypes = {};
      
      files.forEach(file => {
        const size = parseInt(file.metadata.size) || 0;
        totalSize += size;
        
        const contentType = file.metadata.contentType || 'unknown';
        fileTypes[contentType] = (fileTypes[contentType] || 0) + 1;
      });

      return {
        success: true,
        provider: 'gcs',
        bucket: bucketName,
        stats: {
          totalFiles: files.length,
          totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
          totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
          fileTypes
        }
      };
    } catch (error) {
      console.error('Error getting GCS storage stats:', error);
      throw new Error('Failed to get GCS storage statistics: ' + error.message);
    }
  }
}

module.exports = GCSStorageService;