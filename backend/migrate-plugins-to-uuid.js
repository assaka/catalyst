require('dotenv').config();
const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function migrateToUUIDs() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Step 1: Get all current plugins
    console.log('📋 Step 1: Getting current plugin_registry entries...');
    const [plugins] = await sequelize.query(`
      SELECT id, name FROM plugin_registry ORDER BY name
    `);

    console.log(`Found ${plugins.length} plugins to migrate:`);

    // Create a mapping of old ID to new UUID
    const idMapping = {};
    plugins.forEach(p => {
      const newUuid = uuidv4();
      idMapping[p.id] = newUuid;
      console.log(`  ${p.id} → ${newUuid} (${p.name})`);
    });

    // Step 2: Add new UUID column temporarily
    console.log('\n📝 Step 2: Adding temporary new_id column...');
    await sequelize.query(`
      ALTER TABLE plugin_registry ADD COLUMN IF NOT EXISTS new_id UUID
    `);

    // Step 3: Populate new UUIDs
    console.log('\n📝 Step 3: Populating new UUIDs...');
    for (const [oldId, newUuid] of Object.entries(idMapping)) {
      await sequelize.query(`
        UPDATE plugin_registry SET new_id = $1 WHERE id = $2
      `, {
        bind: [newUuid, oldId],
        type: sequelize.QueryTypes.UPDATE
      });
      console.log(`  Updated: ${oldId} → ${newUuid}`);
    }

    // Step 4: Drop old primary key constraint and column
    console.log('\n📝 Step 4: Dropping old id column...');
    await sequelize.query(`
      ALTER TABLE plugin_registry DROP CONSTRAINT IF EXISTS plugin_registry_pkey CASCADE
    `);
    await sequelize.query(`
      ALTER TABLE plugin_registry DROP COLUMN id
    `);

    // Step 5: Rename new_id to id and make it primary key
    console.log('\n📝 Step 5: Renaming new_id to id and setting as primary key...');
    await sequelize.query(`
      ALTER TABLE plugin_registry RENAME COLUMN new_id TO id
    `);
    await sequelize.query(`
      ALTER TABLE plugin_registry ADD PRIMARY KEY (id)
    `);

    // Step 6: Revert admin_navigation_registry.plugin_id back to UUID
    console.log('\n📝 Step 6: Converting admin_navigation_registry.plugin_id back to UUID...');

    // First, clear any existing plugin entries (they'll be recreated on next save)
    await sequelize.query(`
      DELETE FROM admin_navigation_registry WHERE is_core = false
    `);
    console.log('  Cleared plugin entries from admin_navigation_registry');

    // Then convert column back to UUID
    await sequelize.query(`
      ALTER TABLE admin_navigation_registry
      ALTER COLUMN plugin_id TYPE UUID USING plugin_id::UUID
    `);
    console.log('  Converted plugin_id column back to UUID');

    // Step 7: Verify
    console.log('\n✅ Step 7: Verifying migration...');
    const [newPlugins] = await sequelize.query(`
      SELECT id, name FROM plugin_registry ORDER BY name
    `);
    console.log(`\nPlugin IDs after migration:`);
    newPlugins.forEach(p => {
      console.log(`  ✅ ${p.id} - ${p.name}`);
    });

    // Show mapping for reference
    console.log('\n📊 Old ID → New UUID mapping:');
    console.log(JSON.stringify(idMapping, null, 2));

    console.log('\n✅ Migration complete!');
    console.log('\n⚠️  NOTE: Plugin navigation items will be recreated when you next save in Navigation Manager');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

migrateToUUIDs();
