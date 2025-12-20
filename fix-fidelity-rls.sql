
-- =====================================================
-- FIX FIDELITY RLS POLICIES
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to fix the RLS issues

-- 1. Fix RLS policies for fidelity_redemptions to allow users to insert
DROP POLICY IF EXISTS "Users can create their own redemptions" ON fidelity_redemptions;

CREATE POLICY "Users can create their own redemptions" ON fidelity_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 2. Allow users to update their own redemptions (for appointment linking)
DROP POLICY IF EXISTS "Users can update their own redemptions" ON fidelity_redemptions;

CREATE POLICY "Users can update their own redemptions" ON fidelity_redemptions
  FOR UPDATE USING (user_id = auth.uid());

-- 3. Fix RLS policies for fidelity_transactions to allow system inserts
DROP POLICY IF EXISTS "System can create transactions" ON fidelity_transactions;

CREATE POLICY "System can create transactions" ON fidelity_transactions
  FOR INSERT WITH CHECK (true);

-- 4. Ensure users table has proper RLS for fidelity_credits updates
DROP POLICY IF EXISTS "Users can update their own fidelity credits" ON users;

CREATE POLICY "Users can update their own fidelity credits" ON users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 5. Verify all policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('fidelity_redemptions', 'fidelity_transactions', 'users')
ORDER BY tablename, policyname;
