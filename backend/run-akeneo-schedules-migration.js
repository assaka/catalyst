const { sequelize } = require('./src/database/connection');

async function runMigration() {
  try {
    console.log('🔄 Running Akeneo Schedules table migration...');
    
    // Create akeneo_schedules table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS akeneo_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE,
        import_type VARCHAR(20) NOT NULL CHECK (import_type IN ('attributes', 'families', 'categories', 'products', 'all')),
        schedule_type VARCHAR(20) NOT NULL DEFAULT 'once' CHECK (schedule_type IN ('once', 'daily', 'weekly', 'monthly')),
        schedule_time VARCHAR(50),
        schedule_date TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_run TIMESTAMP WITH TIME ZONE,
        next_run TIMESTAMP WITH TIME ZONE,
        filters JSONB NOT NULL DEFAULT '{}',
        options JSONB NOT NULL DEFAULT '{}',
        status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'running', 'completed', 'failed', 'paused')),
        last_result JSONB,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('✅ akeneo_schedules table created successfully');
    
    // Create indexes
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_akeneo_schedules_store_id ON akeneo_schedules(store_id);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_akeneo_schedules_next_run ON akeneo_schedules(next_run);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_akeneo_schedules_is_active ON akeneo_schedules(is_active);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_akeneo_schedules_status ON akeneo_schedules(status);');
    
    console.log('✅ Indexes created successfully');
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration();