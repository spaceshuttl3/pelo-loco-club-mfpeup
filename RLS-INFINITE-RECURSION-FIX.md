
# RLS Infinite Recursion Fix - Summary

## Problem
The app was experiencing "infinite recursion detected in policy for relation users" errors across all sections (orders, appointments, coupons, etc.).

## Root Cause
The RLS policies were using a `get_user_role()` function that attempted to query the `users` table to determine if a user was an admin. This created an infinite recursion loop:

1. Admin tries to fetch orders with user details
2. Query joins `orders` with `users` table
3. `users` table RLS policy calls `get_user_role()`
4. `get_user_role()` tries to read from `users` table
5. This triggers the RLS policy again → **infinite recursion**

## Solution
Replaced the problematic `get_user_role()` function with direct JWT metadata checks in all RLS policies.

### Changes Made:

1. **Dropped the problematic function**: Removed `get_user_role()` function that was causing recursion

2. **Updated all RLS policies**: Changed from:
   ```sql
   USING (get_user_role() = 'admin')
   ```
   To:
   ```sql
   USING ((auth.jwt() -> 'app_metadata' ->> 'role')::TEXT = 'admin')
   ```

3. **Created triggers to maintain JWT metadata**: 
   - `on_user_created_set_role`: Sets role in JWT when user is created
   - `on_user_role_updated`: Updates JWT when user role changes

4. **Updated existing users**: Migrated all existing users to have their role in JWT metadata

### Tables Fixed:
- ✅ users
- ✅ orders
- ✅ appointments
- ✅ coupons
- ✅ cart
- ✅ products
- ✅ services
- ✅ barbers
- ✅ admin_coupon_config

## How It Works Now

1. **During Signup**: The `handle_new_user()` trigger automatically sets the user's role in JWT metadata
2. **During Login**: The session is refreshed to ensure JWT has the latest role
3. **RLS Policies**: Check JWT metadata directly without querying the users table
4. **No Recursion**: JWT metadata is read-only and doesn't trigger RLS policies

## Testing

After this fix:
- ✅ Admins can view user details in orders section
- ✅ Admins can view all appointments with user information
- ✅ Admins can view all coupons with user information
- ✅ No infinite recursion errors
- ✅ Customers can still only see their own data

## Important Notes

- Users need to **log out and log back in** for the JWT to be refreshed with the role metadata
- New users will automatically have the role in their JWT
- The role is now stored in both `public.users.role` (database) and `auth.users.raw_app_meta_data.role` (JWT)
