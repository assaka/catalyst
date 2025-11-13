/**
 * Encryption Utilities
 *
 * Provides AES-256-GCM encryption/decryption for sensitive data
 * Used primarily for encrypting tenant database credentials in master DB
 *
 * Security Features:
 * - AES-256-GCM (Galois/Counter Mode) for authenticated encryption
 * - Random IV (Initialization Vector) for each encryption
 * - Authentication tag to prevent tampering
 * - Key derivation from environment variable
 */

const crypto = require('crypto');

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;      // 16 bytes (128 bits) for AES
const TAG_LENGTH = 16;     // 16 bytes authentication tag
const KEY_LENGTH = 32;     // 32 bytes (256 bits) for AES-256

/**
 * Get or derive encryption key from environment
 * @returns {Buffer} 32-byte encryption key
 */
function getEncryptionKey() {
  const keyString = process.env.ENCRYPTION_KEY;

  if (!keyString) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
  }

  // Decode base64 key
  const key = Buffer.from(keyString, 'base64');

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (base64 encoded). ` +
      `Current key is ${key.length} bytes. ` +
      'Generate a new one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
  }

  return key;
}

/**
 * Encrypt data using AES-256-GCM
 *
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Encrypted data in format: iv:authTag:ciphertext (base64 encoded)
 *
 * @example
 * const encrypted = encrypt(JSON.stringify({ password: 'secret' }));
 * // Returns: "abc123:def456:ghi789" (base64 components)
 */
function encrypt(plaintext) {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty data');
  }

  try {
    const key = getEncryptionKey();

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:ciphertext (all base64 encoded)
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted
    ].join(':');

  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data encrypted with encrypt()
 *
 * @param {string} encryptedData - Encrypted data in format: iv:authTag:ciphertext
 * @returns {string} Decrypted plaintext
 *
 * @example
 * const plaintext = decrypt("abc123:def456:ghi789");
 * const credentials = JSON.parse(plaintext);
 */
function decrypt(encryptedData) {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty data');
  }

  try {
    const key = getEncryptionKey();

    // Parse encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format. Expected: iv:authTag:ciphertext');
    }

    const [ivBase64, authTagBase64, ciphertext] = parts;

    // Decode components
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;

  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data. Data may be corrupted or key is incorrect.');
  }
}

/**
 * Encrypt tenant database credentials for storage in master DB
 *
 * @param {Object} credentials - Database credentials object
 * @param {string} credentials.projectUrl - Supabase project URL
 * @param {string} credentials.serviceRoleKey - Supabase service role key
 * @param {string} credentials.anonKey - Supabase anon key
 * @param {string} credentials.connectionString - PostgreSQL connection string
 * @returns {string} Encrypted credentials string
 */
function encryptDatabaseCredentials(credentials) {
  if (!credentials || typeof credentials !== 'object') {
    throw new Error('Invalid credentials object');
  }

  // Validate required fields
  const requiredFields = ['projectUrl', 'serviceRoleKey'];
  for (const field of requiredFields) {
    if (!credentials[field]) {
      throw new Error(`Missing required credential field: ${field}`);
    }
  }

  return encrypt(JSON.stringify(credentials));
}

/**
 * Decrypt tenant database credentials from master DB
 *
 * @param {string} encryptedCredentials - Encrypted credentials string
 * @returns {Object} Decrypted credentials object
 */
function decryptDatabaseCredentials(encryptedCredentials) {
  const decrypted = decrypt(encryptedCredentials);
  return JSON.parse(decrypted);
}

/**
 * Generate a new encryption key (for initial setup)
 * Run: node -e "console.log(require('./backend/src/utils/encryption').generateKey())"
 *
 * @returns {string} Base64 encoded 32-byte key
 */
function generateKey() {
  const key = crypto.randomBytes(KEY_LENGTH);
  return key.toString('base64');
}

/**
 * Hash a string using SHA-256 (one-way, for integrity checks)
 *
 * @param {string} data - Data to hash
 * @returns {string} Hex encoded hash
 */
function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Compare a hash with data (constant-time comparison)
 *
 * @param {string} data - Original data
 * @param {string} hashToCompare - Hash to compare against
 * @returns {boolean} True if match
 */
function verifyHash(data, hashToCompare) {
  const dataHash = hash(data);
  return crypto.timingSafeEqual(
    Buffer.from(dataHash),
    Buffer.from(hashToCompare)
  );
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  encrypt,
  decrypt,
  encryptDatabaseCredentials,
  decryptDatabaseCredentials,
  generateKey,
  hash,
  verifyHash
};

// ============================================
// CLI USAGE
// ============================================

// If run directly, generate a new key
if (require.main === module) {
  console.log('\n🔐 Encryption Key Generator\n');
  console.log('Add this to your .env file:\n');
  console.log(`ENCRYPTION_KEY=${generateKey()}\n`);
  console.log('Keep this key secure and never commit it to git!');
}
