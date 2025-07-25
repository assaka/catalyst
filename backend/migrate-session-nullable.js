#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');
const Cart = require('./src/models/Cart');
const Wishlist = require('./src/models/Wishlist');

async function migrateSessions() {
  try {
    console.log('🚀 Starting session_id nullable migration...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified');
    
    // Sync the Cart model (alter existing table)
    console.log('🔄 Syncing Cart model...');
    await Cart.sync({ alter: true });
    console.log('✅ Cart table updated successfully!');
    
    // Sync the Wishlist model (alter existing table)
    console.log('🔄 Syncing Wishlist model...');
    await Wishlist.sync({ alter: true });
    console.log('✅ Wishlist table updated successfully!');
    
    // Test the tables
    const cartCount = await Cart.count();
    const wishlistCount = await Wishlist.count();
    console.log(`📊 Cart items: ${cartCount}, Wishlist items: ${wishlistCount}`);
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('❌ Error details:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateSessions();