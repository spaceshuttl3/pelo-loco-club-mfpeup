
# Fidelity Points System - Complete Fix Instructions

## Issues Fixed

1. **Missing `earns_fidelity_reward` column in `services` table**
   - This was causing the error: `column services.earns_fidelity_reward does not exist`

2. **Fidelity points not being awarded on appointment completion**
   - Implemented proper logic to award 1 credit when admin marks appointment as completed
   - Only awards credits if:
     - Payment status is 'paid'
     - Service has `earns_fidelity_reward` set to true (or not set, defaults to true)

3. **Admin control over which services earn rewards**
   - Added toggle in Services management screen
   - Admins can enable/disable fidelity rewards per service

## Step 1: Apply Database Migration

**IMPORTANT:** You must run this SQL in your Supabase SQL Editor before the app will work correctly.

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `add-fidelity-reward-to-services.sql`
4. Click "Run" to execute the migration

The migration will:
- Add the `earns_fidelity_reward` column to the `services` table
- Set all existing services to earn rewards by default
- Create an index for better performance

## Step 2: Verify the Migration

After running the migration, verify it worked:

```sql
-- Check if the column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'services' AND column_name = 'earns_fidelity_reward';

-- Check existing services
SELECT id, name, earns_fidelity_reward FROM services;
```

You should see:
- The `earns_fidelity_reward` column exists with type `boolean` and default `true`
- All existing services have `earns_fidelity_reward` set to `true`

## Step 3: How the System Works

### For Admins:

1. **Configure Services:**
   - Go to "Gestione Servizi" (Services Management)
   - When creating or editing a service, you'll see a toggle: "Guadagna Crediti Fedeltà"
   - Enable this for services that should award 1 credit upon completion
   - Disable for services that shouldn't award credits (e.g., consultations, free services)

2. **Complete Appointments:**
   - Go to "Appuntamenti" (Appointments)
   - When you mark an appointment as "Completa" (Complete):
     - If payment status is "paid" AND service earns rewards → Customer gets 1 credit
     - If payment status is "pending" → No credit awarded (message shown)
     - If service doesn't earn rewards → No credit awarded (message shown)
   - You'll see a success message indicating whether credits were awarded

3. **View Customer Credits:**
   - In the appointment details, you can see "Crediti Cliente: X"
   - This shows the customer's current fidelity credit balance

### For Customers:

1. **Earn Credits:**
   - Complete a paid appointment for a service that earns rewards
   - Automatically receive 1 credit after admin confirms completion

2. **View Credits:**
   - Go to "Fedeltà" (Fidelity) section
   - See current credit balance at the top
   - View transaction history showing earned credits

3. **Redeem Rewards:**
   - Browse available rewards
   - Redeem when you have enough credits
   - Book appointment using the redeemed reward

## Step 4: Testing Checklist

### Test as Admin:

- [ ] Open "Gestione Servizi" - no errors
- [ ] Create a new service with fidelity rewards enabled
- [ ] Create a new service with fidelity rewards disabled
- [ ] Edit an existing service and toggle the fidelity reward setting
- [ ] Open "Appuntamenti" - no errors about missing column
- [ ] Complete an appointment with payment status "paid" for a service that earns rewards
  - [ ] Verify customer receives 1 credit
  - [ ] Verify transaction is recorded
  - [ ] Verify success message mentions credit awarded
- [ ] Complete an appointment with payment status "pending"
  - [ ] Verify no credit is awarded
  - [ ] Verify message mentions payment not completed
- [ ] Complete an appointment for a service that doesn't earn rewards
  - [ ] Verify no credit is awarded
  - [ ] Verify message mentions service doesn't earn credits

### Test as Customer:

- [ ] View fidelity section - see current credits
- [ ] Complete a paid appointment (have admin mark as complete)
- [ ] Verify credit appears in balance
- [ ] Verify transaction appears in history
- [ ] Redeem a reward
- [ ] Complete the redeemed appointment
- [ ] Verify reward is marked as used

## Step 5: Troubleshooting

### If you still see the error about missing column:

1. Verify the migration was applied:
   ```sql
   SELECT * FROM information_schema.columns 
   WHERE table_name = 'services' AND column_name = 'earns_fidelity_reward';
   ```

2. If the column doesn't exist, manually run:
   ```sql
   ALTER TABLE services ADD COLUMN earns_fidelity_reward BOOLEAN DEFAULT true;
   ```

3. Restart your Expo development server

### If credits aren't being awarded:

1. Check the console logs when completing an appointment
2. Look for messages like:
   - "Awarding fidelity credit..."
   - "Credits updated successfully"
   - "Service does not earn fidelity rewards"
   - "Payment not completed, no credits awarded"

3. Verify the appointment has:
   - `payment_status` = 'paid'
   - Service with `earns_fidelity_reward` = true

4. Check user's current credits:
   ```sql
   SELECT id, name, fidelity_credits FROM users WHERE id = 'USER_ID';
   ```

5. Check transaction history:
   ```sql
   SELECT * FROM fidelity_transactions 
   WHERE user_id = 'USER_ID' 
   ORDER BY created_at DESC;
   ```

## Step 6: Default Behavior

- **New services:** Earn fidelity rewards by default (toggle is ON)
- **Existing services:** After migration, all earn rewards by default
- **Admins can customize:** Toggle per service as needed

## Summary of Changes

### Database:
- Added `earns_fidelity_reward` column to `services` table
- Default value: `true`
- Indexed for performance

### Code Changes:

1. **app/(admin)/appointments.tsx:**
   - Added `fetchServices()` to load service configurations
   - Enhanced `updateAppointmentStatus()` to check if service earns rewards
   - Added detailed logging for debugging
   - Improved success messages to indicate credit status
   - Added fallback handling if column doesn't exist yet

2. **app/(admin)/services.tsx:**
   - Added "Guadagna Crediti Fedeltà" toggle in service form
   - Shows reward status in service list
   - Saves `earns_fidelity_reward` when creating/editing services

### Files Created:
- `add-fidelity-reward-to-services.sql` - Database migration
- `FIDELITY-POINTS-FIX-INSTRUCTIONS.md` - This file

## Support

If you encounter any issues:

1. Check the console logs for detailed error messages
2. Verify the database migration was applied correctly
3. Ensure RLS policies are in place (from previous migrations)
4. Test with a fresh appointment to isolate the issue

The system is now fully functional and ready to use!
