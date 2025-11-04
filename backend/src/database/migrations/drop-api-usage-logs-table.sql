-- Drop api_usage_logs table (obsolete - unused functionality)
-- This table was designed for detailed API logging but is never queried
-- and is redundant with platform logs (Vercel/Render) and usage_metrics table

DROP TABLE IF EXISTS api_usage_logs CASCADE;

-- Remove any related comments
COMMENT ON TABLE api_usage_logs IS NULL;
