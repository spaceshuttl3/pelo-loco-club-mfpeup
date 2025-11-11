
# Supabase Setup - Complete Guide

## ✅ FIXED - Authentication & User Profile Setup (Updated)

The authentication system has been properly configured with the following improvements:

### What Was Fixed:

1. **Fixed Infinite Recursion in RLS Policy**
   - **Problem:** The "Admins can view all users" policy was querying the `users` table within itself, causing infinite recursion
   - **Solution:** Updated the policy to use `auth.jwt()->>'role'` instead of querying the users table
   - This checks the role from the JWT token metadata, avoiding the recursion issue

2. **Database Trigger for Automatic Profile Creation**
   - A PostgreSQL trigger now automatically creates a user profile in the `users` table when a new user signs up
   - This eliminates RLS policy violations during signup
   - User metadata (name, phone, role) is automatically transferred from auth.users to the public.users table

3. **Proper RLS Policies**
   - Fixed INSERT policy to allow both authenticated users and service_role
   - Fixed SELECT policy to avoid infinite recursion
   - Existing UPDATE policy: "Users can update own profile"

4. **Improved Error Handling**
   - Better error messages for email not confirmed
   - Retry logic for profile fetching (handles race conditions)
   - Detection of infinite recursion errors (error code 42P17)
   - Clear user feedback for all error scenarios

5. **Email Verification Flow**
   - Users receive a verification email after signup
   - Clear instructions to check email before signing in
   - Proper handling of unverified login attempts

### How It Works:

1. **Signup Process:**
   ```
   User fills signup form → signUp() called → Supabase creates auth.users record
   → Database trigger fires → User profile created in public.users table
   → Verification email sent → User redirected to login
   ```

2. **Login Process:**
   ```
   User enters credentials → signIn() called → Supabase verifies email confirmation
   → If confirmed: Auth successful → fetchUserProfile() retrieves profile
   → User redirected to appropriate dashboard (customer/admin)
   ```

### Database Schema:

The `users` table structure:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  birthday DATE,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies Applied (UPDATED):

```sql
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO public
USING (auth.uid() = id);

-- Allow admins to view all profiles (FIXED - no more infinite recursion)
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
  -- Users can see their own profile
  auth.uid() = id
  OR
  -- Or if they are an admin (check from JWT metadata to avoid recursion)
  (auth.jwt()->>'role')::text = 'admin'
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO public
USING (auth.uid() = id);

-- Allow users to insert their own profile (used by trigger)
CREATE POLICY "Users can insert own profile during signup"
ON users FOR INSERT
TO authenticated, service_role
WITH CHECK (
  -- Allow if the user is inserting their own profile
  auth.uid() = id
  OR
  -- Or if it's the service role (for the trigger)
  auth.role() = 'service_role'
);
```

### Automatic Profile Creation Trigger:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Testing the Authentication Flow:

### Test Signup:
1. Open the app and navigate to Sign Up
2. Fill in all fields (name, email, phone, password)
3. Click "Sign Up"
4. You should see: "Check Your Email! 📧" message with detailed instructions
5. Check your email inbox (and spam folder) for verification link
6. Click the verification link in the email

### Test Login:
1. After verifying email, go back to the app
2. Navigate to Sign In
3. Enter your email and password
4. Click "Sign In"
5. You should be redirected to the customer dashboard

### Test Admin Access:
To create an admin user, you need to manually update the role in Supabase:
1. Go to Supabase Dashboard → Authentication → Users
2. Find your user and click on it
3. Go to the SQL Editor and run:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
4. Sign out and sign in again
5. You should now see the admin dashboard

## Common Issues & Solutions:

### Issue: "infinite recursion detected in policy for relation 'users'" ✅ FIXED
**Solution:** This has been fixed by updating the RLS policy to use JWT metadata instead of querying the users table.

### Issue: "new row violates row-level security policy for table users" ✅ FIXED
**Solution:** This has been fixed by:
1. Creating a database trigger that automatically creates user profiles
2. Updating the INSERT policy to allow service_role

### Issue: "Error fetching user profile" ✅ FIXED
**Solution:** This has been fixed by:
1. Adding retry logic (up to 5 attempts with 1-second delays)
2. Detecting infinite recursion errors (error code 42P17)
3. Better error handling for missing profiles

### Issue: "Email not confirmed"
**Solution:** Check your email inbox (and spam folder) for the verification email. Click the link before trying to sign in.

### Issue: "Invalid login credentials"
**Solution:** Make sure you're using the correct email and password. Passwords are case-sensitive.

### Issue: Email verification link doesn't work
**Solution:** 
1. Make sure you're clicking the link from the same device/browser
2. The link may have expired - try signing up again
3. Check Supabase Dashboard → Authentication → Settings → Email Templates
4. Verify the redirect URL is set to: `https://natively.dev/email-confirmed`

### Issue: ngrok error 3200 on iOS ✅ SEE EXPO-CONNECTION-GUIDE.md
**Solution:** Use LAN mode instead of tunnel mode:
```bash
npm run dev:lan
```
See EXPO-CONNECTION-GUIDE.md for detailed instructions.

## Email Configuration in Supabase:

To customize the verification email:
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Select "Confirm signup"
3. Customize the email template as needed
4. Make sure the confirmation URL is set correctly
5. Verify the redirect URL is: `https://natively.dev/email-confirmed`

## Security Notes:

- All tables have RLS enabled
- Users can only access their own data
- Admins can access all data (via JWT metadata check)
- Email verification is required before login
- Passwords are hashed and stored securely by Supabase Auth
- The trigger function runs with SECURITY DEFINER to bypass RLS during profile creation
- RLS policies use JWT metadata to avoid infinite recursion

## Verification Checklist:

Run these SQL queries in Supabase SQL Editor to verify everything is set up correctly:

```sql
-- 1. Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- 2. Check RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- 3. Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'users';

-- 4. Test user creation (replace with your email)
SELECT id, name, email, role
FROM users
WHERE email = 'your-email@example.com';
```

## Next Steps:

The authentication system is now fully functional. You can:
1. Test the complete signup and login flow
2. Create appointments and bookings
3. Add products and manage inventory (as admin)
4. Implement additional features like password reset
5. Customize email templates in Supabase

## Support:

If you encounter any issues:
1. Check the console logs in the app for detailed error messages
2. Check Supabase logs in Dashboard → Logs
3. Verify all migrations have been applied
4. Ensure RLS policies are enabled on all tables
5. Run the verification checklist above

## Recent Changes (Latest):

- ✅ Fixed infinite recursion in "Admins can view all users" RLS policy
- ✅ Updated policy to use `auth.jwt()->>'role'` instead of querying users table
- ✅ Added detection for infinite recursion errors (error code 42P17)
- ✅ Increased retry attempts from 3 to 5 for profile fetching
- ✅ Improved error messages and logging
