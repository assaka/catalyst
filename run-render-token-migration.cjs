const { sequelize } = require('./backend/src/database/connection.js');
const fs = require('fs');

(async () => {
  try {
    console.log('🔧 Running RenderOAuthToken constraints migration...');
    
    const migrationPath = './backend/src/database/migrations/fix-render-oauth-tokens-constraints.sql';
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await sequelize.query(sql);
    
    console.log('✅ RenderOAuthToken constraints migration completed successfully!');
    
    // Verify the changes
    const [results] = await sequelize.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'render_oauth_tokens' 
      AND column_name IN ('expires_at', 'user_id')
      ORDER BY column_name;
    `);
    
    console.log('📋 Updated column constraints:');
    results.forEach(col => console.log(`  - ${col.column_name}: ${col.is_nullable === 'YES' ? 'NULLABLE' : 'NOT NULL'}`));
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await sequelize.close();
  }
})();