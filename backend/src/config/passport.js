const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');
const jwt = require('jsonwebtoken');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Extract user info from Google profile
      const googleUser = {
        email: profile.emails[0].value,
        first_name: profile.name.givenName,
        last_name: profile.name.familyName,
        avatar_url: profile.photos[0]?.value,
        google_id: profile.id
      };

      // Try to find or create user
      let user = await User.findOne({ where: { email: googleUser.email } });
      
      if (!user) {
        // Create new user
        user = await User.create({
          email: googleUser.email,
          first_name: googleUser.first_name,
          last_name: googleUser.last_name,
          avatar_url: googleUser.avatar_url,
          email_verified: true,
          password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
          role: 'customer',
          is_active: true
        });
        console.log('✅ New user created via Google OAuth:', user.email);
      } else {
        // Update existing user
        await user.update({
          last_login: new Date(),
          email_verified: true,
          avatar_url: googleUser.avatar_url // Update avatar if changed
        });
        console.log('✅ Existing user logged in via Google OAuth:', user.email);
      }
      
      return done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth error:', error.message);
      
      // Handle different types of errors
      if (error.message.includes('ENETUNREACH') || error.message.includes('database')) {
        console.error('Database connection failed during OAuth');
        return done(new Error('Database connection failed'), null);
      }
      
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;