#!/usr/bin/env node

const { sequelize, supabase } = require('./src/database/connection');

async function checkSlotConfigurations() {
  try {
    console.log('🔍 Checking slot_configurations table status...');
    
    if (supabase) {
      console.log('✅ Using Supabase connection');
      
      // Check if table exists
      const { data, error } = await supabase
        .from('slot_configurations')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "slot_configurations" does not exist')) {
          console.log('❌ Table slot_configurations does not exist in Supabase');
          return { exists: false };
        } else {
          console.error('❌ Error checking table:', error);
          return { exists: false, error };
        }
      }
      
      console.log('✅ Table slot_configurations exists in Supabase');
      console.log(`📊 Record count: ${data.length > 0 ? data.length : 'Unknown (head request)'}`);
      
      // Get actual records to see structure
      const { data: records, error: recordsError } = await supabase
        .from('slot_configurations')
        .select('*')
        .limit(1);
      
      if (recordsError) {
        console.error('❌ Error fetching records:', recordsError);
      } else {
        console.log('📋 Sample record structure:', records.length > 0 ? Object.keys(records[0]) : 'No records');
        
        if (records.length > 0) {
          const record = records[0];
          
          // Check for versioning columns
          const versioningColumns = ['status', 'version_number', 'page_type', 'published_at', 'published_by', 'parent_version_id'];
          const hasVersioning = versioningColumns.every(col => col in record);
          
          console.log(`🔧 Has versioning columns: ${hasVersioning ? '✅ Yes' : '❌ No'}`);
          
          if (!hasVersioning) {
            console.log('🔧 Missing versioning columns:', versioningColumns.filter(col => !(col in record)));
          }
          
          return { 
            exists: true, 
            hasVersioning,
            missingColumns: versioningColumns.filter(col => !(col in record)),
            sampleRecord: record
          };
        }
      }
      
      return { exists: true, hasVersioning: false };
    } else {
      console.log('⚠️  No Supabase connection, checking with Sequelize...');
      
      await sequelize.authenticate();
      console.log('✅ Database connection verified');
      
      const queryInterface = sequelize.getQueryInterface();
      
      try {
        const tableDescription = await queryInterface.describeTable('slot_configurations');
        console.log('✅ Table slot_configurations exists');
        console.log('📋 Columns:', Object.keys(tableDescription));
        
        // Check for versioning columns
        const versioningColumns = ['status', 'version_number', 'page_type', 'published_at', 'published_by', 'parent_version_id'];
        const hasVersioning = versioningColumns.every(col => col in tableDescription);
        
        console.log(`🔧 Has versioning columns: ${hasVersioning ? '✅ Yes' : '❌ No'}`);
        
        if (!hasVersioning) {
          console.log('🔧 Missing versioning columns:', versioningColumns.filter(col => !(col in tableDescription)));
        }
        
        return { 
          exists: true, 
          hasVersioning,
          missingColumns: versioningColumns.filter(col => !(col in tableDescription)),
          columns: Object.keys(tableDescription)
        };
      } catch (error) {
        if (error.name === 'SequelizeDatabaseError' && error.message.includes('no such table')) {
          console.log('❌ Table slot_configurations does not exist');
          return { exists: false };
        }
        throw error;
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to check slot configurations:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkSlotConfigurations().then(result => {
    console.log('\n📋 Summary:', JSON.stringify(result, null, 2));
  });
}

module.exports = checkSlotConfigurations;