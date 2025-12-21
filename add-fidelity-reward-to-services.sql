
-- =====================================================
-- ADD FIDELITY REWARD COLUMN TO SERVICES TABLE
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- This will add the earns_fidelity_reward column to the services table

-- 1. Add earns_fidelity_reward column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS earns_fidelity_reward BOOLEAN DEFAULT true;

-- 2. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_services_earns_fidelity_reward ON services(earns_fidelity_reward);

-- 3. Update existing services to earn fidelity rewards by default
UPDATE services SET earns_fidelity_reward = true WHERE earns_fidelity_reward IS NULL;

-- 4. Add comment to the column
COMMENT ON COLUMN services.earns_fidelity_reward IS 'Whether completing this service earns the customer 1 fidelity credit';

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Now services can be configured to earn fidelity rewards
-- By default, all services earn 1 credit when completed
-- Admins can disable this per service in the Services management screen
-- =====================================================
