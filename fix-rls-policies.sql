
-- Fix RLS policies for fidelity_redemptions table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own redemptions" ON fidelity_redemptions;
DROP POLICY IF EXISTS "Users can create their own redemptions" ON fidelity_redemptions;
DROP POLICY IF EXISTS "Admins can view all redemptions" ON fidelity_redemptions;
DROP POLICY IF EXISTS "Admins can update redemptions" ON fidelity_redemptions;

-- Create new policies
CREATE POLICY "Users can view their own redemptions"
  ON fidelity_redemptions
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can create their own redemptions"
  ON fidelity_redemptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update redemptions"
  ON fidelity_redemptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Ensure users table has proper policies for reading user profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON users;

CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can update all profiles"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );
