-- Migration: Add translations column to taxes table
-- This allows tax rules to support multilingual names and descriptions

ALTER TABLE public.taxes ADD COLUMN IF NOT EXISTS translations jsonb NULL DEFAULT '{}'::jsonb;
