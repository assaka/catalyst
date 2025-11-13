/**
 * JWT Utilities
 *
 * Handles JWT token generation and verification for authentication
 * Tokens contain: userId, storeId, email, role, accountType
 *
 * Security:
 * - Uses RS256 or HS256 algorithm
 * - Configurable expiration
 * - Includes issued at and expiration timestamps
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';

if (!JWT_SECRET) {
  console.warn(
    '⚠️  JWT_SECRET not set. Generate one with:\n' +
    'node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'base64\'))"'
  );
}

/**
 * Generate JWT access token
 *
 * @param {Object} user - User object
 * @param {string} user.id - User UUID
 * @param {string} user.email - User email
 * @param {string} user.role - User role (admin, store_owner)
 * @param {string} user.account_type - Account type (agency, individual)
 * @param {string} storeId - Store UUID
 * @param {Object} options - Additional options
 * @returns {string} JWT token
 */
function generateToken(user, storeId, options = {}) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  if (!user || !user.id || !user.email) {
    throw new Error('Invalid user object for token generation');
  }

  if (!storeId) {
    throw new Error('Store ID is required for token generation');
  }

  const payload = {
    // User identification
    userId: user.id,
    storeId: storeId,
    email: user.email,

    // User attributes
    role: user.role || 'store_owner',
    accountType: user.account_type || user.accountType || 'agency',

    // Optional fields
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,

    // Token metadata
    type: 'access',
    iat: Math.floor(Date.now() / 1000)
  };

  const tokenOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: options.expiresIn || JWT_EXPIRES_IN,
    issuer: 'catalyst-platform',
    audience: 'catalyst-api'
  };

  return jwt.sign(payload, JWT_SECRET, tokenOptions);
}

/**
 * Generate refresh token (longer expiration)
 *
 * @param {Object} user - User object
 * @param {string} storeId - Store UUID
 * @returns {string} Refresh token
 */
function generateRefreshToken(user, storeId) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const payload = {
    userId: user.id,
    storeId: storeId,
    email: user.email,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000)
  };

  const tokenOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: '30d', // Refresh tokens last longer
    issuer: 'catalyst-platform',
    audience: 'catalyst-api'
  };

  return jwt.sign(payload, JWT_SECRET, tokenOptions);
}

/**
 * Verify JWT token
 *
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
      issuer: 'catalyst-platform',
      audience: 'catalyst-api'
    });

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not yet valid');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Decode token without verification (for debugging)
 *
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload (unverified)
 */
function decodeToken(token) {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 *
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
function isTokenExpired(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch (error) {
    return true;
  }
}

/**
 * Extract token from Authorization header
 *
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return null;
  }

  const [scheme, token] = parts;

  if (scheme !== 'Bearer') {
    return null;
  }

  return token;
}

/**
 * Generate API key (for programmatic access)
 *
 * @param {string} prefix - Key prefix (e.g., 'sk' for secret key)
 * @returns {string} API key
 */
function generateApiKey(prefix = 'sk') {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${randomBytes}`;
}

/**
 * Hash API key for storage
 *
 * @param {string} apiKey - Plain API key
 * @returns {string} Hashed API key
 */
function hashApiKey(apiKey) {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

/**
 * Verify API key
 *
 * @param {string} apiKey - Plain API key
 * @param {string} hashedKey - Stored hashed key
 * @returns {boolean} True if match
 */
function verifyApiKey(apiKey, hashedKey) {
  const hash = hashApiKey(apiKey);
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hashedKey)
  );
}

/**
 * Generate token pair (access + refresh)
 *
 * @param {Object} user - User object
 * @param {string} storeId - Store UUID
 * @returns {Object} { accessToken, refreshToken }
 */
function generateTokenPair(user, storeId) {
  return {
    accessToken: generateToken(user, storeId),
    refreshToken: generateRefreshToken(user, storeId)
  };
}

/**
 * Refresh access token using refresh token
 *
 * @param {string} refreshToken - Refresh token
 * @returns {Object} { accessToken, refreshToken } New token pair
 */
function refreshAccessToken(refreshToken) {
  const decoded = verifyToken(refreshToken);

  if (decoded.type !== 'refresh') {
    throw new Error('Invalid refresh token type');
  }

  // Generate new access token with same user/store info
  const user = {
    id: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    account_type: decoded.accountType
  };

  return generateToken(user, decoded.storeId);
}

// Export functions
module.exports = {
  generateToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  decodeToken,
  isTokenExpired,
  extractTokenFromHeader,
  refreshAccessToken,
  generateApiKey,
  hashApiKey,
  verifyApiKey
};

// CLI usage for testing
if (require.main === module) {
  console.log('\n🔑 JWT Utilities Test\n');

  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    role: 'store_owner',
    account_type: 'agency'
  };

  const testStoreId = 'test-store-456';

  console.log('Generating token...');
  const token = generateToken(testUser, testStoreId);
  console.log('Token:', token.substring(0, 50) + '...\n');

  console.log('Verifying token...');
  const decoded = verifyToken(token);
  console.log('Decoded:', JSON.stringify(decoded, null, 2));

  console.log('\n✅ JWT utilities working correctly');
}
