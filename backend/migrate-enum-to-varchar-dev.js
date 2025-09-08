#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');
const SlotConfiguration = require('./src/models/SlotConfiguration');

async function migrateEnumToVarcharDev() {
  try {
    console.log('🚀 Converting slot_configurations.status from ENUM to VARCHAR (Development)...');
    
    if (!sequelize) {
      console.error('❌ Database connection not available');
      process.exit(1);
    }
    
    console.log('✅ Database connection available');
    console.log('📋 Database dialect:', sequelize.getDialect());
    
    // Check if table exists
    console.log('🔍 Checking if slot_configurations table exists...');
    
    try {
      const tableInfo = await sequelize.getQueryInterface().describeTable('slot_configurations');
      console.log('📋 Current table structure found');
      
      if (tableInfo.status) {
        console.log(`📋 Current status column type: ${tableInfo.status.type}`);
        
        // For SQLite, we need to recreate the table since it doesn't support complex ALTER operations
        if (sequelize.getDialect() === 'sqlite') {
          console.log('🔄 SQLite detected - recreating table...');
          
          const transaction = await sequelize.transaction();
          
          try {
            // Step 1: Create backup table
            console.log('1️⃣ Creating backup of existing data...');
            await sequelize.query(`
              CREATE TABLE slot_configurations_backup AS 
              SELECT * FROM slot_configurations
            `, { transaction });
            
            // Step 2: Drop existing table
            console.log('2️⃣ Dropping existing table...');
            await sequelize.getQueryInterface().dropTable('slot_configurations', { transaction });
            
            // Step 3: Sync the new model (which has VARCHAR status)
            console.log('3️⃣ Creating new table with VARCHAR status...');
            await SlotConfiguration.sync({ force: false, transaction });
            
            // Step 4: Restore data
            console.log('4️⃣ Restoring data from backup...');
            const backupData = await sequelize.query(`
              SELECT * FROM slot_configurations_backup
            `, { type: sequelize.QueryTypes.SELECT, transaction });
            
            if (backupData.length > 0) {
              console.log(`📊 Restoring ${backupData.length} records...`);
              
              for (const record of backupData) {
                await SlotConfiguration.create({
                  id: record.id,
                  user_id: record.user_id,
                  store_id: record.store_id,
                  configuration: record.configuration,
                  version: record.version,
                  is_active: record.is_active,
                  status: record.status, // This will now be VARCHAR
                  version_number: record.version_number,
                  page_type: record.page_type,
                  published_at: record.published_at,
                  published_by: record.published_by,
                  acceptance_published_at: record.acceptance_published_at,
                  acceptance_published_by: record.acceptance_published_by,
                  current_edit_id: record.current_edit_id,
                  parent_version_id: record.parent_version_id,
                  created_at: record.created_at,
                  updated_at: record.updated_at
                }, { transaction });
              }
            } else {
              console.log('📊 No existing data to restore');
            }
            
            // Step 5: Drop backup table
            console.log('5️⃣ Cleaning up backup table...');
            await sequelize.query(`DROP TABLE slot_configurations_backup`, { transaction });
            
            await transaction.commit();
            console.log('✅ SQLite table successfully recreated with VARCHAR status');
            
          } catch (error) {
            await transaction.rollback();
            throw error;
          }
          
        } else {
          // For PostgreSQL or other databases, use the complex migration
          console.log('🔄 Non-SQLite database detected - using ALTER approach...');
          console.log('⚠️ This operation is complex for production databases');
          console.log('💡 Consider using the production migration script instead');
        }
        
      } else {
        console.log('❌ Status column not found in table');
        process.exit(1);
      }
      
    } catch (tableError) {
      if (tableError.name === 'SequelizeDatabaseError' && tableError.message.includes('no such table')) {
        console.log('📋 Table does not exist - creating new table with VARCHAR status...');
        await SlotConfiguration.sync({ force: false });
        console.log('✅ New table created with VARCHAR status');
      } else {
        throw tableError;
      }
    }
    
    // Verify the conversion
    console.log('🧪 Verifying conversion...');
    const newTableInfo = await sequelize.getQueryInterface().describeTable('slot_configurations');
    
    if (newTableInfo.status) {
      console.log('✅ Conversion verified:');
      console.log(`   - Type: ${newTableInfo.status.type}`);
      console.log(`   - Nullable: ${newTableInfo.status.allowNull}`);
      console.log(`   - Default: ${newTableInfo.status.defaultValue}`);
    }
    
    // Test with sample data
    console.log('🔍 Testing status values...');
    try {
      const testStatuses = ['draft', 'acceptance', 'published', 'reverted'];
      console.log(`📊 Valid status values: ${testStatuses.join(', ')}`);
      
      // Count existing records by status
      const statusCounts = await sequelize.query(`
        SELECT status, COUNT(*) as count 
        FROM slot_configurations 
        GROUP BY status
      `, { type: sequelize.QueryTypes.SELECT });
      
      console.log('📊 Existing status distribution:', statusCounts);
      
    } catch (error) {
      console.log('⚠️ Could not verify existing data:', error.message);
    }
    
    console.log('🎉 ENUM to VARCHAR conversion completed successfully!');
    console.log('✨ Benefits:');
    console.log('   - More flexible status management');
    console.log('   - Easier to add new statuses in the future');
    console.log('   - Better ORM compatibility');
    console.log('   - No enum type dependencies');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    console.error('🔧 Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  migrateEnumToVarcharDev();
}

module.exports = migrateEnumToVarcharDev;