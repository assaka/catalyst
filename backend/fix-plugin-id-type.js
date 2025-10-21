require('dotenv').config();
const { Sequelize } = require('sequelize');

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

async function fixPluginIdType() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    console.log('📝 Changing plugin_id column from UUID to TEXT...');

    // Step 1: Change the column type
    await sequelize.query(`
      ALTER TABLE admin_navigation_registry
      ALTER COLUMN plugin_id TYPE TEXT USING plugin_id::TEXT
    `);

    console.log('✅ Column type changed to TEXT');

    // Step 2: Verify the change
    const [result] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'admin_navigation_registry'
        AND column_name = 'plugin_id'
    `);

    console.log('\n📊 Column info after change:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPluginIdType();
