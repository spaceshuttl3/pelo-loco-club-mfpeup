
# Testing Guide: RLS Infinite Recursion Fix

## Quick Test Checklist

### Step 1: Verify Database Changes
Run this query in Supabase SQL Editor to verify the fix is applied:

```sql
-- Check that the get_user_role function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_user_role';

-- Verify no policies have recursion
SELECT 
  tablename, 
  policyname,
  CASE 
    WHEN qual LIKE '%FROM users%' THEN '❌ HAS RECURSION'
    ELSE '✅ OK'
  END as status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected result: All policies should show "✅ OK"

### Step 2: Verify User Metadata
Check that users have role in app_metadata:

```sql
-- Check a few users (replace with actual user IDs)
SELECT 
  id,
  email,
  raw_app_meta_data->>'role' as jwt_role,
  (SELECT role FROM public.users WHERE id = auth.users.id) as db_role
FROM auth.users
LIMIT 5;
```

Expected result: `jwt_role` should match `db_role` for all users

### Step 3: Test Admin Access

1. **Log out completely** from the app
2. **Log in with admin account**
3. Navigate to each section and verify no errors:

#### Orders Section
- [ ] Can view all orders
- [ ] Can see user details (name, phone, email) for each order
- [ ] No "infinite recursion" error
- [ ] Can update order status
- [ ] Can delete orders

#### Appointments Section
- [ ] Can view all appointments
- [ ] Can see appointments for all barbers
- [ ] Can update appointment status
- [ ] Can reschedule appointments
- [ ] No errors when loading

#### Coupons Section
- [ ] Can view all coupons
- [ ] Can see which user each coupon belongs to
- [ ] Can create new coupons
- [ ] Can send coupons to users
- [ ] No errors when loading

#### Products Section
- [ ] Can view all products
- [ ] Can add new products
- [ ] Can edit products
- [ ] Can delete products
- [ ] No errors when loading

#### Services Section
- [ ] Can view all services
- [ ] Can add new services
- [ ] Can edit services
- [ ] Can toggle active/inactive
- [ ] No errors when loading

### Step 4: Test Customer Access

1. **Log out** from admin account
2. **Log in with customer account**
3. Verify customer restrictions:

#### My Bookings
- [ ] Can only see own appointments
- [ ] Cannot see other users' appointments
- [ ] Can cancel own appointments (24h rule)
- [ ] Can reschedule own appointments (24h rule)

#### My Orders
- [ ] Can only see own orders
- [ ] Cannot see other users' orders
- [ ] Order history displays correctly

#### My Coupons
- [ ] Can only see own coupons
- [ ] Cannot see other users' coupons
- [ ] Can redeem coupons

#### Products
- [ ] Can view products
- [ ] Can add to cart
- [ ] Cannot manage products (no admin buttons)

### Step 5: Test New User Registration

1. **Register a new customer account**
2. Verify:
   - [ ] Registration succeeds
   - [ ] Email verification sent
   - [ ] After verification, can log in
   - [ ] New user can access customer features
   - [ ] No errors on first login

### Step 6: Performance Check

Compare performance before and after:

1. **Orders page load time:**
   - Before: Likely timed out or errored
   - After: Should load in < 2 seconds

2. **Appointments page load time:**
   - Before: Likely timed out or errored
   - After: Should load in < 2 seconds

3. **Coupons page load time:**
   - Before: Likely timed out or errored
   - After: Should load in < 2 seconds

## Common Issues and Solutions

### Issue: Still getting recursion error
**Solution:** 
1. Make sure you logged out completely
2. Clear app cache
3. Log back in
4. The JWT needs to be refreshed

### Issue: Admin can't see user details in orders
**Solution:**
1. Verify the user has role='admin' in public.users table
2. Check that app_metadata has role='admin' in auth.users
3. Log out and log back in to refresh JWT

### Issue: Customer can see all orders/appointments
**Solution:**
1. Verify the user has role='customer' in public.users table
2. Check RLS policies are enabled on the table
3. Log out and log back in

### Issue: New users can't access anything
**Solution:**
1. Check that the trigger `on_auth_user_created` exists
2. Verify the trigger is setting role in app_metadata
3. Check Supabase logs for trigger errors

## SQL Debugging Queries

### Check current user's role from JWT
```sql
SELECT public.get_user_role() as my_role;
```

### Check all policies for a table
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'orders';  -- Change table name as needed
```

### Check user's metadata
```sql
SELECT 
  email,
  raw_user_meta_data,
  raw_app_meta_data
FROM auth.users
WHERE email = 'your-email@example.com';
```

### Test if admin can see all orders
```sql
-- Run this as admin user
SELECT 
  o.id,
  o.total_price,
  u.name,
  u.email,
  u.phone
FROM orders o
LEFT JOIN users u ON u.id = o.user_id;
```

Expected: Should return all orders with user details, no recursion error

## Success Criteria

✅ **Fix is successful if:**
1. No "infinite recursion" errors anywhere in the app
2. Admin can see all data across all sections
3. Admin can see user details when viewing orders
4. Customers can only see their own data
5. All pages load in < 2 seconds
6. New user registration works correctly
7. All RLS policies show "OK" in verification query

## Rollback Plan (If Needed)

If something goes wrong, you can rollback by:

1. Contact support or restore from backup
2. The old policies are dropped, so you'd need to recreate them
3. However, the new solution is better and should work correctly

**Note:** It's highly recommended to test thoroughly rather than rollback, as the new solution is more performant and scalable.

## Next Steps After Testing

Once all tests pass:
1. ✅ Mark this issue as resolved
2. 📝 Document the solution for future reference
3. 🎉 Celebrate - no more infinite recursion!
4. 🚀 Continue building awesome features

---

**Last Updated:** After RLS infinite recursion fix migration
**Status:** Ready for testing
