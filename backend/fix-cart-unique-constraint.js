// Fix Cart unique constraint - remove global unique on session_id, add composite unique
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function fixCartConstraint() {
  try {
    console.log('🔧 Fixing Cart table unique constraint...\n');

    // Step 1: Drop the old unique constraint on session_id
    console.log('1️⃣ Dropping old unique constraint on session_id...');
    await sequelize.query(`
      ALTER TABLE carts DROP CONSTRAINT IF EXISTS carts_session_id_key;
    `);
    console.log('✅ Old unique constraint dropped\n');

    // Step 2: Create composite unique index on (session_id, store_id)
    console.log('2️⃣ Creating composite unique index on (session_id, store_id)...');
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_session_store_cart
      ON carts (session_id, store_id);
    `);
    console.log('✅ Composite unique index created\n');

    // Step 3: Verify the changes
    console.log('3️⃣ Verifying constraints...');
    const [constraints] = await sequelize.query(`
      SELECT
        conname as constraint_name,
        pg_get_constraintdef(c.oid) as constraint_definition
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'carts'::regclass
      AND contype = 'u'
      ORDER BY conname;
    `);

    console.log('Current unique constraints on carts table:');
    console.table(constraints);

    const [indexes] = await sequelize.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'carts'
      AND indexdef LIKE '%UNIQUE%'
      ORDER BY indexname;
    `);

    console.log('\nCurrent unique indexes on carts table:');
    console.table(indexes);

    console.log('\n✅ Cart constraint fix completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

fixCartConstraint();
