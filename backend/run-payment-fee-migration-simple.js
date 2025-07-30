// Simple migration script using direct SQL
const { Client } = require('pg');

async function runMigration() {
  let client;
  
  try {
    console.log('🔄 Running payment fee migration (simple version)...');
    
    // Get database URL
    const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    
    if (!databaseUrl) {
      // Try to construct from individual components
      if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
        const constructedUrl = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE}`;
        console.log('📊 Constructed database URL from PG* environment variables');
        client = new Client({
          connectionString: constructedUrl,
          ssl: { rejectUnauthorized: false }
        });
      } else {
        console.error('❌ No database connection info found');
        console.log('Available env vars:', Object.keys(process.env).filter(key => 
          key.includes('DB') || key.includes('DATABASE') || key.includes('SUPABASE') || key.includes('PG')
        ));
        process.exit(1);
      }
    } else {
      console.log('📊 Using database URL from environment');
      client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
      });
    }
    
    // Connect
    await client.connect();
    console.log('✅ Connected to database');
    
    // Check if column exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name = 'payment_fee_amount';
    `;
    
    const result = await client.query(checkQuery);
    
    if (result.rows.length > 0) {
      console.log('ℹ️ payment_fee_amount column already exists');
    } else {
      // Add column
      const alterQuery = `
        ALTER TABLE orders 
        ADD COLUMN payment_fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;
      `;
      
      await client.query(alterQuery);
      console.log('✅ Added payment_fee_amount column to orders table');
    }
    
    // Close connection
    await client.end();
    console.log('✅ Migration completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
}

// Run the migration
runMigration();