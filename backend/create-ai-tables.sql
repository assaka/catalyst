-- =====================================================
-- AI STUDIO TABLES
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- AI Usage Logs - Track all AI API calls
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id
ON ai_usage_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at
ON ai_usage_logs(created_at DESC);

-- Credit Transactions - Track credit usage
CREATE TABLE IF NOT EXISTS credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  operation_type VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for credit transactions
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id
ON credit_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at
ON credit_transactions(created_at DESC);

-- Verify tables were created
SELECT 'ai_usage_logs' as table_name, COUNT(*) as count FROM ai_usage_logs
UNION ALL
SELECT 'credit_transactions', COUNT(*) FROM credit_transactions;
