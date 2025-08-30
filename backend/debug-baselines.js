const { sequelize } = require('./src/database/connection');

async function debugBaselines() {
  try {
    console.log('🔍 Debugging file_baselines table...');
    console.log('🔍 Baselines are now global (no store_id filtering)');
    
    // Check total count
    const [totalCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM file_baselines
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('📊 Total baselines in database:', totalCount[0].count);
    
    // Check for Cart.jsx specifically
    const cartBaselines = await sequelize.query(`
      SELECT file_path, version, created_at 
      FROM file_baselines 
      WHERE file_path LIKE '%Cart.jsx%'
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('📋 Cart.jsx baselines found:', cartBaselines.length);
    cartBaselines.forEach(baseline => {
      console.log('  -', baseline.file_path, '(version:', baseline.version + ')');
    });
    
    // Check for src/pages/Cart.jsx specifically
    const specificCart = await sequelize.query(`
      SELECT file_path, version, created_at, LENGTH(baseline_code) as code_length
      FROM file_baselines 
      WHERE file_path = 'src/pages/Cart.jsx'
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('📋 Exact match for "src/pages/Cart.jsx":', specificCart.length);
    specificCart.forEach(baseline => {
      console.log('  - Found:', baseline.file_path, 'code length:', baseline.code_length, 'chars');
    });
    
    // Show a sample of all baselines (global)
    const sampleBaselines = await sequelize.query(`
      SELECT file_path, version, created_at 
      FROM file_baselines 
      ORDER BY file_path 
      LIMIT 10
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('📋 Sample baselines (first 10):');
    sampleBaselines.forEach(baseline => {
      console.log('  -', baseline.file_path);
    });
    
    // Check if src/pages/Cart.jsx exists in the file system
    const fs = require('fs');
    const path = require('path');
    const cartPath = path.join(__dirname, '../src/pages/Cart.jsx');
    const cartExists = fs.existsSync(cartPath);
    console.log('📁 src/pages/Cart.jsx exists on filesystem:', cartExists);
    
    if (!cartExists) {
      // Try to find any Cart files
      const srcPagesDir = path.join(__dirname, '../src/pages');
      if (fs.existsSync(srcPagesDir)) {
        const files = fs.readdirSync(srcPagesDir);
        const cartFiles = files.filter(f => f.toLowerCase().includes('cart'));
        console.log('📁 Cart-related files in src/pages:', cartFiles);
      }
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error debugging baselines:', error);
    process.exit(1);
  }
}

debugBaselines();