const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Generate JWT token without database
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '24h' }
  );
};

// @route   GET /api/oauth-test/google
// @desc    Test Google OAuth without database
// @access  Public
router.get('/google', (req, res) => {
  // Simulate OAuth redirect to Google
  const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL)}&` +
    `response_type=code&` +
    `scope=profile email&` +
    `state=test`;
  
  res.redirect(googleAuthUrl);
});

// @route   GET /api/oauth-test/callback
// @desc    Test OAuth callback without database
// @access  Public
router.get('/callback', (req, res) => {
  const { code, error } = req.query;
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  
  if (error) {
    return res.redirect(`${corsOrigin}/auth?error=oauth_failed`);
  }
  
  if (!code) {
    return res.redirect(`${corsOrigin}/auth?error=no_code`);
  }
  
  // Create a mock user (no database needed)
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    role: 'customer',
    first_name: 'Test',
    last_name: 'User'
  };
  
  try {
    const token = generateToken(mockUser);
    res.redirect(`${corsOrigin}/auth?token=${token}&oauth=success`);
  } catch (error) {
    console.error('Token generation error:', error);
    res.redirect(`${corsOrigin}/auth?error=token_generation_failed`);
  }
});

module.exports = router;