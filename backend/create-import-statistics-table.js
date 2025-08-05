const { sequelize } = require('./src/database/connection');
const { QueryTypes } = require('sequelize');

async function createImportStatisticsTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Check if table already exists
    const tableExists = await sequelize.getQueryInterface().showAllTables()
      .then(tables => tables.includes('import_statistics'));

    if (tableExists) {
      console.log('ℹ️  ImportStatistics table already exists');
      return;
    }

    console.log('🔨 Creating import_statistics table...');

    // Create the import_statistics table
    const createTableSQL = `
      CREATE TABLE import_statistics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        import_type VARCHAR(50) NOT NULL CHECK (import_type IN ('categories', 'attributes', 'families', 'products')),
        import_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        total_processed INTEGER NOT NULL DEFAULT 0,
        successful_imports INTEGER NOT NULL DEFAULT 0,
        failed_imports INTEGER NOT NULL DEFAULT 0,
        skipped_imports INTEGER NOT NULL DEFAULT 0,
        import_source VARCHAR(100) DEFAULT 'akeneo',
        import_method VARCHAR(50) DEFAULT 'manual' CHECK (import_method IN ('manual', 'scheduled', 'webhook')),
        error_details TEXT,
        processing_time_seconds INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sequelize.query(createTableSQL, { type: QueryTypes.RAW });
    console.log('✅ ImportStatistics table created successfully');

    // Create indexes for better performance
    const indexSQL = `
      CREATE INDEX idx_import_statistics_store_id ON import_statistics(store_id);
      CREATE INDEX idx_import_statistics_import_type ON import_statistics(import_type);
      CREATE INDEX idx_import_statistics_import_date ON import_statistics(import_date);
    `;

    await sequelize.query(indexSQL, { type: QueryTypes.RAW });
    console.log('✅ Indexes created successfully');

    // Verify table creation
    const tablesAfter = await sequelize.getQueryInterface().showAllTables();
    if (tablesAfter.includes('import_statistics')) {
      console.log('✅ ImportStatistics table verification successful');
    } else {
      console.log('❌ ImportStatistics table verification failed');
    }

  } catch (error) {
    console.error('❌ Error creating ImportStatistics table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
if (require.main === module) {
  createImportStatisticsTable()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createImportStatisticsTable;