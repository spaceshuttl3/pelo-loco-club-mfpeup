
# Testing Instructions for RLS Infinite Recursion Fix

## What Was Fixed
The infinite recursion error in RLS policies has been fixed by replacing the `get_user_role()` function with direct JWT metadata checks.

## How to Test

### Step 1: Log Out and Log Back In
**IMPORTANT:** All users (especially admins) need to log out and log back in for the JWT to be refreshed with the role metadata.

1. Open the app
2. If logged in, sign out
3. Sign back in with your credentials

### Step 2: Test Admin Functionality

#### Test Orders Section
1. Log in as admin
2. Navigate to Orders section
3. **Expected Result:** You should see:
   - Order details
   - Customer name (not "Unknown")
   - Customer phone number
   - Customer email
   - No "infinite recursion" errors

#### Test Appointments Section
1. Navigate to Appointments section
2. **Expected Result:** You should see:
   - All appointments
   - Customer names and details
   - Barber filter working correctly
   - No errors when viewing appointments

#### Test Coupons Section
1. Navigate to Coupons section
2. Try to view issued coupons
3. **Expected Result:** You should see:
   - All issued coupons
   - Customer names and emails
   - No errors when fetching coupons

#### Test Other Admin Sections
1. Navigate to Products, Services, Barbers sections
2. **Expected Result:** All sections should load without errors

### Step 3: Test Customer Functionality

1. Log out from admin account
2. Log in with a customer account
3. Navigate through:
   - My Bookings
   - Products
   - Coupons
   - Order History
4. **Expected Result:** 
   - Customers should only see their own data
   - No errors should occur
   - No access to other users' data

### Step 4: Test New User Registration

1. Log out
2. Create a new user account
3. Log in with the new account
4. **Expected Result:**
   - New user should be able to log in successfully
   - Role should be automatically set to "customer"
   - User should have access to customer features only

## What to Look For

### ✅ Success Indicators
- No "infinite recursion detected in policy" errors
- Admin can see user details in orders, appointments, and coupons
- Customer can only see their own data
- All sections load without errors
- User details show correctly (not "Unknown" or "N/D")

### ❌ Failure Indicators
- "Infinite recursion" errors still appear
- User details show as "Unknown" or "N/D"
- Admin cannot access certain sections
- Customer can see other users' data
- Login/registration fails

## Troubleshooting

### If you still see "Unknown" for user details:
1. Make sure you logged out and logged back in
2. Check the browser console for any errors
3. Try refreshing the page/app

### If you still see infinite recursion errors:
1. Contact support - there may be additional policies that need updating
2. Check the database logs for more details

### If login fails:
1. Make sure the database trigger `on_auth_user_created` is working
2. Check that the `handle_new_user()` function exists
3. Verify that the user profile was created in `public.users` table

## Database Verification (For Developers)

You can verify the fix by running these SQL queries:

```sql
-- Check that policies use JWT metadata directly
SELECT tablename, policyname, qual 
FROM pg_policies 
WHERE tablename IN ('users', 'orders', 'appointments', 'coupons')
  AND policyname LIKE '%Admin%';

-- Check that users have role in JWT metadata
SELECT id, email, raw_app_meta_data->>'role' as jwt_role
FROM auth.users
LIMIT 10;

-- Verify that public.users role matches JWT role
SELECT 
  au.email,
  pu.role as db_role,
  au.raw_app_meta_data->>'role' as jwt_role
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
LIMIT 10;
```

All three queries should show consistent role data.
