
# Supabase Setup Guide for Loyalty & Rewards System

## Prerequisites
- Supabase project created
- Database migrations applied
- Admin user created

## Step 1: Verify Database Tables

Check that these tables exist in your Supabase database:

### Core Tables (should already exist)
- `users` - with `loyalty_points` (integer) and `badges` (jsonb) columns
- `appointments`
- `orders`
- `services`

### New Tables (created by migration)
- `loyalty_rewards` - Stores admin-configured rewards
- `badge_rules` - Stores admin-configured badge rules
- `loyalty_transactions` - Logs all point changes
- `custom_notifications` - Stores custom notifications

## Step 2: Verify Database Functions

Run this query to check if functions exist:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name IN (
  'award_loyalty_points_on_completion',
  'check_and_award_badges'
);
```

Should return 2 rows.

## Step 3: Verify Database Triggers

Run this query to check if triggers exist:

```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN (
  'trigger_award_loyalty_points',
  'trigger_check_badges_on_completion'
);
```

Should return 2 rows.

## Step 4: Test Loyalty Points System

### Test 1: Manual Point Award
```sql
-- Create test appointment
INSERT INTO appointments (user_id, service, date, time, status, payment_mode, payment_status)
VALUES (
  'YOUR_TEST_USER_ID',
  'Haircut',
  CURRENT_DATE,
  '10:00',
  'booked',
  'pay_in_person',
  'pending'
)
RETURNING id;

-- Mark as completed (should trigger point award)
UPDATE appointments 
SET status = 'completed', payment_status = 'paid'
WHERE id = 'APPOINTMENT_ID_FROM_ABOVE';

-- Check points were awarded
SELECT loyalty_points FROM users WHERE id = 'YOUR_TEST_USER_ID';
-- Should show 1 point

-- Check transaction was logged
SELECT * FROM loyalty_transactions WHERE user_id = 'YOUR_TEST_USER_ID';
-- Should show 1 transaction with +1 points
```

### Test 2: Badge Award
```sql
-- Create a simple badge rule
INSERT INTO badge_rules (
  badge_name,
  badge_description,
  badge_icon,
  rule_type,
  rule_config,
  is_active
) VALUES (
  'First Visit',
  'Completed your first appointment',
  'star.fill',
  'visits_count',
  '{"required_visits": 1}'::jsonb,
  true
);

-- Complete an appointment (if not already done)
-- The trigger should automatically award the badge

-- Check badge was awarded
SELECT badges FROM users WHERE id = 'YOUR_TEST_USER_ID';
-- Should show array with badge object
```

## Step 5: Configure RLS Policies

### Loyalty Rewards Table
```sql
-- Enable RLS
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage loyalty rewards"
ON loyalty_rewards
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Customers can view active rewards
CREATE POLICY "Customers can view active rewards"
ON loyalty_rewards
FOR SELECT
TO authenticated
USING (is_active = true);
```

### Badge Rules Table
```sql
-- Enable RLS
ALTER TABLE badge_rules ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage badge rules"
ON badge_rules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Customers can view active badge rules
CREATE POLICY "Customers can view active badge rules"
ON badge_rules
FOR SELECT
TO authenticated
USING (is_active = true);
```

### Loyalty Transactions Table
```sql
-- Enable RLS
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
ON loyalty_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only system can insert (via triggers)
-- No policy needed for INSERT as it's done by triggers
```

### Custom Notifications Table
```sql
-- Enable RLS
ALTER TABLE custom_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can create notifications
CREATE POLICY "Admins can create notifications"
ON custom_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON custom_notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can mark notifications as read
CREATE POLICY "Users can update their own notifications"
ON custom_notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

## Step 6: Create Sample Data

### Sample Rewards
```sql
INSERT INTO loyalty_rewards (points_required, reward_type, reward_value, reward_description, is_active)
VALUES
  (5, 'discount_percentage', 10, 'Sconto 10% sul prossimo servizio', true),
  (10, 'free_service', 0, 'Taglio di capelli gratuito', true),
  (15, 'discount_euros', 5, 'Sconto di €5 su qualsiasi servizio', true),
  (20, 'custom', 0, 'Trattamento barba premium gratuito', true);
```

### Sample Badge Rules
```sql
INSERT INTO badge_rules (badge_name, badge_description, badge_icon, rule_type, rule_config, is_active)
VALUES
  ('Prima Visita', 'Hai completato il tuo primo appuntamento', 'star.fill', 'visits_count', '{"required_visits": 1}'::jsonb, true),
  ('Cliente Fedele', 'Hai completato 5 appuntamenti', 'star.circle.fill', 'visits_count', '{"required_visits": 5}'::jsonb, true),
  ('Cliente VIP', 'Hai completato 10 appuntamenti', 'crown.fill', 'visits_count', '{"required_visits": 10}'::jsonb, true),
  ('Cliente Attivo', '3 visite in 2 mesi', 'flame.fill', 'visits_timeframe', '{"required_visits": 3, "timeframe_days": 60}'::jsonb, true),
  ('Grande Spendaccione', 'Hai speso più di €200', 'eurosign.circle.fill', 'total_spent', '{"required_amount": 200}'::jsonb, true);
```

