
# Supabase RLS Policy Fix Instructions

## Problem
The signup process is failing with "new role violates row-level security policy for table users" because the RLS policies don't allow authenticated users to insert their own profile during signup.

## Solution
Run the following SQL commands in your Supabase SQL Editor (https://supabase.com/dashboard/project/vmajmcavmldhtenahhtj/sql/new):

```sql
-- Step 1: Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Step 2: Create a policy that allows users to insert their own profile during signup
CREATE POLICY "Enable insert for authenticated users during signup" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Step 3: Create a policy that allows users to view their own profile
CREATE POLICY "Enable read access for users to own profile" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Step 4: Create a policy that allows users to update their own profile
CREATE POLICY "Enable update for users to own profile" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 5: Create a policy that allows admins to view all users
CREATE POLICY "Enable read access for admins to all users" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 6: Create a policy that allows admins to update all users
CREATE POLICY "Enable update for admins to all users" ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Alternative: Use Database Trigger (Recommended)

A better approach is to use a database trigger that automatically creates the user profile when a new auth user is created. This way, you don't need to worry about RLS policies during signup.

```sql
-- Step 1: Create a function that creates user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create a trigger that calls the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Email Confirmation Settings

Make sure email confirmation is properly configured:

1. Go to Authentication > Settings in your Supabase dashboard
2. Under "Email Auth", ensure "Confirm email" is enabled
3. Under "Email Templates", customize the confirmation email template if needed
4. Under "URL Configuration", add `https://natively.dev/email-confirmed` to the redirect URLs

## Testing

After applying the fixes:

1. Try to sign up with a new email address
2. Check your email for the confirmation link
3. Click the confirmation link
4. Try to sign in with your credentials
5. You should now be able to access the app

## Troubleshooting

If you still have issues:

1. Check the Supabase logs for any errors
2. Verify that the RLS policies are correctly applied by running:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```
3. Make sure the trigger is created by running:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
