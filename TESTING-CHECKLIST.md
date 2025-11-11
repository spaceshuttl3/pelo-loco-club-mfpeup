
# Authentication Testing Checklist

Use this checklist to verify that everything is working correctly.

---

## ✅ Pre-Testing Setup

- [ ] Supabase project is running
- [ ] Expo dev server is running (`npm run dev:lan` recommended for iOS)
- [ ] You have access to an email account for testing
- [ ] You're using a fresh email address (not previously registered)

---

## 📝 Test 1: Sign Up Flow

### Steps:
1. [ ] Open the app
2. [ ] Navigate to Sign Up screen
3. [ ] Fill in the form:
   - [ ] Name: "Test User"
   - [ ] Email: "test@example.com" (use a real email you can access)
   - [ ] Phone: "+1234567890"
   - [ ] Password: "password123"
   - [ ] Confirm Password: "password123"
4. [ ] Click "Sign Up" button

### Expected Results:
- [ ] Button shows "Creating Account..." while processing
- [ ] Alert appears with title: **"Check Your Email! 📧"**
- [ ] Alert message includes:
  - Your email address
  - Instructions to verify email
  - Reminder to check spam folder
- [ ] After clicking OK, you're redirected to Login screen
- [ ] No error messages appear
- [ ] Console shows: "Auth user created successfully"

### If It Fails:
- Check console for error messages
- Verify email format is correct
- Make sure password is at least 6 characters
- Try a different email address

---

## 📧 Test 2: Email Verification

### Steps:
1. [ ] Open your email inbox
2. [ ] Look for email from Supabase (check spam folder too)
3. [ ] Email subject should be about confirming your account
4. [ ] Click the verification link in the email

### Expected Results:
- [ ] Link opens in browser
- [ ] You see a success page or are redirected to https://natively.dev/email-confirmed
- [ ] Email is now verified in Supabase

### If It Fails:
- Wait a few minutes for email to arrive
- Check spam/junk folder
- Verify email settings in Supabase Dashboard → Authentication → Email Templates
- Try signing up again with a different email

---

## 🔐 Test 3: Sign In Flow (Before Email Verification)

### Steps:
1. [ ] Go back to the app
2. [ ] On Login screen, enter:
   - [ ] Email: (the one you just signed up with)
   - [ ] Password: (the password you used)
3. [ ] Click "Sign In" button

### Expected Results:
- [ ] Alert appears with title: **"Email Not Verified"**
- [ ] Alert message explains you need to verify email first
- [ ] You remain on the login screen
- [ ] Console shows: "Sign in error: Email not confirmed"

### If It Fails:
- This is actually good! It means email verification is not required
- Check Supabase Dashboard → Authentication → Settings
- Verify "Enable email confirmations" is turned ON

---

## ✅ Test 4: Sign In Flow (After Email Verification)

### Steps:
1. [ ] Make sure you clicked the verification link in your email
2. [ ] On Login screen, enter:
   - [ ] Email: (your verified email)
   - [ ] Password: (your password)
3. [ ] Click "Sign In" button

### Expected Results:
- [ ] Button shows "Signing In..." while processing
- [ ] Console shows: "Sign in successful"
- [ ] Console shows: "Fetching user profile for: [your-user-id]"
- [ ] Console shows: "User profile fetched successfully"
- [ ] You're automatically redirected to **Customer Dashboard**
- [ ] You see the customer interface with tabs at the bottom
- [ ] No error messages appear

### If It Fails:
- Check console for specific error messages
- If you see "Error fetching user profile", wait 5 seconds and try again
- If you see "infinite recursion", the RLS policy fix didn't apply
- Verify the database trigger exists (see SUPABASE-FIX-INSTRUCTIONS.md)

---

## 👤 Test 5: User Profile Display

### Steps:
1. [ ] After signing in, navigate to Profile tab
2. [ ] Check that your information is displayed

### Expected Results:
- [ ] Your name is displayed correctly
- [ ] Your email is displayed correctly
- [ ] Your phone is displayed correctly
- [ ] Role shows "customer"
- [ ] No loading spinner stuck on screen

### If It Fails:
- Check Supabase Dashboard → Table Editor → users
- Verify your user record exists
- Check that all fields are populated

---

## 🔄 Test 6: Sign Out and Sign In Again

### Steps:
1. [ ] Click Sign Out button
2. [ ] Confirm you're redirected to Login screen
3. [ ] Sign in again with same credentials

### Expected Results:
- [ ] Sign out works immediately
- [ ] Sign in works without needing to verify email again
- [ ] You're redirected to Customer Dashboard
- [ ] All your data is still there

---

## 👨‍💼 Test 7: Admin Access (Optional)

### Steps:
1. [ ] Go to Supabase Dashboard → SQL Editor
2. [ ] Run this query (replace with your email):
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
3. [ ] In the app, sign out
4. [ ] Sign in again

### Expected Results:
- [ ] After signing in, you see **Admin Dashboard** instead of Customer Dashboard
- [ ] You see admin-specific features (Manage Appointments, Products, etc.)
- [ ] Console shows: "User profile fetched successfully" with role: "admin"

---

## 🐛 Common Issues & Quick Fixes

### Issue: "Email not confirmed" even after clicking link
**Fix:** 
- Wait 1-2 minutes after clicking link
- Try signing in again
- Check Supabase Dashboard → Authentication → Users to verify email_confirmed_at is set

### Issue: "Error fetching user profile"
**Fix:**
- Wait 5 seconds and try signing in again
- Check console for specific error code
- If error code is 42P17 (infinite recursion), the migration didn't apply
- Run the verification SQL in SUPABASE-FIX-INSTRUCTIONS.md

### Issue: Stuck on loading screen
**Fix:**
- Check console for errors
- Force close app and reopen
- Clear app data and try again

### Issue: Can't receive verification email
**Fix:**
- Check spam folder
- Wait 5 minutes
- Try signing up with a different email provider (Gmail, Outlook, etc.)
- Check Supabase Dashboard → Logs for email sending errors

---

## 📊 Success Criteria

Your authentication system is working correctly if:

- ✅ Signup creates user without errors
- ✅ Verification email is received and link works
- ✅ Login fails before email verification
- ✅ Login succeeds after email verification
- ✅ User profile is fetched and displayed correctly
- ✅ Sign out and sign in again works
- ✅ No infinite recursion errors
- ✅ No RLS policy violation errors
- ✅ Console logs show successful operations

---

## 🎯 Next Steps After Testing

Once all tests pass:

1. **Test on a real device** (not just simulator)
2. **Test with multiple users** to ensure no conflicts
3. **Test admin features** if you need them
4. **Customize email templates** in Supabase
5. **Add password reset functionality** (optional)
6. **Implement additional features** (appointments, products, etc.)

---

## 📞 Need Help?

If any test fails:

1. **Check console logs** - They show detailed error messages
2. **Check Supabase logs** - Dashboard → Logs
3. **Run verification SQL** - See SUPABASE-FIX-INSTRUCTIONS.md
4. **Review error codes**:
   - `42P17` = Infinite recursion (RLS policy issue)
   - `PGRST116` = Record not found (profile not created)
   - `23505` = Duplicate key (email already registered)

5. **Reference documentation**:
   - AUTHENTICATION-QUICK-FIX.md - Quick overview
   - SUPABASE-FIX-INSTRUCTIONS.md - Detailed technical docs
   - EXPO-CONNECTION-GUIDE.md - iOS connection issues

---

Good luck with testing! 🚀
