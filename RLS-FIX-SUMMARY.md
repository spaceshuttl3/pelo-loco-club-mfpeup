
# RLS Infinite Recursion Fix - Summary

## Problem
You were experiencing "infinite recursion detected in policy for relation users" errors across all sections (orders, appointments, coupons, etc.).

## Root Cause
The RLS policies were checking if a user is an admin by querying the `users` table:
```sql
EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
```

This created infinite recursion because:
1. When fetching orders/appointments/coupons, the query would JOIN with the users table
2. The users table policy would check if the user is admin by querying the users table again
3. This triggered the same policy recursively, causing an infinite loop

## Solution Implemented

### 1. Created a Non-Recursive Role Check Function
Created `public.get_user_role()` function that reads the user's role from the JWT token's `app_metadata` instead of querying the users table:

```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'customer'
  )::TEXT;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

### 2. Updated All RLS Policies
Replaced all policies that queried the users table with calls to `public.get_user_role()`:

**Before (with recursion):**
```sql
CREATE POLICY "Admins can view all orders" ON orders
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
```

**After (no recursion):**
```sql
CREATE POLICY "Admins can view all orders" ON orders
USING (public.get_user_role() = 'admin');
```

### 3. Updated Database Trigger
Modified the `handle_new_user()` trigger to store the user's role in the JWT's `app_metadata`:

```sql
UPDATE auth.users
SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', COALESCE(NEW.raw_user_meta_data->>'role', 'customer'))
WHERE id = NEW.id;
```

### 4. Updated Existing Users
Ran a migration to add the role to `app_metadata` for all existing users:

```sql
UPDATE auth.users au
SET raw_app_meta_data = 
  COALESCE(au.raw_app_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', COALESCE(pu.role, 'customer'))
FROM public.users pu
WHERE au.id = pu.id;
```

### 5. Enhanced AuthContext
Updated the `signIn` and `refreshUser` functions to refresh the session after login, ensuring the JWT includes the latest role information.

## Tables Fixed
All RLS policies have been updated for the following tables:
- ✅ `users`
- ✅ `appointments`
- ✅ `orders`
- ✅ `coupons`
- ✅ `cart`
- ✅ `products`
- ✅ `services`
- ✅ `barbers`
- ✅ `admin_coupon_config`

## What You Need to Do

### For Existing Users
**IMPORTANT:** All existing users (including admins) need to **log out and log back in** for the changes to take effect. This is because:
1. The JWT token needs to be refreshed to include the role in `app_metadata`
2. The new RLS policies read from the JWT, not from the database

### Testing Steps
1. **Log out** of the app completely
2. **Log back in** with your admin account
3. Test the following sections:
   - ✅ Orders (should see all orders with user details)
   - ✅ Appointments (should see all appointments)
   - ✅ Coupons (should see all coupons)
   - ✅ Products (should be able to manage)
   - ✅ Services (should be able to manage)
   - ✅ Barbers (should be able to manage)

4. **Log in with a customer account** and verify:
   - ✅ Can only see their own orders
   - ✅ Can only see their own appointments
   - ✅ Can only see their own coupons
   - ✅ Cannot access admin features

## Benefits of This Solution

1. **No More Recursion:** Policies no longer query the users table
2. **Better Performance:** Reading from JWT is faster than database queries
3. **Admin Can See User Details:** When fetching orders, admins can now see user information without triggering recursion
4. **Scalable:** This pattern works for any number of tables and relationships
5. **Secure:** The JWT is cryptographically signed and cannot be tampered with

## Technical Details

### How It Works
1. When a user signs up or logs in, their role is stored in `auth.users.raw_app_meta_data`
2. This metadata is included in the JWT token
3. The `public.get_user_role()` function reads from the JWT using `auth.jwt()`
4. RLS policies call this function instead of querying the database
5. No recursion occurs because we never query the users table in the policy

### Why This Is Better
- **JWT-based authorization** is a standard pattern in modern applications
- **Stateless:** The role is in the token, no database lookup needed
- **Fast:** No additional queries to check permissions
- **Prevents recursion:** JWT reading doesn't trigger RLS policies

## Verification

All policies have been verified to be free of recursion. You can check this by running:

```sql
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

All policies now use `public.get_user_role()` instead of querying the users table.

## Support

If you encounter any issues after logging out and back in, please check:
1. Make sure you completely logged out (not just closed the app)
2. Clear the app cache if needed
3. Verify your user has a role set in the database: `SELECT id, email, role FROM public.users;`
4. Check the logs for any authentication errors

The infinite recursion error should now be completely resolved! 🎉
