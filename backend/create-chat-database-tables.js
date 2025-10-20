/**
 * Create database tables for Customer Service Chat plugin
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function createChatTables() {
  const client = await pool.connect();

  try {
    console.log('🏗️ Creating chat database tables...\n');

    // 1. chat_conversations table
    console.log('📊 Creating chat_conversations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID,
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'closed')),
        assigned_agent_id UUID,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_message_at TIMESTAMP,
        closed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ chat_conversations table created');

    // 2. chat_messages table
    console.log('📊 Creating chat_messages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
        message_text TEXT NOT NULL,
        sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system')),
        sender_id UUID,
        sender_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ chat_messages table created');

    // 3. chat_agents table
    console.log('📊 Creating chat_agents table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ chat_agents table created');

    // 4. chat_typing_indicators table
    console.log('📊 Creating chat_typing_indicators table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_typing_indicators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
        user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('customer', 'agent')),
        user_id UUID,
        is_typing BOOLEAN DEFAULT false,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ chat_typing_indicators table created');

    // Create indexes for better performance
    console.log('\n📊 Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_conversations_status ON chat_conversations(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_conversations_agent ON chat_conversations(assigned_agent_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON chat_messages(conversation_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_typing_conversation ON chat_typing_indicators(conversation_id)');
    console.log('✅ Indexes created');

    // Create a default agent for testing
    console.log('\n👤 Creating default support agent...');
    await client.query(`
      INSERT INTO chat_agents (id, name, email, status, avatar_url)
      VALUES (
        gen_random_uuid(),
        'Support Agent',
        'support@catalyst.com',
        'online',
        null
      )
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✅ Default agent created');

    console.log('\n' + '='.repeat(60));
    console.log('✅ All chat tables created successfully!');
    console.log('='.repeat(60));

    console.log('\n📋 Tables created:');
    console.log('  ✅ chat_conversations - Store customer conversations');
    console.log('  ✅ chat_messages - Store chat messages');
    console.log('  ✅ chat_agents - Store support agents');
    console.log('  ✅ chat_typing_indicators - Real-time typing status');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createChatTables()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
