
-- =====================================================
-- FIDELITY PROGRAM DATABASE SETUP
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- This will create all necessary tables and policies for the fidelity program

-- 1. Create fidelity_rewards table
CREATE TABLE IF NOT EXISTS fidelity_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  credits_required INTEGER NOT NULL CHECK (credits_required > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create fidelity_redemptions table
CREATE TABLE IF NOT EXISTS fidelity_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES fidelity_rewards(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'used', 'cancelled')),
  credits_deducted INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create fidelity_transactions table
CREATE TABLE IF NOT EXISTS fidelity_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits_change INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'adjusted', 'expired')),
  reference_type TEXT,
  reference_id UUID,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add fidelity_credits column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS fidelity_credits INTEGER DEFAULT 0 NOT NULL;

-- 5. Add fidelity columns to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS fidelity_reward_id UUID REFERENCES fidelity_rewards(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS fidelity_redemption_id UUID REFERENCES fidelity_redemptions(id) ON DELETE SET NULL;

-- 6. Enable RLS on fidelity tables
ALTER TABLE fidelity_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE fidelity_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fidelity_transactions ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view active rewards" ON fidelity_rewards;
DROP POLICY IF EXISTS "Admins can manage rewards" ON fidelity_rewards;
DROP POLICY IF EXISTS "Users can view their own redemptions" ON fidelity_redemptions;
DROP POLICY IF EXISTS "Users can create their own redemptions" ON fidelity_redemptions;
DROP POLICY IF EXISTS "Admins can view all redemptions" ON fidelity_redemptions;
DROP POLICY IF EXISTS "Admins can update redemptions" ON fidelity_redemptions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON fidelity_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON fidelity_transactions;
DROP POLICY IF EXISTS "Admins can create transactions" ON fidelity_transactions;
DROP POLICY IF EXISTS "System can create transactions" ON fidelity_transactions;

-- 8. RLS Policies for fidelity_rewards
CREATE POLICY "Anyone can view active rewards" ON fidelity_rewards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage rewards" ON fidelity_rewards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 9. RLS Policies for fidelity_redemptions
CREATE POLICY "Users can view their own redemptions" ON fidelity_redemptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own redemptions" ON fidelity_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all redemptions" ON fidelity_redemptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update redemptions" ON fidelity_redemptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 10. RLS Policies for fidelity_transactions
CREATE POLICY "Users can view their own transactions" ON fidelity_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON fidelity_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can create transactions" ON fidelity_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "System can create transactions" ON fidelity_transactions
  FOR INSERT WITH CHECK (true);

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fidelity_redemptions_user_id ON fidelity_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_fidelity_redemptions_status ON fidelity_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_fidelity_transactions_user_id ON fidelity_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_fidelity_redemption_id ON appointments(fidelity_redemption_id);

-- 12. Insert default rewards
INSERT INTO fidelity_rewards (name, description, credits_required, is_active)
VALUES 
  ('Taglio Gratuito', 'Un taglio di capelli completamente gratuito', 10, true),
  ('Barba Gratuita', 'Una rasatura della barba gratuita', 5, true),
  ('Sconto 50%', 'Sconto del 50% sul prossimo servizio', 7, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- The fidelity program is now ready to use.
-- 
-- How it works:
-- 1. Customers earn 1 credit for each completed paid haircut
-- 2. Credits are added only after barber confirms the appointment
-- 3. Customers can redeem rewards when they have enough credits
-- 4. Barbers confirm redemptions at checkout
-- 5. Admins can view user credits and transaction history
-- =====================================================
