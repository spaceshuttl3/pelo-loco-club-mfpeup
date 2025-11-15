
# Fixes Summary - Password Reset, Duplicate Check, and Birthdays

## Issues Fixed

### 1. Password Reset Link Goes to Localhost ✅

**Problem:** 
The reset password link was redirecting to `https://natively.dev/reset-password` which doesn't work in the mobile app.

**Solution:**
- Changed redirect URL to use deep link: `pelolococlub://reset-password`
- Added deep link listener in `app/_layout.tsx` to handle password reset links
- Automatically sets session when reset link is clicked
- User is redirected to reset password screen with valid session

**Files Modified:**
- `app/auth/forgot-password.tsx` - Updated `redirectTo` parameter
- `app/_layout.tsx` - Added deep link handling
- `PASSWORD-RESET-SETUP.md` - Created setup guide

**Action Required:**
Go to Supabase Dashboard → Authentication → URL Configuration and add:
- `pelolococlub://reset-password`

---

### 2. Duplicate Email/Phone Check Not Working ✅

**Problem:**
The duplicate check was querying the `users` table directly, but RLS policies prevent unauthenticated users from reading the table. This caused the check to always return no results, even when duplicates existed.

**Solution:**
- Created a database function `check_user_duplicates()` with `SECURITY DEFINER` that bypasses RLS
- Updated `app/auth/signup.tsx` to use the RPC function instead of direct query
- Function checks both email and phone for duplicates
- Returns clear error messages to users

**Files Modified:**
- `app/auth/signup.tsx` - Updated `checkDuplicates()` function to use RPC
- Database migration - Created `check_user_duplicates()` function

**Database Function:**
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
```

---

### 3. Future Birthdays Not Showing ✅

**Problem:**
The birthdays section was only showing birthdays within the next 30 days, not all future birthdays.

**Solution:**
- Updated the filter to show ALL future birthdays (days_until >= 0)
- Improved the display to highlight:
  - Today's birthdays with "OGGI" badge
  - Birthdays within 7 days with "PRESTO" badge
  - All other future birthdays
- Better visual indicators with color-coded badges
- Translated all text to Italian

**Files Modified:**
- `app/(admin)/birthdays.tsx` - Updated filtering and display logic

**Changes:**
- Changed from `birthdays.filter(b => b.days_until <= 30)` to `birthdays.filter(b => b.days_until >= 0)`
- Added visual badges for today and upcoming birthdays
- Improved date display formatting
- Better sorting by days until birthday

---

## Testing Checklist

### Password Reset:
- [ ] Request password reset email
- [ ] Click link in email
- [ ] Verify app opens (not browser)
- [ ] Verify reset password screen appears
- [ ] Enter new password
- [ ] Verify password is updated
- [ ] Login with new password

### Duplicate Check:
- [ ] Try to register with existing email
- [ ] Verify error message appears
- [ ] Try to register with existing phone
- [ ] Verify error message appears
- [ ] Register with new email and phone
- [ ] Verify registration succeeds

### Birthdays:
- [ ] Login as admin
- [ ] Navigate to Birthdays section
- [ ] Verify all future birthdays are shown
- [ ] Verify today's birthdays have "OGGI" badge
- [ ] Verify upcoming birthdays (within 7 days) have "PRESTO" badge
- [ ] Verify birthdays are sorted by days until birthday
- [ ] Send a birthday coupon
- [ ] Verify coupon is created

---

## Notes

- All text in the app is now in Italian
- Deep link scheme is `pelolococlub://`
- Database function uses `SECURITY DEFINER` to bypass RLS safely
- Birthday calculation accounts for year rollover (birthdays next year)
- All changes are backward compatible
