const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class S3StorageService {
  constructor() {
    this.defaultBucketName = 'daino-product-images';
  }

  /**
   * Initialize S3 client with store configuration
   */
  getS3Client(config) {
    if (!config || !config.config) {
      throw new Error('S3 configuration not found');
    }

    const s3Config = {
      accessKeyId: config.config.accessKeyId,
      secretAccessKey: config.config.secretAccessKey,
      region: config.config.region || 'us-east-1'
    };

    // Support custom endpoint for S3-compatible services
    if (config.config.endpoint) {
      s3Config.endpoint = config.config.endpoint;
      s3Config.s3ForcePathStyle = true;
    }

    return new AWS.S3(s3Config);
  }

  /**
   * Ensure bucket exists and is properly configured
   */
  async ensureBucketExists(s3, bucketName, config) {
    try {
      // Check if bucket exists
      await s3.headBucket({ Bucket: bucketName }).promise();
      console.log(`S3 bucket ${bucketName} exists`);
    } catch (error) {
      if (error.statusCode === 404) {
        console.log(`Creating S3 bucket: ${bucketName}`);
        
        const bucketParams = {
          Bucket: bucketName
        };

        // Add location constraint if not us-east-1
        if (config.config.region && config.config.region !== 'us-east-1') {
          bucketParams.CreateBucketConfiguration = {
            LocationConstraint: config.config.region
          };
        }

        await s3.createBucket(bucketParams).promise();

        // Set bucket policy for public read if specified
        if (config.config.publicRead) {
          const bucketPolicy = {
            Bucket: bucketName,
            Policy: JSON.stringify({
              Version: '2012-10-17',
              Statement: [{
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `arn:aws:s3:::${bucketName}/*`
              }]
            })
          };

          await s3.putBucketPolicy(bucketPolicy).promise();
        }

        // Set CORS configuration
        const corsParams = {
          Bucket: bucketName,
          CORSConfiguration: {
            CORSRules: [{
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
              AllowedOrigins: ['*'],
              MaxAgeSeconds: 3000
            }]
          }
        };

        await s3.putBucketCors(corsParams).promise();
      } else {
        throw error;
      }
    }
  }

  /**
   * Upload image to AWS S3
   */
  async uploadImage(storeId, file, options = {}) {
    try {
      console.log('Starting S3 image upload for store:', storeId);
      console.log('File info:', {
        name: file.originalname || file.name,
        size: file.size,
        type: file.mimetype
      });

      const { config } = options;
      if (!config) {
        throw new Error('S3 configuration required');
      }

      const s3 = this.getS3Client(config);
      
      // Use custom bucket name if specified
      const bucketName = config.config.bucketName || this.defaultBucketName;
      await this.ensureBucketExists(s3, bucketName, config);

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

      // Upload parameters
      const uploadParams = {
        Bucket: bucketName,
        Key: filePath,
        Body: file.buffer || file,
        ContentType: file.mimetype || 'image/jpeg',
        CacheControl: 'public, max-age=3600'
      };

      // Set ACL if public read is enabled
      if (config.config.publicRead) {
        uploadParams.ACL = 'public-read';
      }

      // Add metadata
      if (options.metadata) {
        uploadParams.Metadata = options.metadata;
      }

      // Upload file
      const result = await s3.upload(uploadParams).promise();
      console.log('Upload successful to S3:', result.Location);

      return {
        success: true,
        url: result.Location,
        publicUrl: result.Location,
        path: filePath,
        bucket: bucketName,
        size: file.size,
        mimetype: file.mimetype,
        filename: fileName,
        provider: 's3',
        etag: result.ETag
      };

    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw new Error('Failed to upload image to S3: ' + error.message);
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
      console.error('Error uploading multiple images to S3:', error);
      throw new Error('Failed to upload images to S3: ' + error.message);
    }
  }

  /**
   * Delete image from AWS S3
   */
  async deleteImage(storeId, imagePath, config) {
    try {
      const s3 = this.getS3Client(config);
      const bucketName = config.config.bucketName || this.defaultBucketName;

      const deleteParams = {
        Bucket: bucketName,
        Key: imagePath
      };

      await s3.deleteObject(deleteParams).promise();

      return { 
        success: true, 
        message: 'Image deleted successfully from S3' 
      };
    } catch (error) {
      console.error('Error deleting image from S3:', error);
      throw new Error('Failed to delete image from S3: ' + error.message);
    }
  }

  /**
   * List images in a folder
   */
  async listImages(storeId, folder = null, options = {}) {
    try {
      const { config } = options;
      const s3 = this.getS3Client(config);
      const bucketName = config.config.bucketName || this.defaultBucketName;
      
      const folderPath = folder || `store-${storeId}`;
      
      const listParams = {
        Bucket: bucketName,
        Prefix: folderPath,
        MaxKeys: options.limit || 100
      };

      if (options.continuationToken) {
        listParams.ContinuationToken = options.continuationToken;
      }

      const result = await s3.listObjectsV2(listParams).promise();

      const filesWithUrls = result.Contents.map(file => {
        const publicUrl = `https://${bucketName}.s3.${config.config.region || 'us-east-1'}.amazonaws.com/${file.Key}`;
        
        return {
          name: path.basename(file.Key),
          fullPath: file.Key,
          publicUrl: publicUrl,
          size: file.Size,
          lastModified: file.LastModified,
          etag: file.ETag.replace(/"/g, ''),
          storageClass: file.StorageClass
        };
      });

      return {
        success: true,
        files: filesWithUrls,
        total: filesWithUrls.length,
        isTruncated: result.IsTruncated,
        continuationToken: result.NextContinuationToken
      };
    } catch (error) {
      console.error('Error listing images from S3:', error);
      throw new Error('Failed to list images from S3: ' + error.message);
    }
  }

  /**
   * Move image to different folder
   */
  async moveImage(storeId, fromPath, toPath, config) {
    try {
      const s3 = this.getS3Client(config);
      const bucketName = config.config.bucketName || this.defaultBucketName;
      
      // Copy object to new location
      const copyParams = {
        Bucket: bucketName,
        CopySource: `${bucketName}/${fromPath}`,
        Key: toPath
      };

      await s3.copyObject(copyParams).promise();
      
      // Delete original object
      const deleteParams = {
        Bucket: bucketName,
        Key: fromPath
      };

      await s3.deleteObject(deleteParams).promise();

      const publicUrl = `https://${bucketName}.s3.${config.config.region || 'us-east-1'}.amazonaws.com/${toPath}`;

      return {
        success: true,
        newPath: toPath,
        newUrl: publicUrl
      };
    } catch (error) {
      console.error('Error moving image in S3:', error);
      throw new Error('Failed to move image in S3: ' + error.message);
    }
  }

  /**
   * Copy image
   */
  async copyImage(storeId, fromPath, toPath, config) {
    try {
      const s3 = this.getS3Client(config);
      const bucketName = config.config.bucketName || this.defaultBucketName;
      
      const copyParams = {
        Bucket: bucketName,
        CopySource: `${bucketName}/${fromPath}`,
        Key: toPath
      };

      await s3.copyObject(copyParams).promise();

      const publicUrl = `https://${bucketName}.s3.${config.config.region || 'us-east-1'}.amazonaws.com/${toPath}`;

      return {
        success: true,
        copiedPath: toPath,
        copiedUrl: publicUrl
      };
    } catch (error) {
      console.error('Error copying image in S3:', error);
      throw new Error('Failed to copy image in S3: ' + error.message);
    }
  }

  /**
   * Get signed URL for temporary access
   */
  async getSignedUrl(storeId, filePath, expiresIn = 3600, config) {
    try {
      const s3 = this.getS3Client(config);
      const bucketName = config.config.bucketName || this.defaultBucketName;

      const signedUrlParams = {
        Bucket: bucketName,
        Key: filePath,
        Expires: expiresIn
      };

      const signedUrl = s3.getSignedUrl('getObject', signedUrlParams);

      return {
        success: true,
        signedUrl,
        expiresIn
      };
    } catch (error) {
      console.error('Error creating signed URL in S3:', error);
      throw new Error('Failed to create signed URL in S3: ' + error.message);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(storeId, config) {
    try {
      const s3 = this.getS3Client(config);
      const bucketName = config.config.bucketName || this.defaultBucketName;
      
      const listParams = {
        Bucket: bucketName,
        Prefix: `store-${storeId}`
      };

      let allObjects = [];
      let continuationToken = null;

      // Get all objects (handle pagination)
      do {
        if (continuationToken) {
          listParams.ContinuationToken = continuationToken;
        }

        const result = await s3.listObjectsV2(listParams).promise();
        allObjects = allObjects.concat(result.Contents);
        continuationToken = result.NextContinuationToken;
      } while (continuationToken);

      let totalSize = 0;
      const fileTypes = {};
      const storageClasses = {};
      
      allObjects.forEach(obj => {
        totalSize += obj.Size;
        
        // Count by storage class
        const storageClass = obj.StorageClass || 'STANDARD';
        storageClasses[storageClass] = (storageClasses[storageClass] || 0) + 1;
        
        // Estimate content type from extension
        const ext = path.extname(obj.Key).toLowerCase();
        const contentType = this.getContentTypeFromExtension(ext);
        fileTypes[contentType] = (fileTypes[contentType] || 0) + 1;
      });

      return {
        success: true,
        provider: 's3',
        bucket: bucketName,
        stats: {
          totalFiles: allObjects.length,
          totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
          totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
          fileTypes,
          storageClasses
        }
      };
    } catch (error) {
      console.error('Error getting S3 storage stats:', error);
      throw new Error('Failed to get S3 storage statistics: ' + error.message);
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
}

module.exports = S3StorageService;