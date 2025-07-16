const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, LoginAttempt } = require('../models');
const passport = require('../config/passport');
const router = express.Router();

// Generate JWT token
const generateToken = (user, rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '24h');
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

// Password strength validator
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long`;
  }
  if (!hasUpperCase) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!hasLowerCase) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!hasNumber) {
    return 'Password must contain at least one number';
  }
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character';
  }
  return null;
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').custom(value => {
    const error = validatePasswordStrength(value);
    if (error) throw new Error(error);
    return true;
  }),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, first_name, last_name, phone, role = 'customer' } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone,
      role
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  body('rememberMe').optional().isBoolean().withMessage('Remember me must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, rememberMe } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check rate limiting
    const isRateLimited = await LoginAttempt.checkRateLimit(email, ipAddress);
    if (isRateLimited) {
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please try again later.'
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Log failed attempt
      await LoginAttempt.create({
        email,
        ip_address: ipAddress,
        success: false
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Log failed attempt
      await LoginAttempt.create({
        email,
        ip_address: ipAddress,
        success: false
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Log successful attempt
    await LoginAttempt.create({
      email,
      ip_address: ipAddress,
      success: true
    });

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate token with remember me option
    const token = generateToken(user, rememberMe);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
        expiresIn: rememberMe ? '30 days' : '24 hours'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', require('../middleware/auth'), async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    const corsOrigin = process.env.CORS_ORIGIN || 'https://catalyst-pearl.vercel.app';
    
    if (err) {
      console.error('OAuth authentication error:', err);
      
      // Handle database connection errors specifically
      if (err.message && err.message.includes('ENETUNREACH')) {
        return res.redirect(`${corsOrigin}/auth?error=database_connection_failed`);
      }
      
      return res.redirect(`${corsOrigin}/auth?error=oauth_failed`);
    }
    
    if (!user) {
      console.error('OAuth failed: No user returned');
      return res.redirect(`${corsOrigin}/auth?error=oauth_failed`);
    }
    
    try {
      const token = generateToken(user);
      res.redirect(`${corsOrigin}/auth?token=${token}&oauth=success`);
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      res.redirect(`${corsOrigin}/auth?error=token_generation_failed`);
    }
  })(req, res, next);
});

module.exports = router;