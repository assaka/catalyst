// backend/src/database/migrations/20250127-create-ai-tracking-tables.js
const { sequelize } = require('../connection');

/**
 * Migration: Create AI tracking tables
 * - ai_usage_logs: Track all AI API calls
 * - credit_transactions: Track credit usage (if not exists)
 */

async function up() {
  console.log('Creating AI tracking tables...');

  // Create ai_usage_logs table
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ai_usage_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      operation_type VARCHAR(50) NOT NULL,
      model_used VARCHAR(100),
      tokens_input INTEGER DEFAULT 0,
      tokens_output INTEGER DEFAULT 0,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create index for faster queries
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id
    ON ai_usage_logs(user_id);
  `);

  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at
    ON ai_usage_logs(created_at DESC);
  `);

  // Create credit_transactions table if not exists
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      operation_type VARCHAR(50),
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create index for credit transactions
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id
    ON credit_transactions(user_id);
  `);

  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at
    ON credit_transactions(created_at DESC);
  `);

  console.log('✅ AI tracking tables created successfully');
}

async function down() {
  console.log('Dropping AI tracking tables...');

  await sequelize.query('DROP TABLE IF EXISTS ai_usage_logs CASCADE;');
  await sequelize.query('DROP TABLE IF EXISTS credit_transactions CASCADE;');

  console.log('✅ AI tracking tables dropped');
}

module.exports = { up, down };
