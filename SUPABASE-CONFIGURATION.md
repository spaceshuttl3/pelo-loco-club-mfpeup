
# Supabase Configuration Required

## Important: Complete These Steps in Supabase Dashboard

### 1. Configure Redirect URLs for Password Reset

**Location:** Supabase Dashboard → Authentication → URL Configuration

**Add these URLs to "Redirect URLs" section:**
```
pelolococlub://reset-password
https://natively.dev/reset-password
```

**Why:** This allows the password reset email to redirect to the mobile app instead of localhost.

---

### 2. Verify Database Function Exists

**Check if the function was created:**

Go to Supabase Dashboard → SQL Editor and run:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'check_user_duplicates';
```

**Expected result:** Should return one row with `check_user_duplicates`

**If function doesn't exist, create it manually:**
```sql
CREATE OR REPLACE FUNCTION check_user_duplicates(
  p_email TEXT,
  p_phone TEXT
)
RETURNS TABLE (
  email_exists BOOLEAN,
  phone_exists BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM public.users WHERE LOWER(email) = LOWER(p_email)) AS email_exists,
    EXISTS(SELECT 1 FROM public.users WHERE phone = p_phone) AS phone_exists;
END;
$$;
```

---

### 3. Verify RLS Policies on Users Table

**Check current policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

**Required policies:**
- ✅ Users can view own profile
- ✅ Users can update own profile
- ✅ Users can insert own profile during signup
- ✅ Admins can view all users
- ✅ Admins can update all users

**All policies should be present and active.**

---

### 4. Test the Configuration

#### Test Password Reset:
1. Go to your app
2. Click "Forgot Password"
3. Enter a valid email
4. Check your email inbox
5. Click the reset link
6. **Expected:** App should open (not browser)
7. **Expected:** Reset password screen should appear

#### Test Duplicate Check:
1. Try to register with an existing email
2. **Expected:** Error message "Questa email è già registrata"
3. Try to register with an existing phone
4. **Expected:** Error message "Questo numero di telefono è già registrato"

#### Test Birthdays:
1. Login as admin
2. Go to Birthdays section
3. **Expected:** See all future birthdays, not just next 30 days
4. **Expected:** Today's birthdays have "OGGI" badge
5. **Expected:** Birthdays within 7 days have "PRESTO" badge

---

### 5. Email Templates (Optional)

**Customize the password reset email:**

Go to: Supabase Dashboard → Authentication → Email Templates → Reset Password

**Recommended template:**
```html
<h2>Reimposta la tua password</h2>
<p>Hai richiesto di reimpostare la tua password per Pelo Loco Club.</p>
<p>Clicca sul pulsante qui sotto per reimpostare la tua password:</p>
<p><a href="{{ .ConfirmationURL }}">Reimposta Password</a></p>
<p>Se non hai richiesto questa modifica, ignora questa email.</p>
<p>Questo link scadrà tra 1 ora.</p>
```

---

### 6. Troubleshooting

#### Password reset still goes to localhost:
- Clear Supabase cache: Dashboard → Settings → API → Reset API Keys
- Verify redirect URLs are saved correctly
- Check email template uses `{{ .ConfirmationURL }}`

#### Duplicate check not working:
- Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'check_user_duplicates';`
- Check function permissions: Should have `SECURITY DEFINER`
- Test function manually: `SELECT * FROM check_user_duplicates('test@example.com', '1234567890');`

#### Birthdays not showing:
- Verify users have birthday field populated
- Check user role is 'customer'
- Verify RLS policies allow admin to read users table

---

## Summary

✅ **Step 1:** Add redirect URLs in Authentication settings
✅ **Step 2:** Verify database function exists
✅ **Step 3:** Verify RLS policies are correct
✅ **Step 4:** Test all three features
✅ **Step 5:** (Optional) Customize email templates

**All configuration should be done in the Supabase Dashboard, not in code.**
