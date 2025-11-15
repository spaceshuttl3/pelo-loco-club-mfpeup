
# Supabase Configuration for Loyalty System

## Step-by-Step Setup Guide

### 1. Run Database Migration

The database migration has already been applied via the `apply_migration` tool. This created:
- New columns in `users` table (`loyalty_points`, `badges`)
- New tables (`loyalty_rewards`, `badge_rules`, `loyalty_transactions`, `custom_notifications`)
- Automatic triggers for point awarding and badge checking
- RLS policies for all tables

### 2. Configure Auth Redirect URLs

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add the following redirect URLs:
   - `pelolococlub://reset-password` (for password reset)
   - `https://natively.dev/email-confirmed` (for email confirmation)

### 3. Verify RLS Policies

Check that Row Level Security is enabled and policies are active:

```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('loyalty_rewards', 'badge_rules', 'loyalty_transactions', 'custom_notifications');

-- View policies
SELECT * FROM pg_policies 
WHERE tablename IN ('loyalty_rewards', 'badge_rules', 'loyalty_transactions', 'custom_notifications');
```

### 4. Create Initial Rewards (Optional)

You can pre-populate some rewards for testing:

```sql
INSERT INTO loyalty_rewards (points_required, reward_type, reward_value, reward_description, is_active)
VALUES
  (5, 'discount_percentage', 10, '10% di sconto sul prossimo servizio', true),
  (10, 'free_service', 1, 'Taglio gratuito', true),
  (15, 'discount_euros', 15, '€15 di sconto', true),
  (20, 'custom', 1, 'Servizio premium gratuito', true);
```

### 5. Create Initial Badge Rules (Optional)

Pre-populate some badge rules:

```sql
INSERT INTO badge_rules (badge_name, badge_description, badge_icon, rule_type, rule_config, is_active)
VALUES
  ('Primo Taglio', 'Hai completato il tuo primo appuntamento!', 'star.fill', 'visits_count', '{"required_visits": 1}', true),
  ('Cliente Fedele', 'Hai completato 5 appuntamenti', 'trophy.fill', 'visits_count', '{"required_visits": 5}', true),
  ('VIP', 'Hai completato 10 appuntamenti', 'crown.fill', 'visits_count', '{"required_visits": 10}', true),
  ('Cliente Attivo', '3 visite in 2 mesi', 'flame.fill', 'visits_timeframe', '{"required_visits": 3, "timeframe_days": 60}', true),
  ('Grande Spender', 'Hai speso più di €200', 'dollarsign.circle.fill', 'total_spent', '{"required_amount": 200}', true);
```

### 6. Test Automatic Point Awarding

To test the automatic point system:

1. Create a test customer account
2. Create an appointment for that customer
3. Mark the appointment as completed with payment status 'paid'
4. Check that:
   - User's `loyalty_points` increased by 1
   - A record was created in `loyalty_transactions`
   - Badges were checked and awarded if applicable

```sql
-- Check user points
SELECT id, name, email, loyalty_points, badges 
FROM users 
WHERE role = 'customer';

-- Check transactions
SELECT * FROM loyalty_transactions 
ORDER BY created_at DESC 
LIMIT 10;
```

### 7. Verify Triggers

Ensure triggers are active:

```sql
-- List triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'appointments';
```

You should see:
- `trigger_award_loyalty_points`
- `trigger_check_badges_on_appointment`

### 8. Test Badge Awarding

To manually test badge awarding:

```sql
-- Call the badge check function for a specific user
SELECT check_and_award_badges('USER_ID_HERE');

-- Check if badges were awarded
SELECT id, name, badges 
FROM users 
WHERE id = 'USER_ID_HERE';
```

### 9. Configure Email Templates (Optional)

Customize email templates for:
- Password reset
- Email confirmation
- Custom notifications

Go to **Authentication** → **Email Templates** in Supabase Dashboard.

### 10. Set Up Storage (If Needed)

If you plan to store badge images or reward images:

1. Go to **Storage** in Supabase Dashboard
2. Create a bucket named `rewards` or `badges`
3. Set appropriate RLS policies for public read access

## Monitoring & Maintenance

### Regular Checks

1. **Monitor Point Transactions**:
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as transactions,
  SUM(points_change) as total_points
FROM loyalty_transactions
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

2. **Check Badge Distribution**:
```sql
SELECT 
  badge_name,
  COUNT(*) as users_with_badge
FROM users,
LATERAL jsonb_array_elements(badges) AS badge(data)
GROUP BY badge_name
ORDER BY users_with_badge DESC;
```