## Step 7: Configure Password Reset

### In Supabase Dashboard:
1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   pelolococlub://reset-password
   ```
3. Save changes

### Test Password Reset:
```sql
-- Check if email templates are configured
SELECT * FROM auth.config;

-- Test reset email (replace with real email)
SELECT auth.send_password_reset_email('test@example.com');
```

## Step 8: Verify Everything Works

### Checklist:
- [ ] Tables exist and have correct columns
- [ ] Functions exist and are executable
- [ ] Triggers are active on appointments table
- [ ] RLS policies are enabled and correct
- [ ] Sample rewards created
- [ ] Sample badge rules created
- [ ] Password reset URL configured
- [ ] Test user can earn points
- [ ] Test user can earn badges
- [ ] Test user can redeem rewards
- [ ] Admin can create rewards
- [ ] Admin can create badge rules
- [ ] Admin can send birthday notifications

## Troubleshooting

### Points Not Being Awarded
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_award_loyalty_points';

-- Check if function works manually
SELECT award_loyalty_points_on_completion();

-- Check user's current points
SELECT id, name, loyalty_points FROM users WHERE role = 'customer';

-- Check transaction log
SELECT * FROM loyalty_transactions ORDER BY created_at DESC LIMIT 10;
```

### Badges Not Being Awarded
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_check_badges_on_completion';

-- Check badge rules
SELECT * FROM badge_rules WHERE is_active = true;

-- Manually trigger badge check for a user
SELECT check_and_award_badges('USER_ID_HERE');

-- Check user's badges
SELECT id, name, badges FROM users WHERE id = 'USER_ID_HERE';
```

### RLS Policy Issues
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('loyalty_rewards', 'badge_rules', 'loyalty_transactions', 'custom_notifications');

-- View all policies
SELECT * FROM pg_policies 
WHERE tablename IN ('loyalty_rewards', 'badge_rules', 'loyalty_transactions', 'custom_notifications');

-- Test policy as specific user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'USER_ID_HERE';
SELECT * FROM loyalty_rewards;
RESET ROLE;
```

## Monitoring

### Check System Health
```sql
-- Count active rewards
SELECT COUNT(*) as active_rewards FROM loyalty_rewards WHERE is_active = true;

-- Count active badge rules
SELECT COUNT(*) as active_badges FROM badge_rules WHERE is_active = true;

-- Total points distributed
SELECT SUM(loyalty_points) as total_points FROM users WHERE role = 'customer';

-- Total transactions
SELECT COUNT(*) as total_transactions FROM loyalty_transactions;

-- Recent point awards
SELECT 
  u.name,
  lt.points_change,
  lt.description,
  lt.created_at
FROM loyalty_transactions lt
JOIN users u ON u.id = lt.user_id
WHERE lt.transaction_type = 'earned'
ORDER BY lt.created_at DESC
LIMIT 10;

-- Users with most points
SELECT 
  name,
  email,
  loyalty_points,
  jsonb_array_length(COALESCE(badges, '[]'::jsonb)) as badge_count
FROM users
WHERE role = 'customer'
ORDER BY loyalty_points DESC
LIMIT 10;
```

## Backup

### Export Configuration
```sql
-- Export rewards
COPY (SELECT * FROM loyalty_rewards) TO '/tmp/loyalty_rewards_backup.csv' CSV HEADER;

-- Export badge rules
COPY (SELECT * FROM badge_rules) TO '/tmp/badge_rules_backup.csv' CSV HEADER;
```

### Restore Configuration
```sql
-- Import rewards
COPY loyalty_rewards FROM '/tmp/loyalty_rewards_backup.csv' CSV HEADER;

-- Import badge rules
COPY badge_rules FROM '/tmp/badge_rules_backup.csv' CSV HEADER;
```

## Support

If you encounter issues:
1. Check Supabase logs in dashboard
2. Verify RLS policies are correct
3. Test functions manually
4. Check trigger execution
5. Review transaction logs
6. Contact support with error details

## Next Steps

After setup is complete:
1. Configure rewards in admin panel
2. Create badge rules in admin panel
3. Test with real customer accounts
4. Monitor point distribution
5. Adjust rewards based on usage
6. Create seasonal badges
7. Promote loyalty program to customers
