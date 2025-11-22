-- ============================================
-- MASTER DATABASE - Jobs Tables Migration
-- ============================================
-- Run this on your MASTER Supabase database (rduywfunijdaqyhcyxpq)
-- This creates the jobs and job_history tables for the background job queue

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Jobs Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(255) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    payload JSONB DEFAULT '{}'::jsonb,
    result JSONB,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    progress_message TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    max_retries INTEGER DEFAULT 3,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    store_id UUID,
    user_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON public.jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_at ON public.jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_jobs_store_id ON public.jobs(store_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status_scheduled ON public.jobs(status, scheduled_at);

-- Add comment
COMMENT ON TABLE public.jobs IS 'Platform-level background job queue';

-- ============================================
-- Job History Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.job_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    result JSONB,
    error JSONB,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_job_history_job_id ON public.job_history(job_id);
CREATE INDEX IF NOT EXISTS idx_job_history_executed_at ON public.job_history(executed_at);

-- Add comment
COMMENT ON TABLE public.job_history IS 'History of job executions and retries';

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_history ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role full access
CREATE POLICY "Service role can manage jobs" ON public.jobs
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can manage job history" ON public.job_history
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Grant permissions
-- ============================================
GRANT ALL ON public.jobs TO postgres;
GRANT ALL ON public.job_history TO postgres;
GRANT ALL ON public.jobs TO service_role;
GRANT ALL ON public.job_history TO service_role;

-- ============================================
-- Success message
-- ============================================
SELECT 'Jobs tables created successfully!' as message;
