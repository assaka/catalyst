const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models'); // Master DB model for OAuth authentication
const { supabase } = require('../database/connection');
const jwt = require('jsonwebtoken');

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email']
    },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔍 Google OAuth profile received:', {
        id: profile.id,
        email: profile.emails[0]?.value,
        name: profile.name?.givenName + ' ' + profile.name?.familyName
      });

      // Extract user info from Google profile
      const googleUser = {
        email: profile.emails[0].value,
        first_name: profile.name.givenName,
        last_name: profile.name.familyName,
        avatar_url: profile.photos[0]?.value,
        google_id: profile.id
      };

      console.log('🔍 Looking for user with email:', googleUser.email);

      // Try to find user using Supabase client (fallback for Sequelize issues)
      let user;
      try {
        const { data: existingUser, error: findError } = await supabase
          .from('users')
          .select('*')
          .eq('email', googleUser.email)
          .single();

        if (findError && findError.code !== 'PGRST116') { // PGRST116 means no rows found
          throw findError;
        }

        if (existingUser) {
          // Update existing user
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              last_login: new Date().toISOString(),
              email_verified: true,
              avatar_url: googleUser.avatar_url,
              updated_at: new Date().toISOString()
            })
            .eq('email', googleUser.email)
            .select()
            .single();

          if (updateError) {
            throw updateError;
          }

          user = updatedUser;
          console.log('✅ Existing user logged in via Google OAuth:', user.email);
        } else {
          // Create new user
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
              email: googleUser.email,
              first_name: googleUser.first_name,
              last_name: googleUser.last_name,
              avatar_url: googleUser.avatar_url,
              email_verified: true,
              password: '$2b$10$' + Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
              role: 'store_owner',
              is_active: true
            }])
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          user = newUser;
          console.log('✅ New user created via Google OAuth:', user.email);
        }
      } catch (supabaseError) {
        console.error('❌ Supabase error, falling back to Sequelize:', supabaseError);
        
        // Fallback to Sequelize (original code)
        user = await User.findOne({ where: { email: googleUser.email } });
        
        if (!user) {
          user = await User.create({
            email: googleUser.email,
            first_name: googleUser.first_name,
            last_name: googleUser.last_name,
            avatar_url: googleUser.avatar_url,
            email_verified: true,
            password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
            role: 'store_owner',
            is_active: true
          });
          console.log('✅ New user created via Sequelize fallback:', user.email);
        } else {
          await user.update({
            last_login: new Date(),
            email_verified: true,
            avatar_url: googleUser.avatar_url
          });
          console.log('✅ Existing user logged in via Sequelize fallback:', user.email);
        }
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
} else {
  console.log('⚠️ Google OAuth not configured - missing environment variables');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    let user;
    
    // Try Supabase first
    try {
      const { data: supabaseUser, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, phone, avatar_url, is_active, email_verified, last_login, role, created_at, updated_at')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      user = supabaseUser;
    } catch (supabaseError) {
      console.error('❌ Supabase deserialize error, falling back to Sequelize:', supabaseError);
      
      // Fallback to Sequelize
      user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });
    }
    
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;