3. **Monitor Reward Redemptions**:
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as redemptions,
  SUM(ABS(points_change)) as points_redeemed
FROM loyalty_transactions
WHERE transaction_type = 'redeemed'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Performance Optimization

If you have many users, consider adding indexes:

```sql
-- Already created in migration, but verify:
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_loyalty_points ON users(loyalty_points DESC);
```

### Backup Strategy

1. **Regular Backups**: Supabase automatically backs up your database
2. **Export Important Data**: Periodically export loyalty data
```sql
-- Export user points and badges
COPY (
  SELECT id, name, email, loyalty_points, badges 
  FROM users 
  WHERE role = 'customer'
) TO '/tmp/loyalty_backup.csv' CSV HEADER;
```

## Troubleshooting

### Issue: Points Not Awarded

**Check**:
1. Appointment status is 'completed'
2. Payment status is 'paid'
3. Trigger is active
4. User ID is valid

**Debug**:
```sql
-- Check recent appointments
SELECT * FROM appointments 
WHERE status = 'completed' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if trigger fired
SELECT * FROM loyalty_transactions 
ORDER BY created_at DESC 
LIMIT 10;
```

### Issue: Badges Not Appearing

**Check**:
1. Badge rules are active (`is_active = true`)
2. User meets badge criteria
3. Trigger is active

**Debug**:
```sql
-- Manually run badge check
SELECT check_and_award_badges('USER_ID');

-- Check badge rules
SELECT * FROM badge_rules WHERE is_active = true;
```

### Issue: RLS Blocking Access

**Check**:
1. User is authenticated
2. User role is correct
3. Policies are properly configured

**Debug**:
```sql
-- Check user role
SELECT id, email, role FROM users WHERE id = auth.uid();

-- Test policy
SELECT * FROM loyalty_rewards; -- Should work for all users
SELECT * FROM loyalty_transactions WHERE user_id = auth.uid(); -- Should work for own data
```

## Security Considerations

### RLS Policies

All tables have RLS enabled with appropriate policies:

1. **loyalty_rewards**: 
   - Admins: Full access
   - Customers: Read active rewards only

2. **badge_rules**:
   - Admins: Full access
   - Customers: Read active rules only

3. **loyalty_transactions**:
   - Admins: Read all, Insert only
   - Customers: Read own transactions only

4. **custom_notifications**:
   - Admins: Full access
   - Customers: Read own notifications only

### Function Security

Database functions use `SECURITY DEFINER` to ensure they run with elevated privileges:
- `award_loyalty_points_on_appointment()`
- `check_and_award_badges()`

This allows automatic point awarding and badge checking without requiring admin permissions.

## API Usage Examples

### Customer: View Rewards

```typescript
const { data: rewards, error } = await supabase
  .from('loyalty_rewards')
  .select('*')
  .eq('is_active', true)
  .order('points_required', { ascending: true });
```

### Customer: Redeem Reward

```typescript
// Deduct points
const { error: updateError } = await supabase
  .from('users')
  .update({ loyalty_points: currentPoints - rewardPoints })
  .eq('id', userId);

// Record transaction
const { error: transactionError } = await supabase
  .from('loyalty_transactions')
  .insert({
    user_id: userId,
    points_change: -rewardPoints,
    transaction_type: 'redeemed',
    reference_type: 'reward',
    reference_id: rewardId,
    description: `Redeemed: ${rewardDescription}`,
  });
```

### Admin: Create Reward

```typescript
const { error } = await supabase
  .from('loyalty_rewards')
  .insert({
    points_required: 10,
    reward_type: 'discount_percentage',
    reward_value: 15,
    reward_description: '15% off next service',
    is_active: true,
  });
```

### Admin: Create Badge Rule

```typescript
const { error } = await supabase
  .from('badge_rules')
  .insert({
    badge_name: 'Loyal Customer',
    badge_description: 'Completed 5 appointments',
    badge_icon: 'star.fill',
    rule_type: 'visits_count',
    rule_config: { required_visits: 5 },
    is_active: true,
  });
```

## Support

For issues or questions:
1. Check Supabase logs in Dashboard
2. Review RLS policies
3. Test triggers manually
4. Check function definitions

## Conclusion

Your loyalty system is now fully configured and ready to use! The system will automatically:
- Award points when appointments are completed
- Check and award badges based on rules
- Track all transactions
- Enforce security via RLS policies

Customers can now earn points, unlock badges, and redeem rewards seamlessly.
