
-- Migration: Add earns_fidelity_reward column to services table
-- Run this SQL in your Supabase SQL Editor

-- Add the column if it doesn't exist
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS earns_fidelity_reward BOOLEAN DEFAULT true;

-- Update existing services to earn fidelity rewards by default
UPDATE services 
SET earns_fidelity_reward = true 
WHERE earns_fidelity_reward IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN services.earns_fidelity_reward IS 'Whether completing this service earns fidelity credits';
